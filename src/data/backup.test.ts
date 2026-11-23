import { describe, expect, it } from 'vitest';
import { SEED_EXERCISES, SEED_PLANS } from '../domain/seed';
import type { AppData } from '../domain/types';
import { parseBackup, serializeBackup } from './backup';

const NOW = '2026-03-01T12:00:00.000Z';

const data: AppData = {
  exercises: SEED_EXERCISES.slice(0, 3),
  plans: [{ ...SEED_PLANS[0], items: [{ exerciseId: SEED_EXERCISES[0].id, targetSets: 3 }] }],
  workouts: [
    {
      id: 'w1',
      name: 'Push',
      startedAt: '2026-02-01T10:00:00.000Z',
      finishedAt: '2026-02-01T11:00:00.000Z',
      updatedAt: '2026-02-01T11:00:00.000Z',
      note: 'Dobry dzień',
      entries: [
        {
          exerciseId: SEED_EXERCISES[0].id,
          note: 'Za lekko',
          sets: [
            { weight: 40, reps: 10, done: true, kind: 'warmup' },
            { weight: 62.5, reps: 8, done: true },
          ],
        },
      ],
    },
  ],
  measurements: [{ id: 'm1', date: '2026-02-01', values: { weight: 82.4, waist: 88 }, updatedAt: '2026-02-01T08:00:00.000Z' }],
  goals: [
    { id: 'g1', kind: 'lift', exerciseId: SEED_EXERCISES[0].id, targetWeight: 100 },
    { id: 'g2', kind: 'frequency', perWeek: 3 },
  ],
  settings: {
    restSeconds: 120,
    restSound: false,
    schedule: [SEED_PLANS[0].id, null, null, null, null, null, null],
    unit: 'lb',
    lastBackupAt: '2026-02-01T08:00:00.000Z',
  },
};

/** Serialized backup with one change applied to its parsed form. */
function tampered(change: (file: any) => void): string {
  const file = JSON.parse(serializeBackup(data, NOW));
  change(file);
  return JSON.stringify(file);
}

describe('backup', () => {
  it('round-trips the data', () => {
    const result = parseBackup(serializeBackup(data, NOW));
    expect(result).toEqual({ ok: true, data });
  });

  it('records what and when it exported', () => {
    expect(JSON.parse(serializeBackup(data, NOW))).toMatchObject({ app: 'trening', version: 1, exportedAt: NOW });
  });

  it.each([
    ['not JSON', 'to nie jest json'],
    ['an empty object', '{}'],
    ['an array', '[]'],
    ['another app', tampered((f) => (f.app = 'inna'))],
    ['a newer version', tampered((f) => (f.version = 2))],
    ['missing workouts', tampered((f) => delete f.data.workouts)],
    ['a negative weight', tampered((f) => (f.data.workouts[0].entries[0].sets[0].weight = -5))],
    ['a text weight', tampered((f) => (f.data.workouts[0].entries[0].sets[0].weight = '60'))],
    ['an unknown exercise in a workout', tampered((f) => (f.data.workouts[0].entries[0].exerciseId = 'nope'))],
    ['an unknown muscle group', tampered((f) => (f.data.exercises[0].muscleGroup = 'łydki'))],
    ['an exercise without a name', tampered((f) => (f.data.exercises[0].name = ''))],
    ['a zero rest time', tampered((f) => (f.data.settings.restSeconds = 0))],
    [
      'two active workouts',
      tampered((f) => {
        const active = { ...f.data.workouts[0], finishedAt: undefined };
        f.data.workouts = [
          { ...active, id: 'a' },
          { ...active, id: 'b' },
        ];
      }),
    ],
  ])('rejects %s', (_label, text) => {
    const result = parseBackup(text);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.length).toBeGreaterThan(0);
  });
});

describe('reps in reserve in a backup', () => {
  it('keeps a valid value and drops a broken one', () => {
    const file = (rir: unknown) =>
      JSON.stringify({
        app: 'trening',
        version: 1,
        data: {
          exercises: [{ id: 'e', name: 'E', muscleGroup: 'klatka', equipment: 'sztanga' }],
          plans: [],
          workouts: [{ id: 'w', name: 'W', startedAt: '2026-01-01T10:00:00.000Z', finishedAt: '2026-01-01T11:00:00.000Z', entries: [{ exerciseId: 'e', sets: [{ weight: 50, reps: 5, done: true, rir }] }] }],
          settings: { restSeconds: 90 },
        },
      });
    const ok = parseBackup(file(2));
    const broken = parseBackup(file('dużo'));
    expect(ok.ok && ok.data.workouts[0].entries[0].sets[0].rir).toBe(2);
    expect(broken.ok && broken.data.workouts[0].entries[0].sets[0]).toEqual({ weight: 50, reps: 5, done: true });
  });
});

describe('a backup holding both apps', () => {
  it('restores its own part and says whether the nutrition diary is in it', () => {
    const own = JSON.parse(serializeBackup(data, NOW));
    const result = parseBackup(JSON.stringify({ app: 'komplet', version: 1, trening: own, jadlospis: { app: 'jadlospis', data: {} } }));
    expect(result.ok && result.combined).toEqual({ withNutrition: true });
    expect(result.ok && result.data.workouts).toHaveLength(1);
  });

  it('points a nutrition-only file to the other app', () => {
    const empty = parseBackup(JSON.stringify({ app: 'komplet', version: 1, trening: null, jadlospis: {} }));
    expect(empty.ok === false && empty.error).toMatch(/Treningu/);
    const diary = parseBackup(JSON.stringify({ app: 'jadlospis', version: 1, data: {} }));
    expect(diary.ok === false && diary.error).toMatch(/diety/);
  });
});

describe('a plan note', () => {
  it('survives a backup', () => {
    const withNote = { ...data, plans: [{ ...data.plans[0], note: 'W tym tygodniu +2,5 kg' }] };
    const result = parseBackup(serializeBackup(withNote, NOW));
    expect(result.ok && result.data.plans[0].note).toBe('W tym tygodniu +2,5 kg');
  });
});
