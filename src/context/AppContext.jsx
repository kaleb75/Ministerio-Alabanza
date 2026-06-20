import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as songSvc from '../services/songService';
import * as eventSvc from '../services/eventService';
import * as userSvc from '../services/userService';
import { supabase } from '../lib/supabase';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [songs, setSongs]             = useState([]);
  const [events, setEvents]           = useState([]);
  const [users, setUsers]             = useState([]);
  const [songHistory, setSongHistory] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);
  const closeSidebar  = useCallback(() => setSidebarOpen(false), []);

  // ── Initial load from Supabase ─────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      songSvc.getAll(),
      eventSvc.getAll(),
      userSvc.getAll(),
      supabase.from('song_history').select('*').order('date', { ascending: false }),
    ])
      .then(([s, e, u, histResult]) => {
        setSongs(s);
        setEvents(e);
        setUsers(u);
        setSongHistory(
          (histResult.data || []).map((r) => ({
            id: r.id,
            songId: r.song_id,
            date: r.date,
            eventTitle: r.event_title,
            eventType: r.event_type,
            directorName: r.director_name,
          }))
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // ── Song CRUD ──────────────────────────────────────────────────────────────
  const addSong = useCallback(async (data) => {
    const created = await songSvc.create(data);
    setSongs(await songSvc.getAll());
    return created;
  }, []);

  const updateSong = useCallback(async (id, changes) => {
    const updated = await songSvc.update(id, changes);
    setSongs(await songSvc.getAll());
    return updated;
  }, []);

  const deleteSong = useCallback(async (id) => {
    await songSvc.remove(id);
    setSongs(await songSvc.getAll());
  }, []);

  const refreshSongs = useCallback(async () => {
    setSongs(await songSvc.getAll());
  }, []);

  // ── Event CRUD ─────────────────────────────────────────────────────────────
  const addEvent = useCallback(async (data) => {
    const created = await eventSvc.create(data);
    setEvents(await eventSvc.getAll());
    return created;
  }, []);

  const updateEvent = useCallback(async (id, changes) => {
    const updated = await eventSvc.update(id, changes);
    setEvents(await eventSvc.getAll());
    return updated;
  }, []);

  const deleteEvent = useCallback(async (id) => {
    await eventSvc.remove(id);
    setEvents(await eventSvc.getAll());
  }, []);

  const updateEventStatus = useCallback(async (id, status) => {
    await eventSvc.updateStatus(id, status);
    setEvents(await eventSvc.getAll());
  }, []);

  // ── User CRUD ──────────────────────────────────────────────────────────────
  const addUser = useCallback(async (data) => {
    const created = await userSvc.create(data);
    setUsers(await userSvc.getAll());
    return created;
  }, []);

  const updateUser = useCallback(async (id, changes) => {
    const updated = await userSvc.update(id, changes);
    setUsers(await userSvc.getAll());
    return updated;
  }, []);

  const deleteUser = useCallback(async (id) => {
    await userSvc.remove(id);
    setUsers(await userSvc.getAll());
  }, []);

  const toggleUserActive = useCallback(async (id, active) => {
    active ? await userSvc.activate(id) : await userSvc.deactivate(id);
    setUsers(await userSvc.getAll());
  }, []);

  // ── Song History ───────────────────────────────────────────────────────────
  const addSongHistory = useCallback(async (entry) => {
    const id = `hist_${Date.now()}`;
    await supabase.from('song_history').insert({
      id,
      song_id: entry.songId,
      date: entry.date,
      event_title: entry.eventTitle,
      event_type: entry.eventType,
      director_name: entry.directorName,
    });
    const newEntry = { id, ...entry };
    setSongHistory((prev) => [newEntry, ...prev]);
    return newEntry;
  }, []);

  // ── Refresh all from Supabase ──────────────────────────────────────────────
  const refreshAll = useCallback(async () => {
    const [s, e, u] = await Promise.all([
      songSvc.getAll(),
      eventSvc.getAll(),
      userSvc.getAll(),
    ]);
    setSongs(s);
    setEvents(e);
    setUsers(u);
  }, []);

  const upcomingEvents = events
    .filter((e) => e.status === 'upcoming')
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const nextEvent = upcomingEvents[0] ?? null;

  return (
    <AppContext.Provider value={{
      songs, events, users, songHistory,
      upcomingEvents, nextEvent,
      loading,
      addSong, updateSong, deleteSong, refreshSongs,
      addEvent, updateEvent, deleteEvent, updateEventStatus,
      addUser, updateUser, deleteUser, toggleUserActive,
      addSongHistory,
      refreshAll,
      sidebarOpen, toggleSidebar, closeSidebar,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
};

export default AppContext;
