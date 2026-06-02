import { useState } from 'react';
import { Users, Plus, Pencil, Trash2, UserX, UserCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { canPerformAction } from '../../utils/permissions';
import UserFormModal from '../../components/UserFormModal/UserFormModal';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import './Directors.css';

const ROLE_LABELS = {
  admin:            'Administrador',
  lider_directores: 'Líder de Dir.',
  director:         'Director',
  musico:           'Músico',
};

const ROLE_VARIANTS = {
  admin:            'badge-orange',
  lider_directores: 'badge-warning',
  director:         'badge-info',
  musico:           'badge-success',
};

const AVATAR_COLORS = [
  '#FF9500', '#0A84FF', '#32D74B', '#FFD60A',
  '#FF453A', '#BF5AF2', '#5AC8FA', '#FF6961',
];

export default function Directors() {
  const { users, events, addUser, updateUser, deleteUser, toggleUserActive } = useApp();
  const { user: currentUser } = useAuth();

  const canCreate = canPerformAction(currentUser?.role, 'directors', 'create');
  const canEdit   = canPerformAction(currentUser?.role, 'directors', 'edit');
  const canDelete = canPerformAction(currentUser?.role, 'directors', 'delete');

  const [formModal, setFormModal]       = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showInactive, setShowInactive] = useState(false);

  const activeUsers   = users.filter((u) => u.active);
  const inactiveUsers = users.filter((u) => !u.active);
  const displayed     = showInactive ? users : activeUsers;

  function eventsForUser(userId) {
    return events.filter((e) => String(e.directorId) === String(userId));
  }

  function handleSave(data) {
    if (formModal === 'create') {
      try {
        addUser(data);
      } catch (err) {
        alert(err.message);
        return;
      }
    } else {
      updateUser(formModal.id, data);
    }
    setFormModal(null);
  }

  function handleDelete() {
    deleteUser(deleteTarget.id);
    setDeleteTarget(null);
  }

  return (
    <div className="directors-page page-enter">
      <div className="page-header page-header--flex">
        <div>
          <h1>Equipo</h1>
          <p>
            {activeUsers.length} miembros activos
            {inactiveUsers.length > 0 && ` · ${inactiveUsers.length} inactivos`}
          </p>
        </div>
        <div className="directors-header-actions">
          {inactiveUsers.length > 0 && (
            <button
              className="btn btn-secondary"
              onClick={() => setShowInactive((v) => !v)}
            >
              {showInactive ? 'Ocultar inactivos' : `Ver inactivos (${inactiveUsers.length})`}
            </button>
          )}
          {canCreate && (
            <button className="btn btn-primary" onClick={() => setFormModal('create')}>
              <Plus size={16} />
              Nuevo usuario
            </button>
          )}
        </div>
      </div>

      {displayed.length === 0 ? (
        <div className="card empty-state">
          <Users size={36} className="empty-state-icon" />
          <p>No hay miembros registrados</p>
          {canCreate && (
            <button className="btn btn-primary" onClick={() => setFormModal('create')}>
              <Plus size={14} /> Agregar usuario
            </button>
          )}
        </div>
      ) : (
        <div className="directors-grid stagger-children">
          {displayed.map((u, idx) => {
            const userEvents = eventsForUser(u.id);
            const upcoming   = userEvents.filter((e) => e.status === 'upcoming').length;
            const completed  = userEvents.filter((e) => e.status === 'completed').length;
            const color      = AVATAR_COLORS[idx % AVATAR_COLORS.length];

            return (
              <div
                key={u.id}
                className={`director-card card${!u.active ? ' director-card--inactive' : ''}`}
              >
                {/* Actions */}
                {(canEdit || canDelete) && (
                  <div className="director-card__actions">
                    {canEdit && (
                      <button
                        className="director-card__action-btn"
                        title={u.active ? 'Desactivar' : 'Activar'}
                        onClick={() => toggleUserActive(u.id, !u.active)}
                      >
                        {u.active ? <UserX size={14} /> : <UserCheck size={14} />}
                      </button>
                    )}
                    {canEdit && (
                      <button
                        className="director-card__action-btn"
                        title="Editar"
                        onClick={() => setFormModal(u)}
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                    {canDelete && u.id !== currentUser?.id && (
                      <button
                        className="director-card__action-btn director-card__action-btn--danger"
                        title="Eliminar"
                        onClick={() => setDeleteTarget(u)}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )}

                <div className="director-card__header">
                  <div
                    className="director-card__avatar"
                    style={{ background: color, color: '#000' }}
                  >
                    {u.initials}
                  </div>
                  <span className={`badge ${ROLE_VARIANTS[u.role] ?? 'badge-info'}`}>
                    {ROLE_LABELS[u.role] ?? u.role}
                  </span>
                </div>

                <div className="director-card__body">
                  <h3 className="director-card__name">{u.name}</h3>
                  <p className="director-card__title">{u.title}</p>
                  <p className="director-card__email">{u.email}</p>
                </div>

                <div className="director-card__stats">
                  <div className="director-card__stat">
                    <span className="director-card__stat-value">{upcoming}</span>
                    <span className="director-card__stat-label">Próximos</span>
                  </div>
                  <div className="director-card__stat">
                    <span className="director-card__stat-value">{completed}</span>
                    <span className="director-card__stat-label">Realizados</span>
                  </div>
                  <div className="director-card__stat">
                    <span className="director-card__stat-value">{userEvents.length}</span>
                    <span className="director-card__stat-label">Total</span>
                  </div>
                </div>

                {!u.active && (
                  <div className="director-card__inactive-tag">Inactivo</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {formModal !== null && (
        <UserFormModal
          user={formModal === 'create' ? null : formModal}
          onSave={handleSave}
          onClose={() => setFormModal(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Eliminar usuario"
          message={`¿Eliminar a "${deleteTarget.name}"? Esta acción no se puede deshacer.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
