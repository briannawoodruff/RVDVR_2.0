## Problem
`playwright.config.ts` hardcodes `bunx vite dev ...` as the webServer command. On your Windows machine without Bun installed, `bunx` is not recognized and Playwright can't start the dev server.

## Fix
Make the webServer command runtime-agnostic so it works with whichever package manager is installed (npm, bun, pnpm, yarn).

### Change 1: `playwright.config.ts`
Replace the hardcoded `bunx` with an env-driven runner that defaults to `npx` (which ships with Node.js and is universally available), and allow override via `PLAYWRIGHT_RUNNER`:

```ts
const runner = process.env.PLAYWRIGHT_RUNNER ?? "npx";
// ...
command: `${runner} vite dev --port ${PORT} --host 127.0.0.1 --strictPort`,
```

CI (`.github/workflows/playwright.yml`) already uses `bunx`, so add `PLAYWRIGHT_RUNNER=bunx` to the CI env to preserve Bun usage there. Local users on npm get `npx` automatically; Bun users can `set PLAYWRIGHT_RUNNER=bunx` (or it just works if they prefer npx).

### Change 2: `.github/workflows/playwright.yml`
Add `env: PLAYWRIGHT_RUNNER: bunx` to the "Run Playwright tests" step so CI keeps using Bun.

### Change 3 (optional, recommended): `package.json` scripts
Add convenience scripts so you don't have to remember the flags:
```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui",
"test:e2e:debug": "playwright test --debug",
"test:e2e:report": "playwright show-report"
```

## After this lands, your Windows workflow becomes:
```powershell
npm install
npx playwright install chromium
npm run test:e2e
```

No Bun required. CI continues running on Bun unchanged.