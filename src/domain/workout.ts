import { newId } from './id';
import { lastPerformance } from './stats';
import type { Plan, Workout, WorkoutEntry, WorkoutSet } from './types';

const now = () => new Date().toISOString();
const EMPTY_SET: WorkoutSet = { weight: 0, reps: 0, done: false };

/** `count` not-done sets, each prefilled from the matching previous set (or the last one available). */
function prefilledSets(previous: WorkoutSet[], count: number): WorkoutSet[] {
  return Array.from({ length: count }, (_, i) => {
    const src = previous[Math.min(i, previous.length - 1)];
    return src ? { weight: src.weight, reps: src.reps, done: false } : { ...EMPTY_SET };
  });
}

function withEntries(w: Workout, entries: WorkoutEntry[]): Workout {
  return { ...w, entries, updatedAt: now() };
}

function mapEntry(w: Workout, entryIndex: number, fn: (e: WorkoutEntry) => WorkoutEntry): Workout {
  return withEntries(w, w.entries.map((e, i) => (i === entryIndex ? fn(e) : e)));
}

export function createWorkout(opts: { plan?: Plan; name: string; now: string; history: Workout[] }): Workout {
  const { plan, history } = opts;
  return {
    id: newId(),
    planId: plan?.id,
    name: opts.name,
    startedAt: opts.now,
    updatedAt: opts.now,
    entries: (plan?.items ?? []).map((item) => ({
      exerciseId: item.exerciseId,
      sets: prefilledSets(lastPerformance(history, item.exerciseId), Math.max(1, item.targetSets)),
    })),
  };
}

export function addEntry(w: Workout, exerciseId: string, history: Workout[]): Workout {
  const sets = prefilledSets(lastPerformance(history, exerciseId), 1);
  return withEntries(w, [...w.entries, { exerciseId, sets }]);
}

export function removeEntry(w: Workout, entryIndex: number): Workout {
  return withEntries(w, w.entries.filter((_, i) => i !== entryIndex));
}

export function addSet(w: Workout, entryIndex: number): Workout {
  return mapEntry(w, entryIndex, (e) => ({ ...e, sets: [...e.sets, ...prefilledSets(e.sets.slice(-1), 1)] }));
}

export function updateSet(w: Workout, entryIndex: number, setIndex: number, patch: Partial<WorkoutSet>): Workout {
  return mapEntry(w, entryIndex, (e) => ({
    ...e,
    sets: e.sets.map((s, i) => (i === setIndex ? { ...s, ...patch } : s)),
  }));
}

export function removeSet(w: Workout, entryIndex: number, setIndex: number): Workout {
  return mapEntry(w, entryIndex, (e) => ({ ...e, sets: e.sets.filter((_, i) => i !== setIndex) }));
}

/** Keeps only done sets. Returns null when there is nothing worth saving. */
export function finishWorkout(w: Workout, finishedAt: string): Workout | null {
  const entries = w.entries
    .map((e) => ({ ...e, sets: e.sets.filter((s) => s.done) }))
    .filter((e) => e.sets.length > 0);
  if (entries.length === 0) return null;
  return { ...w, entries, finishedAt, updatedAt: finishedAt };
}
