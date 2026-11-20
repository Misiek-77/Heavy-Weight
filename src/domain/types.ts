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
  /** Repetitions in reserve: how many more were possible (4 stands for 4 or more). Absent when not noted. */
  rir?: number;
}

/** The repetitions-in-reserve values offered; the last one means "that many or more". */
export const RIR_VALUES = [0, 1, 2, 3, 4] as const;

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

/** Something to work towards: a weight on one exercise, or a number of workouts every week. */
export type Goal =
  | { id: string; kind: 'lift'; exerciseId: string; targetWeight: number }
  | { id: string; kind: 'frequency'; perWeek: number };

/** A physique photo. Kept only on the device: photos are too large for the backup file. */
export interface Photo {
  id: string;
  /** Local calendar day, "2026-03-09". */
  date: string;
  image: Blob;
}

export interface Settings {
  restSeconds: number;
  /** Play a short signal when the rest ends. */
  restSound: boolean;
  /** Plan id for each weekday from Monday; null on rest days. */
  schedule: (string | null)[];
  /** Unit weights are shown and typed in. Everything is stored in kilograms. */
  unit: WeightUnit;
  /** When the last backup file was exported. */
  lastBackupAt?: string;
  /** The backup reminder stays hidden until this moment. */
  backupSnoozedUntil?: string;
}

export const WEIGHT_UNITS = ['kg', 'lb'] as const;
export type WeightUnit = (typeof WEIGHT_UNITS)[number];

export const DEFAULT_SETTINGS: Settings = {
  restSeconds: 90,
  restSound: true,
  schedule: [null, null, null, null, null, null, null],
  unit: 'kg',
};

export interface AppData {
  exercises: Exercise[];
  plans: Plan[];
  workouts: Workout[];
  measurements: Measurement[];
  goals: Goal[];
  settings: Settings;
}
