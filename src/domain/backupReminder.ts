import type { Settings } from './types';

const DAY = 24 * 60 * 60 * 1000;
/** A backup older than this is worth refreshing. */
export const BACKUP_MAX_AGE_DAYS = 30;
/** How long "later" hides the reminder. */
export const BACKUP_SNOOZE_DAYS = 7;
/** Below this many finished workouts there is too little to lose to nag about it. */
const MIN_WORKOUTS = 3;

/** Whether to remind about exporting a backup: data only lives on this device. */
export function backupDue(settings: Settings, finishedWorkouts: number, now: Date): boolean {
  if (finishedWorkouts < MIN_WORKOUTS) return false;
  if (settings.backupSnoozedUntil && now.getTime() < Date.parse(settings.backupSnoozedUntil)) return false;
  if (!settings.lastBackupAt) return true;
  return now.getTime() - Date.parse(settings.lastBackupAt) > BACKUP_MAX_AGE_DAYS * DAY;
}

/** The moment until which the reminder stays hidden after "later". */
export const snoozeUntil = (now: Date) => new Date(now.getTime() + BACKUP_SNOOZE_DAYS * DAY).toISOString();
