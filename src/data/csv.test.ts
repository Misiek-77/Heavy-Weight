import { describe, expect, it } from 'vitest';
import type { Exercise, Workout } from '../domain/types';
import { historyCsv } from './csv';

const exercise = (id: string, name: string, timed = false): Exercise => ({
  id,
  name,
  muscleGroup: 'klatka',
  equipment: 'sztanga',
  custom: false,
  archived: false,
  updatedAt: '',
  ...(timed ? { timed: true } : {}),
});
const exercises = [exercise('bench', 'Wyciskanie; leżąc'), exercise('plank', 'Deska', true)];

const workout = (over: Partial<Workout>): Workout => ({
  id: 'w',
  name: 'Góra A',
  startedAt: new Date(2026, 10, 3, 18, 5).toISOString(),
  finishedAt: new Date(2026, 10, 3, 19, 0).toISOString(),
  updatedAt: '',
  entries: [
    {
      exerciseId: 'bench',
      note: 'łokcie "bliżej"',
      sets: [
        { weight: 40, reps: 10, done: true, kind: 'warmup' },
        { weight: 82.5, reps: 8, done: true },
        { weight: 82.5, reps: 0, done: false },
      ],
    },
    { exerciseId: 'plank', sets: [{ weight: 0, reps: 60, done: true }] },
  ],
  ...over,
});

const rows = (csv: string) => csv.replace(/^﻿/, '').trimEnd().split('\r\n');

describe('history as CSV', () => {
  it('has one row per done set, with Polish number format and a header naming the unit', () => {
    expect(rows(historyCsv([workout({})], exercises, 'kg'))).toEqual([
      'Data;Godzina;Trening;Ćwiczenie;Seria;Rodzaj;Ciężar (kg);Powtórzenia;Czas (s);RIR;Notatka',
      '2026-11-03;18:05;Góra A;"Wyciskanie; leżąc";1;rozgrzewkowa;40;10;;;"łokcie ""bliżej"""',
      '2026-11-03;18:05;Góra A;"Wyciskanie; leżąc";2;;82,5;8;;;"łokcie ""bliżej"""',
      '2026-11-03;18:05;Góra A;Deska;1;;;;60;;',
    ]);
  });

  it('starts with a byte order mark so Excel reads the Polish letters', () => {
    expect(historyCsv([], exercises, 'kg').startsWith('﻿')).toBe(true);
  });

  it('converts weights to pounds and leaves out workouts still in progress, oldest first', () => {
    const older = workout({ id: 'o', name: 'Stary', startedAt: new Date(2026, 9, 1, 10, 0).toISOString() });
    const open = workout({ id: 'x', name: 'W toku', finishedAt: undefined });
    const csv = rows(historyCsv([workout({}), open, older], exercises, 'lb'));
    expect(csv[0]).toContain('Ciężar (lb)');
    expect(csv[1]).toMatch(/^2026-10-01;10:00;Stary;/);
    expect(csv.some((r) => r.includes('W toku'))).toBe(false);
    expect(csv[2]).toContain(';2;;181,9;8;');
  });
});
