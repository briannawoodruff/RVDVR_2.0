import { test, expect, addMissionTask, taskByTitle, readState } from "./fixtures";

test.describe("task editing", () => {
  test("user can edit a task via the pencil icon", async ({ app }) => {
    await addMissionTask(app, "Old name");
    const card = taskByTitle(app, "Old name");
    await card.getByTestId("task-edit").click();
    const input = card.getByTestId("task-edit-input");
    await input.fill("New name");
    await input.press("Enter");
    await expect(taskByTitle(app, "New name").getByTestId("task-title")).toHaveText("New name");
  });

  test("blank/whitespace-only edits do not overwrite the title", async ({ app }) => {
    await addMissionTask(app, "Keep me");
    const card = taskByTitle(app, "Keep me");
    await card.getByTestId("task-edit").click();
    const input = card.getByTestId("task-edit-input");
    await input.fill("   ");
    await input.press("Enter");
    // commit() ignores empty-after-trim values; original title persists.
    await expect(taskByTitle(app, "Keep me").getByTestId("task-title")).toHaveText("Keep me");
  });

  test("Escape cancels the edit and restores the original title", async ({ app }) => {
    await addMissionTask(app, "Original");
    const card = taskByTitle(app, "Original");
    await card.getByTestId("task-edit").click();
    const input = card.getByTestId("task-edit-input");
    await input.fill("Will be discarded");
    await input.press("Escape");
    await expect(taskByTitle(app, "Original").getByTestId("task-title")).toHaveText("Original");
  });

  test("edited title persists after reload", async ({ app }) => {
    await addMissionTask(app, "Before");
    const card = taskByTitle(app, "Before");
    await card.getByTestId("task-edit").click();
    const input = card.getByTestId("task-edit-input");
    await input.fill("After");
    await input.press("Enter");

    await app.reload();
    await app.getByTestId("mission-panel").waitFor();

    await expect(taskByTitle(app, "After").getByTestId("task-title")).toHaveText("After");
    const state = await readState(app);
    expect(state.tasks.some((t: { title: string }) => t.title === "After")).toBe(true);
    expect(state.tasks.some((t: { title: string }) => t.title === "Before")).toBe(false);
  });
});
