import type { Equipment, Exercise, MuscleGroup, Plan } from './types';

const SEEDED_AT = '2026-01-01T00:00:00.000Z';

const LIST: [id: string, name: string, muscleGroup: MuscleGroup, equipment: Equipment][] = [
  ['bench-press', 'Wyciskanie sztangi na ławce poziomej', 'klatka', 'sztanga'],
  ['incline-bench-press', 'Wyciskanie sztangi na skosie dodatnim', 'klatka', 'sztanga'],
  ['db-bench-press', 'Wyciskanie hantli na ławce poziomej', 'klatka', 'hantle'],
  ['incline-db-press', 'Wyciskanie hantli na skosie dodatnim', 'klatka', 'hantle'],
  ['db-fly', 'Rozpiętki z hantlami', 'klatka', 'hantle'],
  ['cable-fly', 'Rozpiętki na wyciągu', 'klatka', 'wyciąg'],
  ['pec-deck', 'Butterfly na maszynie', 'klatka', 'maszyna'],
  ['chest-press-machine', 'Wyciskanie na maszynie', 'klatka', 'maszyna'],
  ['push-up', 'Pompki', 'klatka', 'masa ciała'],
  ['dip', 'Pompki na poręczach', 'klatka', 'masa ciała'],

  ['deadlift', 'Martwy ciąg', 'plecy', 'sztanga'],
  ['pull-up', 'Podciąganie nachwytem', 'plecy', 'masa ciała'],
  ['chin-up', 'Podciąganie podchwytem', 'plecy', 'masa ciała'],
  ['barbell-row', 'Wiosłowanie sztangą w opadzie nachwytem', 'plecy', 'sztanga'],
  ['underhand-barbell-row', 'Wiosłowanie sztangą w opadzie podchwytem', 'plecy', 'sztanga'],
  ['db-row', 'Wiosłowanie hantlą jednorącz', 'plecy', 'hantle'],
  ['lat-pulldown', 'Ściąganie drążka wyciągu górnego', 'plecy', 'wyciąg'],
  ['close-grip-pulldown', 'Ściąganie drążka wąskim chwytem', 'plecy', 'wyciąg'],
  ['db-pullover', 'Pullover z hantlą', 'plecy', 'hantle'],
  ['sumo-deadlift', 'Martwy ciąg sumo', 'plecy', 'sztanga'],
  ['seated-cable-row', 'Przyciąganie uchwytu wyciągu dolnego', 'plecy', 'wyciąg'],
  ['t-bar-row', 'Wiosłowanie końcem sztangi', 'plecy', 'sztanga'],
  ['machine-row', 'Wiosłowanie na maszynie', 'plecy', 'maszyna'],
  ['straight-arm-pulldown', 'Ściąganie drążka prostymi rękami', 'plecy', 'wyciąg'],
  ['back-extension', 'Prostowanie tułowia na ławce rzymskiej', 'plecy', 'masa ciała'],
  ['shrug', 'Szrugsy z hantlami', 'plecy', 'hantle'],

  ['squat', 'Przysiad ze sztangą', 'nogi', 'sztanga'],
  ['front-squat', 'Przysiad przedni', 'nogi', 'sztanga'],
  ['leg-press', 'Wypychanie na suwnicy', 'nogi', 'maszyna'],
  ['romanian-deadlift', 'Martwy ciąg rumuński', 'nogi', 'sztanga'],
  ['good-morning', 'Skłony ze sztangą („dzień dobry”)', 'nogi', 'sztanga'],
  ['lunge', 'Wykroki z hantlami', 'nogi', 'hantle'],
  ['bulgarian-split-squat', 'Przysiad bułgarski', 'nogi', 'hantle'],
  ['goblet-squat', 'Przysiad goblet', 'nogi', 'hantle'],
  ['hack-squat', 'Hack przysiad', 'nogi', 'maszyna'],
  ['leg-extension', 'Prostowanie nóg na maszynie', 'nogi', 'maszyna'],
  ['leg-curl', 'Uginanie nóg na maszynie', 'nogi', 'maszyna'],
  ['hip-thrust', 'Hip thrust', 'nogi', 'sztanga'],
  ['standing-calf-raise', 'Wspięcia na palce stojąc', 'nogi', 'maszyna'],
  ['seated-calf-raise', 'Wspięcia na palce siedząc', 'nogi', 'maszyna'],

  ['overhead-press', 'Wyciskanie żołnierskie', 'barki', 'sztanga'],
  ['db-shoulder-press', 'Wyciskanie hantli nad głowę', 'barki', 'hantle'],
  ['arnold-press', 'Arnoldki', 'barki', 'hantle'],
  ['lateral-raise', 'Unoszenie hantli bokiem', 'barki', 'hantle'],
  ['cable-lateral-raise', 'Unoszenie ramienia bokiem na wyciągu', 'barki', 'wyciąg'],
  ['front-raise', 'Unoszenie hantli w przód', 'barki', 'hantle'],
  ['rear-delt-fly', 'Odwrotne rozpiętki', 'barki', 'hantle'],
  ['reverse-pec-deck', 'Odwrotne rozpiętki na maszynie', 'barki', 'maszyna'],
  ['face-pull', 'Face pull', 'barki', 'wyciąg'],
  ['upright-row', 'Podciąganie sztangi wzdłuż tułowia', 'barki', 'sztanga'],

  ['barbell-curl', 'Uginanie ramion ze sztangą', 'biceps', 'sztanga'],
  ['ez-bar-curl', 'Uginanie ramion ze sztangą łamaną', 'biceps', 'sztanga'],
  ['concentration-curl', 'Uginanie koncentryczne', 'biceps', 'hantle'],
  ['cable-hammer-curl', 'Uginanie młotkowe z liną na wyciągu', 'biceps', 'wyciąg'],
  ['db-curl', 'Uginanie ramion z hantlami', 'biceps', 'hantle'],
  ['hammer-curl', 'Uginanie młotkowe', 'biceps', 'hantle'],
  ['preacher-curl', 'Uginanie ramion na modlitewniku', 'biceps', 'sztanga'],
  ['cable-curl', 'Uginanie ramion na wyciągu', 'biceps', 'wyciąg'],
  ['incline-db-curl', 'Uginanie ramion na ławce skośnej', 'biceps', 'hantle'],

  ['triceps-pushdown', 'Prostowanie ramion na wyciągu', 'triceps', 'wyciąg'],
  ['skull-crusher', 'Wyciskanie francuskie leżąc', 'triceps', 'sztanga'],
  ['overhead-triceps-extension', 'Wyciskanie francuskie hantlą nad głową', 'triceps', 'hantle'],
  ['close-grip-bench-press', 'Wyciskanie sztangi wąskim chwytem', 'triceps', 'sztanga'],
  ['bench-dip', 'Pompki w podporze tyłem', 'triceps', 'masa ciała'],
  ['triceps-kickback', 'Prostowanie ramienia w opadzie (kickback)', 'triceps', 'hantle'],
  ['rope-overhead-extension', 'Prostowanie ramion z liną nad głową', 'triceps', 'wyciąg'],

  ['plank', 'Deska', 'brzuch', 'masa ciała'],
  ['side-plank', 'Deska boczna', 'brzuch', 'masa ciała'],
  ['crunch', 'Spięcia brzucha', 'brzuch', 'masa ciała'],
  ['hanging-leg-raise', 'Unoszenie nóg w zwisie', 'brzuch', 'masa ciała'],
  ['cable-crunch', 'Allahy na wyciągu', 'brzuch', 'wyciąg'],
  ['russian-twist', 'Russian twist', 'brzuch', 'masa ciała'],
  ['ab-wheel', 'Kółko do brzucha', 'brzuch', 'inne'],

  ['farmer-walk', 'Spacer farmera', 'inne', 'hantle'],
  ['kettlebell-swing', 'Swing z kettlem', 'inne', 'inne'],
];

