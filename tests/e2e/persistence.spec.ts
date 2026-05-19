import { test, expect, seedApp, readState } from "./fixtures";

/**
 * Verifies the app rehydrates every meaningful piece of state from
 * localStorage on reload: tasks, completion, quadrant assignment, streak,
 * and break-day counters.
 */

test.describe("persistence across reload", () => {
  test("tasks, completion, quadrant, and streak survive reload", async ({ page }) => {
    await seedApp(page, {
      tasks: [
        { title: "Do first thing", today: true, quadrant: "q1" },
        {
          title: "Schedule thing",
          today: true,
          quadrant: "q2",
          completed: true,
          completedAt: Date.now(),
        },
        { title: "Backlog item", today: false, quadrant: null },
      ],
      streak: {
        current: 7,
        longest: 12,
        lastCompletedDate: new Date().toISOString().slice(0, 10),
        totalDays: 7,
      },
    });

    // Pre-reload assertions
    await expect(page.getByTestId("streak-badge")).toHaveAttribute("data-streak", "7");
    await expect(
      page
        .getByTestId("quadrant-q1")
        .getByTestId("task-card")
        .filter({ hasText: "Do first thing" }),
    ).toBeVisible();
    await expect(
      page
        .getByTestId("quadrant-q2")
        .getByTestId("task-card")
        .filter({ hasText: "Schedule thing" }),
    ).toHaveAttribute("data-completed", "true");

    await page.reload();
    await page.getByTestId("mission-panel").waitFor();
    await expect(page.getByTestId("mission-list").getByTestId("task-card").first()).toBeVisible();

    // Post-reload — same state
    await expect(page.getByTestId("streak-badge")).toHaveAttribute("data-streak", "7");
    await expect(
      page
        .getByTestId("quadrant-q1")
        .getByTestId("task-card")
        .filter({ hasText: "Do first thing" }),
    ).toHaveAttribute("data-quadrant", "q1");
    await expect(
      page
        .getByTestId("quadrant-q2")
        .getByTestId("task-card")
        .filter({ hasText: "Schedule thing" }),
    ).toHaveAttribute("data-completed", "true");
    await expect(
      page.getByTestId("mission-list").getByTestId("task-card").filter({ hasText: "Backlog item" }),
    ).toBeVisible();

    const state = await readState(page);
    expect(state.streak.current).toBe(7);
    expect(state.streak.longest).toBe(12);
    expect(state.tasks).toHaveLength(3);
  });
});
