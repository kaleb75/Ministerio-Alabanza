import { TrendingUp, TrendingDown } from 'lucide-react';
import './StatCard.css';

export default function StatCard({ value, label, sublabel, trend, icon: Icon, color = 'orange', size = 'md' }) {
  return (
    <div className={`stat-card stat-card--${size}`}>
      <div className="stat-card__top">
        {Icon && (
          <div className={`stat-card__icon stat-card__icon--${color}`}>
            <Icon size={18} />
          </div>
        )}
        {trend !== undefined && trend !== null && (
          <div className={`stat-card__trend stat-card__trend--${trend >= 0 ? 'up' : 'down'}`}>
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="stat-card__value">{value}</div>
      <div className="stat-card__label">{label}</div>
      {sublabel && <div className="stat-card__sublabel">{sublabel}</div>}
    </div>
  );
}
