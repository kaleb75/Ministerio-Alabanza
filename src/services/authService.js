import { supabase } from '../lib/supabase';

const STORAGE_KEYS = {
  USER: 'ministry_auth_user',
  TOKEN: 'ministry_auth_token',
};

export async function authenticate(email, password) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .ilike('email', email)
    .eq('active', true)
    .single();

  if (error || !data) return null;
  if (data.password !== password) return null;

  const { password: _pw, ...safeUser } = data;
  return safeUser;
}

export function saveSession(user) {
  const token = `token_${user.id}_${user.role}`;
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
