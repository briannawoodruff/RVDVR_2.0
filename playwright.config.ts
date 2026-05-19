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
  use: {
    baseURL,
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
        // In CI we build once and serve the static preview — far faster and
        // more reliable than `vite dev` with the TanStack Start + Cloudflare
        // plugin, which routinely needs >2min to be ready on a cold runner.
        command: process.env.CI
          ? `bun run build:dev && bunx vite preview --port ${PORT} --host 127.0.0.1 --strictPort`
          : "bun run dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 300_000,
        stdout: "pipe",
        stderr: "pipe",
      },

});
