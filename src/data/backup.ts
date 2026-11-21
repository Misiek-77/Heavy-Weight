import {
  EQUIPMENT,
  MEASURES,
  MUSCLE_GROUPS,
  SET_KINDS,
  WEIGHT_UNITS,
  type AppData,
  type Exercise,
  type Goal,
  type Measurement,
  type Plan,
  type Workout,
  type WorkoutSet,
} from '../domain/types';

import { COMBINED_APP, readDatabase } from './otherApp';

const APP = 'trening';
const VERSION = 1;

const backupObject = (data: AppData, now: string) => ({ app: APP, version: VERSION, exportedAt: now, data });

export function serializeBackup(data: AppData, now: string): string {
  return JSON.stringify(backupObject(data, now), null, 2);
}

/**
 * One file with both apps: these workouts, and the nutrition diary read from its database on this device (left
 * out when Jadłospis was never opened here). Each app restores its own part of the file.
 */
export async function serializeCombined(data: AppData, now: string): Promise<{ text: string; withNutrition: boolean }> {
  const n = await readDatabase('jadlospis');
  const nutrition = n && {
    app: 'jadlospis',
    version: 1,
    exportedAt: now,
    data: { products: n.products ?? [], entries: n.entries ?? [], weights: n.weights ?? [], water: n.water ?? [], ...(n.settings?.[0] ? { settings: n.settings[0] } : {}) },
  };
  const text = JSON.stringify({ app: COMBINED_APP, version: 1, exportedAt: now, trening: backupObject(data, now), jadlospis: nutrition }, null, 2);
  return { text, withNutrition: !!nutrition };
}

export type BackupResult = { ok: true; data: AppData; combined?: { withNutrition: boolean } } | { ok: false; error: string };

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
  // Reps in reserve are optional; a value that is not a small whole number is dropped rather than refused.
  const rir = Number.isInteger(v.rir) && (v.rir as number) >= 0 && (v.rir as number) <= 10 ? (v.rir as number) : undefined;
  return { weight: v.weight, reps: v.reps, done: v.done, ...(kind && kind !== 'normal' ? { kind } : {}), ...(rir !== undefined ? { rir } : {}) };
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

function goal(v: unknown, exerciseIds: Set<string>): Goal {
  check(isObject(v) && isText(v.id), 'Plik zawiera niepoprawny cel.');
  if (v.kind === 'lift') {
    check(isText(v.exerciseId) && exerciseIds.has(v.exerciseId), 'Plik zawiera cel dla ćwiczenia, którego nie ma w pliku.');
    check(isAmount(v.targetWeight) && v.targetWeight > 0, 'Plik zawiera cel z niepoprawnym ciężarem.');
    return { id: v.id, kind: 'lift', exerciseId: v.exerciseId, targetWeight: v.targetWeight };
  }
  check(v.kind === 'frequency' && Number.isInteger(v.perWeek) && (v.perWeek as number) > 0, 'Plik zawiera niepoprawny cel.');
  return { id: v.id, kind: 'frequency', perWeek: v.perWeek as number };
}

/** Validates a backup file. Never throws; on failure the error is a message for the user. */
export function parseBackup(text: string): BackupResult {
  let file: unknown;
  try {
    file = JSON.parse(text);
  } catch {
    return { ok: false, error: 'To nie jest plik kopii zapasowej (niepoprawny JSON).' };
  }
  let combined: { withNutrition: boolean } | undefined;
  try {
    if (isObject(file) && file.app === COMBINED_APP) {
      combined = { withNutrition: isObject(file.jadlospis) };
      file = file.trening;
      check(isObject(file), 'W tym pliku nie ma danych Treningu.');
    }
    check(isObject(file) && file.app !== 'jadlospis', 'To kopia aplikacji Jadłospis. Zaimportuj ją w tamtej aplikacji.');
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
    const settings = d.settings;
    const restSeconds = d.settings.restSeconds;
    const exercises = d.exercises.map(exercise);
    const ids = new Set(exercises.map((e) => e.id));
    check(ids.size === exercises.length, 'Plik zawiera zduplikowane ćwiczenia.');
    const workouts = d.workouts.map((w) => workout(w, ids));
    const plans = d.plans.map(plan);
    const planIds = new Set(plans.map((p) => p.id));
    check(workouts.filter((w) => !w.finishedAt).length <= 1, 'Plik zawiera więcej niż jeden niezakończony trening.');
    // Backups made before body measurements existed simply have none.
    check(d.measurements === undefined || Array.isArray(d.measurements), 'Plik zawiera niepoprawne pomiary ciała.');
    const measurements = (d.measurements ?? []).map(measurement);
    check(d.goals === undefined || Array.isArray(d.goals), 'Plik zawiera niepoprawne cele.');
    const goals = (d.goals ?? []).map((g) => goal(g, ids));
    return {
      ok: true,
      data: {
        exercises,
        plans,
        workouts,
        measurements,
        goals,
        settings: {
          restSeconds,
          restSound: settings.restSound !== false,
          // A schedule may point at plans that are not in the file; those days become rest days.
          schedule: Array.from({ length: 7 }, (_, i) => {
            const id = Array.isArray(settings.schedule) ? settings.schedule[i] : null;
            return isText(id) && planIds.has(id) ? id : null;
          }),
          unit: (WEIGHT_UNITS as readonly unknown[]).includes(settings.unit) ? (settings.unit as (typeof WEIGHT_UNITS)[number]) : 'kg',
          ...(isText(settings.lastBackupAt) ? { lastBackupAt: settings.lastBackupAt } : {}),
        },
      },
      ...(combined ? { combined } : {}),
    };
  } catch (e) {
    if (e instanceof Invalid) return { ok: false, error: e.message };
    throw e;
  }
}