/** Built-in exercises held for time instead of counted in repetitions. */
export const TIMED_SEEDS: ReadonlySet<string> = new Set(['seed-plank', 'seed-side-plank', 'seed-farmer-walk']);

export const SEED_EXERCISES: Exercise[] = LIST.map(([id, name, muscleGroup, equipment]) => ({
  id: `seed-${id}`,
  name,
  muscleGroup,
  equipment,
  custom: false,
  archived: false,
  ...(TIMED_SEEDS.has(`seed-${id}`) ? { timed: true } : {}),
  updatedAt: SEEDED_AT,
}));

/** `order` keeps the seeded plans in their intended sequence, since plans are listed oldest first. */
function plan(order: number, id: string, name: string, items: [exercise: string, targetSets: number][]): Plan {
  const createdAt = new Date(Date.parse(SEEDED_AT) + order * 1000).toISOString();
  return {
    id: `seed-plan-${id}`,
    name,
    items: items.map(([exercise, targetSets]) => ({ exerciseId: `seed-${exercise}`, targetSets })),
    createdAt,
    updatedAt: createdAt,
  };
}

export const SEED_PLANS: Plan[] = [
  plan(0, 'push', 'Push', [
    ['bench-press', 4],
    ['overhead-press', 3],
    ['incline-db-press', 3],
    ['lateral-raise', 3],
    ['triceps-pushdown', 3],
  ]),
  plan(1, 'pull', 'Pull', [
    ['deadlift', 3],
    ['pull-up', 3],
    ['barbell-row', 3],
    ['face-pull', 3],
    ['barbell-curl', 3],
  ]),
  plan(2, 'legs', 'Legs', [
    ['squat', 4],
    ['romanian-deadlift', 3],
    ['leg-press', 3],
    ['leg-curl', 3],
    ['standing-calf-raise', 4],
  ]),
];

/** Names built-in exercises had before they were renamed, so an untouched old name can be updated. */
const FORMER_NAMES: Record<string, string> = {
  'seed-barbell-row': 'Wiosłowanie sztangą w opadzie',
};

/**
 * Exercises to store so older data (an older install, or a restored older backup) has every current built-in
 * exercise as it is now: the ones added since, renamed ones still under their former name, and timed ones from
 * before timed sets existed. Anything the person changed is left alone.
 */
export function seedUpdates(stored: Exercise[]): Exercise[] {
  const byId = new Map(stored.map((e) => [e.id, e]));
  const updates: Exercise[] = [];
  for (const seed of SEED_EXERCISES) {
    const current = byId.get(seed.id);
    if (!current) {
      updates.push(seed);
      continue;
    }
    const renamed = FORMER_NAMES[seed.id] === current.name;
    const untimed = seed.timed && current.timed === undefined;
    if (renamed || untimed) updates.push({ ...current, ...(renamed ? { name: seed.name } : {}), ...(untimed ? { timed: true } : {}) });
  }
  return updates;
}
