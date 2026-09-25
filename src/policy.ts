/**
 * Determines whether a reminder should be issued based on the current time
 * and the last reminded date.
 *
 * Requirements:
 * - R1.1.1: Reminder window is [00:00, 06:00) in local time.
 * - R2.1.1: Duplicate prevention based on calendar date.
 *
 * @param _now - Current local time
 * @param _lastRemindedDate - ISO calendar date (YYYY-MM-DD) of last reminder, or null
 * @returns true if a reminder should be issued, false otherwise
 */
export function shouldRemind(_now: Date, _lastRemindedDate: string | null): boolean {
  throw new Error('Not implemented');
}
