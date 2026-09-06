// Browser tests run against the built dist/ served only under /theme/.
// Projects: desktop, narrow (360px), zoom200 (1280 at 200% = 640 CSS px),
// and nojs (JavaScript disabled: everything normative must still be there).

import { defineConfig, devices } from "@playwright/test";

const port = 4173;

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${port}/theme/`,
    headless: true,
    trace: "retain-on-failure",
    browserName: "chromium",
    channel: process.env.PW_CHANNEL || undefined,
  },
  webServer: {
    command: `node tests/browser/serve-dist.mjs ${port}`,
    url: `http://localhost:${port}/theme/`,
    reuseExistingServer: !process.env.CI,
    timeout: 20_000,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } } },
    { name: "narrow", use: { ...devices["Desktop Chrome"], viewport: { width: 360, height: 740 } } },
    { name: "zoom200", use: { ...devices["Desktop Chrome"], viewport: { width: 640, height: 500 }, deviceScaleFactor: 2 } },
    { name: "nojs", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 }, javaScriptEnabled: false } },
  ],
});
