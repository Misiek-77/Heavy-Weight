import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import {
  DEFAULT_SETTINGS,
  type AppData,
  type Exercise,
  type Measurement,
  type Plan,
  type Settings,
  type Workout,
} from '../domain/types';
import type { Repository } from './repository';

interface Schema extends DBSchema {
  exercises: { key: string; value: Exercise };
  plans: { key: string; value: Plan };
  workouts: { key: string; value: Workout };
  measurements: { key: string; value: Measurement };
  settings: { key: string; value: Settings };
}

const SETTINGS_KEY = 'settings';

export function createIdbRepository(): Repository {
  let dbPromise: Promise<IDBPDatabase<Schema>> | undefined;
  const db = () =>
    (dbPromise ??= openDB<Schema>('trening', 2, {
      upgrade(database, oldVersion) {
        if (oldVersion < 1) {
          database.createObjectStore('exercises', { keyPath: 'id' });
          database.createObjectStore('plans', { keyPath: 'id' });
          database.createObjectStore('workouts', { keyPath: 'id' });
          database.createObjectStore('settings');
        }
        // Version 2 adds body measurements; everything stored by version 1 stays as it is.
        if (oldVersion < 2) database.createObjectStore('measurements', { keyPath: 'id' });
      },
    }));

  return {
    async loadAll() {
      const d = await db();
      const [exercises, plans, workouts, measurements, settings] = await Promise.all([
        d.getAll('exercises'),
        d.getAll('plans'),
        d.getAll('workouts'),
        d.getAll('measurements'),
        d.get('settings', SETTINGS_KEY),
      ]);
      return { exercises, plans, workouts, measurements, settings: { ...DEFAULT_SETTINGS, ...settings } };
    },
    async putExercise(exercise) {
      await (await db()).put('exercises', exercise);
    },
    async putPlan(plan) {
      await (await db()).put('plans', plan);
    },
    async deletePlan(id) {
      await (await db()).delete('plans', id);
    },
    async putWorkout(workout) {
      await (await db()).put('workouts', workout);
    },
    async deleteWorkout(id) {
      await (await db()).delete('workouts', id);
    },
    async putMeasurement(measurement) {
      await (await db()).put('measurements', measurement);
    },
    async deleteMeasurement(id) {
      await (await db()).delete('measurements', id);
    },
    async putSettings(settings) {
      await (await db()).put('settings', settings, SETTINGS_KEY);
    },
    async replaceAll(data: AppData) {
      const tx = (await db()).transaction(['exercises', 'plans', 'workouts', 'measurements', 'settings'], 'readwrite');
      const exercises = tx.objectStore('exercises');
      const plans = tx.objectStore('plans');
      const workouts = tx.objectStore('workouts');
      const measurements = tx.objectStore('measurements');
      const settings = tx.objectStore('settings');
      await Promise.all([
        exercises.clear(),
        plans.clear(),
        workouts.clear(),
        measurements.clear(),
        ...data.exercises.map((e) => exercises.put(e)),
        ...data.plans.map((p) => plans.put(p)),
        ...data.workouts.map((w) => workouts.put(w)),
        ...data.measurements.map((m) => measurements.put(m)),
        settings.put(data.settings, SETTINGS_KEY),
        tx.done,
      ]);
    },
  };
}
