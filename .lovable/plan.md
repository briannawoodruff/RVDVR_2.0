## Goal
Make the entire task card draggable, not just the grip handle. Keep all Playwright tests passing.

## Changes (single file: `src/components/TaskCard.tsx`)

1. **Move dnd-kit listeners from the grip button to the root `<div>`** so any pointer-down on the card initiates a drag:
   - Spread `{...attributes} {...listeners}` on the root `div` (the one with `setNodeRef`).
   - Add `touch-none` to the root className so touch drags work on mobile.
   - Drop `setActivatorNodeRef` (or keep it on the grip — both work; removing it lets the whole card be the activator).

2. **Keep the grip icon visible** as a visual affordance and keep `data-testid="task-drag-handle"` on it so `dragTaskTo()` in `tests/e2e/fixtures.ts` still finds it (it grabs the handle's bounding box, presses pointer down inside it, and moves — that still works when the parent owns the listeners).

3. **Stop drag activation on interactive children.** dnd-kit's PointerSensor activates on `pointerdown`, so each control needs `onPointerDown={stop}` (in addition to existing `onClick={stop}`):
   - `task-toggle` button
   - `task-edit` button
   - `task-delete` button
   - The edit `<input>` already has `onPointerDown={stop}` — leave as is.
   - The grip button can stay; events bubble to the root which still triggers drag.

## Why tests still pass
- `dragTaskTo()` (fixtures.ts) presses pointer-down on the `task-drag-handle` box and moves — this now activates the root listener but produces the same drag result.
- Edit/toggle/delete still receive their clicks because we only stop propagation, not default behavior.
- No test asserts that the grip is the sole activator.

## Out of scope
No changes to dnd-kit sensors, store, tests, or other components.