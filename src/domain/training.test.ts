import { describe, expect, it } from 'vitest';
import { exerciseRecords, liveRecord, newRecordExerciseIds, progressSeries, workoutVolume } from './stats';
import type { Plan, Workout, WorkoutSet } from './types';
import { addEntry, addSet, createWorkout, finishWorkout, removeEntry, shouldIncrease, swapExercise, toggleLink, updateSet } from './workout';

const NOW = '2026-02-01T10:00:00.000Z';
const set = (weight: number, reps: number, done = true): WorkoutSet => ({ weight, reps, done });

function finished(id: string, day: string, exerciseId: string, sets: WorkoutSet[]): Workout {
  const at = `2026-01-${day}T10:00:00.000Z`;
  return { id, name: id, startedAt: at, finishedAt: at, updatedAt: at, entries: [{ exerciseId, sets }] };
}

const plan = (items: Plan['items']): Plan => ({ id: 'p', name: 'P', items, createdAt: NOW, updatedAt: NOW });
const start = (p: Plan, history: Workout[] = []) => createWorkout({ plan: p, name: p.name, now: NOW, history });

describe('rep range progression', () => {
  const history = [finished('a', '10', 'bench', [{ ...set(40, 10), kind: 'warmup' }, set(80, 10), set(80, 10)])];

  it('adds weight and drops to the bottom of the range once every working set reached the top', () => {
    const w = start(plan([{ exerciseId: 'bench', targetSets: 3, repMin: 8, repMax: 10 }]), history);
    expect(w.entries[0].sets.map((s) => [s.weight, s.reps, s.kind])).toEqual([
      [40, 10, 'warmup'],
      [82.5, 8, undefined],
      [82.5, 8, undefined],
    ]);
    expect(w.entries[0]).toMatchObject({ repMin: 8, repMax: 10 });
  });

  it('repeats last time when a set fell short, or when the plan has no range', () => {
    const short = [finished('a', '10', 'bench', [set(80, 10), set(80, 9)])];
    expect(shouldIncrease(short[0].entries[0].sets, 10)).toBe(false);
    expect(start(plan([{ exerciseId: 'bench', targetSets: 2, repMin: 8, repMax: 10 }]), short).entries[0].sets[0]).toEqual(set(80, 10, false));
    expect(start(plan([{ exerciseId: 'bench', targetSets: 1 }]), history).entries[0].sets[0].weight).toBe(40);
    expect(shouldIncrease([], 10)).toBe(false);
  });
});

describe('adding a set after a weight increase', () => {
  const history = [finished('a', '10', 'bench', [set(80, 10), set(80, 10), set(80, 10)])];

  it('follows the set above instead of last time\'s lighter set', () => {
    const w = addSet(start(plan([{ exerciseId: 'bench', targetSets: 2, repMin: 8, repMax: 10 }]), history), 0, history);
    expect(w.entries[0].sets.map((s) => [s.weight, s.reps])).toEqual([[82.5, 8], [82.5, 8], [82.5, 8]]);
  });

  it('still uses last time when there was no increase', () => {
    const w = addSet(start(plan([{ exerciseId: 'bench', targetSets: 1 }]), history), 0, history);
    expect(w.entries[0].sets[1]).toEqual(set(80, 10, false));
  });
});

describe('finishing a workout with supersets', () => {
  const p = plan([
    { exerciseId: 'a', targetSets: 1, linkNext: true },
    { exerciseId: 'b', targetSets: 1, linkNext: true },
    { exerciseId: 'c', targetSets: 1 },
  ]);
  const done = (w: Workout, ...indexes: number[]) => indexes.reduce((x, i) => updateSet(x, i, 0, { reps: 5, done: true }), w);
  const links = (w: Workout | null) => w?.entries.map((e) => [e.exerciseId, !!e.linkNext]);

  it('keeps links between exercises that were both done', () => {
    expect(links(finishWorkout(done(start(p), 0, 1, 2), NOW))).toEqual([['a', true], ['b', true], ['c', false]]);
  });
  it('bridges a skipped exercise in the middle', () => {
    expect(links(finishWorkout(done(start(p), 0, 2), NOW))).toEqual([['a', true], ['c', false]]);
  });
  it('never leaves a link on the last exercise', () => {
    expect(links(finishWorkout(done(start(p), 0, 1), NOW))).toEqual([['a', true], ['b', false]]);
    expect(links(finishWorkout(done(start(p), 0), NOW))).toEqual([['a', false]]);
  });
});

