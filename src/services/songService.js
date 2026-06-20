import { supabase } from '../lib/supabase';

function fromRow(r) {
  return {
    id: r.id,
    title: r.title,
    author: r.author || '',
    key: r.key,
    tempo: r.tempo,
    genre: r.genre,
    language: r.language,
    lastUsed: r.last_used,
    timesUsed: r.times_used,
    tags: r.tags || [],
  };
}

export async function getAll() {
  const { data, error } = await supabase.from('songs').select('*').order('title');
  if (error) throw error;
  return data.map(fromRow);
}

export async function getById(id) {
  const { data, error } = await supabase.from('songs').select('*').eq('id', id).single();
  if (error) return null;
  return fromRow(data);
}

export async function create(data) {
  const { data: row, error } = await supabase
    .from('songs')
    .insert({
      title: data.title.trim(),
      author: data.author?.trim() || '',
      key: data.key || 'C',
      tempo: Number(data.tempo) || 80,
      genre: data.genre || 'Contemporáneo',
      language: data.language || 'Español',
      last_used: null,
      times_used: 0,
      tags: Array.isArray(data.tags) ? data.tags : [],
    })
    .select()
    .single();
  if (error) throw error;
  return fromRow(row);
}

export async function update(id, changes) {
  const patch = {};
  if (changes.title !== undefined)     patch.title      = changes.title;
  if (changes.author !== undefined)    patch.author     = changes.author;
  if (changes.key !== undefined)       patch.key        = changes.key;
  if (changes.tempo !== undefined)     patch.tempo      = Number(changes.tempo);
  if (changes.genre !== undefined)     patch.genre      = changes.genre;
  if (changes.language !== undefined)  patch.language   = changes.language;
  if (changes.lastUsed !== undefined)  patch.last_used  = changes.lastUsed;
  if (changes.timesUsed !== undefined) patch.times_used = changes.timesUsed;
  if (changes.tags !== undefined)      patch.tags       = changes.tags;

  const { data: row, error } = await supabase
    .from('songs').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return fromRow(row);
}

export async function remove(id) {
  const { error } = await supabase.from('songs').delete().eq('id', id);
  if (error) throw error;
  return true;
}
