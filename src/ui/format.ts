const number = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 2 });
const whole = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 });
const dayFormat = new Intl.DateTimeFormat('pl-PL', { weekday: 'short', day: 'numeric', month: 'short' });
const dayYearFormat = new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
const longDayFormat = new Intl.DateTimeFormat('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });

/** "62,5" */
export const formatWeight = (kg: number) => number.format(kg);

/** "4 520" */
export const formatWhole = (n: number) => whole.format(n);

/** "wt., 10 lis" for this year, "10 lis 2025" otherwise. */
export function formatDay(iso: string): string {
  const date = new Date(iso);
  return date.getFullYear() === new Date().getFullYear() ? dayFormat.format(date) : dayYearFormat.format(date);
}

export const formatLongDay = (date: Date) => longDayFormat.format(date);

/** "80 kg × 8" */
export const formatSet = (weight: number, reps: number) => `${formatWeight(weight)} kg × ${reps}`;

/** A logged set: "80 kg × 8", or for a timed exercise "45 s" / "40 kg × 45 s". */
export function formatEntrySet(set: { weight: number; reps: number }, timed = false): string {
  if (!timed) return formatSet(set.weight, set.reps);
  return set.weight > 0 ? `${formatWeight(set.weight)} kg × ${set.reps} s` : `${set.reps} s`;
}

/** Target range: "8–10 powt.", "10 powt.", "30–60 s"; empty when there is no target. */
export function formatRange(min: number | undefined, max: number | undefined, timed = false): string {
  const unit = timed ? 's' : 'powt.';
  if (min && max && min !== max) return `${min}–${max} ${unit}`;
  const one = max ?? min;
  return one ? `${one} ${unit}` : '';
}

/** "45 min" or "1 h 05 min" */
export function formatDuration(ms: number): string {
  const minutes = Math.max(0, Math.round(ms / 60000));
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min`;
}

/** "1:30" or "1:02:05" */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const pad = (n: number) => String(n).padStart(2, '0');
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
}

/** Polish plural: plural(5, 'ćwiczenie', 'ćwiczenia', 'ćwiczeń') → "5 ćwiczeń". */
export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  const word = n === 1 ? one : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? few : many;
  return `${n} ${word}`;
}

/** Lowercased, without diacritics, for forgiving search. */
export function searchKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}
