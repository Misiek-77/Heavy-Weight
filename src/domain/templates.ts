import { newId } from './id';
import type { Plan } from './types';

export interface PlanTemplate {
  id: string;
  name: string;
  /** Who it suits and how to run it. */
  description: string;
  plans: { name: string; items: [exercise: string, targetSets: number][] }[];
}

/** Ready-made programmes. Exercise keys are built-in exercise ids without the `seed-` prefix. */
export const PLAN_TEMPLATES: PlanTemplate[] = [
  {
    id: 'fbw',
    name: 'FBW — całe ciało, 3 dni',
    description: 'Dla początkujących. Trenuj co drugi dzień, na zmianę A i B (np. pon. A, śr. B, pt. A).',
    plans: [
      {
        name: 'FBW A',
        items: [
          ['squat', 3],
          ['bench-press', 3],
          ['barbell-row', 3],
          ['overhead-press', 2],
          ['barbell-curl', 2],
          ['plank', 3],
        ],
      },
      {
        name: 'FBW B',
        items: [
          ['deadlift', 3],
          ['incline-db-press', 3],
          ['lat-pulldown', 3],
          ['lunge', 2],
          ['triceps-pushdown', 2],
          ['hanging-leg-raise', 3],
        ],
      },
    ],
  },
  {
    id: 'upper-lower',
    name: 'Góra / Dół, 4 dni',
    description: 'Dla średnio zaawansowanych. Np. pon. Góra A, wt. Dół A, czw. Góra B, pt. Dół B.',
    plans: [
      {
        name: 'Góra A',
        items: [
          ['bench-press', 4],
          ['barbell-row', 4],
          ['overhead-press', 3],
          ['lat-pulldown', 3],
          ['barbell-curl', 3],
          ['triceps-pushdown', 3],
        ],
      },
      {
        name: 'Dół A',
        items: [
          ['squat', 4],
          ['romanian-deadlift', 3],
          ['leg-press', 3],
          ['leg-curl', 3],
          ['standing-calf-raise', 4],
          ['cable-crunch', 3],
        ],
      },
      {
        name: 'Góra B',
        items: [
          ['incline-db-press', 4],
          ['pull-up', 4],
          ['db-shoulder-press', 3],
          ['seated-cable-row', 3],
          ['lateral-raise', 3],
          ['hammer-curl', 3],
          ['skull-crusher', 3],
        ],
      },
      {
        name: 'Dół B',
        items: [
          ['deadlift', 3],
          ['bulgarian-split-squat', 3],
          ['hip-thrust', 3],
          ['leg-extension', 3],
          ['seated-calf-raise', 4],
          ['hanging-leg-raise', 3],
        ],
      },
    ],
  },
  {
    id: 'ppl',
    name: 'Push / Pull / Legs, 3–6 dni',
    description: 'Pchanie, ciągnięcie, nogi. Jedna runda to 3 dni; zaawansowani robią dwie rundy w tygodniu.',
    plans: [
      {
        name: 'Push',
        items: [
          ['bench-press', 4],
          ['overhead-press', 3],
          ['incline-db-press', 3],
          ['lateral-raise', 3],
          ['triceps-pushdown', 3],
        ],
      },
      {
        name: 'Pull',
        items: [
          ['deadlift', 3],
          ['pull-up', 3],
          ['barbell-row', 3],
          ['face-pull', 3],
          ['barbell-curl', 3],
        ],
      },
      {
        name: 'Legs',
        items: [
          ['squat', 4],
          ['romanian-deadlift', 3],
          ['leg-press', 3],
          ['leg-curl', 3],
          ['standing-calf-raise', 4],
        ],
      },
    ],
  },
];

/**
 * The template's plans as new plans, skipping any whose name the lifter already has.
 * `now` spaces the creation times so the plans keep the template's order in the list.
 */
export function plansFromTemplate(template: PlanTemplate, existing: Plan[], now: string): Plan[] {
  const taken = new Set(existing.map((p) => p.name.trim().toLowerCase()));
  return template.plans
    .filter((p) => !taken.has(p.name.toLowerCase()))
    .map((p, i) => {
      const createdAt = new Date(Date.parse(now) + i).toISOString();
      return {
        id: newId(),
        name: p.name,
        items: p.items.map(([exercise, targetSets]) => ({ exerciseId: `seed-${exercise}`, targetSets })),
        createdAt,
        updatedAt: createdAt,
      };
    });
}
