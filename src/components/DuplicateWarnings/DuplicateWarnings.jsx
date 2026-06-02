import { useState } from 'react';
import { AlertTriangle, CheckCircle, GitMerge, X, ChevronDown, ChevronUp } from 'lucide-react';
import './DuplicateWarnings.css';

export default function DuplicateWarnings({ duplicateGroups = [], onDismiss, onMerge }) {
  const [expanded, setExpanded] = useState(false);
  const COLLAPSED_LIMIT = 3;

  if (duplicateGroups.length === 0) {
    return (
      <div className="dup-warnings__empty">
        <CheckCircle size={32} className="dup-warnings__empty-icon" />
        <p>No se detectaron duplicados</p>
      </div>
    );
  }

  const visible = expanded ? duplicateGroups : duplicateGroups.slice(0, COLLAPSED_LIMIT);
  const hasMore = duplicateGroups.length > COLLAPSED_LIMIT;

  return (
    <div className="dup-warnings">
      <div className="dup-warnings__header">
        <div className="dup-warnings__header-left">
          <AlertTriangle size={18} className="dup-warnings__alert-icon" />
          <span className="dup-warnings__title">Duplicados detectados</span>
        </div>
        <span className="dup-warnings__count-badge">{duplicateGroups.length}</span>
      </div>

      <p className="dup-warnings__summary">
        {duplicateGroups.length} {duplicateGroups.length === 1 ? 'grupo de canciones duplicadas encontrado' : 'grupos de canciones duplicadas encontrados'}
      </p>

      <div className="dup-warnings__list">
        {visible.map((group) => (
          <div key={group.canonicalId} className="dup-card">
            <div className="dup-card__header">
              <span className="dup-card__title">{group.canonicalTitle}</span>
              <span className={`dup-card__confidence dup-card__confidence--${group.confidence}`}>
                {group.confidence === 'high' ? 'Alta confianza' : 'Confianza media'}
              </span>
            </div>

            <div className="dup-card__variants-section">
              <span className="dup-card__variants-label">Variantes encontradas:</span>
              <ul className="dup-card__variants">
                {group.variants.map((v) => (
                  <li key={v.id} className="dup-card__variant">
                    <span className="dup-card__variant-title">{v.title}</span>
                    <span className="dup-card__reason">{v.reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="dup-card__actions">
              <button
                className="dup-card__merge-btn"
                onClick={() => onMerge?.(group.canonicalId)}
              >
                <GitMerge size={13} />
                Fusionar
              </button>
              <button
                className="dup-card__dismiss-btn"
                onClick={() => onDismiss?.(group.canonicalId)}
              >
                <X size={13} />
                Ignorar
              </button>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <button className="dup-warnings__expand-btn" onClick={() => setExpanded((v) => !v)}>
          {expanded ? (
            <><ChevronUp size={14} /> Mostrar menos</>
          ) : (
            <><ChevronDown size={14} /> Ver todos ({duplicateGroups.length})</>
          )}
        </button>
      )}
    </div>
  );
}
