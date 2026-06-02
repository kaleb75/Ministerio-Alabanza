import dayjs from 'dayjs';
import { computeAllSongAnalytics } from '../utils/songAnalytics';

/**
 * Returns a sorted list of songs with a recommendation score and an
 * `analytics` field attached to each, ordered from most to least recommended.
 *
 * Delegates to computeAllSongAnalytics (which already computes
 * recommendationScore per song) and then attaches the full analytics block
 * onto each song object for convenient access.
 *
 * @param {Array}  songs    - catalog song objects
 * @param {Array}  history  - song history entries [{ songId, date, ... }]
 * @param {Object} [settings={}]
 *   - settings.recentWindowDays   {number}  window for "recent uses" stat (default 90)
 * @returns {Array}  songs sorted by recommendationScore descending, each with:
 *   - analytics           {Object}  full analytics block from computeAllSongAnalytics
 *   - recommendationScore {number}  0–100 (mirrored from analytics for convenience)
 */
export function getRecommendations(songs, history, settings = {}) {
  if (!Array.isArray(songs) || !songs.length) return [];

  // computeAllSongAnalytics returns one analytics object per song.
  const analyticsMap = new Map(
    computeAllSongAnalytics(songs, history, settings).map((a) => [String(a.songId), a])
  );

  const scored = songs.map((song) => {
    const id = String(song.id ?? song._id ?? song.songId);
    const analytics = analyticsMap.get(id) ?? null;
    const recommendationScore = analytics ? analytics.recommendationScore : 0;
    return { ...song, analytics, recommendationScore };
  });

  return scored.sort((a, b) => b.recommendationScore - a.recommendationScore);
}

/**
 * Returns the top N songs that have been "forgotten" — i.e. songs that have
 * been used in the past but have not been played for the longest time.
 * Songs that have never been used are excluded (they are not "forgotten").
 *
 * Uses getForgottenSongs from songAnalytics (threshold: daysSinceLastUse > 120)
 * but also accepts a custom threshold via settings.forgottenThresholdDays.
 *
 * @param {Array}  songs
 * @param {Array}  history
 * @param {Object} [settings={}]
 *   - settings.forgottenThresholdDays {number}  days threshold for "forgotten" (default 120)
 * @param {number} [limit=10]
 * @returns {Array}  up to `limit` songs sorted by daysSinceLastUse descending,
 *   each with an `analytics` field
 */
export function getTopForgotten(songs, history, settings = {}, limit = 10) {
  if (!Array.isArray(songs) || !songs.length) return [];

  const threshold = settings.forgottenThresholdDays ?? 120;

  const analyticsMap = new Map(
    computeAllSongAnalytics(songs, history, settings).map((a) => [String(a.songId), a])
  );

  // Attach analytics to each song.
  const withAnalytics = songs.map((song) => {
    const id = String(song.id ?? song._id ?? song.songId);
    const analytics = analyticsMap.get(id) ?? null;
    return { ...song, analytics };
  });

  // Keep only songs that have been used at least once and are "forgotten".
  const forgotten = withAnalytics.filter(
    (song) =>
      song.analytics &&
      !song.analytics.neverUsed &&
      song.analytics.totalUses > 0 &&
      song.analytics.daysSinceLastUse > threshold
  );

  // Sort by daysSinceLastUse descending (most forgotten first).
  forgotten.sort(
    (a, b) =>
      (b.analytics.daysSinceLastUse ?? 0) - (a.analytics.daysSinceLastUse ?? 0)
  );

  return forgotten.slice(0, limit);
}

/**
 * Computes a variety score (0–100) for a given history window.
 *
 * The score reflects how diverse the song selection has been:
 *   score = (uniqueSongs / totalUses) * 100, clamped to 0–100.
 *
 * A score of 100 means every use was a different song (maximum variety).
 * A score near 0 means the same songs were repeated constantly.
 *
 * @param {Array}  history      - song history entries [{ songId, date, ... }]
 * @param {number} daysWindow   - how many past days to include in the analysis
 * @returns {number}  0–100
 */
export function getVarietyScore(history, daysWindow) {
  if (!Array.isArray(history) || !history.length) return 0;

  const cutoff = dayjs().subtract(daysWindow, 'day');

  const entriesInWindow = history.filter(
    (h) => h.date && dayjs(h.date).isAfter(cutoff)
  );

  if (!entriesInWindow.length) return 0;

  const totalUses = entriesInWindow.length;
  const uniqueSongs = new Set(entriesInWindow.map((h) => String(h.songId))).size;

  return Math.round(Math.min(100, (uniqueSongs / totalUses) * 100));
}
