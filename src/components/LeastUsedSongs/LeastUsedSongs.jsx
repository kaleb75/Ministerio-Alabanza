import { TrendingDown, Music, Plus } from 'lucide-react';
import { useSongIntelligence } from '../../context/SongIntelligenceContext';
import { FRESHNESS } from '../../utils/songAnalytics';
import './LeastUsedSongs.css';

// ---------------------------------------------------------------------------
// SongUsageBadge (compact inline badge)
// ---------------------------------------------------------------------------

const FRESHNESS_CLASS = {
  hot: 'badge badge-danger',
  active: 'badge badge-success',
  warm: 'badge badge-warning',
  cold: 'badge badge-info',
  forgotten: 'badge lus-badge--forgotten',
};

function SongUsageBadge({ analytics }) {
  if (!analytics) return null;

  const { freshness, freshnessLabel, totalPlays, daysSinceLastPlay } = analytics;

  // Normalise field names — SongIntelligenceContext uses totalPlays/daysSinceLastPlay,
  // while computeAllSongAnalytics uses totalUses/daysSinceLastUse.
  const plays = totalPlays ?? analytics.totalUses ?? 0;
  const days = daysSinceLastPlay ?? analytics.daysSinceLastUse ?? null;

  const freshnessKey = freshness ?? (days === null ? 'forgotten' : 'forgotten');
  const label = freshnessLabel ?? FRESHNESS[freshnessKey]?.label ?? freshnessKey;
  const cls = FRESHNESS_CLASS[freshnessKey] ?? 'badge lus-badge--forgotten';

  const title =
    days === null
      ? 'Nunca usada'
      : `Última vez: hace ${days} día${days === 1 ? '' : 's'}`;

  return (
    <span className={`${cls} lus-usage-badge`} title={title}>
      {label}
      {plays > 0 && (
        <span className="lus-usage-badge__plays"> · {plays}×</span>
      )}
    </span>
  );
}

// ---------------------------------------------------------------------------
// LeastUsedSongs
// ---------------------------------------------------------------------------

const DEFAULT_LIMIT = 10;

export default function LeastUsedSongs({ limit, showAll = false, onSuggest }) {
  const { recommendations } = useSongIntelligence();

  const effectiveLimit = showAll ? undefined : (limit ?? DEFAULT_LIMIT);
  const items = effectiveLimit !== undefined
    ? recommendations.slice(0, effectiveLimit)
    : recommendations;

  if (!items.length) {
    return (
      <div className="empty-state">
        <Music size={36} className="empty-state-icon" />
        <p>No hay canciones para mostrar</p>
      </div>
    );
  }

  return (
    <ol className="lus-list">
      {items.map((item, index) => {
        // recommendations entries carry the full analytics object merged in
        const analytics = {
          freshness: item.isForgotten ? 'forgotten' : item.isCold ? 'cold' : item.isRecent ? 'hot' : 'warm',
          freshnessLabel: item.isForgotten ? 'Olvidado' : item.isCold ? 'Frío' : item.isRecent ? 'Reciente' : 'Tibio',
          totalPlays: item.totalPlays,
          daysSinceLastPlay: item.daysSinceLastPlay,
        };

        const songTitle = item.song?.title ?? item.song?.nombre ?? item.title ?? '—';
        const songAuthor = item.song?.author ?? item.song?.autor ?? item.author ?? null;

        return (
          <li key={item.songId} className="lus-row card">
            <span className="lus-row__rank" aria-label={`Puesto ${index + 1}`}>
              {index + 1}
            </span>

            <TrendingDown
              size={16}
              className="lus-row__trend-icon"
              aria-hidden="true"
            />

            <div className="lus-row__info">
              <span className="lus-row__title">{songTitle}</span>
              {songAuthor && (
                <span className="lus-row__author">{songAuthor}</span>
              )}
            </div>

            <SongUsageBadge analytics={analytics} />

            {onSuggest && (
              <button
                className="lus-row__suggest-btn btn btn-ghost"
                onClick={() => onSuggest(item)}
                title="Sugerir esta canción"
                aria-label={`Sugerir ${songTitle}`}
              >
                <Plus size={14} />
                <span>Sugerir</span>
              </button>
            )}
          </li>
        );
      })}
    </ol>
  );
}
