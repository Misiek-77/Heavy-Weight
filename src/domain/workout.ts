import { newId } from './id';
import { lastPerformance } from './stats';
import type { Plan, Workout, WorkoutEntry, WorkoutSet } from './types';

const now = () => new Date().toISOString();
const EMPTY_SET: WorkoutSet = { weight: 0, reps: 0, done: false };

/** `count` not-done sets, each prefilled from the matching previous set (or the last one available). */
function prefilledSets(previous: WorkoutSet[], count: number): WorkoutSet[] {
  return Array.from({ length: count }, (_, i) => {
    const src = previous[Math.min(i, previous.length - 1)];
    if (!src) return { ...EMPTY_SET };
    return { weight: src.weight, reps: src.reps, done: false, ...(src.kind && src.kind !== 'normal' ? { kind: src.kind } : {}) };
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

/**
 * Adds a set prefilled with what was lifted in the same set last time; when last time had fewer sets,
 * it repeats the set above instead (as a plain working set).
 */
export function addSet(w: Workout, entryIndex: number, history: Workout[] = []): Workout {
  return mapEntry(w, entryIndex, (e) => {
    const previous = lastPerformance(history, e.exerciseId)[e.sets.length];
    const above = e.sets.at(-1);
    const next: WorkoutSet = previous
      ? prefilledSets([previous], 1)[0]
      : above
        ? { weight: above.weight, reps: above.reps, done: false }
        : { ...EMPTY_SET };
    return { ...e, sets: [...e.sets, next] };
  });
}

export function setEntryNote(w: Workout, entryIndex: number, note: string): Workout {
  return mapEntry(w, entryIndex, (e) => ({ ...e, note }));
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

/** The note trimmed, or nothing when it is blank, so empty notes are not stored. */
const cleanNote = (note: string | undefined) => (note?.trim() ? { note: note.trim() } : {});

/** Keeps only done sets and non-empty notes. Returns null when there is nothing worth saving. */
export function finishWorkout(w: Workout, finishedAt: string): Workout | null {
  const entries = w.entries
    .map(({ note, ...e }) => ({ ...e, sets: e.sets.filter((s) => s.done), ...cleanNote(note) }))
    .filter((e) => e.sets.length > 0);
  if (entries.length === 0) return null;
  const { note, ...rest } = w;
  return { ...rest, ...cleanNote(note), entries, finishedAt, updatedAt: finishedAt };
}
