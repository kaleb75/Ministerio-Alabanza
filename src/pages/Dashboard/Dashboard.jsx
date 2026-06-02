import {
  CalendarDays, Music2, Users, Inbox,
  TrendingDown, History, ChevronRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useSongIntelligence } from '../../hooks/useSongIntelligence';
import { useWorkflow } from '../../context/WorkflowContext';
import DashboardStats from '../../components/DashboardStats/DashboardStats';
import EventCard from '../../components/EventCard/EventCard';
import SongInsights from '../../components/SongInsights/SongInsights';
import PendingRequests from '../../components/PendingRequests/PendingRequests';
import { formatDate, formatTime } from '../../utils/dateUtils';
import './Dashboard.css';

export default function Dashboard() {
  const { songs, events, users, upcomingEvents, nextEvent } = useApp();
  const { varietyScore } = useSongIntelligence();
  const { pendingRequests } = useWorkflow();

  const completedEvents = events.filter((e) => e.status === 'completed');
  const directors = users.filter((u) => u.role === 'director' || u.role === 'admin');

  const leastUsedSongs = [...songs]
    .sort((a, b) => a.timesUsed - b.timesUsed)
    .slice(0, 4);

  const recentHistory = completedEvents
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);

  const nextEventSongs = nextEvent
    ? songs.filter((s) => nextEvent.songs.includes(s.id))
    : [];

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
          label="Directores"
          value={directors.length}
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

        {/* Next event songs */}
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
                  <div className="dashboard__song-key">
                    <span className="badge badge-orange">{song.key}</span>
                  </div>
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

        {/* Song intelligence */}
        <section className="dashboard__section">
          <div className="section-title">Inteligencia Musical</div>
          <SongInsights />
        </section>

        {/* Director */}
        <section className="dashboard__section">
          <div className="section-title">Director Asignado</div>
          {nextEvent ? (
            <div className="card dashboard__director-card">
              <div className="dashboard__director-avatar">
                {nextEvent.directorName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <div className="dashboard__director-info">
                <span className="dashboard__director-name">{nextEvent.directorName}</span>
                <span className="dashboard__director-event">
                  {formatDate(nextEvent.date, 'D MMM')} · {formatTime(nextEvent.time)}
                </span>
              </div>
              <span className="badge badge-info">Asignado</span>
            </div>
          ) : (
            <div className="card empty-state">
              <Users size={28} className="empty-state-icon" />
              <p>Sin director asignado</p>
            </div>
          )}
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
            {recentHistory.map((event) => (
              <div key={event.id} className="card dashboard__history-item">
                <div className="dashboard__history-icon">
                  <History size={16} />
                </div>
                <div className="dashboard__history-info">
                  <span className="dashboard__history-title">{event.title}</span>
                  <span className="dashboard__history-meta">
                    {formatDate(event.date, 'D MMM YYYY')} · {event.directorName}
                  </span>
                  <span className="dashboard__history-songs">
                    {event.songs.length} canción{event.songs.length !== 1 ? 'es' : ''}
                  </span>
                </div>
                <span className="badge badge-success">Completado</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
