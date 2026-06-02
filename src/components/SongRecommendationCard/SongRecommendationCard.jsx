import { Music2, Hash, Clock, BarChart2, ChevronRight } from 'lucide-react';
import SongUsageBadge from '../SongUsageBadge/SongUsageBadge';
import './SongRecommendationCard.css';

/**
 * SongRecommendationCard
 *
 * Premium recommendation card showing song metadata, usage analytics, a
 * recommendation-score progress bar, and a reason string.
 *
 * Props:
 *   song      {Object}   - song record (title, author, key, …)
 *   analytics {Object}   - analytics block from computeAllSongAnalytics.
 *                          Expects: { freshness, freshnessLabel, daysSinceLastUse,
 *                                     totalUses, recentUses, recommendationScore,
 *                                     recommendationReason }
 *   rank      {number}   - 1-based position in the recommendation list
 *   onSelect  {Function} - called with (song) when the card is activated
 */
export default function SongRecommendationCard({ song, analytics, rank, onSelect }) {
  if (!song || !analytics) return null;

  const { title, author, key: songKey } = song;
  const {
    totalUses,
    recentUses,
    daysSinceLastUse,
    recommendationScore,
    recommendationReason,
  } = analytics;

  const score = Math.max(0, Math.min(100, recommendationScore ?? 0));

  // Never-used condition
  const neverUsed = totalUses === 0;

  const lastUsedText = neverUsed
    ? 'Sin uso registrado'
    : typeof daysSinceLastUse === 'number' && daysSinceLastUse < 999
    ? `hace ${daysSinceLastUse}d`
    : 'Fecha desconocida';

  function handleClick() {
    onSelect?.(song);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect?.(song);
    }
  }

  return (
    <article
      className="rec-card card card-interactive animate-fade-in-up"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Seleccionar canción: ${title}`}
    >
      {/* ── Header row: rank + title/author + arrow ── */}
      <div className="rec-card__header">
        <div className="rec-card__rank" aria-label={`Posición ${rank}`}>
          {rank}
        </div>

        <div className="rec-card__title-block">
          <h3 className="rec-card__title">{title}</h3>
          {author && (
            <p className="rec-card__author">{author}</p>
          )}
        </div>

        <ChevronRight size={16} className="rec-card__arrow" aria-hidden="true" />
      </div>

      {/* ── Badges row: freshness + key ── */}
      <div className="rec-card__badges">
        <SongUsageBadge analytics={analytics} compact />
        {songKey && (
          <span className="badge badge-orange rec-card__key-badge">
            <Hash size={10} aria-hidden="true" />
            {songKey}
          </span>
        )}
      </div>

      {/* ── Usage stats row ── */}
      <div className="rec-card__stats">
        <span className="rec-card__stat">
          <BarChart2 size={12} aria-hidden="true" />
          {neverUsed ? 'Sin usos' : `${totalUses} ${totalUses === 1 ? 'uso' : 'usos'}`}
        </span>
        <span className="rec-card__stat-divider" aria-hidden="true" />
        <span className="rec-card__stat">
          <Clock size={12} aria-hidden="true" />
          {lastUsedText}
        </span>
        {!neverUsed && recentUses > 0 && (
          <>
            <span className="rec-card__stat-divider" aria-hidden="true" />
            <span className="rec-card__stat rec-card__stat--recent">
              <Music2 size={12} aria-hidden="true" />
              {recentUses} reciente{recentUses !== 1 ? 's' : ''}
            </span>
          </>
        )}
      </div>

      {/* ── Recommendation score bar ── */}
      <div className="rec-card__score-section">
        <div className="rec-card__score-header">
          <span className="rec-card__score-label">Puntuación</span>
          <span className="rec-card__score-value">{score}</span>
        </div>
        <div className="rec-card__progress-track" role="progressbar" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100} aria-label={`Puntuación de recomendación: ${score} de 100`}>
          <div
            className="rec-card__progress-fill"
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* ── Reason text ── */}
      {recommendationReason && (
        <p className="rec-card__reason">{recommendationReason}</p>
      )}
    </article>
  );
}
