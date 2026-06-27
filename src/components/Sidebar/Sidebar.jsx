import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Music2, CalendarDays, Users,
  Inbox, History, Settings, Music, X, LogOut,
  BarChart2, Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { canAccessRoute } from '../../utils/permissions';
import { ROUTES } from '../../utils/constants';
import './Sidebar.css';

const ALL_NAV = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard',   icon: LayoutDashboard, routeKey: 'dashboard' },
  { to: ROUTES.SONGS,     label: 'Canciones',   icon: Music2,          routeKey: 'songs'     },
  { to: ROUTES.EVENTS,    label: 'Cultos',       icon: CalendarDays,    routeKey: 'events'    },
  { to: ROUTES.USUARIOS, label: 'Usuarios',     icon: Users,           routeKey: 'usuarios'  },
  { to: ROUTES.REQUESTS,  label: 'Solicitudes',  icon: Inbox,           routeKey: 'requests'  },
  { to: ROUTES.HISTORY,    label: 'Historial',    icon: History,   routeKey: 'history'   },
  { to: ROUTES.ANALYTICS,  label: 'Analíticas',   icon: BarChart2, routeKey: 'analytics' },
  { to: ROUTES.PLANNER,    label: 'Planificador', icon: Sparkles,  routeKey: 'planner'   },
];

const ALL_BOTTOM = [
  { to: ROUTES.SETTINGS, label: 'Configuración', icon: Settings, routeKey: 'settings' },
];

export default function Sidebar() {
  const { sidebarOpen, closeSidebar } = useApp();
  const { user, logout } = useAuth();

  const visibleNav    = ALL_NAV.filter((i) => canAccessRoute(user?.role, i.routeKey));
  const visibleBottom = ALL_BOTTOM.filter((i) => canAccessRoute(user?.role, i.routeKey));

  return (
    <>
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar} aria-hidden="true" />
      )}

      <aside className={`sidebar${sidebarOpen ? ' sidebar--open' : ''}`}>
        <div className="sidebar__header">
          <div className="sidebar__logo">
            <div className="sidebar__logo-icon"><Music size={20} /></div>
            <div className="sidebar__logo-text">
              <span className="sidebar__logo-title">Alabanza</span>
              <span className="sidebar__logo-subtitle">Ministerio</span>
            </div>
          </div>
          <button className="sidebar__close" onClick={closeSidebar} aria-label="Cerrar menú">
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar__nav">
          <ul className="sidebar__nav-list">
            {visibleNav.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === ROUTES.DASHBOARD}
                  className={({ isActive }) =>
                    `sidebar__nav-link${isActive ? ' sidebar__nav-link--active' : ''}`
                  }
                  onClick={closeSidebar}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar__bottom">
          <ul className="sidebar__nav-list">
            {visibleBottom.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `sidebar__nav-link${isActive ? ' sidebar__nav-link--active' : ''}`
                  }
                  onClick={closeSidebar}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </NavLink>
              </li>
            ))}
            <li>
              <button
                className="sidebar__nav-link sidebar__logout-btn"
                onClick={logout}
              >
                <LogOut size={18} />
                <span>Cerrar Sesión</span>
              </button>
            </li>
          </ul>
        </div>
      </aside>
    </>
  );
}
