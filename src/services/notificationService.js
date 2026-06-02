import mockNotifications from '../data/mockNotifications.json';

const STORAGE_KEY = 'ministry_notifications';

function loadNotifications() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : mockNotifications;
  } catch {
    return mockNotifications;
  }
}

function saveNotifications(notifications) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch {}
}

export function getNotificationsForUser(userId, role) {
  return loadNotifications()
    .filter((n) => {
      const roleMatch = n.recipientRoles?.includes(role);
      const userMatch = !n.recipientUserId || n.recipientUserId === userId;
      return roleMatch && userMatch;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getUnreadCount(userId, role) {
  return getNotificationsForUser(userId, role).filter((n) => !n.isRead).length;
}

export function markAsRead(notificationId) {
  const notifications = loadNotifications();
  const idx = notifications.findIndex((n) => n.id === notificationId);
  if (idx === -1) return;
  notifications[idx] = { ...notifications[idx], isRead: true };
  saveNotifications(notifications);
}

export function markAllAsRead(userId, role) {
  const notifications = loadNotifications();
  const updated = notifications.map((n) => {
    const roleMatch = n.recipientRoles?.includes(role);
    const userMatch = !n.recipientUserId || n.recipientUserId === userId;
    if (roleMatch && userMatch) return { ...n, isRead: true };
    return n;
  });
  saveNotifications(updated);
}

export function createNotification(data) {
  const notifications = loadNotifications();
  const newNotif = {
    ...data,
    id: 'notif-' + Date.now(),
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  notifications.unshift(newNotif);
  saveNotifications(notifications);
  return newNotif;
}

export const NOTIFICATION_TYPES = {
  REQUEST_SUBMITTED: 'request_submitted',
  REQUEST_APPROVED: 'request_approved',
  REQUEST_REJECTED: 'request_rejected',
  SCHEDULE_UPDATED: 'schedule_updated',
  EVENT_REASSIGNED: 'event_reassigned',
};

export const NOTIFICATION_ICONS = {
  request_submitted: 'inbox',
  request_approved: 'check-circle',
  request_rejected: 'x-circle',
  schedule_updated: 'calendar',
  event_reassigned: 'users',
};
