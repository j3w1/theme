import { test as base, expect } from "@playwright/test";
import os from "node:os";

// Record declared page modes, not a guessed mode or the state of about:blank.
// Protocols exercising several local specimen modes describe that scope in their annotation.
export const readPageMode = async page => {
  if (page.isClosed()) return { profile: "unavailable: page closed", density: "unavailable: page closed" };
  try {
    return await page.evaluate(() => ({
      profile: document.documentElement.getAttribute("data-profile") ?? "not-declared",
      density: document.documentElement.getAttribute("data-density") ?? "not-declared",
    }));
  } catch { return { profile: "unavailable: page context", density: "unavailable: page context" }; }
};

export const test = base.extend({
  verificationEnvironment: [async ({ browser, page }, use, testInfo) => {
    try { await use(); }
    finally {
      testInfo.annotations.push({ type: "verification-environment", description: JSON.stringify({
        browser: browser.browserType().name(), browserVersion: browser.version(),
        os: `${os.type()} ${os.release()} ${os.arch()}`,
        viewport: page.viewportSize(), project: testInfo.project.name,
        ...await readPageMode(page), javaScript: testInfo.project.use.javaScriptEnabled !== false,
      }) });
    }
  }, { auto: true }],
});
export { expect };
