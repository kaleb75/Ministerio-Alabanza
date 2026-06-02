import { useNavigate } from 'react-router-dom';
import { ShieldOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../utils/constants';
import './Unauthorized.css';

export default function Unauthorized() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="unauthorized">
      <div className="unauthorized__content animate-fade-in-up">
        <div className="unauthorized__icon">
          <ShieldOff size={48} />
        </div>
        <h1 className="unauthorized__title">Acceso Denegado</h1>
        <p className="unauthorized__desc">
          No tienes permisos para acceder a esta sección.
        </p>
        <button
          className="btn btn-primary unauthorized__btn"
          onClick={() => navigate(isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LOGIN)}
        >
          <ArrowLeft size={16} />
          {isAuthenticated ? 'Volver al Dashboard' : 'Ir al Login'}
        </button>
      </div>
    </div>
  );
}
