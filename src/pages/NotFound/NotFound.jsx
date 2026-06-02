import { useNavigate } from 'react-router-dom';
import { TriangleAlert, ArrowLeft } from 'lucide-react';
import { ROUTES } from '../../utils/constants';
import './NotFound.css';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="notfound-page">
      <div className="notfound-content animate-fade-in-up">
        <div className="notfound-icon">
          <TriangleAlert size={48} />
        </div>
        <h1 className="notfound-code">404</h1>
        <h2 className="notfound-title">Página no encontrada</h2>
        <p className="notfound-desc">
          La página que buscas no existe o fue movida.
        </p>
        <button
          className="btn btn-primary notfound-btn"
          onClick={() => navigate(ROUTES.DASHBOARD)}
        >
          <ArrowLeft size={16} />
          Volver al Dashboard
        </button>
      </div>
    </div>
  );
}
