import { useState, useMemo, useRef } from 'react';
import { Search, Check, AlertTriangle, Ban, BookOpen, Mic2, Video, Radio, User } from 'lucide-react';
import Modal from '../Modal/Modal';
import '../Modal/Modal.css';
import { useApp } from '../../context/AppContext';
import {
  RESPONSIBILITY_LABELS,
  RESPONSIBILITY_COMPATIBLE_ROLES,
  BIBLE_BOOKS,
} from '../../utils/constants';

const EVENT_TYPES = ['Culto Domingo', 'Culto Jueves', 'Culto Principal', 'Servicio Midweek', 'Jóvenes', 'Conferencia', 'Especial', 'Otro'];
const STATUS_OPTIONS = [
  { value: 'upcoming',    label: 'Próximo' },
  { value: 'in_progress', label: 'En curso' },
  { value: 'completed',   label: 'Completado' },
  { value: 'cancelled',   label: 'Cancelado' },
];

const RESP_ICONS = {
  director_principal:  User,
  director_secundario: User,
  proyeccion:          Video,
  streaming:           Radio,
  predicador:          Mic2,
};

function defaultResponsibilities() {
  return [
    { id: 'resp_1', type: 'director_principal',  assignedUserId: null, assignedUserName: '', notes: '' },
    { id: 'resp_2', type: 'director_secundario', assignedUserId: null, assignedUserName: '', notes: '' },
    { id: 'resp_3', type: 'proyeccion',           assignedUserId: null, assignedUserName: '', notes: '' },
    { id: 'resp_4', type: 'streaming',            assignedUserId: null, assignedUserName: '', notes: '' },
    { id: 'resp_5', type: 'predicador',           assignedUserId: null, assignedUserName: '', notes: '' },
  ];
}

