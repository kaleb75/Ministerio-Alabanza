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
import { fileDB } from '../services/fileSystemDB';

const WorkflowContext = createContext(null);

// ── Sync workflow tables (requests / notifications / auditLogs) to files ──
// Fire-and-forget — never blocks the UI
function syncWorkflow() {
  if (!fileDB.isConnected) return;
  const pairs = [
    ['requests',      'ministry_requests'],
    ['notifications', 'ministry_notifications'],
    ['auditLogs',     'ministry_audit_logs'],
  ];
  for (const [table, key] of pairs) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) fileDB.writeTable(table, JSON.parse(raw)).catch(() => {});
    } catch {}
  }
}

export function WorkflowProvider({ children }) {
  const { user } = useAuth();
  const { updateEvent } = useApp();

  const [requests, setRequests] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  function refresh() {
    const allReqs = getAllRequests();
    setRequests(allReqs);
    setAuditLogs(getAllAuditLogs());
    if (user) {
      const notifs = getNotificationsForUser(user.id, user.role);
      setNotifications(notifs);
      setUnreadCount(getUnreadCount(user.id, user.role));
    }
  }

  useEffect(() => {
    refresh();
  }, [user]);

  const createRequestAction = useCallback((data, upcomingEvents) => {
    const errors = validateNewRequest(data, requests, upcomingEvents);
    if (errors.length) return { ok: false, errors };

    const created = svcCreate(data);
    createAuditLog({
      actionType: ACTION_TYPES.REQUEST_CREATED,
      performedBy: user.id,
      performedByName: user.name,
      targetEntity: 'change_request',
      targetEntityId: created.id,
      description: `Nueva solicitud para "${data.originalEventTitle}"`,
      previousValue: null,
      newValue: { status: 'pending', requestType: data.requestType },
    });
    createNotification({
      type: NOTIFICATION_TYPES.REQUEST_SUBMITTED,
      title: 'Nueva solicitud de cambio',
      body: `${user.name} solicitó cambio para "${data.originalEventTitle}"`,
      relatedId: created.id,
      recipientRoles: ['admin', 'lider_directores'],
    });
    refresh();
    syncWorkflow();
    return { ok: true, request: created };
  }, [requests, user]);

  const approveRequestAction = useCallback((requestId, comment) => {
    const errors = validateApproval(comment);
    if (errors.length) return { ok: false, errors };

    const updated = svcApprove(requestId, user.id, user.name, comment);
    if (!updated) return { ok: false, errors: ['Solicitud no encontrada.'] };

    createAuditLog({
      actionType: ACTION_TYPES.REQUEST_APPROVED,
      performedBy: user.id,
      performedByName: user.name,
      targetEntity: 'change_request',
      targetEntityId: requestId,
      description: `Solicitud de "${updated.requesterName}" aprobada`,
      previousValue: { status: 'pending' },
      newValue: { status: 'approved', reviewComment: comment },
    });
    createNotification({
      type: NOTIFICATION_TYPES.REQUEST_APPROVED,
      title: 'Solicitud aprobada',
      body: `Tu solicitud para "${updated.originalEventTitle}" fue aprobada`,
      relatedId: requestId,
      recipientRoles: [updated.requesterRole],
      recipientUserId: updated.requesterId,
    });
    applyApprovedRequest(updated, updateEvent, user.id, user.name);
    refresh();
    syncWorkflow();
    return { ok: true };
  }, [user, updateEvent]);

  const rejectRequestAction = useCallback((requestId, reason) => {
    const errors = validateRejection(reason);
    if (errors.length) return { ok: false, errors };

    const updated = svcReject(requestId, user.id, user.name, reason);
    if (!updated) return { ok: false, errors: ['Solicitud no encontrada.'] };

    createAuditLog({
      actionType: ACTION_TYPES.REQUEST_REJECTED,
      performedBy: user.id,
      performedByName: user.name,
      targetEntity: 'change_request',
      targetEntityId: requestId,
      description: `Solicitud de "${updated.requesterName}" rechazada`,
      previousValue: { status: 'pending' },
      newValue: { status: 'rejected', reviewComment: reason },
    });
    createNotification({
      type: NOTIFICATION_TYPES.REQUEST_REJECTED,
      title: 'Solicitud rechazada',
      body: `Tu solicitud para "${updated.originalEventTitle}" fue rechazada`,
      relatedId: requestId,
      recipientRoles: [updated.requesterRole],
      recipientUserId: updated.requesterId,
    });
    refresh();
    syncWorkflow();
    return { ok: true };
  }, [user]);

  const cancelRequestAction = useCallback((requestId) => {
    const updated = svcCancel(requestId);
    if (!updated) return { ok: false };
    createAuditLog({
      actionType: ACTION_TYPES.REQUEST_CANCELLED,
      performedBy: user.id,
      performedByName: user.name,
      targetEntity: 'change_request',
      targetEntityId: requestId,
      description: `Solicitud cancelada por ${user.name}`,
      previousValue: { status: 'pending' },
      newValue: { status: 'cancelled' },
    });
    refresh();
    syncWorkflow();
    return { ok: true };
  }, [user]);

  const markNotifRead = useCallback((notifId) => {
    markAsRead(notifId);
    refresh();
    syncWorkflow();
  }, []);

  const markAllNotifsRead = useCallback(() => {
    if (user) markAllAsRead(user.id, user.role);
    refresh();
    syncWorkflow();
  }, [user]);

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
