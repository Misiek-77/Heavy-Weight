import { describe, expect, it } from 'vitest';
import { backupDue, snoozeUntil } from './backupReminder';
import { DEFAULT_SETTINGS } from './types';

const NOW = new Date('2026-03-18T10:00:00.000Z');
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86400000).toISOString();

describe('backupDue', () => {
  it('stays quiet until there are a few workouts to lose', () => {
    expect(backupDue(DEFAULT_SETTINGS, 2, NOW)).toBe(false);
    expect(backupDue(DEFAULT_SETTINGS, 3, NOW)).toBe(true);
  });
  it('reminds again once the last backup is over a month old', () => {
    expect(backupDue({ ...DEFAULT_SETTINGS, lastBackupAt: daysAgo(10) }, 20, NOW)).toBe(false);
    expect(backupDue({ ...DEFAULT_SETTINGS, lastBackupAt: daysAgo(31) }, 20, NOW)).toBe(true);
  });
  it('is hidden for a week after "later"', () => {
    const snoozed = { ...DEFAULT_SETTINGS, backupSnoozedUntil: snoozeUntil(NOW) };
    expect(backupDue(snoozed, 20, NOW)).toBe(false);
    expect(backupDue(snoozed, 20, new Date(NOW.getTime() + 8 * 86400000))).toBe(true);
  });
});
