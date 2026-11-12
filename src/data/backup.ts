import {
  EQUIPMENT,
  MEASURES,
  MUSCLE_GROUPS,
  SET_KINDS,
  type AppData,
  type Exercise,
  type Measurement,
  type Plan,
  type Workout,
  type WorkoutSet,
} from '../domain/types';

const APP = 'trening';
const VERSION = 1;

export function serializeBackup(data: AppData, now: string): string {
  return JSON.stringify({ app: APP, version: VERSION, exportedAt: now, data }, null, 2);
}

export type BackupResult = { ok: true; data: AppData } | { ok: false; error: string };

class Invalid extends Error {}

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Invalid(message);
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isText = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const isAmount = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;

/** Optional rep range and superset link of a plan item or workout entry; anything malformed is dropped. */
function targets(v: Record<string, unknown>) {
  const whole = (x: unknown): x is number => Number.isInteger(x) && (x as number) > 0;
  return {
    ...(whole(v.repMin) ? { repMin: v.repMin } : {}),
    ...(whole(v.repMax) ? { repMax: v.repMax } : {}),
    ...(v.linkNext === true ? { linkNext: true } : {}),
  };
}

function exercise(v: unknown): Exercise {
  check(isObject(v) && isText(v.id) && isText(v.name), 'Plik zawiera ćwiczenie bez nazwy lub identyfikatora.');
  check((MUSCLE_GROUPS as readonly unknown[]).includes(v.muscleGroup), `Nieznana partia mięśniowa: ${v.name}.`);
  check((EQUIPMENT as readonly unknown[]).includes(v.equipment), `Nieznany sprzęt: ${v.name}.`);
  return {
    id: v.id,
    name: v.name,
    muscleGroup: v.muscleGroup as Exercise['muscleGroup'],
    equipment: v.equipment as Exercise['equipment'],
    custom: v.custom === true,
    archived: v.archived === true,
    ...(isAmount(v.restSeconds) && v.restSeconds > 0 ? { restSeconds: v.restSeconds } : {}),
    ...(v.timed === true ? { timed: true } : {}),
    updatedAt: isText(v.updatedAt) ? v.updatedAt : new Date(0).toISOString(),
  };
}

function plan(v: unknown): Plan {
  check(isObject(v) && isText(v.id) && isText(v.name) && Array.isArray(v.items), 'Plik zawiera niepoprawny plan.');
  const createdAt = isText(v.createdAt) ? v.createdAt : new Date(0).toISOString();
  return {
    id: v.id,
    name: v.name,
    items: v.items.map((item) => {
      check(
        isObject(item) && isText(item.exerciseId) && Number.isInteger(item.targetSets) && (item.targetSets as number) > 0,
        `Plan „${v.name}” ma niepoprawną pozycję.`,
      );
      return { exerciseId: item.exerciseId, targetSets: item.targetSets as number, ...targets(item) };
    }),
    createdAt,
    updatedAt: isText(v.updatedAt) ? v.updatedAt : createdAt,
  };
}

/** A note is optional free text; anything else in its place is dropped. */
const note = (v: unknown) => (isText(v) ? { note: v.slice(0, 500) } : {});

function workoutSet(v: unknown): WorkoutSet {
  check(
    isObject(v) && isAmount(v.weight) && isAmount(v.reps) && typeof v.done === 'boolean',
    'Plik zawiera serię z niepoprawnym ciężarem lub liczbą powtórzeń.',
  );
  check(v.kind === undefined || (SET_KINDS as readonly unknown[]).includes(v.kind), 'Plik zawiera serię nieznanego rodzaju.');
  const kind = v.kind as WorkoutSet['kind'];
  return { weight: v.weight, reps: v.reps, done: v.done, ...(kind && kind !== 'normal' ? { kind } : {}) };
}

function workout(v: unknown, exerciseIds: Set<string>): Workout {
  check(
    isObject(v) && isText(v.id) && isText(v.name) && isText(v.startedAt) && Array.isArray(v.entries),
    'Plik zawiera niepoprawny trening.',
  );
  check(v.finishedAt === undefined || isText(v.finishedAt), 'Plik zawiera trening z niepoprawną datą zakończenia.');
  return {
    id: v.id,
    planId: isText(v.planId) ? v.planId : undefined,
    name: v.name,
    startedAt: v.startedAt,
    finishedAt: v.finishedAt,
    entries: v.entries.map((entry) => {
      check(isObject(entry) && isText(entry.exerciseId) && Array.isArray(entry.sets), 'Plik zawiera niepoprawny trening.');
      check(exerciseIds.has(entry.exerciseId), `Trening „${v.name}” odwołuje się do ćwiczenia, którego nie ma w pliku.`);
      return { exerciseId: entry.exerciseId, sets: entry.sets.map(workoutSet), ...note(entry.note), ...targets(entry) };
    }),
    ...note(v.note),
    updatedAt: isText(v.updatedAt) ? v.updatedAt : v.startedAt,
  };
}

function measurement(v: unknown): Measurement {
  check(
    isObject(v) && isText(v.id) && isText(v.date) && /^\d{4}-\d{2}-\d{2}$/.test(v.date) && isObject(v.values),
    'Plik zawiera niepoprawny pomiar ciała.',
  );
  const values: Measurement['values'] = {};
  for (const measure of MEASURES) {
    const value = v.values[measure];
    if (value === undefined) continue;
    check(isAmount(value) && value > 0, 'Plik zawiera pomiar ciała z niepoprawną wartością.');
    values[measure] = value;
  }
  return { id: v.id, date: v.date, values, updatedAt: isText(v.updatedAt) ? v.updatedAt : new Date(0).toISOString() };
}

/** Validates a backup file. Never throws; on failure the error is a message for the user. */
export function parseBackup(text: string): BackupResult {
  let file: unknown;
  try {
    file = JSON.parse(text);
  } catch {
    return { ok: false, error: 'To nie jest plik kopii zapasowej (niepoprawny JSON).' };
  }
  try {
    check(isObject(file) && file.app === APP, 'To nie jest plik kopii zapasowej tej aplikacji.');
    check(file.version === VERSION, 'Ta kopia pochodzi z nowszej wersji aplikacji.');
    const d = file.data;
    check(
      isObject(d) && Array.isArray(d.exercises) && Array.isArray(d.plans) && Array.isArray(d.workouts),
      'Plik kopii zapasowej jest niekompletny.',
    );
    check(
      isObject(d.settings) && isAmount(d.settings.restSeconds) && d.settings.restSeconds > 0,
      'Plik zawiera niepoprawny czas przerwy.',
    );
    const exercises = d.exercises.map(exercise);
    const ids = new Set(exercises.map((e) => e.id));
    check(ids.size === exercises.length, 'Plik zawiera zduplikowane ćwiczenia.');
    const workouts = d.workouts.map((w) => workout(w, ids));
    check(workouts.filter((w) => !w.finishedAt).length <= 1, 'Plik zawiera więcej niż jeden niezakończony trening.');
    // Backups made before body measurements existed simply have none.
    check(d.measurements === undefined || Array.isArray(d.measurements), 'Plik zawiera niepoprawne pomiary ciała.');
    const measurements = (d.measurements ?? []).map(measurement);
    return {
      ok: true,
      data: {
        exercises,
        plans: d.plans.map(plan),
        workouts,
        measurements,
        settings: { restSeconds: d.settings.restSeconds, restSound: d.settings.restSound !== false },
      },
    };
  } catch (e) {
    if (e instanceof Invalid) return { ok: false, error: e.message };
    throw e;
  }
}
