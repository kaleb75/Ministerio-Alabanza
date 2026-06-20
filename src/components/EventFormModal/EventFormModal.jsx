import { useState, useMemo, useRef } from 'react';
import { Search, Check, AlertTriangle, Ban } from 'lucide-react';
import Modal from '../Modal/Modal';
import '../Modal/Modal.css';
import { useApp } from '../../context/AppContext';

const EVENT_TYPES = ['Culto Domingo', 'Culto Jueves', 'Culto Principal', 'Servicio Midweek', 'Jóvenes', 'Conferencia', 'Especial', 'Otro'];
const STATUS_OPTIONS = [
  { value: 'upcoming',    label: 'Próximo' },
  { value: 'in_progress', label: 'En curso' },
  { value: 'completed',   label: 'Completado' },
  { value: 'cancelled',   label: 'Cancelado' },
];

export default function EventFormModal({ event, onSave, onClose }) {
  const { songs, users, events } = useApp();

  // Map songId → array of {title, date, directorName} for OTHER active events that use it
  const conflictMap = useMemo(() => {
    const map = {};
    const activeEvents = events.filter(
      (e) => (e.status === 'upcoming' || e.status === 'in_progress') &&
              String(e.id) !== String(event?.id)
    );
    for (const ev of activeEvents) {
      for (const sid of (ev.songs ?? [])) {
        if (!map[sid]) map[sid] = [];
        map[sid].push({ title: ev.title, date: ev.date, directorName: ev.directorName });
      }
    }
    return map;
  }, [events, event?.id]);
  const directors = users.filter((u) =>
    ['admin', 'lider_directores', 'director'].includes(u.role) && u.active
  );

  const [form, setForm] = useState({
    title:       event?.title       || '',
    date:        event?.date        || '',
    time:        event?.time        || '10:00',
    type:        event?.type        || 'Culto Principal',
    directorId:  event?.directorId  || (directors[0]?.id ?? ''),
    status:      event?.status      || 'upcoming',
    notes:       event?.notes       || '',
  });
  const [selectedSongs, setSelectedSongs] = useState(event?.songs ?? []);
  const [songQuery, setSongQuery] = useState('');
  const [errors, setErrors] = useState({});

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: null }));
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
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const director = directors.find((d) => String(d.id) === String(form.directorId));
    onSave({
      ...form,
      title:        form.title.trim(),
      directorId:   form.directorId || null,
      directorName: director?.name ?? '',
      songs:        selectedSongs,
    });
  }

  const filteredSongs = songs.filter((s) => {
    if (!songQuery.trim()) return true;
    const q = songQuery.toLowerCase();
    return s.title?.toLowerCase().includes(q) || s.author?.toLowerCase().includes(q);
  });

  return (
    <Modal title={event ? 'Editar Culto' : 'Nuevo Culto'} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-grid form-grid--2">

          {/* Title */}
          <div className="form-field form-field--full">
            <label className="form-label form-label--required">Título</label>
            <input
              name="title"
              className="form-input"
              value={form.title}
              onChange={handleChange}
              placeholder="Ej. Culto Dominical"
            />
            {errors.title && <span className="form-error">{errors.title}</span>}
          </div>

          {/* Date */}
          <div className="form-field">
            <label className="form-label form-label--required">Fecha</label>
            <input
              name="date"
              type="date"
              className="form-input"
              value={form.date}
              onChange={handleChange}
            />
            {errors.date && <span className="form-error">{errors.date}</span>}
          </div>

          {/* Time */}
          <div className="form-field">
            <label className="form-label">Hora</label>
            <input
              name="time"
              type="time"
              className="form-input"
              value={form.time}
              onChange={handleChange}
            />
          </div>

          {/* Type */}
          <div className="form-field">
            <label className="form-label">Tipo</label>
            <select name="type" className="form-select" value={form.type} onChange={handleChange}>
              {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Status */}
          <div className="form-field">
            <label className="form-label">Estado</label>
            <select name="status" className="form-select" value={form.status} onChange={handleChange}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Director */}
          <div className="form-field form-field--full">
            <label className="form-label">Director asignado</label>
            <select name="directorId" className="form-select" value={form.directorId} onChange={handleChange}>
              <option value="">Sin asignar</option>
              {directors.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Song selector */}
          <div className="form-field form-field--full">
            <label className="form-label">
              Canciones &nbsp;
              <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                ({selectedSongs.length} seleccionadas)
              </span>
            </label>
            <div className="song-selector">
              <div className="song-selector__search">
                <Search size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                <input
                  className="song-selector__search-input"
                  placeholder="Buscar canción..."
                  value={songQuery}
                  onChange={(e) => setSongQuery(e.target.value)}
                />
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
                        {blocked
                          ? <Ban size={10} style={{ color: 'var(--danger)' }} />
                          : selected && <Check size={10} style={{ color: '#000' }} />
                        }
                      </div>
                      <span className="song-selector__item-title">{s.title}</span>
                      {s.key && <span className="song-selector__item-key">{s.key}</span>}
                      {blocked && (
                        <ConflictBadge conflicts={conflicts} />
                      )}
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

          {/* Notes */}
          <div className="form-field form-field--full">
            <label className="form-label">Notas</label>
            <textarea
              name="notes"
              className="form-textarea"
              value={form.notes}
              onChange={handleChange}
              placeholder="Notas adicionales..."
              rows={3}
            />
          </div>

        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary">
            {event ? 'Guardar cambios' : 'Crear culto'}
          </button>
        </div>
      </form>
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
                {c.date && formatDate(c.date)}
                {c.directorName && ` · ${c.directorName}`}
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
