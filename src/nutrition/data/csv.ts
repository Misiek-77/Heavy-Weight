import { entryNutrients } from '../domain/nutrients';
import { MEALS, type DiaryEntry } from '../domain/types';

const MEAL_NAME = { breakfast: 'Śniadanie', lunch: 'Obiad', dinner: 'Kolacja', snack: 'Przekąski' } as const;

/** A field quoted when it holds the separator, a quote or a line break, as spreadsheets expect. */
const field = (value: string | number) => {
  const text = String(value);
  return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** "12,5": a decimal comma, so Polish spreadsheets read it as a number; empty when unknown. */
const decimal = (n: number | undefined, digits = 1) => (n === undefined ? '' : String(Math.round(n * 10 ** digits) / 10 ** digits).replace('.', ','));

/**
 * The diary as a spreadsheet, one row per thing eaten, by day and meal: semicolons and decimal commas, the
 * format Polish spreadsheets (Excel, Google Sheets) expect.
 */
export function diaryCsv(entries: DiaryEntry[]): string {
  const header = ['Data', 'Posiłek', 'Produkt', 'Ilość (g)', 'Energia (kcal)', 'Białko (g)', 'Tłuszcz (g)', 'Węglowodany (g)', 'Błonnik (g)', 'Cukry (g)', 'Sól (g)'];
  const sorted = [...entries].sort(
    (a, b) => a.date.localeCompare(b.date) || MEALS.indexOf(a.meal) - MEALS.indexOf(b.meal) || a.createdAt.localeCompare(b.createdAt),
  );
  const lines = [header.map(field).join(';')];
  for (const e of sorted) {
    const n = entryNutrients(e);
    lines.push(
      [e.date, MEAL_NAME[e.meal], e.name, decimal(e.grams), decimal(n.kcal, 0), decimal(n.protein), decimal(n.fat), decimal(n.carbs), decimal(n.fiber), decimal(n.sugar), decimal(n.salt, 2)]
        .map(field)
        .join(';'),
    );
  }
  // The byte order mark makes Excel read Polish letters correctly.
  return '﻿' + lines.join('\r\n') + '\r\n';
}
