import { useState } from 'react';
import { X, CheckCircle, XCircle, Calendar, RotateCcw, User, Clock, AlertCircle } from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';
import { REQUEST_TYPE_LABELS } from '../../utils/workflowRules';
import './ApprovalPanel.css';

export default function ApprovalPanel({ request, onClose }) {
  const { approveRequest, rejectRequest } = useWorkflow();
  const [mode, setMode] = useState(null); // 'approve' | 'reject'
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  if (!request) return null;

  async function handleApprove(e) {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);
    const result = approveRequest(request.id, comment);
    setSubmitting(false);
    if (!result.ok) { setErrors(result.errors); return; }
    onClose?.();
  }

  async function handleReject(e) {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);
    const result = rejectRequest(request.id, comment);
    setSubmitting(false);
    if (!result.ok) { setErrors(result.errors); return; }
    onClose?.();
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="approval-panel">
        <div className="approval-panel__header">
          <h2 className="approval-panel__title">Revisar Solicitud</h2>
          <button className="approval-panel__close" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="approval-panel__body">
          {/* Request summary */}
          <div className="approval-panel__summary">
            <div className="approval-panel__summary-row">
              <span className="approval-panel__summary-label">Evento</span>
              <span className="approval-panel__summary-value">{request.originalEventTitle}</span>
            </div>
            <div className="approval-panel__summary-row">
              <span className="approval-panel__summary-label">Fecha original</span>
              <span className="approval-panel__summary-value">{request.originalDate}</span>
            </div>
            <div className="approval-panel__summary-row">
              <span className="approval-panel__summary-label">Tipo</span>
              <span className="approval-panel__summary-value">
                {REQUEST_TYPE_LABELS[request.requestType] || request.requestType}
              </span>
            </div>
            {request.requestedDate && (
              <div className="approval-panel__summary-row">
                <span className="approval-panel__summary-label">Nueva fecha</span>
                <span className="approval-panel__summary-value approval-panel__summary-value--highlight">
                  {request.requestedDate}
                </span>
              </div>
            )}
          </div>

          <div className="approval-panel__requester">
            <User size={14} />
            <span>{request.requesterName}</span>
            <Clock size={12} />
            <span className="approval-panel__date">{new Date(request.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>

          <div className="approval-panel__reason">
            <span className="approval-panel__reason-label">Motivo</span>
            <p className="approval-panel__reason-text">{request.reason}</p>
          </div>

          {errors.length > 0 && (
            <div className="approval-panel__errors">
              {errors.map((err, i) => (
                <div key={i} className="approval-panel__error-item">
                  <AlertCircle size={13} />
                  {err}
                </div>
              ))}
            </div>
          )}

          {mode === null && (
            <div className="approval-panel__actions">
              <button
                className="approval-panel__reject-btn"
                onClick={() => { setMode('reject'); setComment(''); setErrors([]); }}
              >
                <XCircle size={16} />
                Rechazar
              </button>
              <button
                className="approval-panel__approve-btn"
                onClick={() => { setMode('approve'); setComment(''); setErrors([]); }}
              >
                <CheckCircle size={16} />
                Aprobar
              </button>
            </div>
          )}

          {mode === 'approve' && (
            <form onSubmit={handleApprove} className="approval-panel__review-form">
              <label className="approval-panel__review-label">
                Comentario de aprobación <span className="req-form__required">*</span>
              </label>
              <textarea
                className="req-form__textarea"
                placeholder="Agrega un comentario para el director..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                autoFocus
              />
              <div className="approval-panel__review-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setMode(null)}>
                  Atrás
                </button>
                <button
                  type="submit"
                  className="approval-panel__approve-btn"
                  disabled={submitting || !comment.trim()}
                >
                  <CheckCircle size={14} />
                  {submitting ? 'Aprobando...' : 'Confirmar aprobación'}
                </button>
              </div>
            </form>
          )}

          {mode === 'reject' && (
            <form onSubmit={handleReject} className="approval-panel__review-form">
              <label className="approval-panel__review-label">
                Motivo del rechazo <span className="req-form__required">*</span>
              </label>
              <textarea
                className="req-form__textarea"
                placeholder="Explica por qué se rechaza la solicitud..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                autoFocus
              />
              <div className="approval-panel__review-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setMode(null)}>
                  Atrás
                </button>
                <button
                  type="submit"
                  className="approval-panel__reject-btn"
                  disabled={submitting || !comment.trim()}
                >
                  <XCircle size={14} />
                  {submitting ? 'Rechazando...' : 'Confirmar rechazo'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
