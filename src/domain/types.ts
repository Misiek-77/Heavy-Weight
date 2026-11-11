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

export interface WorkoutSet {
  weight: number;
  reps: number;
  done: boolean;
}

export interface WorkoutEntry {
  exerciseId: string;
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  planId?: string;
  name: string;
  startedAt: string;
  finishedAt?: string;
  entries: WorkoutEntry[];
  updatedAt: string;
}

export interface Settings {
  restSeconds: number;
}

export const DEFAULT_SETTINGS: Settings = { restSeconds: 90 };

export interface AppData {
  exercises: Exercise[];
  plans: Plan[];
  workouts: Workout[];
  settings: Settings;
}
