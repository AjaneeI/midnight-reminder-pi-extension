import { describe, it, expect } from 'vitest';
import { MidnightReminderExtension } from '../src/extension.js';
import { FakeClock } from './fakes/fake-clock.js';
import { InMemoryStorage } from './fakes/in-memory-storage.js';

describe('runtime timing behavior', () => {
  /**
   * Covers R3.2.1 + R3.3.1:
   * - Pi is already open before midnight
   * - Midnight passes
   * - The next check after 00:00 should be eligible for a reminder
   */
  it('should remind after midnight passes while Pi is already open', () => {
    const storage = new InMemoryStorage();
    const clock = new FakeClock(new Date('2024-01-14T23:55:00'));
    const ext = new MidnightReminderExtension(clock, storage);

    try {
      ext.activate();

      // Before midnight: not inside reminder window
      const beforeMidnight = ext.checkAndRemind();
      expect(beforeMidnight).toBe(false);

      // Midnight passes to Jan 15
      clock.setTime(new Date('2024-01-15T00:00:00'));

      // Next check after midnight: now inside the window
      const afterMidnight = ext.checkAndRemind();
      expect(afterMidnight).toBe(true);
    } finally {
      ext.deactivate();
    }
  });
});
