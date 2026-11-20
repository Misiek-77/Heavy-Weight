import { describe, expect, it } from 'vitest';
import { msUntilNextDay } from './useToday';

describe('time until the day changes', () => {
  it('counts to the next local midnight plus a second', () => {
    expect(msUntilNextDay(new Date(2026, 10, 20, 23, 59, 0))).toBe(61_000);
    expect(msUntilNextDay(new Date(2026, 10, 20, 0, 0, 0))).toBe(24 * 3600_000 + 1000);
  });
});
