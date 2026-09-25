import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { MidnightReminderExtension } from "../../src/extension.js";
import { PiStorage } from "../../src/pi-storage.js";

/**
 * Midnight Reminder Pi Extension
 *
 * Displays a visible notification when the current local time is
 * inside the reminder window [00:00, 06:00) and the user has not
 * yet been reminded today.
 *
 * Duplicate prevention persists across Pi sessions via a JSON file.
 */
export default function (pi: ExtensionAPI) {
  // Real system clock
  const clock = {
    now: () => new Date(),
  };

  // File-based persistence across sessions
  const storage = new PiStorage();

  let extension: MidnightReminderExtension | null = null;

  pi.on("session_start", async (_event, ctx) => {
    extension = new MidnightReminderExtension(clock, storage, () => {
      ctx.ui.notify("🌙 It's midnight — time for your reminder!", "info");
    });

    // Begin periodic monitoring (every 60 seconds)
    extension.activate();

    // Evaluate immediately on startup
    extension.checkAndRemind();
  });

  pi.on("session_shutdown", async () => {
    if (extension) {
      extension.deactivate();
      extension = null;
    }
  });

  // Classroom demonstration command — shows the notification UI immediately
  // without affecting the real time-policy state.
  pi.registerCommand("midnight-reminder-demo", {
    description: "Demonstrate the midnight reminder notification (safe demo)",
    handler: async (_name, ctx) => {
      ctx.ui.notify("🌙 It's midnight — time for your reminder! (DEMO)", "info");
    },
  });
}
