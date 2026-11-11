import { describe, expect, it } from 'vitest';
import { SEED_EXERCISES, SEED_PLANS } from './seed';
import type { Plan, Workout } from './types';
import { addEntry, addSet, createWorkout, finishWorkout, removeEntry, removeSet, updateSet } from './workout';

const NOW = '2026-02-01T10:00:00.000Z';
const LATER = '2026-02-01T11:00:00.000Z';

const plan: Plan = {
  id: 'p1',
  name: 'Push',
  items: [
    { exerciseId: 'bench', targetSets: 3 },
    { exerciseId: 'ohp', targetSets: 2 },
  ],
  createdAt: NOW,
  updatedAt: NOW,
};

const history: Workout[] = [
  {
    id: 'old',
    name: 'Push',
    startedAt: '2026-01-20T10:00:00.000Z',
    finishedAt: '2026-01-20T11:00:00.000Z',
    updatedAt: '2026-01-20T11:00:00.000Z',
    entries: [
      {
        exerciseId: 'bench',
        sets: [
          { weight: 80, reps: 8, done: true },
          { weight: 75, reps: 6, done: true },
        ],
      },
    ],
  },
];

describe('createWorkout', () => {
  it('creates an empty workout without a plan', () => {
    const w = createWorkout({ name: 'Trening', now: NOW, history: [] });
    expect(w).toMatchObject({ name: 'Trening', startedAt: NOW, updatedAt: NOW, entries: [] });
    expect(w.finishedAt).toBeUndefined();
    expect(w.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('prefills target sets from the last performance', () => {
    const w = createWorkout({ plan, name: plan.name, now: NOW, history });
    expect(w.planId).toBe('p1');
    expect(w.entries.map((e) => e.exerciseId)).toEqual(['bench', 'ohp']);
    expect(w.entries[0].sets).toEqual([
      { weight: 80, reps: 8, done: false },
      { weight: 75, reps: 6, done: false },
      { weight: 75, reps: 6, done: false },
    ]);
    expect(w.entries[1].sets).toEqual([
      { weight: 0, reps: 0, done: false },
      { weight: 0, reps: 0, done: false },
    ]);
  });

  it('still starts when the plan references an unknown exercise', () => {
    const odd: Plan = { ...plan, items: [{ exerciseId: 'gone', targetSets: 1 }] };
    expect(createWorkout({ plan: odd, name: 'x', now: NOW, history }).entries).toHaveLength(1);
  });
});

describe('editing', () => {
  const base = createWorkout({ name: 'Trening', now: NOW, history });

  it('addEntry adds one set prefilled from history, without mutating', () => {
    const w = addEntry(base, 'bench', history);
    expect(base.entries).toHaveLength(0);
    expect(w.entries[0]).toEqual({ exerciseId: 'bench', sets: [{ weight: 80, reps: 8, done: false }] });
  });

  it('addSet copies the previous set and is not done', () => {
    let w = addEntry(base, 'bench', history);
    w = updateSet(w, 0, 0, { weight: 82.5, reps: 5, done: true });
    w = addSet(w, 0);
    expect(w.entries[0].sets[1]).toEqual({ weight: 82.5, reps: 5, done: false });
  });

  it('updateSet, removeSet and removeEntry change only their target', () => {
    let w = addEntry(addEntry(base, 'bench', history), 'ohp', history);
    w = addSet(w, 0);
    w = updateSet(w, 0, 1, { reps: 3 });
    expect(w.entries[0].sets.map((s) => s.reps)).toEqual([8, 3]);
    w = removeSet(w, 0, 0);
    expect(w.entries[0].sets).toHaveLength(1);
    w = removeEntry(w, 0);
    expect(w.entries.map((e) => e.exerciseId)).toEqual(['ohp']);
  });
});

describe('finishWorkout', () => {
  it('drops sets that are not done and entries left empty', () => {
    let w = createWorkout({ plan, name: plan.name, now: NOW, history });
    w = updateSet(w, 0, 0, { done: true });
    const done = finishWorkout(w, LATER);
    expect(done?.finishedAt).toBe(LATER);
    expect(done?.updatedAt).toBe(LATER);
    expect(done?.entries).toEqual([{ exerciseId: 'bench', sets: [{ weight: 80, reps: 8, done: true }] }]);
  });

  it('returns null when nothing was done', () => {
    expect(finishWorkout(createWorkout({ plan, name: plan.name, now: NOW, history }), LATER)).toBeNull();
  });
});

describe('seed data', () => {
  it('has unique exercise ids and plans that reference existing exercises', () => {
    const ids = SEED_EXERCISES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThanOrEqual(55);
    expect(SEED_PLANS.map((p) => p.name)).toEqual(['Push', 'Pull', 'Legs']);
    for (const p of SEED_PLANS) for (const i of p.items) expect(ids).toContain(i.exerciseId);
  });
});
