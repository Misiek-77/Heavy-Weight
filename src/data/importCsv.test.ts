import { describe, expect, it } from 'vitest';
import { SEED_EXERCISES } from '../domain/seed';
import { importHistoryCsv, parseCsv, parseDate } from './importCsv';

const NOW = '2026-11-20T12:00:00.000Z';
const empty = { exercises: SEED_EXERCISES, workouts: [] };

const STRONG = [
  'Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,Notes,Workout Notes,RPE',
  '2023-01-15 18:30:00,"Push, heavy",1h 5m,Bench Press (Barbell),W,40,10,0,0,,,',
  '2023-01-15 18:30:00,"Push, heavy",1h 5m,Bench Press (Barbell),1,80,5,0,0,"łokcie ""blisko""",,',
  '2023-01-15 18:30:00,"Push, heavy",1h 5m,Bench Press (Barbell),2,80,5,0,0,,,',
  '2023-01-15 18:30:00,"Push, heavy",1h 5m,Plank,1,0,0,0,60,,,',
  '2023-01-15 18:30:00,"Push, heavy",1h 5m,Landmine Press (Barbell),1,30,10,0,0,,,',
  '2023-01-17 19:00:00,Legs,45m,Squat (Barbell),1,100,5,0,0,,,',
].join('\n');

const HEVY = [
  '"title","start_time","end_time","description","exercise_title","superset_id","exercise_notes","set_index","set_type","weight_kg","reps","distance_km","duration_seconds","rpe"',
  '"Upper","15 Jan 2023, 18:30","15 Jan 2023, 19:20","dobry dzień","Lat Pulldown (Cable)",,"",0,"warmup",30,12,,,',
  '"Upper","15 Jan 2023, 18:30","15 Jan 2023, 19:20","dobry dzień","Lat Pulldown (Cable)",,"",1,"normal",60,10,,,',
  '"Upper","15 Jan 2023, 18:30","15 Jan 2023, 19:20","dobry dzień","Lat Pulldown (Cable)",,"",2,"dropset",45,8,,,',
].join('\r\n');

describe('reading CSV', () => {
  it('handles quotes, doubled quotes, commas or semicolons and any line ending', () => {
    expect(parseCsv('a,"b, c","d ""e"""\r\n1,2,3\n')).toEqual([['a', 'b, c', 'd "e"'], ['1', '2', '3']]);
    expect(parseCsv('﻿a;b\n1,5;2')).toEqual([['a', 'b'], ['1,5', '2']]);
  });

  it('reads both date formats as local time', () => {
    expect(parseDate('2023-01-15 18:30:00')).toEqual(new Date(2023, 0, 15, 18, 30));
    expect(parseDate('15 Jan 2023, 18:30')).toEqual(new Date(2023, 0, 15, 18, 30));
    expect(parseDate('wczoraj')).toBeNull();
  });
});

describe('importing a Strong export', () => {
  const result = importHistoryCsv(STRONG, empty, 'kg', NOW);
  const value = result.ok ? result.value : null;

  it('makes one workout per session with its name, length, sets and notes', () => {
    expect(value?.source).toBe('strong');
    expect(value?.workouts.map((w) => w.name)).toEqual(['Push, heavy', 'Legs']);
    const push = value!.workouts[0];
    expect(Date.parse(push.finishedAt!) - Date.parse(push.startedAt)).toBe(65 * 60000);
    expect(push.entries[0]).toEqual({
      exerciseId: 'seed-bench-press',
      note: 'łokcie "blisko"',
      sets: [
        { weight: 40, reps: 10, done: true, kind: 'warmup' },
        { weight: 80, reps: 5, done: true },
        { weight: 80, reps: 5, done: true },
      ],
    });
  });

  it('matches built-in exercises, keeps held times as seconds and adds unknown exercises as own', () => {
    const push = value!.workouts[0];
    expect(push.entries[1]).toEqual({ exerciseId: 'seed-plank', sets: [{ weight: 0, reps: 60, done: true }] });
    expect(value!.newExercises).toEqual([
      expect.objectContaining({ name: 'Landmine Press (Barbell)', equipment: 'sztanga', custom: true, muscleGroup: 'inne' }),
    ]);
    expect(push.entries[2].exerciseId).toBe(value!.newExercises[0].id);
  });

  it('converts pounds when Strong was set to them', () => {
    const lb = importHistoryCsv(STRONG, empty, 'lb', NOW);
    expect(lb.ok && lb.value.workouts[1].entries[0].sets[0].weight).toBeCloseTo(45.359, 3);
  });

  it('skips workouts already in the app, so importing twice adds nothing', () => {
    const again = importHistoryCsv(STRONG, { exercises: SEED_EXERCISES, workouts: value!.workouts }, 'kg', NOW);
    expect(again.ok && [again.value.workouts.length, again.value.skipped]).toEqual([0, 2]);
  });
});

describe('importing a Hevy export', () => {
  it('reads its columns, set types and end time', () => {
    const result = importHistoryCsv(HEVY, empty, 'kg', NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const [w] = result.value.workouts;
    expect(result.value.source).toBe('hevy');
    expect(w).toMatchObject({ name: 'Upper', note: 'dobry dzień' });
    expect(Date.parse(w.finishedAt!) - Date.parse(w.startedAt)).toBe(50 * 60000);
    expect(w.entries[0].exerciseId).toBe('seed-lat-pulldown');
    expect(w.entries[0].sets.map((s) => [s.weight, s.reps, s.kind])).toEqual([
      [30, 12, 'warmup'],
      [60, 10, undefined],
      [45, 8, 'drop'],
    ]);
  });
});

describe('a file from elsewhere', () => {
  it('is refused with a message', () => {
    const result = importHistoryCsv('a,b\n1,2', empty, 'kg', NOW);
    expect(result.ok).toBe(false);
  });
});
