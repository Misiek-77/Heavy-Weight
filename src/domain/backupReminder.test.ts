import { describe, expect, it } from 'vitest';
import { backupDue, snoozeUntil } from './backupReminder';
import { DEFAULT_SETTINGS } from './types';

const NOW = new Date('2026-03-18T10:00:00.000Z');
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86400000).toISOString();

describe('backupDue', () => {
  it('stays quiet until there are a few workouts to lose', () => {
    expect(backupDue(DEFAULT_SETTINGS, 2, NOW, 2)).toBe(false);
    expect(backupDue(DEFAULT_SETTINGS, 3, NOW, 3)).toBe(true);
  });
  it('reminds again once the last backup is over a week old and something new was logged since', () => {
    expect(backupDue({ ...DEFAULT_SETTINGS, lastBackupAt: daysAgo(5) }, 20, NOW, 2)).toBe(false);
    expect(backupDue({ ...DEFAULT_SETTINGS, lastBackupAt: daysAgo(8) }, 20, NOW, 2)).toBe(true);
  });
  it('does not remind when nothing was logged since the last backup', () => {
    expect(backupDue({ ...DEFAULT_SETTINGS, lastBackupAt: daysAgo(40) }, 20, NOW, 0)).toBe(false);
  });
  it('is hidden for a few days after "later"', () => {
    const snoozed = { ...DEFAULT_SETTINGS, backupSnoozedUntil: snoozeUntil(NOW) };
    expect(backupDue(snoozed, 20, NOW, 5)).toBe(false);
    expect(backupDue(snoozed, 20, new Date(NOW.getTime() + 4 * 86400000), 5)).toBe(true);
  });
});
