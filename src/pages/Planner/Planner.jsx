import { Sparkles, Music2, Plus, X, ArrowUp, ArrowDown, RefreshCw, CheckCircle, AlertTriangle, Star } from 'lucide-react';
import { useWorshipPlanner } from '../../context/WorshipPlannerContext';
import { SERVICE_PROFILES } from '../../services/worshipFlowEngine';
import './Planner.css';

const FLOW_COLOR = (s) => s >= 80 ? 'var(--success)' : s >= 60 ? 'var(--info)' : s >= 40 ? 'var(--warning)' : 'var(--danger)';
const FLOW_LABEL = (s) => s >= 80 ? 'Excelente' : s >= 60 ? 'Bueno' : s >= 40 ? 'Regular' : 'Mejorable';

export default function Planner() {
  const {
    serviceType, setServiceType,
    setSize, setSetSize,
    themeTag, setThemeTag,
    currentSet, addToSet, removeFromSet, moveInSet, clearSet,
    suggestions, generateSet,
    flowScore, setDetails,
  } = useWorshipPlanner();

  const serviceTypes = Object.keys(SERVICE_PROFILES);

  return (
    <div className="planner page-enter">
      <div className="page-header page-header--flex">
        <div>
          <h1>Planificador de Set</h1>
          <p>Recomendaciones inteligentes para tu culto</p>
        </div>
        <button className="btn btn-ghost" onClick={clearSet}>
          <X size={14} /> Limpiar
        </button>
      </div>

      <div className="planner__grid">
        {/* ── Left: config ── */}
        <div className="planner__left">
          <div className="card planner__config-card">
            {/* Service type */}
            <div>
              <label className="planner__config-label">Tipo de culto</label>
              <select
                className="form-select"
                value={serviceType}
                onChange={e => setServiceType(e.target.value)}
              >
                {serviceTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Set size */}
            <div>
              <label className="planner__config-label">Número de canciones</label>
              <div className="planner__size-grid">
                {[3, 4, 5, 6].map(n => (
                  <button
                    key={n}
                    className={`planner__size-btn${setSize === n ? ' planner__size-btn--active' : ''}`}
                    onClick={() => setSetSize(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme tag */}
            <div>
              <label className="planner__config-label">Tema / Etiqueta (opcional)</label>
              <input
                className="form-input"
                value={themeTag}
                onChange={e => setThemeTag(e.target.value)}
                placeholder="adoración, navidad, avivamiento..."
              />
            </div>

            <button className="btn btn-primary" onClick={generateSet} style={{ width: '100%' }}>
              <Sparkles size={15} />
              Generar sugerencias
            </button>
          </div>

          {/* Flow score */}
          {currentSet.length > 0 && (
            <div className="card planner__flow-card">
              <div className="planner__flow-score">
                <span className="planner__flow-number" style={{ color: FLOW_COLOR(flowScore.score) }}>
                  {flowScore.score}
                </span>
                <div style={{ flex: 1 }}>
                  <div className="planner__flow-bar">
                    <div
                      className="planner__flow-fill"
                      style={{ width: `${flowScore.score}%`, background: FLOW_COLOR(flowScore.score) }}
                    />
                  </div>
                  <div className="planner__flow-label">{FLOW_LABEL(flowScore.score)} — calidad del flujo</div>
                </div>
              </div>
              {flowScore.issues.length > 0 && (
                <div className="planner__issues">
                  {flowScore.issues.map((issue, i) => (
                    <div key={i} className="planner__issue">
                      <AlertTriangle size={11} style={{ flexShrink: 0 }} />
                      {issue}
                    </div>
                  ))}
                </div>
              )}
              {flowScore.suggestions.length > 0 && (
                <div className="planner__issues">
                  {flowScore.suggestions.map((s, i) => (
                    <div key={i} className="planner__suggestion-text">
                      <Star size={11} style={{ flexShrink: 0 }} />
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right: set + suggestions ── */}
        <div className="planner__right">
          {/* Current set */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="planner__section-header">
              <span>Set actual</span>
              <span className="planner__section-count">{currentSet.length} / {setSize}</span>
            </div>
            {setDetails.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 24px' }}>
                <Music2 size={28} className="empty-state-icon" />
                <p>Genera sugerencias o agrega canciones</p>
              </div>
            ) : (
              <div className="planner__set-list">
                {setDetails.map((song, idx) => (
                  <div key={song.id} className="planner__set-item">
                    <span className="planner__set-pos">{idx + 1}</span>
                    {song.key && <span className="badge badge-orange" style={{ fontSize: 10, padding: '2px 7px' }}>{song.key}</span>}
                    <div className="planner__set-info">
                      <span className="planner__set-title">{song.title}</span>
                      <span className="planner__set-meta">{song.author || song.genre}</span>
                    </div>
                    <div className="planner__set-actions">
                      <button className="planner__set-btn" onClick={() => moveInSet(idx, -1)} disabled={idx === 0}><ArrowUp size={12} /></button>
                      <button className="planner__set-btn" onClick={() => moveInSet(idx, 1)} disabled={idx === setDetails.length - 1}><ArrowDown size={12} /></button>
                      <button className="planner__set-btn planner__set-btn--remove" onClick={() => removeFromSet(song.id)}><X size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="card" style={{ overflow: 'hidden' }}>
              <div className="planner__section-header">
                <span>Sugerencias</span>
                <span className="planner__section-count">{suggestions.length} canciones</span>
              </div>
              <div className="planner__suggestions-list">
                {suggestions.map(song => {
                  const inSet = currentSet.includes(song.id);
                  return (
                    <div
                      key={song.id}
                      className={`planner__suggestion-row${inSet ? ' planner__suggestion-row--added' : ''}`}
                      onClick={() => !inSet && addToSet(song.id)}
                    >
                      <div className={`planner__suggestion-add${inSet ? ' planner__suggestion-add--added' : ''}`}>
                        {inSet ? <CheckCircle size={14} /> : <Plus size={14} />}
                      </div>
                      <div className="planner__suggestion-info">
                        <span className="planner__suggestion-title">{song.title}</span>
                        <div className="planner__suggestion-meta">
                          {song.key && <span className="badge badge-orange" style={{ fontSize: 10, padding: '1px 6px' }}>{song.key}</span>}
                          {song.genre && <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{song.genre}</span>}
                        </div>
                        {song.reasons?.slice(0, 2).map((r, i) => (
                          <span key={i} className="planner__suggestion-reason">{r}</span>
                        ))}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-orange)' }}>{song.score}</span>
                        <div className="planner__score-bar">
                          <div className="planner__score-fill" style={{ width: `${song.score}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
