# Midnight Reminder Pi Extension — Behavioral Specification (LOCKED)

**Status:** Requirements locked (W1-1). No production code or real tests written yet.

**Derived from assignment cases:**
- 23:59 → no reminder
- 00:00 → reminder
- already reminded today → no duplicate
- 05:59 → reminder
- 06:00 → no reminder

---

## 0. Separation of Concerns

This document defines **behavioral requirements** only. Choices such as polling interval, data format, or internal clock comparison logic are **implementation details** and must not appear in acceptance tests unless they directly affect externally observable behavior.

---

## 1. Time-Policy Behavior

### 1.1 Reminder Window (Requirement)
- **R1.1.1** The extension shall trigger a reminder only when the current local system time is in the half-open interval **[00:00, 06:00)**.
- **R1.1.2** At exactly `00:00:00` the time is inside the window → reminder eligible.
- **R1.1.3** At any time `t` where `00:00 ≤ t < 06:00` the time is inside the window → reminder eligible.
- **R1.1.4** At exactly `06:00:00` the time is outside the window → reminder not eligible.
- **R1.1.5** At `23:59:00` the time is outside the window → reminder not eligible.

### 1.2 Acceptance Criteria (Time-Policy)
| Current Time | Expected Action |
|--------------|-----------------|
| 23:59 (any seconds) | No reminder issued |
| 00:00:00 | Reminder may be issued (subject to duplicate rule) |
| 05:59:59 | Reminder may be issued (subject to duplicate rule) |
| 06:00:00 | No reminder issued |

### 1.3 Decisions
- **Approved:** Use system **local time** for the window check.
- **Approved:** Do **not** special-case Daylight Saving Time transitions; accept whatever the system clock reports.

### 1.4 Non-requirement (Implementation Detail)
- How the implementation compares the current time against the window boundaries (e.g., extracting hour/minute, using raw timestamps, etc.) is an implementation choice and is **not** part of this specification.

---

## 2. Duplicate-Reminder Behavior

### 2.1 Definition of "Today" (Requirement)
- **R2.1.1** For duplicate prevention, "today" shall mean the **calendar date** (year-month-day) of the most recent reminder, as determined by the same local clock used for the time-policy check.
- **R2.1.2** Once a reminder has been issued on a given calendar date, no additional reminder shall be issued for that date, even if the extension continues checking inside the window.
- **R2.1.3** When the local clock advances to the next calendar date (midnight crossing), the duplicate-prevention state resets, and a new reminder becomes eligible again.

### 2.2 Cross-Session Persistence (Requirement)
- **R2.2.1** The duplicate-prevention state **must persist across Pi sessions** for the same local calendar date.
- **R2.2.2** If a reminder was issued on Jan 15 in any session (past or present), and Pi is opened again later on Jan 15, the extension shall **not** issue a second reminder.
- **R2.2.3** The persisted state is tied to a **calendar date**, not to a Pi session or process lifetime.

### 2.3 Acceptance Criteria (Duplicate-Reminder)
| Scenario | Expected Action |
|----------|-----------------|
| First check at 00:00 on Jan 15 | Reminder issued |
| Second check at 02:00 on Jan 15 | No reminder (already reminded today) |
| Check at 00:00 on Jan 16 | Reminder issued (new calendar date) |
| Check at 05:59 on Jan 16 | No reminder (already reminded on Jan 16) |
| Pi closed at 01:00 after reminder, reopened at 04:00 on Jan 15 | No reminder (already reminded on Jan 15) |

### 2.4 Decisions
- **Approved:** "Today" means **calendar date** (year-month-day), resetting at midnight.
- **Approved:** Duplicate prevention uses **Option B** — global per-day guarantee that persists across sessions.

### 2.5 Non-requirement (Implementation Detail)
- The storage mechanism used to persist the last-reminded date (file, Pi storage API, etc.) is an implementation choice and is **not** part of this specification.

---

## 3. Pi Runtime Behavior

### 3.1 Activation & Evaluation (Requirement)
- **R3.1.1** The extension shall register with the Pi runtime so it is activated when Pi loads.
- **R3.1.2** The extension shall evaluate the time-policy and duplicate-policy **once immediately on activation** (startup).
- **R3.1.3** The extension shall issue a reminder by sending a message through the Pi API when both policies allow it.

