import mockUsers from '../data/mockUsers.json';

const STORAGE_KEYS = {
  USER: 'ministry_auth_user',
  TOKEN: 'ministry_auth_token',
};

export function authenticate(email, password) {
  const found = mockUsers.find(
    (u) => u.email === email && u.password === password && u.active
  );
  if (!found) return null;
  const { password: _pw, ...safeUser } = found;
  return safeUser;
}

export function saveSession(user) {
  const token = `mock_${user.id}_${user.role}`;
  try {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  } catch {}
  return token;
}

export function restoreSession() {
  try {
    const raw   = localStorage.getItem(STORAGE_KEYS.USER);
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!raw || !token) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
  } catch {}
}
