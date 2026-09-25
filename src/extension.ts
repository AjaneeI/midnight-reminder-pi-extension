import { Clock } from './clock.js';
import { Storage } from './storage.js';

/**
 * Midnight Reminder Pi Extension.
 *
 * Evaluates time-policy and duplicate-policy to determine when to issue
 * a reminder. Persists duplicate-prevention state across sessions.
 */
export class MidnightReminderExtension {
  constructor(
    private _clock: Clock,
    private _storage: Storage,
  ) {}

  /**
   * Called by the Pi runtime when the extension is activated.
   * Should perform initial evaluation and begin monitoring.
   */
  activate(): void {
    // STUB — implementation in W1-3
  }

  /**
   * Evaluates policies and issues a reminder if eligible.
   * @returns true if a reminder was issued, false otherwise
   */
  checkAndRemind(): boolean {
    throw new Error('Not implemented');
  }

  /**
   * Called by the Pi runtime when the extension is deactivated.
   * Should stop timers/listeners but NOT clear persisted state.
   */
  deactivate(): void {
    // STUB — implementation in W1-3
  }
}