### 3.2 Startup During Reminder Window (Requirement)
- **R3.2.1** If Pi starts while the current time is inside the reminder window and no reminder has yet been issued for today's calendar date (in this or any prior session), the extension shall issue a reminder immediately on activation.
- **R3.2.2** If Pi starts inside the window but a reminder was already issued earlier today (in a prior session), the extension shall **not** issue a duplicate reminder on startup.

### 3.3 Continued Operation (Requirement)
- **R3.3.1** After startup evaluation, the extension shall continue monitoring the time so that a reminder can be issued when the clock enters the window (e.g., while Pi is already open and midnight passes).

### 3.4 Acceptance Criteria (Runtime)
| Scenario | Expected Action |
|----------|-----------------|
| Pi opens at 23:50 | No reminder; extension begins monitoring |
| Clock reaches 00:00 while Pi is open | Reminder issued (first evaluation after midnight) |
| Pi opens at 01:00, no prior reminder today | Reminder issued immediately on startup |
| Pi opens at 01:00, prior reminder today already sent | No reminder on startup; no duplicate |
| Pi open from 00:00 through 06:00 | Exactly one reminder issued during that span |
| Pi closed at 02:00 after reminder, reopened at 04:00 | No reminder (already reminded today) |

### 3.5 Decisions
- **Approved:** On startup, evaluate **immediately** and issue a reminder if the window is active and no reminder was yet sent today.

### 3.6 Non-requirement (Implementation Detail)
- The mechanism used for continued monitoring (polling interval, event-driven scheduler, etc.) is an implementation choice. A polling interval of 60 seconds is **acceptable** but is **not** a behavioral requirement.

---

## 4. Session Cleanup Behavior

### 4.1 Scope of Cleanup (Requirement)
- **R4.1.1** When the Pi session ends (Pi is closed / extension is deactivated), the extension shall deregister any timers, listeners, or intervals it created during activation to prevent memory leaks or orphaned background tasks.
- **R4.1.2** The extension shall **not** clear or discard the persisted duplicate-prevention state on session end. The last-reminded date must remain available for future sessions.

### 4.2 Acceptance Criteria (Cleanup)
| Scenario | Expected Action |
|----------|-----------------|
| Pi opened at 00:30, reminder issued, Pi closed at 01:00 | Timers stopped; runtime resources freed |
| Pi re-opened at 02:00 same date | No reminder (persisted state preserved from prior session) |
| Pi opened at 07:00 | No reminder; state read from persistence |

### 4.3 Decisions
- **Approved:** Cleanup stops timers and frees runtime resources, but **does not** clear the persisted last-reminded date.
- **Approved:** A user who closes and reopens Pi on the same date **shall not** receive a second reminder.

---

## 5. Unresolved Ambiguities (To Be Addressed in Implementation)

The following questions remain intentionally open and will be resolved during implementation (W1-2 / W1-3):

1. **Storage mechanism:** How is the last-reminded date persisted? (File, Pi storage API, environment variable?)
2. **Pi API shape:** Exact method signatures for registering the extension and emitting reminder messages will be determined when reading the Pi SDK.
3. **Cleanup trigger:** Exact event or hook that signals "session end" (window close, `deactivate()`, etc.) will be determined from the Pi SDK.
4. **Missed-day behavior:** If Pi is not opened for several days, should any "catch-up" occur? **Current stance:** No catch-up; only real-time evaluation matters.

---

## 6. Decision Log

| ID | Topic | Decision |
|----|-------|----------|
| D1 | Timezone | Use system local time |
| D2 | DST | No special-casing; accept system clock |
| D3 | Time comparison precision | Behavioral requirement is the interval [00:00, 06:00); comparison technique is implementation detail |
| D4 | "Today" definition | Calendar date (year-month-day) |
| D5 | Duplicate scope | **Option B** — persist across sessions (global per-day guarantee) |
| D6 | Polling interval | Implementation choice; 60s is acceptable but not required |
| D7 | Startup inside window | Evaluate immediately on activation |
| D8 | Cleanup scope | Stop timers/listeners; preserve persisted duplicate state |
| D9 | Reopen same date | No second reminder allowed |

---

**Specification locked:** Ready to proceed to **W1-2 — Write Acceptance Tests**.
