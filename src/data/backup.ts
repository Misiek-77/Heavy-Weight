import {
  EQUIPMENT,
  MUSCLE_GROUPS,
  type AppData,
  type Exercise,
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
      return { exerciseId: item.exerciseId, targetSets: item.targetSets as number };
    }),
    createdAt,
    updatedAt: isText(v.updatedAt) ? v.updatedAt : createdAt,
  };
}

function workoutSet(v: unknown): WorkoutSet {
  check(
    isObject(v) && isAmount(v.weight) && isAmount(v.reps) && typeof v.done === 'boolean',
    'Plik zawiera serię z niepoprawnym ciężarem lub liczbą powtórzeń.',
  );
  return { weight: v.weight, reps: v.reps, done: v.done };
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
      return { exerciseId: entry.exerciseId, sets: entry.sets.map(workoutSet) };
    }),
    updatedAt: isText(v.updatedAt) ? v.updatedAt : v.startedAt,
  };
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
    return {
      ok: true,
      data: { exercises, plans: d.plans.map(plan), workouts, settings: { restSeconds: d.settings.restSeconds } },
    };
  } catch (e) {
    if (e instanceof Invalid) return { ok: false, error: e.message };
    throw e;
  }
}
