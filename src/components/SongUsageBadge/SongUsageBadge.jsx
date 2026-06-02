import { FRESHNESS } from '../../utils/songAnalytics';
import './SongUsageBadge.css';

/**
 * SongUsageBadge
 *
 * Displays a freshness pill badge with a colored dot indicator.
 *
 * Props:
 *   analytics {Object}  - analytics block from computeAllSongAnalytics / getRecommendations.
 *                         Expects: { freshness, freshnessLabel, daysSinceLastUse, totalUses }
 *   compact   {boolean} - when true renders a smaller pill without the day count suffix
 */
export default function SongUsageBadge({ analytics, compact = false }) {
  if (!analytics) return null;

  const { freshness, freshnessLabel, daysSinceLastUse, totalUses } = analytics;

  // Map freshness key to CSS modifier class.
  // Keys: hot | active | warm | cold | forgotten
  const colorClass = `song-usage-badge--${freshness}`;

  const hasValidDays =
    typeof daysSinceLastUse === 'number' &&
    daysSinceLastUse < 999 &&
    totalUses > 0;

  const daySuffix =
    !compact && hasValidDays
      ? ` · ${daysSinceLastUse}d`
      : null;

  return (
    <span className={`song-usage-badge badge ${colorClass}${compact ? ' song-usage-badge--compact' : ''}`}>
      <span className="song-usage-badge__dot" aria-hidden="true" />
      {freshnessLabel}
      {daySuffix && (
        <span className="song-usage-badge__days">{daySuffix}</span>
      )}
    </span>
  );
}
