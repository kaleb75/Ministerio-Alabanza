import { supabase } from '../lib/supabase';

function initials(name) {
  if (!name) return '';
  return name.trim().split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
}

function normalizeUser(row) {
  if (!row) return null;
  const roles = Array.isArray(row.roles) && row.roles.length > 0
    ? row.roles
    : (row.role ? [row.role] : []);
  const primaryRole = roles[0] || 'solo_lectura';
  return {
    ...row,
    roles,
    role: primaryRole,
    firstName: row.first_name || row.firstName || (row.name ? row.name.split(' ')[0] : ''),
    lastName:  row.last_name  || row.lastName  || (row.name ? row.name.split(' ').slice(1).join(' ') : ''),
    displayName: row.display_name || row.displayName || row.name || '',
  };
}

export async function getAll() {
  const { data, error } = await supabase.from('users').select('*').order('name');
  if (error) throw error;
  return data.map(normalizeUser);
}

export async function getActive() {
  const { data, error } = await supabase.from('users').select('*').eq('active', true).order('name');
  if (error) throw error;
  return data.map(normalizeUser);
}

export async function getById(id) {
  const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
  if (error) return null;
  return normalizeUser(data);
}

export async function getByEmail(email) {
  const { data, error } = await supabase
    .from('users').select('*').ilike('email', email).single();
  if (error) return null;
  return normalizeUser(data);
}

export async function getUsersByRoles(requiredRoles) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('active', true)
    .order('name');
  if (error) throw error;
  const users = data.map(normalizeUser);
  return users.filter((u) =>
    u.roles.some((r) => requiredRoles.includes(r))
  );
}

export async function getDirectors() {
  return getUsersByRoles(['admin', 'lider_directores', 'director']);
}

export async function create(data) {
  if (!data.name) throw new Error('El nombre es obligatorio.');
  const existing = await getByEmail(data.email);
  if (existing) throw new Error('Ya existe un usuario con ese correo.');

  const roles = Array.isArray(data.roles) && data.roles.length > 0
    ? data.roles
    : [data.role || 'musico'];
  const primaryRole = roles[0];

  const num = Date.now();
  const { data: row, error } = await supabase
    .from('users')
    .insert({
      id: 'usr_' + String(num).slice(-6) + '_' + Math.random().toString(36).slice(2, 6),
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password || '123456',
      role: primaryRole,
      roles: roles,
      title: data.title?.trim() || '',
      initials: initials(data.name),
      avatar: null,
      active: true,
    })
    .select()
    .single();
  if (error) throw error;
  return normalizeUser(row);
}

export async function update(id, changes) {
  const patch = { ...changes };
  if (changes.name) patch.initials = initials(changes.name);
  if (Array.isArray(changes.roles) && changes.roles.length > 0) {
    patch.role = changes.roles[0];
  }
  delete patch.id;

  const { data: row, error } = await supabase
    .from('users').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return normalizeUser(row);
}

export async function deactivate(id) {
  return update(id, { active: false });
}

export async function activate(id) {
  return update(id, { active: true });
}

export async function remove(id) {
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) throw error;
  return true;
}
