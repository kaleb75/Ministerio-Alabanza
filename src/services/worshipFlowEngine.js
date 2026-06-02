import dayjs from 'dayjs';

export const SERVICE_PROFILES = {
  'Culto Principal':  { preferredGenres:['Himno','Contemporáneo','Balada'],  tagBoost:['adoración','trinidad','gloria'],       },
  'Servicio Midweek': { preferredGenres:['Contemporáneo','Balada'],           tagBoost:['oración','espiritu','comunión'],      },
  'Jóvenes':          { preferredGenres:['Contemporáneo','Coro'],             tagBoost:['jovenes','alabanza','poder'],          },
  'Conferencia':      { preferredGenres:['Contemporáneo','Himno','Balada'],   tagBoost:['adoración','avivamiento','esperanza'], },
  'Especial':         { preferredGenres:['Especial','Himno','Contemporáneo'], tagBoost:['gloria','trinidad','adoración'],       },
  'Otro':             { preferredGenres:['Contemporáneo','Himno'],            tagBoost:['adoración','alabanza'],               },
};

export const MUSICAL_KEYS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

export function scoreSong(song, options = {}) {
  const { serviceType = 'Culto Principal', themeTag = '', songHistory = [], excludeIds = [] } = options;
  if (excludeIds.includes(song.id)) return { ...song, score: -1, reasons: [] };

  const profile = SERVICE_PROFILES[serviceType] || SERVICE_PROFILES['Culto Principal'];
  let score = 0;
  const reasons = [];

  // Freshness (0-40)
  const lastEntry = (songHistory || [])
    .filter(h => String(h.songId) === String(song.id))
    .sort((a, b) => (a.date > b.date ? -1 : 1))[0];
  const days = lastEntry ? dayjs().diff(dayjs(lastEntry.date), 'day') : 999;
  score += Math.min(40, (days / 90) * 40);
  if (days > 180)    reasons.push(`Sin usar en ${Math.round(days)} días`);
  else if (days > 60) reasons.push(`${Math.round(days)} días sin usarse`);
  else if (days === 999) reasons.push('Nunca usada en un servicio');

  // Genre fit (0-25)
  if (profile.preferredGenres.includes(song.genre)) {
    score += 25;
    reasons.push(`Ideal para ${serviceType}`);
  }

  // Tag relevance (0-20)
  const tags = song.tags || [];
  const tagHits = tags.filter(t => profile.tagBoost.includes(t)).length;
  score += Math.min(20, tagHits * 7);
  if (tagHits > 0) reasons.push('Etiquetas relevantes');

  // Theme match (0-15)
  if (themeTag && tags.includes(themeTag)) {
    score += 15;
    reasons.push(`Tema: ${themeTag}`);
  }

  return { ...song, score: Math.round(Math.min(100, score)), reasons };
}

export function recommendSet(options = {}) {
  const { songs = [], setSize = 4 } = options;
  return songs
    .map(s => scoreSong(s, options))
    .filter(s => s.score >= 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(setSize * 4, 12));
}

export function scoreWorshipFlow(songIds = [], songs = []) {
  if (!songIds.length) return { score: 0, grade: 'D', issues: ['Set vacío'], suggestions: ['Agrega canciones al set'] };

  const setList = songIds.map(id => songs.find(s => s.id === id)).filter(Boolean);
  const issues = [], suggestions = [];
  let deductions = 0;

  for (let i = 1; i < setList.length; i++) {
    if (setList[i].key && setList[i].key === setList[i - 1].key) {
      issues.push(`Canciones ${i} y ${i + 1}: misma tonalidad (${setList[i].key})`);
      deductions += 15;
    }
  }

  const uniqueGenres = new Set(setList.map(s => s.genre).filter(Boolean)).size;
  if (uniqueGenres === 1 && setList.length > 2) {
    issues.push('Todas las canciones son del mismo género');
    suggestions.push('Mezcla géneros para mayor variedad de adoración');
    deductions += 20;
  }

  if (setList.length > 7) { issues.push('Set muy largo (>7 canciones)'); deductions += 10; }
  if (setList.length < 3) { suggestions.push('Considera agregar más canciones (mínimo 3)'); }

  const score = Math.max(0, 100 - deductions);
  const grade = score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D';
  return { score, grade, issues, suggestions };
}

export function getComplementarySongs(songId, songs = [], n = 3) {
  const source = songs.find(s => s.id === songId);
  if (!source) return [];
  const keyIdx = MUSICAL_KEYS.indexOf(source.key);

  return songs
    .filter(s => s.id !== songId)
    .map(s => {
      let compat = 0;
      const sIdx = MUSICAL_KEYS.indexOf(s.key);
      if (keyIdx >= 0 && sIdx >= 0) {
        const diff = Math.min(Math.abs(keyIdx - sIdx), 12 - Math.abs(keyIdx - sIdx));
        if (diff <= 2) compat += 30;
        else if (diff <= 4) compat += 15;
      }
      const overlap = (source.tags || []).filter(t => (s.tags || []).includes(t)).length;
      compat += overlap * 12;
      if (s.genre !== source.genre) compat += 8;
      return { ...s, compatibility: compat };
    })
    .sort((a, b) => b.compatibility - a.compatibility)
    .slice(0, n);
}
