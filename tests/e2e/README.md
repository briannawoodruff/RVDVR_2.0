# RVDΛR end-to-end tests

Playwright tests live in `tests/e2e/`.

## Running

```bash
bun run test:e2e           # headless run
bun run test:e2e:ui        # interactive UI mode
bun run test:e2e:headed    # headed browser
```

The Playwright config starts `bun run dev` automatically and reuses an existing
dev server when one is already running. Override the target with
`PLAYWRIGHT_BASE_URL=https://staging.example.com bun run test:e2e`.

## Conventions

- Selectors use stable `data-testid` attributes (see the components in `src/components/`).
- The `app` fixture in `fixtures.ts` resets `localStorage` before each test and
  marks onboarding done so the help dialog does not auto-open.
- Helper: `addMissionTask(page, title)` adds a task via the Mission Panel input.

## Key test ids

| Region                  | testid                                     |
| ----------------------- | ------------------------------------------ |
| Mission panel           | `mission-panel`, `mission-list`            |
| Mission add input       | `mission-add-input`                        |
| Mission collapse/expand | `mission-collapse`, `mission-expand`       |
| Today panel             | `today-panel`, `today-list`                |
| Today progress          | `today-progress-bar`, `today-progress-pct` |
| Priority matrix         | `priority-matrix`, `quadrant-q1..q4`       |
| Streak badge            | `streak-badge` (with `data-streak`)        |
| Header buttons          | `focus-toggle`, `theme-toggle`, `help-button` |
| Help dialog             | `help-dialog`, `help-close`                |
| Task card               | `task-card` (with `data-task-id`, `data-completed`, `data-quadrant`) |
| Task controls           | `task-toggle`, `task-edit`, `task-edit-input`, `task-title`, `task-delete` |

Add new tests as `*.spec.ts` files in this folder.
