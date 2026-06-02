import mockAuditLogs from '../data/mockAuditLogs.json';

const STORAGE_KEY = 'ministry_audit_logs';

function loadLogs() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : mockAuditLogs;
  } catch {
    return mockAuditLogs;
  }
}

function saveLogs(logs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch {}
}

export function getAllAuditLogs() {
  return loadLogs().sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function getAuditLogsForEntity(entityId) {
  return loadLogs()
    .filter((l) => l.targetEntityId === String(entityId))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function createAuditLog(entry) {
  const logs = loadLogs();
  const newLog = {
    ...entry,
    id: 'log-' + Date.now(),
    timestamp: new Date().toISOString(),
  };
  logs.unshift(newLog);
  saveLogs(logs);
  return newLog;
}

export const ACTION_TYPES = {
  REQUEST_CREATED: 'request_created',
  REQUEST_APPROVED: 'request_approved',
  REQUEST_REJECTED: 'request_rejected',
  REQUEST_CANCELLED: 'request_cancelled',
  EVENT_UPDATED: 'event_updated',
};

export const ACTION_LABELS = {
  request_created: 'Solicitud creada',
  request_approved: 'Solicitud aprobada',
  request_rejected: 'Solicitud rechazada',
  request_cancelled: 'Solicitud cancelada',
  event_updated: 'Evento actualizado',
};

export const ACTION_COLORS = {
  request_created: '#0A84FF',
  request_approved: '#30D158',
  request_rejected: '#FF453A',
  request_cancelled: '#636366',
  event_updated: '#FF9500',
};
