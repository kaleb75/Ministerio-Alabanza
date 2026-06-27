import { useState } from 'react';
import Modal from '../Modal/Modal';
import { ROLE_LABELS, ROLE_COLORS } from '../../utils/constants';
import './UserFormModal.css';

const ALL_ROLES = [
  { value: 'admin',            label: 'Administrador' },
  { value: 'lider_directores', label: 'Líder de Directores' },
  { value: 'director',         label: 'Director' },
  { value: 'predicador',       label: 'Predicador' },
  { value: 'proyeccion',       label: 'Proyección' },
  { value: 'streaming',        label: 'Streaming' },
  { value: 'musico',           label: 'Músico' },
  { value: 'solo_lectura',     label: 'Solo Lectura' },
];

export default function UserFormModal({ user, onSave, onClose }) {
  const isEdit = Boolean(user);

  const initialRoles = user?.roles || (user?.role ? [user.role] : ['director']);

  const [form, setForm] = useState({
    name:     user?.name     || '',
    email:    user?.email    || '',
    password: '',
    roles:    initialRoles,
    title:    user?.title    || '',
    active:   user?.active   ?? true,
  });
  const [errors, setErrors] = useState({});

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setForm((f) => ({ ...f, [name]: val }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  }

  function toggleRole(role) {
    setForm((f) => {
      const has = f.roles.includes(role);
      let next;
      if (has) {
        next = f.roles.filter((r) => r !== role);
        if (next.length === 0) next = [role];
      } else {
        next = [...f.roles, role];
      }
      return { ...f, roles: next };
    });
  }

  function validate() {
    const e = {};
    if (!form.name.trim())  e.name  = 'El nombre es requerido.';
    if (!form.email.trim()) e.email = 'El correo es requerido.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Correo inválido.';
    if (!isEdit && !form.password) e.password = 'La contraseña es requerida para nuevos usuarios.';
    if (form.roles.length === 0) e.roles = 'Selecciona al menos un rol.';
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const payload = {
      name:   form.name.trim(),
      email:  form.email.trim().toLowerCase(),
      roles:  form.roles,
      role:   form.roles[0],
      title:  form.title.trim(),
      active: form.active,
    };
    if (form.password) payload.password = form.password;
    onSave(payload);
  }

  return (
    <Modal title={isEdit ? 'Editar Usuario' : 'Nuevo Usuario'} onClose={onClose} size="md">
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-grid form-grid--2">

          <div className="form-field form-field--full">
            <label className="form-label form-label--required">Nombre completo</label>
            <input name="name" className="form-input" value={form.name} onChange={handleChange} placeholder="Ej. María González" />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div className="form-field form-field--full">
            <label className="form-label form-label--required">Correo electrónico</label>
            <input name="email" type="email" className="form-input" value={form.email} onChange={handleChange} placeholder="usuario@iglesia.com" />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-field form-field--full">
            <label className="form-label form-label--required">
              Contraseña {isEdit && <span style={{ opacity: 0.6, fontWeight: 400, textTransform: 'none' }}>(dejar en blanco para no cambiar)</span>}
            </label>
            <input name="password" type="password" className="form-input" value={form.password} onChange={handleChange} placeholder={isEdit ? '••••••••' : 'Mínimo 6 caracteres'} />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <div className="form-field form-field--full">
            <label className="form-label form-label--required">Roles</label>
            <div className="role-selector">
              {ALL_ROLES.map(({ value, label }) => {
                const selected = form.roles.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    className={`role-chip${selected ? ' role-chip--selected' : ''}`}
                    style={selected ? {
                      background: (ROLE_COLORS[value] || '#8E8E93') + '22',
                      borderColor: ROLE_COLORS[value] || '#8E8E93',
                      color: ROLE_COLORS[value] || '#8E8E93',
                    } : {}}
                    onClick={() => toggleRole(value)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {errors.roles && <span className="form-error">{errors.roles}</span>}
          </div>

          <div className="form-field form-field--full">
            <label className="form-label">Cargo / Título</label>
            <input name="title" className="form-input" value={form.title} onChange={handleChange} placeholder="Ej. Director de Alabanza" />
          </div>

          {isEdit && (
            <div className="form-field form-field--full">
              <label className="form-toggle">
                <input name="active" type="checkbox" checked={form.active} onChange={handleChange} className="form-toggle__input" />
                <span className="form-toggle__track" />
                <span className="form-toggle__label">{form.active ? 'Usuario activo' : 'Usuario inactivo'}</span>
              </label>
            </div>
          )}

        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary">{isEdit ? 'Guardar cambios' : 'Crear usuario'}</button>
        </div>
      </form>
    </Modal>
  );
}
