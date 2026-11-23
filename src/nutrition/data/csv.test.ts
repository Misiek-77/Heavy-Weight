import { describe, expect, it } from 'vitest';
import { diaryCsv } from './csv';

describe('the diary as a spreadsheet', () => {
  it('lists entries by day and meal with decimal commas', () => {
    const per100 = { kcal: 370, protein: 13.5, fat: 7, carbs: 60, salt: 0.1 };
    const csv = diaryCsv([
      { id: 'b', date: '2026-11-21', meal: 'dinner', productId: 'p', name: 'Płatki; owsiane', grams: 50, per100, createdAt: 'x' },
      { id: 'a', date: '2026-11-21', meal: 'breakfast', productId: 'p', name: 'Płatki', grams: 60, per100, createdAt: 'x' },
    ]);
    const rows = csv.trim().split('\r\n');
    expect(rows[0]).toMatch(/^Data;Posiłek;Produkt/);
    expect(rows[1]).toBe('2026-11-21;Śniadanie;Płatki;60;222;8,1;4,2;36;;;0,06');
    expect(rows[2]).toContain('"Płatki; owsiane"');
  });
});
