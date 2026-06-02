import { Cloud, RefreshCw, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import './ImportStatus.css';

const STATUS_LABELS = {
  idle: 'Sin sincronizar',
  scanning: 'Escaneando...',
  parsing: 'Procesando...',
  deduplicating: 'Detectando duplicados...',
  complete: 'Sincronizado',
  error: 'Error',
};

function timeAgo(isoString) {
  if (!isoString) return null;
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return 'hace un momento';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return `hace ${Math.floor(diff / 86400)} días`;
}

const isLoading = (status) => ['scanning', 'parsing', 'deduplicating'].includes(status);

export default function ImportStatus({
  status = 'idle',
  progress = 0,
  stats = { totalFiles: 0, parsed: 0, duplicatesFound: 0, errors: 0 },
  onSync,
  lastSyncAt = null,
  errorMessage = null,
}) {
  const loading = isLoading(status);
  const showProgress = status !== 'idle';
  const showStats = status === 'complete' || loading;

  return (
    <div className="import-status">
      <div className="import-status__header">
        <div className="import-status__title-row">
          <Cloud size={20} className="import-status__cloud-icon" />
          <h3 className="import-status__title">Sincronización OneDrive</h3>
        </div>
        <span className={`import-status__badge import-status__badge--${status}`}>
          {loading && <Loader size={12} className="import-status__spin" />}
          {status === 'complete' && <CheckCircle size={12} />}
          {status === 'error' && <AlertCircle size={12} />}
          {STATUS_LABELS[status] || status}
        </span>
      </div>

      {showProgress && (
        <div className="import-status__progress">
          <div
            className={`import-status__progress-fill ${status === 'complete' ? 'import-status__progress-fill--complete' : ''}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {showStats && (
        <div className="import-status__stats">
          <div className="import-status__stat">
            <span className="import-status__stat-value">{stats.totalFiles}</span>
            <span className="import-status__stat-label">Archivos encontrados</span>
          </div>
          <div className="import-status__stat">
            <span className="import-status__stat-value">{stats.parsed}</span>
            <span className="import-status__stat-label">Procesados</span>
          </div>
          <div className="import-status__stat">
            <span className="import-status__stat-value">{stats.duplicatesFound}</span>
            <span className="import-status__stat-label">Duplicados</span>
          </div>
          <div className="import-status__stat">
            <span className="import-status__stat-value">{stats.errors}</span>
            <span className="import-status__stat-label">Errores</span>
          </div>
        </div>
      )}

      {status === 'error' && errorMessage && (
        <p className="import-status__error">{errorMessage}</p>
      )}

      <div className="import-status__footer">
        <button
          className={`import-status__sync-btn ${loading ? 'import-status__sync-btn--loading' : ''}`}
          onClick={onSync}
          disabled={loading}
        >
          <RefreshCw size={15} className={loading ? 'import-status__spin' : ''} />
          {loading ? 'Sincronizando...' : 'Sincronizar ahora'}
        </button>

        {lastSyncAt && (
          <span className="import-status__meta">
            Última sincronización: {timeAgo(lastSyncAt)}
          </span>
        )}
      </div>

      {status === 'idle' && (
        <p className="import-status__arch-note">
          Integración Microsoft Graph API — pendiente de configuración OAuth
        </p>
      )}
    </div>
  );
}
