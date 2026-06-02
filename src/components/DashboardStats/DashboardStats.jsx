import './DashboardStats.css';

export default function DashboardStats({ icon: Icon, label, value, variant = 'default', sublabel }) {
  return (
    <div className={`stat-card card stat-card--${variant}`}>
      <div className="stat-card__icon">
        <Icon size={20} />
      </div>
      <div className="stat-card__body">
        <span className="stat-card__value stat-number">{value}</span>
        <span className="stat-card__label">{label}</span>
        {sublabel && <span className="stat-card__sublabel">{sublabel}</span>}
      </div>
    </div>
  );
}
