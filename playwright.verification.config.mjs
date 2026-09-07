import { defineConfig } from "@playwright/test";
import base from "./playwright.config.mjs";
// These validate report presentation, never supply evidence for the specimens
// or certify the report's own execution status.
export default defineConfig({ ...base, testDir: "./tests/verification", testMatch: "*.spec.js", reporter: "list", outputDir: "test-results/verification-report", projects: base.projects.filter((p) => ["desktop", "narrow", "nojs"].includes(p.name)) });
