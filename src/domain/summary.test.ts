import { describe, expect, it } from 'vitest';
import { plateLoad } from './plates';
import { SEED_EXERCISES } from './seed';
import { dayKey, monthGrid, muscleLoad, startOfWeek, summarize, trainingDays, weeklyLoad } from './summary';
import { PLAN_TEMPLATES, plansFromTemplate } from './templates';
import type { Exercise, Workout, WorkoutSet } from './types';

/** A finished workout started at local noon on the given day. */
function workout(day: Date, sets: WorkoutSet[] = [{ weight: 100, reps: 5, done: true }], exerciseId = 'bench'): Workout {
  const startedAt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 12).toISOString();
  return { id: startedAt + exerciseId, name: 'T', startedAt, finishedAt: startedAt, updatedAt: startedAt, entries: [{ exerciseId, sets }] };
}

// Wednesday.
const NOW = new Date(2026, 2, 18, 15);
const day = (d: number, month = 2) => new Date(2026, month, d);

describe('summarize', () => {
  it('starts weeks on Monday', () => {
    expect(dayKey(startOfWeek(NOW))).toBe('2026-03-16');
    expect(dayKey(startOfWeek(day(22)))).toBe('2026-03-16');
  });

  it('counts workouts and volume in this week, this month and overall', () => {
    const s = summarize([workout(day(17)), workout(day(16)), workout(day(2)), workout(day(20, 1))], NOW);
    expect(s.week).toEqual({ workouts: 2, volume: 1000 });
    expect(s.month).toEqual({ workouts: 3, volume: 1500 });
    expect(s.allTime).toEqual({ workouts: 4, volume: 2000 });
  });

  it('ignores the workout in progress', () => {
    const active = { ...workout(day(17)), finishedAt: undefined };
    expect(summarize([active], NOW).allTime.workouts).toBe(0);
  });

  it('counts consecutive weeks back from this week', () => {
    expect(summarize([workout(day(17)), workout(day(10)), workout(day(3))], NOW).weekStreak).toBe(3);
  });

  it('keeps the streak when this week has no workout yet, but not after a skipped week', () => {
    expect(summarize([workout(day(10)), workout(day(3))], NOW).weekStreak).toBe(2);
    expect(summarize([workout(day(3))], NOW).weekStreak).toBe(0);
    expect(summarize([workout(day(17)), workout(day(3))], NOW).weekStreak).toBe(1);
  });
});

describe('calendar', () => {
  it('lists days that have a finished workout', () => {
    expect([...trainingDays([workout(day(17)), workout(day(17)), workout(day(2))])].sort()).toEqual(['2026-03-02', '2026-03-17']);
  });

  it('builds whole Monday-to-Sunday weeks around the month', () => {
    const { weeks } = monthGrid(NOW, 0);
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    // March 2026 starts on a Sunday, so the first row is mostly February.
    expect(weeks[0][0]).toEqual({ key: '2026-02-23', day: 23, inMonth: false });
    expect(weeks[0][6]).toEqual({ key: '2026-03-01', day: 1, inMonth: true });
    expect(weeks.flat().filter((d) => d.inMonth)).toHaveLength(31);
    expect(weeks.at(-1)!.some((d) => d.inMonth)).toBe(true);
  });

  it('moves between months, across the year boundary', () => {
    expect(monthGrid(NOW, -3).first.getFullYear()).toBe(2025);
    expect(monthGrid(NOW, -3).first.getMonth()).toBe(11);
  });
});

describe('muscleLoad', () => {
  const exercises = [
    { id: 'bench', muscleGroup: 'klatka' },
    { id: 'squat', muscleGroup: 'nogi' },
  ] as Exercise[];

  it('adds up working sets per muscle group within the period', () => {
    const load = muscleLoad(
      [
        workout(day(17), [
          { weight: 40, reps: 10, done: true, kind: 'warmup' },
          { weight: 100, reps: 5, done: true },
          { weight: 100, reps: 5, done: false },
        ]),
        workout(day(16), [{ weight: 120, reps: 5, done: true }], 'squat'),
        workout(day(1, 0), [{ weight: 100, reps: 5, done: true }]),
      ],
      exercises,
      NOW,
      28,
    );
    expect(load.find((l) => l.group === 'klatka')).toEqual({ group: 'klatka', sets: 1, volume: 500 });
    expect(load.find((l) => l.group === 'nogi')).toEqual({ group: 'nogi', sets: 1, volume: 600 });
    expect(load.find((l) => l.group === 'plecy')?.sets).toBe(0);
  });

  it('files exercises it does not know under "inne"', () => {
    const load = muscleLoad([workout(day(17), undefined, 'gone')], exercises, NOW, 28);
    expect(load.find((l) => l.group === 'inne')?.sets).toBe(1);
  });
});

