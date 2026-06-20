import { createAuditLog, ACTION_TYPES } from './auditService';
import { createNotification, NOTIFICATION_TYPES } from './notificationService';
import { REQUEST_TYPES } from '../utils/workflowRules';

export async function applyApprovedRequest(request, updateEvent, reviewerId, reviewerName) {
  if (request.requestType === REQUEST_TYPES.DATE_CHANGE && request.requestedDate) {
    await updateEvent(request.originalEventId, { date: request.requestedDate });

    await Promise.all([
      createAuditLog({
        actionType: ACTION_TYPES.EVENT_UPDATED,
        performedBy: reviewerId,
        performedByName: reviewerName,
        targetEntity: 'event',
        targetEntityId: String(request.originalEventId),
        description: `Fecha de "${request.originalEventTitle}" actualizada: ${request.originalDate} → ${request.requestedDate}`,
        previousValue: { date: request.originalDate },
        newValue: { date: request.requestedDate },
      }),
      createNotification({
        type: NOTIFICATION_TYPES.SCHEDULE_UPDATED,
        title: 'Calendario actualizado',
        body: `"${request.originalEventTitle}" reprogramado: ${request.originalDate} → ${request.requestedDate}`,
        relatedId: String(request.originalEventId),
        recipientRoles: ['admin', 'lider_directores', 'director', 'musico'],
      }),
    ]);
  }

  if (request.requestType === REQUEST_TYPES.REASSIGN) {
    await updateEvent(request.originalEventId, { directorId: null, directorName: '' });

    await Promise.all([
      createAuditLog({
        actionType: ACTION_TYPES.EVENT_UPDATED,
        performedBy: reviewerId,
        performedByName: reviewerName,
        targetEntity: 'event',
        targetEntityId: String(request.originalEventId),
        description: `Reasignación de "${request.originalEventTitle}" aprobada — director por definir`,
        previousValue: { directorId: request.requesterId },
        newValue: { directorId: null, note: 'Pendiente de asignación' },
      }),
      createNotification({
        type: NOTIFICATION_TYPES.EVENT_REASSIGNED,
        title: 'Evento en reasignación',
        body: `"${request.originalEventTitle}" necesita un nuevo director asignado`,
        relatedId: String(request.originalEventId),
        recipientRoles: ['admin', 'lider_directores'],
      }),
    ]);
  }
}
