import { supabase } from '../lib/supabase';

function initials(name) {
  if (!name) return '';
  return name.trim().split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
}

export async function getAll() {
  const { data, error } = await supabase.from('users').select('*').order('name');
  if (error) throw error;
  return data;
}

export async function getActive() {
  const { data, error } = await supabase.from('users').select('*').eq('active', true).order('name');
  if (error) throw error;
  return data;
}

export async function getById(id) {
  const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
  if (error) return null;
  return data;
}

export async function getByEmail(email) {
  const { data, error } = await supabase
    .from('users').select('*').ilike('email', email).single();
  if (error) return null;
  return data;
}

export async function getDirectors() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .in('role', ['admin', 'lider_directores', 'director'])
    .eq('active', true)
    .order('name');
  if (error) throw error;
  return data;
}

export async function create(data) {
  if (!data.name) throw new Error('El nombre es obligatorio.');
  const existing = await getByEmail(data.email);
  if (existing) throw new Error('Ya existe un usuario con ese correo.');

  const num = Date.now();
  const { data: row, error } = await supabase
    .from('users')
    .insert({
      id: `usr_${String(num).slice(-6)}_${Math.random().toString(36).slice(2, 6)}`,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password || '123456',
      role: data.role || 'musico',
      title: data.title?.trim() || '',
      initials: initials(data.name),
      avatar: null,
      active: true,
    })
    .select()
    .single();
  if (error) throw error;
  return row;
}

export async function update(id, changes) {
  const patch = { ...changes };
  if (changes.name) patch.initials = initials(changes.name);
  delete patch.id;

  const { data: row, error } = await supabase
    .from('users').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return row;
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
