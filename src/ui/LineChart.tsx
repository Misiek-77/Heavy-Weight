import { formatDay, formatNumber } from './format';

const W = 320;
const H = 150;
const PAD = { top: 16, right: 12, bottom: 24, left: 12 };

/** Minimal line chart of a value over successive workouts. */
export function LineChart({ points, unit }: { points: { date: string; value: number }[]; unit: string }) {
  if (points.length === 0) return null;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  // A flat series (or a single point) sits in the middle rather than dividing by zero.
  const y = (v: number) => PAD.top + (span === 0 ? innerH / 2 : (1 - (v - min) / span) * innerH);
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' ');
  const last = points.length - 1;
  const label = `Wykres: od ${formatNumber(points[0].value)} ${unit} (${formatDay(points[0].date)}) do ${formatNumber(
    points[last].value,
  )} ${unit} (${formatDay(points[last].date)})`;

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      <line x1={PAD.left} x2={W - PAD.right} y1={H - PAD.bottom} y2={H - PAD.bottom} stroke="var(--line)" />
      <path d={path} fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.value)} r={i === last ? 5 : 2.5} fill={i === last ? 'var(--accent)' : 'var(--ink)'} stroke={i === last ? 'var(--ink)' : 'none'} strokeWidth="1.5" />
      ))}
      <text x={PAD.left} y={H - 6}>
        {formatDay(points[0].date)}
      </text>
      {points.length > 1 && (
        <text x={W - PAD.right} y={H - 6} textAnchor="end">
          {formatDay(points[last].date)}
        </text>
      )}
    </svg>
  );
}
