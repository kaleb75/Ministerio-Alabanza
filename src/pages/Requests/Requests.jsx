import { useState } from 'react';
import { Plus, Inbox, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, CalendarDays, RotateCcw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkflow } from '../../context/WorkflowContext';
import ChangeRequestForm from '../../components/ChangeRequestForm/ChangeRequestForm';
import ApprovalPanel from '../../components/ApprovalPanel/ApprovalPanel';
import { canCreateRequest, canApproveRequest, canViewAllRequests, canCancelRequest, REQUEST_STATUS, REQUEST_STATUS_LABELS, REQUEST_TYPE_LABELS } from '../../utils/workflowRules';
import { formatDate } from '../../utils/dateUtils';
import './Requests.css';

const STATUS_CONFIG = {
  pending:   { icon: Clock,        color: '#FFD60A', badge: 'badge-warning' },
  approved:  { icon: CheckCircle,  color: '#30D158', badge: 'badge-success' },
  rejected:  { icon: XCircle,      color: '#FF453A', badge: 'badge-danger' },
  cancelled: { icon: Clock,        color: '#636366', badge: 'badge-default' },
};

const TABS = [
  { id: 'pending', label: 'Pendientes' },
  { id: 'mine', label: 'Mis Solicitudes' },
  { id: 'history', label: 'Historial' },
];

export default function Requests() {
  const { user } = useAuth();
  const { requests, pendingRequests, cancelRequest } = useWorkflow();
  const [showForm, setShowForm] = useState(false);
  const [reviewRequest, setReviewRequest] = useState(null);
  const [activeTab, setActiveTab] = useState(canApproveRequest(user?.role) ? 'pending' : 'mine');

  const canCreate = canCreateRequest(user?.role);
  const canApprove = canApproveRequest(user?.role);
  const canViewAll = canViewAllRequests(user?.role);

  const myRequests = requests.filter((r) => r.requesterId === user?.id);
  const historyRequests = (canViewAll ? requests : myRequests).filter(
    (r) => r.status !== REQUEST_STATUS.PENDING
  );

  const pendingCount = pendingRequests.length;

  function handleCancel(requestId) {
    if (confirm('¿Cancelar esta solicitud?')) cancelRequest(requestId);
  }

  return (
    <div className="requests-page page-enter">
      <div className="requests-header">
        <div>
          <h1>Solicitudes</h1>
          <p className="requests-subtitle">
            {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
          </p>
        </div>
        {canCreate && (
          <button className="btn btn-primary requests-new-btn" onClick={() => setShowForm(true)}>
            <Plus size={15} />
            Nueva
          </button>
        )}
      </div>

      <div className="requests-tabs">
        {TABS.map((tab) => {
          if (tab.id === 'pending' && !canApprove) return null;
          return (
            <button
              key={tab.id}
              className={`requests-tab ${activeTab === tab.id ? 'requests-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {tab.id === 'pending' && pendingCount > 0 && (
                <span className="requests-tab__badge">{pendingCount}</span>
              )}
            </button>
          );
        })}
      </div>

      {activeTab === 'pending' && canApprove && (
        <div className="requests-section stagger-children">
          {pendingRequests.length === 0 ? (
            <div className="card empty-state">
              <Inbox size={32} className="empty-state-icon" />
              <p>Sin solicitudes pendientes de revisión</p>
            </div>
          ) : (
            pendingRequests.map((req) => (
              <RequestCard
                key={req.id}
                request={req}
                canApprove={canApprove}
                currentUserId={user?.id}
                onReview={() => setReviewRequest(req)}
                onCancel={handleCancel}
              />
            ))
          )}
        </div>
      )}

      {activeTab === 'mine' && (
        <div className="requests-section stagger-children">
          {myRequests.length === 0 ? (
            <div className="card empty-state">
              <Inbox size={32} className="empty-state-icon" />
              <p>No has enviado solicitudes aún</p>
              {canCreate && (
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                  <Plus size={14} />
                  Crear solicitud
                </button>
              )}
            </div>
          ) : (
            myRequests.map((req) => (
              <RequestCard
                key={req.id}
                request={req}
                canApprove={false}
                currentUserId={user?.id}
                onReview={() => setReviewRequest(req)}
                onCancel={handleCancel}
              />
            ))
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="requests-section stagger-children">
          {historyRequests.length === 0 ? (
            <div className="card empty-state">
              <CalendarDays size={32} className="empty-state-icon" />
              <p>Sin historial de solicitudes</p>
            </div>
          ) : (
            historyRequests.map((req) => (
              <RequestCard
                key={req.id}
                request={req}
                canApprove={false}
                currentUserId={user?.id}
                onCancel={handleCancel}
              />
            ))
          )}
        </div>
      )}

      {showForm && <ChangeRequestForm onClose={() => setShowForm(false)} />}
      {reviewRequest && (
        <ApprovalPanel
          request={reviewRequest}
          onClose={() => setReviewRequest(null)}
        />
      )}
    </div>
  );
}

function RequestCard({ request, canApprove, currentUserId, onReview, onCancel }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[request.status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  const TypeIcon = request.requestType === 'date_change' ? CalendarDays : RotateCcw;
  const canCancel = canCancelRequest(request, currentUserId);

  return (
    <div className={`req-card card ${request.status === REQUEST_STATUS.PENDING ? 'req-card--pending' : ''}`}>
      <div className="req-card__top" onClick={() => setExpanded((v) => !v)}>
        <div className="req-card__icon" style={{ background: `${cfg.color}1A`, color: cfg.color }}>
          <TypeIcon size={16} />
        </div>

        <div className="req-card__body">
          <div className="req-card__title-row">
            <span className="req-card__event">{request.originalEventTitle}</span>
            <span className={`badge ${cfg.badge}`}>{REQUEST_STATUS_LABELS[request.status]}</span>
          </div>
          <div className="req-card__meta">
            {request.requesterName} · {REQUEST_TYPE_LABELS[request.requestType] || request.requestType}
          </div>
          {request.requestedDate && (
            <div className="req-card__dates">
              <span className="req-card__date-from">{request.originalDate}</span>
              <span className="req-card__date-arrow">→</span>
              <span className="req-card__date-to">{request.requestedDate}</span>
            </div>
          )}
        </div>

        <button className="req-card__expand-btn" aria-label="Expandir">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {expanded && (
        <div className="req-card__detail">
          <div className="req-card__reason">
            <span className="req-card__reason-label">Motivo</span>
            <p className="req-card__reason-text">{request.reason}</p>
          </div>

          {request.reviewComment && (
            <div className="req-card__review-comment">
              <span className="req-card__review-label">
                {request.status === REQUEST_STATUS.APPROVED ? 'Comentario de aprobación' : 'Motivo de rechazo'}
              </span>
              <p className="req-card__review-text">{request.reviewComment}</p>
              {request.reviewedByName && (
                <span className="req-card__reviewer">— {request.reviewedByName}</span>
              )}
            </div>
          )}

          <div className="req-card__actions">
            {canCancel && (
              <button
                className="req-card__cancel-btn"
                onClick={() => onCancel?.(request.id)}
              >
                Cancelar solicitud
              </button>
            )}
            {canApprove && request.status === REQUEST_STATUS.PENDING && (
              <button className="btn btn-primary req-card__review-btn" onClick={onReview}>
                Revisar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
