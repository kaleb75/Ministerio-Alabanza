import { useState } from 'react';
import { FolderOpen, Music, AlertTriangle, RefreshCw, HardDrive, FileJson } from 'lucide-react';
import { useFileDB } from '../../context/FileDBContext';
import './FileSetupScreen.css';

const FILES = ['songs.json', 'events.json', 'users.json', 'songHistory.json'];

export default function FileSetupScreen() {
  const { status, error, setup, regrant, isSupported } = useFileDB();
  const [loading, setLoading] = useState(false);

  async function handleSetup() {
    setLoading(true);
    await setup();
    setLoading(false);
  }

  async function handleRegrant() {
    setLoading(true);
    await regrant();
    setLoading(false);
  }

  // No File System API → skip setup, use localStorage
  if (!isSupported) return null;

  return (
    <div className="fs-setup">
      <div className="fs-setup__card">
        {/* Logo */}
        <div className="fs-setup__logo">
          <Music size={28} />
        </div>

        <h1 className="fs-setup__title">Ministerio de Alabanza</h1>

        {status === 'reconnect' ? (
          <>
            <div className="fs-setup__reconnect-icon">
              <HardDrive size={28} />
            </div>
            <h2 className="fs-setup__subtitle">Reconectar carpeta de datos</h2>
            <p className="fs-setup__desc">
              Tienes datos guardados en archivos locales. Haz clic para reconectar
              y cargar tus datos.
            </p>
            <button
              className="fs-setup__btn"
              onClick={handleRegrant}
              disabled={loading}
            >
              {loading
                ? <><span className="fs-setup__spinner" /> Cargando...</>
                : <><RefreshCw size={16} /> Reconectar carpeta</>}
            </button>
          </>
        ) : (
          <>
            <div className="fs-setup__files-preview">
              {FILES.map(f => (
                <div key={f} className="fs-setup__file">
                  <FileJson size={14} />
                  <span>{f}</span>
                </div>
              ))}
            </div>

            <h2 className="fs-setup__subtitle">Selecciona la carpeta de datos</h2>
            <p className="fs-setup__desc">
              La app guarda todos los datos como archivos <strong>.json</strong> en una
              carpeta de tu elección. Puedes editarlos directamente, hacer backup
              o subirlos a GitHub.
            </p>

            <button
              className="fs-setup__btn"
              onClick={handleSetup}
              disabled={loading}
            >
              {loading
                ? <><span className="fs-setup__spinner" /> Configurando...</>
                : <><FolderOpen size={16} /> Seleccionar carpeta</>}
            </button>

            <p className="fs-setup__hint">
              Se creará una carpeta con los datos del ministerio. Funciona también
              en GitHub Pages — selecciona cualquier carpeta local.
            </p>
          </>
        )}

        {error && (
          <div className="fs-setup__error">
            <AlertTriangle size={14} />
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
