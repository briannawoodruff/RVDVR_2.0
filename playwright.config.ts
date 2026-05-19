import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 5173);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL,
    actionTimeout: 15_000,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        // `vite dev` with TanStack Start + Cloudflare plugin can take a long
        // time to be ready on a cold CI runner. Bind to 127.0.0.1 explicitly
        // and give it a generous timeout so the readiness probe doesn't fail.
        command: `bunx vite dev --port ${PORT} --host 127.0.0.1 --strictPort`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 300_000,
        stdout: "pipe",
        stderr: "pipe",
      },


});
