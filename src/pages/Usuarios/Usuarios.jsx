import { useState } from 'react';
import { Users, Plus, Pencil, Trash2, UserX, UserCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { canPerformAction } from '../../utils/permissions';
import { ROLE_LABELS, ROLE_COLORS } from '../../utils/constants';
import UserFormModal from '../../components/UserFormModal/UserFormModal';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import './Usuarios.css';

const AVATAR_COLORS = [
  '#FF9500', '#0A84FF', '#32D74B', '#FFD60A',
  '#FF453A', '#BF5AF2', '#5AC8FA', '#FF6961',
];

export default function Usuarios() {
  const { users, events, addUser, updateUser, deleteUser, toggleUserActive } = useApp();
  const { user: currentUser } = useAuth();

  const canCreate = canPerformAction(currentUser, 'usuarios', 'create');
  const canEdit   = canPerformAction(currentUser, 'usuarios', 'edit');
  const canDelete = canPerformAction(currentUser, 'usuarios', 'delete');

  const [formModal, setFormModal]       = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showInactive, setShowInactive] = useState(false);
  const [filterRole, setFilterRole]     = useState('all');

  const activeUsers   = users.filter((u) => u.active);
  const inactiveUsers = users.filter((u) => !u.active);
  const allDisplayed  = showInactive ? users : activeUsers;

  const filteredUsers = filterRole === 'all'
    ? allDisplayed
    : allDisplayed.filter((u) => (u.roles || [u.role]).includes(filterRole));

  function eventsForUser(userId) {
    return events.filter((e) => {
      if (e.serviceResponsibilities && e.serviceResponsibilities.length > 0) {
        return e.serviceResponsibilities.some((r) => String(r.assignedUserId) === String(userId));
      }
      return String(e.directorId) === String(userId);
    });
  }

  async function handleSave(data) {
    try {
      if (formModal === 'create') {
        await addUser(data);
      } else {
        await updateUser(formModal.id, data);
      }
      setFormModal(null);
    } catch (err) {
      console.error('Error guardando usuario:', err);
      alert(err?.message ?? 'Error al guardar');
    }
  }

  async function handleDelete() {
    try {
      await deleteUser(deleteTarget.id);
    } catch (err) {
      console.error('Error eliminando usuario:', err);
    }
    setDeleteTarget(null);
  }

  const allRoles = [...new Set(users.flatMap((u) => u.roles || [u.role]).filter(Boolean))].sort();

  return (
    <div className="usuarios-page page-enter">
      <div className="page-header page-header--flex">
        <div>
          <h1>Usuarios</h1>
          <p>
            {activeUsers.length} miembros activos
            {inactiveUsers.length > 0 && ` · ${inactiveUsers.length} inactivos`}
          </p>
        </div>
        <div className="usuarios-header-actions">
          {inactiveUsers.length > 0 && (
            <button className="btn btn-secondary" onClick={() => setShowInactive((v) => !v)}>
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

      {allRoles.length > 1 && (
        <div className="usuarios-filters">
          <button
            className={`filter-pill${filterRole === 'all' ? ' filter-pill--active' : ''}`}
            onClick={() => setFilterRole('all')}
          >
            Todos ({allDisplayed.length})
          </button>
          {allRoles.map((role) => {
            const count = allDisplayed.filter((u) => (u.roles || [u.role]).includes(role)).length;
            const isActive = filterRole === role;
            return (
              <button
                key={role}
                className={`filter-pill${isActive ? ' filter-pill--active' : ''}`}
                style={isActive ? {
                  background: (ROLE_COLORS[role] || '#8E8E93') + '22',
                  borderColor: ROLE_COLORS[role] || '#8E8E93',
                  color: ROLE_COLORS[role] || '#8E8E93',
                } : {}}
                onClick={() => setFilterRole(role)}
              >
                {ROLE_LABELS[role] || role} ({count})
              </button>
            );
          })}
        </div>
      )}

      {filteredUsers.length === 0 ? (
        <div className="card empty-state">
          <Users size={36} className="empty-state-icon" />
          <p>No hay usuarios registrados</p>
          {canCreate && (
            <button className="btn btn-primary" onClick={() => setFormModal('create')}>
              <Plus size={14} /> Agregar usuario
            </button>
          )}
        </div>
      ) : (
        <div className="usuarios-grid stagger-children">
          {filteredUsers.map((u, idx) => {
            const userEvents = eventsForUser(u.id);
            const upcoming   = userEvents.filter((e) => e.status === 'upcoming').length;
            const completed  = userEvents.filter((e) => e.status === 'completed').length;
            const color      = AVATAR_COLORS[idx % AVATAR_COLORS.length];
            const userRoles  = u.roles || [u.role];

            return (
              <div
                key={u.id}
                className={`usuario-card card${!u.active ? ' usuario-card--inactive' : ''}`}
              >
                {(canEdit || canDelete) && (
                  <div className="usuario-card__actions">
                    {canEdit && (
                      <button
                        className="usuario-card__action-btn"
                        title={u.active ? 'Desactivar' : 'Activar'}
                        onClick={() => toggleUserActive(u.id, !u.active)}
                      >
                        {u.active ? <UserX size={14} /> : <UserCheck size={14} />}
                      </button>
                    )}
                    {canEdit && (
                      <button
                        className="usuario-card__action-btn"
                        title="Editar"
                        onClick={() => setFormModal(u)}
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                    {canDelete && u.id !== currentUser?.id && (
                      <button
                        className="usuario-card__action-btn usuario-card__action-btn--danger"
                        title="Eliminar"
                        onClick={() => setDeleteTarget(u)}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )}

                <div className="usuario-card__header">
                  <div className="usuario-card__avatar" style={{ background: color, color: '#000' }}>
                    {u.initials}
                  </div>
                  <div className="usuario-card__roles">
                    {userRoles.map((role) => (
                      <span
                        key={role}
                        className="badge"
                        style={{
                          background: (ROLE_COLORS[role] || '#8E8E93') + '22',
                          color: ROLE_COLORS[role] || '#8E8E93',
                          border: `1px solid ${(ROLE_COLORS[role] || '#8E8E93')}44`,
                        }}
                      >
                        {ROLE_LABELS[role] || role}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="usuario-card__body">
                  <h3 className="usuario-card__name">{u.name}</h3>
                  <p className="usuario-card__title">{u.title}</p>
                  <p className="usuario-card__email">{u.email}</p>
                </div>

                <div className="usuario-card__stats">
                  <div className="usuario-card__stat">
                    <span className="usuario-card__stat-value">{upcoming}</span>
                    <span className="usuario-card__stat-label">Proximos</span>
                  </div>
                  <div className="usuario-card__stat">
                    <span className="usuario-card__stat-value">{completed}</span>
                    <span className="usuario-card__stat-label">Realizados</span>
                  </div>
                  <div className="usuario-card__stat">
                    <span className="usuario-card__stat-value">{userEvents.length}</span>
                    <span className="usuario-card__stat-label">Total</span>
                  </div>
                </div>

                {!u.active && <div className="usuario-card__inactive-tag">Inactivo</div>}
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
