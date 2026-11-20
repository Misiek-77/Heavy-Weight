import { finishedWorkouts, workoutVolume } from './stats';
import { MUSCLE_GROUPS, type Exercise, type MuscleGroup, type Workout } from './types';

/** Local calendar day as "2026-03-09". Days and weeks follow the device's time zone, not UTC. */
export function dayKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Midnight at the start of the Monday-based week that contains `date`. */
export function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
const startedOn = (w: Workout) => new Date(w.startedAt);

export interface PeriodTotals {
  workouts: number;
  volume: number;
}

function totals(workouts: Workout[], from: Date, timedIds: ReadonlySet<string>): PeriodTotals {
  const inPeriod = workouts.filter((w) => startedOn(w) >= from);
  return { workouts: inPeriod.length, volume: inPeriod.reduce((sum, w) => sum + workoutVolume(w, timedIds), 0) };
}

export interface Summary {
  week: PeriodTotals;
  month: PeriodTotals;
  allTime: PeriodTotals;
  /** Weeks in a row with at least one workout, counted back from this week (or last week if this one is still empty). */
  weekStreak: number;
}

export function summarize(workouts: Workout[], now: Date, timedIds: ReadonlySet<string> = new Set()): Summary {
  const finished = finishedWorkouts(workouts);
  const weeks = new Set(finished.map((w) => dayKey(startOfWeek(startedOn(w)))));
  let cursor = startOfWeek(now);
  // A week that has only just begun does not break the streak.
  if (!weeks.has(dayKey(cursor))) cursor = addDays(cursor, -7);
  let weekStreak = 0;
  while (weeks.has(dayKey(cursor))) {
    weekStreak++;
    cursor = addDays(cursor, -7);
  }
  return {
    week: totals(finished, startOfWeek(now), timedIds),
    month: totals(finished, startOfMonth(now), timedIds),
    allTime: totals(finished, new Date(0), timedIds),
    weekStreak,
  };
}

/** Day keys of every day with a finished workout. */
export function trainingDays(workouts: Workout[]): Set<string> {
  return new Set(finishedWorkouts(workouts).map((w) => dayKey(startedOn(w))));
}

export interface CalendarDay {
  key: string;
  day: number;
  /** False for the days of neighbouring months that fill the first and last week. */
  inMonth: boolean;
}

/** Whole Monday-to-Sunday weeks covering the month `monthOffset` months away from `now`. */
export function monthGrid(now: Date, monthOffset: number): { first: Date; weeks: CalendarDay[][] } {
  const first = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const weeks: CalendarDay[][] = [];
  for (let day = startOfWeek(first); ; ) {
    const week: CalendarDay[] = [];
    for (let i = 0; i < 7; i++, day = addDays(day, 1)) {
      week.push({ key: dayKey(day), day: day.getDate(), inMonth: day.getMonth() === first.getMonth() });
    }
    weeks.push(week);
    if (day.getMonth() !== first.getMonth() || day.getFullYear() !== first.getFullYear()) break;
  }
  return { first, weeks };
}

export interface MuscleLoad {
  group: MuscleGroup;
  /** Done working sets (warm-ups excluded). */
  sets: number;
  volume: number;
}

/** Work per muscle group over the last `days` days, in the fixed order of MUSCLE_GROUPS. */
export function muscleLoad(workouts: Workout[], exercises: Exercise[], now: Date, days: number): MuscleLoad[] {
  const groupOf = new Map(exercises.map((e) => [e.id, e.muscleGroup]));
  const timed = new Set(exercises.filter((e) => e.timed).map((e) => e.id));
  const from = addDays(now, -days + 1);
  const load = new Map<MuscleGroup, MuscleLoad>(MUSCLE_GROUPS.map((group) => [group, { group, sets: 0, volume: 0 }]));
  for (const w of finishedWorkouts(workouts)) {
    if (startedOn(w) < from) continue;
    for (const entry of w.entries) {
      const item = load.get(groupOf.get(entry.exerciseId) ?? 'inne')!;
      for (const s of entry.sets) {
        if (!s.done || s.kind === 'warmup') continue;
        item.sets++;
        if (!timed.has(entry.exerciseId)) item.volume += s.weight * s.reps;
      }
    }
  }
  return [...load.values()];
}

export interface WeekLoad {
  /** Monday the week starts on, as a day key. */
  week: string;
  /** Done working sets (warm-ups excluded). */
  sets: number;
  /** Kilograms moved in those sets; timed exercises count no weight. */
  volume: number;
}

/**
 * Work done in each of the last `weeks` Monday-based weeks, oldest first, for one muscle group or (with
 * `group` null) for all of them. Weeks without training are included with zeros, so gaps show as gaps.
 */
export function weeklyLoad(workouts: Workout[], exercises: Exercise[], now: Date, weeks: number, group: MuscleGroup | null): WeekLoad[] {
  const groupOf = new Map(exercises.map((e) => [e.id, e.muscleGroup]));
  const timed = new Set(exercises.filter((e) => e.timed).map((e) => e.id));
  const thisWeek = startOfWeek(now);
  const rows = Array.from({ length: weeks }, (_, i) => ({ week: dayKey(addDays(thisWeek, (i - weeks + 1) * 7)), sets: 0, volume: 0 }));
  const byWeek = new Map(rows.map((r) => [r.week, r]));
  for (const w of finishedWorkouts(workouts)) {
    const row = byWeek.get(dayKey(startOfWeek(startedOn(w))));
    if (!row) continue;
    for (const entry of w.entries) {
      if (group && (groupOf.get(entry.exerciseId) ?? 'inne') !== group) continue;
      for (const s of entry.sets) {
        if (!s.done || s.kind === 'warmup') continue;
        row.sets++;
        if (!timed.has(entry.exerciseId)) row.volume += s.weight * s.reps;
      }
    }
  }
  return rows;
}
