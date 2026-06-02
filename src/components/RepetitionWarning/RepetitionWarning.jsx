import { AlertTriangle, XCircle } from 'lucide-react';
import './RepetitionWarning.css';

/**
 * RepetitionWarning
 *
 * Renders nothing when result is null or result.level === 'ok'.
 *
 * Props:
 *   result  – object returned by checkRepetition / validateEventSongs:
 *             { level: 'ok'|'warn'|'block', message: string, lastUsed: string|null, daysSince: number|null }
 *   inline  – boolean; when true renders as a compact inline chip instead of
 *             a full banner
 */
export default function RepetitionWarning({ result, inline = false }) {
  if (!result || result.level === 'ok' || result.level == null) return null;

  const isBlock = result.level === 'block';

  const Icon = isBlock ? XCircle : AlertTriangle;
  const modifier = isBlock ? 'rw--block' : 'rw--warn';

  if (inline) {
    return (
      <span
        className={`rw-inline ${modifier}`}
        role="status"
        aria-live="polite"
        title={result.message}
      >
        <Icon size={12} aria-hidden="true" />
        <span className="rw-inline__message">{result.message}</span>
      </span>
    );
  }

  return (
    <div
      className={`rw-banner ${modifier}`}
      role="alert"
      aria-live="assertive"
    >
      <Icon size={18} className="rw-banner__icon" aria-hidden="true" />
      <p className="rw-banner__message">{result.message}</p>
    </div>
  );
}
