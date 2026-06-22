import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSongSettings } from '../../context/SongSettingsContext';
import { getLoginSummary, getUserLoginHistory } from '../../services/loginLogsService';
import mockRoles from '../../data/mockRoles.json';
import { LogOut, User, Sliders, RotateCcw, DatabaseZap, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import './Settings.css';

function formatRelative(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'Justo ahora';
  if (mins < 60)  return `Hace ${mins} min`;
  if (hours < 24) return `Hace ${hours}h`;
  if (days < 30)  return `Hace ${days}d`;
  return new Date(dateStr).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function LoginLogsPanel() {
  const [summary, setSummary]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [expanded, setExpanded]   = useState(null);
  const [history, setHistory]     = useState({});

  useEffect(() => {
    getLoginSummary().then(d => { setSummary(d); setLoading(false); });
  }, []);

  async function toggleHistory(userId) {
    if (expanded === userId) { setExpanded(null); return; }
    setExpanded(userId);
    if (!history[userId]) {
      const logs = await getUserLoginHistory(userId);
      setHistory(h => ({ ...h, [userId]: logs }));
    }
  }

  if (loading) return <p className="settings__desc">Cargando logs…</p>;
  if (!summary.length) return <p className="settings__desc">No hay registros aún.</p>;

  return (
    <div className="logs__table-wrap">
      <table className="logs__table">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Rol</th>
            <th>Último acceso</th>
            <th style={{ textAlign: 'center' }}>Sesiones</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {summary.map(row => {
            const roleInfo = Object.entries(mockRoles).find(([, v]) =>
              row.user_email?.includes(v.label?.toLowerCase?.())
            );
            return (
              <>
                <tr key={row.user_id} className="logs__row">
                  <td>
                    <div className="logs__user">
                      <div className="logs__avatar">
                        {(row.user_name || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="logs__name">{row.user_name}</div>
                        <div className="logs__email">{row.user_email}</div>
                      </div>
                    </div>
                  </td>
                  <td>—</td>
                  <td>{formatRelative(row.last_login)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="logs__badge">{row.count}</span>
                  </td>
                  <td>
                    <button className="logs__expand-btn" onClick={() => toggleHistory(row.user_id)}>
                      {expanded === row.user_id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </td>
                </tr>
                {expanded === row.user_id && (
                  <tr key={`${row.user_id}-hist`} className="logs__history-row">
                    <td colSpan={5}>
                      <div className="logs__history">
                        <p className="logs__history-title">Historial de sesiones</p>
                        {(history[row.user_id] ?? []).map((h, i) => (
                          <div key={i} className="logs__history-item">
                            <span className="logs__dot" />
                            {new Date(h.login_at).toLocaleString('es-MX', {
                              weekday: 'short', day: '2-digit', month: 'short',
                              year: 'numeric', hour: '2-digit', minute: '2-digit',
                            })}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function Settings() {
  const { user, logout } = useAuth();
  const roleInfo = mockRoles[user?.role];
  const { settings, updateSettings, resetSettings } = useSongSettings();
  const [confirmReset, setConfirmReset] = useState(false);

  function resetAppData() {
    window.location.reload();
  }

  return (
    <div className="settings page-enter">
      <div className="page-header">
        <h1>Configuración</h1>
        <p>Preferencias de cuenta</p>
      </div>

      {/* ── Profile ── */}
      <div className="card settings__profile">
        <div className="settings__avatar">
          {user?.initials ?? <User size={24} />}
        </div>
        <div className="settings__info">
          <div className="settings__name">{user?.name}</div>
          <span
            className="badge"
            style={{
              background: roleInfo?.color ? `${roleInfo.color}22` : 'var(--accent-orange-dim)',
              color: roleInfo?.color ?? 'var(--accent-orange)',
            }}
          >
            {roleInfo?.label}
          </span>
          <div className="settings__email">{user?.email}</div>
        </div>
        <button className="btn btn-danger settings__logout" onClick={logout}>
          <LogOut size={16} />
          Cerrar Sesión
        </button>
      </div>

      {/* ── Song Intelligence ── */}
      <div className="card settings__musical-ai">
        <div className="settings__section-header">
          <div className="settings__section-title">
            <Sliders size={18} />
            <span>Inteligencia Musical</span>
          </div>
          <button className="settings__reset-btn" onClick={resetSettings} title="Restablecer valores predeterminados">
            <RotateCcw size={15} />
          </button>
        </div>

        <div className="settings__row">
          <span className="settings__row-label">Protección de repetición</span>
          <div className="settings__options">
            {[14, 30, 60].map((days) => (
              <button
                key={days}
                className={`settings__option-btn${settings.repetitionProtection === days ? ' settings__option-btn--active' : ''}`}
                onClick={() => updateSettings({ repetitionProtection: days })}
              >
                {days}d
              </button>
            ))}
          </div>
        </div>

        <div className="settings__row">
          <span className="settings__row-label">Umbral de olvidadas</span>
          <div className="settings__options">
            {[60, 90, 120].map((days) => (
              <button
                key={days}
                className={`settings__option-btn${settings.forgottenThreshold === days ? ' settings__option-btn--active' : ''}`}
                onClick={() => updateSettings({ forgottenThreshold: days })}
              >
                {days}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Admin: Login Logs ── */}
      {user?.role === 'admin' && (
        <div className="card settings__section">
          <div className="settings__section-header">
            <div className="settings__section-title">
              <ShieldCheck size={18} />
              <span>Registro de Sesiones</span>
            </div>
          </div>
          <p className="settings__desc">
            Historial de inicio de sesión de todos los usuarios.
          </p>
          <LoginLogsPanel />
        </div>
      )}

      {/* ── Reset data ── */}
      <div className="card settings__section">
        <div className="settings__section-header">
          <div className="settings__section-title">
            <DatabaseZap size={18} />
            <span>Datos de la aplicación</span>
          </div>
        </div>
        <p className="settings__desc">
          Los datos se almacenan en Supabase y son compartidos entre todos los usuarios.
        </p>
        {!confirmReset ? (
          <button className="btn btn-danger" style={{ width: 'fit-content' }} onClick={() => setConfirmReset(true)}>
            <RotateCcw size={14} /> Recargar datos
          </button>
        ) : (
          <div className="settings__confirm-row">
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--warning)' }}>
              ¿Recargar la página?
            </span>
            <button className="btn btn-danger" onClick={resetAppData}>Sí, recargar</button>
            <button className="btn btn-ghost" onClick={() => setConfirmReset(false)}>Cancelar</button>
          </div>
        )}
      </div>
    </div>
  );
}
