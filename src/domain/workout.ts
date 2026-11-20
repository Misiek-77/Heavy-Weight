import { newId } from './id';
import { lastPerformance } from './stats';
import type { EntryTargets, Plan, Workout, WorkoutEntry, WorkoutSet } from './types';

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

/** Added to the working sets once the top of the rep range was reached in every one of them. */
export const WEIGHT_STEP = 2.5;

/** Whether last time's working sets all reached the top of the target range, so it is time to add weight. */
export function shouldIncrease(previous: WorkoutSet[], repMax: number | undefined): boolean {
  const working = previous.filter((s) => s.kind !== 'warmup');
  return repMax !== undefined && working.length > 0 && working.every((s) => s.weight > 0 && s.reps >= repMax);
}

/** Prefilled sets for an exercise with a rep range: heavier and back at the bottom of the range when earned. */
function targetSets(previous: WorkoutSet[], count: number, targets: EntryTargets, step = WEIGHT_STEP): WorkoutSet[] {
  const sets = prefilledSets(previous, count);
  if (!shouldIncrease(previous, targets.repMax)) return sets;
  return sets.map((s) =>
    s.kind === 'warmup' ? s : { ...s, weight: s.weight + step, reps: targets.repMin ?? s.reps },
  );
}

const targetsOf = ({ repMin, repMax, linkNext }: EntryTargets): EntryTargets => ({
  ...(repMin ? { repMin } : {}),
  ...(repMax ? { repMax } : {}),
  ...(linkNext ? { linkNext } : {}),
});

function withEntries(w: Workout, entries: WorkoutEntry[]): Workout {
  return { ...w, entries, updatedAt: now() };
}

function mapEntry(w: Workout, entryIndex: number, fn: (e: WorkoutEntry) => WorkoutEntry): Workout {
  return withEntries(w, w.entries.map((e, i) => (i === entryIndex ? fn(e) : e)));
}

export function createWorkout(opts: { plan?: Plan; name: string; now: string; history: Workout[]; step?: number }): Workout {
  const { plan, history } = opts;
  return {
    id: newId(),
    planId: plan?.id,
    name: opts.name,
    startedAt: opts.now,
    updatedAt: opts.now,
    entries: (plan?.items ?? []).map((item, i, items) => ({
      exerciseId: item.exerciseId,
      sets: targetSets(lastPerformance(history, item.exerciseId), Math.max(1, item.targetSets), item, opts.step),
      ...targetsOf(item),
      // The last exercise has nothing after it to be paired with.
      ...(i === items.length - 1 ? { linkNext: undefined } : {}),
    })),
  };
}

/**
 * A new workout made like a past one: the same exercises in the same order, as many sets as were done,
 * the same rep targets and supersets. Numbers are prefilled from history as for a plan; notes stay behind.
 */
export function repeatWorkout(past: Workout, history: Workout[], now: string, step?: number): Workout {
  const plan: Plan = {
    id: past.planId ?? '',
    name: past.name,
    items: past.entries.map((e) => ({ exerciseId: e.exerciseId, targetSets: e.sets.length, ...targetsOf(e) })),
    createdAt: now,
    updatedAt: now,
  };
  const workout = createWorkout({ plan, name: past.name, now, history, step });
  return { ...workout, planId: past.planId };
}

export function addEntry(w: Workout, exerciseId: string, history: Workout[]): Workout {
  const sets = prefilledSets(lastPerformance(history, exerciseId), 1);
  return withEntries(w, [...w.entries, { exerciseId, sets }]);
}

export function removeEntry(w: Workout, entryIndex: number): Workout {
  const removed = w.entries[entryIndex];
  return withEntries(
    w,
    w.entries
      // The exercise before takes over the removed one's link, so a superset never points at nothing.
      .map((e, i) => (i === entryIndex - 1 && e.linkNext ? { ...e, linkNext: removed?.linkNext } : e))
      .filter((_, i) => i !== entryIndex),
  );
}

/** Pairs the exercise with the one after it into a superset, or splits the pair. */
export function toggleLink(w: Workout, entryIndex: number): Workout {
  if (entryIndex >= w.entries.length - 1) return w;
  return mapEntry(w, entryIndex, (e) => ({ ...e, linkNext: !e.linkNext }));
}

/**
 * Swaps the exercise for another one (the machine is taken). Sets already done stay logged under the
 * original exercise; the remaining ones move to the replacement, prefilled from its own history.
 */
