import { newId } from '../domain/id';
import { SEED_EXERCISES } from '../domain/seed';
import type { Equipment, Exercise, SetKind, WeightUnit, Workout, WorkoutSet } from '../domain/types';

const KG_PER_LB = 0.45359237;

/** Which app a history file came from. */
export type CsvSource = 'strong' | 'hevy';

export interface CsvImport {
  source: CsvSource;
  /** Workouts not already in the app, oldest first. */
  workouts: Workout[];
  /** Exercises the file uses that the app does not have yet; added as the person's own. */
  newExercises: Exercise[];
  /** Workouts left out because one starting at the same moment is already saved. */
  skipped: number;
}

export type CsvImportResult = { ok: true; value: CsvImport } | { ok: false; error: string };

/** Splits CSV text into rows of fields: quoted fields, doubled quotes, commas or semicolons, any line ending. */
export function parseCsv(text: string): string[][] {
  const body = text.replace(/^﻿/, '');
  const firstLine = body.split(/\r?\n/, 1)[0] ?? '';
  const sep = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (quoted) {
      if (c === '"' && body[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === sep) {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && body[i + 1] === '\n') i++;
      row.push(field);
      if (row.some((f) => f.trim() !== '')) rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f.trim() !== '')) rows.push(row);
  return rows;
}

/** Lower case, letters and digits only: "Bench Press (Barbell)" → "benchpressbarbell". */
const key = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

