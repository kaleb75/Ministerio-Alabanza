/**
 * Minimal IndexedDB helpers — used ONLY to persist FileSystem directory handles
 * across page reloads (localStorage can't store FileSystemDirectoryHandle objects).
 */

const DB_NAME  = 'ministry_meta_v1';
const STORE    = 'handles';

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess  = () => resolve(req.result);
    req.onerror    = () => reject(req.error);
  });
}

export async function idbGet(key) {
  try {
    const db  = await open();
    return new Promise(res => {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
      req.onsuccess = () => res(req.result ?? null);
      req.onerror   = () => res(null);
    });
  } catch { return null; }
}

export async function idbSet(key, value) {
  try {
    const db = await open();
    return new Promise(res => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = () => res(true);
      tx.onerror    = () => res(false);
    });
  } catch { return false; }
}

export async function idbDelete(key) {
  try {
    const db = await open();
    return new Promise(res => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = () => res(true);
      tx.onerror    = () => res(false);
    });
  } catch { return false; }
}
