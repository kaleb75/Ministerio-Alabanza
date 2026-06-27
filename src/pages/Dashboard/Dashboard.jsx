import {
  CalendarDays, Music2, Users, Inbox,
  History, BookOpen, Mic2, Video, Radio, User,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useSongIntelligence } from '../../hooks/useSongIntelligence';
import { useWorkflow } from '../../context/WorkflowContext';
import DashboardStats from '../../components/DashboardStats/DashboardStats';
import EventCard from '../../components/EventCard/EventCard';
import SongInsights from '../../components/SongInsights/SongInsights';
import PendingRequests from '../../components/PendingRequests/PendingRequests';
import { formatDate, formatTime } from '../../utils/dateUtils';
import { RESPONSIBILITY_LABELS } from '../../utils/constants';
import './Dashboard.css';

const RESP_ICONS = {
  director_principal:  User,
  director_secundario: User,
  proyeccion:          Video,
  streaming:           Radio,
  predicador:          Mic2,
};

export default function Dashboard() {
  const { songs, events, users, upcomingEvents, nextEvent } = useApp();
  const { varietyScore } = useSongIntelligence();
  const { pendingRequests } = useWorkflow();

  const completedEvents = events.filter((e) => e.status === 'completed');
  const activeUsers = users.filter((u) => u.active);

  const recentHistory = completedEvents
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);

  const nextEventSongs = nextEvent
    ? songs.filter((s) => nextEvent.songs.includes(s.id))
    : [];

  const nextResponsibilities = nextEvent?.serviceResponsibilities?.filter(
    (r) => r.assignedUserId
  ) ?? [];

  const nextSermon = nextEvent?.sermon;
  const nextBibleReading = nextEvent?.bibleReading;

  return (
    <div className="dashboard">
      {/* Stats row */}
      <section className="dashboard__stats stagger-children">
        <DashboardStats
          icon={CalendarDays}
          label="Cultos próximos"
          value={upcomingEvents.length}
          variant="orange"
          sublabel="programados"
        />
        <DashboardStats
          icon={Music2}
          label="Canciones"
          value={songs.length}
          variant="info"
          sublabel="en repertorio"
        />
        <DashboardStats
          icon={Users}
          label="Usuarios"
          value={activeUsers.length}
          variant="success"
          sublabel="activos"
        />
        <DashboardStats
          icon={Inbox}
          label="Solicitudes"
          value={pendingRequests.length}
          variant="warning"
          sublabel="pendientes"
        />
      </section>

      <div className="dashboard__grid">
        {/* Next event */}
        <section className="dashboard__section dashboard__section--next-event">
          <div className="section-title">Próximo Culto</div>
          {nextEvent ? (
            <EventCard event={nextEvent} />
          ) : (
            <div className="card empty-state">
              <CalendarDays size={32} className="empty-state-icon" />
              <p>No hay cultos programados</p>
            </div>
          )}
        </section>

        {/* Responsibilities */}
        <section className="dashboard__section">
          <div className="section-title">Responsabilidades</div>
          <div className="card dashboard__resp-card">
            {nextResponsibilities.length > 0 ? (
              nextResponsibilities.map((resp) => {
                const Icon = RESP_ICONS[resp.type] || User;
                return (
                  <div key={resp.id} className="dashboard__resp-row">
                    <div className="dashboard__resp-label">
                      <Icon size={14} />
                      <span>{RESPONSIBILITY_LABELS[resp.type] || resp.type}</span>
                    </div>
                    <span className="dashboard__resp-name">{resp.assignedUserName}</span>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                <Users size={28} className="empty-state-icon" />
                <p>Sin responsabilidades asignadas</p>
              </div>
            )}
          </div>
        </section>

        {/* Songs */}
        <section className="dashboard__section">
          <div className="section-title">Cantos Seleccionados</div>
          <div className="dashboard__songs-list card">
            {nextEventSongs.length > 0 ? (
              nextEventSongs.map((song, i) => (
                <div key={song.id} className="dashboard__song-item">
                  <div className="dashboard__song-num">{i + 1}</div>
                  <div className="dashboard__song-info">
                    <span className="dashboard__song-title">{song.title}</span>
                    <span className="dashboard__song-author">{song.author}</span>
                  </div>
                  {song.key && (
                    <div className="dashboard__song-key">
                      <span className="badge badge-orange">{song.key}</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="empty-state">
                <Music2 size={28} className="empty-state-icon" />
                <p>Sin canciones asignadas</p>
              </div>
            )}
          </div>
        </section>

        {/* Sermon + Bible reading */}
        {nextEvent && (nextSermon?.title || nextSermon?.book || nextBibleReading?.book) && (
          <section className="dashboard__section">
            <div className="section-title">Palabra</div>
            <div className="card dashboard__word-card">
              {nextSermon?.book && (
                <div className="dashboard__word-block">
                  <div className="dashboard__word-label">
                    <Mic2 size={13} />
                    <span>Sermón</span>
                  </div>
                  <div className="dashboard__word-content">
                    {nextSermon.title && (
                      <span className="dashboard__word-title">{nextSermon.title}</span>
                    )}
                    <span className="dashboard__word-ref">
                      {nextSermon.book} {nextSermon.chapter}{nextSermon.verses ? `:${nextSermon.verses}` : ''}
                    </span>
                  </div>
                </div>
              )}
              {nextBibleReading?.book && (
                <div className="dashboard__word-block">
                  <div className="dashboard__word-label">
                    <BookOpen size={13} />
                    <span>Lectura Bíblica</span>
                  </div>
                  <div className="dashboard__word-content">
                    <span className="dashboard__word-ref">
                      {nextBibleReading.book} {nextBibleReading.chapter}{nextBibleReading.verses ? `:${nextBibleReading.verses}` : ''}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Song intelligence */}
        <section className="dashboard__section">
          <div className="section-title">Inteligencia Musical</div>
          <SongInsights />
        </section>

        {/* Pending requests */}
        <section className="dashboard__section">
          <div className="section-title">Solicitudes Pendientes</div>
          <PendingRequests />
        </section>

        {/* Recent history */}
        <section className="dashboard__section dashboard__section--history">
          <div className="section-title">Historial Reciente</div>
          <div className="dashboard__history-list">
            {recentHistory.map((event) => {
              const primaryResp = event.serviceResponsibilities?.find(
                (r) => r.type === 'director_principal' && r.assignedUserName
              );
              const displayName = primaryResp?.assignedUserName || event.directorName || '—';
              return (
                <div key={event.id} className="card dashboard__history-item">
                  <div className="dashboard__history-icon">
                    <History size={16} />
                  </div>
                  <div className="dashboard__history-info">
                    <span className="dashboard__history-title">{event.title}</span>
                    <span className="dashboard__history-meta">
                      {formatDate(event.date, 'D MMM YYYY')} · {displayName}
                    </span>
                    <span className="dashboard__history-songs">
                      {event.songs.length} canción{event.songs.length !== 1 ? 'es' : ''}
                    </span>
                  </div>
                  <span className="badge badge-success">Completado</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
