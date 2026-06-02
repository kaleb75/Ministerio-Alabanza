import { parseFileList, groupByTitle } from './oneDriveParser.js';
import { detectAndMerge, groupDuplicates } from '../utils/duplicateDetection.js';
import mockSongs from '../data/mockSongs.json';

function removeAccents(str) {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ñ/g, 'n');
}

function titleToSlug(title) {
  return removeAccents(title)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function upgradeLegacySong(oldSong) {
  return {
    id: 'legacy-' + oldSong.id,
    title: oldSong.title,
    normalizedTitle: oldSong.title,
    slug: titleToSlug(oldSong.title),
    author: oldSong.author || null,
    key: oldSong.key || null,
    tempo: oldSong.tempo || null,
    genre: oldSong.genre || null,
    language: oldSong.language || null,
    tags: oldSong.tags || [],
    availableFormats: { lyrics: true, chords: false, sheetMusic: false },
    categories: ['lyrics'],
    sourceFiles: [],
    usageStats: { totalUses: oldSong.timesUsed || 0, lastUsed: oldSong.lastUsed || null },
    isLegacy: true,
    createdAt: oldSong.lastUsed || null,
    updatedAt: oldSong.lastUsed || null,
  };
}

export function mergeSongSources(legacyEntry, oneDriveEntry) {
  const mergedSourceFiles = [...(legacyEntry.sourceFiles || [])];
  const seenNames = new Set(mergedSourceFiles.map((f) => f.fileName));
  (oneDriveEntry.sourceFiles || []).forEach((sf) => {
    if (!seenNames.has(sf.fileName)) {
      mergedSourceFiles.push(sf);
      seenNames.add(sf.fileName);
    }
  });

  const legacyFormats = legacyEntry.availableFormats || {};
  const odFormats = oneDriveEntry.availableFormats || {};
  const mergedFormats = {
    lyrics: legacyFormats.lyrics || odFormats.lyrics || false,
    chords: legacyFormats.chords || odFormats.chords || false,
    sheetMusic: legacyFormats.sheetMusic || odFormats.sheetMusic || false,
  };

  const mergedTags = Array.from(new Set([...(legacyEntry.tags || []), ...(oneDriveEntry.tags || [])]));
  const mergedCategories = Array.from(new Set([...(legacyEntry.categories || []), ...(oneDriveEntry.categories || [])]));

  return {
    ...legacyEntry,
    sourceFiles: mergedSourceFiles,
    availableFormats: mergedFormats,
    tags: mergedTags,
    categories: mergedCategories,
    updatedAt: oneDriveEntry.updatedAt || legacyEntry.updatedAt,
  };
}

export function buildSongCatalog(oneDriveFiles) {
  const legacyCatalog = mockSongs.map(upgradeLegacySong);
  const oneDriveEntries = parseFileList(oneDriveFiles || []);
  const byTitle = groupByTitle(oneDriveEntries);

  const legacyBySlug = new Map(legacyCatalog.map((s) => [s.slug, s]));
  const newEntries = [];

  byTitle.forEach((group, slug) => {
    const merged = group.reduce((acc, entry) => {
      if (!acc) return entry;
      const mergedSourceFiles = [...(acc.sourceFiles || []), ...(entry.sourceFiles || [])];
      return {
        ...acc,
        sourceFiles: mergedSourceFiles,
        availableFormats: {
          lyrics: (acc.availableFormats?.lyrics || false) || (entry.availableFormats?.lyrics || false),
          chords: (acc.availableFormats?.chords || false) || (entry.availableFormats?.chords || false),
          sheetMusic: (acc.availableFormats?.sheetMusic || false) || (entry.availableFormats?.sheetMusic || false),
        },
        categories: Array.from(new Set([...(acc.categories || []), ...(entry.categories || [])])),
        tags: Array.from(new Set([...(acc.tags || []), ...(entry.tags || [])])),
      };
    }, null);

    if (!merged) return;

    if (legacyBySlug.has(slug)) {
      legacyBySlug.set(slug, mergeSongSources(legacyBySlug.get(slug), merged));
    } else {
      // Try fuzzy match on legacy slugs
      let matched = false;
      for (const [lSlug, lEntry] of legacyBySlug.entries()) {
        if (slug.includes(lSlug) || lSlug.includes(slug)) {
          legacyBySlug.set(lSlug, mergeSongSources(lEntry, merged));
          matched = true;
          break;
        }
      }
      if (!matched) newEntries.push(merged);
    }
  });

  const combinedCatalog = [...legacyBySlug.values(), ...newEntries];
  const { merged: deduplicated, duplicatesFound, groupsResolved } = detectAndMerge(combinedCatalog);

  const legacySongsCount = deduplicated.filter((s) => s.isLegacy).length;
  const newFromOneDrive = deduplicated.filter((s) => !s.isLegacy).length;

  return {
    catalog: deduplicated,
    duplicateGroups: groupDuplicates(combinedCatalog),
    stats: {
      total: deduplicated.length,
      withChords: deduplicated.filter((s) => s.availableFormats?.chords).length,
      withSheetMusic: deduplicated.filter((s) => s.availableFormats?.sheetMusic).length,
      withLyrics: deduplicated.filter((s) => s.availableFormats?.lyrics).length,
      duplicatesResolved: groupsResolved,
      duplicatesFound,
      legacySongs: legacySongsCount,
      newFromOneDrive,
    },
  };
}

export function exportCatalogJSON(catalog) {
  return JSON.stringify(catalog, null, 2);
}

export function getCatalogStats(catalog) {
  const byGenre = {};
  const byTag = {};
  catalog.forEach((s) => {
    if (s.genre) byGenre[s.genre] = (byGenre[s.genre] || 0) + 1;
    (s.tags || []).forEach((t) => { byTag[t] = (byTag[t] || 0) + 1; });
  });

  const withUsage = catalog.filter((s) => s.usageStats?.totalUses > 0);
  const sortedByUse = [...withUsage].sort((a, b) => (b.usageStats?.totalUses || 0) - (a.usageStats?.totalUses || 0));
  const sortedByDate = [...withUsage]
    .filter((s) => s.usageStats?.lastUsed)
    .sort((a, b) => (b.usageStats?.lastUsed || '').localeCompare(a.usageStats?.lastUsed || ''));

  return {
    total: catalog.length,
    withLyrics: catalog.filter((s) => s.availableFormats?.lyrics).length,
    withChords: catalog.filter((s) => s.availableFormats?.chords).length,
    withSheetMusic: catalog.filter((s) => s.availableFormats?.sheetMusic).length,
    byGenre,
    byTag,
    mostUsed: sortedByUse.slice(0, 5),
    recentlyUsed: sortedByDate.slice(0, 5),
    uncategorized: catalog.filter((s) => !s.genre && !(s.tags || []).length).length,
  };
}
