import { useState, useEffect, useRef } from 'react';
import './MiniLineChart.css';

function smoothPath(points) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    d += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  return d;
}

export default function MiniLineChart({ data = [], color = 'var(--info)', height = 60, showArea = true }) {
  const pathRef = useRef(null);
  const [len, setLen] = useState(0);
  const [mounted, setMounted] = useState(false);

  const W = 300;
  const H = height;
  const PAD = 4;

  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data, min + 1);
  const range = max - min;

  const points = data.map((v, i) => ({
    x: PAD + (i / (data.length - 1)) * (W - PAD * 2),
    y: PAD + (1 - (v - min) / range) * (H - PAD * 2),
  }));

  const linePath = smoothPath(points);
  const areaPath = linePath
    + ` L ${points[points.length - 1].x} ${H} L ${points[0].x} ${H} Z`;

  useEffect(() => {
    if (pathRef.current) {
      const l = pathRef.current.getTotalLength();
      setLen(l);
      setTimeout(() => setMounted(true), 50);
    }
  }, [data]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="mini-line"
      preserveAspectRatio="none"
    >
      {showArea && (
        <path d={areaPath} fill={color} className="mini-line__area" />
      )}
      <path
        ref={pathRef}
        d={linePath}
        stroke={color}
        className="mini-line__path"
        strokeDasharray={len || 10000}
        strokeDashoffset={mounted ? 0 : (len || 10000)}
      />
    </svg>
  );
}