/** English names Strong and Hevy use, for the built-in exercises (id without `seed-`). */
const KNOWN: Record<string, string[]> = {
  'bench-press': ['Bench Press (Barbell)', 'Barbell Bench Press'],
  'incline-bench-press': ['Incline Bench Press (Barbell)'],
  'db-bench-press': ['Bench Press (Dumbbell)', 'Dumbbell Bench Press'],
  'incline-db-press': ['Incline Bench Press (Dumbbell)', 'Incline Dumbbell Press'],
  'db-fly': ['Chest Fly (Dumbbell)', 'Dumbbell Fly'],
  'cable-fly': ['Cable Crossover', 'Chest Fly (Cable)', 'Cable Fly Crossovers'],
  'pec-deck': ['Pec Deck (Machine)', 'Chest Fly (Machine)', 'Butterfly (Pec Deck)'],
  'chest-press-machine': ['Chest Press (Machine)'],
  'push-up': ['Push Up', 'Push Ups'],
  dip: ['Chest Dip', 'Dip', 'Triceps Dip'],
  deadlift: ['Deadlift (Barbell)', 'Deadlift'],
  'pull-up': ['Pull Up', 'Pull Ups'],
  'chin-up': ['Chin Up', 'Chin Ups'],
  'barbell-row': ['Bent Over Row (Barbell)', 'Barbell Row', 'Pendlay Row (Barbell)'],
  'underhand-barbell-row': ['Bent Over Row Underhand (Barbell)', 'Reverse Grip Bent Over Row (Barbell)'],
  'db-row': ['Bent Over One Arm Row (Dumbbell)', 'Dumbbell Row', 'Single Arm Dumbbell Row'],
  'lat-pulldown': ['Lat Pulldown (Cable)', 'Lat Pulldown', 'Lat Pulldown (Machine)'],
  'close-grip-pulldown': ['Lat Pulldown - Close Grip (Cable)', 'Close Grip Lat Pulldown'],
  'seated-cable-row': ['Seated Row (Cable)', 'Seated Cable Row - V Grip (Cable)', 'Seated Cable Row'],
  't-bar-row': ['T Bar Row', 'T-Bar Row'],
  'machine-row': ['Seated Row (Machine)', 'Iso-Lateral Row (Machine)'],
  'straight-arm-pulldown': ['Straight Arm Pulldown (Cable)', 'Straight Arm Lat Pulldown (Cable)'],
  'back-extension': ['Back Extension', 'Back Extension (Hyperextension)'],
  shrug: ['Shrug (Dumbbell)', 'Dumbbell Shrug'],
  'db-pullover': ['Pullover (Dumbbell)', 'Dumbbell Pullover'],
  'sumo-deadlift': ['Sumo Deadlift (Barbell)', 'Sumo Deadlift'],
  squat: ['Squat (Barbell)', 'Back Squat (Barbell)', 'Barbell Squat'],
  'front-squat': ['Front Squat (Barbell)', 'Front Squat'],
  'leg-press': ['Leg Press', 'Leg Press (Machine)'],
  'romanian-deadlift': ['Romanian Deadlift (Barbell)', 'Romanian Deadlift'],
  'good-morning': ['Good Morning (Barbell)', 'Good Morning'],
  lunge: ['Lunge (Dumbbell)', 'Dumbbell Lunge', 'Walking Lunge (Dumbbell)'],
  'bulgarian-split-squat': ['Bulgarian Split Squat', 'Bulgarian Split Squat (Dumbbell)'],
  'goblet-squat': ['Goblet Squat (Kettlebell)', 'Goblet Squat (Dumbbell)', 'Goblet Squat'],
  'hack-squat': ['Hack Squat', 'Hack Squat (Machine)'],
  'leg-extension': ['Leg Extension (Machine)', 'Leg Extension'],
  'leg-curl': ['Lying Leg Curl (Machine)', 'Seated Leg Curl (Machine)', 'Leg Curl'],
  'hip-thrust': ['Hip Thrust (Barbell)', 'Hip Thrust'],
  'standing-calf-raise': ['Standing Calf Raise', 'Standing Calf Raise (Machine)', 'Calf Raise'],
  'seated-calf-raise': ['Seated Calf Raise', 'Seated Calf Raise (Machine)'],
  'overhead-press': ['Overhead Press (Barbell)', 'Strict Military Press (Barbell)', 'Military Press'],
  'db-shoulder-press': ['Shoulder Press (Dumbbell)', 'Seated Overhead Press (Dumbbell)', 'Overhead Press (Dumbbell)'],
  'arnold-press': ['Arnold Press (Dumbbell)', 'Arnold Press'],
  'lateral-raise': ['Lateral Raise (Dumbbell)', 'Lateral Raise'],
  'cable-lateral-raise': ['Lateral Raise (Cable)', 'Single Arm Lateral Raise (Cable)'],
  'front-raise': ['Front Raise (Dumbbell)', 'Front Raise'],
  'rear-delt-fly': ['Reverse Fly (Dumbbell)', 'Rear Delt Reverse Fly (Dumbbell)', 'Rear Delt Fly'],
  'reverse-pec-deck': ['Reverse Fly (Machine)', 'Rear Delt Reverse Fly (Machine)'],
  'face-pull': ['Face Pull (Cable)', 'Face Pull'],
  'upright-row': ['Upright Row (Barbell)', 'Upright Row'],
  'barbell-curl': ['Bicep Curl (Barbell)', 'Barbell Curl'],
  'ez-bar-curl': ['EZ Bar Biceps Curl', 'Bicep Curl (EZ Bar)', 'EZ Bar Curl'],
  'db-curl': ['Bicep Curl (Dumbbell)', 'Dumbbell Curl'],
  'hammer-curl': ['Hammer Curl (Dumbbell)', 'Hammer Curl'],
  'cable-hammer-curl': ['Hammer Curl (Cable)', 'Rope Cable Curl', 'Hammer Curl (Rope)'],
  'preacher-curl': ['Preacher Curl (Barbell)', 'Preacher Curl (EZ Bar)', 'Preacher Curl'],
  'concentration-curl': ['Concentration Curl (Dumbbell)', 'Concentration Curl'],
  'cable-curl': ['Bicep Curl (Cable)', 'Cable Curl'],
  'incline-db-curl': ['Incline Curl (Dumbbell)', 'Incline Dumbbell Curl'],
  'triceps-pushdown': ['Triceps Pushdown (Cable - Straight Bar)', 'Triceps Pushdown', 'Tricep Pushdown'],
  'skull-crusher': ['Skullcrusher (Barbell)', 'Skull Crusher', 'Lying Triceps Extension (Barbell)'],
  'overhead-triceps-extension': ['Overhead Triceps Extension (Dumbbell)', 'Triceps Extension (Dumbbell)'],
  'close-grip-bench-press': ['Bench Press - Close Grip (Barbell)', 'Close Grip Bench Press'],
  'bench-dip': ['Bench Dip', 'Bench Dips'],
  'rope-overhead-extension': ['Triceps Extension (Cable)', 'Overhead Triceps Extension (Cable)', 'Triceps Rope Overhead Extension'],
  'triceps-kickback': ['Triceps Kickback (Dumbbell)', 'Tricep Kickback'],
  plank: ['Plank'],
  'side-plank': ['Side Plank'],
  crunch: ['Crunch', 'Crunches'],
  'hanging-leg-raise': ['Hanging Leg Raise', 'Hanging Knee Raise'],
  'cable-crunch': ['Cable Crunch', 'Crunch (Cable)'],
  'russian-twist': ['Russian Twist'],
  'ab-wheel': ['Ab Wheel', 'Ab Wheel Rollout'],
  'farmer-walk': ["Farmer's Walk", 'Farmers Walk'],
  'kettlebell-swing': ['Kettlebell Swing'],
};

const BUILT_IN = new Map<string, string>();
for (const [id, names] of Object.entries(KNOWN)) for (const n of names) BUILT_IN.set(key(n), `seed-${id}`);

