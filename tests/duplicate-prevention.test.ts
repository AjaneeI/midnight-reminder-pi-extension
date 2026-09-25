import { describe, it, expect } from 'vitest';
import { MidnightReminderExtension } from '../src/extension.js';
import { FakeClock } from './fakes/fake-clock.js';
import { InMemoryStorage } from './fakes/in-memory-storage.js';

describe('duplicate prevention across sessions', () => {
  /**
   * Covers R2.2.1, R2.2.2, R4.1.2:
   * - Reminder sent at 01:00 on Jan 15
   * - Session closes (state persisted)
   * - New session opens at 04:00 same date
   * - Must NOT issue a second reminder
   */
  it('should not remind again after session close and reopen on the same date', () => {
    const storage = new InMemoryStorage();

    // Session 1: 01:00 on Jan 15 — first reminder should fire
    const clock1 = new FakeClock(new Date('2024-01-15T01:00:00'));
    const ext1 = new MidnightReminderExtension(clock1, storage);
    ext1.activate();

    const remindedSession1 = ext1.checkAndRemind();
    expect(remindedSession1).toBe(true);

    // Simulate session close — cleanup should stop timers but preserve persisted state
    ext1.deactivate();

    // Session 2: 04:00 on Jan 15 — same date, already reminded
    const clock2 = new FakeClock(new Date('2024-01-15T04:00:00'));
    const ext2 = new MidnightReminderExtension(clock2, storage);
    ext2.activate();

    const remindedSession2 = ext2.checkAndRemind();
    expect(remindedSession2).toBe(false);
  });
});
