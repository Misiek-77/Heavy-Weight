import { describe, expect, it } from 'vitest';
import type { Workout } from './types';
import { addWarmup, setLabels, warmupSets } from './workout';

const plain = (sets: { weight: number; reps: number }[]) => sets.map((s) => [s.weight, s.reps]);

describe('warm-up sets', () => {
  it('climbs from the empty bar to about 80% of the working weight in 2.5 kg steps', () => {
    const sets = warmupSets(100, { bar: 20, step: 2.5 });
    expect(plain(sets)).toEqual([[20, 10], [40, 8], [60, 5], [80, 3]]);
    expect(sets.every((s) => s.kind === 'warmup' && !s.done)).toBe(true);
  });

  it('rounds down to the step and drops steps that would repeat or reach the working weight', () => {
    expect(plain(warmupSets(62.5, { bar: 20, step: 2.5 }))).toEqual([[20, 10], [25, 8], [37.5, 5], [50, 3]]);
    expect(plain(warmupSets(30, { bar: 20, step: 2.5 }))).toEqual([[20, 10], [22.5, 3]]);
  });

  it('starts at 40% without a bar, for dumbbells and machines', () => {
    expect(plain(warmupSets(30, { bar: 0, step: 2.5 }))).toEqual([[10, 8], [17.5, 5], [22.5, 3]]);
  });

  it('suggests nothing for the bar alone, bodyweight or nothing typed yet', () => {
    expect(warmupSets(20, { bar: 20, step: 2.5 })).toEqual([]);
    expect(warmupSets(0, { bar: 0, step: 2.5 })).toEqual([]);
  });
});

describe('adding warm-up sets to an exercise', () => {
  const w: Workout = {
    id: 'w',
    name: 'W',
    startedAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
    entries: [{ exerciseId: 'bench', sets: [{ weight: 100, reps: 5, done: false }] }],
  };

  it('puts them before the working sets', () => {
    const next = addWarmup(w, 0, { bar: 20, step: 2.5 });
    expect(next.entries[0].sets.map((s) => [s.weight, s.kind ?? 'normal'])).toEqual([
      [20, 'warmup'],
      [40, 'warmup'],
      [60, 'warmup'],
      [80, 'warmup'],
      [100, 'normal'],
    ]);
  });

  it('does nothing when the exercise already has warm-ups or no working weight', () => {
    const once = addWarmup(w, 0, { bar: 20, step: 2.5 });
    expect(addWarmup(once, 0, { bar: 20, step: 2.5 })).toBe(once);
    const empty = { ...w, entries: [{ exerciseId: 'bench', sets: [{ weight: 0, reps: 0, done: false }] }] };
    expect(addWarmup(empty, 0, { bar: 20, step: 2.5 })).toBe(empty);
  });
});

describe('set numbers', () => {
  it('counts working sets from 1 and marks warm-ups', () => {
    const sets = warmupSets(100, { bar: 20, step: 2.5 }).slice(0, 2);
    const work = { weight: 100, reps: 5, done: false };
    expect(setLabels([...sets, work, { ...work, kind: 'drop' as const }])).toEqual(['R', 'R', '1', '2']);
  });
});
