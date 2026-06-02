import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Bell, HardDrive, FolderOpen, AlertCircle, Loader } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useWorkflow } from '../../context/WorkflowContext';
import { useFileDB } from '../../context/FileDBContext';
import NotificationCenter from '../NotificationCenter/NotificationCenter';
import { today } from '../../utils/dateUtils';
import { ROUTES } from '../../utils/constants';
import './Topbar.css';

const PAGE_TITLES = {
  [ROUTES.DASHBOARD]:  'Dashboard',
  [ROUTES.SONGS]:      'Canciones',
  [ROUTES.EVENTS]:     'Cultos',
  [ROUTES.DIRECTORS]:  'Directores',
  [ROUTES.REQUESTS]:   'Solicitudes',
  [ROUTES.HISTORY]:    'Historial',
  [ROUTES.SETTINGS]:   'Configuración',
  [ROUTES.ANALYTICS]:  'Analíticas',
  [ROUTES.PLANNER]:    'Planificador',
};

export default function Topbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { toggleSidebar } = useApp();
  const { user } = useAuth();
  const { unreadCount } = useWorkflow();
  const { status, folderName, isSupported, isConnected, setup, regrant } = useFileDB();
  const [showNotifications, setShowNotifications] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);

  const pageTitle = PAGE_TITLES[pathname] ?? 'Ministerio';

  async function handleStorageClick() {
    if (status === 'reconnect') {
      setSetupLoading(true);
      await regrant();
      setSetupLoading(false);
    } else if (!isConnected && isSupported) {
      setSetupLoading(true);
      await setup();
      setSetupLoading(false);
    } else {
      navigate(ROUTES.SETTINGS);
    }
  }

  // ── Storage indicator ───────────────────────────────────────────────────
  function StorageChip() {
    if (setupLoading) {
      return (
        <div className="topbar__storage topbar__storage--loading" title="Conectando...">
          <Loader size={12} className="topbar__storage-spin" />
          <span>Conectando</span>
        </div>
      );
    }

    if (!isSupported) {
      return (
        <button
          className="topbar__storage topbar__storage--warn"
          onClick={() => navigate(ROUTES.SETTINGS)}
          title="Datos solo en navegador. Click para ver configuración."
        >
          <AlertCircle size={12} />
          <span>Navegador</span>
        </button>
      );
    }

    if (status === 'reconnect') {
      return (
        <button
          className="topbar__storage topbar__storage--warn"
          onClick={handleStorageClick}
          title="Carpeta desconectada. Click para reconectar."
        >
          <AlertCircle size={12} />
          <span>Reconectar</span>
        </button>
      );
    }

    if (!isConnected) {
      return (
        <button
          className="topbar__storage topbar__storage--warn"
          onClick={handleStorageClick}
          title="Sin carpeta de datos. Click para configurar."
        >
          <FolderOpen size={12} />
          <span>Seleccionar carpeta</span>
        </button>
      );
    }

    // Connected ✓
    return (
      <button
        className="topbar__storage topbar__storage--ok"
        onClick={() => navigate(ROUTES.SETTINGS)}
        title={`Datos en carpeta: ${folderName}`}
      >
        <HardDrive size={12} />
        <span className="topbar__storage-name">{folderName}</span>
      </button>
    );
  }

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button
          className="topbar__menu-btn"
          onClick={toggleSidebar}
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>
        <div className="topbar__title-group">
          <h1 className="topbar__title">{pageTitle}</h1>
          <span className="topbar__date">{today()}</span>
        </div>
      </div>

      <div className="topbar__right">
        {/* Storage indicator */}
        <StorageChip />

        <div className="topbar__notif-wrap">
          <button
            className="topbar__icon-btn"
            aria-label="Notificaciones"
            onClick={() => setShowNotifications((v) => !v)}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="topbar__badge">{unreadCount}</span>
            )}
          </button>
          {showNotifications && (
            <NotificationCenter onClose={() => setShowNotifications(false)} />
          )}
        </div>

        <div className="topbar__user">
          <div className="topbar__avatar">
            {user?.initials ?? 'U'}
          </div>
          <div className="topbar__user-info">
            <span className="topbar__user-name">{user?.name}</span>
            <span className="topbar__user-role">{user?.title}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
