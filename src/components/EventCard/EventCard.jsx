import { CalendarDays, Clock, User, Music2, ChevronRight } from 'lucide-react';
import { formatDate, formatTime, daysUntil } from '../../utils/dateUtils';
import { EVENT_STATUS_LABELS } from '../../utils/constants';
import './EventCard.css';

const STATUS_VARIANT = {
  upcoming: 'badge-info',
  in_progress: 'badge-orange',
  completed: 'badge-success',
  cancelled: 'badge-danger',
};

export default function EventCard({ event, compact = false }) {
  const { title, date, time, type, directorName, songs, status, notes } = event;
  const days = daysUntil(date);
  const daysLabel =
    days === 0 ? 'Hoy' :
    days === 1 ? 'Mañana' :
    days > 1   ? `En ${days} días` : null;

  return (
    <article className={`event-card card card-interactive${compact ? ' event-card--compact' : ''}`}>
      <div className="event-card__header">
        <div className="event-card__type-row">
          <span className={`badge ${STATUS_VARIANT[status] ?? 'badge-info'}`}>
            {EVENT_STATUS_LABELS[status] ?? status}
          </span>
          <span className="event-card__type">{type}</span>
        </div>
        <ChevronRight size={16} className="event-card__arrow" />
      </div>

      <h3 className="event-card__title">{title}</h3>

      <div className="event-card__meta">
        <span className="event-card__meta-item">
          <CalendarDays size={13} />
          {formatDate(date, 'D MMM YYYY')}
          {daysLabel && (
            <em className="event-card__days-label"> · {daysLabel}</em>
          )}
        </span>
        <span className="event-card__meta-item">
          <Clock size={13} />
          {formatTime(time)}
        </span>
        <span className="event-card__meta-item">
          <User size={13} />
          {directorName}
        </span>
        {!compact && (
          <span className="event-card__meta-item">
            <Music2 size={13} />
            {songs.length} {songs.length === 1 ? 'canción' : 'canciones'}
          </span>
        )}
      </div>

      {!compact && notes && (
        <p className="event-card__notes">{notes}</p>
      )}
    </article>
  );
}
