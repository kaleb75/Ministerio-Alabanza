import { createContext, useContext, useState, useCallback, useRef } from 'react';
import mockSongHistory from '../data/mockSongHistory.json';
import * as songSvc from '../services/songService';
import * as eventSvc from '../services/eventService';
import * as userSvc from '../services/userService';
import { fileDB } from '../services/fileSystemDB';

const HISTORY_KEY = 'ministry_song_history';

function loadHistory() {
  try {
    const s = localStorage.getItem(HISTORY_KEY);
    return s ? JSON.parse(s) : mockSongHistory;
  } catch { return mockSongHistory; }
}
function saveHistory(h) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h)); } catch {}
}

// Fire-and-forget file sync — never blocks the UI
async function syncFile(table, data) {
  if (fileDB.isConnected) {
    try { await fileDB.writeTable(table, data); } catch {}
  }
}

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [songs, setSongs] = useState(() => songSvc.getAll());
  const [events, setEvents] = useState(() => eventSvc.getAll());
  const [users, setUsers] = useState(() => userSvc.getAll());
  const [songHistory, setSongHistory] = useState(() => loadHistory());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  // ── Song CRUD ──────────────────────────────────────────────────────────────
  const addSong = useCallback((data) => {
    const created = songSvc.create(data);
    const all = songSvc.getAll();
    setSongs(all);
    syncFile('songs', all);
    return created;
  }, []);

  const updateSong = useCallback((id, changes) => {
    const updated = songSvc.update(id, changes);
    if (updated) {
      const all = songSvc.getAll();
      setSongs(all);
      syncFile('songs', all);
    }
    return updated;
  }, []);

  const deleteSong = useCallback((id) => {
    songSvc.remove(id);
    const all = songSvc.getAll();
    setSongs(all);
    syncFile('songs', all);
  }, []);

  const refreshSongs = useCallback(() => setSongs(songSvc.getAll()), []);

  // ── Event CRUD ─────────────────────────────────────────────────────────────
  const addEvent = useCallback((data) => {
    const created = eventSvc.create(data);
    const all = eventSvc.getAll();
    setEvents(all);
    syncFile('events', all);
    return created;
  }, []);

  const updateEvent = useCallback((id, changes) => {
    const updated = eventSvc.update(id, changes);
    if (updated) {
      const all = eventSvc.getAll();
      setEvents(all);
      syncFile('events', all);
    }
    return updated;
  }, []);

  const deleteEvent = useCallback((id) => {
    eventSvc.remove(id);
    const all = eventSvc.getAll();
    setEvents(all);
    syncFile('events', all);
  }, []);

  const updateEventStatus = useCallback((id, status) => {
    eventSvc.updateStatus(id, status);
    const all = eventSvc.getAll();
    setEvents(all);
    syncFile('events', all);
  }, []);

  // ── User CRUD ──────────────────────────────────────────────────────────────
  const addUser = useCallback((data) => {
    const created = userSvc.create(data);
    const all = userSvc.getAll();
    setUsers(all);
    syncFile('users', all);
    return created;
  }, []);

  const updateUser = useCallback((id, changes) => {
    const updated = userSvc.update(id, changes);
    if (updated) {
      const all = userSvc.getAll();
      setUsers(all);
      syncFile('users', all);
    }
    return updated;
  }, []);

  const deleteUser = useCallback((id) => {
    userSvc.remove(id);
    const all = userSvc.getAll();
    setUsers(all);
    syncFile('users', all);
  }, []);

  const toggleUserActive = useCallback((id, active) => {
    active ? userSvc.activate(id) : userSvc.deactivate(id);
    const all = userSvc.getAll();
    setUsers(all);
    syncFile('users', all);
  }, []);

  // ── Song History ───────────────────────────────────────────────────────────
  const addSongHistory = useCallback((entry) => {
    const newEntry = { id: `hist_${Date.now()}`, ...entry };
    setSongHistory((prev) => {
      const updated = [newEntry, ...prev];
      saveHistory(updated);
      syncFile('songHistory', updated);
      return updated;
    });
    return newEntry;
  }, []);

  // ── Refresh all from localStorage (called after FileDB loads files) ────────
  const refreshAll = useCallback(() => {
    setSongs(songSvc.getAll());
    setEvents(eventSvc.getAll());
    setUsers(userSvc.getAll());
    setSongHistory(loadHistory());
  }, []);

  const upcomingEvents = events
    .filter((e) => e.status === 'upcoming')
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const nextEvent = upcomingEvents[0] ?? null;

  return (
    <AppContext.Provider value={{
      songs, events, users, songHistory,
      upcomingEvents, nextEvent,
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
