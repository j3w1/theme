import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";
import { sha256, stableJson } from "./fs.mjs";
import { compareProperties } from "./private-parity.mjs";
import { assertRealDirectory, assertRealFile } from "./safe-kit-writer.mjs";
const hostSelectors = { button: ".v-btn", "text-field": ".v-field", select: ".v-field", checkbox: ".v-checkbox", tabs: ".v-tabs", dialog: ".v-card", table: ".v-table" };
const properties = ["color", "background-color", "border-color", "border-width", "border-radius", "font-family", "font-size", "line-height", "padding", "outline-color", "outline-style", "outline-width", "outline-offset", "width", "height"];
const measure = async locator => locator.evaluate((element, names) => {
  const style = getComputedStyle(element), box = element.getBoundingClientRect();
  return { styles: Object.fromEntries(names.map(name => [name, style.getPropertyValue(name)])),
    box: { x: box.x, y: box.y, width: box.width, height: box.height }, text: element.textContent.trim() };
}, properties);

export const runPrivateParity = async prepared => {
  const { out, target, requireTarget, config, metadata } = prepared;
  await assertRealDirectory(out);
  const { createServer } = await import(pathToFileURL(requireTarget.resolve("vite")).href);
  const aliases = Object.fromEntries(Object.entries(config.aliases).map(([key, value]) => [key, path.join(out, "host", value)]));
  aliases.vue = path.join(target, "node_modules/vue/dist/vue.esm-bundler.js");
  aliases.vuetify = path.join(target, "node_modules/vuetify");
  const server = await createServer({ configFile: false, envFile: false, root: out, publicDir: false, cacheDir: path.join(out, ".cache"),
    resolve: { alias: aliases, dedupe: ["vue"] }, logLevel: "silent",
    server: { host: "127.0.0.1", port: 0, fs: { strict: true, allow: [out, path.join(target, "node_modules")] } },
    css: { preprocessorOptions: { scss: { loadPaths: [path.join(target, "node_modules")] } } },
  });
  let browser;
  const records = [], errors = [];
  try {
    await server.listen();
    const origin = server.resolvedUrls.local[0];
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 800, height: 600 }, deviceScaleFactor: 1, locale: "en-US", reducedMotion: "reduce", colorScheme: "dark" });
    await context.route("**/*", route => new URL(route.request().url()).origin === new URL(origin).origin ? route.continue() : route.abort());
    const page = await context.newPage();
    page.on("pageerror", error => errors.push(error.message));
    await fs.mkdir(path.join(out, "captures"));
    const environment = { browser: "chromium", browserVersion: browser.version(), os: os.type() + " " + os.release() + " " + os.arch(),
      viewport: { width: 800, height: 600 }, deviceScaleFactor: 1, locale: "en-US", reducedMotion: "reduce", density: "comfortable", javaScript: true };
    for (const entry of metadata.cases) {
      const measurements = {};
      for (const side of ["native", "host"]) {
        await page.goto(new URL(side === "native" ? entry.native : "?component=" + entry.id + "&state=" + entry.state, origin).href);
        if (side === "host") await page.locator('[data-parity-ready="true"]').waitFor();
        await page.evaluate(() => document.fonts.ready);
        const locator = page.locator(side === "native" ? entry.nativeSelector : hostSelectors[entry.id]).first();
        await locator.waitFor({ state: "visible" });
        // Match the bounded control's synthetic data. Surrounding helper prose
        // remains part of each maintained renderer and is not compared as data.
        if (side === "native") await page.evaluate(id => {
          if (id === "button") document.querySelector(".button-label").textContent = "Sample";
          if (id === "text-field") document.querySelector("input").value = "Example";
          if (id === "select") document.querySelector("select").replaceChildren(...["One", "Two"].map(text => new Option(text, text)));
          if (id === "checkbox") document.querySelector(".checkbox-text").textContent = "Sample";
          if (id === "tabs") document.querySelectorAll('[role="tab"]').forEach((tab, i) => { tab.textContent = i ? "Two" : "One"; });
          if (id === "table") {
            document.querySelectorAll("thead th").forEach((cell, i) => { cell.textContent = i ? "State" : "Name"; });
            const row = document.querySelector("tbody tr"); if (row) { row.querySelectorAll("td").forEach((cell, i) => { cell.textContent = i ? "Ready" : "Example"; }); for (const other of document.querySelectorAll("tbody tr")) if (other !== row) other.remove(); }
          }
        }, entry.id);
        if (entry.state === "focus-visible") await page.keyboard.press("Tab");
        const keyboard = await page.evaluate(() => ({ activeTag: document.activeElement?.tagName ?? null, focusVisible: document.activeElement?.matches(":focus-visible") ?? false }));
        measurements[side] = { ...await measure(locator), keyboard };
        const capture = path.join(out, "captures", entry.id + "-" + entry.state + "-" + side + ".png");
        const bytes = await locator.screenshot({ path: capture, animations: "disabled" });
        measurements[side].capture = { file: path.relative(out, capture).replaceAll(path.sep, "/"), digest: sha256(bytes) };
      }
      const differences = compareProperties(measurements.native.styles, measurements.host.styles);
      records.push({ ...entry, environment, measurements, differences,
        result: differences.some(item => item.result === "different") ? "differences recorded" : "matched measured properties",
        classification: "Host geometry, state layers and native-control structure are inherited. Differences are diagnostics, not approved substitutions or a verified port.",
        typography: measurements.native.styles["font-family"] === measurements.host.styles["font-family"] ? "same computed font family" : "environment mismatch: computed font families differ",
        limits: "Forced native visual states and actual host props are distinct. No historical application, manual screen-reader or complete keyboard conformance claim." });
    }
    const output = { ...metadata, result: errors.length ? "failed" : "completed", environment, records, errors,
      mapping: { mapped: ["primary fill", "on-primary text", "surface", "background", "default text", "error text"],
        inherited: ["component geometry", "state overlays", "focus implementation", "native widget structure"],
        unsupported: ["Complete application chrome, editor and terminal integration are outside this bounded fixture."] } };
    // Confirm the source inputs were unchanged by this experiment.
    for (const [file, expected] of Object.entries(metadata.inputDigests)) {
      const full = path.join(target, file); await assertRealFile(full);
      if (sha256(await fs.readFile(full)) !== expected) throw new Error("Original target input changed during the run");
    }
    await assertRealDirectory(out);
    await fs.writeFile(path.join(out, "report.json"), stableJson(output), { flag: "wx" });
    return output;
  } finally { await browser?.close(); await server.close(); }
};
