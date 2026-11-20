import { formatDay, formatNumber } from './format';

const W = 320;
const H = 150;
const PAD = { top: 16, right: 4, bottom: 24, left: 4 };

/** Bars for successive periods (weeks), the latest one highlighted. Zero periods leave a visible gap. */
export function BarChart({ points, unit }: { points: { date: string; value: number }[]; unit: string }) {
  if (points.length === 0) return null;
  const max = Math.max(1, ...points.map((p) => p.value));
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const slot = innerW / points.length;
  const width = Math.max(2, slot * 0.7);
  const last = points.length - 1;
  const label = `Wykres słupkowy: ${points.map((p) => `${formatDay(p.date)} ${formatNumber(Math.round(p.value))} ${unit}`).join(', ')}`;

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      <line x1={PAD.left} x2={W - PAD.right} y1={H - PAD.bottom} y2={H - PAD.bottom} stroke="var(--line)" />
      {points.map((p, i) => {
        const h = (p.value / max) * innerH;
        return (
          <rect
            key={p.date}
            x={PAD.left + i * slot + (slot - width) / 2}
            y={H - PAD.bottom - h}
            width={width}
            height={h}
            rx={3}
            fill={i === last ? 'var(--accent)' : 'var(--ink)'}
            opacity={i === last ? 1 : 0.75}
          />
        );
      })}
      <text x={PAD.left} y={H - 6}>
        {formatDay(points[0].date)}
      </text>
      <text x={W - PAD.right} y={H - 6} textAnchor="end">
        {formatDay(points[last].date)}
      </text>
      <text x={W - PAD.right} y={PAD.top - 4} textAnchor="end">
        {formatNumber(Math.round(max))} {unit}
      </text>
    </svg>
  );
}
