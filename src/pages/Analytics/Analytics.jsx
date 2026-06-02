import { useMemo, useState } from 'react';
import { TrendingUp, Music2, Users, Award, CalendarDays } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import StatCard from '../../components/Charts/StatCard/StatCard';
import SongTrendsTab from './SongTrendsTab';
import DirectorTab from './DirectorTab';
import MinistryTab from './MinistryTab';
import * as engine from '../../utils/analyticsEngine';
import './Analytics.css';

const TABS = [
  { id: 'trends',    label: 'Tendencias',  icon: TrendingUp },
  { id: 'songs',     label: 'Repertorio',  icon: Music2     },
  { id: 'directors', label: 'Directores',  icon: Users      },
  { id: 'ministry',  label: 'Ministerio',  icon: Award      },
];

export default function Analytics() {
  const { songs, events, users, songHistory } = useApp();
  const [activeTab, setActiveTab] = useState('trends');

  const analytics = useMemo(() => ({
    topSongs:         engine.computeTopSongs(songs, 10),
    genreDistribution:engine.computeGenreDistribution(songs),
    keyDistribution:  engine.computeKeyDistribution(songs),
    usageByMonth:     engine.computeUsageByMonth(songHistory, 12),
    eventsPerMonth:   engine.computeEventsPerMonth(events, 12),
    eventsByType:     engine.computeEventsByType(events),
    heatmap:          engine.computeWorshipHeatmap(events),
    directors:        engine.computeDirectorActivity(events, users),
    health:           engine.computeMinistryHealth(songs, events, songHistory),
    scheduling:       engine.computeSchedulingConsistency(events),
    repertoire:       engine.computeRepertoireHealth(songs, songHistory),
    forgotten:        engine.computeForgottenSongs(songs, 90),
  }), [songs, events, users, songHistory]);

  const activeDirectors = users.filter(u =>
    ['admin','lider_directores','director'].includes(u.role) && u.active
  ).length;

  const healthColor =
    analytics.health.grade === 'A' ? 'success' :
    analytics.health.grade === 'B' ? 'info'    :
    analytics.health.grade === 'C' ? 'warning' : 'danger';

  return (
    <div className="analytics page-enter">
      <div className="analytics__header">
        <div>
          <h1 className="analytics__title">Análisis del Ministerio</h1>
          <p className="analytics__subtitle">Inteligencia y métricas operacionales</p>
        </div>
      </div>

      {/* KPI row */}
      <div className="analytics__kpis">
        <StatCard
          value={`${analytics.health.score}/100`}
          label={`Salud: ${analytics.health.label}`}
          sublabel={`Grado ${analytics.health.grade}`}
          icon={Award}
          color={healthColor}
        />
        <StatCard
          value={events.length}
          label="Cultos registrados"
          sublabel={`${events.filter(e=>e.status==='upcoming').length} próximos`}
          icon={CalendarDays}
          color="orange"
        />
        <StatCard
          value={analytics.repertoire.usedLastYear}
          label="Repertorio activo"
          sublabel="canciones en el último año"
          icon={Music2}
          color="info"
        />
        <StatCard
          value={activeDirectors}
          label="Equipo activo"
          sublabel="directores y líderes"
          icon={Users}
          color="success"
        />
      </div>

      {/* Tabs */}
      <div className="analytics__tabs">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`analytics__tab${activeTab === id ? ' analytics__tab--active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="analytics__content">
        {activeTab === 'trends'    && <SongTrendsTab analytics={analytics} />}
        {activeTab === 'songs'     && <SongTrendsTab analytics={analytics} songFocus />}
        {activeTab === 'directors' && <DirectorTab   analytics={analytics} />}
        {activeTab === 'ministry'  && <MinistryTab   analytics={analytics} />}
      </div>
    </div>
  );
}
