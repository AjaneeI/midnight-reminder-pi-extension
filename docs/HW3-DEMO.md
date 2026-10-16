# HW 3 — silent demo walkthrough

Target recording length: **100 seconds**. One group submission needs the repository or PR link **and a separate video**. Record the actual terminal/Pi output; captions explain what is on screen.

## Prepare before recording

From your checkout of this repository:

```bash
git switch hw3/bedtime-test-demo
npm ci
npm test
npm run typecheck
pi --version
```

Verified with Pi 0.87.1, Node 26.7.0, and npm 11.19.0. Install Pi before recording if `pi` is unavailable. Dependency installation and Pi startup are outside the 100-second recording.

Open two terminal tabs in the repository, with readable text (about 20–24 pt) and enough width to show the `SIMULATED` lines. Keep this walkthrough open separately. Turn the microphone off in your screen recorder.

**Tab A — start Pi before recording:**

```bash
PI_CODING_AGENT_DIR="$(mktemp -d)" pi --offline --no-session \
  --no-extensions -e ./.pi/extensions/midnight-reminder.ts --approve \
  --no-skills --no-prompt-templates --no-themes --no-context-files --no-tools
```

This uses an isolated temporary Pi configuration, loads only this extension, and makes no model request. Offline startup may show missing-model or `fd` warnings; neither is needed for `/bedtime-test`. Leave Pi at its input prompt. The ordinary reminder runtime still uses real local time and its normal `.pi/midnight-reminder-state.json`; if you record between midnight and 06:00, a normal startup reminder may also appear. Do not delete real reminder state or change the system clock.

**Tab B — keep a shell ready in the repository.**

## Record these steps

| Time | Exact action | Suggested on-screen caption |
| --- | --- | --- |
| 0:00–0:08 | Show Tab A with Pi ready. | **HW 3 · Midnight Reminder Pi Extension** |
| 0:08–0:25 | Type `/bedtime-test` inside Pi; pause before Enter so the command is readable. Press Enter and hold the notification on screen. | **/bedtime-test: visible preview; reminder state is unchanged.** |
| 0:25–0:35 | Switch to Tab B; run `npm run demo`. | **Simulated local time · real adapter, policy, and file storage · test Pi UI** |
| 0:35–0:48 | Hold the five `SIMULATED` output lines on screen. Scroll upward slightly if needed. | **23:59: no reminder. Midnight: one reminder.** |
| 0:48–1:00 | Keep the `02:00` and `04:00` lines visible. | **120 later checks: no duplicate. Reopen same date: still no duplicate.** |
| 1:00–1:10 | Keep the `Jan 16` line and demo pass result visible. | **Next date: a new reminder is eligible. Eight demo tests pass.** |
| 1:10–1:30 | Run `npm test && npm run typecheck && echo 'TYPECHECK PASSED'`. | **Complete suite: 20 tests pass. TypeScript check passes.** |
| 1:30–1:40 | Run `git log -4 --oneline`; stop recording with the history visible. | **Source, tests, README, and commit history are in the submission link.** |

The demo runs in less than one second on the reviewed machine; the schedule leaves time to type, switch tabs, and read results. Rehearse once before recording. Add captions afterward if your recorder does not support overlays; audio is unnecessary.

## What the demo proves

- `/bedtime-test` is the required command; `/midnight-reminder-demo` remains supported.
- The visible command is a safe preview, not a production reminder. It intentionally can be repeated.
- `npm run demo` exercises the actual Pi entry point with fake Date/timers and a stub Pi API. All printed outcomes follow assertions; a failed assertion stops that test and the command exits unsuccessfully.
- The midnight transition uses the adapter's existing 60-second polling interval. Advancing two simulated hours exercises 120 additional checks.
- Reopening constructs a fresh adapter and `PiStorage` instance reading the same temporary file. This verifies cross-session state without touching the real project state.
- `npm test` runs the complete suite, including these eight demo tests. `npm run typecheck` includes the production Pi entry point.

## Submission review and limits

At baseline `1701174`, source, the locked behavioral specification, 12 tests, run/test instructions, and nine commits were present. The history includes scaffold (`665b126`), acceptance tests (`daeeab0`), policy implementation (`b2d9e50`), runtime/persistence (`ecce189`), and cleanup (`fd6bacf`). The missing required command name and deterministic recording instructions are addressed in this branch.

The production policy remains local time `[00:00, 06:00)`, with immediate evaluation at Pi startup and normal polling afterward. Production clock and storage implementations are unchanged. State remains scoped to the current working directory's `.pi/midnight-reminder-state.json`; this is not a new machine-wide persistence guarantee. The locked specification's “no production code or real tests written yet” status is historical, not the current implementation status.

Verification on this branch: 20 tests pass; the expanded TypeScript check passes; the eight-test deterministic demo passes; `/bedtime-test` loaded and displayed the expected notification in an actual Pi 0.87.1 terminal session. The two new command tests were observed failing before the alias was added.

Still unverified: the final screen recording, its final duration/readability, an actual overnight reminder, and an actual close/reopen at midnight. The automated adapter tests cover the simulated timing and persistence cases; they are not footage of a live overnight session.

Dependency audit during this review reported two high-severity development dependency advisories (`source-map-js` and the Pi SDK's `brace-expansion`). No dependency-wide upgrade was included in this focused command/demo change. The SDK is a development dependency added for real API typechecking; the existing Pi installation is not modified.

Submit the reviewable PR link (or the repository link with this branch selected) and the exported video once recorded. Do not merge the PR until approved.
