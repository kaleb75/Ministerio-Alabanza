import { ChevronRight, Clock, Calendar, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWorkflow } from '../../context/WorkflowContext';
import { REQUEST_TYPE_LABELS } from '../../utils/workflowRules';
import { ROUTES } from '../../utils/constants';
import './PendingRequests.css';

export default function PendingRequests() {
  const { pendingRequests } = useWorkflow();
  const navigate = useNavigate();

  if (!pendingRequests.length) {
    return (
      <div className="pending-requests card">
        <div className="pending-requests__empty">
          <Clock size={24} className="pending-requests__empty-icon" />
          <p>Sin solicitudes pendientes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pending-requests card">
      {pendingRequests.slice(0, 4).map((req) => (
        <div
          key={req.id}
          className="pending-req-item"
          onClick={() => navigate(ROUTES.REQUESTS)}
          role="button"
          tabIndex={0}
        >
          <div className="pending-req-item__icon">
            {req.requestType === 'date_change' ? <Calendar size={14} /> : <RotateCcw size={14} />}
          </div>
          <div className="pending-req-item__body">
            <span className="pending-req-item__event">{req.originalEventTitle}</span>
            <span className="pending-req-item__meta">
              {req.requesterName} · {REQUEST_TYPE_LABELS[req.requestType] || req.requestType}
            </span>
          </div>
          <ChevronRight size={14} className="pending-req-item__arrow" />
        </div>
      ))}

      {pendingRequests.length > 4 && (
        <button
          className="pending-requests__more"
          onClick={() => navigate(ROUTES.REQUESTS)}
        >
          Ver {pendingRequests.length - 4} más
          <ChevronRight size={13} />
        </button>
      )}
    </div>
  );
}