/** Equipment named in brackets after an exercise, as Strong and Hevy do it. */
function equipmentOf(name: string): Equipment {
  const bracket = /\(([^)]*)\)/.exec(name)?.[1]?.toLowerCase() ?? '';
  if (/barbell|ez bar|smith/.test(bracket)) return 'sztanga';
  if (/dumbbell|kettlebell/.test(bracket)) return 'hantle';
  if (/cable/.test(bracket)) return 'wyciąg';
  if (/machine/.test(bracket)) return 'maszyna';
  if (/bodyweight|assisted|weighted/.test(bracket)) return 'masa ciała';
  return 'inne';
}

const MONTHS: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

/** "2023-01-15 18:30:00" (Strong) or "15 Jan 2023, 18:30" (Hevy), local time. Null when unreadable. */
export function parseDate(text: string): Date | null {
  const iso = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(text.trim());
  if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3], +iso[4], +iso[5], +(iso[6] ?? 0));
  const hevy = /^(\d{1,2}) ([A-Za-z]{3})[a-z]* (\d{4}),? (\d{1,2}):(\d{2})/.exec(text.trim());
  if (hevy && hevy[2].toLowerCase() in MONTHS) return new Date(+hevy[3], MONTHS[hevy[2].toLowerCase()], +hevy[1], +hevy[4], +hevy[5]);
  return null;
}

/** "1h 5m", "45m", "50s" (Strong's workout duration) in milliseconds. */
function parseDuration(text: string): number {
  const h = /(\d+)\s*h/.exec(text)?.[1];
  const m = /(\d+)\s*m(?!s)/.exec(text)?.[1];
  const s = /(\d+)\s*s/.exec(text)?.[1];
  return ((+(h ?? 0) * 60 + +(m ?? 0)) * 60 + +(s ?? 0)) * 1000;
}

