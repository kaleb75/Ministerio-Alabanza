import { useState, useEffect } from 'react';
import './MiniBarChart.css';

export default function MiniBarChart({ data = [], title, max, unit = '', showValues = true }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 50); return () => clearTimeout(t); }, []);

  const peak = max ?? Math.max(...data.map(d => d.value), 1);

  return (
    <div className="mini-bar">
      {title && <div className="mini-bar__title">{title}</div>}
      {data.map((item, i) => (
        <div key={i} className="mini-bar__row">
          <span className="mini-bar__label" title={item.label}>{item.label}</span>
          <div className="mini-bar__track">
            <div
              className="mini-bar__fill"
              style={{
                width:      mounted ? `${Math.round((item.value / peak) * 100)}%` : '0%',
                background: item.color || 'var(--accent-orange)',
              }}
            />
          </div>
          {showValues && (
            <span className="mini-bar__val">{item.value}{unit}</span>
          )}
        </div>
      ))}
    </div>
  );
}
