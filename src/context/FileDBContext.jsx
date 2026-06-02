/**
 * FileDBContext — archivos JSON como base de datos primaria.
 *
 * STATUS:
 *   'booting'      → intentando reconectar al directorio guardado
 *   'needs-setup'  → sin carpeta conectada (primera vez o permiso revocado)
 *   'reconnect'    → handle guardado pero necesita permiso del usuario (botón)
 *   'loading'      → leyendo archivos al directorio
 *   'ready'        → app lista, archivos son la fuente de verdad
 *   'error'        → error inesperado
 *
 * FLUJO:
 *   Startup → reconnect → leer archivos → escribir localStorage → app inicia
 *   Cambio  → escribir localStorage (sync) + escribir archivo (async)
 *   Reload  → reconnect → leer archivos → sobreescribir localStorage → app inicia
 */

import {
  createContext, useContext, useState, useEffect, useCallback, useRef,
} from 'react';
import { fileDB } from '../services/fileSystemDB';
import { idbGet, idbSet } from '../services/idbHelper';

import mockSongs         from '../data/mockSongs.json';
import mockEvents        from '../data/mockEvents.json';
import mockUsers         from '../data/mockUsers.json';
import mockSongHistory   from '../data/mockSongHistory.json';
import mockRequests      from '../data/mockRequests.json';
import mockNotifications from '../data/mockNotifications.json';
import mockAuditLogs     from '../data/mockAuditLogs.json';

const SEED_DATA = {
  songs:         mockSongs,
  events:        mockEvents,
  users:         mockUsers,
  songHistory:   mockSongHistory,
  requests:      mockRequests,
  notifications: mockNotifications,
  auditLogs:     mockAuditLogs,
};

const LS_KEYS = {
  songs:         'ministry_songs',
  events:        'ministry_events',
  users:         'ministry_users',
  songHistory:   'ministry_song_history',
  requests:      'ministry_requests',
  notifications: 'ministry_notifications',
  auditLogs:     'ministry_audit_logs',
};

/** Write a full dataset from files into localStorage so services can read it */
function pushToLocalStorage(data) {
  for (const [table, key] of Object.entries(LS_KEYS)) {
    if (Array.isArray(data[table])) {
      try { localStorage.setItem(key, JSON.stringify(data[table])); } catch {}
    }
  }
}

/** Read all tables from localStorage into a plain object */
function pullFromLocalStorage() {
  const out = {};
  for (const [table, key] of Object.entries(LS_KEYS)) {
    try {
      const raw = localStorage.getItem(key);
      out[table] = raw ? JSON.parse(raw) : SEED_DATA[table] ?? [];
    } catch { out[table] = SEED_DATA[table] ?? []; }
  }
  return out;
}

const FileDBContext = createContext(null);

export function FileDBProvider({ children, onReady }) {
  const [status,     setStatus]     = useState('booting');   // see states above
  const [folderName, setFolderName] = useState(null);
  const [error,      setError]      = useState('');
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  // ── Boot sequence ────────────────────────────────────────────────────────
  useEffect(() => {
    boot();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function boot() {
    if (!fileDB.isSupported) {
      // Browser doesn't support File System API → fall back to localStorage
      setStatus('ready');
      onReadyRef.current?.();
      return;
    }

    setStatus('booting');
    const ok = await fileDB.reconnect();

    if (ok) {
      await loadFromFiles();
    } else {
      // Check if we have a saved handle that just needs permission re-grant
      const savedHandle = await idbGet('fsdb_dir_handle');
      setStatus(savedHandle ? 'reconnect' : 'needs-setup');
    }
  }

  async function loadFromFiles() {
    setStatus('loading');
    setFolderName(fileDB.folderName);
    try {
      const data = await fileDB.readAll();
      // Write to localStorage so all existing services pick it up
      pushToLocalStorage(data);
      setStatus('ready');
      onReadyRef.current?.();
    } catch (e) {
      setError('Error al leer archivos: ' + e.message);
      setStatus('error');
    }
  }

  // ── Setup: first time or after permission lost ────────────────────────────
  const setup = useCallback(async () => {
    setError('');
    const result = await fileDB.connect();
    if (!result.ok) {
      setError(result.error);
      return false;
    }

    setFolderName(result.folderName);

    // Create files that don't exist yet with initial seed data
    await fileDB.initMissing(SEED_DATA);

    // Load the (possibly just-created) files into localStorage
    await loadFromFiles();
    return true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Re-grant permission when handle exists but was suspended ─────────────
  const regrant = useCallback(async () => {
    setError('');
    try {
      const handle = await idbGet('fsdb_dir_handle');
      if (!handle) { setStatus('needs-setup'); return false; }
      const perm = await handle.requestPermission({ mode: 'readwrite' });
      if (perm === 'granted') {
        fileDB._dir = handle;
        await loadFromFiles();
        return true;
      }
      setError('Permiso denegado.');
      return false;
    } catch (e) {
      setError(e.message);
      return false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Force setup: clears saved handle → shows setup screen again ──────────
  const forceSetup = useCallback(async () => {
    await fileDB.disconnect();
    setFolderName(null);
    setStatus('needs-setup');
  }, []);

  // ── Change folder ─────────────────────────────────────────────────────────
  const changeFolder = useCallback(async () => {
    setError('');
    const result = await fileDB.connect();
    if (!result.ok) { setError(result.error); return false; }
    setFolderName(result.folderName);
    await fileDB.initMissing(SEED_DATA);
    // Sync current localStorage data to the new folder
    const current = pullFromLocalStorage();
    await fileDB.writeAll(current);
    return true;
  }, []);

  // ── Per-table write (called from AppContext on every mutation) ────────────
  const writeTable = useCallback(async (name, data) => {
    if (!fileDB.isConnected) return;
    try { await fileDB.writeTable(name, data); } catch {}
  }, []);

  // ── Full sync: localStorage → files ──────────────────────────────────────
  const syncNow = useCallback(async () => {
    if (!fileDB.isConnected) return false;
    const data = pullFromLocalStorage();
    return fileDB.writeAll(data);
  }, []);

  return (
    <FileDBContext.Provider value={{
      status,
      folderName,
      error,
      isSupported:  fileDB.isSupported,
      isConnected:  fileDB.isConnected,
      setup,
      regrant,
      changeFolder,
      forceSetup,
      writeTable,
      syncNow,
    }}>
      {children}
    </FileDBContext.Provider>
  );
}

export function useFileDB() {
  const ctx = useContext(FileDBContext);
  if (!ctx) throw new Error('useFileDB must be inside FileDBProvider');
  return ctx;
}

export default FileDBContext;
