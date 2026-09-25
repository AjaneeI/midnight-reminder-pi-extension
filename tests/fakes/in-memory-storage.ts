import { Storage } from '../../src/storage.js';

/**
 * Test fake: an in-memory storage that simulates persisted state.
 * Survives across simulated Pi sessions when the same instance is reused.
 */
export class InMemoryStorage implements Storage {
  private _lastDate: string | null = null;

  getLastRemindedDate(): string | null {
    return this._lastDate;
  }

  setLastRemindedDate(date: string): void {
    this._lastDate = date;
  }
}
