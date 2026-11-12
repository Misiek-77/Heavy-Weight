export const MUSCLE_GROUPS = [
  'klatka',
  'plecy',
  'nogi',
  'barki',
  'biceps',
  'triceps',
  'brzuch',
  'inne',
] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const EQUIPMENT = ['sztanga', 'hantle', 'maszyna', 'wyciąg', 'masa ciała', 'inne'] as const;
export type Equipment = (typeof EQUIPMENT)[number];

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  custom: boolean;
  archived: boolean;
  /** Rest after a set of this exercise, when it should differ from the default. */
  restSeconds?: number;
  /** Held for time (plank, carries): the set's `reps` then counts seconds. */
  timed?: boolean;
  updatedAt: string;
}

/** Target repetition range and superset link, shared by plan items and the workout entries made from them. */
export interface EntryTargets {
  repMin?: number;
  repMax?: number;
  /** Done back to back with the next exercise (a superset); the rest starts only after the last one. */
  linkNext?: boolean;
}

export interface PlanItem extends EntryTargets {
  exerciseId: string;
  targetSets: number;
}

export interface Plan {
  id: string;
  name: string;
  items: PlanItem[];
  createdAt: string;
  updatedAt: string;
}

/** How a set was performed. Warm-up sets are logged but never count towards records or progress. */
export const SET_KINDS = ['normal', 'warmup', 'failure', 'drop'] as const;
export type SetKind = (typeof SET_KINDS)[number];

export interface WorkoutSet {
  weight: number;
  reps: number;
  done: boolean;
  /** Absent means a normal working set. */
  kind?: SetKind;
}

export interface WorkoutEntry extends EntryTargets {
  exerciseId: string;
  sets: WorkoutSet[];
  note?: string;
}

export interface Workout {
  id: string;
  planId?: string;
  name: string;
  startedAt: string;
  finishedAt?: string;
  entries: WorkoutEntry[];
  note?: string;
  updatedAt: string;
}

/** Body measurements that can be tracked; weight in kg, the rest in cm. */
export const MEASURES = ['weight', 'waist', 'chest', 'arm', 'thigh', 'hips'] as const;
export type Measure = (typeof MEASURES)[number];

/** Body measurements taken on one day. At most one entry per day. */
export interface Measurement {
  id: string;
  /** Local calendar day, "2026-03-09". */
  date: string;
  values: Partial<Record<Measure, number>>;
  updatedAt: string;
}

export interface Settings {
  restSeconds: number;
  /** Play a short signal when the rest ends. */
  restSound: boolean;
}

export const DEFAULT_SETTINGS: Settings = { restSeconds: 90, restSound: true };

export interface AppData {
  exercises: Exercise[];
  plans: Plan[];
  workouts: Workout[];
  measurements: Measurement[];
  settings: Settings;
}
