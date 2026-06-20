import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useWorkflow } from '../../context/WorkflowContext';
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
  const { toggleSidebar } = useApp();
  const { user } = useAuth();
  const { unreadCount } = useWorkflow();
  const [showNotifications, setShowNotifications] = useState(false);

  const pageTitle = PAGE_TITLES[pathname] ?? 'Ministerio';

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