export function swapExercise(w: Workout, entryIndex: number, exerciseId: string, history: Workout[], step?: number): Workout {
  const entry = w.entries[entryIndex];
  if (!entry || entry.exerciseId === exerciseId) return w;
  const done = entry.sets.filter((s) => s.done);
  const remaining = Math.max(1, entry.sets.length - done.length);
  const replacement: WorkoutEntry = {
    ...targetsOf(entry),
    exerciseId,
    sets: targetSets(lastPerformance(history, exerciseId), remaining, entry, step),
  };
  if (done.length === 0) return withEntries(w, w.entries.map((e, i) => (i === entryIndex ? replacement : e)));
  const kept: WorkoutEntry = { ...entry, sets: done, linkNext: undefined };
  return withEntries(w, w.entries.flatMap((e, i) => (i === entryIndex ? [kept, replacement] : [e])));
}

/**
 * Adds a set prefilled with what was lifted in the same set last time; when last time had fewer sets,
 * it repeats the set above instead (as a plain working set).
 */
export function addSet(w: Workout, entryIndex: number, history: Workout[] = []): Workout {
  return mapEntry(w, entryIndex, (e) => {
    const last = lastPerformance(history, e.exerciseId);
    const above = e.sets.at(-1);
    // After a weight increase the old numbers no longer apply: the new set follows the one above it.
    const previous = shouldIncrease(last, e.repMax) ? undefined : last[e.sets.length];
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
  const entries: WorkoutEntry[] = [];
  for (const { note, ...e } of w.entries) {
    const sets = e.sets.filter((s) => s.done);
    if (sets.length === 0) {
      // A link on the last kept exercise always points at the exercise being looked at. That one is dropped,
      // so the kept exercise takes over its link: the superset goes on past it, or ends here.
      const before = entries.at(-1);
      if (before?.linkNext) before.linkNext = e.linkNext;
      continue;
    }
    entries.push({ ...e, sets, ...cleanNote(note) });
  }
  if (entries.length === 0) return null;
  // Nothing follows the last exercise, so it cannot be the first half of a superset.
  const lastEntry = entries[entries.length - 1];
  if (lastEntry.linkNext) lastEntry.linkNext = undefined;
  const { note, ...rest } = w;
  return { ...rest, ...cleanNote(note), entries, finishedAt, updatedAt: finishedAt };
}

/** Share of the working weight and repetitions for each warm-up step, lightest first. */
const WARMUP_STEPS: [share: number, reps: number][] = [
  [0.4, 8],
  [0.6, 5],
  [0.8, 3],
];

/**
 * Warm-up sets for a working weight: the empty bar for 10 (when there is a bar), then about 40, 60 and 80%
 * of the working weight with fewer repetitions each time. Weights are rounded down to what can be loaded
 * (`step`), and a step that would repeat the one before, or reach the working weight, is left out.
 */
export function warmupSets(workWeight: number, { bar, step }: { bar: number; step: number }): WorkoutSet[] {
  if (workWeight <= Math.max(bar, 0)) return [];
  const sets: WorkoutSet[] = bar > 0 ? [{ weight: bar, reps: 10, done: false, kind: 'warmup' }] : [];
  for (const [share, reps] of WARMUP_STEPS) {
    // Rounded through a whole number of steps, so 0.1 + 0.2 style errors never leave 37.4999.
    const weight = Math.round(Math.floor((workWeight * share) / step + 1e-9) * step * 1000) / 1000;
    const below = sets.at(-1)?.weight ?? 0;
    if (weight <= below || weight <= bar || weight >= workWeight) continue;
    sets.push({ weight, reps, done: false, kind: 'warmup' });
  }
  return sets;
}

/** Puts warm-up sets for the exercise's first working weight in front of its sets, unless it already has some. */
export function addWarmup(w: Workout, entryIndex: number, load: { bar: number; step: number }): Workout {
  const entry = w.entries[entryIndex];
  if (!entry || entry.sets.some((s) => s.kind === 'warmup')) return w;
  const work = entry.sets.find((s) => s.weight > 0)?.weight ?? 0;
  const sets = warmupSets(work, load);
  if (sets.length === 0) return w;
  return mapEntry(w, entryIndex, (e) => ({ ...e, sets: [...sets, ...e.sets] }));
}

/**
 * A finished workout after it was corrected in the history: sets left at zero repetitions are dropped, an
 * exercise with no sets left goes too (its superset link passes on as when finishing), notes are trimmed.
 * Returns null when nothing is left, so the caller can offer to delete the workout instead.
 */
export function reviseWorkout(edited: Workout, now: string): Workout | null {
  const finishedAt = edited.finishedAt ?? now;
  const kept = { ...edited, entries: edited.entries.map((e) => ({ ...e, sets: e.sets.filter((s) => s.reps > 0).map((s) => ({ ...s, done: true })) })) };
  const revised = finishWorkout(kept, finishedAt);
  return revised && { ...revised, name: revised.name.trim() || 'Trening', updatedAt: now };
}
