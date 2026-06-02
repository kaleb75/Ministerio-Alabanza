import { useState, useCallback, useEffect } from 'react';
import {
  Cloud, RefreshCw, Plus, CheckCircle, XCircle,
  AlertTriangle, LogIn, LogOut, Settings, Eye, EyeOff,
  FolderOpen, FileText, Music2, ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  SHARED_FOLDER_URL,
  scanOneDriveFolder,
  buildSongPayload,
} from '../../services/oneDriveImportService';
import {
  login,
  logout,
  isAuthenticated,
  getStoredToken,
  getStoredUser,
  getClientId,
  saveClientId,
} from '../../services/microsoftAuthService';
import './OneDriveImporter.css';

const EXT_COLORS = {
  pdf: '#FF453A', docx: '#0A84FF', doc: '#0A84FF',
  txt: '#32D74B', png: '#BF5AF2', jpg: '#FFD60A', jpeg: '#FFD60A',
};

// ─────────────────────────────────────────────────────────────────────────────
// Setup Panel — shown when no client ID is configured
// ─────────────────────────────────────────────────────────────────────────────
function SetupPanel({ onSaved }) {
  const [clientId, setClientId] = useState('');
  const [showId, setShowId]     = useState(false);
  const [saved, setSaved]       = useState(false);

  function handleSave() {
    const id = clientId.trim();
    if (!id) return;
    saveClientId(id);
    setSaved(true);
    setTimeout(onSaved, 600);
  }

  return (
    <div className="od-setup card">
      <div className="od-setup__icon">
        <Cloud size={28} />
      </div>
      <h3 className="od-setup__title">Configurar acceso a OneDrive</h3>
      <p className="od-setup__desc">
        Para importar canciones necesitas registrar una app gratuita en Azure Portal y pegar el <strong>Application (client) ID</strong> aquí.
      </p>

      <div className="od-setup__steps">
        <div className="od-setup__step">
          <span className="od-setup__step-num">1</span>
          <div className="od-setup__step-content">
            <strong>Ve a portal.azure.com</strong>
            <span>Inicia sesión con cualquier cuenta de Microsoft</span>
          </div>
          <a
            href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/CreateApplicationBlade"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary od-setup__link"
          >
            Abrir Azure <ExternalLink size={12} />
          </a>
        </div>

        <div className="od-setup__step">
          <span className="od-setup__step-num">2</span>
          <div className="od-setup__step-content">
            <strong>Registra una nueva aplicación</strong>
            <span>Nombre: cualquiera • Tipo de cuentas: <em>"Cuentas en cualquier directorio organizacional Y cuentas Microsoft personales"</em></span>
          </div>
        </div>

        <div className="od-setup__step">
          <span className="od-setup__step-num">3</span>
          <div className="od-setup__step-content">
            <strong>Agrega el URI de redirección</strong>
            <span>
              En la app → Autenticación → Agregar plataforma → Aplicación de página única (SPA):
            </span>
            <code className="od-setup__code">{window.location.origin}/auth/callback</code>
          </div>
        </div>

        <div className="od-setup__step">
          <span className="od-setup__step-num">4</span>
          <div className="od-setup__step-content">
            <strong>Agrega permisos de API</strong>
            <span>API permissions → Agregar permiso → Microsoft Graph → Delegado → <em>Files.Read</em> y <em>Files.Read.All</em></span>
          </div>
        </div>

        <div className="od-setup__step">
          <span className="od-setup__step-num">5</span>
          <div className="od-setup__step-content">
            <strong>Copia el Application (client) ID</strong>
            <span>Está en la página de resumen de tu app</span>
          </div>
        </div>
      </div>

      <div className="od-setup__input-row">
        <div className="od-setup__input-wrap">
          <input
            type={showId ? 'text' : 'password'}
            className="form-input"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          />
          <button
            type="button"
            className="od-setup__toggle-eye"
            onClick={() => setShowId((v) => !v)}
          >
            {showId ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={!clientId.trim() || saved}
        >
          {saved ? <><CheckCircle size={14} /> Guardado</> : 'Guardar'}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Importer
// ─────────────────────────────────────────────────────────────────────────────
export default function OneDriveImporter() {
  const { songs, addSong } = useApp();

  const [hasClientId, setHasClientId]   = useState(() => Boolean(getClientId()));
  const [loggedIn, setLoggedIn]         = useState(() => isAuthenticated());
  const [msUser, setMsUser]             = useState(() => getStoredUser());
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError]     = useState('');

  const [phase, setPhase]       = useState('idle');
  const [detail, setDetail]     = useState('');
  const [fileCount, setFileCount] = useState(0);
  const [result, setResult]     = useState(null);
  const [scanError, setScanError] = useState('');
  const [log, setLog]           = useState([]);

  const [selected, setSelected]   = useState(new Set());
  const [importing, setImporting] = useState(false);
  const [imported, setImported]   = useState(0);

  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setLoggedIn(isAuthenticated());
    setMsUser(getStoredUser());
  }, []);

  // ── Auth ──────────────────────────────────────────────────────────────────

  async function handleLogin() {
    setLoginError('');
    setLoginLoading(true);
    try {
      await login(getClientId());
      setLoggedIn(true);
      setMsUser(getStoredUser());
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  }

  function handleLogout() {
    logout();
    setLoggedIn(false);
    setMsUser('');
    setResult(null);
    setPhase('idle');
  }

  // ── Scan ──────────────────────────────────────────────────────────────────

  const handleScan = useCallback(async () => {
    const token = getStoredToken();
    if (!token) { setLoginError('Sesión expirada. Inicia sesión de nuevo.'); setLoggedIn(false); return; }

    setPhase('connecting');
    setScanError('');
    setResult(null);
    setSelected(new Set());
    setLog([]);
    setFileCount(0);

    try {
      const res = await scanOneDriveFolder(
        SHARED_FOLDER_URL,
        songs,
        ({ phase: p, detail: d, count }) => {
          setPhase(p);
          if (d) setDetail(d);
          if (count) setFileCount(count);
          if (d) setLog((prev) => [d, ...prev].slice(0, 50));
        },
        token
      );

      setResult(res);
      setSelected(new Set(res.songs.filter((s) => !s.exists).map((s) => s.slug)));
      setPhase('done');
    } catch (err) {
      setPhase('error');
      setScanError(err.message);
    }
  }, [songs]);

  // ── Import ─────────────────────────────────────────────────────────────────

  async function handleImport() {
    if (!result || selected.size === 0) return;
    setImporting(true);
    setImported(0);

    const toImport = result.songs.filter((s) => selected.has(s.slug) && !s.exists);
    let count = 0;
    for (const song of toImport) {
      addSong(buildSongPayload(song));
      count++;
      setImported(count);
      await new Promise((r) => setTimeout(r, 15));
    }

    setResult((prev) => ({
      ...prev,
      songs: prev.songs.map((s) => selected.has(s.slug) ? { ...s, exists: true } : s),
      stats: { ...prev.stats, newSongs: prev.stats.newSongs - count, alreadyExist: prev.stats.alreadyExist + count },
    }));
    setSelected(new Set());
    setImporting(false);
  }

  function toggleSelect(slug) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
  }

  const isRunning = ['connecting','scanning','parsing','deduplicating'].includes(phase);
  const newSongsList = result?.songs.filter((s) => !s.exists) ?? [];

  // ─── Not configured ────────────────────────────────────────────────────────
  if (!hasClientId) {
    return <SetupPanel onSaved={() => setHasClientId(true)} />;
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="od-importer">

      {/* ── Auth Card ────────────────────────────────────────────── */}
      <div className="od-importer__auth card">
        <div className="od-importer__auth-left">
          <div className={`od-importer__auth-dot${loggedIn ? ' od-importer__auth-dot--on' : ''}`} />
          {loggedIn ? (
            <div className="od-importer__auth-info">
              <span className="od-importer__auth-label">Conectado como</span>
              <span className="od-importer__auth-user">{msUser || 'Cuenta Microsoft'}</span>
            </div>
          ) : (
            <div className="od-importer__auth-info">
              <span className="od-importer__auth-label">No conectado</span>
              <span className="od-importer__auth-user">Inicia sesión con tu cuenta de Microsoft</span>
            </div>
          )}
        </div>
        <div className="od-importer__auth-actions">
          {loggedIn ? (
            <>
              <button
                className="btn btn-primary"
                onClick={handleScan}
                disabled={isRunning || importing}
              >
                {isRunning
                  ? <><span className="od-importer__spinner" /> Escaneando...</>
                  : <><RefreshCw size={14} /> Escanear carpeta</>}
              </button>
              <button className="btn btn-ghost" onClick={handleLogout} title="Cerrar sesión">
                <LogOut size={14} />
              </button>
            </>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handleLogin}
              disabled={loginLoading}
            >
              {loginLoading
                ? <><span className="od-importer__spinner" /> Conectando...</>
                : <><LogIn size={14} /> Iniciar sesión con Microsoft</>}
            </button>
          )}
          <button
            className="btn btn-ghost"
            title="Cambiar Client ID"
            onClick={() => { saveClientId(''); setHasClientId(false); }}
          >
            <Settings size={14} />
          </button>
        </div>
      </div>

      {/* ── Errors ───────────────────────────────────────────────── */}
      {loginError && (
        <div className="od-importer__error">
          <AlertTriangle size={14} />
          {loginError}
        </div>
      )}

      {/* ── Folder info ──────────────────────────────────────────── */}
      <div className="od-importer__folder-row card">
        <div className="od-importer__folder-icon">
          <FolderOpen size={16} />
        </div>
        <div className="od-importer__folder-text">
          <span className="od-importer__folder-label">Carpeta de OneDrive</span>
          <span className="od-importer__folder-url">
            {SHARED_FOLDER_URL.replace('https://', '').split('?')[0]}
          </span>
        </div>
        {isRunning && (
          <div className="od-importer__scan-status">
            <span className="od-importer__spinner od-importer__spinner--sm" />
            <span className="od-importer__scan-detail">{detail}</span>
          </div>
        )}
      </div>

      {/* ── Scan Error ───────────────────────────────────────────── */}
      {phase === 'error' && scanError && (
        <div className="od-importer__error">
          <AlertTriangle size={14} />
          {scanError}
        </div>
      )}

      {/* ── Live log (during scan) ───────────────────────────────── */}
      {isRunning && log.length > 0 && (
        <div className="od-importer__log card">
          <div className="od-importer__log-title">Actividad</div>
          {log.map((e, i) => (
            <div key={i} className="od-importer__log-entry">{e}</div>
          ))}
        </div>
      )}

      {/* ── Results ──────────────────────────────────────────────── */}
      {result && (
        <>
          {/* Stats */}
          <div className="od-importer__stats">
            {[
              { val: result.stats.totalFiles,   lbl: 'Archivos',         cls: '' },
              { val: result.stats.totalSongs,   lbl: 'Únicas',           cls: 'songs' },
              { val: result.stats.newSongs,     lbl: 'Nuevas',           cls: 'new' },
              { val: result.stats.alreadyExist, lbl: 'Ya en catálogo',   cls: 'exists' },
            ].map(({ val, lbl, cls }) => (
              <div key={lbl} className={`od-importer__stat${cls ? ` od-importer__stat--${cls}` : ''}`}>
                <span className="od-importer__stat-val">{val}</span>
                <span className="od-importer__stat-lbl">{lbl}</span>
              </div>
            ))}
          </div>

          {/* Action bar */}
          {newSongsList.length > 0 && (
            <div className="od-importer__action-bar card">
              <div className="od-importer__select-btns">
                <button className="btn btn-ghost" onClick={() => setSelected(new Set(newSongsList.map((s) => s.slug)))}>
                  Todas ({newSongsList.length})
                </button>
                <button className="btn btn-ghost" onClick={() => setSelected(new Set())}>
                  Ninguna
                </button>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleImport}
                disabled={selected.size === 0 || importing}
              >
                {importing
                  ? <><span className="od-importer__spinner od-importer__spinner--sm" /> {imported}/{selected.size}</>
                  : <><Plus size={14} /> Agregar {selected.size} al catálogo</>}
              </button>
            </div>
          )}

          {/* Success */}
          {imported > 0 && !importing && (
            <div className="od-importer__success">
              <CheckCircle size={16} />
              {imported} canción{imported !== 1 ? 'es' : ''} agregada{imported !== 1 ? 's' : ''} al catálogo
            </div>
          )}

          {/* Song list */}
          <div className="od-importer__song-list card">
            <div className="od-importer__song-list-header">
              <span>Canciones encontradas</span>
              <span className="od-importer__song-count">{result.songs.length} total</span>
            </div>

            {result.songs.map((song) => {
              const sel  = selected.has(song.slug);
              const fmts = song.formats || [];
              return (
                <div
                  key={song.slug}
                  className={[
                    'od-importer__song-row',
                    song.exists ? 'od-importer__song-row--exists' : '',
                    sel         ? 'od-importer__song-row--selected' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => !song.exists && toggleSelect(song.slug)}
                >
                  <div className={[
                    'od-importer__check',
                    sel         ? 'od-importer__check--on'     : '',
                    song.exists ? 'od-importer__check--exists' : '',
                  ].filter(Boolean).join(' ')}>
                    {(sel || song.exists) && <CheckCircle size={11} />}
                  </div>

                  <div className="od-importer__song-info">
                    <span className="od-importer__song-title">{song.title}</span>
                    <div className="od-importer__song-meta">
                      {song.genre && <span className="od-importer__song-genre">{song.genre}</span>}
                      {song.key   && <span className="od-importer__song-key">{song.key}</span>}
                      {fmts.map((f, i) => (
                        <span key={i} className="od-importer__file-chip"
                          style={{ color: EXT_COLORS[f?.ext] || 'var(--text-tertiary)' }}>
                          .{f?.ext}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="od-importer__song-badge">
                    {song.exists
                      ? <span className="badge badge-success">En catálogo</span>
                      : sel
                        ? <span className="badge badge-orange">Seleccionada</span>
                        : <span className="badge" style={{ background:'var(--bg-tertiary)', color:'var(--text-tertiary)' }}>Nueva</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
