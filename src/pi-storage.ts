import { Storage } from './storage.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * File-based Storage implementation for the Pi extension.
 * Persists the last-reminded date to a JSON file so duplicate
 * prevention survives across Pi sessions.
 */
export class PiStorage implements Storage {
  private readonly _filePath: string;

  constructor(filePath?: string) {
    this._filePath = filePath || path.join(process.cwd(), '.pi', 'midnight-reminder-state.json');
  }

  getLastRemindedDate(): string | null {
    try {
      const data = fs.readFileSync(this._filePath, 'utf-8');
      const parsed = JSON.parse(data);
      return parsed.lastRemindedDate ?? null;
    } catch {
      return null;
    }
  }

  setLastRemindedDate(date: string): void {
    const dir = path.dirname(this._filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this._filePath, JSON.stringify({ lastRemindedDate: date }, null, 2));
  }
}
