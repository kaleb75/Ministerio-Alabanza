import MiniBarChart from '../../components/Charts/MiniBarChart/MiniBarChart';
import DonutChart from '../../components/Charts/DonutChart/DonutChart';
import dayjs from 'dayjs';

const AVATAR_COLORS = ['#FF9500','#0A84FF','#32D74B','#FFD60A','#FF453A','#BF5AF2'];

const TYPE_COLORS = {
  'Culto Principal':  '#FF9500',
  'Servicio Midweek': '#0A84FF',
  'Jóvenes':          '#32D74B',
  'Conferencia':      '#FFD60A',
  'Especial':         '#FF453A',
  'Otro':             '#8E8E93',
};

const ROLE_LABELS = {
  admin:            'Administrador',
  lider_directores: 'Líder de Dir.',
  director:         'Director',
};

export default function DirectorTab({ analytics }) {
  const { directors, eventsByType } = analytics;

  const barData = directors.map((d, i) => ({
    label: d.name.split(' ')[0],
    value: d.eventCount,
    color: AVATAR_COLORS[i % AVATAR_COLORS.length],
  }));

  const donutData = eventsByType.map(t => ({
    label: t.type,
    value: t.count,
    color: TYPE_COLORS[t.type] || '#8E8E93',
  }));

  return (
    <div className="analytics__content">
      {/* Bar chart */}
      {directors.length > 0 && (
        <div className="card analytics-card">
          <div className="analytics-card__title">Cultos por director</div>
          <MiniBarChart data={barData} />
        </div>
      )}

      {/* Director cards */}
      <div className="director-grid">
        {directors.map((d, i) => {
          const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
          const pct   = d.percentOfTotal;
          return (
            <div key={d.id} className="director-stat-card card">
              <div className="director-stat-card__header">
                <div className="director-stat-card__avatar" style={{ background: color, color: '#000' }}>
                  {d.initials}
                </div>
                <div className="director-stat-card__info">
                  <span className="director-stat-card__name">{d.name}</span>
                  <span className="director-stat-card__role">{ROLE_LABELS[d.role] || d.role}</span>
                </div>
              </div>

              <div className="director-stat-card__count">
                <span className="director-stat-card__num">{d.eventCount}</span>
                <span className="director-stat-card__lbl">cultos dirigidos</span>
              </div>

              <div className="director-stat-card__bar-track">
                <div className="director-stat-card__bar-fill" style={{ width: `${pct}%`, background: color }} />
              </div>
              <span className="director-stat-card__pct">{pct}% del total</span>

              <div className="director-stat-card__stats">
                <div className="director-stat-card__stat">
                  <span className="director-stat-card__stat-val">{d.completedCount}</span>
                  <span className="director-stat-card__stat-lbl">Completados</span>
                </div>
                <div className="director-stat-card__stat">
                  <span className="director-stat-card__stat-val">{d.upcomingCount}</span>
                  <span className="director-stat-card__stat-lbl">Próximos</span>
                </div>
              </div>

              {d.lastEventDate && (
                <span className="director-stat-card__last">
                  Último culto: {dayjs(d.lastEventDate).format('D MMM YYYY')}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Event type donut */}
      {donutData.length > 0 && (
        <div className="card analytics-card" style={{ maxWidth: 380 }}>
          <div className="analytics-card__title">Distribución por tipo de culto</div>
          <DonutChart data={donutData} size={130} strokeWidth={20} />
        </div>
      )}

      <style>{`
        .director-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:14px; }
        .director-stat-card { padding:18px; display:flex; flex-direction:column; gap:10px; }
        .director-stat-card__header { display:flex; align-items:center; gap:10px; }
        .director-stat-card__avatar { width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:700; flex-shrink:0; }
        .director-stat-card__info { display:flex; flex-direction:column; gap:1px; }
        .director-stat-card__name { font-size:var(--font-size-sm); font-weight:700; color:var(--text-primary); }
        .director-stat-card__role { font-size:var(--font-size-xs); color:var(--text-tertiary); }
        .director-stat-card__count { display:flex; align-items:baseline; gap:6px; }
        .director-stat-card__num { font-size:var(--font-size-2xl); font-weight:800; color:var(--text-primary); letter-spacing:-0.04em; line-height:1; }
        .director-stat-card__lbl { font-size:var(--font-size-xs); color:var(--text-tertiary); }
        .director-stat-card__bar-track { height:6px; background:var(--bg-tertiary); border-radius:var(--radius-full); overflow:hidden; }
        .director-stat-card__bar-fill { height:100%; border-radius:var(--radius-full); transition:width .8s ease; }
        .director-stat-card__pct { font-size:10px; color:var(--text-tertiary); }
        .director-stat-card__stats { display:flex; gap:16px; border-top:1px solid var(--border-subtle); padding-top:8px; }
        .director-stat-card__stat { display:flex; flex-direction:column; gap:1px; }
        .director-stat-card__stat-val { font-size:var(--font-size-md); font-weight:700; color:var(--text-primary); }
        .director-stat-card__stat-lbl { font-size:10px; color:var(--text-tertiary); }
        .director-stat-card__last { font-size:10px; color:var(--text-tertiary); }
      `}</style>
    </div>
  );
}
