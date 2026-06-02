const ACCENT_MAP = {
  a: ['á', 'à', 'ä', 'â'],
  e: ['é', 'è', 'ë', 'ê'],
  i: ['í', 'ì', 'ï', 'î'],
  o: ['ó', 'ò', 'ö', 'ô'],
  u: ['ú', 'ù', 'ü', 'û'],
  n: ['ñ'],
};

const CANONICAL_ACCENTS = {
  cuan: 'Cuán',
  espiritu: 'Espíritu',
  el: 'Él',
  tu: 'Tú',
  mas: 'Más',
  jesus: 'Jesús',
  dios: 'Dios',
  senor: 'Señor',
  exaltacion: 'Exaltación',
  adoracion: 'Adoración',
  oracion: 'Oración',
  comunion: 'Comunión',
  nacion: 'Nación',
  renovame: 'Renuévame',
  renuvame: 'Renuévame',
};

const REMOVE_SUFFIXES = [
  'chords', 'acordes', 'acorde', 'sheet', 'partitura', 'partituras',
  'letra', 'letras', 'lyrics', 'tabs', 'cifra', 'cifrado',
];

const KNOWN_ARTISTS = [
  'paul baloche', 'marcos witt', 'marco barrientos', 'danilo montero',
  'gateway worship', 'hillsong', 'elevation worship', 'bethel music',
];

export function removeFileArtifacts(filename) {
  const dotIndex = filename.lastIndexOf('.');
  const base = dotIndex > 0 ? filename.slice(0, dotIndex) : filename;
  return base.replace(/[_]/g, ' ').trim();
}

function stripSuffixes(str) {
  let result = str;
  let changed = true;
  while (changed) {
    changed = false;
    for (const suffix of REMOVE_SUFFIXES) {
      const pattern = new RegExp(`\\s*[-–—]?\\s*${suffix}\\s*$`, 'i');
      const stripped = result.replace(pattern, '').trim();
      if (stripped !== result) {
        result = stripped;
        changed = true;
      }
    }
  }
  return result;
}

function stripArtistName(str) {
  for (const artist of KNOWN_ARTISTS) {
    const pattern = new RegExp(`\\s*[-–]\\s*${artist}\\s*$`, 'i');
    const stripped = str.replace(pattern, '').trim();
    if (stripped !== str) return stripped;
  }
  return str;
}

function toProperCase(str) {
  const minorWords = new Set(['de', 'del', 'en', 'el', 'la', 'los', 'las', 'un', 'una', 'y', 'e', 'o', 'u', 'a', 'con', 'por', 'para', 'al', 'que', 'se']);
  return str
    .toLowerCase()
    .split(' ')
    .map((word, i) => {
      if (!word) return word;
      if (i > 0 && minorWords.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

function applyCanonicalAccents(str) {
  return str
    .split(' ')
    .map((word) => {
      const key = word.toLowerCase().replace(/[áàäâéèëêíìïîóòöôúùüûñ]/g, (c) => {
        for (const [base, variants] of Object.entries(ACCENT_MAP)) {
          if (variants.includes(c)) return base;
        }
        return c;
      });
      return CANONICAL_ACCENTS[key] || word;
    })
    .join(' ');
}

export function normalizeSongTitle(rawTitle) {
  let title = rawTitle || '';
  title = title.replace(/[_]/g, ' ').trim();
  title = stripSuffixes(title);
  title = stripArtistName(title);
  title = title.replace(/\s+/g, ' ').trim();
  title = toProperCase(title);
  title = applyCanonicalAccents(title);
  return title;
}

export function generateSongSlug(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function detectDuplicateTitles(titles) {
  const slugMap = new Map();
  titles.forEach((t) => {
    const slug = generateSongSlug(normalizeSongTitle(t));
    if (!slugMap.has(slug)) slugMap.set(slug, []);
    slugMap.get(slug).push(t);
  });
  return Array.from(slugMap.values())
    .filter((group) => group.length > 1)
    .map((group) => ({ canonical: group[0], variants: group.slice(1) }));
}

export function computeSimilarity(a, b) {
  const sa = generateSongSlug(normalizeSongTitle(a));
  const sb = generateSongSlug(normalizeSongTitle(b));
  if (sa === sb) return 1;
  const la = sa.length, lb = sb.length;
  if (!la || !lb) return 0;
  const dp = Array.from({ length: la + 1 }, (_, i) =>
    Array.from({ length: lb + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      dp[i][j] = sa[i - 1] === sb[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return 1 - dp[la][lb] / Math.max(la, lb);
}
