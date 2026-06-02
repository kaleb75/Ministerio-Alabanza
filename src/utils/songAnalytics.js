import dayjs from 'dayjs';

// ---------------------------------------------------------------------------
// FRESHNESS constant
// Maps badge keys to display metadata and day thresholds.
// ---------------------------------------------------------------------------
export const FRESHNESS = {
  hot: {
    max: 14,
    label: 'Reciente',
    badge: 'HOT',
    color: 'danger',
  },
  active: {
    max: 30,
    label: 'Activo',
    badge: 'ACTIVE',
    color: 'success',
  },
  warm: {
    max: 60,
    label: 'Tibio',
    badge: 'WARM',
    color: 'warning',
  },
  cold: {
    max: 120,
    label: 'Frío',
    badge: 'COLD',
    color: '#0A84FF',
  },
  forgotten: {
    max: Infinity,
    label: 'Olvidado',
    badge: 'FORGOTTEN',
    color: 'tertiary',
  },
};

// Ordered list for threshold checks (most-recent first).
const FRESHNESS_ORDER = ['hot', 'active', 'warm', 'cold', 'forgotten'];

// ---------------------------------------------------------------------------
// getFreshnessLevel
// Returns the FRESHNESS entry (with its key) matching daysSince.
// ---------------------------------------------------------------------------
export function getFreshnessLevel(daysSince) {
  for (const key of FRESHNESS_ORDER) {
    if (daysSince <= FRESHNESS[key].max) {
      return { key, ...FRESHNESS[key] };
    }
  }
  return { key: 'forgotten', ...FRESHNESS.forgotten };
}

// ---------------------------------------------------------------------------
// computeDaysSince
// Returns the number of whole days between dateStr and today.
// Returns 999 when dateStr is falsy or unparseable.
// ---------------------------------------------------------------------------
export function computeDaysSince(dateStr) {
  if (!dateStr) return 999;
  const parsed = dayjs(dateStr);
  if (!parsed.isValid()) return 999;
  const diff = dayjs().diff(parsed, 'day');
  return diff < 0 ? 0 : diff;
}

// ---------------------------------------------------------------------------
// computeUsageScore
// 0-100 score where higher means the song has been used more recently/often.
//   - Frequency component: up to 50 pts (logarithmic scale, capped at 50).
//   - Recency component:   up to 50 pts, decays linearly over 365 days.
// ---------------------------------------------------------------------------
export function computeUsageScore(timesUsed, daysSince) {
  const uses = Math.max(0, timesUsed || 0);
  const days = Math.max(0, daysSince || 0);

  const frequencyScore = Math.min(50, 50 * (Math.log(uses + 1) / Math.log(51)));
  const recencyScore = 50 * Math.max(0, (365 - days) / 365);

  return Math.round(frequencyScore + recencyScore);
}

// ---------------------------------------------------------------------------
// computeRecommendationScore
// Inverse of usageScore: songs that haven't been used recently/often score
// higher so they bubble up in a recommendation list.
// ---------------------------------------------------------------------------
export function computeRecommendationScore(timesUsed, daysSince) {
  return 100 - computeUsageScore(timesUsed, daysSince);
}

// ---------------------------------------------------------------------------
// getRecommendationReason
// Returns a Spanish string explaining why a song is being recommended.
// ---------------------------------------------------------------------------
export function getRecommendationReason(daysSince, timesUsed) {
  const uses = timesUsed || 0;

  if (uses === 0) {
    return 'Esta canción nunca ha sido usada en un servicio.';
  }

  if (daysSince >= 999) {
    return 'No hay registro de cuándo se usó esta canción por última vez.';
  }

  if (daysSince > 120) {
    return `No se ha usado en más de ${daysSince} días — es un buen momento para retomar esta canción.`;
  }

  if (daysSince > 60) {
    return `Lleva ${daysSince} días sin usarse. Considera incluirla pronto.`;
  }

  if (daysSince > 30) {
    return `Han pasado ${daysSince} días desde la última vez que se usó.`;
  }

  return `Se usó hace ${daysSince} días (${uses} ${uses === 1 ? 'vez' : 'veces'} en total).`;
}

