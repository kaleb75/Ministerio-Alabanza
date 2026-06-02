import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { canAccessRoute } from '../../utils/permissions';
import { ROUTES } from '../../utils/constants';

export default function ProtectedRoute({ children, routeKey }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--bg-primary)',
      }}>
        <div
          className="animate-spin"
          style={{
            width: 32, height: 32,
            border: '3px solid var(--bg-tertiary)',
            borderTopColor: 'var(--accent-orange)',
            borderRadius: '50%',
          }}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  if (routeKey && !canAccessRoute(user.role, routeKey)) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
  }

  return children ?? <Outlet />;
}
