/**
 * Script de seed para poblar Supabase con los datos mock.
 * Ejecutar una sola vez desde el navegador o como módulo ES.
 *
 * Uso: importar en main.jsx temporalmente, o ejecutar en la consola del browser.
 */

import { supabase } from '../lib/supabase';
import mockSongs from '../data/mockSongs.json';
import mockEvents from '../data/mockEvents.json';
import mockUsers from '../data/mockUsers.json';
import mockSongHistory from '../data/mockSongHistory.json';

export async function seedAll() {
  console.log('🌱 Iniciando seed...');

  // Users
  const { error: uErr } = await supabase.from('users').upsert(
    mockUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      password: u.password,
      role: u.role,
      title: u.title || '',
      initials: u.initials || '',
      avatar: u.avatar || null,
      active: u.active,
    })),
    { onConflict: 'id' }
  );
  if (uErr) { console.error('Users error:', uErr); return; }
  console.log(`✅ ${mockUsers.length} usuarios insertados`);

  // Songs
  const { error: sErr } = await supabase.from('songs').upsert(
    mockSongs.map((s) => ({
      id: s.id,
      title: s.title,
      author: s.author || '',
      key: s.key,
      tempo: s.tempo,
      genre: s.genre,
      language: s.language,
      last_used: s.lastUsed || null,
      times_used: s.timesUsed || 0,
      tags: s.tags || [],
    })),
    { onConflict: 'id' }
  );
  if (sErr) { console.error('Songs error:', sErr); return; }
  console.log(`✅ ${mockSongs.length} canciones insertadas`);

  // Events — director_id may not match users, set null if missing
  const userIds = new Set(mockUsers.map((u) => u.id));
  const { error: eErr } = await supabase.from('events').upsert(
    mockEvents.map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      time: e.time || '10:00',
      type: e.type,
      director_id: userIds.has(e.directorId) ? e.directorId : null,
      director_name: e.directorName || '',
      songs: e.songs || [],
      status: e.status,
      notes: e.notes || '',
    })),
    { onConflict: 'id' }
  );
  if (eErr) { console.error('Events error:', eErr); return; }
  console.log(`✅ ${mockEvents.length} eventos insertados`);

  // Song History — only entries whose song_id exists
  const songIds = new Set(mockSongs.map((s) => s.id));
  const validHistory = mockSongHistory.filter((h) => songIds.has(h.songId));
  const { error: hErr } = await supabase.from('song_history').upsert(
    validHistory.map((h) => ({
      id: h.id,
      song_id: h.songId,
      date: h.date,
      event_title: h.eventTitle,
      event_type: h.eventType,
      director_name: h.directorName,
    })),
    { onConflict: 'id' }
  );
  if (hErr) { console.error('Song history error:', hErr); return; }
  console.log(`✅ ${validHistory.length} registros de historial insertados`);

  console.log('🎉 Seed completo!');
}
