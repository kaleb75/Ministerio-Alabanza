import mockPermissions from '../data/mockPermissions.json';

function getEffectiveRoles(user) {
  if (!user) return [];
  if (Array.isArray(user.roles) && user.roles.length > 0) return user.roles;
  if (user.role) return [user.role];
  return [];
}

function mergedPerms(roles) {
  const routes = new Set();
  const actions = {};
  for (const role of roles) {
    const p = mockPermissions[role];
    if (!p) continue;
    p.routes.forEach((r) => routes.add(r));
    for (const [resource, acts] of Object.entries(p.actions || {})) {
      if (!actions[resource]) actions[resource] = new Set();
      acts.forEach((a) => actions[resource].add(a));
    }
  }
  return { routes, actions };
}

export function canAccessRoute(userOrRole, routeKey) {
  let roles;
  if (typeof userOrRole === 'string') {
    roles = [userOrRole];
  } else {
    roles = getEffectiveRoles(userOrRole);
  }
  const { routes } = mergedPerms(roles);
  return routes.has(routeKey);
}

export function getAccessibleRoutes(userOrRole) {
  let roles;
  if (typeof userOrRole === 'string') {
    roles = [userOrRole];
  } else {
    roles = getEffectiveRoles(userOrRole);
  }
  const { routes } = mergedPerms(roles);
  return [...routes];
}

export function canPerformAction(userOrRole, resource, action) {
  let roles;
  if (typeof userOrRole === 'string') {
    roles = [userOrRole];
  } else {
    roles = getEffectiveRoles(userOrRole);
  }
  const { actions } = mergedPerms(roles);
  return actions[resource]?.has(action) ?? false;
}

export function userHasRole(user, role) {
  const roles = getEffectiveRoles(user);
  return roles.includes(role);
}

export function userHasAnyRole(user, roleList) {
  const roles = getEffectiveRoles(user);
  return roleList.some((r) => roles.includes(r));
}

export function canEditEvent(user, event) {
  if (!user || !event) return false;
  if (userHasAnyRole(user, ['admin', 'lider_directores'])) return true;
  if (userHasRole(user, 'director')) {
    const primaryResp = (event.serviceResponsibilities || []).find(
      (r) => r.type === 'director_principal'
    );
    return primaryResp && String(primaryResp.assignedUserId) === String(user.id);
  }
  return false;
}

export function canDeleteEvent(user) {
  if (!user) return false;
  return userHasAnyRole(user, ['admin', 'lider_directores']);
}

export function canAdvanceEvent(user, event) {
  if (!user || !event) return false;
  if (userHasAnyRole(user, ['admin', 'lider_directores'])) return true;
  if (userHasRole(user, 'director')) {
    const primaryResp = (event.serviceResponsibilities || []).find(
      (r) => r.type === 'director_principal'
    );
    return primaryResp && String(primaryResp.assignedUserId) === String(user.id);
  }
  return false;
}
