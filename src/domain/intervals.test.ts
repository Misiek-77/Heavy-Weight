import { describe, expect, it } from 'vitest';
import { INTERVAL_PRESETS, phaseAt, PREP_SECONDS, totalSeconds } from './intervals';

describe('the interval timer', () => {
  const tabata = INTERVAL_PRESETS.tabata;
  it('lasts the rounds plus the count-in, without a rest after the last round', () => {
    expect(totalSeconds(tabata)).toBe(PREP_SECONDS + 8 * 30 - 10);
  });
  it('goes count-in, work, rest, next round, done', () => {
    expect(phaseAt(tabata, 0)).toEqual({ kind: 'prep', round: 0, remaining: 10, length: 10 });
    expect(phaseAt(tabata, 10)).toEqual({ kind: 'work', round: 1, remaining: 20, length: 20 });
    expect(phaseAt(tabata, 29.5)).toMatchObject({ kind: 'work', round: 1, remaining: 1 });
    expect(phaseAt(tabata, 30)).toEqual({ kind: 'rest', round: 1, remaining: 10, length: 10 });
    expect(phaseAt(tabata, 40)).toMatchObject({ kind: 'work', round: 2, remaining: 20 });
    expect(phaseAt(tabata, totalSeconds(tabata))).toMatchObject({ kind: 'done' });
  });
  it('runs EMOM as one long round a minute', () => {
    expect(phaseAt(INTERVAL_PRESETS.emom, 75)).toMatchObject({ kind: 'work', round: 2, remaining: 55 });
  });
});
