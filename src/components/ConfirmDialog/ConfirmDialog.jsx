import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';
import './ConfirmDialog.css';

export default function ConfirmDialog({ title, message, onConfirm, onCancel, danger = true }) {
  return createPortal(
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className={`confirm-icon ${danger ? 'confirm-icon--danger' : ''}`}>
          <AlertTriangle size={22} />
        </div>
        <div className="confirm-body">
          <h3 className="confirm-title">{title}</h3>
          {message && <p className="confirm-message">{message}</p>}
        </div>
        <div className="confirm-actions">
          <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
            Confirmar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
