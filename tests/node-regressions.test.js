import assert from "node:assert/strict";
import test from "node:test";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { readJson, readText, repoRoot } from "../scripts/lib/fs.mjs";
import { git } from "../scripts/tooling/git.mjs";
import { uiConsumptionGuide, packageReadmeGenerator } from "../scripts/lib/generators.mjs";
import { luminanceHex } from "../scripts/lib/contrast.mjs";

/* The optional revision reads the same regression inputs from Git, without
   creating a second checkout or changing this worktree. */
const revision = process.env.THEME_REGRESSION_REVISION;
const sourceOf = file => revision ? git(["show", `${revision}:${file}`]) : readText(file);
const moduleOf = async file => {
  if (!revision) return import(pathToFileURL(path.join(repoRoot, file)));
  const location = pathToFileURL(path.join(repoRoot, file));
  const source = (await sourceOf(file)).replace(/^(import .+? from |export .+? from )(["'])(\.[^"']+)\2;$/gm,
    (_, prefix, quote, relative) => `${prefix}${quote}${new URL(relative, location).href}${quote};`);
  return import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
};

test("R-a: every install and copy command pins the manifest package version", async () => {
  const guide = await sourceOf("docs/ui-consumption.md");
  const manifest = await readJson("theme.json");
  const pins = [...guide.matchAll(/(?:@j3w1\/ui@|j3w1-ui-)(\d+\.\d+\.\d+)/g)].map(match => match[1]);
  assert.equal(pins.length, 4);
  assert.deepEqual(pins, Array(4).fill(manifest.version));
  const future = uiConsumptionGuide(guide, "99.0.0");
  assert.equal([...future.matchAll(/99\.0\.0/g)].length, 4);
  const result = await packageReadmeGenerator.run({ check: true, manifest: { ...manifest, version: "99.0.0" } });
  assert.ok(result.changed.includes("docs/ui-consumption.md"), "check mode detects command drift in the source guide");
  assert.ok(result.changed.includes("packages/ui/README.md"));
});

test("R-l: encoded port brightness keeps its bytes and is named separately from WCAG luminance", async () => {
  const helpers = await moduleOf("scripts/lib/port-artifacts.mjs");
  assert.equal(typeof helpers.encodedBrightness, "function");
  assert.equal("luminance" in helpers, false, "encoded brightness must not claim WCAG luminance");
  assert.equal(helpers.encodedBrightness("#808080"), 128 / 255);
  assert.ok(luminanceHex("#808080") < 0.22);
});

test("R-m: the builder and local workflow reserve their single primary for the main submit", async () => {
  const { builderMarkup, workflowMarkup } = await moduleOf("packages/ui/src/examples/form-markup.mjs");
  for (const markup of [builderMarkup("regression"), workflowMarkup("regression")]) {
    const buttons = [...markup.matchAll(/<button\b[^>]*>/g)].map(match => match[0]);
    assert.ok(buttons.length > 1);
    assert.doesNotMatch(markup, /\bbutton-primary\b/);
    const primaries = buttons.filter(button => /class="button"/.test(button));
    assert.equal(primaries.length, 1, "secondary tasks must not introduce additional filled primary buttons");
    assert.match(primaries[0], /type="submit".*data-event="submit"/);
  }
});
