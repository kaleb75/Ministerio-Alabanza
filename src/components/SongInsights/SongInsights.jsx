import {
  Gauge,
  Clock,
  Lightbulb,
  AlertTriangle,
  Music2,
  TrendingUp,
} from 'lucide-react';
import { useSongIntelligence } from '../../context/SongIntelligenceContext';
import { formatRelative } from '../../utils/dateUtils';
import './SongInsights.css';

// ---------------------------------------------------------------------------
// Variety score helpers
// ---------------------------------------------------------------------------

function scoreLabel(score) {
  if (score >= 80) return 'Excelente';
  if (score >= 60) return 'Buena';
  if (score >= 40) return 'Regular';
  return 'Baja';
}

function scoreVariant(score) {
  if (score >= 80) return 'success';
  if (score >= 60) return 'info';
  if (score >= 40) return 'warning';
  return 'danger';
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function VarietyScoreCard({ score }) {
  const variant = scoreVariant(score);
  const label = scoreLabel(score);
  const arc = Math.round((score / 100) * 283); // circumference ≈ 283 for r=45

  return (
    <div className={`si-variety-card card si-variety-card--${variant}`}>
      <div className="si-variety-card__gauge">
        <svg viewBox="0 0 100 100" className="si-gauge-svg" aria-hidden="true">
          <circle
            className="si-gauge-track"
            cx="50" cy="50" r="45"
            fill="none"
            strokeWidth="8"
          />
          <circle
            className="si-gauge-fill"
            cx="50" cy="50" r="45"
            fill="none"
            strokeWidth="8"
            strokeDasharray={`${arc} 283`}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
          <text x="50" y="54" textAnchor="middle" className="si-gauge-text">
            {score}
          </text>
        </svg>
      </div>
      <div className="si-variety-card__body">
        <span className="si-variety-card__title">Variedad del repertorio</span>
        <span className={`si-variety-card__label si-variety-card__label--${variant}`}>
          {label}
        </span>
        <p className="si-variety-card__description">
          Mide qué tan uniformemente se usa el catálogo en los últimos 90 días.
        </p>
      </div>
    </div>
  );
}

function ForgottenSongRow({ item, rank }) {
  const { song, daysSinceLastPlay, lastPlayedDate } = item;
  return (
    <li className="si-forgotten-row">
      <span className="si-forgotten-row__rank">{rank}</span>
      <div className="si-forgotten-row__info">
        <span className="si-forgotten-row__title">{song.title}</span>
        <span className="si-forgotten-row__meta">
          {song.author && <span>{song.author}</span>}
          {lastPlayedDate
            ? <span>· {formatRelative(lastPlayedDate)}</span>
            : <span>· Nunca tocada</span>
          }
        </span>
      </div>
      <div className="si-forgotten-row__right">
        <span className="badge badge-warning si-forgotten-row__badge">
          {daysSinceLastPlay !== null ? `${daysSinceLastPlay}d` : '--'}
        </span>
        <span className="si-forgotten-row__key">{song.key}</span>
      </div>
    </li>
  );
}

function RecommendationHighlight({ item }) {
  if (!item) return null;
  const { song, daysSinceLastPlay, lastPlayedDate } = item;

  return (
    <div className="si-recommendation card">
      <div className="si-recommendation__icon-wrap">
        <Lightbulb size={18} />
      </div>
      <div className="si-recommendation__body">
        <span className="si-section-label">Recomendación destacada</span>
        <h4 className="si-recommendation__title">{song.title}</h4>
        <div className="si-recommendation__meta">
          {song.author && <span>{song.author}</span>}
          {song.key && <span className="si-key-badge">{song.key}</span>}
          {song.genre && (
            <span className="badge badge-info si-recommendation__genre">
              {song.genre}
            </span>
          )}
        </div>
        <p className="si-recommendation__reason">
          {lastPlayedDate
            ? `Última vez ${formatRelative(lastPlayedDate)} · ${daysSinceLastPlay} días sin tocar`
            : 'Nunca ha sido tocada — excelente momento para estrenarla'}
        </p>
      </div>
      <TrendingUp size={16} className="si-recommendation__arrow" />
    </div>
  );
}

function OverusedWarningList({ songs }) {
  if (!songs.length) return null;

  return (
    <div className="si-overused">
      <div className="si-overused__header">
        <AlertTriangle size={15} className="si-overused__icon" />
        <span className="si-section-label">Usadas recientemente</span>
        <span className="badge badge-danger si-overused__count">{songs.length}</span>
      </div>
      <ul className="si-overused__list">
        {songs.map(({ song, daysSinceLastPlay }) => (
          <li key={song.id} className="si-overused__item">
            <Music2 size={12} className="si-overused__music-icon" />
            <span className="si-overused__name">{song.title}</span>
            <span className="si-key-badge">{song.key}</span>
            <span className="si-overused__days">
              hace {daysSinceLastPlay}d
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function SongInsights() {
  const { varietyScore, forgottenSongs, recommendations, recentSongs } =
    useSongIntelligence();

  const topForgotten = forgottenSongs
    .slice()
    .sort((a, b) => (b.daysSinceLastPlay ?? 0) - (a.daysSinceLastPlay ?? 0))
    .slice(0, 3);

  const topRecommendation = recommendations[0] ?? null;

  // Recent songs = overused warning: played within repeat-protection window
  const overusedWarnings = recentSongs.slice(0, 5);

  return (
    <section className="song-insights">
      {/* Variety score */}
      <div className="si-block">
        <VarietyScoreCard score={varietyScore} />
      </div>

      {/* Top forgotten songs */}
      {topForgotten.length > 0 && (
        <div className="si-block">
          <header className="si-block__header">
            <Clock size={14} className="si-block__icon" />
            <span className="si-section-label">Canciones olvidadas</span>
            <span className="badge badge-warning">{topForgotten.length}</span>
          </header>
          <ul className="si-forgotten-list card">
            {topForgotten.map((item, i) => (
              <ForgottenSongRow key={item.songId} item={item} rank={i + 1} />
            ))}
          </ul>
        </div>
      )}

      {/* Top recommendation */}
      {topRecommendation && (
        <div className="si-block">
          <RecommendationHighlight item={topRecommendation} />
        </div>
      )}

      {/* Overused / recently played warning */}
      {overusedWarnings.length > 0 && (
        <div className="si-block">
          <div className="si-overused-wrap card">
            <OverusedWarningList songs={overusedWarnings} />
          </div>
        </div>
      )}

      {/* Empty state */}
      {!topForgotten.length && !topRecommendation && !overusedWarnings.length && (
        <div className="empty-state">
          <Gauge size={40} className="empty-state-icon" />
          <p>No hay datos de inteligencia disponibles aún.</p>
        </div>
      )}
    </section>
  );
}
