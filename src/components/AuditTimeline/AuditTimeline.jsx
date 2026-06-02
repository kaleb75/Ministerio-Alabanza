import { CheckCircle, XCircle, Plus, X, CalendarDays } from 'lucide-react';
import { ACTION_TYPES, ACTION_LABELS, ACTION_COLORS } from '../../services/auditService';
import './AuditTimeline.css';

const ACTION_ICONS = {
  [ACTION_TYPES.REQUEST_CREATED]:   Plus,
  [ACTION_TYPES.REQUEST_APPROVED]:  CheckCircle,
  [ACTION_TYPES.REQUEST_REJECTED]:  XCircle,
  [ACTION_TYPES.REQUEST_CANCELLED]: X,
  [ACTION_TYPES.EVENT_UPDATED]:     CalendarDays,
};

function formatTimeAgo(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return 'hace un momento';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  const days = Math.floor(diff / 86400);
  if (days < 30) return `hace ${days} ${days === 1 ? 'día' : 'días'}`;
  const date = new Date(isoString);
  return date.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AuditTimeline({ logs = [], limit = null }) {
  const displayLogs = limit ? logs.slice(0, limit) : logs;

  if (!displayLogs.length) {
    return (
      <div className="audit-timeline__empty">
        <CalendarDays size={28} />
        <p>No hay registros de auditoría</p>
      </div>
    );
  }

  return (
    <div className="audit-timeline">
      {displayLogs.map((log, i) => {
        const Icon = ACTION_ICONS[log.actionType] || Plus;
        const color = ACTION_COLORS[log.actionType] || '#636366';
        const label = ACTION_LABELS[log.actionType] || log.actionType;

        return (
          <div key={log.id} className="audit-timeline__item">
            <div className="audit-timeline__track">
              <div className="audit-timeline__dot" style={{ background: color, boxShadow: `0 0 0 3px ${color}22` }}>
                <Icon size={11} color="#fff" />
              </div>
              {i < displayLogs.length - 1 && <div className="audit-timeline__line" />}
            </div>

            <div className="audit-timeline__content">
              <div className="audit-timeline__top">
                <span className="audit-timeline__action" style={{ color }}>{label}</span>
                <span className="audit-timeline__time">{formatTimeAgo(log.timestamp)}</span>
              </div>
              <p className="audit-timeline__desc">{log.description}</p>
              <span className="audit-timeline__by">{log.performedByName}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
