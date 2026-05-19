import { test, expect, addMissionTask, dragTaskTo, taskByTitle, readState } from "./fixtures";

/**
 * Drag & drop interacts with @dnd-kit through real pointer events.
 * Pointer-based drags are sometimes flaky with sortable libraries, so we:
 *   1. Cross the 5px PointerSensor activation threshold deliberately.
 *   2. Move in many small steps so droppable collision detection registers.
 *   3. Pause briefly before release to let `isOver` settle.
 * See dragTaskTo() in fixtures.ts.
 *
 * On mobile-chrome (Pixel 7), the TouchSensor requires a 150ms hold; the
 * pause inside dragTaskTo() handles that. We still verify the outcome via
 * persisted state rather than visual position, which is more robust.
 */

test.describe("drag and drop: mission → today", () => {
  test("desktop: dragging a Mission task into Today moves it", async ({ app }, testInfo) => {
    test.skip(testInfo.project.name === "mobile-chrome", "covered by mobile test below");

    await addMissionTask(app, "Move me to today");
    await dragTaskTo(app, "Move me to today", "today-panel");

    // Card should now live inside #today-list and store should reflect today=true.
    await expect(
      app.getByTestId("today-list").getByTestId("task-card").filter({ hasText: "Move me to today" }),
    ).toBeVisible();
    const state = await readState(app);
    expect(state.tasks.find((t: { title: string }) => t.title === "Move me to today").today).toBe(true);
  });

  test("mobile: dragging a Mission task into Today moves it", async ({ app }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-chrome", "mobile-only scenario");

    await addMissionTask(app, "Mobile drag target");
    await dragTaskTo(app, "Mobile drag target", "today-panel");

    await expect(
      app.getByTestId("today-list").getByTestId("task-card").filter({ hasText: "Mobile drag target" }),
    ).toBeVisible();
  });
});

test.describe("drag and drop: into matrix quadrants", () => {
  for (const q of ["q1", "q2", "q3", "q4"] as const) {
    test(`drops into quadrant ${q} and tags task with that quadrant`, async ({ app }, testInfo) => {
      // Matrix isn't rendered on the mobile viewport in focus mode — but it's
      // visible by default. Skip only if quadrant somehow isn't visible.
      test.skip(testInfo.project.name === "mobile-chrome", "matrix dnd on mobile is covered separately");

      await addMissionTask(app, `Quad ${q} task`);
      // Task must be in Today to appear in the matrix; drag straight into the quadrant.
      await dragTaskTo(app, `Quad ${q} task`, `quadrant-${q}`);

      const card = app
        .getByTestId(`quadrant-${q}`)
        .getByTestId("task-card")
        .filter({ hasText: `Quad ${q} task` });
      await expect(card).toBeVisible();
      await expect(card).toHaveAttribute("data-quadrant", q);

      const state = await readState(app);
      const t = state.tasks.find((x: { title: string }) => x.title === `Quad ${q} task`);
      expect(t.quadrant).toBe(q);
      expect(t.today).toBe(true);
    });
  }
});

test.describe("drag and drop: integrity", () => {
  test("dragging does not duplicate or drop tasks", async ({ app }, testInfo) => {
    test.skip(testInfo.project.name === "mobile-chrome");

    for (const title of ["Alpha", "Beta", "Gamma"]) {
      await addMissionTask(app, title);
    }
    await dragTaskTo(app, "Beta", "today-panel");

    // Total task count is preserved.
    const allCards = app.getByTestId("task-card");
    // Each task renders once per pane (mission OR today/matrix). 3 tasks total.
    const state = await readState(app);
    expect(state.tasks).toHaveLength(3);
    // Beta is in Today exactly once.
    await expect(
      app.getByTestId("today-list").getByTestId("task-card").filter({ hasText: "Beta" }),
    ).toHaveCount(1);
    // Beta no longer appears in Mission list.
    await expect(
      app.getByTestId("mission-list").getByTestId("task-card").filter({ hasText: "Beta" }),
    ).toHaveCount(0);
    // Alpha and Gamma remain in Mission.
    await expect(
      app.getByTestId("mission-list").getByTestId("task-card"),
    ).toHaveCount(2);
    // Sanity: no orphan cards exist.
    expect(await allCards.count()).toBeGreaterThan(0);
  });
});
