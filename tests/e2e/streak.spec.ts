import { test, expect, seedApp, readState, addMissionTask, completeTask } from "./fixtures";
import { format } from "date-fns";

/**
 * Streak logic lives in src/lib/streak.ts.
 * Key rules verified here:
 *   - One streak increment per calendar day (idempotent same-day completions)
 *   - Reload must not duplicate the streak
 *   - Gap of 1 day → +1; gap > 1 day → reset (unless gap===2 and rest day earned)
 *   - Rest day grace fires only at streak multiples of 5
 */

test.describe("streak: one increment per day", () => {
  test("completing first task today moves streak from 0 → 1", async ({ app }) => {
    await expect(app.getByTestId("streak-badge")).toHaveAttribute("data-streak", "0");
    await addMissionTask(app, "First win");
    // Move task to Today via the store (not required by streak logic, but realistic).
    await completeTask(app, "First win");
    await expect(app.getByTestId("streak-badge")).toHaveAttribute("data-streak", "1");
  });

  test("completing multiple tasks the same day still only counts once", async ({ app }) => {
    await addMissionTask(app, "Task A");
    await addMissionTask(app, "Task B");
    await addMissionTask(app, "Task C");

    await completeTask(app, "Task A");
    await completeTask(app, "Task B");
    await completeTask(app, "Task C");

    // Streak should be exactly 1 — not 3.
    await expect(app.getByTestId("streak-badge")).toHaveAttribute("data-streak", "1");
    const state = await readState(app);
    expect(state.streak.current).toBe(1);
    expect(state.streak.totalDays).toBe(1);
  });

  test("uncomplete + recomplete on the same day does not double-count", async ({ app }) => {
    await addMissionTask(app, "Toggle me");
    await completeTask(app, "Toggle me");
    // Toggling back to incomplete leaves streak intact (no decrement).
    await app
      .getByTestId("task-card")
      .filter({ hasText: "Toggle me" })
      .getByTestId("task-toggle")
      .click();
    await completeTask(app, "Toggle me");
    await expect(app.getByTestId("streak-badge")).toHaveAttribute("data-streak", "1");
  });
});

test.describe("streak: refresh does not duplicate", () => {
  test("reload preserves streak count without incrementing", async ({ app }) => {
    await addMissionTask(app, "Persistent win");
    await completeTask(app, "Persistent win");
    await expect(app.getByTestId("streak-badge")).toHaveAttribute("data-streak", "1");

    await app.reload();
    await app.getByTestId("mission-panel").waitFor();
    await expect(app.getByTestId("streak-badge")).toHaveAttribute("data-streak", "1");
  });
});

test.describe("streak: date edge cases (seeded)", () => {
  // Helper: compute a YYYY-MM-DD string offset by N days from today.
  const dayOffset = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return format(d, "yyyy-MM-dd");
  };

  test("gap > 1 day resets streak on app load (reconcileStreak)", async ({ page }) => {
    await seedApp(page, {
      streak: {
        current: 3,
        longest: 3,
        lastCompletedDate: dayOffset(-3), // 3 days ago — streak should break
        totalDays: 3,
      },
    });
    await expect(page.getByTestId("streak-badge")).toHaveAttribute("data-streak", "0");
  });

  test("gap of exactly 1 day preserves streak (consecutive day)", async ({ page }) => {
    await seedApp(page, {
      streak: {
        current: 2,
        longest: 2,
        lastCompletedDate: dayOffset(-1),
        totalDays: 2,
      },
    });
    // Reconcile leaves streak intact; UI still shows 2.
    await expect(page.getByTestId("streak-badge")).toHaveAttribute("data-streak", "2");
  });

  test("same-day reload is idempotent", async ({ page }) => {
    await seedApp(page, {
      streak: {
        current: 4,
        longest: 4,
        lastCompletedDate: dayOffset(0),
        totalDays: 4,
      },
    });
    await expect(page.getByTestId("streak-badge")).toHaveAttribute("data-streak", "4");
    await page.reload();
    await page.getByTestId("mission-panel").waitFor();
    await expect(page.getByTestId("streak-badge")).toHaveAttribute("data-streak", "4");
  });

  test("consecutive-day completion increments streak", async ({ page }) => {
    // Seed: yesterday completed at streak=2. Completing a task today → 3.
    await seedApp(page, {
      tasks: [{ title: "Today work", today: true }],
      streak: {
        current: 2,
        longest: 2,
        lastCompletedDate: dayOffset(-1),
        totalDays: 2,
      },
    });
    await completeTask(page, "Today work");
    await expect(page.getByTestId("streak-badge")).toHaveAttribute("data-streak", "3");
  });
});

test.describe("break-day (rest day) logic", () => {
  // A rest day is "earned" when current is a positive multiple of 5
  // (isRestDayEarned). The badge shows a Leaf icon and the text
  // "rest day earned" on wide viewports.

  test("badge announces rest day at streak=5", async ({ page }) => {
    await seedApp(page, {
      streak: {
        current: 5,
        longest: 5,
        lastCompletedDate: new Date().toISOString().slice(0, 10),
        totalDays: 5,
      },
    });
    const badge = page.getByTestId("streak-badge");
    await expect(badge).toHaveAttribute("data-streak", "5");
    // "rest day earned" text appears on >=640px viewports only.
    const vp = page.viewportSize();
    if (vp && vp.width >= 640) {
      await expect(badge).toContainText(/rest day earned/i);
    }
  });

  test("rest day grace: gap of 2 days at streak multiple of 5 preserves streak", async ({ page }) => {
    const ago = (n: number) => {
      const d = new Date();
      d.setDate(d.getDate() - n);
      return format(d, "yyyy-MM-dd");
    };
    await seedApp(page, {
      streak: {
        current: 5, // rest day earned
        longest: 5,
        lastCompletedDate: ago(2), // skipped one day, used the rest
        totalDays: 5,
      },
    });
    // reconcileStreak should NOT reset because current%5===0 and gap===2.
    await expect(page.getByTestId("streak-badge")).toHaveAttribute("data-streak", "5");
  });

  test("rest day count persists after refresh", async ({ page }) => {
    await seedApp(page, {
      streak: {
        current: 10,
        longest: 10,
        lastCompletedDate: new Date().toISOString().slice(0, 10),
        totalDays: 10,
      },
    });
    await expect(page.getByTestId("streak-badge")).toHaveAttribute("data-streak", "10");
    await page.reload();
    await page.getByTestId("mission-panel").waitFor();
    await expect(page.getByTestId("streak-badge")).toHaveAttribute("data-streak", "10");
    const state = await readState(page);
    expect(state.streak.current).toBe(10);
    expect(state.streak.longest).toBe(10);
  });

  test("gap of 2 days WITHOUT rest day earned still breaks the streak", async ({ page }) => {
    const ago = (n: number) => {
      const d = new Date();
      d.setDate(d.getDate() - n);
      return format(d, "yyyy-MM-dd");
    };
    await seedApp(page, {
      streak: {
        current: 3, // not a multiple of 5 → no rest day grace
        longest: 3,
        lastCompletedDate: ago(2),
        totalDays: 3,
      },
    });
    await expect(page.getByTestId("streak-badge")).toHaveAttribute("data-streak", "0");
  });
});
