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

const volume = (sets: WorkoutSet[]) => sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
const best1RM = (sets: WorkoutSet[]) => Math.max(0, ...sets.map((s) => epley1RM(s.weight, s.reps)));

export function workoutVolume(w: Workout): number {
  return volume(w.entries.flatMap((e) => doneSets(e.sets)));
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
}

export function exerciseRecords(workouts: Workout[], exerciseId: string): ExerciseRecords {
  const r: ExerciseRecords = { maxWeight: null, best1RM: null, maxVolume: null };
  // Oldest first, so the earliest date wins a tie.
  for (const w of finishedWorkouts(workouts).reverse()) {
    const sets = setsFor(w, exerciseId);
    if (!sets.length) continue;
    const date = w.startedAt;
    for (const s of sets) {
      const m = r.maxWeight;
      if (!m || s.weight > m.weight || (s.weight === m.weight && s.reps > m.reps)) {
        r.maxWeight = { weight: s.weight, reps: s.reps, date };
      }
    }
    const orm = best1RM(sets);
    if (!r.best1RM || orm > r.best1RM.value) r.best1RM = { value: orm, date };
    const vol = volume(sets);
    if (!r.maxVolume || vol > r.maxVolume.value) r.maxVolume = { value: vol, date };
  }
  return r;
}

/** Best estimated 1RM per finished workout, oldest first. */
export function progressSeries(workouts: Workout[], exerciseId: string): { date: string; value: number }[] {
  return finishedWorkouts(workouts)
    .reverse()
    .map((w) => ({ w, sets: setsFor(w, exerciseId) }))
    .filter((x) => x.sets.length)
    .map((x) => ({ date: x.w.startedAt, value: best1RM(x.sets) }));
}

/** Exercises in `workout` whose best estimated 1RM beats everything in `earlier`. */
export function newRecordExerciseIds(workout: Workout, earlier: Workout[]): string[] {
  const others = earlier.filter((w) => w.id !== workout.id);
  const ids = [...new Set(workout.entries.map((e) => e.exerciseId))];
  return ids.filter((id) => {
    const now = best1RM(setsFor(workout, id));
    return now > 0 && now > (exerciseRecords(others, id).best1RM?.value ?? 0);
  });
}
