import mockUsers from '../data/mockUsers.json';

const KEY = 'ministry_users';

function load() {
  try {
    const s = localStorage.getItem(KEY);
    return s ? JSON.parse(s) : mockUsers;
  } catch {
    return mockUsers;
  }
}

function save(users) {
  try { localStorage.setItem(KEY, JSON.stringify(users)); } catch {}
}

function initials(name) {
  return name
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

export function getAll() {
  return load();
}

export function getActive() {
  return load().filter((u) => u.active);
}

export function getById(id) {
  return load().find((u) => u.id === id) ?? null;
}

export function getByEmail(email) {
  return load().find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export function getDirectors() {
  return load().filter((u) => ['admin', 'lider_directores', 'director'].includes(u.role) && u.active);
}

export function create(data) {
  const users = load();
  if (users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
    throw new Error('Ya existe un usuario con ese correo.');
  }
  const num = users.length + 1;
  const newUser = {
    id: `usr_${String(num).padStart(3, '0')}_${Date.now()}`,
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    password: data.password || '123456',
    role: data.role || 'musico',
    title: data.title?.trim() || '',
    initials: initials(data.name),
    avatar: null,
    active: true,
  };
  users.push(newUser);
  save(users);
  return newUser;
}

export function update(id, changes) {
  const users = load();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  const updated = {
    ...users[idx],
    ...changes,
    id,
    initials: changes.name ? initials(changes.name) : users[idx].initials,
  };
  users[idx] = updated;
  save(users);
  return updated;
}

export function deactivate(id) {
  return update(id, { active: false });
}

export function activate(id) {
  return update(id, { active: true });
}

export function remove(id) {
  const users = load();
  save(users.filter((u) => u.id !== id));
  return true;
}
