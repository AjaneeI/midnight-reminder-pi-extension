import { Clock } from './clock.js';
import { Storage } from './storage.js';
import { shouldRemind, formatDate } from './policy.js';

/**
 * Midnight Reminder Pi Extension.
 *
 * Evaluates time-policy and duplicate-policy to determine when to issue
 * a reminder. Persists duplicate-prevention state across sessions.
 */
export class MidnightReminderExtension {
  private _timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private _clock: Clock,
    private _storage: Storage,
    private _onRemind?: () => void,
  ) {}

  /**
   * Called by the Pi runtime when the extension is activated.
   * Performs initial evaluation and begins monitoring.
   */
  activate(): void {
    this._timer = setInterval(() => this.checkAndRemind(), 60_000);
  }

  /**
   * Evaluates policies and issues a reminder if eligible.
   * Persists the last-reminded date when a reminder is issued.
   * @returns true if a reminder was issued, false otherwise
   */
  checkAndRemind(): boolean {
    const now = this._clock.now();
    const lastDate = this._storage.getLastRemindedDate();

    if (shouldRemind(now, lastDate)) {
      const today = formatDate(now);
      this._storage.setLastRemindedDate(today);
      this._onRemind?.();
      return true;
    }

    return false;
  }

  /**
   * Called by the Pi runtime when the extension is deactivated.
   * Stops timers but does NOT clear persisted state.
   */
  deactivate(): void {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }
}

