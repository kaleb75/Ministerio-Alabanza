/**
 * FileSystemDB — persiste datos como archivos JSON reales en una carpeta local.
 *
 * Usa el File System Access API del browser (Chrome 86+, Edge 86+, Safari 15.2+).
 * En navegadores sin soporte, `isSupported` devuelve false y el sistema cae
 * en localStorage automáticamente.
 *
 * FLUJO:
 *   1. Usuario abre Settings → "Conectar carpeta"
 *   2. Browser muestra selector de carpeta nativo
 *   3. La app crea/lee archivos JSON en esa carpeta:
 *        songs.json, events.json, users.json,
 *        songHistory.json, requests.json, notifications.json, auditLogs.json
 *   4. Cada vez que se crea/edita/elimina un dato, el archivo se actualiza
 *   5. El handle de la carpeta se guarda en IndexedDB para reconectar
 *      automáticamente sin volver a pedir permiso
 *
 * En GitHub Pages funciona exactamente igual: el usuario conecta una carpeta
 * en su máquina y los datos viven ahí como JSON editables.
 */

import { idbGet, idbSet, idbDelete } from './idbHelper';

export const TABLES = [
  'songs', 'events', 'users', 'songHistory',
  'requests', 'notifications', 'auditLogs',
];

const IDB_KEY = 'fsdb_dir_handle';

class FileSystemDB {
  constructor() {
    this._dir = null;
  }

  // ── Capabilities ─────────────────────────────────────────────────────────

  get isSupported() {
    return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
  }

  get isConnected() {
    return this._dir !== null;
  }

  get folderName() {
    return this._dir?.name ?? null;
  }

  // ── Connection ────────────────────────────────────────────────────────────

  /**
   * Try to reconnect using the directory handle saved in IndexedDB.
   * Returns true if reconnected successfully.
   */
  async reconnect() {
    if (!this.isSupported) return false;
    const handle = await idbGet(IDB_KEY);
    if (!handle) return false;
    try {
      const perm = await handle.queryPermission({ mode: 'readwrite' });
      if (perm === 'granted') { this._dir = handle; return true; }
      // Needs explicit user gesture to re-request — will prompt on next interaction
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Ask the user to pick a folder. Requires a user gesture (button click).
   * Returns { ok, folderName?, error? }
   */
  async connect() {
    if (!this.isSupported) {
      return { ok: false, error: 'Tu navegador no soporta File System Access API. Usa Chrome o Edge.' };
    }
    try {
      const handle = await window.showDirectoryPicker({
        id:   'ministry-alabanza-data',
        mode: 'readwrite',
        startIn: 'documents',
      });
      this._dir = handle;
      await idbSet(IDB_KEY, handle);
      return { ok: true, folderName: handle.name };
    } catch (err) {
      if (err.name === 'AbortError') return { ok: false, error: 'Cancelado.' };
      return { ok: false, error: err.message };
    }
  }

  /** Disconnect and remove the saved handle. */
  async disconnect() {
    this._dir = null;
    await idbDelete(IDB_KEY);
  }

  // ── File I/O ──────────────────────────────────────────────────────────────

  /**
   * Read a table from its JSON file.
   * Returns the parsed array, or null if the file doesn't exist.
   */
  async readTable(name) {
    if (!this._dir) return null;
    try {
      const fh   = await this._dir.getFileHandle(`${name}.json`, { create: false });
      const file = await fh.getFile();
      const text = await file.text();
      return JSON.parse(text);
    } catch {
      return null; // File doesn't exist yet
    }
  }

  /**
   * Write an array to a table's JSON file.
   * Creates the file if it doesn't exist.
   */
  async writeTable(name, data) {
    if (!this._dir) return false;
    try {
      const fh = await this._dir.getFileHandle(`${name}.json`, { create: true });
      const w  = await fh.createWritable();
      await w.write(JSON.stringify(data, null, 2));
      await w.close();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Read all tables. Returns a map of { tableName: [] }.
   * Tables that don't have a file yet return null.
   */
  async readAll() {
    if (!this._dir) return null;
    const result = {};
    for (const t of TABLES) {
      result[t] = await this.readTable(t);
    }
    return result;
  }

  /**
   * Write all tables from a data map { tableName: [] }.
   */
  async writeAll(data) {
    if (!this._dir) return false;
    for (const [name, rows] of Object.entries(data)) {
      if (Array.isArray(rows)) await this.writeTable(name, rows);
    }
    return true;
  }

  /**
   * Initialize files that don't exist yet using provided seed data.
   * Only writes tables that have no file.
   */
  async initMissing(seedData) {
    if (!this._dir) return;
    for (const [name, rows] of Object.entries(seedData)) {
      const existing = await this.readTable(name);
      if (existing === null) {
        await this.writeTable(name, rows);
      }
    }
  }
}

// Singleton — shared across the app
export const fileDB = new FileSystemDB();
export default fileDB;