const number = (text: string | undefined) => {
  const n = parseFloat((text ?? '').replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

interface Row {
  workoutKey: string;
  title: string;
  start: Date;
  end: Date | null;
  exercise: string;
  weightKg: number;
  reps: number;
  seconds: number;
  kind: SetKind;
  note: string;
  workoutNote: string;
}

/** Reads the rows of a Strong or Hevy export; null when the header is neither. */
function readRows(table: string[][], strongUnit: WeightUnit): { source: CsvSource; rows: Row[] } | null {
  const [header, ...lines] = table;
  if (!header) return null;
  const col = (name: string) => header.findIndex((h) => h.trim().toLowerCase() === name);

  if (col('exercise name') >= 0 && col('set order') >= 0) {
    const [date, name, duration, exercise, order, weight, reps, seconds, notes, workoutNotes] = [
      'date', 'workout name', 'duration', 'exercise name', 'set order', 'weight', 'reps', 'seconds', 'notes', 'workout notes',
    ].map(col);
    const toKg = strongUnit === 'lb' ? KG_PER_LB : 1;
    const rows: Row[] = [];
    for (const l of lines) {
      const start = parseDate(l[date] ?? '');
      if (!start || !l[exercise]?.trim()) continue;
      const setOrder = (l[order] ?? '').trim().toUpperCase();
      rows.push({
        workoutKey: `${l[date]}|${l[name]}`,
        title: l[name]?.trim() || 'Trening',
        start,
        end: duration >= 0 ? new Date(start.getTime() + parseDuration(l[duration] ?? '')) : null,
        exercise: l[exercise].trim(),
        weightKg: number(l[weight]) * toKg,
        reps: number(l[reps]),
        seconds: seconds >= 0 ? number(l[seconds]) : 0,
        kind: setOrder === 'W' ? 'warmup' : setOrder === 'D' ? 'drop' : setOrder === 'F' ? 'failure' : 'normal',
        note: notes >= 0 ? (l[notes] ?? '').trim() : '',
        workoutNote: workoutNotes >= 0 ? (l[workoutNotes] ?? '').trim() : '',
      });
    }
    return { source: 'strong', rows };
  }

  if (col('exercise_title') >= 0 && col('start_time') >= 0) {
    const [title, start, end, description, exercise, notes, type, kg, lbs, reps, seconds] = [
      'title', 'start_time', 'end_time', 'description', 'exercise_title', 'exercise_notes', 'set_type', 'weight_kg', 'weight_lbs', 'reps', 'duration_seconds',
    ].map(col);
    const rows: Row[] = [];
    for (const l of lines) {
      const begin = parseDate(l[start] ?? '');
      if (!begin || !l[exercise]?.trim()) continue;
      const setType = (l[type] ?? '').trim().toLowerCase();
      rows.push({
        workoutKey: `${l[start]}|${l[title]}`,
        title: l[title]?.trim() || 'Trening',
        start: begin,
        end: end >= 0 ? parseDate(l[end] ?? '') : null,
        exercise: l[exercise].trim(),
        weightKg: kg >= 0 ? number(l[kg]) : number(l[lbs]) * KG_PER_LB,
        reps: number(l[reps]),
        seconds: seconds >= 0 ? number(l[seconds]) : 0,
        kind: setType === 'warmup' ? 'warmup' : setType === 'dropset' ? 'drop' : setType === 'failure' ? 'failure' : 'normal',
        note: notes >= 0 ? (l[notes] ?? '').trim() : '',
        workoutNote: description >= 0 ? (l[description] ?? '').trim() : '',
      });
    }
    return { source: 'hevy', rows };
  }
  return null;
}

/**
 * Turns a history export from Strong or Hevy into workouts for this app. Exercises are matched to the built-in
 * ones by their English name, or to the person's own exercises by name; anything else becomes a new exercise
 * of the person's. Weights in a Strong file are in the unit that app was set to (`strongUnit`); Hevy names it.
 */
export function importHistoryCsv(text: string, existing: { exercises: Exercise[]; workouts: Workout[] }, strongUnit: WeightUnit, now: string): CsvImportResult {
  const read = readRows(parseCsv(text), strongUnit);
  if (!read) return { ok: false, error: 'Nie rozpoznano pliku. Wybierz eksport historii z aplikacji Strong albo Hevy (plik CSV).' };
  if (read.rows.length === 0) return { ok: false, error: 'Plik nie zawiera żadnych serii.' };

  const byName = new Map(existing.exercises.map((e) => [key(e.name), e.id]));
  const builtIn = new Set(SEED_EXERCISES.map((e) => e.id));
  const ownNew = new Map<string, Exercise>();
  const exerciseFor = (name: string, rows: Row[]): string => {
    const seed = BUILT_IN.get(key(name));
    if (seed && (builtIn.has(seed) || existing.exercises.some((e) => e.id === seed))) return seed;
    const own = byName.get(key(name));
    if (own) return own;
    const made = ownNew.get(key(name));
    if (made) return made.id;
    // Held for time when the file only ever gives it seconds.
    const timed = rows.every((r) => r.reps === 0 && r.seconds > 0);
    const exercise: Exercise = {
      id: newId(),
      name: name.slice(0, 80),
      muscleGroup: 'inne',
      equipment: equipmentOf(name),
      custom: true,
      archived: false,
      ...(timed ? { timed: true } : {}),
      updatedAt: now,
    };
    ownNew.set(key(name), exercise);
    return exercise.id;
  };

  const rowsByExercise = new Map<string, Row[]>();
  for (const r of read.rows) rowsByExercise.set(key(r.exercise), [...(rowsByExercise.get(key(r.exercise)) ?? []), r]);

  const taken = new Set(existing.workouts.map((w) => w.startedAt));
  const groups = new Map<string, Row[]>();
  for (const r of read.rows) groups.set(r.workoutKey, [...(groups.get(r.workoutKey) ?? []), r]);

  const workouts: Workout[] = [];
  let skipped = 0;
  for (const rows of groups.values()) {
    const first = rows[0];
    const startedAt = first.start.toISOString();
    if (taken.has(startedAt)) {
      skipped++;
      continue;
    }
    const entries: Workout['entries'] = [];
    for (const r of rows) {
      const exerciseId = exerciseFor(r.exercise, rowsByExercise.get(key(r.exercise))!);
      const timed = r.reps === 0 && r.seconds > 0;
      const set: WorkoutSet = {
        weight: Math.round(r.weightKg * 1000) / 1000,
        reps: timed ? r.seconds : r.reps,
        done: true,
        ...(r.kind !== 'normal' ? { kind: r.kind } : {}),
      };
      if (set.reps <= 0) continue;
      const last = entries.at(-1);
      // Consecutive rows of one exercise form one entry; the same exercise later on starts another.
      if (last && last.exerciseId === exerciseId) {
        last.sets.push(set);
        // A note can sit on any set row; the first one found belongs to the exercise.
        if (!last.note && r.note) last.note = r.note.slice(0, 500);
      } else entries.push({ exerciseId, sets: [set], ...(r.note ? { note: r.note.slice(0, 500) } : {}) });
    }
    if (entries.length === 0) continue;
    const end = first.end && first.end > first.start ? first.end : new Date(first.start.getTime() + 60 * 60000);
    workouts.push({
      id: newId(),
      name: first.title.slice(0, 60),
      startedAt,
      finishedAt: end.toISOString(),
      entries,
      ...(first.workoutNote ? { note: first.workoutNote.slice(0, 500) } : {}),
      updatedAt: now,
    });
  }
  workouts.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  // Only exercises some imported workout actually uses.
  const used = new Set(workouts.flatMap((w) => w.entries.map((e) => e.exerciseId)));
  return {
    ok: true,
    value: { source: read.source, workouts, newExercises: [...ownNew.values()].filter((e) => used.has(e.id)), skipped },
  };
}
