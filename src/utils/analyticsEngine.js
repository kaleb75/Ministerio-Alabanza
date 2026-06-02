import dayjs from 'dayjs';

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function daysSince(dateStr) {
  if (!dateStr) return 9999;
  const d = dayjs(dateStr);
  if (!d.isValid()) return 9999;
  const diff = dayjs().diff(d, 'day');
  return diff < 0 ? 0 : diff;
}

function safeDiv(num, den) {
  return den === 0 ? 0 : num / den;
}

const MONTH_ABBR = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

// ─── Month Range ─────────────────────────────────────────────────────────────

export function generateMonthRange(n = 12) {
  const result = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = dayjs().subtract(i, 'month');
    result.push({
      label: `${MONTH_ABBR[d.month()]} ${d.year()}`,
      year:  d.year(),
      month: d.month(),
      key:   d.format('YYYY-MM'),
    });
  }
  return result;
}

// ─── Song Analytics ───────────────────────────────────────────────────────────

export function computeUsageByMonth(history = [], months = 12) {
  const range = generateMonthRange(months);
  const counts = {};
  range.forEach(m => { counts[m.key] = 0; });

  history.forEach(h => {
    if (!h.date) return;
    const key = dayjs(h.date).format('YYYY-MM');
    if (counts[key] !== undefined) counts[key]++;
  });

  return range.map(m => ({ label: m.label, key: m.key, count: counts[m.key] }));
}

export function computeTopSongs(songs = [], n = 10) {
  const sorted = [...songs].sort((a, b) => (b.timesUsed || 0) - (a.timesUsed || 0)).slice(0, n);
  const max = sorted[0]?.timesUsed || 1;
  return sorted.map(s => ({
    id:         s.id,
    title:      s.title,
    author:     s.author || '',
    key:        s.key || '',
    genre:      s.genre || '',
    timesUsed:  s.timesUsed || 0,
    percentage: Math.round(safeDiv(s.timesUsed || 0, max) * 100),
  }));
}

const GENRE_COLORS = {
  'Himno':         '#FF9500',
  'Contemporáneo': '#0A84FF',
  'Balada':        '#32D74B',
  'Coro':          '#FFD60A',
  'Especial':      '#FF453A',
};

export function computeGenreDistribution(songs = []) {
  const counts = {};
  songs.forEach(s => {
    const g = s.genre || 'Otro';
    counts[g] = (counts[g] || 0) + 1;
  });
  const total = songs.length || 1;
  return Object.entries(counts)
    .map(([genre, count]) => ({
      genre,
      count,
      percentage: Math.round(safeDiv(count, total) * 100),
      color: GENRE_COLORS[genre] || '#8E8E93',
    }))
    .sort((a, b) => b.count - a.count);
}

