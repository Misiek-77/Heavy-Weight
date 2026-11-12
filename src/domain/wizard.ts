import { newId } from './id';
import { TIMED_SEEDS } from './seed';
import type { Plan, PlanItem } from './types';

export const WIZARD_GOALS = ['strength', 'muscle', 'fitness'] as const;
export type WizardGoal = (typeof WIZARD_GOALS)[number];
export const WIZARD_DAYS = [2, 3, 4, 5, 6] as const;

/** Sets and rep range for the main lifts (`c`ompound) and the lighter work after them (`a`ccessory). */
const SCHEMES: Record<WizardGoal, Record<'c' | 'a', [sets: number, repMin: number, repMax: number]>> = {
  strength: { c: [4, 4, 6], a: [3, 8, 10] },
  muscle: { c: [4, 8, 10], a: [3, 10, 12] },
  fitness: { c: [3, 10, 12], a: [2, 12, 15] },
};
/** Timed exercises get a hold in seconds whatever the goal. */
const TIMED_SCHEME: [number, number, number] = [3, 30, 60];

type Slot = [exercise: string, role: 'c' | 'a'];
const DAYS: Record<string, Slot[]> = {
  'FBW A': [['squat', 'c'], ['bench-press', 'c'], ['barbell-row', 'c'], ['overhead-press', 'a'], ['barbell-curl', 'a'], ['plank', 'a']],
  'FBW B': [['deadlift', 'c'], ['incline-db-press', 'c'], ['lat-pulldown', 'c'], ['lunge', 'a'], ['triceps-pushdown', 'a'], ['hanging-leg-raise', 'a']],
  'FBW C': [['leg-press', 'c'], ['db-bench-press', 'c'], ['seated-cable-row', 'c'], ['lateral-raise', 'a'], ['hammer-curl', 'a'], ['cable-crunch', 'a']],
  'Góra A': [['bench-press', 'c'], ['barbell-row', 'c'], ['overhead-press', 'c'], ['lat-pulldown', 'a'], ['barbell-curl', 'a'], ['triceps-pushdown', 'a']],
  'Dół A': [['squat', 'c'], ['romanian-deadlift', 'c'], ['leg-press', 'a'], ['leg-curl', 'a'], ['standing-calf-raise', 'a'], ['cable-crunch', 'a']],
  'Góra B': [['incline-db-press', 'c'], ['pull-up', 'c'], ['db-shoulder-press', 'c'], ['seated-cable-row', 'a'], ['lateral-raise', 'a'], ['hammer-curl', 'a'], ['skull-crusher', 'a']],
  'Dół B': [['deadlift', 'c'], ['bulgarian-split-squat', 'c'], ['hip-thrust', 'a'], ['leg-extension', 'a'], ['seated-calf-raise', 'a'], ['hanging-leg-raise', 'a']],
  'Push A': [['bench-press', 'c'], ['overhead-press', 'c'], ['incline-db-press', 'a'], ['lateral-raise', 'a'], ['triceps-pushdown', 'a']],
  'Pull A': [['deadlift', 'c'], ['pull-up', 'c'], ['barbell-row', 'a'], ['face-pull', 'a'], ['barbell-curl', 'a']],
  'Legs A': [['squat', 'c'], ['romanian-deadlift', 'c'], ['leg-press', 'a'], ['leg-curl', 'a'], ['standing-calf-raise', 'a']],
  'Push B': [['db-shoulder-press', 'c'], ['db-bench-press', 'c'], ['cable-fly', 'a'], ['cable-lateral-raise', 'a'], ['overhead-triceps-extension', 'a']],
  'Pull B': [['barbell-row', 'c'], ['lat-pulldown', 'c'], ['seated-cable-row', 'a'], ['rear-delt-fly', 'a'], ['hammer-curl', 'a']],
  'Legs B': [['front-squat', 'c'], ['hip-thrust', 'c'], ['leg-extension', 'a'], ['leg-curl', 'a'], ['seated-calf-raise', 'a']],
};

/** Which days to train and what to do on them, by number of training days. Weekdays count from Monday = 0. */
const SPLITS: Record<number, { plans: string[]; weekdays: number[] }> = {
  2: { plans: ['FBW A', 'FBW B'], weekdays: [0, 3] },
  3: { plans: ['FBW A', 'FBW B', 'FBW C'], weekdays: [0, 2, 4] },
  4: { plans: ['Góra A', 'Dół A', 'Góra B', 'Dół B'], weekdays: [0, 1, 3, 4] },
  5: { plans: ['Push A', 'Pull A', 'Legs A', 'Góra B', 'Dół B'], weekdays: [0, 1, 2, 4, 5] },
  6: { plans: ['Push A', 'Pull A', 'Legs A', 'Push B', 'Pull B', 'Legs B'], weekdays: [0, 1, 2, 3, 4, 5] },
};

export interface WizardResult {
  plans: Plan[];
  /** Plan id for each weekday from Monday; null on rest days. */
  schedule: (string | null)[];
}

/** A name not used yet: "Góra A", then "Góra A 2", "Góra A 3"… */
function freeName(name: string, taken: Set<string>): string {
  let candidate = name;
  for (let n = 2; taken.has(candidate.toLowerCase()); n++) candidate = `${name} ${n}`;
  taken.add(candidate.toLowerCase());
  return candidate;
}

/** Builds a week of plans from the built-in exercises for the given number of days and goal. */
export function generatePlans(days: number, goal: WizardGoal, existing: Plan[], now: string): WizardResult {
  const split = SPLITS[days] ?? SPLITS[3];
  const taken = new Set(existing.map((p) => p.name.trim().toLowerCase()));
  const plans = split.plans.map((day, i): Plan => {
    const createdAt = new Date(Date.parse(now) + i).toISOString();
    return {
      id: newId(),
      name: freeName(day, taken),
      items: DAYS[day].map(([exercise, role]): PlanItem => {
        const exerciseId = `seed-${exercise}`;
        const [targetSets, repMin, repMax] = TIMED_SEEDS.has(exerciseId) ? TIMED_SCHEME : SCHEMES[goal][role];
        return { exerciseId, targetSets, repMin, repMax };
      }),
      createdAt,
      updatedAt: createdAt,
    };
  });
  const schedule: (string | null)[] = Array(7).fill(null);
  split.weekdays.forEach((weekday, i) => (schedule[weekday] = plans[i].id));
  return { plans, schedule };
}

/** Index of `date`'s weekday counted from Monday = 0. */
export const weekdayIndex = (date: Date) => (date.getDay() + 6) % 7;

/** The plan scheduled for `date`, if there is one and it still exists. */
export function planForDay(schedule: (string | null)[], plans: Plan[], date: Date): Plan | undefined {
  const id = schedule[weekdayIndex(date)];
  return id ? plans.find((p) => p.id === id) : undefined;
}
