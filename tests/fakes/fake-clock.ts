import { Clock } from '../../src/clock.js';

/**
 * Test fake: a clock whose time can be set arbitrarily.
 */
export class FakeClock implements Clock {
  constructor(private _time: Date) {}

  now(): Date {
    return new Date(this._time);
  }

  setTime(time: Date): void {
    this._time = new Date(time);
  }
}
