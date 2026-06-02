import { useMemo } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { CalendarDays, User, Music2, Hash } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import './SongHistoryTimeline.css';

dayjs.locale('es');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Canonical month key: "YYYY-MM" */
function monthKey(dateStr) {
  return dayjs(dateStr).format('YYYY-MM');
}

/** Display label: "marzo 2025" (Spanish, capitalised first letter) */
function monthLabel(dateStr) {
  const raw = dayjs(dateStr).format('MMMM YYYY');
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/** "lun 3 mar" */
function shortDate(dateStr) {
  return dayjs(dateStr).format('ddd D MMM');
}

const EVENT_TYPE_VARIANT = {
  'Culto Principal':   'orange',
  'Servicio Midweek':  'info',
  'Jóvenes':           'success',
  'Conferencia':       'warning',
};

function typeVariant(type) {
  return EVENT_TYPE_VARIANT[type] ?? 'default';
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SongRow({ song }) {
  if (!song) return null;
  return (
    <li className="sht-song-row">
      <Music2 size={11} className="sht-song-row__icon" />
      <span className="sht-song-row__title">{song.title}</span>
      {song.key && (
        <span className="sht-key-badge">{song.key}</span>
      )}
    </li>
  );
}

function TimelineEventCard({ event, songsMap }) {
  const variant = typeVariant(event.type);

  return (
    <article className="sht-event-card card">
      <div className="sht-event-card__header">
        <div className="sht-event-card__date-col">
          <CalendarDays size={12} className="sht-event-card__date-icon" />
          <span className="sht-event-card__date">{shortDate(event.date)}</span>
        </div>
        <span className={`badge badge-${variant} sht-event-card__type-badge`}>
          {event.type}
        </span>
      </div>

      <h4 className="sht-event-card__title">{event.title}</h4>

      <div className="sht-event-card__director">
        <User size={12} className="sht-event-card__director-icon" />
        <span>{event.directorName}</span>
      </div>

      {event.songs && event.songs.length > 0 && (
        <ul className="sht-song-list">
          {event.songs.map((songId) => (
            <SongRow key={songId} song={songsMap[songId] ?? null} />
          ))}
        </ul>
      )}

      {event.notes && (
        <p className="sht-event-card__notes">{event.notes}</p>
      )}
    </article>
  );
}

function MonthGroup({ monthStr, events, songsMap }) {
  return (
    <div className="sht-month-group">
      <div className="sht-month-header">
        <span className="sht-month-header__label">{monthLabel(monthStr)}</span>
        <span className="sht-month-header__count">
          {events.length} {events.length === 1 ? 'evento' : 'eventos'}
        </span>
      </div>

      <div className="sht-month-events">
        {events.map((event) => (
          <div key={event.id} className="sht-timeline-row">
            <div className="sht-timeline-line" aria-hidden="true">
              <div className="sht-timeline-dot" />
            </div>
            <TimelineEventCard event={event} songsMap={songsMap} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function SongHistoryTimeline() {
  const { events, songs } = useApp();

  // O(1) song lookup by id
  const songsMap = useMemo(
    () => songs.reduce((acc, s) => { acc[s.id] = s; return acc; }, {}),
    [songs]
  );

  // Filter to completed events only, sorted newest first
  const completedEvents = useMemo(
    () =>
      events
        .filter((e) => e.status === 'completed')
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [events]
  );

  // Group by month, preserving newest-first order within each group
  const monthGroups = useMemo(() => {
    const order = [];  // keys in insertion order (newest month first)
    const map = {};    // monthKey -> [event]

    for (const event of completedEvents) {
      const key = monthKey(event.date);
      if (!map[key]) {
        map[key] = [];
        order.push(key);
      }
      map[key].push(event);
    }

    return order.map((key) => ({
      key,
      // use first event's date to build the label
      dateRef: map[key][0].date,
      events: map[key],
    }));
  }, [completedEvents]);

  if (!completedEvents.length) {
    return (
      <div className="empty-state">
        <Hash size={40} className="empty-state-icon" />
        <p>Aún no hay eventos completados en el historial.</p>
      </div>
    );
  }

  return (
    <section className="song-history-timeline">
      {monthGroups.map(({ key, dateRef, events: mEvents }) => (
        <MonthGroup
          key={key}
          monthStr={dateRef}
          events={mEvents}
          songsMap={songsMap}
        />
      ))}
    </section>
  );
}