// ---------------------------------------------------------------------------
// computeAllSongAnalytics
// songs    – array of song objects with at least { id, title, author }
// history  – array of service/event records or flat usage entries (see
//             normaliseHistory below for accepted shapes).
// settings – (optional) reserved for future configuration.
//
// Returns an array of analytics objects, one per song.
// ---------------------------------------------------------------------------
export function computeAllSongAnalytics(songs = [], history = [], _settings = {}) {
  const usageEntries = normaliseHistory(history);

  return songs.map((song) => {
    const id = song.id ?? song._id ?? song.songId;
    const entries = usageEntries.filter((e) => String(e.songId) === String(id));

    const totalUses = entries.length;

    const sortedDates = entries
      .map((e) => e.date)
      .filter(Boolean)
      .sort((a, b) => (dayjs(a).isBefore(dayjs(b)) ? 1 : -1));

    const lastUsed = sortedDates[0] ?? null;
    const daysSinceLastUse = computeDaysSince(lastUsed);

    const freshnessEntry = getFreshnessLevel(daysSinceLastUse);
    const usageScore = computeUsageScore(totalUses, daysSinceLastUse);
    const recommendationScore = computeRecommendationScore(totalUses, daysSinceLastUse);
    const recommendationReason = getRecommendationReason(daysSinceLastUse, totalUses);

    // Recent uses: last 30 days
    const thirtyDaysAgo = dayjs().subtract(30, 'day');
    const recentUses = entries.filter(
      (e) => e.date && dayjs(e.date).isAfter(thirtyDaysAgo)
    ).length;

    const monthlyUsage = buildMonthlyUsage(entries);

    const isForgotten = daysSinceLastUse > 120;
    const isRecent = daysSinceLastUse <= 14;

    return {
      songId: id,
      title: song.title ?? song.nombre ?? '',
      author: song.author ?? song.autor ?? '',
      totalUses,
      lastUsed,
      daysSinceLastUse,
      freshness: freshnessEntry.key,
      freshnessLabel: freshnessEntry.label,
      freshnessBadge: freshnessEntry.badge,
      usageScore,
      recommendationScore,
      recommendationReason,
      recentUses,
      monthlyUsage,
      isForgotten,
      isRecent,
    };
  });
}

// ---------------------------------------------------------------------------
// sortByRecommendation
// Sorts analytics array by recommendationScore descending (highest first).
// ---------------------------------------------------------------------------
export function sortByRecommendation(arr = []) {
  return [...arr].sort((a, b) => b.recommendationScore - a.recommendationScore);
}

// ---------------------------------------------------------------------------
// sortByUsage
// Sorts analytics array by totalUses ascending (least-used first).
// ---------------------------------------------------------------------------
export function sortByUsage(arr = []) {
  return [...arr].sort((a, b) => a.totalUses - b.totalUses);
}

// ---------------------------------------------------------------------------
// getForgottenSongs
// Returns songs whose daysSinceLastUse exceeds thresholdDays (default 120).
// ---------------------------------------------------------------------------
export function getForgottenSongs(arr = [], thresholdDays = 120) {
  return arr.filter((item) => item.daysSinceLastUse > thresholdDays);
}

// ---------------------------------------------------------------------------
// getRecentlyUsedSongs
// Returns songs used within the last withinDays days (inclusive).
// ---------------------------------------------------------------------------
export function getRecentlyUsedSongs(arr = [], withinDays = 14) {
  return arr.filter((item) => item.daysSinceLastUse <= withinDays);
}

// ---------------------------------------------------------------------------
// Legacy helpers — preserved for backward compatibility with existing callers.
// ---------------------------------------------------------------------------

/**
 * Returns all history entries for a given song id.
 *
 * @param {string|number} songId
 * @param {Array} history  - array of { songId, date, ... }
 * @returns {Array}
 */
export function getSongHistory(songId, history) {
  if (!Array.isArray(history)) return [];
  const sid = String(songId);
  return history.filter((h) => String(h.songId) === sid);
}

