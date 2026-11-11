import type { AppData, Exercise, Plan, Settings, Workout } from '../domain/types';

/**
 * The only way the app reads or writes persistent data.
 * Swapping local storage for a cloud backend means writing another implementation of this interface.
 */
export interface Repository {
  loadAll(): Promise<AppData>;
  putExercise(exercise: Exercise): Promise<void>;
  putPlan(plan: Plan): Promise<void>;
  deletePlan(id: string): Promise<void>;
  putWorkout(workout: Workout): Promise<void>;
  deleteWorkout(id: string): Promise<void>;
  putSettings(settings: Settings): Promise<void>;
  /** Replaces everything stored with `data`, atomically. */
  replaceAll(data: AppData): Promise<void>;
}
