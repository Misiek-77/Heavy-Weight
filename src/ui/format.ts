import type { WeightUnit } from '../domain/types';

const number = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 2 });
const whole = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 });
const dayFormat = new Intl.DateTimeFormat('pl-PL', { weekday: 'short', day: 'numeric', month: 'short' });
const dayYearFormat = new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
const longDayFormat = new Intl.DateTimeFormat('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });

const KG_PER_LB = 0.45359237;
let unit: WeightUnit = 'kg';

/** Sets the unit weights are shown and typed in. Called by the store whenever the setting changes. */
export const setWeightUnit = (next: WeightUnit) => {
  unit = next;
};
/** "kg" or "lb". */
export const weightUnit = () => unit;
/** Stored kilograms as a number in the display unit, unrounded. */
export const toUnit = (kg: number) => (unit === 'lb' ? kg / KG_PER_LB : kg);
/** A number typed in the display unit, as kilograms. */
export const fromUnit = (value: number) => (unit === 'lb' ? Math.round(value * KG_PER_LB * 10000) / 10000 : value);
/** Stored kilograms as the value to put in an input: pounds are rounded to 0.1 so they read back as typed. */
export const displayWeight = (kg: number) => (unit === 'lb' ? Math.round(toUnit(kg) * 10) / 10 : kg);
/** Smallest sensible jump when adding weight: 2.5 kg, or 5 lb. Returned in kilograms. */
export const weightStep = () => (unit === 'lb' ? 5 * KG_PER_LB : 2.5);

/** "62,5" — a plain number, no unit conversion (repetitions, seconds, centimetres). */
export const formatNumber = (n: number) => number.format(n);

/** Stored kilograms in the display unit: "62,5", or "137,8" in pounds. */
export const formatWeight = (kg: number) => number.format(displayWeight(kg));

/** A total of kilograms moved, in the display unit and without decimals: "4 520". */
export const formatVolume = (kg: number) => whole.format(toUnit(kg));

/** "4 520" */
export const formatWhole = (n: number) => whole.format(n);

/** "wt., 10 lis" for this year, "10 lis 2025" otherwise. */
export function formatDay(iso: string): string {
  const date = new Date(iso);
  return date.getFullYear() === new Date().getFullYear() ? dayFormat.format(date) : dayYearFormat.format(date);
}

export const formatLongDay = (date: Date) => longDayFormat.format(date);

/** "80 kg × 8" */
export const formatSet = (weight: number, reps: number) => `${formatWeight(weight)} ${unit} × ${reps}`;

/** A logged set: "80 kg × 8", or for a timed exercise "45 s" / "40 kg × 45 s". */
export function formatEntrySet(set: { weight: number; reps: number }, timed = false): string {
  if (!timed) return formatSet(set.weight, set.reps);
  return set.weight > 0 ? `${formatWeight(set.weight)} ${unit} × ${set.reps} s` : `${set.reps} s`;
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
