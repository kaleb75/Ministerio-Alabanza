import { Music2, FileText, File, Cloud, Archive, GitMerge } from 'lucide-react';
import './SongCatalogStats.css';

function StatCard({ icon: Icon, iconColor, value, label, loading }) {
  if (loading) {
    return (
      <div className="stat-card stat-card--loading">
        <div className="stat-card__icon-skeleton" />
        <div className="stat-card__value-skeleton" />
        <div className="stat-card__label-skeleton" />
      </div>
    );
  }
  return (
    <div className="stat-card">
      <div className="stat-card__icon" style={{ background: `${iconColor}1A` }}>
        <Icon size={20} color={iconColor} />
      </div>
      <span className="stat-card__value">{value ?? 0}</span>
      <span className="stat-card__label">{label}</span>
    </div>
  );
}

export default function SongCatalogStats({ stats = {}, isLoading = false }) {
  const {
    total = 0,
    withLyrics = 0,
    withChords = 0,
    withSheetMusic = 0,
    duplicatesResolved = 0,
    newFromOneDrive = 0,
    legacySongs = 0,
  } = stats || {};

  return (
    <div className="catalog-stats">
      <div className="catalog-stats__grid catalog-stats__grid--main">
        <StatCard icon={Music2}    iconColor="#0A84FF" value={total}         label="Total canciones"  loading={isLoading} />
        <StatCard icon={FileText}  iconColor="#FF9500" value={withChords}    label="Con acordes"      loading={isLoading} />
        <StatCard icon={File}      iconColor="#BF5AF2" value={withSheetMusic} label="Con partitura"   loading={isLoading} />
        <StatCard icon={File}      iconColor="#30D158" value={withLyrics}    label="Solo letra"       loading={isLoading} />
      </div>

      <div className="catalog-stats__divider">
        <span className="catalog-stats__divider-label">Sincronización</span>
      </div>

      <div className="catalog-stats__grid catalog-stats__grid--sync">
        <StatCard icon={Cloud}    iconColor="#32ADE6" value={newFromOneDrive}    label="Desde OneDrive"      loading={isLoading} />
        <StatCard icon={Archive}  iconColor="#636366" value={legacySongs}        label="Catálogo existente"  loading={isLoading} />
        <StatCard icon={GitMerge} iconColor="#FF9500" value={duplicatesResolved} label="Duplicados resueltos" loading={isLoading} />
      </div>
    </div>
  );
}
