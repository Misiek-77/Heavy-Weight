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
  settings: { restSeconds: 120, restSound: false },
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
