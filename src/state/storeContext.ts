import { createContext, useContext } from 'react';
import type { AppData, Exercise, Goal, Measurement, Photo, Plan, Settings, Workout } from '../domain/types';

// Kept apart from the provider in store.tsx: a context created in the module being edited is recreated by hot
// reload during development, and screens still holding the old one then fail to find the store.

export interface Store extends AppData {
  /** The workout in progress, if any. */
  activeWorkout: Workout | undefined;
  /** Message of the last failed save, shown as a banner. */
  error: string | null;
  dismissError(): void;
  exerciseName(id: string): string;
  /** Ids of exercises held for time, whose sets count seconds. */
  timedIds: ReadonlySet<string>;
  saveExercise(exercise: Exercise): void;
  savePlan(plan: Plan): void;
  removePlan(id: string): void;
  saveWorkout(workout: Workout): void;
  removeWorkout(id: string): void;
  saveMeasurement(measurement: Measurement): void;
  removeMeasurement(id: string): void;
  saveGoal(goal: Goal): void;
  removeGoal(id: string): void;
  /** Physique photos, read and written straight from storage rather than held in memory. */
  photos: { list(): Promise<Photo[]>; save(photo: Photo): Promise<void>; remove(id: string): Promise<void> };
  saveSettings(settings: Settings): void;
  /** Adds workouts (and the exercises they need) imported from another app, keeping everything already saved. */
  addImported(exercises: Exercise[], workouts: Workout[]): void;
  replaceAll(data: AppData): Promise<void>;
}

export const StoreContext = createContext<Store | null>(null);

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside <StoreProvider>');
  return store;
}
