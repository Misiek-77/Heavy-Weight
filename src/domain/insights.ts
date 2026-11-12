import { exerciseRecords, finishedWorkouts, workoutVolume, type ExerciseRecords } from './stats';
import { startOfWeek } from './summary';
import { MUSCLE_GROUPS, type Exercise, type Goal, type MuscleGroup, type Workout } from './types';

type Ids = ReadonlySet<string>;
const working = (w: Workout, exerciseId?: string) =>
  w.entries
    .filter((e) => !exerciseId || e.exerciseId === exerciseId)
    .flatMap((e) => e.sets.filter((s) => s.done && s.kind !== 'warmup'));

export interface ExerciseBest {
  exercise: Exercise;
  records: ExerciseRecords;
  /** When the headline record (heaviest set, or longest hold) was set. */
  date: string;
}

/** Records of every exercise that has history, most recently improved first. */
export function allRecords(workouts: Workout[], exercises: Exercise[]): ExerciseBest[] {
  return exercises
    .map((exercise) => ({ exercise, records: exerciseRecords(workouts, exercise.id) }))
    .filter((x) => x.records.maxWeight && x.records.longest)
    .map((x) => ({ ...x, date: (x.exercise.timed ? x.records.longest : x.records.maxWeight)!.date }))
    .sort((a, b) => b.date.localeCompare(a.date) || a.exercise.name.localeCompare(b.exercise.name, 'pl'));
}

export interface RecordEvent {
  date: string;
  workoutId: string;
  exerciseId: string;
  /** The new best: kilograms, or seconds for a timed exercise. */
  value: number;
  previous: number;
}

/**
 * Every time a personal best was beaten, newest first: a heavier set, or a longer hold for timed
 * exercises. The first result ever logged for an exercise is the starting point, not a record.
 */
export function recordEvents(workouts: Workout[], timedIds: Ids = new Set()): RecordEvent[] {
  const best = new Map<string, number>();
  const events: RecordEvent[] = [];
  for (const w of finishedWorkouts(workouts).reverse()) {
    for (const exerciseId of new Set(w.entries.map((e) => e.exerciseId))) {
      const sets = working(w, exerciseId);
      if (sets.length === 0) continue;
      const value = Math.max(...sets.map((s) => (timedIds.has(exerciseId) ? s.reps : s.weight)));
      const previous = best.get(exerciseId);
      if (previous === undefined) best.set(exerciseId, value);
      else if (value > previous) {
        best.set(exerciseId, value);
        events.push({ date: w.startedAt, workoutId: w.id, exerciseId, value, previous });
      }
    }
  }
  return events.reverse();
}

export interface MonthTotals {
  workouts: number;
  volume: number;
  sets: number;
  setsByGroup: Record<MuscleGroup, number>;
}

/** This calendar month so far next to the whole previous one. */
export function compareMonths(workouts: Workout[], exercises: Exercise[], now: Date): { current: MonthTotals; previous: MonthTotals } {
  const groupOf = new Map(exercises.map((e) => [e.id, e.muscleGroup]));
  const timedIds = new Set(exercises.filter((e) => e.timed).map((e) => e.id));
  const month = (offset: number): MonthTotals => {
    const from = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const to = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1);
    const totals: MonthTotals = {
      workouts: 0,
      volume: 0,
      sets: 0,
      setsByGroup: Object.fromEntries(MUSCLE_GROUPS.map((g) => [g, 0])) as Record<MuscleGroup, number>,
    };
    for (const w of finishedWorkouts(workouts)) {
      const started = new Date(w.startedAt);
      if (started < from || started >= to) continue;
      totals.workouts++;
      totals.volume += workoutVolume(w, timedIds);
      for (const entry of w.entries) {
        const count = entry.sets.filter((s) => s.done && s.kind !== 'warmup').length;
        totals.sets += count;
        totals.setsByGroup[groupOf.get(entry.exerciseId) ?? 'inne'] += count;
      }
    }
    return totals;
  };
  return { current: month(0), previous: month(-1) };
}

export interface GoalProgress {
  current: number;
  target: number;
  /** 0 to 1. */
  ratio: number;
  reached: boolean;
}

/** How far along a goal is: the heaviest working set so far, or workouts done this week. */
export function goalProgress(goal: Goal, workouts: Workout[], now: Date): GoalProgress {
  const finished = finishedWorkouts(workouts);
  const current =
    goal.kind === 'lift'
      ? Math.max(0, ...finished.flatMap((w) => working(w, goal.exerciseId).map((s) => s.weight)))
      : finished.filter((w) => new Date(w.startedAt) >= startOfWeek(now)).length;
  const target = goal.kind === 'lift' ? goal.targetWeight : goal.perWeek;
  return { current, target, ratio: target > 0 ? Math.min(1, current / target) : 0, reached: target > 0 && current >= target };
}
