import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Music2, Plus, Pencil, Trash2, Sparkles, TrendingDown,
  Search, Cloud, CalendarPlus, Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useSongIntelligence } from '../../context/SongIntelligenceContext';
import SongFormModal from '../../components/SongFormModal/SongFormModal';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import OneDriveImporter from '../../components/OneDriveImporter/OneDriveImporter';
import { canPerformAction } from '../../utils/permissions';
import { useAuth } from '../../context/AuthContext';
import './Songs.css';

const SECTION_TABS = [
  { id: 'catalog', label: 'Catálogo' },
  { id: 'import',  label: 'Importar OneDrive', icon: Cloud },
];

const INTEL_TABS = [
  { id: 'all',         label: 'Todos',        icon: null },
  { id: 'recommended', label: 'Recomendadas', icon: Sparkles },
  { id: 'forgotten',   label: 'Olvidadas',    icon: TrendingDown },
];

export default function Songs() {
  const { songs, events, addSong, updateSong, deleteSong, updateEvent } = useApp();
  const { recommendations, forgottenSongs } = useSongIntelligence();
  const { user } = useAuth();

  const canEdit   = canPerformAction(user?.role, 'songs', 'edit');
  const canCreate = canPerformAction(user?.role, 'songs', 'create');
  const canDelete = canPerformAction(user?.role, 'songs', 'delete');

  const [sectionTab, setSectionTab]   = useState('catalog');
  const [activeTab, setActiveTab]     = useState('all');
  const [query, setQuery]             = useState('');
  const [formModal, setFormModal]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [addedToEvent, setAddedToEvent] = useState({}); // songId → eventId

  // Upcoming events available to add songs to
  const upcomingEvents = useMemo(
    () => events.filter((e) => e.status === 'upcoming').sort((a, b) => new Date(a.date) - new Date(b.date)),
    [events]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return songs;
    return songs.filter(
      (s) =>
        s.title?.toLowerCase().includes(q) ||
        s.author?.toLowerCase().includes(q) ||
        s.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }, [songs, query]);

  async function handleSave(data) {
    try {
      if (formModal === 'create') {
        await addSong(data);
      } else {
        await updateSong(formModal.id, data);
      }
      setFormModal(null);
    } catch (err) {
      console.error('Error guardando canción:', err);
      alert('Error al guardar: ' + (err?.message ?? 'Error desconocido'));
    }
  }

  async function handleDelete() {
    try {
      await deleteSong(deleteTarget.id);
    } catch (err) {
      console.error('Error eliminando canción:', err);
    }
    setDeleteTarget(null);
  }

  async function handleAddToEvent(song, eventId) {
    const event = events.find((e) => e.id === eventId);
    if (!event) return;
    const currentSongs = Array.isArray(event.songs) ? event.songs : [];
    if (currentSongs.includes(song.id)) {
      setAddedToEvent((prev) => ({ ...prev, [song.id]: eventId }));
      return;
    }
    try {
      await updateEvent(event.id, { songs: [...currentSongs, song.id] });
      setAddedToEvent((prev) => ({ ...prev, [song.id]: eventId }));
      setTimeout(() => setAddedToEvent((prev) => { const n = { ...prev }; delete n[song.id]; return n; }), 2500);
    } catch (err) {
      alert('Error al agregar al culto: ' + (err?.message ?? ''));
    }
  }

  const showAddToEvent = activeTab === 'recommended' || activeTab === 'forgotten';

  const displayList =
    activeTab === 'recommended' ? recommendations :
    activeTab === 'forgotten'   ? forgottenSongs  :
    filtered;

  return (
    <div className="songs-page page-enter">

      {/* ── Header ── */}
      <div className="page-header page-header--flex">
        <div>
          <h1>Canciones</h1>
          <p>{songs.length} canciones en el repertorio</p>
        </div>
        {canCreate && sectionTab === 'catalog' && (
          <button className="btn btn-primary" onClick={() => setFormModal('create')}>
            <Plus size={16} />
            Nueva canción
          </button>
        )}
      </div>

      {/* ── Section tabs: Catálogo / Importar ── */}
      <div className="songs-tabs">
        {SECTION_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`songs-tab${sectionTab === id ? ' songs-tab--active' : ''}`}
            onClick={() => setSectionTab(id)}
          >
            {Icon && <Icon size={14} />}
            {label}
          </button>
        ))}
      </div>

      {sectionTab === 'import' && <OneDriveImporter />}

      {sectionTab === 'catalog' && (
        <>
          {/* ── Intel tabs ── */}
          <div className="songs-intel-tabs">
            {INTEL_TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={`songs-intel-tab${activeTab === id ? ' songs-intel-tab--active' : ''}`}
                onClick={() => setActiveTab(id)}
              >
                {Icon && <Icon size={13} />}
                {label}
                {id === 'forgotten' && forgottenSongs.length > 0 && (
                  <span className="songs-tab__badge">{forgottenSongs.length}</span>
                )}
              </button>
            ))}
          </div>

          {/* ── Search (only on 'all' tab) ── */}
          {activeTab === 'all' && (
            <div className="songs-search">
              <Search size={16} className="songs-search__icon" />
              <input
                type="text"
                className="songs-search__input"
                placeholder="Buscar por título, autor o etiqueta..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          )}

          {/* ── Tab context hint ── */}
          {activeTab === 'recommended' && (
            <p className="songs-intel-hint">
              <Sparkles size={13} /> Canciones que no se han usado recientemente y tienen buena frecuencia histórica.
              {upcomingEvents.length > 0 && ' Agrégalas directamente a un culto próximo.'}
            </p>
          )}
          {activeTab === 'forgotten' && (
            <p className="songs-intel-hint">
              <TrendingDown size={13} /> Canciones que llevan mucho tiempo sin usarse.
              {upcomingEvents.length > 0 && ' Considera recuperarlas en un próximo culto.'}
            </p>
          )}

          {/* ── Song grid ── */}
          {displayList.length === 0 ? (
            <div className="card empty-state">
              <Music2 size={36} className="empty-state-icon" />
              <p>
                {activeTab === 'recommended' ? 'No hay recomendaciones en este momento' :
                 activeTab === 'forgotten'   ? 'No hay canciones olvidadas' :
                 'No se encontraron canciones'}
              </p>
            </div>
          ) : (
            <div className="songs-grid stagger-children">
              {displayList.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onEdit={() => setFormModal(song)}
                  onDelete={() => setDeleteTarget(song)}
                  showAddToEvent={showAddToEvent}
                  upcomingEvents={upcomingEvents}
                  addedEventId={addedToEvent[song.id]}
                  onAddToEvent={(eventId) => handleAddToEvent(song, eventId)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Modals ── */}
      {formModal !== null && (
        <SongFormModal
          song={formModal === 'create' ? null : formModal}
          onSave={handleSave}
          onClose={() => setFormModal(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Eliminar canción"
          message={`¿Eliminar "${deleteTarget.title}"? Esta acción no se puede deshacer.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

// ── SongCard ──────────────────────────────────────────────────────────────────
function SongCard({ song, canEdit, canDelete, onEdit, onDelete, showAddToEvent, upcomingEvents = [], addedEventId, onAddToEvent }) {
  const { title, author, key, genre, timesUsed, tags = [] } = song;
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    if (!pickerOpen) return;
    function handleClick(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [pickerOpen]);

  return (
    <article className="song-card card">
      <div className="song-card__header">
        <div className="song-card__badges">
          {genre && <span className="badge badge-orange">{genre}</span>}
        </div>
        <div className="song-card__header-right">
          {key && <span className="badge badge-info">{key}</span>}
          {(canEdit || canDelete) && (
            <div className="song-card__actions">
              {canEdit && (
                <button
                  className="song-card__action-btn"
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  aria-label="Editar"
                >
                  <Pencil size={14} />
                </button>
              )}
              {canDelete && (
                <button
                  className="song-card__action-btn song-card__action-btn--danger"
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  aria-label="Eliminar"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="song-card__body">
        <h3 className="song-card__title">{title}</h3>
        {author && <p className="song-card__author">{author}</p>}
      </div>

      <div className="song-card__footer">
        <span className="song-card__meta">
          {timesUsed ? `${timesUsed} uso${timesUsed !== 1 ? 's' : ''}` : 'Sin registros'}
        </span>
        {tags.length > 0 && (
          <div className="song-card__tags">
            {tags.slice(0, 3).map((t) => (
              <span key={t} className="song-card__tag">#{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* ── Agregar a culto ── */}
      {showAddToEvent && upcomingEvents.length > 0 && (
        <div className="song-card__add-event" ref={pickerRef}>
          {addedEventId ? (
            <span className="song-card__added-badge">
              <Check size={12} /> Agregado
            </span>
          ) : (
            <>
              <button
                className="song-card__add-btn"
                onClick={() => upcomingEvents.length === 1
                  ? onAddToEvent(upcomingEvents[0].id)
                  : setPickerOpen((v) => !v)
                }
              >
                <CalendarPlus size={13} />
                Agregar a culto
              </button>
              {pickerOpen && (
                <div className="song-card__event-picker">
                  {upcomingEvents.map((ev) => (
                    <button
                      key={ev.id}
                      className="song-card__event-option"
                      onClick={() => { onAddToEvent(ev.id); setPickerOpen(false); }}
                    >
                      <span className="song-card__event-option-title">{ev.title}</span>
                      <span className="song-card__event-option-date">{ev.date}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </article>
  );
}
