import { createContext, useContext, useMemo, useCallback } from 'react';
import { useApp } from './AppContext';
import { useSongSettings } from './SongSettingsContext';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysBetween(dateA, dateB) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((new Date(dateA) - new Date(dateB)) / msPerDay);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const SongIntelligenceContext = createContext(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function SongIntelligenceProvider({ children }) {
  const { songs, songHistory } = useApp();
  const { settings } = useSongSettings();

  const {
    repeatProtectionDays,
    blockRepeatDays,
    forgottenThresholdDays,
    coldThresholdDays,
    recommendationSensitivity,
  } = settings;

  // -------------------------------------------------------------------------
  // analytics — one object per song, enriched with history-derived metrics
  // -------------------------------------------------------------------------
  const analytics = useMemo(() => {
    const todayStr = today();

    return songs.map((song) => {
      const entries = songHistory
        .filter((h) => h.songId === song.id)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      const totalPlays = entries.length;
      const lastEntry = entries[totalPlays - 1] ?? null;
      const lastPlayedDate = lastEntry ? lastEntry.date : null;
      const daysSinceLastPlay = lastPlayedDate
        ? daysBetween(todayStr, lastPlayedDate)
        : null;

      // Average gap between consecutive plays (days)
      let avgGapDays = null;
      if (entries.length >= 2) {
        let totalGap = 0;
        for (let i = 1; i < entries.length; i++) {
          totalGap += daysBetween(entries[i].date, entries[i - 1].date);
        }
        avgGapDays = Math.round(totalGap / (entries.length - 1));
      }

      // Unique event types this song has appeared in
      const eventTypes = [...new Set(entries.map((e) => e.eventType))];

      // Status flags driven by settings thresholds
      const isForgotten =
        daysSinceLastPlay !== null &&
        daysSinceLastPlay >= forgottenThresholdDays;
      const isCold =
        !isForgotten &&
        daysSinceLastPlay !== null &&
        daysSinceLastPlay >= coldThresholdDays;
      const isRecent =
        daysSinceLastPlay !== null && daysSinceLastPlay <= repeatProtectionDays;

      return {
        songId: song.id,
        song,
        totalPlays,
        lastPlayedDate,
        daysSinceLastPlay,
        avgGapDays,
        eventTypes,
        history: entries,
        isForgotten,
        isCold,
        isRecent,
      };
    });
  }, [songs, songHistory, forgottenThresholdDays, coldThresholdDays, repeatProtectionDays]);

  // -------------------------------------------------------------------------
  // analyticsMap — O(1) lookup by songId
  // -------------------------------------------------------------------------
  const analyticsMap = useMemo(() => {
    return analytics.reduce((acc, item) => {
      acc[item.songId] = item;
      return acc;
    }, {});
  }, [analytics]);

  // -------------------------------------------------------------------------
  // forgottenSongs — songs not played within forgottenThresholdDays
  // -------------------------------------------------------------------------
  const forgottenSongs = useMemo(
    () => analytics.filter((a) => a.isForgotten),
    [analytics]
  );

  // -------------------------------------------------------------------------
  // recentSongs — songs played within repeatProtectionDays
  // -------------------------------------------------------------------------
  const recentSongs = useMemo(
    () => analytics.filter((a) => a.isRecent),
    [analytics]
  );

  // -------------------------------------------------------------------------
  // varietyScore — 0–100 measure of how evenly the catalog is used.
  // Computed as: 100 * (songs used in the last 90 days / total songs).
  // Adjusted down when many songs are forgotten.
  // -------------------------------------------------------------------------
  const varietyScore = useMemo(() => {
    if (!analytics.length) return 0;
    const window = 90;
    const recentlyUsed = analytics.filter(
      (a) => a.daysSinceLastPlay !== null && a.daysSinceLastPlay <= window
    ).length;
    const raw = recentlyUsed / analytics.length;
    const forgottenPenalty = forgottenSongs.length / analytics.length;
    return Math.round(Math.max(0, (raw - forgottenPenalty * 0.5)) * 100);
  }, [analytics, forgottenSongs]);

  // -------------------------------------------------------------------------
  // recommendations — songs that should be played next.
  // Strategy:
  //   - Exclude songs played within blockRepeatDays.
  //   - Prioritise forgotten / cold songs.
  //   - Apply sensitivity multiplier to tune how aggressively cold songs
  //     surface vs. simply least-recently-used ordering.
  // -------------------------------------------------------------------------
  const recommendations = useMemo(() => {
    const sensitivityMultiplier =
      recommendationSensitivity === 'high'
        ? 0.5
        : recommendationSensitivity === 'low'
        ? 1.5
        : 1.0;

    const effectiveBlockDays = blockRepeatDays * sensitivityMultiplier;

    // Filter out hard-blocked songs
    const eligible = analytics.filter(
      (a) =>
        a.daysSinceLastPlay === null ||
        a.daysSinceLastPlay >= effectiveBlockDays
    );

    // Score: higher = more recommended.
    // Songs never played get highest score.
    const scored = eligible.map((a) => {
      let score = 0;
      if (a.daysSinceLastPlay === null) {
        score = Infinity;
      } else {
        score = a.daysSinceLastPlay;
        if (a.isForgotten) score *= 2;
        else if (a.isCold) score *= 1.5;
      }
      return { ...a, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .map(({ score: _score, ...rest }) => rest);
  }, [analytics, blockRepeatDays, recommendationSensitivity]);

  // -------------------------------------------------------------------------
  // getSongAnalytics — retrieve analytics for a single song by id
  // -------------------------------------------------------------------------
  const getSongAnalytics = useCallback(
    (songId) => analyticsMap[songId] ?? null,
    [analyticsMap]
  );

  // -------------------------------------------------------------------------
  // checkSongRepetition — returns an object describing whether it is safe to
  // use a song on a given date.
  // { allowed: boolean, daysSinceLast: number|null, blockDays: number }
  // -------------------------------------------------------------------------
  const checkSongRepetition = useCallback(
    (songId, eventDate) => {
      const item = analyticsMap[songId];
      if (!item || !item.lastPlayedDate) {
        return { allowed: true, daysSinceLast: null, blockDays: blockRepeatDays };
      }
      const daysSinceLast = daysBetween(eventDate, item.lastPlayedDate);
      return {
        allowed: daysSinceLast >= blockRepeatDays,
        daysSinceLast,
        blockDays: blockRepeatDays,
      };
    },
    [analyticsMap, blockRepeatDays]
  );

  // -------------------------------------------------------------------------
  // validateSongs — bulk version of checkSongRepetition for a setlist.
  // Returns an array of { songId, ...checkResult } for every song that fails.
  // -------------------------------------------------------------------------
  const validateSongs = useCallback(
    (songIds, eventDate) => {
      return songIds
        .map((id) => ({ songId: id, ...checkSongRepetition(id, eventDate) }))
        .filter((result) => !result.allowed);
    },
    [checkSongRepetition]
  );

  // -------------------------------------------------------------------------
  // Context value
  // -------------------------------------------------------------------------
  const value = useMemo(
    () => ({
      analytics,
      analyticsMap,
      recommendations,
      forgottenSongs,
      recentSongs,
      varietyScore,
      getSongAnalytics,
      checkSongRepetition,
      validateSongs,
    }),
    [
      analytics,
      analyticsMap,
      recommendations,
      forgottenSongs,
      recentSongs,
      varietyScore,
      getSongAnalytics,
      checkSongRepetition,
      validateSongs,
    ]
  );

  return (
    <SongIntelligenceContext.Provider value={value}>
      {children}
    </SongIntelligenceContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSongIntelligence() {
  const ctx = useContext(SongIntelligenceContext);
  if (!ctx) {
    throw new Error(
      'useSongIntelligence must be used within a SongIntelligenceProvider'
    );
  }
  return ctx;
}

export default SongIntelligenceContext;