export function computeKeyDistribution(songs = []) {
  const counts = {};
  songs.forEach(s => {
    if (s.key) counts[s.key] = (counts[s.key] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

export function computeForgottenSongs(songs = [], thresholdDays = 90) {
  return songs
    .map(s => ({ ...s, daysSinceUsed: daysSince(s.lastUsed) }))
    .filter(s => !s.lastUsed || s.daysSinceUsed > thresholdDays)
    .sort((a, b) => b.daysSinceUsed - a.daysSinceUsed);
}

// ─── Event Analytics ──────────────────────────────────────────────────────────

export function computeEventsPerMonth(events = [], months = 12) {
  const range = generateMonthRange(months);
  const counts = {};
  range.forEach(m => { counts[m.key] = 0; });

  events.forEach(e => {
    if (!e.date) return;
    const key = dayjs(e.date).format('YYYY-MM');
    if (counts[key] !== undefined) counts[key]++;
  });

  return range.map(m => ({ label: m.label, key: m.key, count: counts[m.key] }));
}

export function computeEventsByType(events = []) {
  const counts = {};
  events.forEach(e => {
    const t = e.type || 'Otro';
    counts[t] = (counts[t] || 0) + 1;
  });
  const total = events.length || 1;
  return Object.entries(counts)
    .map(([type, count]) => ({
      type,
      count,
      percentage: Math.round(safeDiv(count, total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

export function computeWorshipHeatmap(events = []) {
  const dateMap = {};
  events.forEach(e => {
    if (e.date) dateMap[e.date] = (dateMap[e.date] || 0) + 1;
  });

  const cells = [];
  const start = dayjs().subtract(363, 'day');
  for (let i = 0; i < 364; i++) {
    const d = start.add(i, 'day');
    const date = d.format('YYYY-MM-DD');
    cells.push({
      date,
      count:      dateMap[date] || 0,
      week:       Math.floor(i / 7),
      dayOfWeek:  d.day(),
    });
  }
  return cells;
}

// ─── Director Analytics ───────────────────────────────────────────────────────

export function computeDirectorActivity(events = [], users = []) {
  const directorRoles = new Set(['admin', 'lider_directores', 'director']);
  const directors = users.filter(u => directorRoles.has(u.role) && u.active);
  const totalEvents = events.length || 1;

  return directors
    .map(u => {
      const uEvents = events.filter(e => String(e.directorId) === String(u.id));
      const completed = uEvents.filter(e => e.status === 'completed');
      const upcoming  = uEvents.filter(e => e.status === 'upcoming');
      const sorted    = [...uEvents].sort((a, b) => (b.date > a.date ? 1 : -1));
      const lastDate  = sorted[0]?.date || null;
      const totalSongs = uEvents.reduce((s, e) => s + (e.songs?.length || 0), 0);

      return {
        id:              u.id,
        name:            u.name,
        initials:        u.initials,
        role:            u.role,
        eventCount:      uEvents.length,
        completedCount:  completed.length,
        upcomingCount:   upcoming.length,
        lastEventDate:   lastDate,
        percentOfTotal:  Math.round(safeDiv(uEvents.length, totalEvents) * 100),
        avgSongsPerEvent: uEvents.length ? Math.round(safeDiv(totalSongs, uEvents.length) * 10) / 10 : 0,
      };
    })
    .sort((a, b) => b.eventCount - a.eventCount);
}

// ─── Ministry Health ──────────────────────────────────────────────────────────

export function computeMinistryHealth(songs = [], events = [], history = []) {
  const totalSongs = songs.length || 1;

  // Variety: unique songs used in last 6 months / total songs
  const sixMonthsAgo = dayjs().subtract(6, 'month');
  const recentHistory = history.filter(h => h.date && dayjs(h.date).isAfter(sixMonthsAgo));
  const uniqueRecent  = new Set(recentHistory.map(h => String(h.songId))).size;
  const variety       = Math.min(100, Math.round(safeDiv(uniqueRecent, totalSongs) * 100));

  // Consistency: completed events in last 12 months / 12 * 100
  const oneYearAgo  = dayjs().subtract(12, 'month');
  const recentDone  = events.filter(e => e.status === 'completed' && e.date && dayjs(e.date).isAfter(oneYearAgo)).length;
  const consistency = Math.min(100, Math.round(safeDiv(recentDone, 12) * 100));

  // Recency: songs used in last 90 days / total
  const recencyCount = songs.filter(s => s.lastUsed && daysSince(s.lastUsed) < 90).length;
  const recency      = Math.min(100, Math.round(safeDiv(recencyCount, totalSongs) * 100));

  // Engagement: avg timesUsed capped at 20
  const avgUses   = songs.reduce((s, x) => s + (x.timesUsed || 0), 0) / totalSongs;
  const engagement = Math.min(100, Math.round(safeDiv(avgUses, 20) * 100));

  const score = Math.round(variety * 0.25 + consistency * 0.25 + recency * 0.25 + engagement * 0.25);
  const grade = score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D';
  const label = { A: 'Excelente', B: 'Bueno', C: 'Regular', D: 'Necesita atención' }[grade];

  return { score, grade, label, breakdown: { variety, consistency, recency, engagement } };
}

// ─── Scheduling Consistency ───────────────────────────────────────────────────

export function computeSchedulingConsistency(events = []) {
  const completed = events.filter(e => e.status === 'completed').sort((a, b) => a.date > b.date ? 1 : -1);
  const monthly   = computeEventsPerMonth(events, 12);

  const mostActive = monthly.reduce((m, x) => x.count > m.count ? x : m, { label: '—', count: 0 });

  let longestGapDays = 0;
  for (let i = 1; i < completed.length; i++) {
    const gap = dayjs(completed[i].date).diff(dayjs(completed[i-1].date), 'day');
    if (gap > longestGapDays) longestGapDays = gap;
  }

  const activeSince = completed[0]?.date || null;
  const monthsActive = activeSince ? Math.max(1, dayjs().diff(dayjs(activeSince), 'month')) : 12;

  return {
    totalEvents:     events.length,
    completedEvents: completed.length,
    avgPerMonth:     Math.round(safeDiv(completed.length, monthsActive) * 10) / 10,
    mostActiveMonth: mostActive,
    longestGapDays,
    activeSince,
  };
}

// ─── Repertoire Health ────────────────────────────────────────────────────────

export function computeRepertoireHealth(songs = [], history = []) {
  const usedIds30  = new Set(history.filter(h => h.date && daysSince(h.date) <= 30).map(h => String(h.songId)));
  const usedIds90  = new Set(history.filter(h => h.date && daysSince(h.date) <= 90).map(h => String(h.songId)));
  const usedIds365 = new Set(history.filter(h => h.date && daysSince(h.date) <= 365).map(h => String(h.songId)));
  const allUsedIds = new Set(history.map(h => String(h.songId)));

  const neverUsed = songs.filter(s => !allUsedIds.has(String(s.id))).length;
  const dormant   = songs.filter(s => s.lastUsed && daysSince(s.lastUsed) > 180).length;
  const avgUses   = songs.length ? Math.round(safeDiv(songs.reduce((a, s) => a + (s.timesUsed || 0), 0), songs.length) * 10) / 10 : 0;

  const sinceVals = songs.map(s => daysSince(s.lastUsed)).filter(d => d < 9999).sort((a, b) => a - b);
  const mid       = Math.floor(sinceVals.length / 2);
  const median    = sinceVals.length ? sinceVals[mid] : 0;

  return {
    total:           songs.length,
    usedLastMonth:   usedIds30.size,
    usedLastQuarter: usedIds90.size,
    usedLastYear:    usedIds365.size,
    neverUsed,
    dormant,
    avgTimesUsed:    avgUses,
    medianDaysSince: median,
  };
}