export default function EventFormModal({ event, onSave, onClose }) {
  const { songs, users, events } = useApp();

  const conflictMap = useMemo(() => {
    const map = {};
    const active = events.filter(
      (e) => (e.status === 'upcoming' || e.status === 'in_progress') &&
              String(e.id) !== String(event?.id)
    );
    for (const ev of active) {
      for (const sid of (ev.songs ?? [])) {
        if (!map[sid]) map[sid] = [];
        map[sid].push({ title: ev.title, date: ev.date, directorName: ev.directorName });
      }
    }
    return map;
  }, [events, event?.id]);

  const [form, setForm] = useState({
    title:  event?.title  || '',
    date:   event?.date   || '',
    time:   event?.time   || '10:00',
    type:   event?.type   || 'Culto Principal',
    status: event?.status || 'upcoming',
    notes:  event?.notes  || '',
  });

  const [responsibilities, setResponsibilities] = useState(
    event?.serviceResponsibilities || defaultResponsibilities()
  );

  const [sermon, setSermon] = useState(
    event?.sermon || { preacherId: null, title: '', book: '', chapter: '', verses: '' }
  );

  const [bibleReading, setBibleReading] = useState(
    event?.bibleReading || { book: '', chapter: '', verses: '' }
  );

  const [selectedSongs, setSelectedSongs] = useState(event?.songs ?? []);
  const [songQuery, setSongQuery]         = useState('');
  const [errors, setErrors]               = useState({});
  const [activeTab, setActiveTab]         = useState('general');

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  }

  function handleSermonChange(e) {
    const { name, value } = e.target;
    setSermon((s) => ({ ...s, [name]: value }));
  }

  function handleBibleChange(e) {
    const { name, value } = e.target;
    setBibleReading((b) => ({ ...b, [name]: value }));
  }

  function getUsersForResponsibility(type) {
    const compatible = RESPONSIBILITY_COMPATIBLE_ROLES[type] || [];
    return users.filter((u) => {
      const userRoles = u.roles || [u.role];
      return u.active && userRoles.some((r) => compatible.includes(r));
    });
  }

  function updateResponsibility(respId, field, value) {
    setResponsibilities((prev) =>
      prev.map((r) => {
        if (r.id !== respId) return r;
        if (field === 'assignedUserId') {
          const found = users.find((u) => String(u.id) === String(value));
          return { ...r, assignedUserId: value || null, assignedUserName: found?.name || '' };
        }
        return { ...r, [field]: value };
      })
    );
  }

  function toggleSong(songId) {
    setSelectedSongs((prev) =>
      prev.includes(songId) ? prev.filter((id) => id !== songId) : [...prev, songId]
    );
  }

  function validate() {
    const e = {};
    if (!form.title.trim()) e.title = 'El título es requerido.';
    if (!form.date)         e.date  = 'La fecha es requerida.';
    const secondary = responsibilities.find((r) => r.type === 'director_secundario');
    const primary   = responsibilities.find((r) => r.type === 'director_principal');
    if (
      secondary?.assignedUserId &&
      primary?.assignedUserId &&
      secondary.assignedUserId === primary.assignedUserId
    ) {
      e.director_sec = 'El director secundario no puede ser el mismo que el principal.';
    }
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      if (errs.director_sec) setActiveTab('responsabilidades');
      return;
    }
    onSave({
      ...form,
      title: form.title.trim(),
      serviceResponsibilities: responsibilities,
      sermon,
      bibleReading,
      songs: selectedSongs,
    });
  }

  const filteredSongs = songs.filter((s) => {
    if (!songQuery.trim()) return true;
    const q = songQuery.toLowerCase();
    return s.title?.toLowerCase().includes(q) || s.author?.toLowerCase().includes(q);
  });

  const TABS = [
    { id: 'general',           label: 'General' },
    { id: 'responsabilidades', label: 'Responsabilidades' },
    { id: 'sermon',            label: 'Sermón' },
    { id: 'lectura',           label: 'Lectura Bíblica' },
    { id: 'canciones',         label: `Canciones (${selectedSongs.length})` },
  ];

  return (
    <Modal title={event ? 'Editar Culto' : 'Nuevo Culto'} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} noValidate>

        <div className="event-form-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`event-form-tab${activeTab === tab.id ? ' event-form-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {tab.id === 'responsabilidades' && errors.director_sec && (
                <span className="event-form-tab__error-dot" />
              )}
            </button>
          ))}
        </div>

        {/* General */}
        {activeTab === 'general' && (
          <div className="form-grid form-grid--2" style={{ marginTop: 20 }}>
            <div className="form-field form-field--full">
              <label className="form-label form-label--required">Título</label>
              <input name="title" className="form-input" value={form.title} onChange={handleChange} placeholder="Ej. Culto Dominical" />
              {errors.title && <span className="form-error">{errors.title}</span>}
            </div>
            <div className="form-field">
              <label className="form-label form-label--required">Fecha</label>
              <input name="date" type="date" className="form-input" value={form.date} onChange={handleChange} />
              {errors.date && <span className="form-error">{errors.date}</span>}
            </div>
            <div className="form-field">
              <label className="form-label">Hora</label>
              <input name="time" type="time" className="form-input" value={form.time} onChange={handleChange} />
            </div>
            <div className="form-field">
              <label className="form-label">Tipo</label>
              <select name="type" className="form-select" value={form.type} onChange={handleChange}>
                {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Estado</label>
              <select name="status" className="form-select" value={form.status} onChange={handleChange}>
                {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="form-field form-field--full">
              <label className="form-label">Notas</label>
              <textarea name="notes" className="form-textarea" value={form.notes} onChange={handleChange} placeholder="Observaciones libres: invitado especial, comunión, bautismos, ofrendas..." rows={3} />
            </div>
          </div>
        )}

        {/* Responsabilidades */}
        {activeTab === 'responsabilidades' && (
          <div className="responsibilities-section" style={{ marginTop: 20 }}>
            {responsibilities.map((resp) => {
              const Icon = RESP_ICONS[resp.type] || User;
              const compatibleUsers = getUsersForResponsibility(resp.type);
              const errorKey = resp.type === 'director_secundario' ? 'director_sec' : null;

              return (
                <div key={resp.id} className="resp-row">
                  <div className="resp-row__label">
                    <Icon size={16} />
                    <span>{RESPONSIBILITY_LABELS[resp.type] || resp.type}</span>
                  </div>
                  <div className="resp-row__controls">
                    <select
                      className="form-select"
                      value={resp.assignedUserId || ''}
                      onChange={(e) => updateResponsibility(resp.id, 'assignedUserId', e.target.value)}
                    >
                      <option value="">Sin asignar</option>
                      {compatibleUsers.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                    {errorKey && errors[errorKey] && (
                      <span className="form-error">{errors[errorKey]}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Sermón */}
        {activeTab === 'sermon' && (
          <div className="form-grid form-grid--2" style={{ marginTop: 20 }}>
            <div className="form-field form-field--full">
              <label className="form-label">Título del Sermón</label>
              <input name="title" className="form-input" value={sermon.title} onChange={handleSermonChange} placeholder="Ej. Fe que Persevera" />
            </div>
            <div className="form-field form-field--full">
              <label className="form-label">Libro Bíblico</label>
              <select name="book" className="form-select" value={sermon.book} onChange={handleSermonChange}>
                <option value="">Seleccionar libro...</option>
                {BIBLE_BOOKS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Capítulo</label>
              <input name="chapter" className="form-input" value={sermon.chapter} onChange={handleSermonChange} placeholder="Ej. 11" type="number" min="1" />
            </div>
            <div className="form-field">
              <label className="form-label">Versículos</label>
              <input name="verses" className="form-input" value={sermon.verses} onChange={handleSermonChange} placeholder="Ej. 1-6" />
            </div>
            {sermon.book && sermon.chapter && (
              <div className="form-field form-field--full">
                <div className="bible-reading-preview">
                  <BookOpen size={16} />
                  <span>{sermon.book} {sermon.chapter}{sermon.verses ? `:${sermon.verses}` : ''}</span>
                  {sermon.title && <strong style={{ color: 'var(--text-primary)' }}> — {sermon.title}</strong>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Lectura Bíblica */}
        {activeTab === 'lectura' && (
          <div className="form-grid form-grid--2" style={{ marginTop: 20 }}>
            <div className="form-field form-field--full">
              <label className="form-label">Libro Bíblico</label>
              <select name="book" className="form-select" value={bibleReading.book} onChange={handleBibleChange}>
                <option value="">Seleccionar libro...</option>
                {BIBLE_BOOKS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Capítulo</label>
              <input name="chapter" className="form-input" value={bibleReading.chapter} onChange={handleBibleChange} placeholder="Ej. 23" type="number" min="1" />
            </div>
            <div className="form-field">
              <label className="form-label">Versículos</label>
              <input name="verses" className="form-input" value={bibleReading.verses} onChange={handleBibleChange} placeholder="Ej. 1-6" />
            </div>
            {bibleReading.book && bibleReading.chapter && (
              <div className="form-field form-field--full">
                <div className="bible-reading-preview">
                  <BookOpen size={16} />
                  <span>{bibleReading.book} {bibleReading.chapter}{bibleReading.verses ? `:${bibleReading.verses}` : ''}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Canciones */}
        {activeTab === 'canciones' && (
          <div className="form-field form-field--full" style={{ marginTop: 20 }}>
            <div className="song-selector">
              <div className="song-selector__search">
                <Search size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                <input className="song-selector__search-input" placeholder="Buscar canción..." value={songQuery} onChange={(e) => setSongQuery(e.target.value)} />
              </div>
              <div className="song-selector__list">
                {filteredSongs.map((s) => {
                  const selected  = selectedSongs.includes(s.id);
                  const conflicts = conflictMap[s.id];
                  const blocked   = !!conflicts;
                  return (
                    <div
                      key={s.id}
                      className={`song-selector__item${selected ? ' song-selector__item--selected' : ''}${blocked ? ' song-selector__item--blocked' : ''}`}
                      onClick={() => !blocked && toggleSong(s.id)}
                    >
                      <div className="song-selector__check">
                        {blocked ? <Ban size={10} style={{ color: 'var(--danger)' }} /> : selected && <Check size={10} style={{ color: '#000' }} />}
                      </div>
                      <span className="song-selector__item-title">{s.title}</span>
                      {s.key && <span className="song-selector__item-key">{s.key}</span>}
                      {blocked && <ConflictBadge conflicts={conflicts} />}
                    </div>
                  );
                })}
                {filteredSongs.length === 0 && (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                    No se encontraron canciones
                  </div>
                )}
              </div>
              {selectedSongs.length > 0 && (
                <div className="song-selector__selected-count">
                  {selectedSongs.length} {selectedSongs.length === 1 ? 'canción seleccionada' : 'canciones seleccionadas'}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="form-actions" style={{ marginTop: 24 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary">{event ? 'Guardar cambios' : 'Crear culto'}</button>
        </div>
      </form>

      <style>{`
        .event-form-tabs { display: flex; gap: 2px; border-bottom: 1px solid var(--border-subtle); overflow-x: auto; }
        .event-form-tab { padding: 10px 16px; border: none; background: none; color: var(--text-secondary); font-size: var(--font-size-sm); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; white-space: nowrap; position: relative; transition: color .15s; }
        .event-form-tab:hover { color: var(--text-primary); }
        .event-form-tab--active { color: var(--text-primary); border-bottom-color: var(--accent, #0A84FF); font-weight: 600; }
        .event-form-tab__error-dot { position: absolute; top: 8px; right: 6px; width: 6px; height: 6px; border-radius: 50%; background: var(--danger); }
        .responsibilities-section { display: flex; flex-direction: column; gap: 14px; }
        .resp-row { display: grid; grid-template-columns: 170px 1fr; gap: 12px; align-items: start; }
        .resp-row__label { display: flex; align-items: center; gap: 8px; color: var(--text-secondary); font-size: var(--font-size-sm); padding-top: 10px; }
        .resp-row__controls { display: flex; flex-direction: column; gap: 4px; }
        .bible-reading-preview { display: flex; align-items: center; gap: 8px; padding: 12px; background: var(--bg-secondary); border-radius: var(--radius-md); color: var(--text-secondary); font-size: var(--font-size-sm); flex-wrap: wrap; }
        @media (max-width: 540px) {
          .resp-row { grid-template-columns: 1fr; }
          .resp-row__label { padding-top: 0; }
        }
      `}</style>
    </Modal>
  );
}

function ConflictBadge({ conflicts }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  return (
    <span
      ref={ref}
      className="song-selector__conflict-badge"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
    >
      <AlertTriangle size={11} />
      Ya programada
      {open && (
        <span className="song-selector__conflict-popup">
          <strong>Canción ya asignada en:</strong>
          {conflicts.map((c, i) => (
            <span key={i} className="song-selector__conflict-row">
              <span className="song-selector__conflict-event">{c.title}</span>
              <span className="song-selector__conflict-meta">
                {c.date && formatDate(c.date)}{c.directorName && ` · ${c.directorName}`}
              </span>
            </span>
          ))}
        </span>
      )}
    </span>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
}
