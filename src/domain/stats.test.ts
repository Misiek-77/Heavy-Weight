import { describe, expect, it } from 'vitest';
import {
  epley1RM,
  exerciseRecords,
  finishedWorkouts,
  liveRecord,
  lastPerformance,
  newRecordExerciseIds,
  percentTable,
  progressSeries,
  workoutVolume,
} from './stats';
import type { Workout, WorkoutSet } from './types';

const set = (weight: number, reps: number, done = true): WorkoutSet => ({ weight, reps, done });

function workout(id: string, day: string, sets: WorkoutSet[], finished = true, exerciseId = 'bench'): Workout {
  const startedAt = `2026-01-${day}T10:00:00.000Z`;
  return {
    id,
    name: id,
    startedAt,
    finishedAt: finished ? `2026-01-${day}T11:00:00.000Z` : undefined,
    entries: [{ exerciseId, sets }],
    updatedAt: startedAt,
  };
}

describe('epley1RM', () => {
  it('equals the weight for a single rep', () => expect(epley1RM(100, 1)).toBe(100));
  it('uses weight * (1 + reps / 30)', () => expect(epley1RM(100, 10)).toBeCloseTo(133.33, 2));
  it('is zero for bodyweight and for zero reps', () => {
    expect(epley1RM(0, 10)).toBe(0);
    expect(epley1RM(100, 0)).toBe(0);
  });
});

describe('workoutVolume', () => {
  it('sums only done sets', () => {
    expect(workoutVolume(workout('a', '01', [set(100, 5), set(100, 5, false), set(50, 10)]))).toBe(1000);
  });
});

describe('history queries', () => {
  const w1 = workout('w1', '01', [set(80, 8), set(80, 6)]);
  const w2 = workout('w2', '05', [set(90, 5), set(85, 8)]);
  const active = workout('w3', '09', [set(200, 1)], false);
  const other = workout('w4', '07', [set(150, 5)], true, 'squat');
  const all = [w1, active, other, w2];

  it('finishedWorkouts drops the active one and sorts newest first', () => {
    expect(finishedWorkouts(all).map((w) => w.id)).toEqual(['w4', 'w2', 'w1']);
  });

  it('lastPerformance returns the done sets of the newest finished workout', () => {
    expect(lastPerformance(all, 'bench')).toEqual([set(90, 5), set(85, 8)]);
    expect(lastPerformance(all, 'missing')).toEqual([]);
  });

  it('exerciseRecords ignores the active workout', () => {
    const r = exerciseRecords(all, 'bench');
    expect(r.maxWeight).toEqual({ weight: 90, reps: 5, date: w2.startedAt });
    expect(r.best1RM?.value).toBeCloseTo(85 * (1 + 8 / 30), 5);
    expect(r.best1RM?.date).toBe(w2.startedAt);
    expect(r.maxVolume).toEqual({ value: 90 * 5 + 85 * 8, date: w2.startedAt });
  });

  it('exerciseRecords is empty without history', () => {
    expect(exerciseRecords(all, 'missing')).toEqual({ maxWeight: null, best1RM: null, maxVolume: null, longest: null });
  });

  it('progressSeries is the best 1RM per workout, oldest first', () => {
    const s = progressSeries(all, 'bench');
    expect(s.map((p) => p.date)).toEqual([w1.startedAt, w2.startedAt]);
    expect(s[0].value).toBeCloseTo(80 * (1 + 8 / 30), 5);
  });

  it('handles bodyweight sets without breaking', () => {
    const bw = workout('bw', '02', [set(0, 12), set(0, 10)], true, 'pullup');
    expect(lastPerformance([bw], 'pullup')).toHaveLength(2);
    expect(progressSeries([bw], 'pullup')).toEqual([{ date: bw.startedAt, value: 0 }]);
    expect(exerciseRecords([bw], 'pullup').maxWeight).toEqual({ weight: 0, reps: 12, date: bw.startedAt });
  });
});

describe('newRecordExerciseIds', () => {
  const earlier = [workout('w1', '01', [set(80, 8)])];
  it('reports an exercise whose best 1RM beats all earlier workouts', () => {
    expect(newRecordExerciseIds(workout('w2', '05', [set(90, 8)]), earlier)).toEqual(['bench']);
  });
  it('reports nothing when the result is equal or worse', () => {
    expect(newRecordExerciseIds(workout('w2', '05', [set(80, 8)]), earlier)).toEqual([]);
  });
  it('counts the first ever weighted result as a record but not a 0 kg one', () => {
    expect(newRecordExerciseIds(workout('w2', '05', [set(60, 5)], true, 'row'), earlier)).toEqual(['row']);
    expect(newRecordExerciseIds(workout('w2', '05', [set(0, 10)], true, 'pullup'), earlier)).toEqual([]);
  });
});

describe('warm-up sets', () => {
  const warmup: WorkoutSet = { weight: 200, reps: 1, done: true, kind: 'warmup' };
  const history = [workout('a', '01', [warmup, set(100, 5)])];

  it('do not count towards records or progress', () => {
    expect(exerciseRecords(history, 'bench').maxWeight?.weight).toBe(100);
    expect(progressSeries(history, 'bench')[0].value).toBeCloseTo(epley1RM(100, 5));
  });
  it('still show up as the last performance, but not in the volume', () => {
    expect(lastPerformance(history, 'bench')).toHaveLength(2);
    expect(workoutVolume(history[0])).toBe(500);
  });
});

describe('liveRecord', () => {
  const history = [workout('a', '01', [set(100, 5)])];
  const active = (sets: WorkoutSet[], exerciseId = 'bench') => workout('now', '09', sets, false, exerciseId);

  it('reports a heavier weight than ever before', () => {
    expect(liveRecord(active([set(102.5, 1)]), 0, 0, history)).toBe('weight');
  });
  it('reports a better estimated max at the same weight', () => {
    expect(liveRecord(active([set(100, 6)]), 0, 0, history)).toBe('oneRepMax');
  });
  it('reports nothing for an equal or worse set', () => {
    expect(liveRecord(active([set(100, 5)]), 0, 0, history)).toBeNull();
    expect(liveRecord(active([set(90, 5)]), 0, 0, history)).toBeNull();
  });
  it('reports nothing for an exercise never done before', () => {
    expect(liveRecord(active([set(300, 1)], 'squat'), 0, 0, history)).toBeNull();
  });
  it('ignores warm-ups', () => {
    expect(liveRecord(active([{ ...set(150, 1), kind: 'warmup' }]), 0, 0, history)).toBeNull();
  });
  it('compares against sets already done in the same workout', () => {
    const now = active([set(110, 3), set(105, 3), set(110, 4)]);
    expect(liveRecord(now, 0, 1, history)).toBeNull();
    expect(liveRecord(now, 0, 2, history)).toBe('oneRepMax');
  });
});

describe('percentage table', () => {
  it('lists 100% to 60% of the max with loadable weights and the repetitions they allow', () => {
    const rows = percentTable(100, 2.5);
    expect(rows.map((r) => [r.percent, r.weight, r.reps])).toEqual([
      [100, 100, 1],
      [95, 95, 2],
      [90, 90, 3],
      [85, 85, 5],
      [80, 80, 8],
      [75, 75, 10],
      [70, 70, 13],
      [65, 65, 16],
      [60, 60, 20],
    ]);
    expect(percentTable(117, 2.5)[1].weight).toBe(110); // 111.15, rounded down to 2.5
    expect(percentTable(99.17, 2.5)[0].weight).toBe(97.5); // never above the estimated max
    expect(percentTable(0, 2.5)).toEqual([]);
  });
});
