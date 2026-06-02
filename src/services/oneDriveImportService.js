/**
 * Real OneDrive import via Microsoft Graph API with OAuth Bearer token.
 * Requires Microsoft login via microsoftAuthService.js (PKCE flow).
 */

import { normalizeSongTitle, removeFileArtifacts, generateSongSlug } from '../utils/songNormalization';
import { inferTagsFromTitle } from '../utils/songTags';

const GRAPH = 'https://graph.microsoft.com/v1.0';

export const SHARED_FOLDER_URL = 'https://1drv.ms/f/s!AqRVWwFcDH4Usy0l8FJ_AwU_B4Yu?e=yi74R2';

const SUPPORTED_EXT = new Set(['pdf', 'docx', 'doc', 'txt', 'png', 'jpg', 'jpeg']);

const FORMAT_KEYWORDS = {
  acordes:   'chords',
  chords:    'chords',
  acorde:    'chords',
  tabs:      'chords',
  cifra:     'chords',
  partitura: 'sheet',
  partituras:'sheet',
  sheet:     'sheet',
  letra:     'lyrics',
  letras:    'lyrics',
  lyrics:    'lyrics',
};

const KEY_PATTERN = /\s[-–]\s([A-Ga-g][#b]?m?)\s*$/;

const GENRE_BY_PATH = {
  'partituras': 'Himno',
  'jovenes':    'Contemporáneo',
  'jóvenes':    'Contemporáneo',
  'especial':   'Especial',
  'baladas':    'Balada',
};

// ─── Encoding ──────────────────────────────────────────────────────────────

function encodeSharingUrl(url) {
  const base64 = btoa(unescape(encodeURIComponent(url)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return 'u!' + base64;
}

// ─── HTTP ──────────────────────────────────────────────────────────────────

async function graphFetch(url, token) {
  const headers = { Accept: 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      const body = await res.json();
      msg = body?.error?.message || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

async function fetchAllPages(url, token) {
  const items = [];
  let next = url;
  while (next) {
    const page = await graphFetch(next, token);
    items.push(...(page.value || []));
    next = page['@odata.nextLink'] || null;
  }
  return items;
}

// ─── Folder scanning ────────────────────────────────────────────────────────

async function getRootItem(shareUrl, authToken) {
  const sharingToken = encodeSharingUrl(shareUrl);
  return graphFetch(`${GRAPH}/shares/${sharingToken}/driveItem`, authToken);
}

async function getChildren(driveId, itemId, authToken) {
  const url = `${GRAPH}/drives/${driveId}/items/${itemId}/children`
    + `?$select=id,name,size,file,folder,lastModifiedDateTime,parentReference`;
  return fetchAllPages(url, authToken);
}

async function scanFolder(driveId, itemId, path, authToken, onProgress, depth = 0) {
  if (depth > 4) return [];

  const items = await getChildren(driveId, itemId, authToken);
  const files = [];

  for (const item of items) {
    if (item.folder) {
      onProgress?.({ phase: 'scanning', detail: `📁 ${item.name}` });
      const subFiles = await scanFolder(
        driveId,
        item.id,
        `${path}${item.name}/`,
        authToken,
        onProgress,
        depth + 1
      );
      files.push(...subFiles);
    } else if (item.file) {
      const ext = item.name.split('.').pop().toLowerCase();
      if (SUPPORTED_EXT.has(ext)) {
        onProgress?.({ phase: 'scanning', detail: `📄 ${item.name}` });
        files.push({
          id:           item.id,
          name:         item.name,
          path,
          extension:    ext,
          size:         item.size,
          lastModified: item.lastModifiedDateTime,
          driveId,
        });
      }
    }
  }

  return files;
}

// ─── File → Song parser ─────────────────────────────────────────────────────

function detectKey(filename) {
  const match = filename.match(KEY_PATTERN);
  if (!match) return null;
  const k = match[1];
  // Normalize: 'g' → 'G', 'gm' → 'Gm', 'gb' → 'Gb'
  return k.charAt(0).toUpperCase() + k.slice(1);
}

function detectFormat(filename) {
  const lower = filename.toLowerCase();
  for (const [kw, fmt] of Object.entries(FORMAT_KEYWORDS)) {
    if (lower.includes(kw)) return fmt;
  }
  return 'lyrics'; // default
}

function detectGenre(path) {
  const parts = path.toLowerCase().split('/').filter(Boolean);
  for (const part of parts) {
    if (GENRE_BY_PATH[part]) return GENRE_BY_PATH[part];
  }
  return 'Contemporáneo';
}

export function parseFileToSong(file) {
  const raw         = removeFileArtifacts(file.name);
  const detectedKey = detectKey(raw);
  const format      = detectFormat(file.name);
  const title       = normalizeSongTitle(raw);
  const slug        = generateSongSlug(title);
  const tags        = inferTagsFromTitle(title);
  const genre       = detectGenre(file.path);

  return {
    slug,
    title,
    author:   '',
    key:      detectedKey || '',
    tempo:    0,
    genre,
    language: 'Español',
    timesUsed: 0,
    lastUsed: null,
    tags,
    _sourceFile: {
      name:     file.name,
      path:     file.path,
      ext:      file.extension,
      size:     file.size,
      format,
      driveId:  file.driveId,
      fileId:   file.id,
    },
  };
}

// ─── Dedup & group ──────────────────────────────────────────────────────────

function groupBySlug(parsedSongs) {
  const map = new Map();
  for (const song of parsedSongs) {
    if (!map.has(song.slug)) {
      map.set(song.slug, { ...song, formats: [song._sourceFile] });
    } else {
      map.get(song.slug).formats.push(song._sourceFile);
    }
  }
  return Array.from(map.values());
}

function markDuplicates(grouped, existingSongs) {
  const existingSlugs = new Set(existingSongs.map((s) => generateSongSlug(s.title)));
  return grouped.map((s) => ({
    ...s,
    exists: existingSlugs.has(s.slug),
  }));
}

// ─── Main import function ───────────────────────────────────────────────────

/**
 * @param {string}   shareUrl      - OneDrive sharing URL
 * @param {Array}    existingSongs - Current songs in catalog
 * @param {Function} onProgress    - Callback({ phase, detail, count })
 * @param {string}   authToken     - Microsoft OAuth Bearer token
 * @returns {{ songs: Array, stats: Object }}
 */
export async function scanOneDriveFolder(shareUrl, existingSongs = [], onProgress, authToken) {
  onProgress?.({ phase: 'connecting', detail: 'Conectando con OneDrive...', count: 0 });

  // 1. Get root item → driveId + itemId
  const root = await getRootItem(shareUrl, authToken);
  const driveId = root.parentReference?.driveId || root.remoteItem?.parentReference?.driveId;
  const itemId  = root.id;

  if (!driveId) throw new Error('No se pudo obtener el identificador de la unidad de OneDrive.');

  onProgress?.({ phase: 'scanning', detail: `Escaneando carpeta raíz...`, count: 0 });

  // 2. Recursively scan all files
  const allFiles = await scanFolder(driveId, itemId, '/', authToken, onProgress);

  onProgress?.({ phase: 'parsing', detail: `${allFiles.length} archivos encontrados`, count: allFiles.length });

  // 3. Parse each file into a song entry
  const parsed = allFiles.map(parseFileToSong);

  // 4. Group files with the same title (lyrics + chords = one song)
  const grouped = groupBySlug(parsed);

  onProgress?.({ phase: 'deduplicating', detail: `${grouped.length} canciones únicas`, count: grouped.length });

  // 5. Mark which ones already exist in catalog
  const marked = markDuplicates(grouped, existingSongs);

  const newSongs      = marked.filter((s) => !s.exists);
  const existingCount = marked.filter((s) =>  s.exists).length;

  onProgress?.({ phase: 'done', detail: 'Escaneo completado', count: grouped.length });

  return {
    songs: marked,
    stats: {
      totalFiles:    allFiles.length,
      totalSongs:    grouped.length,
      newSongs:      newSongs.length,
      alreadyExist:  existingCount,
    },
  };
}

/**
 * Convert a scanned song into the AppContext song format and add it.
 */
export function buildSongPayload(scanned) {
  return {
    title:    scanned.title,
    author:   scanned.author || '',
    key:      scanned.key    || '',
    tempo:    scanned.tempo  || 0,
    genre:    scanned.genre  || 'Contemporáneo',
    language: scanned.language || 'Español',
    tags:     scanned.tags   || [],
  };
}
