/**
 * Determines whether a reminder should be issued based on the current time
 * and the last reminded date.
 *
 * Requirements:
 * - R1.1.1: Reminder window is [00:00, 06:00) in local time.
 * - R2.1.1: Duplicate prevention based on calendar date.
 *
 * @param now - Current local time
 * @param lastRemindedDate - ISO calendar date (YYYY-MM-DD) of last reminder, or null
 * @returns true if a reminder should be issued, false otherwise
 */
export function shouldRemind(now: Date, lastRemindedDate: string | null): boolean {
  const hour = now.getHours();
  if (hour >= 6) {
    return false;
  }

  const today = formatDate(now);

  if (lastRemindedDate === today) {
    return false;
  }

  return true;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export { formatDate };
