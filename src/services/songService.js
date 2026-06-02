import mockSongs from '../data/mockSongs.json';

const KEY = 'ministry_songs';

function load() {
  try {
    const s = localStorage.getItem(KEY);
    return s ? JSON.parse(s) : mockSongs;
  } catch {
    return mockSongs;
  }
}

function save(songs) {
  try { localStorage.setItem(KEY, JSON.stringify(songs)); } catch {}
}

export function getAll() {
  return load().sort((a, b) => a.title.localeCompare(b.title));
}

export function getById(id) {
  return load().find((s) => s.id === id) ?? null;
}

export function create(data) {
  const songs = load();
  const maxId = songs.reduce((m, s) => Math.max(m, Number(s.id) || 0), 0);
  const newSong = {
    id: maxId + 1,
    title: data.title.trim(),
    author: data.author?.trim() || '',
    key: data.key || 'C',
    tempo: Number(data.tempo) || 80,
    genre: data.genre || 'Contemporáneo',
    language: data.language || 'Español',
    lastUsed: null,
    timesUsed: 0,
    tags: Array.isArray(data.tags) ? data.tags : [],
  };
  songs.push(newSong);
  save(songs);
  return newSong;
}

export function update(id, changes) {
  const songs = load();
  const idx = songs.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  const updated = { ...songs[idx], ...changes, id };
  songs[idx] = updated;
  save(songs);
  return updated;
}

export function remove(id) {
  const songs = load();
  const filtered = songs.filter((s) => s.id !== id);
  save(filtered);
  return true;
}