/**
 * Returns the most recent date a song was used, or null if never.
 *
 * @param {string|number} songId
 * @param {Array} history
 * @returns {string|null}  ISO date string (YYYY-MM-DD)
 */
export function getLastUsedDate(songId, history) {
  const entries = getSongHistory(songId, history);
  if (!entries.length) return null;
  return entries
    .map((h) => h.date)
    .filter(Boolean)
    .sort((a, b) => (a > b ? -1 : 1))[0] || null;
}

/**
 * Returns how many days ago a song was last used.
 * Returns Infinity if the song has never been used.
 *
 * @param {string|number} songId
 * @param {Array} history
 * @returns {number}
 */
export function getDaysSinceLastUse(songId, history) {
  const lastUsed = getLastUsedDate(songId, history);
  if (!lastUsed) return Infinity;
  return dayjs().diff(dayjs(lastUsed), 'day');
}

/**
 * Returns the total number of times a song appears in history.
 *
 * @param {string|number} songId
 * @param {Array} history
 * @returns {number}
 */
export function getTotalUses(songId, history) {
  return getSongHistory(songId, history).length;
}

/**
 * Returns the number of uses within a rolling window of `days` days.
 *
 * @param {string|number} songId
 * @param {Array} history
 * @param {number} days
 * @returns {number}
 */
export function getUsesInWindow(songId, history, days) {
  const cutoff = dayjs().subtract(days, 'day');
  return getSongHistory(songId, history).filter((h) =>
    h.date && dayjs(h.date).isAfter(cutoff)
  ).length;
}

/**
 * Resolves the canonical song id from a song object.
 *
 * @param {Object} song
 * @returns {string|number}
 */
export function resolveSongId(song) {
  return song.id;
}

/**
 * Computes a full analytics block for a single song (legacy API).
 *
 * @param {Object} song
 * @param {Array}  history
 * @param {Object} [settings={}]
 * @returns {Object}  analytics block
 */
export function computeSongAnalytics(song, history, settings = {}) {
  const songId = resolveSongId(song);
  const totalUses = getTotalUses(songId, history);
  const lastUsed = getLastUsedDate(songId, history);
  const daysSinceLastUse = getDaysSinceLastUse(songId, history);
  const recentWindow = settings.recentWindowDays || 90;
  const recentUses = getUsesInWindow(songId, history, recentWindow);

  return {
    songId,
    totalUses,
    lastUsed,
    daysSinceLastUse: daysSinceLastUse === Infinity ? null : daysSinceLastUse,
    recentUses,
    recentWindowDays: recentWindow,
    neverUsed: totalUses === 0,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Normalises history into a flat array of { songId, date }.
 *
 * Accepts either:
 *   A) Service/event records:
 *      [{ serviceDate, songs: [songId, ...] }, ...]
 *      [{ date, songs: [{ id }, ...] }, ...]
 *   B) Flat usage entries:
 *      [{ songId, date }, ...]
 */
function normaliseHistory(history) {
  if (!Array.isArray(history) || history.length === 0) return [];

  const first = history[0];

  // Flat usage entry: has songId or (id without songs array)
  const isFlat =
    'songId' in first ||
    ('id' in first && !Array.isArray(first.songs) && !Array.isArray(first.canciones));

  if (isFlat) {
    return history.map((e) => ({
      songId: e.songId ?? e.id,
      date: e.date ?? e.fecha ?? null,
    }));
  }

  // Service/event records
  const entries = [];
  for (const record of history) {
    const date = record.serviceDate ?? record.date ?? record.fecha ?? null;
    const songList = record.songs ?? record.canciones ?? [];

    for (const s of songList) {
      if (s == null) continue;
      const songId = typeof s === 'object' ? (s.id ?? s._id ?? s.songId) : s;
      entries.push({ songId, date });
    }
  }
  return entries;
}

/**
 * Groups usage entries by YYYY-MM.
 * Returns an object like: { '2024-01': 3, '2024-02': 1, ... }
 */
function buildMonthlyUsage(entries) {
  return entries.reduce((acc, e) => {
    if (!e.date) return acc;
    const key = dayjs(e.date).format('YYYY-MM');
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}
