import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { listFiles, readJson, readText, repoRoot, sha256 } from "../scripts/lib/fs.mjs";
import { loadManifest } from "../scripts/lib/validators.mjs";

test("committed generated artifacts are current (npm run check)", () => {
  const out = execFileSync(process.execPath, ["scripts/generate.mjs", "--check"], { cwd: repoRoot, encoding: "utf8" });
  assert.match(out, /checked digests/);
});

test("exports carry the version, no timestamps, no commit hashes, and no main URLs", async () => {
  const manifest = await loadManifest();
  for (const file of await listFiles("exports")) {
    const text = await readText(file);
    if (file.endsWith(".json")) {
      const json = JSON.parse(text);
      assert.equal(json.version, manifest.version, file);
    } else if (!file.endsWith(".css")) {
      assert.ok(text.includes(manifest.version), `${file} lacks the version`);
    }
    assert.doesNotMatch(text, /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, `${file} contains a timestamp`);
    assert.doesNotMatch(text, /raw\.githubusercontent\.com\/j3w1\/theme\/main\//, `${file} links to main`);
  }
});

test("digests cover every export and match the bytes", async () => {
  const digests = await readJson("exports/digests.json");
  const files = (await listFiles("exports")).filter((f) => f !== "exports/digests.json");
  assert.deepEqual(Object.keys(digests.files).sort(), files);
  for (const [file, digest] of Object.entries(digests.files)) assert.equal(sha256(await readText(file)), digest, file);
});

test("resolved tokens and the css sheet agree, and the sheet exposes roles as custom properties", async () => {
  const resolved = await readJson("exports/tokens.resolved.json");
  const css = await readText("exports/tokens.css");
  const siteCss = await readText("site/src/styles/tokens.generated.css");
  assert.ok(siteCss.startsWith(css), "the site sheet starts with the export sheet");
  assert.match(siteCss, /\[data-density="compact"\]/);
  for (const [path, token] of Object.entries(resolved.profiles.default.tokens)) {
    assert.match(css, new RegExp(`--${path.replaceAll(".", "-")}: ${token.css.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")};`), path);
  }
  assert.match(css, /\[data-profile="heritage-ansi"\] \{[\s\S]*--color-text-subtle: #a3676b;/);
  assert.match(css, /\[data-profile="extended"\] \{[\s\S]*--color-code-syntax-string: #86a46f;/);
});

test("the compact export stays under 300 lines and names the approved profile only", async () => {
  const compact = await readText("exports/theme.compact.md");
  assert.ok(compact.split("\n").length <= 300);
  assert.match(compact, /profile: default/);
  assert.match(compact, /Selection is a fill; focus is a ring/);
});

test("llms.txt points at the tag for the current version", async () => {
  const manifest = await loadManifest();
  const llms = await readText("exports/llms.txt");
  assert.match(llms, new RegExp(`/j3w1/theme/v${manifest.version.replace(/\./g, "\\.")}/agents/consume\\.md`));
});
