import HeatmapChart from '../../components/Charts/HeatmapChart/HeatmapChart';
import StatCard from '../../components/Charts/StatCard/StatCard';
import { Music2, CalendarDays, TrendingUp, Clock } from 'lucide-react';

const GRADE_DESC = {
  A: 'El ministerio está en excelente estado — gran variedad, frecuencia consistente y repertorio vigente.',
  B: 'Buen estado general con áreas de mejora. Considera ampliar la variedad del repertorio.',
  C: 'Se requiere atención. Revisa la consistencia de cultos y la rotación de canciones.',
  D: 'Acción inmediata recomendada. El repertorio y la frecuencia necesitan renovación urgente.',
};

const GRADE_COLOR = { A: 'var(--success)', B: 'var(--info)', C: 'var(--warning)', D: 'var(--danger)' };

function ScoreBar({ label, value, color }) {
  return (
    <div className="score-bar">
      <div className="score-bar__header">
        <span className="score-bar__label">{label}</span>
        <span className="score-bar__val" style={{ color }}>{value}%</span>
      </div>
      <div className="score-bar__track">
        <div className="score-bar__fill" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

export default function MinistryTab({ analytics }) {
  const { health, heatmap, repertoire, scheduling } = analytics;
  const gradeColor = GRADE_COLOR[health.grade] || 'var(--text-primary)';

  return (
    <div className="analytics__content">
      {/* Health score card */}
      <div className="card analytics-card">
        <div className="health-header">
          <div className="health-grade" style={{ color: gradeColor }}>{health.grade}</div>
          <div className="health-info">
            <div className="health-score">{health.score} <span>/100</span></div>
            <div className="health-label">{health.label}</div>
            <p className="health-desc">{GRADE_DESC[health.grade]}</p>
          </div>
        </div>
        <div className="health-scores">
          <ScoreBar label="Variedad"      value={health.breakdown.variety}     color="var(--accent-orange)" />
          <ScoreBar label="Consistencia"  value={health.breakdown.consistency} color="var(--info)" />
          <ScoreBar label="Vigencia"      value={health.breakdown.recency}     color="var(--success)" />
          <ScoreBar label="Actividad"     value={health.breakdown.engagement}  color="var(--warning)" />
        </div>
      </div>

      {/* Heatmap */}
      <div className="card analytics-card">
        <HeatmapChart data={heatmap} title="Frecuencia de Adoración — Últimas 52 semanas" />
      </div>

      {/* Repertoire stats */}
      <div>
        <div className="section-title">Salud del Repertorio</div>
        <div className="analytics__kpis" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))' }}>
          <StatCard value={repertoire.total}          label="Total canciones"      icon={Music2}       color="orange"  size="sm" />
          <StatCard value={repertoire.usedLastYear}   label="Usadas este año"      icon={TrendingUp}   color="success" size="sm" />
          <StatCard value={repertoire.neverUsed}      label="Sin historial"        icon={Clock}        color="warning" size="sm" />
          <StatCard value={repertoire.avgTimesUsed}   label="Promedio de usos"     icon={CalendarDays} color="info"    size="sm" />
        </div>
      </div>

      {/* Scheduling stats */}
      <div className="card analytics-card">
        <div className="analytics-card__title">Consistencia de Programación</div>
        <div className="scheduling-grid">
          {[
            { label: 'Cultos completados', val: scheduling.completedEvents },
            { label: 'Promedio mensual',   val: scheduling.avgPerMonth },
            { label: 'Mes más activo',     val: scheduling.mostActiveMonth?.label || '—' },
            { label: 'Mayor brecha (días)', val: scheduling.longestGapDays },
          ].map(({ label, val }) => (
            <div key={label} className="scheduling-stat">
              <span className="scheduling-stat__val">{val}</span>
              <span className="scheduling-stat__lbl">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .health-header { display:flex; align-items:flex-start; gap:20px; margin-bottom:20px; }
        .health-grade { font-size:64px; font-weight:900; line-height:1; letter-spacing:-0.05em; }
        .health-info { flex:1; }
        .health-score { font-size:var(--font-size-2xl); font-weight:800; color:var(--text-primary); letter-spacing:-0.03em; }
        .health-score span { font-size:var(--font-size-base); color:var(--text-tertiary); font-weight:400; }
        .health-label { font-size:var(--font-size-sm); font-weight:600; color:var(--text-secondary); margin:2px 0 8px; }
        .health-desc { font-size:var(--font-size-sm); color:var(--text-secondary); line-height:1.5; margin:0; }
        .health-scores { display:flex; flex-direction:column; gap:12px; }
        .score-bar { display:flex; flex-direction:column; gap:5px; }
        .score-bar__header { display:flex; justify-content:space-between; align-items:center; }
        .score-bar__label { font-size:var(--font-size-xs); font-weight:600; color:var(--text-secondary); }
        .score-bar__val { font-size:var(--font-size-xs); font-weight:800; }
        .score-bar__track { height:8px; background:var(--bg-tertiary); border-radius:var(--radius-full); overflow:hidden; }
        .score-bar__fill { height:100%; border-radius:var(--radius-full); transition:width .8s cubic-bezier(.34,1.56,.64,1); }
        .scheduling-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:16px; }
        .scheduling-stat { display:flex; flex-direction:column; gap:3px; }
        .scheduling-stat__val { font-size:var(--font-size-xl); font-weight:800; color:var(--text-primary); letter-spacing:-0.03em; }
        .scheduling-stat__lbl { font-size:var(--font-size-xs); color:var(--text-tertiary); }
        @media(max-width:767px) { .health-header { flex-direction:column; } .scheduling-grid { grid-template-columns:1fr 1fr; } }
      `}</style>
    </div>
  );
}
