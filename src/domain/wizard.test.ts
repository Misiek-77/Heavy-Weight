import { describe, expect, it } from 'vitest';
import { SEED_EXERCISES } from './seed';
import type { Plan } from './types';
import { WIZARD_DAYS, WIZARD_GOALS, generatePlans, planForDay, weekdayIndex } from './wizard';

const NOW = '2026-03-18T10:00:00.000Z';
const ids = new Set(SEED_EXERCISES.map((e) => e.id));

describe('generatePlans', () => {
  it('builds one plan per training day from built-in exercises, for every option', () => {
    for (const days of WIZARD_DAYS) {
      for (const goal of WIZARD_GOALS) {
        const { plans, schedule } = generatePlans(days, goal, [], NOW);
        expect(plans).toHaveLength(days);
        expect(schedule).toHaveLength(7);
        expect(schedule.filter(Boolean)).toEqual(plans.map((p) => p.id));
        for (const p of plans) {
          expect(p.items.length).toBeGreaterThanOrEqual(5);
          expect(p.items.every((i) => ids.has(i.exerciseId) && i.targetSets > 0 && i.repMin! <= i.repMax!), p.name).toBe(true);
        }
      }
    }
  });

  it('uses heavier, lower-rep work for strength than for general fitness', () => {
    const first = (goal: 'strength' | 'fitness') => generatePlans(3, goal, [], NOW).plans[0].items[0];
    expect(first('strength')).toMatchObject({ exerciseId: 'seed-squat', targetSets: 4, repMin: 4, repMax: 6 });
    expect(first('fitness')).toMatchObject({ targetSets: 3, repMin: 10, repMax: 12 });
  });

  it('gives timed exercises a hold in seconds', () => {
    const plank = generatePlans(3, 'strength', [], NOW).plans[0].items.find((i) => i.exerciseId === 'seed-plank');
    expect(plank).toMatchObject({ repMin: 30, repMax: 60 });
  });

  it('spreads three days over Monday, Wednesday and Friday', () => {
    const { plans, schedule } = generatePlans(3, 'muscle', [], NOW);
    expect(schedule).toEqual([plans[0].id, null, plans[1].id, null, plans[2].id, null, null]);
  });

  it('renames plans whose names are already taken', () => {
    const existing = [{ name: 'FBW A' }, { name: 'fbw a 2' }] as Plan[];
    expect(generatePlans(2, 'muscle', existing, NOW).plans.map((p) => p.name)).toEqual(['FBW A 3', 'FBW B']);
  });
});

describe('schedule', () => {
  const plans = [{ id: 'a', name: 'A' }] as Plan[];

  it('counts weekdays from Monday', () => {
    expect(weekdayIndex(new Date(2026, 2, 16))).toBe(0);
    expect(weekdayIndex(new Date(2026, 2, 22))).toBe(6);
  });

  it("finds today's plan and ignores rest days and deleted plans", () => {
    const wednesday = new Date(2026, 2, 18);
    expect(planForDay([null, null, 'a', null, null, null, null], plans, wednesday)?.name).toBe('A');
    expect(planForDay([null, null, null, null, null, null, null], plans, wednesday)).toBeUndefined();
    expect(planForDay([null, null, 'gone', null, null, null, null], plans, wednesday)).toBeUndefined();
  });
});
