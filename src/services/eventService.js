import { supabase } from '../lib/supabase';

function defaultResponsibilities() {
  return [
    { id: 'resp_1', type: 'director_principal',  assignedUserId: null, assignedUserName: '', notes: '' },
    { id: 'resp_2', type: 'director_secundario', assignedUserId: null, assignedUserName: '', notes: '' },
    { id: 'resp_3', type: 'proyeccion',           assignedUserId: null, assignedUserName: '', notes: '' },
    { id: 'resp_4', type: 'streaming',            assignedUserId: null, assignedUserName: '', notes: '' },
    { id: 'resp_5', type: 'predicador',           assignedUserId: null, assignedUserName: '', notes: '' },
  ];
}

function fromRow(r) {
  const responsibilities = r.service_responsibilities || r.serviceResponsibilities || defaultResponsibilities();
  const primaryResp = responsibilities.find((x) => x.type === 'director_principal');

  return {
    id: r.id,
    title: r.title,
    date: r.date,
    time: r.time,
    type: r.type,
    directorId:   primaryResp?.assignedUserId   ?? r.director_id   ?? null,
    directorName: primaryResp?.assignedUserName ?? r.director_name ?? '',
    songs: r.songs || [],
    status: r.status,
    notes: r.notes || '',
    serviceResponsibilities: responsibilities,
    sermon: r.sermon || { preacherId: null, title: '', book: '', chapter: '', verses: '' },
    bibleReading: r.bible_reading || r.bibleReading || { book: '', chapter: '', verses: '' },
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
  const responsibilities = data.serviceResponsibilities || defaultResponsibilities();
  const primaryResp = responsibilities.find((x) => x.type === 'director_principal');

  const { data: row, error } = await supabase
    .from('events')
    .insert({
      title: data.title.trim(),
      date: data.date,
      time: data.time || '10:00',
      type: data.type || 'Culto Principal',
      director_id:   primaryResp?.assignedUserId   ?? data.directorId   ?? null,
      director_name: primaryResp?.assignedUserName ?? data.directorName ?? '',
      songs: Array.isArray(data.songs) ? data.songs : [],
      status: data.status || 'upcoming',
      notes: data.notes?.trim() || '',
      service_responsibilities: responsibilities,
      sermon: data.sermon || { preacherId: null, title: '', book: '', chapter: '', verses: '' },
      bible_reading: data.bibleReading || { book: '', chapter: '', verses: '' },
    })
    .select()
    .single();
  if (error) throw error;
  return fromRow(row);
}

export async function update(id, changes) {
  const patch = {};
  if (changes.title !== undefined)     patch.title  = changes.title;
  if (changes.date !== undefined)      patch.date   = changes.date;
  if (changes.time !== undefined)      patch.time   = changes.time;
  if (changes.type !== undefined)      patch.type   = changes.type;
  if (changes.songs !== undefined)     patch.songs  = changes.songs;
  if (changes.status !== undefined)    patch.status = changes.status;
  if (changes.notes !== undefined)     patch.notes  = changes.notes;
  if (changes.sermon !== undefined)    patch.sermon = changes.sermon;
  if (changes.bibleReading !== undefined) patch.bible_reading = changes.bibleReading;
  if (changes.serviceResponsibilities !== undefined) {
    patch.service_responsibilities = changes.serviceResponsibilities;
    const primary = changes.serviceResponsibilities.find((x) => x.type === 'director_principal');
    if (primary) {
      patch.director_id   = primary.assignedUserId   ?? null;
      patch.director_name = primary.assignedUserName ?? '';
    }
  }
  if (changes.directorId !== undefined)   patch.director_id   = changes.directorId;
  if (changes.directorName !== undefined) patch.director_name = changes.directorName;

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
