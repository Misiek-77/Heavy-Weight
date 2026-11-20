import { describe, expect, it } from 'vitest';
import { allRecords, compareMonths, goalProgress, recordEvents } from './insights';
import type { Exercise, Workout, WorkoutSet } from './types';

const set = (weight: number, reps: number, extra: Partial<WorkoutSet> = {}): WorkoutSet => ({ weight, reps, done: true, ...extra });

/** A finished workout at local noon on the given day. */
function workout(day: Date, exerciseId: string, sets: WorkoutSet[]): Workout {
  const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 12).toISOString();
  return { id: at + exerciseId, name: 'T', startedAt: at, finishedAt: at, updatedAt: at, entries: [{ exerciseId, sets }] };
}

const exercises = [
  { id: 'bench', name: 'Ławka', muscleGroup: 'klatka' },
  { id: 'squat', name: 'Przysiad', muscleGroup: 'nogi' },
  { id: 'plank', name: 'Deska', muscleGroup: 'brzuch', timed: true },
] as Exercise[];

// Wednesday 18 March 2026.
const NOW = new Date(2026, 2, 18, 15);
const d = (day: number, month = 2) => new Date(2026, month, day);

describe('recordEvents', () => {
  const history = [
    workout(d(2), 'bench', [set(80, 5)]),
    workout(d(4), 'bench', [set(80, 8)]),
    workout(d(9), 'bench', [set(200, 1, { kind: 'warmup' }), set(85, 3)]),
    workout(d(10), 'plank', [set(0, 60)]),
    workout(d(12), 'plank', [set(0, 90)]),
  ];

  it('lists each beaten best, newest first, without the first result or warm-ups', () => {
    const events = recordEvents(history, new Set(['plank']));
    expect(events.map((e) => [e.exerciseId, e.previous, e.value])).toEqual([
      ['plank', 60, 90],
      ['bench', 80, 85],
    ]);
  });

  it('is empty when nothing was ever beaten', () => {
    expect(recordEvents(history.slice(0, 2))).toEqual([]);
  });
});

describe('allRecords', () => {
  it('covers only exercises with history, most recently improved first', () => {
    const records = allRecords([workout(d(2), 'bench', [set(80, 5)]), workout(d(10), 'plank', [set(0, 60)])], exercises);
    expect(records.map((r) => r.exercise.id)).toEqual(['plank', 'bench']);
    expect(records[1].records.maxWeight?.weight).toBe(80);
  });
});

describe('compareMonths', () => {
  it('splits workouts, volume and sets between this month and the previous one', () => {
    const { current, previous } = compareMonths(
      [
        workout(d(17), 'bench', [set(100, 5), set(100, 5), set(40, 10, { kind: 'warmup' })]),
        workout(d(3), 'squat', [set(120, 5)]),
        workout(d(20, 1), 'bench', [set(90, 5)]),
        workout(d(20, 0), 'bench', [set(90, 5)]),
      ],
      exercises,
      NOW,
    );
    expect(current).toMatchObject({ workouts: 2, volume: 1600, sets: 3 });
    expect(current.setsByGroup).toMatchObject({ klatka: 2, nogi: 1, plecy: 0 });
    expect(previous).toMatchObject({ workouts: 1, volume: 450, sets: 1 });
  });
});

describe('goalProgress', () => {
  const history = [workout(d(16), 'bench', [set(90, 3), set(120, 1, { kind: 'warmup' })]), workout(d(17), 'squat', [set(100, 5)])];

  it('measures a lift goal by the heaviest working set', () => {
    expect(goalProgress({ id: 'g', kind: 'lift', exerciseId: 'bench', targetWeight: 100 }, history, NOW)).toEqual({
      current: 90,
      target: 100,
      ratio: 0.9,
      reached: false,
    });
    expect(goalProgress({ id: 'g', kind: 'lift', exerciseId: 'bench', targetWeight: 90 }, history, NOW).reached).toBe(true);
  });

  it('measures a frequency goal by workouts since Monday', () => {
    expect(goalProgress({ id: 'g', kind: 'frequency', perWeek: 3 }, [...history, workout(d(10), 'bench', [set(80, 5)])], NOW)).toMatchObject({
      current: 2,
      target: 3,
      reached: false,
    });
  });
});
