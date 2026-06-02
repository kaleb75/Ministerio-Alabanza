export const SORT_OPTIONS = {
  RECENT: 'recent',
  MOST_USED: 'most_used',
  LEAST_USED: 'least_used',
  ALPHA: 'alpha',
  NEWEST: 'newest',
};

function fuzzyContains(text, query) {
  let ti = 0;
  for (let qi = 0; qi < query.length; qi++) {
    while (ti < text.length && text[ti] !== query[qi]) ti++;
    if (ti >= text.length) return false;
    ti++;
  }
  return true;
}

function matchesQuery(song, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  const title = (song.normalizedTitle || song.title || '').toLowerCase();
  const slug = (song.slug || '').toLowerCase();
  const tags = (song.tags || []).join(' ').toLowerCase();
  const author = (song.author || '').toLowerCase();

  if (title.includes(q) || slug.includes(q) || tags.includes(q) || author.includes(q)) return true;
  if (q.length >= 3 && fuzzyContains(slug, q.replace(/\s+/g, '-'))) return true;
  return false;
}

function sortCatalog(songs, sortOption) {
  const copy = [...songs];
  switch (sortOption) {
    case SORT_OPTIONS.RECENT:
      return copy.sort((a, b) => {
        const da = a.usageStats?.lastUsed || '';
        const db = b.usageStats?.lastUsed || '';
        return db.localeCompare(da);
      });
    case SORT_OPTIONS.MOST_USED:
      return copy.sort((a, b) => (b.usageStats?.totalUses || 0) - (a.usageStats?.totalUses || 0));
    case SORT_OPTIONS.LEAST_USED:
      return copy.sort((a, b) => (a.usageStats?.totalUses || 0) - (b.usageStats?.totalUses || 0));
    case SORT_OPTIONS.ALPHA:
      return copy.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'es'));
    case SORT_OPTIONS.NEWEST:
      return copy.sort((a, b) => {
        const da = a.createdAt || '';
        const db = b.createdAt || '';
        return db.localeCompare(da);
      });
    default:
      return copy;
  }
}

export function searchSongs(songs, query, filters = {}) {
  const { tags = [], format = null, sort = SORT_OPTIONS.ALPHA, category = null } = filters;

  let results = songs.filter((song) => {
    if (!matchesQuery(song, query)) return false;
    if (format && !song.availableFormats?.[format]) return false;
    if (tags.length > 0 && !tags.every((t) => (song.tags || []).includes(t))) return false;
    if (category && !(song.categories || []).includes(category)) return false;
    return true;
  });

  return sortCatalog(results, sort);
}

export function highlightMatch(text, query) {
  if (!query || !text) return [{ text, highlight: false }];
  const parts = [];
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let lastIndex = 0;
  let index = lowerText.indexOf(lowerQuery);
  while (index !== -1) {
    if (index > lastIndex) parts.push({ text: text.slice(lastIndex, index), highlight: false });
    parts.push({ text: text.slice(index, index + query.length), highlight: true });
    lastIndex = index + query.length;
    index = lowerText.indexOf(lowerQuery, lastIndex);
  }
  if (lastIndex < text.length) parts.push({ text: text.slice(lastIndex), highlight: false });
  return parts;
}

export function getSearchSuggestions(songs, partialQuery) {
  if (!partialQuery || partialQuery.length < 2) return [];
  const q = partialQuery.toLowerCase();
  return songs
    .filter((s) => (s.title || '').toLowerCase().includes(q))
    .slice(0, 5)
    .map((s) => s.title);
}

export function buildSearchIndex(songs) {
  const slugIndex = new Map();
  const tagIndex = new Map();
  const formatIndex = new Map();

  songs.forEach((song) => {
    if (song.slug) slugIndex.set(song.slug, song);
    (song.tags || []).forEach((tag) => {
      if (!tagIndex.has(tag)) tagIndex.set(tag, []);
      tagIndex.get(tag).push(song);
    });
    const formats = song.availableFormats || {};
    Object.entries(formats).forEach(([fmt, available]) => {
      if (available) {
        if (!formatIndex.has(fmt)) formatIndex.set(fmt, []);
        formatIndex.get(fmt).push(song);
      }
    });
  });

  return { slugIndex, tagIndex, formatIndex };
}

export function filterByRecentUsage(songs, withinDays) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - withinDays);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  return songs.filter((s) => {
    const lastUsed = s.usageStats?.lastUsed || '';
    return lastUsed >= cutoffStr;
  });
}
