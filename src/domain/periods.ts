import { recordEvents, type RecordEvent } from './insights';
import { finishedWorkouts, workoutVolume } from './stats';
import { startOfWeek } from './summary';
import { MUSCLE_GROUPS, type Exercise, type MuscleGroup, type Workout } from './types';

export const PERIOD_KINDS = ['week', 'month', 'year'] as const;
export type PeriodKind = (typeof PERIOD_KINDS)[number];

export interface Period {
  kind: PeriodKind;
  /** First moment of the period, local time. */
  from: Date;
  /** First moment after the period. */
  to: Date;
}

/** The week (from Monday), month or year containing `now`, moved `offset` periods back (negative) or forward. */
export function periodAt(kind: PeriodKind, now: Date, offset = 0): Period {
  if (kind === 'week') {
    const monday = startOfWeek(now);
    const from = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + offset * 7);
    return { kind, from, to: new Date(from.getFullYear(), from.getMonth(), from.getDate() + 7) };
  }
  if (kind === 'month') {
    const from = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    return { kind, from, to: new Date(from.getFullYear(), from.getMonth() + 1, 1) };
  }
  const from = new Date(now.getFullYear() + offset, 0, 1);
  return { kind, from, to: new Date(from.getFullYear() + 1, 0, 1) };
}

export interface PeriodSummary {
  workouts: number;
  /** Days with at least one finished workout. */
  days: number;
  /** Total time from start to finish of every workout, in milliseconds. */
  duration: number;
  /** Kilograms moved in working sets (see workoutVolume). */
  volume: number;
  /** Done working sets; warm-ups excluded. */
  sets: number;
  /** Repetitions in those sets; timed exercises count seconds, not repetitions, so they are left out. */
  reps: number;
  /** Working sets per muscle group, in the fixed order of MUSCLE_GROUPS. */
  setsByGroup: { group: MuscleGroup; sets: number }[];
  /** Exercises with the most working sets, most first (ties by name), at most five. */
  topExercises: { exerciseId: string; sets: number }[];
  /** Personal bests beaten during the period, newest first. */
  records: RecordEvent[];
}

const inPeriod = (w: Workout, p: Period) => {
  const t = new Date(w.startedAt);
  return t >= p.from && t < p.to;
};

/** Everything the summary screen shows for one period. */
export function summarizePeriod(workouts: Workout[], exercises: Exercise[], period: Period): PeriodSummary {
  const byId = new Map(exercises.map((e) => [e.id, e]));
  const timedIds = new Set(exercises.filter((e) => e.timed).map((e) => e.id));
  const inside = finishedWorkouts(workouts).filter((w) => inPeriod(w, period));
  const groups = new Map<MuscleGroup, number>(MUSCLE_GROUPS.map((g) => [g, 0]));
  const perExercise = new Map<string, number>();
  const days = new Set<string>();
  let duration = 0;
  let sets = 0;
  let reps = 0;

  for (const w of inside) {
    const start = new Date(w.startedAt);
    days.add(`${start.getFullYear()}-${start.getMonth()}-${start.getDate()}`);
    duration += Math.max(0, Date.parse(w.finishedAt!) - start.getTime());
    for (const entry of w.entries) {
      const working = entry.sets.filter((s) => s.done && s.kind !== 'warmup');
      if (working.length === 0) continue;
      sets += working.length;
      if (!timedIds.has(entry.exerciseId)) reps += working.reduce((n, s) => n + s.reps, 0);
      const group = byId.get(entry.exerciseId)?.muscleGroup ?? 'inne';
      groups.set(group, groups.get(group)! + working.length);
      perExercise.set(entry.exerciseId, (perExercise.get(entry.exerciseId) ?? 0) + working.length);
    }
  }

  const name = (id: string) => byId.get(id)?.name ?? id;
  return {
    workouts: inside.length,
    days: days.size,
    duration,
    volume: inside.reduce((sum, w) => sum + workoutVolume(w, timedIds), 0),
    sets,
    reps,
    setsByGroup: MUSCLE_GROUPS.map((group) => ({ group, sets: groups.get(group)! })),
    topExercises: [...perExercise]
      .map(([exerciseId, n]) => ({ exerciseId, sets: n }))
      .sort((a, b) => b.sets - a.sets || name(a.exerciseId).localeCompare(name(b.exerciseId), 'pl'))
      .slice(0, 5),
    // Records need the whole history to know what was beaten; only the moment of beating must fall inside.
    records: recordEvents(workouts, timedIds).filter((e) => {
      const t = new Date(e.date);
      return t >= period.from && t < period.to;
    }),
  };
}
