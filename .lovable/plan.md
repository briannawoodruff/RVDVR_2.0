
## Root cause

All three failure clusters in the screenshots — and the `locator.fill: timeout 30000ms exceeded` errors — trace back to **one bug in `tests/e2e/fixtures.ts`**:

Both the `app` fixture and `seedApp()` register their seed via `page.addInitScript(...)`. Playwright re-runs every registered init script on **every navigation, including `page.reload()`**. The script unconditionally does:

```js
localStorage.clear();
localStorage.setItem(key, JSON.stringify(seed));
```

So any state the app (or the test) writes after the initial `goto` is wiped the moment the test reloads.

This breaks three categories of tests:

### 1. `streak.spec.ts` — "reload preserves streak count without incrementing" (received `0`, expected `1`)
- Test completes a task → store writes `streak.current = 1` to localStorage.
- `page.reload()` re-runs the fixture's init script → localStorage is reset to the empty seed.
- App rehydrates with `streak.current = 0`.

### 2. `reordering.spec.ts` — "changing array order in storage reflects in the UI after reload"
- Test seeds `[A, B, C]`, then `page.evaluate` rewrites localStorage to `[C, A, B]`.
- `page.reload()` re-runs `seedApp`'s init script (and, in tests that use `{ app }`, also the fixture's), overwriting back to `[A, B, C]`.
- The `[C, A, B, C]` 4-item received array comes from a hydration race during retry: the persisted store re-writes its pre-reload in-memory copy on top of the freshly seeded one before the assertion samples `allTextContents()`. Eliminating the re-seed makes this race impossible.

### 3. `locator.fill timeout` (mission-add-input)
- Happens on the **mobile-chrome** project (Pixel 7, 412px). When a previous test leaves `focusMode: true` or `hasOnboarded: false` in localStorage and a later test relies on the seeded state being applied, the init-script re-seed actually masks this — but the same fragility produces flaky timeouts when the HelpDialog opens over the input, or when the panel hasn't finished hydrating before `fill` is called. The fix is the same: make seeding deterministic and one-shot, and explicitly wait for the input to be editable.

## Fix

### A. `tests/e2e/fixtures.ts` — make seeding one-shot and reload-safe

Replace the `addInitScript`-based seeding with a single pre-navigation seed that survives reloads:

```ts
async function seedOnce(page: Page, seed: ReturnType<typeof buildSeed>) {
  // 1. Visit a blank same-origin page so localStorage is writable.
  await page.goto("/__seed__", { waitUntil: "commit" }).catch(() => {});
  await page.goto("about:blank");
  // 2. Register an init script that ONLY seeds when the key is missing.
  await page.addInitScript(
    ([key, value]) => {
      try {
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, JSON.stringify(value));
        }
      } catch {}
    },
    [STORAGE_KEY, seed] as const,
  );
  await page.goto("/");
  await page.getByTestId("mission-panel").or(page.getByTestId("mission-expand")).first().waitFor();
}
```

Key change: the init script becomes **idempotent** (`if (!localStorage.getItem(key))`). On the first navigation it seeds; on reloads the store-written state is preserved.

Apply the same pattern to both the `app` fixture and `seedApp()`.

### B. `addMissionTask` — wait for the input to be interactive

Tighten the helper so `fill` never races the hydration / dialog overlay on mobile:

```ts
export async function addMissionTask(page: Page, title: string) {
  const input = page.getByTestId("mission-add-input");
  await expect(input).toBeVisible();
  await expect(input).toBeEditable();
  await input.fill(title);
  await input.press("Enter");
  await expect(
    page.getByTestId("mission-list").getByTestId("task-card").filter({ hasText: title }),
  ).toBeVisible();
}
```

If the Mission Panel is collapsed (only relevant if a prior test left `collapsed=true`), expand it first by clicking `mission-expand` when present.

### C. `reordering.spec.ts` — make the data-mutation test reload-safe

With fix A in place, the `evaluate` → `reload` flow works because the init script no longer clobbers localStorage. No test-body changes required, but add an explicit `expect(...).toBeVisible()` for the first item after reload before sampling all titles, to avoid sampling mid-hydration:

```ts
await page.reload();
await page.getByTestId("mission-panel").waitFor();
await expect(
  page.getByTestId("mission-list").getByTestId("task-card").first(),
).toBeVisible();
const titles = await page.getByTestId("mission-list").getByTestId("task-title").allTextContents();
expect(titles).toEqual(["C", "A", "B"]);
```

### D. `streak.spec.ts` reload tests

No spec changes needed once fix A lands — the streak survives reload because the init script no longer wipes it.

## Files to change

- `tests/e2e/fixtures.ts` — rewrite `app` fixture + `seedApp()` to use the idempotent init script; harden `addMissionTask`.
- `tests/e2e/reordering.spec.ts` — add the post-reload visibility wait in the two reload-based tests.
- (Optional) `tests/e2e/persistence.spec.ts` — same post-reload visibility wait for consistency; not strictly required.

## Verification

- Run `bunx playwright test --project=chromium tests/e2e/streak.spec.ts tests/e2e/reordering.spec.ts tests/e2e/persistence.spec.ts` locally.
- Re-run the `mobile-chrome` project to confirm the `locator.fill` timeout is gone.
