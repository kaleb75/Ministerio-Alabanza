import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSongSettings } from '../../context/SongSettingsContext';
import { useFileDB } from '../../context/FileDBContext';
import mockRoles from '../../data/mockRoles.json';
import {
  LogOut, User, Sliders, RotateCcw, FolderOpen,
  HardDrive, CheckCircle, AlertTriangle, RefreshCw, DatabaseZap,
} from 'lucide-react';
import './Settings.css';

const DATA_KEYS = [
  'ministry_songs', 'ministry_events', 'ministry_users',
  'ministry_song_history', 'ministry_notifications',
  'ministry_requests', 'ministry_audit_logs',
];

function resetAppData() {
  DATA_KEYS.forEach((k) => localStorage.removeItem(k));
  window.location.reload();
}


export default function Settings() {
  const { user, logout } = useAuth();
  const roleInfo = mockRoles[user?.role];
  const { settings, updateSettings, resetSettings } = useSongSettings();
  const { isSupported, isConnected, folderName, error, changeFolder, syncNow, setup, forceSetup } = useFileDB();

  const [confirmReset, setConfirmReset] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  async function handleChangeFolder() {
    setSyncMsg('');
    const ok = await changeFolder();
    setSyncMsg(ok ? '✓ Carpeta actualizada' : '');
    if (ok) setTimeout(() => setSyncMsg(''), 3000);
  }

  async function handleSync() {
    setSyncMsg('');
    const ok = await syncNow();
    setSyncMsg(ok ? '✓ Datos guardados en archivos' : '✗ Error al guardar');
    setTimeout(() => setSyncMsg(''), 3000);
  }

  return (
    <div className="settings page-enter">
      <div className="page-header">
        <h1>Configuración</h1>
        <p>Preferencias de cuenta y almacenamiento</p>
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

      {/* ── File System Database ── */}
      <div className="card settings__section">
        <div className="settings__section-header">
          <div className="settings__section-title">
            <HardDrive size={18} />
            <span>Base de datos en archivos</span>
          </div>
          {isConnected && (
            <span className="settings__sync-time">✓ Conectado</span>
          )}
        </div>

        <p className="settings__desc">
          Conecta una carpeta local para guardar los datos como archivos <code>.json</code> editables.
          Funciona en desarrollo y en GitHub Pages. Los archivos se actualizan automáticamente
          con cada cambio.
        </p>

        {!isSupported && (
          <div className="settings__alert settings__alert--warning">
            <AlertTriangle size={14} />
            Tu navegador no soporta File System Access API. Usa Chrome o Edge.
            Los datos se guardan en localStorage como fallback.
          </div>
        )}

        {isSupported && (
          <>
            {error && (
              <div className="settings__alert settings__alert--danger">
                <AlertTriangle size={14} /> {error}
              </div>
            )}

            {isConnected ? (
              <div className="settings__fs-connected">
                <div className="settings__fs-folder">
                  <CheckCircle size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
                  <div>
                    <span className="settings__fs-folder-name">{folderName}/</span>
                    <span className="settings__fs-folder-files">
                      songs.json · events.json · users.json · songHistory.json
                    </span>
                  </div>
                </div>
                <div className="settings__fs-actions">
                  <button className="btn btn-secondary" onClick={handleSync}>
                    <RefreshCw size={13} /> Guardar ahora
                  </button>
                  <button className="btn btn-ghost" onClick={handleChangeFolder}>
                    <FolderOpen size={13} /> Cambiar carpeta
                  </button>
                  <button className="btn btn-ghost" onClick={forceSetup} title="Desconectar y elegir otra carpeta">
                    Desconectar
                  </button>
                </div>
                {syncMsg && <span className="settings__sync-msg">{syncMsg}</span>}
              </div>
            ) : (
              <button className="btn btn-primary settings__connect-btn" onClick={setup}>
                <FolderOpen size={15} /> Seleccionar carpeta de datos
              </button>
            )}

            <div className="settings__fs-note">
              <strong>Base de datos en archivos JSON</strong>
              <ol>
                <li>Todos los cambios se guardan en <code>songs.json</code>, <code>events.json</code>, etc.</li>
                <li>Puedes editar esos archivos directamente en VSCode o cualquier editor</li>
                <li>Sube la carpeta a GitHub y GitHub Pages usará esos datos</li>
                <li>Funciona offline — sin servidor, sin cloud</li>
              </ol>
            </div>
          </>
        )}
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
          Reinicializa todos los datos al estado original (canciones de Junio 2026,
          directores, historial). Se borrarán cambios locales.
        </p>
        {!confirmReset ? (
          <button className="btn btn-danger" style={{ width: 'fit-content' }} onClick={() => setConfirmReset(true)}>
            <RotateCcw size={14} /> Reinicializar datos
          </button>
        ) : (
          <div className="settings__confirm-row">
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--warning)' }}>
              ¿Confirmar? Se borrarán todos los datos locales.
            </span>
            <button className="btn btn-danger" onClick={resetAppData}>Sí, reinicializar</button>
            <button className="btn btn-ghost" onClick={() => setConfirmReset(false)}>Cancelar</button>
          </div>
        )}
      </div>
    </div>
  );
}
