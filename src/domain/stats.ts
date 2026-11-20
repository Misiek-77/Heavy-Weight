import type { Workout, WorkoutSet } from './types';

/** Estimated one-rep max (Epley). */
export function epley1RM(weight: number, reps: number): number {
  if (reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

const doneSets = (sets: WorkoutSet[]) => sets.filter((s) => s.done);

/** Done sets of one exercise in a workout (an exercise may appear more than once). */
function setsFor(w: Workout, exerciseId: string): WorkoutSet[] {
  return w.entries.filter((e) => e.exerciseId === exerciseId).flatMap((e) => doneSets(e.sets));
}

/** Done sets that count towards records and progress: everything except warm-ups. */
function workingSetsFor(w: Workout, exerciseId: string): WorkoutSet[] {
  return setsFor(w, exerciseId).filter((s) => s.kind !== 'warmup');
}

const volume = (sets: WorkoutSet[]) => sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
const best1RM = (sets: WorkoutSet[]) => Math.max(0, ...sets.map((s) => epley1RM(s.weight, s.reps)));

type Ids = ReadonlySet<string>;
const NONE: Ids = new Set();

/**
 * Kilograms moved in working sets. Warm-ups are left out, as everywhere in progress and records, and so are
 * timed exercises, whose sets count seconds rather than repetitions.
 */
export function workoutVolume(w: Workout, timedIds: Ids = NONE): number {
  return volume(
    w.entries.filter((e) => !timedIds.has(e.exerciseId)).flatMap((e) => doneSets(e.sets).filter((s) => s.kind !== 'warmup')),
  );
}

/** Finished workouts, newest first. */
export function finishedWorkouts(workouts: Workout[]): Workout[] {
  return workouts.filter((w) => w.finishedAt).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

/** Done sets of the exercise from the most recent finished workout that included it. */
export function lastPerformance(workouts: Workout[], exerciseId: string): WorkoutSet[] {
  for (const w of finishedWorkouts(workouts)) {
    const sets = setsFor(w, exerciseId);
    if (sets.length) return sets;
  }
  return [];
}

export interface ExerciseRecords {
  maxWeight: { weight: number; reps: number; date: string } | null;
  best1RM: { value: number; date: string } | null;
  maxVolume: { value: number; date: string } | null;
  /** Most repetitions in one set; for timed exercises, the longest hold in seconds. */
  longest: { reps: number; weight: number; date: string } | null;
}

export function exerciseRecords(workouts: Workout[], exerciseId: string): ExerciseRecords {
  const r: ExerciseRecords = { maxWeight: null, best1RM: null, maxVolume: null, longest: null };
  // Oldest first, so the earliest date wins a tie.
  for (const w of finishedWorkouts(workouts).reverse()) {
    const sets = workingSetsFor(w, exerciseId);
    if (!sets.length) continue;
    const date = w.startedAt;
    for (const s of sets) {
      const m = r.maxWeight;
      if (!m || s.weight > m.weight || (s.weight === m.weight && s.reps > m.reps)) {
        r.maxWeight = { weight: s.weight, reps: s.reps, date };
      }
      if (!r.longest || s.reps > r.longest.reps) r.longest = { reps: s.reps, weight: s.weight, date };
    }
    const orm = best1RM(sets);
    if (!r.best1RM || orm > r.best1RM.value) r.best1RM = { value: orm, date };
    const vol = volume(sets);
    if (!r.maxVolume || vol > r.maxVolume.value) r.maxVolume = { value: vol, date };
  }
  return r;
}

/** Best estimated 1RM per finished workout (longest hold for a timed exercise), oldest first. */
export function progressSeries(workouts: Workout[], exerciseId: string, timed = false): { date: string; value: number }[] {
  return finishedWorkouts(workouts)
    .reverse()
    .map((w) => ({ w, sets: workingSetsFor(w, exerciseId) }))
    .filter((x) => x.sets.length)
    .map((x) => ({ date: x.w.startedAt, value: timed ? Math.max(...x.sets.map((s) => s.reps)) : best1RM(x.sets) }));
}

/** Exercises in `workout` whose best estimated 1RM beats everything in `earlier`. */
export function newRecordExerciseIds(workout: Workout, earlier: Workout[], timedIds: Ids = NONE): string[] {
  const others = earlier.filter((w) => w.id !== workout.id);
  const ids = [...new Set(workout.entries.map((e) => e.exerciseId))];
  return ids.filter((id) => {
    if (timedIds.has(id)) {
      const longest = Math.max(0, ...workingSetsFor(workout, id).map((s) => s.reps));
      return longest > (exerciseRecords(others, id).longest?.reps ?? 0);
    }
    const now = best1RM(workingSetsFor(workout, id));
    return now > 0 && now > (exerciseRecords(others, id).best1RM?.value ?? 0);
  });
}

export type LiveRecord = 'weight' | 'oneRepMax' | 'time';

/**
 * Whether the set at (entryIndex, setIndex) of the workout in progress beats the lifter's history.
 * Only for exercises done before, so a first session is not one long row of records, and only when
 * the set also beats every other done set of the exercise in this workout. Warm-ups never count.
 */
export function liveRecord(
  workout: Workout,
  entryIndex: number,
  setIndex: number,
  history: Workout[],
  timed = false,
): LiveRecord | null {
  const entry = workout.entries[entryIndex];
  const set = entry?.sets[setIndex];
  if (!entry || !set || set.kind === 'warmup' || set.reps <= 0) return null;
  const records = exerciseRecords(history.filter((w) => w.id !== workout.id), entry.exerciseId);
  if (!records.maxWeight || !records.best1RM || !records.longest) return null;

  const others = workout.entries.flatMap((e, i) =>
    e.exerciseId === entry.exerciseId
      ? e.sets.filter((s, j) => s.done && s.kind !== 'warmup' && !(i === entryIndex && j === setIndex))
      : [],
  );
  if (timed) return set.reps > Math.max(records.longest.reps, ...others.map((s) => s.reps)) ? 'time' : null;
  if (set.weight <= 0) return null;
  const bestWeight = Math.max(records.maxWeight.weight, ...others.map((s) => s.weight));
  const bestOrm = Math.max(records.best1RM.value, best1RM(others));
  if (set.weight > bestWeight) return 'weight';
  if (epley1RM(set.weight, set.reps) > bestOrm) return 'oneRepMax';
  return null;
}

/** Workouts in a row without a better estimated 1RM before an exercise counts as stalled. */
export const STALL_SESSIONS = 3;

/**
 * Whether progress on an exercise has stalled: its last STALL_SESSIONS workouts all fell short of the best
 * estimated 1RM reached before them. Needs at least one earlier workout to compare with. Timed and bodyweight
 * exercises (no weight) are never reported.
 */
export function isStalled(workouts: Workout[], exerciseId: string, timed = false): boolean {
  if (timed) return false;
  const series = progressSeries(workouts, exerciseId);
  if (series.length <= STALL_SESSIONS) return false;
  const recent = series.slice(-STALL_SESSIONS);
  const before = Math.max(...series.slice(0, -STALL_SESSIONS).map((p) => p.value));
  return before > 0 && recent.every((p) => p.value <= before);
}

export interface PercentRow {
  percent: number;
  /** Weight at that share of the 1RM, rounded down to a loadable step so it never exceeds the share. */
  weight: number;
  /** About how many repetitions that weight allows (Epley, solved for repetitions). */
  reps: number;
}

/** Working weights from 100% of a one-rep max down to 60%, in steps of 5%. */
export function percentTable(oneRepMax: number, step: number): PercentRow[] {
  if (oneRepMax <= 0) return [];
  return Array.from({ length: 9 }, (_, i) => {
    const percent = 100 - i * 5;
    const share = percent / 100;
    return {
      percent,
      weight: Math.round(Math.floor((oneRepMax * share) / step + 1e-9) * step * 1000) / 1000,
      reps: Math.max(1, Math.round(30 * (1 / share - 1))),
    };
  });
}
