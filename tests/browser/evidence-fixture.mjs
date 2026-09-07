import { test as base, expect } from "@playwright/test";
import os from "node:os";

export const test = base.extend({
  verificationEnvironment: [async ({ browser, page }, use, testInfo) => {
    testInfo.annotations.push({ type: "verification-environment", description: JSON.stringify({
      browser: browser.browserType().name(), browserVersion: browser.version(),
      os: `${os.type()} ${os.release()} ${os.arch()}`,
      viewport: page.viewportSize(), project: testInfo.project.name,
      profile: "default", density: "comfortable", javaScript: testInfo.project.use.javaScriptEnabled !== false,
    }) });
    await use();
  }, { auto: true }],
});
export { expect };
