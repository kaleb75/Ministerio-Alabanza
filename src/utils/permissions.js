import mockPermissions from '../data/mockPermissions.json';

export function canAccessRoute(role, routeKey) {
  const perms = mockPermissions[role];
  if (!perms) return false;
  return perms.routes.includes(routeKey);
}

export function getAccessibleRoutes(role) {
  const perms = mockPermissions[role];
  if (!perms) return [];
  return [...perms.routes];
}

export function canPerformAction(role, resource, action) {
  const perms = mockPermissions[role];
  if (!perms?.actions?.[resource]) return false;
  return perms.actions[resource].includes(action);
}

/**
 * Can this user edit a specific event?
 *
 * - admin / lider_directores: can edit ANY event
 * - director:                 can edit ONLY events assigned to them
 * - musico:                   never
 */
export function canEditEvent(user, event) {
  if (!user || !event) return false;
  if (['admin', 'lider_directores'].includes(user.role)) return true;
  if (user.role === 'director') {
    return String(event.directorId) === String(user.id);
  }
  return false;
}

/**
 * Can this user delete a specific event?
 * Only admin and lider can delete. Directors cannot delete events.
 */
export function canDeleteEvent(user) {
  if (!user) return false;
  return ['admin', 'lider_directores'].includes(user.role);
}

/**
 * Can this user advance the status of a specific event?
 * Directors can mark their own events as in_progress or completed.
 */
export function canAdvanceEvent(user, event) {
  if (!user || !event) return false;
  if (['admin', 'lider_directores'].includes(user.role)) return true;
  if (user.role === 'director') {
    return String(event.directorId) === String(user.id);
  }
  return false;
}
