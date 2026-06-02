import { useState, useEffect } from 'react';
import './DonutChart.css';

export default function DonutChart({
  data = [],
  size = 120,
  strokeWidth = 18,
  centerLabel,
  centerValue,
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 100); return () => clearTimeout(t); }, []);

  const r   = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const cx  = size / 2;
  const cy  = size / 2;

  const total = data.reduce((s, d) => s + (d.value || 0), 0) || 1;
  let offset = 0;

  return (
    <div className="donut">
      <div className="donut__wrap" style={{ width: size, height: size }}>
        <svg
          className="donut__svg"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background track */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg-tertiary)" strokeWidth={strokeWidth} />
          {data.map((seg, i) => {
            const pct  = seg.value / total;
            const dash = mounted ? pct * circ : 0;
            const gap  = circ - dash;
            const el   = (
              <circle
                key={i}
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={-offset}
                className="donut__segment"
                strokeLinecap="butt"
              />
            );
            offset += pct * circ;
            return el;
          })}
        </svg>
        {(centerValue !== undefined || centerLabel) && (
          <div className="donut__center">
            {centerValue !== undefined && <span className="donut__center-val">{centerValue}</span>}
            {centerLabel && <span className="donut__center-lbl">{centerLabel}</span>}
          </div>
        )}
      </div>
      {data.length > 0 && (
        <div className="donut__legend">
          {data.map((seg, i) => (
            <div key={i} className="donut__legend-row">
              <span className="donut__legend-dot" style={{ background: seg.color }} />
              <span className="donut__legend-label">{seg.label}</span>
              <span className="donut__legend-pct">{Math.round((seg.value / total) * 100)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
