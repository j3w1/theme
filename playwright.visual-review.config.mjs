import { defineConfig } from "@playwright/test";
const port = Number(process.env.REVIEW_PORT ?? 4322);
export default defineConfig({
  testDir: "./tests/visual-review", workers: 1, retries: 0, timeout: 45000,
  outputDir: ".cache/phase6a/evidence/results",
  reporter: [["list"], ["json", { outputFile: ".cache/phase6a/evidence/results.json" }]],
  use: { baseURL: `http://127.0.0.1:${port}`, browserName: "chromium", viewport: { width: 1440, height: 1100 }, trace: "retain-on-failure" },
  webServer: { command: "node scripts/phase6-visual-review.mjs --serve", url: `http://127.0.0.1:${port}/review/compare/`, reuseExistingServer: true },
});
