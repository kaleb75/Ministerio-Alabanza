import mockRequests from '../data/mockRequests.json';
import { REQUEST_STATUS } from '../utils/workflowRules';

const STORAGE_KEY = 'ministry_requests';

function loadRequests() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : mockRequests;
  } catch {
    return mockRequests;
  }
}

function saveRequests(requests) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  } catch {}
}

export function getAllRequests() {
  return loadRequests();
}

export function getRequestsByUser(userId) {
  return loadRequests().filter((r) => r.requesterId === userId);
}

export function getPendingRequests() {
  return loadRequests().filter((r) => r.status === REQUEST_STATUS.PENDING);
}

export function createRequest(data) {
  const requests = loadRequests();
  const newRequest = {
    ...data,
    id: 'req-' + Date.now(),
    status: REQUEST_STATUS.PENDING,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    reviewedBy: null,
    reviewedByName: null,
    reviewedAt: null,
    reviewComment: null,
  };
  requests.unshift(newRequest);
  saveRequests(requests);
  return newRequest;
}

export function approveRequest(requestId, reviewerId, reviewerName, comment) {
  const requests = loadRequests();
  const idx = requests.findIndex((r) => r.id === requestId);
  if (idx === -1) return null;
  requests[idx] = {
    ...requests[idx],
    status: REQUEST_STATUS.APPROVED,
    reviewedBy: reviewerId,
    reviewedByName: reviewerName,
    reviewedAt: new Date().toISOString(),
    reviewComment: comment || '',
    updatedAt: new Date().toISOString(),
  };
  saveRequests(requests);
  return requests[idx];
}

export function rejectRequest(requestId, reviewerId, reviewerName, reason) {
  const requests = loadRequests();
  const idx = requests.findIndex((r) => r.id === requestId);
  if (idx === -1) return null;
  requests[idx] = {
    ...requests[idx],
    status: REQUEST_STATUS.REJECTED,
    reviewedBy: reviewerId,
    reviewedByName: reviewerName,
    reviewedAt: new Date().toISOString(),
    reviewComment: reason,
    updatedAt: new Date().toISOString(),
  };
  saveRequests(requests);
  return requests[idx];
}

export function cancelRequest(requestId) {
  const requests = loadRequests();
  const idx = requests.findIndex((r) => r.id === requestId);
  if (idx === -1) return null;
  requests[idx] = {
    ...requests[idx],
    status: REQUEST_STATUS.CANCELLED,
    updatedAt: new Date().toISOString(),
  };
  saveRequests(requests);
  return requests[idx];
}

export function resetToMockData() {
  saveRequests(mockRequests);
  return mockRequests;
}
