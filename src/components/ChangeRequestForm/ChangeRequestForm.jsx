import { useState } from 'react';
import { X, Calendar, RotateCcw, AlertCircle } from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { REQUEST_TYPES, REQUEST_TYPE_LABELS } from '../../utils/workflowRules';
import './ChangeRequestForm.css';

export default function ChangeRequestForm({ onClose }) {
  const { user } = useAuth();
  const { upcomingEvents } = useApp();
  const { createRequest } = useWorkflow();

  const [selectedEventId, setSelectedEventId] = useState('');
  const [requestType, setRequestType] = useState(REQUEST_TYPES.DATE_CHANGE);
  const [requestedDate, setRequestedDate] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const selectedEvent = upcomingEvents.find((e) => e.id === Number(selectedEventId));

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);

    const data = {
      requesterId: user.id,
      requesterName: user.name,
      requesterRole: user.role,
      originalEventId: Number(selectedEventId),
      originalEventTitle: selectedEvent?.title || '',
      originalDate: selectedEvent?.date || '',
      requestType,
      requestedDate: requestType === REQUEST_TYPES.DATE_CHANGE ? requestedDate : null,
      swapWithEventId: null,
      swapWithDirectorName: null,
      reason: reason.trim(),
    };

    const result = createRequest(data, upcomingEvents);
    setSubmitting(false);

    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    onClose?.();
  }

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="req-form">
        <div className="req-form__header">
          <h2 className="req-form__title">Nueva Solicitud de Cambio</h2>
          <button className="req-form__close" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="req-form__body">
          {errors.length > 0 && (
            <div className="req-form__errors">
              {errors.map((err, i) => (
                <div key={i} className="req-form__error-item">
                  <AlertCircle size={13} />
                  {err}
                </div>
              ))}
            </div>
          )}

          <div className="req-form__field">
            <label className="req-form__label">Evento</label>
            <select
              className="req-form__select"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              required
            >
              <option value="">Seleccionar evento...</option>
              {upcomingEvents.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} — {ev.date}
                </option>
              ))}
            </select>
          </div>

          <div className="req-form__field">
            <label className="req-form__label">Tipo de solicitud</label>
            <div className="req-form__type-pills">
              {Object.entries(REQUEST_TYPE_LABELS).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  className={`req-form__type-pill ${requestType === val ? 'req-form__type-pill--active' : ''}`}
                  onClick={() => setRequestType(val)}
                >
                  {val === REQUEST_TYPES.DATE_CHANGE ? <Calendar size={13} /> : <RotateCcw size={13} />}
                  {label}
                </button>
              ))}
            </div>
          </div>

          {requestType === REQUEST_TYPES.DATE_CHANGE && (
            <div className="req-form__field">
              <label className="req-form__label">Nueva fecha solicitada</label>
              <input
                type="date"
                className="req-form__input"
                value={requestedDate}
                min={todayStr}
                onChange={(e) => setRequestedDate(e.target.value)}
                required
              />
            </div>
          )}

          {requestType === REQUEST_TYPES.REASSIGN && (
            <div className="req-form__info-box">
              <AlertCircle size={14} />
              <span>Se solicitará reasignación a un director disponible. El líder coordinará el reemplazo.</span>
            </div>
          )}

          <div className="req-form__field">
            <label className="req-form__label">Motivo <span className="req-form__required">*</span></label>
            <textarea
              className="req-form__textarea"
              placeholder="Explica el motivo de tu solicitud..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="req-form__actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !selectedEventId || !reason.trim()}
            >
              {submitting ? 'Enviando...' : 'Enviar Solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
