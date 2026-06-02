import { CalendarDays, TrendingDown } from 'lucide-react';
import MiniBarChart from '../../components/Charts/MiniBarChart/MiniBarChart';
import MiniLineChart from '../../components/Charts/MiniLineChart/MiniLineChart';
import DonutChart from '../../components/Charts/DonutChart/DonutChart';
import dayjs from 'dayjs';

function ForgottenRow({ song }) {
  const days = song.daysSinceUsed;
  const badgeColor = days > 180 ? 'var(--danger)' : 'var(--warning)';
  const bgColor    = days > 180 ? 'var(--danger-dim)' : 'var(--warning-dim)';
  return (
    <div className="forgotten-row">
      <div className="forgotten-row__info">
        <span className="forgotten-row__title">{song.title}</span>
        <span className="forgotten-row__author">{song.author || '—'}</span>
      </div>
      <span className="forgotten-row__date">
        {song.lastUsed ? dayjs(song.lastUsed).format('DD/MM/YYYY') : 'Nunca'}
      </span>
      <span className="forgotten-row__badge" style={{ color: badgeColor, background: bgColor }}>
        {days >= 9999 ? 'Sin uso' : `${days}d`}
      </span>
    </div>
  );
}

export default function SongTrendsTab({ analytics, songFocus = false }) {
  const { topSongs, genreDistribution, keyDistribution, usageByMonth, eventsPerMonth, forgotten } = analytics;

  const lineData    = usageByMonth.map(m => m.count);
  const eventsData  = eventsPerMonth.map(m => m.count);
  const firstMonth  = usageByMonth[0]?.label || '';
  const lastMonth   = usageByMonth[usageByMonth.length - 1]?.label || '';

  const donutData = genreDistribution.map(g => ({
    label: g.genre, value: g.count, color: g.color,
  }));

  const keyBarData = keyDistribution.map(k => ({
    label: k.key, value: k.count, color: 'var(--info)',
  }));

  return (
    <div className="analytics__content">
      {/* Top songs */}
      <div className="card analytics-card">
        <div className="analytics-card__title">
          {songFocus ? 'Canciones más usadas' : 'Canciones más usadas'}
        </div>
        {topSongs.length > 0 ? (
          <MiniBarChart
            data={topSongs.map(s => ({ label: s.title, value: s.timesUsed }))}
            max={topSongs[0]?.timesUsed || 1}
            unit=" usos"
          />
        ) : (
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>Sin datos de uso aún</p>
        )}
      </div>

      <div className="analytics-grid-2">
        {/* Genre donut */}
        <div className="card analytics-card">
          <div className="analytics-card__title">Géneros del repertorio</div>
          {donutData.length > 0 ? (
            <DonutChart
              data={donutData}
              size={130}
              strokeWidth={20}
              centerValue={donutData.length}
              centerLabel="géneros"
            />
          ) : (
            <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>Sin canciones</p>
          )}
        </div>

        {/* Key distribution */}
        <div className="card analytics-card">
          <div className="analytics-card__title">Tonalidades más frecuentes</div>
          {keyBarData.length > 0 ? (
            <MiniBarChart data={keyBarData} />
          ) : (
            <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>Sin datos</p>
          )}
        </div>
      </div>

      {/* Usage trend */}
      {!songFocus && (
        <div className="card analytics-card">
          <div className="analytics-card__title">
            Actividad mensual &nbsp;
            <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>
              {firstMonth} — {lastMonth}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginBottom: 8 }}>Canciones usadas</div>
              <MiniLineChart data={lineData} color="var(--accent-orange)" height={70} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginBottom: 8 }}>Cultos realizados</div>
              <MiniLineChart data={eventsData} color="var(--info)" height={70} />
            </div>
          </div>
        </div>
      )}

      {/* Forgotten songs */}
      <div className="card analytics-card">
        <div className="analytics-card__title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingDown size={16} style={{ color: 'var(--warning)' }} />
          Canciones olvidadas (más de 90 días sin usar)
          {forgotten.length > 0 && (
            <span className="badge badge-warning" style={{ marginLeft: 'auto' }}>{forgotten.length}</span>
          )}
        </div>
        {forgotten.length > 0 ? (
          <div className="forgotten-list">
            {forgotten.slice(0, 10).map(s => <ForgottenRow key={s.id} song={s} />)}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '24px' }}>
            <CalendarDays size={28} className="empty-state-icon" />
            <p>¡Excelente! Todas las canciones han sido usadas recientemente</p>
          </div>
        )}
      </div>

      <style>{`
        .forgotten-list { display:flex; flex-direction:column; }
        .forgotten-row { display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--border-subtle); }
        .forgotten-row:last-child { border-bottom:none; }
        .forgotten-row__info { flex:1; min-width:0; display:flex; flex-direction:column; gap:1px; }
        .forgotten-row__title { font-size:var(--font-size-sm); font-weight:600; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .forgotten-row__author { font-size:var(--font-size-xs); color:var(--text-tertiary); }
        .forgotten-row__date { font-size:var(--font-size-xs); color:var(--text-secondary); flex-shrink:0; }
        .forgotten-row__badge { font-size:10px; font-weight:700; padding:2px 7px; border-radius:var(--radius-full); flex-shrink:0; }
      `}</style>
    </div>
  );
}
