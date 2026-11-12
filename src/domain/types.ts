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
  updatedAt: string;
}

export interface PlanItem {
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

export interface WorkoutEntry {
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
  settings: Settings;
}
