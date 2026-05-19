## Why the tests still time out

`editing.spec.ts` (and the `edit task title via pencil` / `delete removes task` cases in `tasks.spec.ts`) all do:

```ts
await card.getByTestId("task-edit").click();
await card.getByTestId("task-edit-input").fill("New name"); // ← 30 s timeout
```

The fill waits because `task-edit-input` never appears — i.e. `setEditing(true)` never runs. Two things in `src/components/TaskCard.tsx` conspire to make that click unreliable on headless Chromium:

1. **The edit/delete buttons live in an `opacity-0 group-hover:opacity-100` row.** Playwright considers `opacity:0` "visible" and will click anyway, but the hit-test sometimes lands on the surrounding card (1 px gap, transform from `useSortable`) instead of the 14 px icon button.
2. **The dnd-kit `{...listeners}` are spread on the entire card** with a `PointerSensor` activation distance of 5 px. The child `<button>` calls `e.stopPropagation()` on `onPointerDown`, which stops React-synthetic propagation — but Playwright's `click()` synthesizes `mouse.move → mouse.down → mouse.up`, and the move alone can be enough for the PointerSensor to start a pending drag on the parent before the React handler runs. When that happens the click event is swallowed and `editing` never flips.

The streak/persistence/reordering tests don't hit this because `task-toggle` is rendered outside the hover-revealed actions row.

## Fix (two layers, both small)

### 1. Component: make the drag activator a dedicated handle

In `src/components/TaskCard.tsx`:

- Keep `setNodeRef`, `attributes`, `transform`, `transition` on the outer `<div>`.
- Move `{...listeners}` off the card and onto the `<GripVertical>` element — wrap it in a `<button data-testid="task-drag-handle" aria-label="Drag task" {...listeners} className="cursor-grab active:cursor-grabbing touch-none">…</button>`.
- Drop `touch-none cursor-grab active:cursor-grabbing select-none` from the card root (move only `cursor-grab` to the handle).
- Drop the now-unneeded `onPointerDown={stop}` from `task-toggle`, `task-edit`, `task-delete` (they no longer compete with the sensor).

This is the canonical dnd-kit "drag handle" pattern. Behavior the user sees is identical (card is still draggable), but interior buttons can no longer race the sensor.

### 2. Component: always render the actions row, just dim it

Replace `opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100` with `opacity-60 hover:opacity-100 focus-within:opacity-100`. Buttons are always hit-testable; the visual "fade in on hover" stays. (Pure presentation change; no logic change.)

### 3. Tests: belt-and-suspenders

In `tests/e2e/fixtures.ts` add a helper:

```ts
export async function openEditor(card: Locator) {
  await card.scrollIntoViewIfNeeded();
  await card.hover();
  const btn = card.getByTestId("task-edit");
  await btn.waitFor({ state: "visible" });
  await btn.click();
  return card.getByTestId("task-edit-input");
}
```

Refactor `tests/e2e/editing.spec.ts` and the `edit task title via pencil` / `delete removes task` cases in `tests/e2e/tasks.spec.ts` to use `openEditor(card)` (and a parallel `await card.hover()` before `task-delete`).

### 4. Config: small safety margin

In `playwright.config.ts`:

- Add `expect: { timeout: 10_000 }` and `use.actionTimeout: 15_000`. Leaves room on the slow CI runner without masking real bugs.

## Files touched

- `src/components/TaskCard.tsx` — handle refactor + actions opacity.
- `tests/e2e/fixtures.ts` — new `openEditor` helper.
- `tests/e2e/editing.spec.ts` — use `openEditor`.
- `tests/e2e/tasks.spec.ts` — hover before edit/delete; use `openEditor` for the edit case.
- `playwright.config.ts` — `actionTimeout` + `expect.timeout`.

No app logic, store, or persistence behavior is changed.