describe('supersets', () => {
  const p = plan([
    { exerciseId: 'a', targetSets: 1, linkNext: true },
    { exerciseId: 'b', targetSets: 1, linkNext: true },
    { exerciseId: 'c', targetSets: 1, linkNext: true },
  ]);

  it('copies links from the plan but never links the last exercise', () => {
    expect(start(p).entries.map((e) => !!e.linkNext)).toEqual([true, true, false]);
  });

  it('toggles a link, except on the last exercise', () => {
    const w = start(plan([{ exerciseId: 'a', targetSets: 1 }, { exerciseId: 'b', targetSets: 1 }]));
    expect(toggleLink(w, 0).entries[0].linkNext).toBe(true);
    expect(toggleLink(toggleLink(w, 0), 0).entries[0].linkNext).toBe(false);
    expect(toggleLink(w, 1)).toBe(w);
  });

  it('hands the link on when the middle or the last exercise is removed', () => {
    const w = start(p);
    expect(removeEntry(w, 1).entries.map((e) => !!e.linkNext)).toEqual([true, false]);
    expect(removeEntry(w, 2).entries.map((e) => !!e.linkNext)).toEqual([true, false]);
  });
});

describe('swapExercise', () => {
  const history = [finished('a', '10', 'row', [set(60, 8)])];
  const base = addEntry(addEntry(start(plan([])), 'pulldown', []), 'curl', []);

  it('replaces an untouched exercise in place, prefilled from the replacement', () => {
    const w = swapExercise(base, 0, 'row', history);
    expect(w.entries.map((e) => e.exerciseId)).toEqual(['row', 'curl']);
    expect(w.entries[0].sets).toEqual([set(60, 8, false)]);
  });

  it('keeps done sets under the original exercise and moves the rest', () => {
    let w = updateSet(base, 0, 0, { weight: 50, reps: 10, done: true });
    w = { ...w, entries: w.entries.map((e, i) => (i === 0 ? { ...e, sets: [...e.sets, set(50, 10, false), set(50, 10, false)] } : e)) };
    const swapped = swapExercise(w, 0, 'row', history);
    expect(swapped.entries.map((e) => [e.exerciseId, e.sets.length])).toEqual([
      ['pulldown', 1],
      ['row', 2],
      ['curl', 1],
    ]);
    expect(swapped.entries[0].sets[0].done).toBe(true);
  });

  it('does nothing when swapping for the same exercise', () => {
    expect(swapExercise(base, 0, 'pulldown', history)).toBe(base);
  });
});

describe('timed exercises', () => {
  const timed = new Set(['plank']);
  const history = [finished('a', '10', 'plank', [set(0, 60), set(0, 45)]), finished('b', '11', 'bench', [set(100, 5)])];

  it('are left out of the volume', () => {
    const carry = finished('c', '12', 'plank', [set(40, 60)]);
    expect(workoutVolume(carry)).toBe(2400);
    expect(workoutVolume(carry, timed)).toBe(0);
  });

  it('track the longest hold as the record and in the progress series', () => {
    expect(exerciseRecords(history, 'plank').longest).toMatchObject({ reps: 60 });
    expect(progressSeries(history, 'plank', true)).toEqual([{ date: history[0].startedAt, value: 60 }]);
  });

  it('report a live record only for a longer hold', () => {
    const active = (seconds: number): Workout => ({ ...finished('now', '20', 'plank', [set(0, seconds)]), finishedAt: undefined });
    expect(liveRecord(active(75), 0, 0, history, true)).toBe('time');
    expect(liveRecord(active(60), 0, 0, history, true)).toBeNull();
  });

  it('count as a new record at the end of the workout', () => {
    const now = finished('now', '20', 'plank', [set(0, 90)]);
    expect(newRecordExerciseIds(now, history, timed)).toEqual(['plank']);
    expect(newRecordExerciseIds(finished('now', '20', 'plank', [set(0, 30)]), history, timed)).toEqual([]);
  });
});
