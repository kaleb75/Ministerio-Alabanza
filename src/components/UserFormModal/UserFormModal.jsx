import { useState } from 'react';
import Modal from '../Modal/Modal';
import './UserFormModal.css';

const ROLES = [
  { value: 'admin',            label: 'Administrador' },
  { value: 'lider_directores', label: 'Líder de Directores' },
  { value: 'director',         label: 'Director de Alabanza' },
  { value: 'musico',           label: 'Músico' },
];

const TITLE_BY_ROLE = {
  admin:            'Administrador',
  lider_directores: 'Líder de Directores',
  director:         'Director de Alabanza',
  musico:           'Músico',
};

export default function UserFormModal({ user, onSave, onClose }) {
  const isEdit = Boolean(user);

  const [form, setForm] = useState({
    name:     user?.name     || '',
    email:    user?.email    || '',
    password: '',
    role:     user?.role     || 'director',
    title:    user?.title    || 'Director de Alabanza',
    active:   user?.active   ?? true,
  });
  const [errors, setErrors] = useState({});

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setForm((f) => {
      const next = { ...f, [name]: val };
      if (name === 'role') next.title = TITLE_BY_ROLE[value] || '';
      return next;
    });
    if (errors[name]) setErrors((e) => ({ ...e, [name]: null }));
  }

  function validate() {
    const e = {};
    if (!form.name.trim())  e.name  = 'El nombre es requerido.';
    if (!form.email.trim()) e.email = 'El correo es requerido.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Correo inválido.';
    if (!isEdit && !form.password) e.password = 'La contraseña es requerida para nuevos usuarios.';
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const payload = {
      name:   form.name.trim(),
      email:  form.email.trim().toLowerCase(),
      role:   form.role,
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

          {/* Name */}
          <div className="form-field form-field--full">
            <label className="form-label form-label--required">Nombre completo</label>
            <input
              name="name"
              className="form-input"
              value={form.name}
              onChange={handleChange}
              placeholder="Ej. María González"
            />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          {/* Email */}
          <div className="form-field form-field--full">
            <label className="form-label form-label--required">Correo electrónico</label>
            <input
              name="email"
              type="email"
              className="form-input"
              value={form.email}
              onChange={handleChange}
              placeholder="usuario@iglesia.com"
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          {/* Password */}
          <div className="form-field form-field--full">
            <label className="form-label form-label--required">
              Contraseña {isEdit && <span style={{ opacity: 0.6, fontWeight: 400, textTransform: 'none' }}>(dejar en blanco para no cambiar)</span>}
            </label>
            <input
              name="password"
              type="password"
              className="form-input"
              value={form.password}
              onChange={handleChange}
              placeholder={isEdit ? '••••••••' : 'Mínimo 6 caracteres'}
            />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          {/* Role */}
          <div className="form-field">
            <label className="form-label">Rol</label>
            <select name="role" className="form-select" value={form.role} onChange={handleChange}>
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          {/* Title */}
          <div className="form-field">
            <label className="form-label">Cargo / Título</label>
            <input
              name="title"
              className="form-input"
              value={form.title}
              onChange={handleChange}
              placeholder="Ej. Director de Alabanza"
            />
          </div>

          {/* Active toggle (edit only) */}
          {isEdit && (
            <div className="form-field form-field--full">
              <label className="form-toggle">
                <input
                  name="active"
                  type="checkbox"
                  checked={form.active}
                  onChange={handleChange}
                  className="form-toggle__input"
                />
                <span className="form-toggle__track" />
                <span className="form-toggle__label">
                  {form.active ? 'Usuario activo' : 'Usuario inactivo'}
                </span>
              </label>
            </div>
          )}

        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary">
            {isEdit ? 'Guardar cambios' : 'Crear usuario'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
