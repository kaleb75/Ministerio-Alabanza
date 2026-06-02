import { useState } from 'react';
import Modal from '../Modal/Modal';
import '../Modal/Modal.css';
import { MUSICAL_KEYS, SONG_GENRES } from '../../utils/constants';

export default function SongFormModal({ song, onSave, onClose }) {
  const [formData, setFormData] = useState({
    title: song?.title ?? '',
    author: song?.author ?? '',
    key: song?.key ?? '',
    tempo: song?.tempo ?? '',
    genre: song?.genre ?? '',
    language: song?.language ?? 'Español',
    tags: song?.tags ? song.tags.join(', ') : '',
  });

  const [errors, setErrors] = useState({});

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }

  function validate() {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido.';
    }
    return newErrors;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      title: formData.title.trim(),
      author: formData.author,
      key: formData.key,
      tempo: Number(formData.tempo),
      genre: formData.genre,
      language: formData.language,
      tags: formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    });
  }

  return (
    <Modal
      title={song ? 'Editar Canción' : 'Nueva Canción'}
      size="md"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-grid form-grid--2">

          {/* Título */}
          <div className="form-field form-field--full">
            <label className="form-label" htmlFor="song-title">
              Título *
            </label>
            <input
              id="song-title"
              className="form-input"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
            {errors.title && (
              <span className="form-error">{errors.title}</span>
            )}
          </div>

          {/* Autor */}
          <div className="form-field">
            <label className="form-label" htmlFor="song-author">
              Autor
            </label>
            <input
              id="song-author"
              className="form-input"
              type="text"
              name="author"
              value={formData.author}
              onChange={handleChange}
            />
          </div>

          {/* Tonalidad */}
          <div className="form-field">
            <label className="form-label" htmlFor="song-key">
              Tonalidad
            </label>
            <select
              id="song-key"
              className="form-select"
              name="key"
              value={formData.key}
              onChange={handleChange}
            >
              <option value="">— Seleccionar —</option>
              {MUSICAL_KEYS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          {/* Tempo */}
          <div className="form-field">
            <label className="form-label" htmlFor="song-tempo">
              Tempo (BPM)
            </label>
            <input
              id="song-tempo"
              className="form-input"
              type="number"
              name="tempo"
              min={40}
              max={240}
              value={formData.tempo}
              onChange={handleChange}
            />
          </div>

          {/* Género */}
          <div className="form-field">
            <label className="form-label" htmlFor="song-genre">
              Género
            </label>
            <select
              id="song-genre"
              className="form-select"
              name="genre"
              value={formData.genre}
              onChange={handleChange}
            >
              <option value="">— Seleccionar —</option>
              {SONG_GENRES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Idioma */}
          <div className="form-field">
            <label className="form-label" htmlFor="song-language">
              Idioma
            </label>
            <select
              id="song-language"
              className="form-select"
              name="language"
              value={formData.language}
              onChange={handleChange}
            >
              <option value="Español">Español</option>
              <option value="Inglés">Inglés</option>
              <option value="Portugués">Portugués</option>
            </select>
          </div>

          {/* Etiquetas */}
          <div className="form-field form-field--full">
            <label className="form-label" htmlFor="song-tags">
              Etiquetas{' '}
              <span className="form-label__note">(separadas por coma)</span>
            </label>
            <input
              id="song-tags"
              className="form-input"
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="adoración, alabanza, clásico"
            />
          </div>

        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            {song ? 'Guardar cambios' : 'Crear canción'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
