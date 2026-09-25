import { describe, it, expect } from 'vitest';
import { MidnightReminderExtension } from '../src/extension.js';
import { FakeClock } from './fakes/fake-clock.js';
import { InMemoryStorage } from './fakes/in-memory-storage.js';
import { PiStorage } from '../src/pi-storage.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('integration tests', () => {
  /**
   * Covers R3.1.2 + callback contract:
   * When checkAndRemind() issues a reminder, the onRemind callback fires.
   */
  it('calls onRemind when a reminder is issued', () => {
    const clock = new FakeClock(new Date('2024-01-15T01:00:00'));
    const storage = new InMemoryStorage();
    let called = false;

    const ext = new MidnightReminderExtension(clock, storage, () => {
      called = true;
    });

    const result = ext.checkAndRemind();
    expect(result).toBe(true);
    expect(called).toBe(true);
  });

  /**
   * Covers callback contract for negative case:
   * When checkAndRemind() does NOT issue a reminder, onRemind must not fire.
   */
  it('does not call onRemind when no reminder is issued', () => {
    const clock = new FakeClock(new Date('2024-01-15T12:00:00'));
    const storage = new InMemoryStorage();
    let called = false;

    const ext = new MidnightReminderExtension(clock, storage, () => {
      called = true;
    });

    const result = ext.checkAndRemind();
    expect(result).toBe(false);
    expect(called).toBe(false);
  });

  /**
   * Covers R4.1.1 (cleanup):
   * deactivate() must stop the timer so no further checks occur.
   */
  it('stops the timer on deactivate', () => {
    const clock = new FakeClock(new Date('2024-01-15T01:00:00'));
    const storage = new InMemoryStorage();
    let callCount = 0;

    const ext = new MidnightReminderExtension(clock, storage, () => {
      callCount++;
    });

    // Start with a very short interval for testing
    ext.activate();

    // Immediately deactivate
    ext.deactivate();

    // Wait briefly to confirm the timer does not fire
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(callCount).toBe(0);
        resolve();
      }, 50);
    });
  });

  /**
   * Covers R2.2.1 (persistent duplicate prevention):
   * PiStorage must persist the last-reminded date across instances.
   */
  it('PiStorage persists across instances', () => {
    const tempFile = path.join(os.tmpdir(), `midnight-reminder-test-${Date.now()}.json`);

    // First instance writes
    const storage1 = new PiStorage(tempFile);
    storage1.setLastRemindedDate('2024-01-15');

    // Second instance reads
    const storage2 = new PiStorage(tempFile);
    expect(storage2.getLastRemindedDate()).toBe('2024-01-15');

    // Cleanup
    fs.unlinkSync(tempFile);
  });

  /**
   * Covers repeated checks with timer + duplicate prevention:
   * Even with a running timer, only one reminder is issued per calendar date.
   */
  it('does not duplicate reminder across repeated timer checks', () => {
    const clock = new FakeClock(new Date('2024-01-15T01:00:00'));
    const storage = new InMemoryStorage();
    let callCount = 0;

    const ext = new MidnightReminderExtension(clock, storage, () => {
      callCount++;
    });

    // First check: should issue reminder
    expect(ext.checkAndRemind()).toBe(true);
    expect(callCount).toBe(1);

    // Second check: same time, same date — already reminded
    expect(ext.checkAndRemind()).toBe(false);
    expect(callCount).toBe(1);

    // Third check: still same date
    expect(ext.checkAndRemind()).toBe(false);
    expect(callCount).toBe(1);
  });
});
