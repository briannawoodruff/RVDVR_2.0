# Fix the 3 failing Playwright tests

All three failures are bugs **in the tests**, not in app code. Two distinct root causes.

## Failure 1 — `tasks.spec.ts:22` "edit task title via pencil"

The test reuses a locator filtered by the old title:

```ts
const card = app.getByTestId("mission-list")
  .getByTestId("task-card")
  .filter({ hasText: "Original title" }); // filter is re-evaluated on every await
// ...rename to "Renamed"...
await expect(card.getByTestId("task-title")).toHaveText("Renamed"); // card no longer matches
```

After rename, the card's text becomes "Renamed", so the `hasText: "Original title"` filter matches 0 elements → `element(s) not found`. The sister file `editing.spec.ts` already does this correctly using `taskByTitle(app, "New name")` to re-query by the new title.

**Fix:** mirror the `editing.spec.ts` pattern.

```ts
import { addMissionTask, openEditor, taskByTitle } from "./fixtures";

test("edit task title via pencil", async ({ app }) => {
  await addMissionTask(app, "Original title");
  const card = taskByTitle(app, "Original title");
  const input = await openEditor(card);
  await input.fill("Renamed");
  await input.press("Enter");
  await expect(taskByTitle(app, "Renamed").getByTestId("task-title")).toHaveText("Renamed");
});
```

## Failure 2 & 3 — `streak.spec.ts:111` and `:186` (timezone bug)

The test helpers compute "yesterday" / "N days ago" using **UTC** dates:

```ts
const dayOffset = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10); // UTC date
};
```

But the app's `todayKey()` in `src/lib/streak.ts` uses **local** date:

```ts
export const todayKey = () => format(new Date(), "yyyy-MM-dd"); // local date
```

When the local timezone is behind UTC and it's late in the day (e.g., US evening, or the CI log timestamp `2026-05-29T02:43Z` = May 28 evening US), the two helpers disagree by a calendar day:

- Local time: May 28 evening → `todayKey()` = `"2026-05-28"`
- `dayOffset(-1)` = May 28 UTC = `"2026-05-28"` (same as today, not yesterday!)
- `dayOffset(-2)` = May 27 UTC = `"2026-05-27"` (only 1 day gap, not 2)

That explains both failures:
- **`:111`** seeds `lastCompletedDate: dayOffset(-1)`. The app sees `last === today` → `recordCompletionToday` returns state unchanged → streak stays at 2 instead of incrementing to 3.
- **`:186`** seeds `lastCompletedDate: ago(2)`. The app sees gap=1 → `reconcileStreak` returns state unchanged → streak stays at 3 instead of resetting to 0.

This also explains why the failure correlates with time-of-day: the user wouldn't see it earlier in the day in US timezones, but CI (UTC) at ~02:43Z hits it consistently.

**Fix:** make the test date helpers use the same local-date formatting the app uses.

```ts
import { format } from "date-fns";

const dayOffset = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return format(d, "yyyy-MM-dd"); // local date — matches todayKey()
};
```

Apply the same change to the inline `ago` helpers defined inside the `:150` and `:186` tests (or hoist a single shared helper at the top of the file).

## Files to change

1. `tests/e2e/tasks.spec.ts` — rewrite the `"edit task title via pencil"` test (lines 22–32) to use `taskByTitle` for the post-rename assertion and import it from `./fixtures`.
2. `tests/e2e/streak.spec.ts` — change the `dayOffset` helper (line 65) and the two inline `ago` helpers (lines 151 and 187) from `toISOString().slice(0, 10)` to `format(d, "yyyy-MM-dd")` from `date-fns`. Add the import.

## Verification

After the fixes, run the full suite the way CI does:

```
npx playwright test --reporter=html
```

All 39 tests (× 2 projects) should pass regardless of local timezone or time of day.

## Out of scope

No app code changes — `src/lib/streak.ts`, `src/components/TaskCard.tsx`, and the store are correct. Only the test files are wrong.
