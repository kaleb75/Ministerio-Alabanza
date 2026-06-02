import { useMemo } from 'react';
import dayjs from 'dayjs';
import './HeatmapChart.css';

const MONTH_ABBR = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const DAY_LABELS = ['D','L','M','X','J','V','S'];

function levelClass(count) {
  if (!count) return '';
  if (count === 1) return 'heatmap__cell--l1';
  if (count === 2) return 'heatmap__cell--l2';
  return 'heatmap__cell--l3';
}

export default function HeatmapChart({ data = [], title }) {
  const { weeks, monthLabels } = useMemo(() => {
    const dateMap = {};
    data.forEach(d => { if (d.date) dateMap[d.date] = d.count || 0; });

    const start = dayjs().subtract(363, 'day');
    // Build 52 columns, each 7 days
    const cols = [];
    const months = [];
    let prevMonth = -1;

    for (let w = 0; w < 52; w++) {
      const col = [];
      for (let d = 0; d < 7; d++) {
        const idx = w * 7 + d;
        const day = start.add(idx, 'day');
        col.push({ date: day.format('YYYY-MM-DD'), count: dateMap[day.format('YYYY-MM-DD')] || 0 });
      }
      cols.push(col);

      // Month label at column start
      const firstDay = start.add(w * 7, 'day');
      const m = firstDay.month();
      if (m !== prevMonth) {
        months.push({ week: w, label: MONTH_ABBR[m] });
        prevMonth = m;
      } else {
        months.push(null);
      }
    }

    return { weeks: cols, monthLabels: months };
  }, [data]);

  return (
    <div className="heatmap">
      {title && <div className="heatmap__title">{title}</div>}
      <div className="heatmap__body">
        {/* Day labels */}
        <div className="heatmap__days">
          {DAY_LABELS.map((l, i) => (
            <div key={i} className="heatmap__day-lbl">{i % 2 === 0 ? l : ''}</div>
          ))}
        </div>

        {/* Grid */}
        <div className="heatmap__grid-wrap">
          {/* Month row */}
          <div className="heatmap__month-row">
            {monthLabels.map((m, i) => (
              <div key={i} className="heatmap__month-cell">
                {m && <span className="heatmap__month-lbl">{m.label}</span>}
              </div>
            ))}
          </div>
          {/* Week columns */}
          <div className="heatmap__weeks">
            {weeks.map((col, wi) => (
              <div key={wi} className="heatmap__week-col">
                {col.map((cell, di) => (
                  <div
                    key={di}
                    className={`heatmap__cell ${levelClass(cell.count)}`}
                    title={`${cell.date}: ${cell.count} culto${cell.count !== 1 ? 's' : ''}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="heatmap__legend">
        <span className="heatmap__legend-lbl">Menos</span>
        {['','heatmap__cell--l1','heatmap__cell--l2','heatmap__cell--l3'].map((cls, i) => (
          <div key={i} className={`heatmap__legend-cell ${cls}`} />
        ))}
        <span className="heatmap__legend-lbl">Más</span>
      </div>
    </div>
  );
}
