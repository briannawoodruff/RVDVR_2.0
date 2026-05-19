import { test, expect } from "./fixtures";

test.describe("ui controls", () => {
  test("focus mode hides priority matrix", async ({ app }) => {
    await expect(app.getByTestId("priority-matrix")).toBeVisible();
    await app.getByTestId("focus-toggle").click();
    await expect(app.getByTestId("priority-matrix")).toHaveCount(0);
    await app.getByTestId("focus-toggle").click();
    await expect(app.getByTestId("priority-matrix")).toBeVisible();
  });

  test("mission panel collapses and expands", async ({ app }) => {
    await app.getByTestId("mission-collapse").click();
    await expect(app.getByTestId("mission-expand")).toBeVisible();
    await app.getByTestId("mission-expand").click();
    await expect(app.getByTestId("mission-panel")).toBeVisible();
  });

  test("priority matrix shows all four quadrants", async ({ app }) => {
    for (const q of ["q1", "q2", "q3", "q4"] as const) {
      await expect(app.getByTestId(`quadrant-${q}`)).toBeVisible();
    }
  });
});
