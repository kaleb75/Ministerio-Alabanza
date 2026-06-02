import { useMemo, useState } from 'react';
import { CalendarDays, Music2, BarChart2, Hash, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useSongIntelligence } from '../../context/SongIntelligenceContext';
import { useWorkflow } from '../../context/WorkflowContext';
import DashboardStats from '../../components/DashboardStats/DashboardStats';
import SongHistoryTimeline from '../../components/SongHistoryTimeline/SongHistoryTimeline';
import AuditTimeline from '../../components/AuditTimeline/AuditTimeline';
import './History.css';

const HISTORY_TABS = [
  { id: 'events', label: 'Cultos' },
  { id: 'audit', label: 'Auditoría' },
];

export default function History() {
  const { events } = useApp();
  const { analytics } = useSongIntelligence();
  const { auditLogs } = useWorkflow();
  const [activeTab, setActiveTab] = useState('events');

  const completedEvents = useMemo(
    () => events.filter((e) => e.status === 'completed'),
    [events]
  );

  const stats = useMemo(() => {
    const count = completedEvents.length;

    const totalSongsUsed = completedEvents.reduce(
      (sum, e) => sum + (e.songs ? e.songs.length : 0),
      0
    );

    const uniqueSongIds = new Set(
      completedEvents.flatMap((e) => (e.songs ? e.songs : []))
    );

    const avgSongsPerEvent =
      count > 0 ? Math.round((totalSongsUsed / count) * 10) / 10 : 0;

    return {
      count,
      totalSongsUsed,
      uniqueSongsCount: uniqueSongIds.size,
      avgSongsPerEvent,
    };
  }, [completedEvents]);

  return (
    <div className="history page-enter">
      <div className="page-header">
        <h1>Historial</h1>
        <p>Registro de cultos y trazabilidad del sistema</p>
      </div>

      <div className="history-stats-grid">
        <DashboardStats
          icon={CalendarDays}
          label="Eventos Completados"
          value={stats.count}
          variant="default"
          sublabel="cultos registrados"
        />
        <DashboardStats
          icon={Music2}
          label="Canciones Usadas"
          value={stats.totalSongsUsed}
          variant="info"
          sublabel="apariciones totales"
        />
        <DashboardStats
          icon={Hash}
          label="Canciones Únicas"
          value={stats.uniqueSongsCount}
          variant="success"
          sublabel="del catálogo"
        />
        <DashboardStats
          icon={BarChart2}
          label="Promedio por Evento"
          value={stats.avgSongsPerEvent}
          variant="warning"
          sublabel="canciones / culto"
        />
      </div>

      <div className="history-tabs">
        {HISTORY_TABS.map((tab) => (
          <button
            key={tab.id}
            className={`history-tab ${activeTab === tab.id ? 'history-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'events' && (
        <section className="history-timeline-section">
          <SongHistoryTimeline />
        </section>
      )}

      {activeTab === 'audit' && (
        <section className="history-timeline-section">
          <div className="card" style={{ padding: '20px' }}>
            <AuditTimeline logs={auditLogs} />
          </div>
        </section>
      )}
    </div>
  );
}
