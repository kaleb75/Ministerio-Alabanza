import { useState, useMemo } from 'react';
import {
  Music2, Plus, Pencil, Trash2, Sparkles, TrendingDown,
  Search, Cloud,
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
  const { songs, addSong, updateSong, deleteSong } = useApp();
  const { recommendations, forgottenSongs } = useSongIntelligence();
  const { user } = useAuth();

  const canEdit   = canPerformAction(user?.role, 'songs', 'edit');
  const canCreate = canPerformAction(user?.role, 'songs', 'create');
  const canDelete = canPerformAction(user?.role, 'songs', 'delete');

  const [sectionTab, setSectionTab]   = useState('catalog');
  const [activeTab, setActiveTab]     = useState('all');
  const [query, setQuery]             = useState('');
  const [formModal, setFormModal]     = useState(null); // null | 'create' | song
  const [deleteTarget, setDeleteTarget] = useState(null);

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
            {Icon && <Icon size={13} style={{ marginRight: 4 }} />}
            {label}
          </button>
        ))}
      </div>

      {/* ── Import tab ── */}
      {sectionTab === 'import' && (
        <OneDriveImporter />
      )}

      {/* ── Catalog tab ── */}
      {sectionTab === 'catalog' && (
        <>
          {/* Intel tabs */}
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

          {/* Search (all tab only) */}
          {activeTab === 'all' && (
            <div className="songs-search-bar">
              <Search size={15} className="songs-search-bar__icon" />
              <input
                className="songs-search-bar__input"
                placeholder="Buscar por título, autor o etiqueta..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          )}

          {/* Song grid */}
          {displayList.length === 0 ? (
            <div className="card empty-state">
              <Music2 size={36} className="empty-state-icon" />
              <p>{activeTab === 'all' && query ? `Sin resultados para "${query}"` : 'Sin canciones'}</p>
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

function SongCard({ song, canEdit, canDelete, onEdit, onDelete }) {
  const { title, author, key, genre, timesUsed, tags = [] } = song;

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
    </article>
  );
}
