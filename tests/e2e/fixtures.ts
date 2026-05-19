import { test as base, expect, type Page } from "@playwright/test";

/**
 * Storage key used by the app's persistence layer (src/lib/store.ts).
 * Tests seed/clear this key to control initial state.
 */
export const STORAGE_KEY = "rvdar.state.v1";
const SEED_MARKER = "__rvdar_e2e_seeded";

export type SeedStreak = {
  current?: number;
  longest?: number;
  lastCompletedDate?: string | null;
  restDayActiveFor?: string | null;
  totalDays?: number;
};

export type SeedTask = {
  id?: string;
  title: string;
  notes?: string;
  createdAt?: number;
  completed?: boolean;
  completedAt?: number;
  today?: boolean;
  quadrant?: "q1" | "q2" | "q3" | "q4" | null;
  order?: number;
};

export type SeedState = {
  tasks?: SeedTask[];
  streak?: SeedStreak;
  hasOnboarded?: boolean;
  focusMode?: boolean;
  theme?: "light" | "dark";
};

const defaultStreak = (): Required<SeedStreak> => ({
  current: 0,
  longest: 0,
  lastCompletedDate: null,
  restDayActiveFor: null,
  totalDays: 0,
});

/**
 * Build a full persisted state object from a partial seed.
 * Mirrors the shape produced by useAppStore so the store hydrates cleanly.
 */
export function buildSeed(partial: SeedState = {}) {
  const tasks = (partial.tasks ?? []).map((t, i) => ({
    id: t.id ?? `seed-${i}-${Math.random().toString(36).slice(2, 8)}`,
    title: t.title,
    notes: t.notes,
    createdAt: t.createdAt ?? Date.now() - 1000 * i,
    completed: t.completed ?? false,
    completedAt: t.completedAt,
    today: t.today ?? false,
    quadrant: t.quadrant ?? null,
    order: t.order ?? i,
  }));
  return {
    tasks,
    streak: { ...defaultStreak(), ...(partial.streak ?? {}) },
    hasOnboarded: partial.hasOnboarded ?? true,
    focusMode: partial.focusMode ?? false,
    theme: partial.theme ?? "light",
  };
}

async function gotoSeededApp(page: Page, seed: ReturnType<typeof buildSeed>) {
  await page.addInitScript(
    ([key, value, marker]) => {
      try {
        if (sessionStorage.getItem(marker as string)) return;
        localStorage.clear();
        localStorage.setItem(key as string, JSON.stringify(value));
        sessionStorage.setItem(marker as string, "1");
      } catch {
        /* ignore */
      }
    },
    [STORAGE_KEY, seed, SEED_MARKER] as const,
  );
  await page.goto("/");
  await page.getByTestId("mission-panel").or(page.getByTestId("mission-expand")).first().waitFor();
}

/**
 * Custom Playwright fixture that:
 *   1. Wipes localStorage before app boot.
 *   2. Seeds a clean, onboarded state so the help dialog stays closed.
 *   3. Navigates to "/" and waits for hydration.
 *
 * Use `seedApp(page, state)` if a test needs a non-default initial state —
 * call it BEFORE the first navigation.
 */
export const test = base.extend<{ app: Page }>({
  app: async ({ page }, use) => {
    // Seed exactly once before app boot. The session marker prevents reloads
    // from wiping state that the app or test intentionally persisted.
    await gotoSeededApp(page, buildSeed());
    await use(page);
  },
});

export { expect };

/**
 * Seed a specific app state then (re)navigate. Useful for streak/persistence
 * scenarios where we need a known starting point.
 */
export async function seedApp(page: Page, state: SeedState) {
  await gotoSeededApp(page, buildSeed(state));
}

/** Read the persisted state directly from localStorage. */
export async function readState(page: Page) {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }, STORAGE_KEY);
}

/** Add a task via the Mission Panel input. */
export async function addMissionTask(page: Page, title: string) {
  const expand = page.getByTestId("mission-expand");
  if (await expand.isVisible().catch(() => false)) {
    await expand.click();
  }

  const input = page.getByTestId("mission-add-input");
  await expect(input).toBeVisible();
  await expect(input).toBeEditable();
  await input.fill(title);
  await input.press("Enter");
  await expect(
    page.getByTestId("mission-list").getByTestId("task-card").filter({ hasText: title }),
  ).toBeVisible();
  await page.waitForFunction(
    ([key, taskTitle]) => {
      const raw = localStorage.getItem(key as string);
      if (!raw) return false;
      return JSON.parse(raw).tasks?.some((t: { title: string }) => t.title === taskTitle);
    },
    [STORAGE_KEY, title] as const,
  );
}

/** Find a task card anywhere in the app by visible title. */
export function taskByTitle(page: Page, title: string) {
  return page.getByTestId("task-card").filter({ hasText: title }).first();
}

/** Toggle a task's completion via its checkmark button. */
export async function completeTask(page: Page, title: string) {
  const card = taskByTitle(page, title);
  await card.getByTestId("task-toggle").click();
  await expect(card).toHaveAttribute("data-completed", "true");
  await page.waitForFunction(
    ([key, taskTitle]) => {
      const raw = localStorage.getItem(key as string);
      if (!raw) return false;
      return JSON.parse(raw).tasks?.some(
        (t: { title: string; completed: boolean }) => t.title === taskTitle && t.completed,
      );
    },
    [STORAGE_KEY, title] as const,
  );
}

/**
 * Drag a task into a drop zone using @dnd-kit's keyboard sensor.
 * Reliable across desktop & mobile viewports because it doesn't depend on
 * pointer geometry (which is flaky with sortable libraries).
 *
 * Flow: focus card → Space (pick up) → repeated Tab/Arrow until announced
 * target matches → Space (drop). We use a simpler approach: focus the card,
 * Space, then use arrow keys until the target container highlights, then
 * Space. Because that's fragile across layouts, we instead use Playwright's
 * pointer drag with manual mouse moves which dnd-kit's PointerSensor handles
 * deterministically when the distance threshold (5px) is crossed.
 */
export async function dragTaskTo(page: Page, sourceTitle: string, targetTestId: string) {
  const card = taskByTitle(page, sourceTitle);
  const target = page.getByTestId(targetTestId);

  const cardBox = await card.boundingBox();
  const targetBox = await target.boundingBox();
  if (!cardBox || !targetBox) throw new Error("drag source or target not visible");

  const startX = cardBox.x + cardBox.width / 2;
  const startY = cardBox.y + cardBox.height / 2;
  const endX = targetBox.x + targetBox.width / 2;
  const endY = targetBox.y + targetBox.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  // Cross the 5px PointerSensor activation threshold first.
  await page.mouse.move(startX + 8, startY + 8, { steps: 5 });
  // Then ease toward the target so dnd-kit collision detection registers it.
  await page.mouse.move(endX, endY, { steps: 20 });
  // Pause over target so droppable `isOver` settles before release.
  await page.waitForTimeout(120);
  await page.mouse.up();
}
