import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import {
  DEFAULT_SETTINGS,
  type AppData,
  type Exercise,
  type Goal,
  type Measurement,
  type Photo,
  type Plan,
  type Settings,
  type Workout,
} from '../domain/types';
import { reconnecting } from './reconnect';
import type { Repository } from './repository';

interface Schema extends DBSchema {
  exercises: { key: string; value: Exercise };
  plans: { key: string; value: Plan };
  workouts: { key: string; value: Workout };
  measurements: { key: string; value: Measurement };
  goals: { key: string; value: Goal };
  photos: { key: string; value: Photo };
  settings: { key: string; value: Settings };
}

const SETTINGS_KEY = 'settings';

export function createIdbRepository(): Repository {
  const connection: { run<R>(op: (db: IDBPDatabase<Schema>) => Promise<R>): Promise<R>; reset(): void } = reconnecting(() =>
    openDB<Schema>('trening', 3, {
      // Another tab opened a newer version of the app and needs to upgrade the database. Holding the
      // connection would leave that tab stuck on a blank screen, so this one lets go and reloads itself.
      blocking(_current, _blocked, event) {
        (event.target as IDBDatabase).close();
        connection.reset();
        if (typeof location !== 'undefined') location.reload();
      },
      // The browser closed the connection on its own (iOS does this to apps left in the background).
      terminated() {
        connection.reset();
      },
      upgrade(database, oldVersion) {
        if (oldVersion < 1) {
          database.createObjectStore('exercises', { keyPath: 'id' });
          database.createObjectStore('plans', { keyPath: 'id' });
          database.createObjectStore('workouts', { keyPath: 'id' });
          database.createObjectStore('settings');
        }
        // Version 2 adds body measurements; everything stored by version 1 stays as it is.
        if (oldVersion < 2) database.createObjectStore('measurements', { keyPath: 'id' });
        // Version 3 adds goals and physique photos.
        if (oldVersion < 3) {
          database.createObjectStore('goals', { keyPath: 'id' });
          database.createObjectStore('photos', { keyPath: 'id' });
        }
      },
    }),
  );
  /** Runs one database operation, on a fresh connection if the old one was closed. */
  const withDb = <R,>(op: (db: IDBPDatabase<Schema>) => Promise<R>) => connection.run(op);

  return {
    async loadAll() {
      const [exercises, plans, workouts, measurements, goals, settings] = await withDb((d) =>
        Promise.all([
          d.getAll('exercises'),
          d.getAll('plans'),
          d.getAll('workouts'),
          d.getAll('measurements'),
          d.getAll('goals'),
          d.get('settings', SETTINGS_KEY),
        ]),
      );
      return { exercises, plans, workouts, measurements, goals, settings: { ...DEFAULT_SETTINGS, ...settings } };
    },
    async putExercise(exercise) {
      await withDb((d) => d.put('exercises', exercise));
    },
    async putPlan(plan) {
      await withDb((d) => d.put('plans', plan));
    },
    async deletePlan(id) {
      await withDb((d) => d.delete('plans', id));
    },
    async putWorkout(workout) {
      await withDb((d) => d.put('workouts', workout));
    },
    async deleteWorkout(id) {
      await withDb((d) => d.delete('workouts', id));
    },
    async putMeasurement(measurement) {
      await withDb((d) => d.put('measurements', measurement));
    },
    async deleteMeasurement(id) {
      await withDb((d) => d.delete('measurements', id));
    },
    async putGoal(goal) {
      await withDb((d) => d.put('goals', goal));
    },
    async deleteGoal(id) {
      await withDb((d) => d.delete('goals', id));
    },
    async listPhotos() {
      return withDb((d) => d.getAll('photos'));
    },
    async putPhoto(photo) {
      await withDb((d) => d.put('photos', photo));
    },
    async deletePhoto(id) {
      await withDb((d) => d.delete('photos', id));
    },
    async putSettings(settings) {
      await withDb((d) => d.put('settings', settings, SETTINGS_KEY));
    },
    async replaceAll(data: AppData) {
      await withDb((d) => writeAll(d, data));
    },
  };
}

/** Replaces every store's contents with `data` in one transaction, so a failure leaves the old data intact. */
async function writeAll(db: IDBPDatabase<Schema>, data: AppData) {
  const tx = db.transaction(['exercises', 'plans', 'workouts', 'measurements', 'goals', 'settings'], 'readwrite');
  const exercises = tx.objectStore('exercises');
  const plans = tx.objectStore('plans');
  const workouts = tx.objectStore('workouts');
  const measurements = tx.objectStore('measurements');
  const goals = tx.objectStore('goals');
  const settings = tx.objectStore('settings');
  await Promise.all([
    exercises.clear(),
    plans.clear(),
    workouts.clear(),
    measurements.clear(),
    goals.clear(),
    ...data.exercises.map((e) => exercises.put(e)),
    ...data.plans.map((p) => plans.put(p)),
    ...data.workouts.map((w) => workouts.put(w)),
    ...data.measurements.map((m) => measurements.put(m)),
    ...data.goals.map((g) => goals.put(g)),
    settings.put(data.settings, SETTINGS_KEY),
    tx.done,
  ]);
}
