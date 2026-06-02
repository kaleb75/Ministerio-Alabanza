import { normalizeSongTitle, generateSongSlug, removeFileArtifacts } from '../utils/songNormalization.js';
import { classifyFile, SUPPORTED_EXTENSIONS } from '../utils/songClassifier.js';
import { inferTagsFromTitle } from '../utils/songTags.js';

export function parseFileToSongEntry(fileEntry) {
  const rawTitle = removeFileArtifacts(fileEntry.name);
  const normalizedTitle = normalizeSongTitle(rawTitle);
  const slug = generateSongSlug(normalizedTitle);
  const { category, hasLyrics, hasChords, hasSheetMusic } = classifyFile(fileEntry);
  const tags = inferTagsFromTitle(normalizedTitle);

  return {
    id: fileEntry.id,
    title: normalizedTitle,
    normalizedTitle,
    slug,
    tags,
    availableFormats: {
      lyrics: hasLyrics,
      chords: hasChords,
      sheetMusic: hasSheetMusic,
    },
    categories: [category],
    sourceFiles: [
      {
        fileName: fileEntry.name,
        extension: fileEntry.extension,
        path: fileEntry.path,
        oneDriveId: fileEntry.oneDriveId,
        downloadUrl: fileEntry.downloadUrl,
      },
    ],
    usageStats: { totalUses: 0, lastUsed: null },
    createdAt: fileEntry.lastModified || null,
    updatedAt: fileEntry.lastModified || null,
  };
}

export function parseFileList(files) {
  const supported = new Set(SUPPORTED_EXTENSIONS);
  return files
    .filter((f) => supported.has(f.extension?.toLowerCase()))
    .map(parseFileToSongEntry);
}

export function groupByTitle(parsedEntries) {
  const map = new Map();
  parsedEntries.forEach((entry) => {
    if (!map.has(entry.slug)) map.set(entry.slug, []);
    map.get(entry.slug).push(entry);
  });
  return map;
}
