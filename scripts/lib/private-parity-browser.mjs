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

export const capturePrivateMeasurement = async (locator, capturePath) => {
  // Screenshot capture settles finite transitions. Measure afterwards so the
  // recorded properties describe the captured state, not an intermediate frame.
  const bytes = await locator.screenshot({ path: capturePath, animations: "disabled" });
  return { measurement: await measure(locator), bytes };
};

export const runPrivateParity = async prepared => {
  const { out, target, requireTarget, config, metadata } = prepared;
  await assertRealDirectory(out);
  let server, browser;
  const records = [], errors = [];
  try {
    const { createServer, createLogger } = await import(pathToFileURL(requireTarget.resolve("vite")).href);
    const plugins = [];
    if (config.frameworkStyles) {
      const { default: frameworkPlugin } = await import(pathToFileURL(requireTarget.resolve("vite-plugin-vuetify")).href);
      // The upstream factory resolves its framework peer from cwd. Keep this
      // synchronous scope narrow; application config and scripts are not loaded.
      const previousDirectory = process.cwd();
      try {
        process.chdir(target);
        plugins.push(frameworkPlugin({ autoImport: false, styles: { configFile: path.join(out, "host", config.frameworkStyles) } }));
      } finally { process.chdir(previousDirectory); }
    }
    const aliases = [
      { find: /^vue$/, replacement: requireTarget.resolve("vue/dist/vue.esm-bundler.js") },
      ...["vuetify", "vuetify/components", "vuetify/styles"].map(name => ({ find: new RegExp("^" + name + "$"), replacement: requireTarget.resolve(name) })),
      { find: /^vuetify\/components\/[A-Za-z]+$/, replacement: "$&", customResolver: id => requireTarget.resolve(id) },
      ...(config.frameworkStyles ? [{ find: /^vuetify\/settings$/, replacement: requireTarget.resolve("vuetify/_settings.scss") }] : []),
      ...Object.entries(config.aliases).map(([find, value]) => ({ find, replacement: path.join(out, "host", value) })),
    ];
    const logger = createLogger("silent");
    // Compiler diagnostics can contain licensed source; retain them only in
    // the private report, never the public CLI's output.
    logger.error = message => errors.push(message);
    server = await createServer({ configFile: false, envFile: false, root: out, publicDir: false, cacheDir: path.join(out, ".cache"), plugins,
      resolve: { alias: aliases, dedupe: ["vue"] }, customLogger: logger,
      server: { host: "127.0.0.1", port: 0, fs: { strict: true, allow: [out, await fs.realpath(path.join(target, "node_modules"))] } },
      css: { preprocessorOptions: Object.fromEntries(["scss", "sass"].map(syntax => [syntax, { loadPaths: [path.join(target, "node_modules")] }])) },
    });
    await server.listen();
    const origin = server.resolvedUrls.local[0];
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 800, height: 600 }, deviceScaleFactor: 1, locale: "en-US", reducedMotion: "reduce", colorScheme: "dark" });
    await context.route("**/*", route => new URL(route.request().url()).origin === new URL(origin).origin ? route.continue() : route.abort());
    const page = await context.newPage();
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
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
        if (entry.state === "focus-visible") await page.keyboard.press("Tab");
        const keyboard = await page.evaluate(() => ({ activeTag: document.activeElement?.tagName ?? null, focusVisible: document.activeElement?.matches(":focus-visible") ?? false }));
        const capture = path.join(out, "captures", entry.id + "-" + entry.state + "-" + side + ".png");
        const { measurement, bytes } = await capturePrivateMeasurement(locator, capture);
        measurements[side] = { ...measurement, keyboard };
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
    for (const [file, expected] of Object.entries({ ...metadata.inputDigests, ...metadata.targetMetadataDigests })) {
      const full = path.join(target, file); await assertRealFile(full);
      if (sha256(await fs.readFile(full)) !== expected) throw new Error("Original target input changed during the run");
    }
    for (const [file, expected] of Object.entries(metadata.artifactDigests)) {
      const full = path.join(out, file); await assertRealFile(full);
      if (sha256(await fs.readFile(full)) !== expected) throw new Error("Prepared specimen bytes changed during the run");
    }
    await assertRealDirectory(out);
    await fs.writeFile(path.join(out, "report.json"), stableJson(output), { flag: "wx" });
    return output;
  } catch (error) {
    await assertRealDirectory(out);
    await fs.writeFile(path.join(out, "failure.json"), stableJson({ result: "failed", errors, message: error.message, records }), { flag: "wx" });
    throw error;
  } finally { await browser?.close(); await server?.close(); }
};
