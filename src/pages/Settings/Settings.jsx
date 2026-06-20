import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSongSettings } from '../../context/SongSettingsContext';
import mockRoles from '../../data/mockRoles.json';
import { LogOut, User, Sliders, RotateCcw, DatabaseZap } from 'lucide-react';
import './Settings.css';

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
