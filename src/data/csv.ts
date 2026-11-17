import { finishedWorkouts } from '../domain/stats';
import { dayKey } from '../domain/summary';
import type { Exercise, WeightUnit, Workout } from '../domain/types';
import { SET_KIND_INFO } from '../ui/setKinds';

const KG_PER_LB = 0.45359237;

/** A field quoted when it holds the separator, a quote or a line break, as spreadsheets expect. */
const field = (value: string | number) => {
  const text = String(value);
  return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** "82,5": a decimal comma and no thousands separator, so Polish spreadsheets read it as a number. */
const decimal = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',');

const time = (date: Date) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

/**
 * Every done set of every finished workout, oldest first, one per row: ready to open in Excel, LibreOffice
 * or Google Sheets. Separated by semicolons with decimal commas, the format Polish spreadsheets expect,
 * and with weights in the unit the app is set to.
 */
export function historyCsv(workouts: Workout[], exercises: Exercise[], unit: WeightUnit): string {
  const byId = new Map(exercises.map((e) => [e.id, e]));
  const header = ['Data', 'Godzina', 'Trening', 'Ćwiczenie', 'Seria', 'Rodzaj', `Ciężar (${unit})`, 'Powtórzenia', 'Czas (s)', 'Notatka'];
  const lines = [header.map(field).join(';')];
  for (const w of finishedWorkouts(workouts).reverse()) {
    const started = new Date(w.startedAt);
    for (const entry of w.entries) {
      const exercise = byId.get(entry.exerciseId);
      const timed = exercise?.timed ?? false;
      entry.sets
        .filter((s) => s.done)
        .forEach((s, i) => {
          const weight = unit === 'lb' ? s.weight / KG_PER_LB : s.weight;
          lines.push(
            [
              dayKey(started),
              time(started),
              w.name,
              exercise?.name ?? 'Usunięte ćwiczenie',
              i + 1,
              s.kind && s.kind !== 'normal' ? SET_KIND_INFO[s.kind].label.toLowerCase() : '',
              // A timed hold without extra load has no weight to show.
              timed && s.weight === 0 ? '' : decimal(weight),
              timed ? '' : s.reps,
              timed ? s.reps : '',
              entry.note ?? '',
            ]
              .map(field)
              .join(';'),
          );
        });
    }
  }
  // The byte order mark tells Excel the file is UTF-8, so "ę" and "ł" are not garbled.
  return '﻿' + lines.join('\r\n') + '\r\n';
}
