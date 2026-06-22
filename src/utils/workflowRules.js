import dayjs from 'dayjs';
import { USER_ROLES } from './constants';

export const REQUEST_TYPES = {
  DATE_CHANGE: 'date_change',
  REASSIGN: 'reassign',
};

export const REQUEST_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
};

export const REQUEST_TYPE_LABELS = {
  date_change: 'Cambio de fecha',
  reassign: 'Reasignación',
};

export const REQUEST_STATUS_LABELS = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  cancelled: 'Cancelada',
};

export function canCreateRequest(role) {
  return [USER_ROLES.ADMIN, USER_ROLES.LIDER_DIRECTORES, USER_ROLES.DIRECTOR].includes(role);
}

export function canApproveRequest(role) {
  return [USER_ROLES.ADMIN, USER_ROLES.LIDER_DIRECTORES].includes(role);
}

export function canViewAllRequests(role) {
  return [USER_ROLES.ADMIN, USER_ROLES.LIDER_DIRECTORES].includes(role);
}

export function canCancelRequest(request, userId) {
  return request.requesterId === userId && request.status === REQUEST_STATUS.PENDING;
}

export function validateNewRequest(request, existingRequests, events) {
  const errors = [];

  if (!request.originalEventId) errors.push('Debes seleccionar un evento.');
  if (!request.reason?.trim()) errors.push('El motivo es obligatorio.');
  if (request.requestType === REQUEST_TYPES.DATE_CHANGE && !request.requestedDate) {
    errors.push('Debes indicar la nueva fecha solicitada.');
  }

  if (request.requestedDate) {
    const today = dayjs().format('YYYY-MM-DD');
    if (request.requestedDate <= today) {
      errors.push('La nueva fecha solicitada debe ser futura.');
    }
    if (request.requestedDate === request.originalDate) {
      errors.push('La fecha solicitada es igual a la fecha original.');
    }
  }

  const hasDuplicate = existingRequests.some(
    (r) =>
      r.originalEventId === request.originalEventId &&
      r.status === REQUEST_STATUS.PENDING &&
      r.requesterId === request.requesterId
  );
  if (hasDuplicate) {
    errors.push('Ya existe una solicitud pendiente para este evento.');
  }

  return errors;
}

export function validateApproval(comment) {
  if (!comment?.trim()) return ['Un comentario es requerido para aprobar.'];
  return [];
}

export function validateRejection(reason) {
  if (!reason?.trim()) return ['Debes proporcionar un motivo para rechazar.'];
  if (reason.trim().length < 10) return ['El motivo debe ser más descriptivo (mínimo 10 caracteres).'];
  return [];
}

export function getRequestUrgency(request) {
  if (request.status !== REQUEST_STATUS.PENDING) return 'normal';
  const created = new Date(request.createdAt);
  const now = new Date();
  const hoursOld = (now - created) / 3600000;
  if (hoursOld > 48) return 'high';
  if (hoursOld > 24) return 'medium';
  return 'normal';
}
