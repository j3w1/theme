import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/ui", workers: 1, retries: 0, timeout: 30000,
  globalSetup: "./tests/ui/global-setup.mjs",
  outputDir: ".cache/ui-evidence/traces",
  reporter: [["list"], ["json", { outputFile: ".cache/ui-evidence/results.json" }]],
  use: { baseURL: "http://127.0.0.1:4187", viewport: { width: 1280, height: 900 }, trace: "retain-on-failure" },
  projects: ["chromium", "firefox", "webkit"].map(browserName => ({ name: browserName, use: { browserName } })),
  webServer: { command: "node tests/ui/serve.mjs", url: "http://127.0.0.1:4187/html/", reuseExistingServer: true },
});
