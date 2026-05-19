import { test, expect } from "./fixtures";

test.describe("smoke", () => {
  test("app shell renders core regions", async ({ app }) => {
    await expect(app.getByTestId("mission-panel")).toBeVisible();
    await expect(app.getByTestId("today-panel")).toBeVisible();
    await expect(app.getByTestId("priority-matrix")).toBeVisible();
    await expect(app.getByTestId("streak-badge")).toBeVisible();
  });

  test("help dialog opens and closes", async ({ app }) => {
    await app.getByTestId("help-button").click();
    await expect(app.getByTestId("help-dialog")).toBeVisible();
    await app.getByTestId("help-close").click();
    await expect(app.getByTestId("help-dialog")).toHaveCount(0);
  });

  test("theme toggle switches html class", async ({ app }) => {
    const html = app.locator("html");
    const before = await html.getAttribute("class");
    await app.getByTestId("theme-toggle").click();
    await expect(html).not.toHaveClass(before ?? "");
  });
});
