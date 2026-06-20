import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useApp } from './AppContext';
import {
  getAllRequests, createRequest as svcCreate, approveRequest as svcApprove,
  rejectRequest as svcReject, cancelRequest as svcCancel,
} from '../services/changeRequestService';
import { getAllAuditLogs, createAuditLog, ACTION_TYPES } from '../services/auditService';
import {
  getNotificationsForUser, getUnreadCount, markAsRead, markAllAsRead,
  createNotification, NOTIFICATION_TYPES,
} from '../services/notificationService';
import { applyApprovedRequest } from '../services/eventReassignmentService';
import { validateNewRequest, validateApproval, validateRejection } from '../utils/workflowRules';

const WorkflowContext = createContext(null);

export function WorkflowProvider({ children }) {
  const { user } = useAuth();
  const { updateEvent } = useApp();

  const [requests, setRequests]         = useState([]);
  const [auditLogs, setAuditLogs]       = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]   = useState(0);

  const refresh = useCallback(async () => {
    const allReqs = await getAllRequests();
    setRequests(allReqs);
    const logs = await getAllAuditLogs();
    setAuditLogs(logs);
    if (user) {
      const notifs = await getNotificationsForUser(user.id, user.role);
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.isRead).length);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createRequestAction = useCallback(async (data, upcomingEvents) => {
    const errors = validateNewRequest(data, requests, upcomingEvents);
    if (errors.length) return { ok: false, errors };

    const created = await svcCreate(data);
    await Promise.all([
      createAuditLog({
        actionType: ACTION_TYPES.REQUEST_CREATED,
        performedBy: user.id,
        performedByName: user.name,
        targetEntity: 'change_request',
        targetEntityId: created.id,
        description: `Nueva solicitud para "${data.originalEventTitle}"`,
        previousValue: null,
        newValue: { status: 'pending', requestType: data.requestType },
      }),
      createNotification({
        type: NOTIFICATION_TYPES.REQUEST_SUBMITTED,
        title: 'Nueva solicitud de cambio',
        body: `${user.name} solicitó cambio para "${data.originalEventTitle}"`,
        relatedId: created.id,
        recipientRoles: ['admin', 'lider_directores'],
      }),
    ]);
    await refresh();
    return { ok: true, request: created };
  }, [requests, user, refresh]);

  const approveRequestAction = useCallback(async (requestId, comment) => {
    const errors = validateApproval(comment);
    if (errors.length) return { ok: false, errors };

    const updated = await svcApprove(requestId, user.id, user.name, comment);
    if (!updated) return { ok: false, errors: ['Solicitud no encontrada.'] };

    await Promise.all([
      createAuditLog({
        actionType: ACTION_TYPES.REQUEST_APPROVED,
        performedBy: user.id,
        performedByName: user.name,
        targetEntity: 'change_request',
        targetEntityId: requestId,
        description: `Solicitud de "${updated.requesterName}" aprobada`,
        previousValue: { status: 'pending' },
        newValue: { status: 'approved', reviewComment: comment },
      }),
      createNotification({
        type: NOTIFICATION_TYPES.REQUEST_APPROVED,
        title: 'Solicitud aprobada',
        body: `Tu solicitud para "${updated.originalEventTitle}" fue aprobada`,
        relatedId: requestId,
        recipientRoles: [updated.requesterRole],
        recipientUserId: updated.requesterId,
      }),
    ]);
    await applyApprovedRequest(updated, updateEvent, user.id, user.name);
    await refresh();
    return { ok: true };
  }, [user, updateEvent, refresh]);

  const rejectRequestAction = useCallback(async (requestId, reason) => {
    const errors = validateRejection(reason);
    if (errors.length) return { ok: false, errors };

    const updated = await svcReject(requestId, user.id, user.name, reason);
    if (!updated) return { ok: false, errors: ['Solicitud no encontrada.'] };

    await Promise.all([
      createAuditLog({
        actionType: ACTION_TYPES.REQUEST_REJECTED,
        performedBy: user.id,
        performedByName: user.name,
        targetEntity: 'change_request',
        targetEntityId: requestId,
        description: `Solicitud de "${updated.requesterName}" rechazada`,
        previousValue: { status: 'pending' },
        newValue: { status: 'rejected', reviewComment: reason },
      }),
      createNotification({
        type: NOTIFICATION_TYPES.REQUEST_REJECTED,
        title: 'Solicitud rechazada',
        body: `Tu solicitud para "${updated.originalEventTitle}" fue rechazada`,
        relatedId: requestId,
        recipientRoles: [updated.requesterRole],
        recipientUserId: updated.requesterId,
      }),
    ]);
    await refresh();
    return { ok: true };
  }, [user, refresh]);

  const cancelRequestAction = useCallback(async (requestId) => {
    const updated = await svcCancel(requestId);
    if (!updated) return { ok: false };
    await createAuditLog({
      actionType: ACTION_TYPES.REQUEST_CANCELLED,
      performedBy: user.id,
      performedByName: user.name,
      targetEntity: 'change_request',
      targetEntityId: requestId,
      description: `Solicitud cancelada por ${user.name}`,
      previousValue: { status: 'pending' },
      newValue: { status: 'cancelled' },
    });
    await refresh();
    return { ok: true };
  }, [user, refresh]);

  const markNotifRead = useCallback(async (notifId) => {
    await markAsRead(notifId);
    await refresh();
  }, [refresh]);

  const markAllNotifsRead = useCallback(async () => {
    if (user) await markAllAsRead(user.id, user.role);
    await refresh();
  }, [user, refresh]);

  const pendingRequests = requests.filter((r) => r.status === 'pending');

  return (
    <WorkflowContext.Provider value={{
      requests,
      pendingRequests,
      auditLogs,
      notifications,
      unreadCount,
      createRequest: createRequestAction,
      approveRequest: approveRequestAction,
      rejectRequest: rejectRequestAction,
      cancelRequest: cancelRequestAction,
      markNotifRead,
      markAllNotifsRead,
      refresh,
    }}>
      {children}
    </WorkflowContext.Provider>
  );
}

export function useWorkflow() {
  const ctx = useContext(WorkflowContext);
  if (!ctx) throw new Error('useWorkflow must be inside WorkflowProvider');
  return ctx;
}

export default WorkflowContext;
