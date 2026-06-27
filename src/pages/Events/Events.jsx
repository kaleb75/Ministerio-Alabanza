import { useState, useMemo } from 'react';
import {
  CalendarDays, Plus, Pencil, Trash2,
  CheckCircle, XCircle, Clock, AlertTriangle,
  User, Video, Radio, Mic2, BookOpen,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { canPerformAction, canEditEvent, canDeleteEvent, canAdvanceEvent } from '../../utils/permissions';
import EventFormModal from '../../components/EventFormModal/EventFormModal';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import { formatDate, formatTime } from '../../utils/dateUtils';
import { EVENT_STATUS_LABELS, RESPONSIBILITY_LABELS } from '../../utils/constants';
import './Events.css';

const RESP_ICONS = {
  director_principal:  User,
  director_secundario: User,
  proyeccion:          Video,
  streaming:           Radio,
  predicador:          Mic2,
};

const STATUS_CYCLE = {
  upcoming:    'in_progress',
  in_progress: 'completed',
  completed:   null,
  cancelled:   null,
};

const STATUS_VARIANT = {
  upcoming:    'badge-info',
  in_progress: 'badge-orange',
  completed:   'badge-success',
  cancelled:   'badge-danger',
};

export default function Events() {
  const { events, songs, addEvent, updateEvent, deleteEvent, updateEventStatus } = useApp();
  const { user } = useAuth();

  // Admins/lideres can create events; directors cannot (they get assigned)
  const canCreate = canPerformAction(user, 'events', 'create');
  // Edit/delete/advance are now checked per-event based on ownership (see helpers below)

  const [formModal, setFormModal]       = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving]             = useState(false);

  const upcoming  = events.filter((e) => e.status === 'upcoming')
                          .sort((a, b) => new Date(a.date) - new Date(b.date));
  const inProgress = events.filter((e) => e.status === 'in_progress');

  // Song IDs that appear in more than one upcoming/in-progress event
  const repeatedSongIds = useMemo(() => {
    const count = {};
    for (const ev of [...upcoming, ...inProgress]) {
      for (const sid of (ev.songs ?? [])) {
        count[sid] = (count[sid] ?? 0) + 1;
      }
    }
    return new Set(Object.keys(count).filter((sid) => count[sid] > 1));
  }, [upcoming, inProgress]);
  const completed = events.filter((e) => e.status === 'completed')
                          .sort((a, b) => new Date(b.date) - new Date(a.date));
  const cancelled = events.filter((e) => e.status === 'cancelled');

  async function handleSave(data) {
    setSaving(true);
    try {
      if (formModal === 'create') {
        await addEvent(data);
      } else {
        await updateEvent(formModal.id, data);
      }
      setFormModal(null);
    } catch (err) {
      console.error('Error guardando evento:', err);
      alert('Error al guardar el evento: ' + (err?.message ?? 'Error desconocido'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await deleteEvent(deleteTarget.id);
    } catch (err) {
      console.error('Error eliminando evento:', err);
    }
    setDeleteTarget(null);
  }

  return (
    <div className="events-page page-enter">
      <div className="page-header page-header--flex">
        <div>
          <h1>Cultos</h1>
          <p>
            {upcoming.length} próximos · {inProgress.length} en curso · {completed.length} realizados
          </p>
        </div>
        {canCreate && (
          <button className="btn btn-primary" onClick={() => setFormModal('create')}>
            <Plus size={16} />
            Nuevo culto
          </button>
        )}
      </div>

      {/* In progress */}
      {inProgress.length > 0 && (
        <section className="events-section">
          <div className="section-title">En Curso</div>
          <div className="events-grid stagger-children">
            {inProgress.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                songs={songs}
                canEdit={canEditEvent(user, event)}
                canDelete={canDeleteEvent(user)}
                canAdvance={canAdvanceEvent(user, event)}
                onEdit={() => setFormModal(event)}
                onDelete={() => setDeleteTarget(event)}
                onStatusChange={updateEventStatus}
                repeatedSongIds={repeatedSongIds}
              />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      <section className="events-section">
        <div className="section-title">Próximos Cultos</div>
        {upcoming.length > 0 ? (
          <div className="events-grid stagger-children">
            {upcoming.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                songs={songs}
                canEdit={canEditEvent(user, event)}
                canDelete={canDeleteEvent(user)}
                canAdvance={canAdvanceEvent(user, event)}
                onEdit={() => setFormModal(event)}
                onDelete={() => setDeleteTarget(event)}
                onStatusChange={updateEventStatus}
                repeatedSongIds={repeatedSongIds}
              />
            ))}
          </div>
        ) : (
          <div className="card empty-state">
            <CalendarDays size={36} className="empty-state-icon" />
            <p>No hay cultos próximos programados</p>
            {canCreate && (
              <button className="btn btn-primary" onClick={() => setFormModal('create')}>
                <Plus size={14} /> Crear culto
              </button>
            )}
          </div>
        )}
      </section>

      {/* Completed */}
      {completed.length > 0 && (
        <section className="events-section">
          <div className="section-title">Historial de Cultos</div>
          <div className="events-grid stagger-children">
            {completed.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                songs={songs}
                canEdit={canEditEvent(user, event)}
                canDelete={canDeleteEvent(user)}
                canAdvance={canAdvanceEvent(user, event)}
                onEdit={() => setFormModal(event)}
                onDelete={() => setDeleteTarget(event)}
                onStatusChange={updateEventStatus}
                compact
              />
            ))}
          </div>
        </section>
      )}

      {/* Cancelled */}
      {cancelled.length > 0 && (
        <section className="events-section">
          <div className="section-title">Cancelados</div>
          <div className="events-grid stagger-children">
            {cancelled.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                songs={songs}
                canEdit={canEditEvent(user, event)}
                canDelete={canDeleteEvent(user)}
                canAdvance={canAdvanceEvent(user, event)}
                onEdit={() => setFormModal(event)}
                onDelete={() => setDeleteTarget(event)}
                onStatusChange={updateEventStatus}
                compact
              />
            ))}
          </div>
        </section>
      )}

      {/* Modals */}
      {formModal !== null && (
        <EventFormModal
          event={formModal === 'create' ? null : formModal}
          onSave={handleSave}
          onClose={() => setFormModal(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Eliminar culto"
          message={`¿Eliminar "${deleteTarget.title}"? Esta acción no se puede deshacer.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

function EventRow({ event, songs, canEdit, canDelete, canAdvance, onEdit, onDelete, onStatusChange, repeatedSongIds = new Set(), compact = false }) {
  const { id, title, date, time, type, songs: songIds = [], status, notes, serviceResponsibilities, sermon, bibleReading } = event;

  const eventSongs = songs.filter((s) => songIds.includes(s.id));
  const nextStatus = STATUS_CYCLE[status];
  const showActions = canEdit || canDelete || canAdvance;

  // Derive director name from primary responsibility
  const primaryResp = serviceResponsibilities?.find((r) => r.type === 'director_principal' && r.assignedUserName);
  const directorDisplay = primaryResp?.assignedUserName || event.directorName || '';

  // Other assigned responsibilities (non-director)
  const otherResps = (serviceResponsibilities || []).filter(
    (r) => r.assignedUserId && r.type !== 'director_principal'
  );

  // Secondary director if assigned
  const secondaryResp = serviceResponsibilities?.find((r) => r.type === 'director_secundario' && r.assignedUserName);

  return (
    <article className={`event-row card${compact ? ' event-row--compact' : ''}`}>
      <div className="event-row__top">
        <div className="event-row__badges">
          <span className={`badge ${STATUS_VARIANT[status] ?? 'badge-info'}`}>
            {EVENT_STATUS_LABELS[status] ?? status}
          </span>
          <span className="event-row__type">{type}</span>
        </div>

        {showActions && (
          <div className="event-row__actions">
            {canAdvance && nextStatus && (
              <button
                className="event-row__action-btn event-row__action-btn--advance"
                title={`Marcar como ${EVENT_STATUS_LABELS[nextStatus]}`}
                onClick={() => onStatusChange(id, nextStatus)}
              >
                <CheckCircle size={14} />
              </button>
            )}
            {canEdit && status !== 'cancelled' && (
              <button
                className="event-row__action-btn"
                title="Cancelar"
                onClick={() => onStatusChange(id, 'cancelled')}
              >
                <XCircle size={14} />
              </button>
            )}
            {canEdit && (
              <button className="event-row__action-btn" title="Editar" onClick={onEdit}>
                <Pencil size={14} />
              </button>
            )}
            {canDelete && (
              <button className="event-row__action-btn event-row__action-btn--danger" title="Eliminar" onClick={onDelete}>
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      <h3 className="event-row__title">{title}</h3>

      {/* Date / time / director */}
      <div className="event-row__meta">
        <span className="event-row__meta-item">
          <CalendarDays size={12} />
          {formatDate(date, 'D MMM YYYY')}
        </span>
        <span className="event-row__meta-item">
          <Clock size={12} />
          {formatTime(time)}
        </span>
        {directorDisplay && (
          <span className="event-row__meta-item">
            <User size={12} />
            {directorDisplay}
            {secondaryResp && <span className="event-row__meta-secondary"> + {secondaryResp.assignedUserName}</span>}
          </span>
        )}
      </div>

      {/* Other responsibilities (proyeccion, streaming, predicador) */}
      {!compact && otherResps.length > 0 && (
        <div className="event-row__resps">
          {otherResps.map((resp) => {
            const Icon = RESP_ICONS[resp.type] || User;
            return (
              <span key={resp.id} className="event-row__resp-chip">
                <Icon size={11} />
                <span className="event-row__resp-label">{RESPONSIBILITY_LABELS[resp.type]}</span>
                <span className="event-row__resp-name">{resp.assignedUserName}</span>
              </span>
            );
          })}
        </div>
      )}

      {/* Songs */}
      {!compact && eventSongs.length > 0 && (
        <div className="event-row__songs">
          {eventSongs.slice(0, 3).map((s) => {
            const repeated = repeatedSongIds.has(String(s.id));
            return (
              <span
                key={s.id}
                className={`event-row__song-chip${repeated ? ' event-row__song-chip--repeat' : ''}`}
                title={repeated ? 'Esta canción ya está en otro culto próximo' : undefined}
              >
                {repeated && <AlertTriangle size={10} />}
                {s.title}
                {s.key && <em>{s.key}</em>}
              </span>
            );
          })}
          {eventSongs.length > 3 && (
            <span className="event-row__song-chip event-row__song-chip--more">
              +{eventSongs.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Sermon */}
      {!compact && sermon?.book && (
        <div className="event-row__word-row">
          <Mic2 size={12} />
          <span className="event-row__word-ref">
            {sermon.book} {sermon.chapter}{sermon.verses ? `:${sermon.verses}` : ''}
          </span>
          {sermon.title && <span className="event-row__word-title"> — {sermon.title}</span>}
        </div>
      )}

      {/* Bible reading */}
      {!compact && bibleReading?.book && (
        <div className="event-row__word-row">
          <BookOpen size={12} />
          <span className="event-row__word-ref">
            {bibleReading.book} {bibleReading.chapter}{bibleReading.verses ? `:${bibleReading.verses}` : ''}
          </span>
        </div>
      )}

      {!compact && notes && (
        <p className="event-row__notes">{notes}</p>
      )}
    </article>
  );
}
