import { test, expect } from "./evidence-fixture.mjs";
import { capturePrivateMeasurement } from "../../scripts/lib/private-parity-browser.mjs";

test("private capture measurements describe the settled image rather than a transition frame", { annotation: {
  type: "verification", description: JSON.stringify({ component: "page", category: "appearance", states: [], variants: [], note: "Synthetic finite width transition exercises the independently authored private capture helper. Exact final measurement and repeated PNG equality; no licensed source, framework import, or component conformance claim." }),
} }, async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "One synthetic capture protocol; no licensed dependency");
  const captures = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    await page.setContent('<button style="box-sizing:border-box;width:100px;transition:width 10s linear">Example</button>');
    await page.locator("button").evaluate(element => {
      void element.offsetWidth;
      element.style.width = "200px";
      void element.offsetWidth;
    });
    const result = await capturePrivateMeasurement(page.locator("button"), info.outputPath(`settled-${attempt}.png`));
    expect(result.measurement.styles.width).toBe("200px");
    expect(result.measurement.box.width).toBe(200);
    captures.push(result.bytes);
  }
  expect(captures[0].equals(captures[1])).toBe(true);
});
