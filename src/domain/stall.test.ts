import { describe, expect, it } from 'vitest';
import { isStalled } from './stats';
import type { Workout, WorkoutSet } from './types';
import { deloadEntry } from './workout';

const set = (weight: number, reps: number, extra: Partial<WorkoutSet> = {}): WorkoutSet => ({ weight, reps, done: true, ...extra });
const session = (day: number, weight: number, reps = 5): Workout => {
  const at = new Date(2026, 9, day, 18).toISOString();
  return { id: String(day), name: 'x', startedAt: at, finishedAt: at, updatedAt: at, entries: [{ exerciseId: 'bench', sets: [set(weight, reps)] }] };
};

describe('stalled progress', () => {
  it('is reported when the last three workouts never beat the best before them', () => {
    expect(isStalled([session(1, 80), session(5, 85), session(9, 82.5), session(13, 85), session(17, 85)], 'bench')).toBe(true);
  });

  it('is not reported while progress continues or a recent workout set a new best', () => {
    expect(isStalled([session(1, 80), session(5, 82.5), session(9, 85), session(13, 87.5)], 'bench')).toBe(false);
    expect(isStalled([session(1, 85), session(5, 85), session(9, 85, 6), session(13, 85)], 'bench')).toBe(false);
  });

  it('needs history from before the last three workouts, and ignores timed exercises', () => {
    expect(isStalled([session(1, 85), session(5, 85), session(9, 85)], 'bench')).toBe(false);
    expect(isStalled([session(1, 80), session(5, 80), session(9, 80), session(13, 80)], 'bench', true)).toBe(false);
  });
});

describe('deload', () => {
  const w: Workout = {
    id: 'w',
    name: 'W',
    startedAt: '',
    updatedAt: '',
    entries: [
      {
        exerciseId: 'bench',
        sets: [set(40, 10, { kind: 'warmup', done: false }), set(85, 5), set(85, 5, { done: false }), set(85, 5, { done: false })],
      },
    ],
  };

  it('takes 10% off the working sets still to do, rounded down to a loadable weight', () => {
    expect(deloadEntry(w, 0, 2.5).entries[0].sets.map((s) => s.weight)).toEqual([40, 85, 75, 75]);
  });
});
