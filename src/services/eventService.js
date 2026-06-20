import { supabase } from '../lib/supabase';

function fromRow(r) {
  return {
    id: r.id,
    title: r.title,
    date: r.date,
    time: r.time,
    type: r.type,
    directorId: r.director_id,
    directorName: r.director_name || '',
    songs: r.songs || [],
    status: r.status,
    notes: r.notes || '',
  };
}

export async function getAll() {
  const { data, error } = await supabase.from('events').select('*').order('date', { ascending: false });
  if (error) throw error;
  return data.map(fromRow);
}

export async function getById(id) {
  const { data, error } = await supabase.from('events').select('*').eq('id', id).single();
  if (error) return null;
  return fromRow(data);
}

export async function create(data) {
  const { data: row, error } = await supabase
    .from('events')
    .insert({
      title: data.title.trim(),
      date: data.date,
      time: data.time || '10:00',
      type: data.type || 'Culto Principal',
      director_id: data.directorId || null,
      director_name: data.directorName || '',
      songs: Array.isArray(data.songs) ? data.songs : [],
      status: data.status || 'upcoming',
      notes: data.notes?.trim() || '',
    })
    .select()
    .single();
  if (error) throw error;
  return fromRow(row);
}

export async function update(id, changes) {
  const patch = {};
  if (changes.title !== undefined)        patch.title         = changes.title;
  if (changes.date !== undefined)         patch.date          = changes.date;
  if (changes.time !== undefined)         patch.time          = changes.time;
  if (changes.type !== undefined)         patch.type          = changes.type;
  if (changes.directorId !== undefined)   patch.director_id   = changes.directorId;
  if (changes.directorName !== undefined) patch.director_name = changes.directorName;
  if (changes.songs !== undefined)        patch.songs         = changes.songs;
  if (changes.status !== undefined)       patch.status        = changes.status;
  if (changes.notes !== undefined)        patch.notes         = changes.notes;

  const { data: row, error } = await supabase
    .from('events').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return fromRow(row);
}

export async function remove(id) {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function updateStatus(id, status) {
  return update(id, { status });
}
