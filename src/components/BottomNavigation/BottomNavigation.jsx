import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Music2, CalendarDays, Inbox, History, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { canAccessRoute } from '../../utils/permissions';
import { ROUTES } from '../../utils/constants';
import './BottomNavigation.css';

const ALL_NAV = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard',  icon: LayoutDashboard, routeKey: 'dashboard' },
  { to: ROUTES.SONGS,     label: 'Canciones',  icon: Music2,          routeKey: 'songs'     },
  { to: ROUTES.EVENTS,    label: 'Cultos',      icon: CalendarDays,    routeKey: 'events'    },
  { to: ROUTES.REQUESTS,  label: 'Solicitudes', icon: Inbox,           routeKey: 'requests'  },
  { to: ROUTES.DIRECTORS, label: 'Directores',  icon: Users,           routeKey: 'directors' },
  { to: ROUTES.HISTORY,   label: 'Historial',   icon: History,         routeKey: 'history'   },
];

export default function BottomNavigation() {
  const { pendingRequests } = useApp();
  const { user } = useAuth();

  const visible = ALL_NAV
    .filter((i) => canAccessRoute(user?.role, i.routeKey))
    .slice(0, 5);

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Navegación principal">
      {visible.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === ROUTES.DASHBOARD}
          className={({ isActive }) =>
            `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`
          }
        >
          <div className="bottom-nav__icon-wrap">
            <Icon size={22} />
            {to === ROUTES.REQUESTS && pendingRequests > 0 && (
              <span className="bottom-nav__badge">{pendingRequests}</span>
            )}
          </div>
          <span className="bottom-nav__label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
