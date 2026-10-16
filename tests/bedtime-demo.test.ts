import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type {
  ExtensionAPI, ExtensionCommandContext, ExtensionContext, ExtensionHandler,
  RegisteredCommand, SessionStartEvent, SessionShutdownEvent,
} from '@earendil-works/pi-coding-agent';
import registerExtension from '../.pi/extensions/midnight-reminder.js';
import { PiStorage } from '../src/pi-storage.js';

// Only the Pi methods consumed by this extension are faked. The adapter,
// engine, policy and file-backed storage are the real implementations.
function createPiHarness() {
  let start: ExtensionHandler<SessionStartEvent>;
  let shutdown: ExtensionHandler<SessionShutdownEvent>;
  const commands = new Map<string, Omit<RegisteredCommand, 'name' | 'sourceInfo'>>();
  const notify = vi.fn();
  const ctx = { ui: { notify } } as unknown as ExtensionContext & ExtensionCommandContext;
  const api = {
    on(event: string, handler: unknown) {
      if (event === 'session_start') start = handler as typeof start;
      if (event === 'session_shutdown') shutdown = handler as typeof shutdown;
      return () => {};
    },
    registerCommand(name: string, command: Omit<RegisteredCommand, 'name' | 'sourceInfo'>) {
      commands.set(name, command);
    },
  } as unknown as ExtensionAPI;
  registerExtension(api);
  return {
    notify,
    start: () => start({ type: 'session_start', reason: 'startup' }, ctx),
    shutdown: () => shutdown({ type: 'session_shutdown', reason: 'quit' }, ctx),
    async command(name: string) {
      const command = commands.get(name);
      expect(command, `/${name} must be registered`).toBeDefined();
      await command!.handler('', ctx);
    },
  };
}

let directory: string;
let stateFile: string;
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'bedtime-demo-'));
  stateFile = join(directory, '.pi', 'midnight-reminder-state.json');
  vi.spyOn(process, 'cwd').mockReturnValue(directory);
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2024, 0, 14, 23, 59));
});
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
  rmSync(directory, { recursive: true, force: true });
});

describe('HW 3 deterministic demo (simulated local time; temporary state)', () => {
  for (const name of ['bedtime-test', 'midnight-reminder-demo']) {
    it(`/${name} displays a safe preview without creating reminder state`, async () => {
      const pi = createPiHarness();
      await pi.command(name);
      expect(pi.notify).toHaveBeenCalledExactlyOnceWith(
        "🌙 It's midnight — time for your reminder! (DEMO)", 'info',
      );
      expect(existsSync(stateFile)).toBe(false);
      expect(vi.getTimerCount()).toBe(0);
    });

    it(`/${name} preserves an existing date and does not suppress a real reminder`, async () => {
      new PiStorage().setLastRemindedDate('2024-01-14');
      const before = readFileSync(stateFile, 'utf8');
      vi.setSystemTime(new Date(2024, 0, 15, 0, 0));
      const pi = createPiHarness();
      await pi.command(name);
      expect(readFileSync(stateFile, 'utf8')).toBe(before);
      await pi.start();
      expect(pi.notify).toHaveBeenCalledTimes(2);
      expect(pi.notify).toHaveBeenLastCalledWith(
        "🌙 It's midnight — time for your reminder!", 'info',
      );
      await pi.shutdown();
    });
  }

  it('23:59 → midnight reminder → no duplicate → reopen same date → next date', async () => {
    const first = createPiHarness();
    await first.start();
    expect(first.notify).not.toHaveBeenCalled();
    console.log('SIMULATED Jan 14 23:59 | reminders: 0 (outside window)');

    await vi.advanceTimersByTimeAsync(60_000);
    expect(first.notify).toHaveBeenCalledExactlyOnceWith(
      "🌙 It's midnight — time for your reminder!", 'info',
    );
    expect(new PiStorage().getLastRemindedDate()).toBe('2024-01-15');
    console.log("SIMULATED Jan 15 00:00 | reminders: 1 | 🌙 It's midnight — time for your reminder!");

    await vi.advanceTimersByTimeAsync(2 * 60 * 60_000);
    expect(first.notify).toHaveBeenCalledTimes(1);
    console.log('SIMULATED Jan 15 02:00 | reminders: 1 (no duplicate after 120 checks)');
    await first.shutdown();
    expect(vi.getTimerCount()).toBe(0);

    vi.setSystemTime(new Date(2024, 0, 15, 4, 0));
    const reopened = createPiHarness(); // fresh adapter and fresh PiStorage, same file
    await reopened.start();
    expect(reopened.notify).not.toHaveBeenCalled();
    expect(new PiStorage().getLastRemindedDate()).toBe('2024-01-15');
    console.log('SIMULATED Jan 15 04:00 | reopened session: 0 new reminders (date persisted)');

    vi.setSystemTime(new Date(2024, 0, 15, 23, 59));
    await vi.advanceTimersByTimeAsync(60_000);
    expect(reopened.notify).toHaveBeenCalledTimes(1);
    expect(new PiStorage().getLastRemindedDate()).toBe('2024-01-16');
    console.log('SIMULATED Jan 16 00:00 | new date: 1 new reminder');
    await reopened.shutdown();
  });

  it('startup at 01:00 sends one reminder immediately', async () => {
    vi.setSystemTime(new Date(2024, 0, 15, 1, 0));
    const pi = createPiHarness();
    await pi.start();
    expect(pi.notify).toHaveBeenCalledTimes(1);
    expect(new PiStorage().getLastRemindedDate()).toBe('2024-01-15');
    await pi.shutdown();
  });

  it('startup at 06:00 sends no reminder', async () => {
    vi.setSystemTime(new Date(2024, 0, 15, 6, 0));
    const pi = createPiHarness();
    await pi.start();
    expect(pi.notify).not.toHaveBeenCalled();
    expect(existsSync(stateFile)).toBe(false);
    await pi.shutdown();
  });

  it('shutdown stops polling before midnight', async () => {
    const pi = createPiHarness();
    await pi.start();
    await pi.shutdown();
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(2 * 60_000);
    expect(pi.notify).not.toHaveBeenCalled();
    expect(existsSync(stateFile)).toBe(false);
  });
});
