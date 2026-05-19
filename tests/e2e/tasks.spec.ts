import { test, expect } from "./fixtures";
import { addMissionTask } from "./fixtures";

test.describe("task crud", () => {
  test("add task appears in Mission Panel", async ({ app }) => {
    await addMissionTask(app, "Write tests");
    await expect(
      app.getByTestId("mission-list").getByTestId("task-card"),
    ).toHaveCount(1);
  });

  test("toggle complete updates state and progress", async ({ app }) => {
    await addMissionTask(app, "Drink water");
    const card = app
      .getByTestId("mission-list")
      .getByTestId("task-card")
      .filter({ hasText: "Drink water" });
    await card.getByTestId("task-toggle").click();
    await expect(card).toHaveAttribute("data-completed", "true");
  });

  test("edit task title via pencil", async ({ app }) => {
    await addMissionTask(app, "Original title");
    const card = app
      .getByTestId("mission-list")
      .getByTestId("task-card")
      .filter({ hasText: "Original title" });
    await card.getByTestId("task-edit").click();
    const input = card.getByTestId("task-edit-input");
    await input.fill("Renamed");
    await input.press("Enter");
    await expect(card.getByTestId("task-title")).toHaveText("Renamed");
  });

  test("delete removes task", async ({ app }) => {
    await addMissionTask(app, "Throwaway");
    const card = app
      .getByTestId("mission-list")
      .getByTestId("task-card")
      .filter({ hasText: "Throwaway" });
    await card.getByTestId("task-delete").click();
    await expect(card).toHaveCount(0);
  });

  test("empty input does not add a task", async ({ app }) => {
    const input = app.getByTestId("mission-add-input");
    await input.fill("   ");
    await input.press("Enter");
    await expect(
      app.getByTestId("mission-list").getByTestId("task-card"),
    ).toHaveCount(0);
  });
});

test.describe("persistence", () => {
  test("tasks survive a reload", async ({ app }) => {
    await addMissionTask(app, "Persist me");
    await app.reload();
    await expect(
      app
        .getByTestId("mission-list")
        .getByTestId("task-card")
        .filter({ hasText: "Persist me" }),
    ).toBeVisible();
  });
});
