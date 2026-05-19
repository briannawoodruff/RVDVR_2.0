import { test as base, expect, type Page } from "@playwright/test";

/**
 * Fixture that opens the app with a clean localStorage,
 * marks onboarding done so the help dialog doesn't auto-open,
 * and waits for the app to hydrate.
 */
export const test = base.extend<{ app: Page }>({
  app: async ({ page }, use) => {
    // Pre-seed localStorage before app boot so onboarding dialog stays closed
    // and the store starts from a known-empty state.
    await page.addInitScript(() => {
      try {
        localStorage.clear();
        localStorage.setItem(
          "rvdar.state.v1",
          JSON.stringify({
            tasks: [],
            streak: { current: 0, lastCompletedDate: null, restDaysBanked: 0 },
            focusMode: false,
            theme: "light",
            hasOnboarded: true,
          }),
        );
      } catch {
        // ignore
      }
    });

    await page.goto("/");
    // Wait for hydration — Mission Panel renders only after hydrate
    await page.getByTestId("mission-panel").waitFor();
    await use(page);
  },
});

export { expect };

export async function addMissionTask(page: Page, title: string) {
  const input = page.getByTestId("mission-add-input");
  await input.fill(title);
  await input.press("Enter");
  await expect(
    page.getByTestId("mission-list").getByTestId("task-card").filter({ hasText: title }),
  ).toBeVisible();
}
