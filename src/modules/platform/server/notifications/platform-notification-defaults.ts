import type Database from "better-sqlite3";

/** Absent preferences default on only after the coordinated migration. Stored
 * zeroes are always preserved; browser permission and delivery identity remain
 * separate prerequisites. This function never sends or queues anything. */
export function notificationDefaultEnabled(db: Database.Database): number {
  return db.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='platform_notification_default_on'").get() ? 1 : 0;
}

export function notificationPreferenceEnabled(db: Database.Database, stored: number | undefined): boolean {
  return (stored ?? notificationDefaultEnabled(db)) === 1;
}
