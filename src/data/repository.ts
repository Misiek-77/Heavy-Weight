import type { AppData, Exercise, Goal, Measurement, Photo, Plan, Settings, Workout } from '../domain/types';

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
  putMeasurement(measurement: Measurement): Promise<void>;
  deleteMeasurement(id: string): Promise<void>;
  putGoal(goal: Goal): Promise<void>;
  deleteGoal(id: string): Promise<void>;
  /** Photos live outside `AppData`: they are loaded only by the screen that shows them. */
  listPhotos(): Promise<Photo[]>;
  putPhoto(photo: Photo): Promise<void>;
  deletePhoto(id: string): Promise<void>;
  putSettings(settings: Settings): Promise<void>;
  /** Replaces everything stored with `data`, atomically. Photos are not part of it and stay untouched. */
  replaceAll(data: AppData): Promise<void>;
}
