import { describe, expect, it } from 'vitest';
import { periodAt, summarizePeriod } from './periods';
import type { Exercise, Workout, WorkoutSet } from './types';

const ex = (id: string, muscleGroup: Exercise['muscleGroup'], timed = false): Exercise => ({
  id,
  name: id,
  muscleGroup,
  equipment: 'sztanga',
  custom: false,
  archived: false,
  updatedAt: '',
  ...(timed ? { timed: true } : {}),
});
const exercises = [ex('bench', 'klatka'), ex('squat', 'nogi'), ex('plank', 'brzuch', true)];
const set = (weight: number, reps: number, extra: Partial<WorkoutSet> = {}): WorkoutSet => ({ weight, reps, done: true, ...extra });
const workout = (start: Date, minutes: number, entries: Workout['entries']): Workout => ({
  id: start.toISOString(),
  name: 'x',
  startedAt: start.toISOString(),
  finishedAt: new Date(start.getTime() + minutes * 60000).toISOString(),
  updatedAt: '',
  entries,
});

describe('periods', () => {
  const now = new Date(2026, 10, 20, 12); // Friday 20 November 2026

  it('finds the week from Monday, the month and the year, and moves between them', () => {
    expect(periodAt('week', now)).toMatchObject({ from: new Date(2026, 10, 16), to: new Date(2026, 10, 23) });
    expect(periodAt('week', now, -1)).toMatchObject({ from: new Date(2026, 10, 9), to: new Date(2026, 10, 16) });
    expect(periodAt('month', now, -11)).toMatchObject({ from: new Date(2025, 11, 1), to: new Date(2026, 0, 1) });
    expect(periodAt('year', now, -1)).toMatchObject({ from: new Date(2025, 0, 1), to: new Date(2026, 0, 1) });
  });
});

describe('summary of a period', () => {
  const history = [
    // Before the period: sets the starting point for records.
    workout(new Date(2026, 9, 5, 18), 60, [{ exerciseId: 'bench', sets: [set(80, 5)] }]),
    // In November 2026.
    workout(new Date(2026, 10, 2, 18), 50, [
      { exerciseId: 'bench', sets: [set(40, 10, { kind: 'warmup' }), set(85, 5), set(85, 5)] },
      { exerciseId: 'plank', sets: [set(0, 60)] },
    ]),
    workout(new Date(2026, 10, 2, 19, 30), 10, [{ exerciseId: 'squat', sets: [set(100, 5, { done: false })] }]),
    workout(new Date(2026, 10, 18, 18), 70, [{ exerciseId: 'squat', sets: [set(100, 5), set(100, 5), set(100, 5)] }]),
  ];
  const november = summarizePeriod(history, exercises, periodAt('month', new Date(2026, 10, 20)));

  it('counts workouts, training days, time, volume, sets and repetitions', () => {
    expect(november).toMatchObject({ workouts: 3, days: 2, duration: 130 * 60000, volume: 2350, sets: 6, reps: 25 });
  });

  it('splits sets by muscle group and lists the most done exercises', () => {
    expect(november.setsByGroup.filter((g) => g.sets > 0)).toEqual([
      { group: 'klatka', sets: 2 },
      { group: 'nogi', sets: 3 },
      { group: 'brzuch', sets: 1 },
    ]);
    expect(november.topExercises).toEqual([
      { exerciseId: 'squat', sets: 3 },
      { exerciseId: 'bench', sets: 2 },
      { exerciseId: 'plank', sets: 1 },
    ]);
  });

  it('lists records beaten inside the period only', () => {
    expect(november.records.map((r) => [r.exerciseId, r.previous, r.value])).toEqual([['bench', 80, 85]]);
    const october = summarizePeriod(history, exercises, periodAt('month', new Date(2026, 9, 20)));
    expect(october.records).toEqual([]);
    expect(october.workouts).toBe(1);
  });

  it('is all zeros for a period without training', () => {
    const empty = summarizePeriod(history, exercises, periodAt('year', new Date(2024, 5, 1)));
    expect(empty).toMatchObject({ workouts: 0, days: 0, duration: 0, volume: 0, sets: 0, reps: 0, topExercises: [], records: [] });
  });
});
