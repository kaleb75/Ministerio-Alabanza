import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../utils/constants';
import './AuthLayout.css';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to={ROUTES.DASHBOARD} replace />;

  return (
    <div className="auth-layout">
      <div className="auth-layout__card animate-scale-in">
        <Outlet />
      </div>
    </div>
  );
}