describe('plateLoad', () => {
  it('loads the fewest plates per side', () => {
    expect(plateLoad(100, 20)).toEqual({ perSide: [25, 15], loaded: 100, missing: 0 });
    expect(plateLoad(62.5, 20)).toEqual({ perSide: [20, 1.25], loaded: 62.5, missing: 0 });
  });
  it('is empty for the bare bar or less', () => {
    expect(plateLoad(20, 20).perSide).toEqual([]);
    expect(plateLoad(10, 20)).toEqual({ perSide: [], loaded: 20, missing: 0 });
  });
  it('reports what cannot be made up', () => {
    expect(plateLoad(61, 20)).toEqual({ perSide: [20], loaded: 60, missing: 1 });
  });
});

describe('plan templates', () => {
  const ids = new Set(SEED_EXERCISES.map((e) => e.id));

  it('reference only built-in exercises', () => {
    for (const t of PLAN_TEMPLATES) {
      for (const p of plansFromTemplate(t, [], '2026-03-18T10:00:00.000Z')) {
        expect(p.items.every((i) => ids.has(i.exerciseId) && i.targetSets > 0), p.name).toBe(true);
      }
    }
  });

  it('skip plans the lifter already has and keep the template order', () => {
    const fbw = PLAN_TEMPLATES[0];
    const all = plansFromTemplate(fbw, [], '2026-03-18T10:00:00.000Z');
    expect(all.map((p) => p.name)).toEqual(['FBW A', 'FBW B']);
    expect(all[0].createdAt < all[1].createdAt).toBe(true);
    expect(plansFromTemplate(fbw, [all[0]], '2026-03-18T10:00:00.000Z').map((p) => p.name)).toEqual(['FBW B']);
  });
});

describe('weekly load', () => {
  const ex = (id: string, muscleGroup: 'klatka' | 'nogi'): Exercise => ({ id, name: id, muscleGroup, equipment: 'sztanga', custom: false, archived: false, updatedAt: '' });
  const exercises = [ex('bench', 'klatka'), ex('squat', 'nogi')];
  const at = (y: number, m: number, d: number, entries: Workout['entries']): Workout => {
    const iso = new Date(y, m, d, 18).toISOString();
    return { id: iso, name: 'x', startedAt: iso, finishedAt: iso, updatedAt: iso, entries };
  };
  const workouts = [
    // Wednesday 18 Nov 2026 (this week)
    at(2026, 10, 18, [
      { exerciseId: 'bench', sets: [{ weight: 40, reps: 10, done: true, kind: 'warmup' }, { weight: 80, reps: 5, done: true }, { weight: 80, reps: 5, done: false }] },
      { exerciseId: 'squat', sets: [{ weight: 100, reps: 5, done: true }] },
    ]),
    // Monday 2 Nov 2026 (two weeks back)
    at(2026, 10, 2, [{ exerciseId: 'bench', sets: [{ weight: 70, reps: 10, done: true }] }]),
    // Long ago: outside the window
    at(2026, 0, 5, [{ exerciseId: 'bench', sets: [{ weight: 60, reps: 10, done: true }] }]),
  ];
  const now = new Date(2026, 10, 20, 12);

  it('lists every week oldest first, with empty weeks as zeros', () => {
    expect(weeklyLoad(workouts, exercises, now, 3, null)).toEqual([
      { week: '2026-11-02', sets: 1, volume: 700 },
      { week: '2026-11-09', sets: 0, volume: 0 },
      { week: '2026-11-16', sets: 2, volume: 900 },
    ]);
  });

  it('counts only the chosen muscle group', () => {
    expect(weeklyLoad(workouts, exercises, now, 1, 'nogi')).toEqual([{ week: '2026-11-16', sets: 1, volume: 500 }]);
  });
});
