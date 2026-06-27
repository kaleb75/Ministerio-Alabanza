import { CalendarDays, Clock, User, Music2, BookOpen, Mic2, Video, Radio } from 'lucide-react';
import { formatDate, formatTime, daysUntil } from '../../utils/dateUtils';
import { EVENT_STATUS_LABELS, RESPONSIBILITY_LABELS } from '../../utils/constants';
import './EventCard.css';

const STATUS_VARIANT = {
  upcoming:    'badge-info',
  in_progress: 'badge-orange',
  completed:   'badge-success',
  cancelled:   'badge-danger',
};

const RESP_ICONS = {
  director_principal:  User,
  director_secundario: User,
  proyeccion:          Video,
  streaming:           Radio,
  predicador:          Mic2,
};

export default function EventCard({ event, compact = false }) {
  const { title, date, time, type, songs, status, notes, serviceResponsibilities, sermon, bibleReading } = event;
  const days = daysUntil(date);
  const daysLabel =
    days === 0 ? 'Hoy' :
    days === 1 ? 'Mañana' :
    days > 1   ? `En ${days} días` : null;

  const primaryResp = serviceResponsibilities?.find((r) => r.type === 'director_principal');
  const displayDirector = primaryResp?.assignedUserName || event.directorName || '';

  const assignedResps = (serviceResponsibilities || []).filter((r) => r.assignedUserId && r.type !== 'director_principal');

  return (
    <article className={`event-card card card-interactive${compact ? ' event-card--compact' : ''}`}>
      <div className="event-card__header">
        <div className="event-card__type-row">
          <span className={`badge ${STATUS_VARIANT[status] ?? 'badge-info'}`}>
            {EVENT_STATUS_LABELS[status] ?? status}
          </span>
          <span className="event-card__type">{type}</span>
        </div>
      </div>

      <h3 className="event-card__title">{title}</h3>

      <div className="event-card__meta">
        <span className="event-card__meta-item">
          <CalendarDays size={13} />
          {formatDate(date, 'D MMM YYYY')}
          {daysLabel && <em className="event-card__days-label"> · {daysLabel}</em>}
        </span>
        <span className="event-card__meta-item">
          <Clock size={13} />
          {formatTime(time)}
        </span>
        {displayDirector && (
          <span className="event-card__meta-item">
            <User size={13} />
            {displayDirector}
          </span>
        )}
        {!compact && (
          <span className="event-card__meta-item">
            <Music2 size={13} />
            {songs.length} {songs.length === 1 ? 'canción' : 'canciones'}
          </span>
        )}
      </div>

      {/* Additional responsibilities (non-director) */}
      {!compact && assignedResps.length > 0 && (
        <div className="event-card__resps">
          {assignedResps.map((resp) => {
            const Icon = RESP_ICONS[resp.type] || User;
            return (
              <span key={resp.id} className="event-card__resp-chip">
                <Icon size={11} />
                {resp.assignedUserName}
              </span>
            );
          })}
        </div>
      )}

      {/* Sermon */}
      {!compact && sermon?.book && (
        <div className="event-card__sermon">
          <Mic2 size={12} />
          <span>{sermon.book} {sermon.chapter}{sermon.verses ? `:${sermon.verses}` : ''}</span>
          {sermon.title && <em> — {sermon.title}</em>}
        </div>
      )}

      {/* Bible reading */}
      {!compact && bibleReading?.book && (
        <div className="event-card__bible">
          <BookOpen size={12} />
          <span>{bibleReading.book} {bibleReading.chapter}{bibleReading.verses ? `:${bibleReading.verses}` : ''}</span>
        </div>
      )}

      {!compact && notes && (
        <p className="event-card__notes">{notes}</p>
      )}
    </article>
  );
}
