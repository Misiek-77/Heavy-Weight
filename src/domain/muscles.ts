import type { ExerciseGuide } from './guides';

/** Areas of the body drawn on the muscle map. */
export const REGIONS = [
  'chestUpper',
  'chestLower',
  'deltFront',
  'deltBack',
  'traps',
  'midBack',
  'lats',
  'lowerBack',
  'biceps',
  'triceps',
  'forearms',
  'abs',
  'obliques',
  'hipFlexors',
  'glutes',
  'quads',
  'hamstrings',
  'calves',
] as const;
export type Region = (typeof REGIONS)[number];

/** Which map regions each muscle name used in the guides lights up. */
const MUSCLE_REGIONS: Record<string, Region[]> = {
  'klatka piersiowa': ['chestUpper', 'chestLower'],
  'górna część klatki': ['chestUpper'],
  barki: ['deltFront', 'deltBack'],
  'przednie barki': ['deltFront'],
  'boczne barki': ['deltFront', 'deltBack'],
  'tylne barki': ['deltBack'],
  'rotatory barku': ['deltBack'],
  czworoboczny: ['traps'],
  'czworoboczny (góra)': ['traps'],
  'środek pleców': ['midBack'],
  'górna część pleców': ['traps', 'midBack'],
  'najszerszy grzbietu': ['lats'],
  'prostowniki grzbietu': ['lowerBack'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  przedramiona: ['forearms'],
  'ramienno-promieniowy': ['forearms'],
  brzuch: ['abs'],
  'skośne brzucha': ['obliques'],
  'zginacze bioder': ['hipFlexors'],
  pośladki: ['glutes'],
  'czworogłowe uda': ['quads'],
  'tył ud': ['hamstrings'],
  łydki: ['calves'],
  'łydki (płaszczkowaty)': ['calves'],
};

export const regionsOf = (muscle: string): Region[] => MUSCLE_REGIONS[muscle] ?? [];

export type Involvement = 'primary' | 'secondary';

/** How strongly each region works in an exercise; primary wins when a region is named twice. */
export function involvement(guide: Pick<ExerciseGuide, 'primary' | 'secondary'>): Partial<Record<Region, Involvement>> {
  const result: Partial<Record<Region, Involvement>> = {};
  for (const muscle of guide.secondary) for (const region of regionsOf(muscle)) result[region] = 'secondary';
  for (const muscle of guide.primary) for (const region of regionsOf(muscle)) result[region] = 'primary';
  return result;
}
