import { defineConfig } from "@playwright/test";
import base from "./playwright.config.mjs";

// The pre-merge signal: does the built site load, render from the tokens, and
// stay keyboard-operable. It is a subset by construction, so it reports with
// the plain list reporter and never the evidence reporter — a filtered run
// must not be able to write test-results/evidence.json or publish a partial
// matrix. Coverage claims come from the full suite (D-028).
//
// Excluded by name: the axe scan and the search/filter enhancement test, the
// two that raise their own timeouts and together account for most of the
// desktop wall clock.
export default defineConfig({
  ...base,
  reporter: "list",
  outputDir: "test-results/smoke",
  grepInvert: /axe finds no WCAG|enhancements: search narrows the contents/,
  testMatch: ["page.spec.js", "portal.spec.js", "components/button.spec.js", "components/text-field.spec.js"],
  projects: base.projects.filter((p) => p.name === "desktop"),
});
