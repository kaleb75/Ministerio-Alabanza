import mockEvents from '../data/mockEvents.json';

const KEY = 'ministry_events';

function load() {
  try {
    const s = localStorage.getItem(KEY);
    return s ? JSON.parse(s) : mockEvents;
  } catch {
    return mockEvents;
  }
}

function save(events) {
  try { localStorage.setItem(KEY, JSON.stringify(events)); } catch {}
}

export function getAll() {
  return load();
}

export function getById(id) {
  return load().find((e) => e.id === id) ?? null;
}

export function create(data) {
  const events = load();
  const maxId = events.reduce((m, e) => Math.max(m, Number(e.id) || 0), 0);
  const newEvent = {
    id: maxId + 1,
    title: data.title.trim(),
    date: data.date,
    time: data.time || '10:00',
    type: data.type || 'Culto Principal',
    directorId: data.directorId || null,
    directorName: data.directorName || '',
    songs: Array.isArray(data.songs) ? data.songs : [],
    status: data.status || 'upcoming',
    notes: data.notes?.trim() || '',
  };
  events.push(newEvent);
  save(events);
  return newEvent;
}

export function update(id, changes) {
  const events = load();
  const idx = events.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  const updated = { ...events[idx], ...changes, id };
  events[idx] = updated;
  save(events);
  return updated;
}

export function remove(id) {
  const events = load();
  save(events.filter((e) => e.id !== id));
  return true;
}

export function updateStatus(id, status) {
  return update(id, { status });
}
