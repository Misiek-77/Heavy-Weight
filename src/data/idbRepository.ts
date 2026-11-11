import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { DEFAULT_SETTINGS, type AppData, type Exercise, type Plan, type Settings, type Workout } from '../domain/types';
import type { Repository } from './repository';

interface Schema extends DBSchema {
  exercises: { key: string; value: Exercise };
  plans: { key: string; value: Plan };
  workouts: { key: string; value: Workout };
  settings: { key: string; value: Settings };
}

const SETTINGS_KEY = 'settings';

export function createIdbRepository(): Repository {
  let dbPromise: Promise<IDBPDatabase<Schema>> | undefined;
  const db = () =>
    (dbPromise ??= openDB<Schema>('trening', 1, {
      upgrade(database) {
        database.createObjectStore('exercises', { keyPath: 'id' });
        database.createObjectStore('plans', { keyPath: 'id' });
        database.createObjectStore('workouts', { keyPath: 'id' });
        database.createObjectStore('settings');
      },
    }));

  return {
    async loadAll() {
      const d = await db();
      const [exercises, plans, workouts, settings] = await Promise.all([
        d.getAll('exercises'),
        d.getAll('plans'),
        d.getAll('workouts'),
        d.get('settings', SETTINGS_KEY),
      ]);
      return { exercises, plans, workouts, settings: { ...DEFAULT_SETTINGS, ...settings } };
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
    async putSettings(settings) {
      await (await db()).put('settings', settings, SETTINGS_KEY);
    },
    async replaceAll(data: AppData) {
      const tx = (await db()).transaction(['exercises', 'plans', 'workouts', 'settings'], 'readwrite');
      const exercises = tx.objectStore('exercises');
      const plans = tx.objectStore('plans');
      const workouts = tx.objectStore('workouts');
      const settings = tx.objectStore('settings');
      await Promise.all([
        exercises.clear(),
        plans.clear(),
        workouts.clear(),
        ...data.exercises.map((e) => exercises.put(e)),
        ...data.plans.map((p) => plans.put(p)),
        ...data.workouts.map((w) => workouts.put(w)),
        settings.put(data.settings, SETTINGS_KEY),
        tx.done,
      ]);
    },
  };
}
