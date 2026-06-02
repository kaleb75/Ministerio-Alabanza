import { useState, useEffect } from 'react';
import { Search, X, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { searchSongs, SORT_OPTIONS } from '../../utils/songSearch';
import { WORSHIP_TAGS } from '../../utils/songTags';
import './SongSearch.css';

const FORMAT_FILTERS = [
  { value: null, label: 'Todos' },
  { value: 'lyrics', label: 'Letra' },
  { value: 'chords', label: 'Acordes' },
  { value: 'sheetMusic', label: 'Partitura' },
];

const SORT_LABELS = {
  [SORT_OPTIONS.ALPHA]: 'A-Z',
  [SORT_OPTIONS.RECENT]: 'Recientes',
  [SORT_OPTIONS.MOST_USED]: 'Más usados',
  [SORT_OPTIONS.LEAST_USED]: 'Menos usados',
  [SORT_OPTIONS.NEWEST]: 'Más nuevos',
};

const VISIBLE_TAGS = WORSHIP_TAGS.slice(0, 8);

export default function SongSearch({ songs = [], onResults, initialFilters = {} }) {
  const [query, setQuery] = useState(initialFilters.query || '');
  const [format, setFormat] = useState(initialFilters.format || null);
  const [selectedTags, setSelectedTags] = useState(initialFilters.tags || []);
  const [sort, setSort] = useState(initialFilters.sort || SORT_OPTIONS.ALPHA);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const results = searchSongs(songs, query, { tags: selectedTags, format, sort });
    onResults?.(results);
  }, [songs, query, format, selectedTags, sort]);

  function toggleTag(tagId) {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  }

  function clearAll() {
    setQuery('');
    setFormat(null);
    setSelectedTags([]);
    setSort(SORT_OPTIONS.ALPHA);
  }

  const hasActiveFilters = query || format || selectedTags.length > 0 || sort !== SORT_OPTIONS.ALPHA;
  const results = searchSongs(songs, query, { tags: selectedTags, format, sort });

  return (
    <div className="song-search">
      <div className="song-search__input-row">
        <div className="song-search__input-wrap">
          <Search size={16} className="song-search__icon" />
          <input
            type="text"
            className="song-search__input"
            placeholder="Buscar por título, autor o etiqueta..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className="song-search__clear-btn" onClick={() => setQuery('')} aria-label="Limpiar búsqueda">
              <X size={14} />
            </button>
          )}
        </div>

        <button
          className={`song-search__filter-toggle ${showFilters ? 'song-search__filter-toggle--active' : ''}`}
          onClick={() => setShowFilters((v) => !v)}
          aria-label="Mostrar filtros"
        >
          <SlidersHorizontal size={16} />
          <span>Filtros</span>
        </button>
      </div>

      {showFilters && (
        <div className="song-search__controls">
          <div className="song-search__section">
            <span className="song-search__section-label">Formato</span>
            <div className="song-search__format-pills">
              {FORMAT_FILTERS.map((f) => (
                <button
                  key={String(f.value)}
                  className={`song-search__pill ${format === f.value ? 'song-search__pill--active' : ''}`}
                  onClick={() => setFormat(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="song-search__section">
            <span className="song-search__section-label">Etiquetas</span>
            <div className="song-search__tags">
              {VISIBLE_TAGS.map((tag) => (
                <button
                  key={tag.id}
                  className={`song-search__tag ${selectedTags.includes(tag.id) ? 'song-search__tag--active' : ''}`}
                  style={selectedTags.includes(tag.id) ? { borderColor: tag.color, color: tag.color } : {}}
                  onClick={() => toggleTag(tag.id)}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          <div className="song-search__section song-search__section--row">
            <span className="song-search__section-label">Ordenar</span>
            <div className="song-search__sort-wrap">
              <select
                className="song-search__sort"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                {Object.entries(SORT_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="song-search__sort-icon" />
            </div>
          </div>
        </div>
      )}

      {(hasActiveFilters || selectedTags.length > 0) && (
        <div className="song-search__active-filters">
          {format && (
            <span className="song-search__filter-chip">
              {FORMAT_FILTERS.find((f) => f.value === format)?.label}
              <button onClick={() => setFormat(null)}><X size={10} /></button>
            </span>
          )}
          {selectedTags.map((tagId) => {
            const tag = WORSHIP_TAGS.find((t) => t.id === tagId);
            return (
              <span key={tagId} className="song-search__filter-chip">
                {tag?.label || tagId}
                <button onClick={() => toggleTag(tagId)}><X size={10} /></button>
              </span>
            );
          })}
          {hasActiveFilters && (
            <button className="song-search__clear-all" onClick={clearAll}>
              Limpiar todo
            </button>
          )}
        </div>
      )}

      <p className="song-search__results-count">
        {results.length} {results.length === 1 ? 'canción encontrada' : 'canciones encontradas'}
      </p>
    </div>
  );
}
