import { describe, it, expect } from 'vitest';
import { shouldRemind } from '../src/policy.js';

describe('time-policy behavior', () => {
  /**
   * Covers R1.1.5: 23:59 is outside the reminder window [00:00, 06:00).
   */
  it('23:59 -> no reminder (outside window)', () => {
    const now = new Date('2024-01-15T23:59:00');
    expect(shouldRemind(now, null)).toBe(false);
  });

  /**
   * Covers R1.1.2 + R2.1.1: 00:00 is inside the window and no reminder yet today.
   */
  it('00:00, not yet reminded today -> reminder (inside window)', () => {
    const now = new Date('2024-01-15T00:00:00');
    expect(shouldRemind(now, null)).toBe(true);
  });

  /**
   * Covers R2.1.2: inside window but already reminded on this calendar date.
   */
  it('02:00, already reminded today -> no reminder (duplicate prevention)', () => {
    const now = new Date('2024-01-15T02:00:00');
    expect(shouldRemind(now, '2024-01-15')).toBe(false);
  });

  /**
   * Covers R1.1.3: 05:59 is inside the window and no reminder yet today.
   */
  it('05:59, not yet reminded today -> reminder (inside window)', () => {
    const now = new Date('2024-01-15T05:59:00');
    expect(shouldRemind(now, null)).toBe(true);
  });

  /**
   * Covers R1.1.4: 06:00 is outside the reminder window [00:00, 06:00).
   */
  it('06:00 -> no reminder (outside window)', () => {
    const now = new Date('2024-01-15T06:00:00');
    expect(shouldRemind(now, null)).toBe(false);
  });
});
