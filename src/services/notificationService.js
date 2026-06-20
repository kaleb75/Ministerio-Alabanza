import { supabase } from '../lib/supabase';

function fromRow(r) {
  return {
    id: r.id,
    type: r.type,
    title: r.title,
    body: r.body,
    relatedId: r.related_id,
    recipientRoles: r.recipient_roles || [],
    recipientUserId: r.recipient_user_id,
    isRead: r.is_read,
    createdAt: r.created_at,
  };
}

export async function getNotificationsForUser(userId, role) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .contains('recipient_roles', [role])
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(fromRow).filter((n) => !n.recipientUserId || n.recipientUserId === userId);
}

export async function getUnreadCount(userId, role) {
  const notifs = await getNotificationsForUser(userId, role);
  return notifs.filter((n) => !n.isRead).length;
}

export async function markAsRead(notificationId) {
  const { error } = await supabase
    .from('notifications').update({ is_read: true }).eq('id', notificationId);
  if (error) throw error;
}

export async function markAllAsRead(userId, role) {
  const notifs = await getNotificationsForUser(userId, role);
  const ids = notifs.filter((n) => !n.isRead).map((n) => n.id);
  if (!ids.length) return;
  const { error } = await supabase
    .from('notifications').update({ is_read: true }).in('id', ids);
  if (error) throw error;
}

export async function createNotification(data) {
  const { data: row, error } = await supabase
    .from('notifications')
    .insert({
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      type: data.type,
      title: data.title,
      body: data.body,
      related_id: data.relatedId || null,
      recipient_roles: data.recipientRoles || [],
      recipient_user_id: data.recipientUserId || null,
      is_read: false,
    })
    .select()
    .single();
  if (error) throw error;
  return fromRow(row);
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
