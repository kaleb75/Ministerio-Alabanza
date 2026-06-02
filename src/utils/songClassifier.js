export const FILE_CATEGORIES = {
  LYRICS: 'lyrics',
  CHORDS: 'chords',
  SHEET_MUSIC: 'sheet_music',
  IMAGE: 'image',
  UNKNOWN: 'unknown',
};

export const SUPPORTED_EXTENSIONS = ['pdf', 'docx', 'txt', 'png', 'jpg', 'jpeg'];

const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp']);

const SHEET_MUSIC_KEYWORDS = ['sheet', 'partitura', 'partituras'];
const CHORD_KEYWORDS = ['chord', 'chords', 'acorde', 'acordes', 'tabs', 'cifra', 'cifrado'];
const LYRICS_KEYWORDS = ['letra', 'letras', 'lyrics', 'lyric'];

const UNKNOWN_NAME_PATTERNS = [
  /^scan\d+/i,
  /^\d{4,}/,
  /^img_\d+/i,
  /^dsc\d+/i,
  /^foto/i,
  /^photo/i,
  /^image/i,
];

function matchesKeywords(str, keywords) {
  const lower = str.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

export function classifyFile(fileEntry) {
  const { name = '', extension = '', path = '' } = fileEntry;
  const nameLower = name.toLowerCase();
  const pathLower = path.toLowerCase();
  const ext = extension.toLowerCase();

  if (IMAGE_EXTS.has(ext)) {
    return { category: FILE_CATEGORIES.IMAGE, hasLyrics: false, hasChords: false, hasSheetMusic: false, isImage: true, confidence: 'high' };
  }

  if (UNKNOWN_NAME_PATTERNS.some((p) => p.test(name))) {
    return { category: FILE_CATEGORIES.UNKNOWN, hasLyrics: false, hasChords: false, hasSheetMusic: false, isImage: false, confidence: 'high' };
  }

  const isSheetPath = matchesKeywords(pathLower, SHEET_MUSIC_KEYWORDS);
  const isSheetName = matchesKeywords(nameLower, SHEET_MUSIC_KEYWORDS);
  if (isSheetPath || isSheetName) {
    return { category: FILE_CATEGORIES.SHEET_MUSIC, hasLyrics: false, hasChords: false, hasSheetMusic: true, isImage: false, confidence: 'high' };
  }

  const isChordsName = matchesKeywords(nameLower, CHORD_KEYWORDS);
  if (isChordsName) {
    return { category: FILE_CATEGORIES.CHORDS, hasLyrics: true, hasChords: true, hasSheetMusic: false, isImage: false, confidence: 'high' };
  }

  const isLyricsName = matchesKeywords(nameLower, LYRICS_KEYWORDS);
  if (isLyricsName || ext === 'txt' || ext === 'docx') {
    return { category: FILE_CATEGORIES.LYRICS, hasLyrics: true, hasChords: false, hasSheetMusic: false, isImage: false, confidence: ext === 'txt' ? 'high' : 'medium' };
  }

  if (ext === 'pdf') {
    return { category: FILE_CATEGORIES.LYRICS, hasLyrics: true, hasChords: false, hasSheetMusic: false, isImage: false, confidence: 'medium' };
  }

  return { category: FILE_CATEGORIES.UNKNOWN, hasLyrics: false, hasChords: false, hasSheetMusic: false, isImage: false, confidence: 'low' };
}

export function classifyFileList(files) {
  return files.map((f) => ({ ...f, ...classifyFile(f) }));
}

export function getFormatSummary(classifiedFiles) {
  const byCategory = { lyrics: 0, chords: 0, sheet_music: 0, image: 0, unknown: 0 };
  classifiedFiles.forEach((f) => {
    const cat = f.category || FILE_CATEGORIES.UNKNOWN;
    if (byCategory[cat] !== undefined) byCategory[cat]++;
  });
  const uniqueFormats = Object.entries(byCategory)
    .filter(([, count]) => count > 0)
    .map(([fmt]) => fmt);
  return { totalFiles: classifiedFiles.length, byCategory, uniqueFormats };
}
