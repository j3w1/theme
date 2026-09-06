/* Re-judges every committed consumption fixture against the current exports
   in static mode. A change to a token or a component that invalidates a
   fixture fails here, which is the signal to run the protocol again. */

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import test from "node:test";
import { listFiles, readJson, repoRoot } from "../scripts/lib/fs.mjs";

const results = (await listFiles("tests/consumption/fixtures")).filter((f) => f.endsWith("/result.html"));

test("the judge itself rejects a non-conforming reconstruction and accepts a conforming one", async () => {
  const scratch = path.join(repoRoot, ".cache", "judge-self-test");
  await fs.mkdir(scratch, { recursive: true });
  const componentFiles = await listFiles("exports/components", { filter: (f) => f.endsWith(".json") });
  if (!componentFiles.length) return;
  const id = componentFiles[0].replace(/^exports\/components\//, "").replace(/\.json$/, "");
  const component = await readJson(componentFiles[0]);
  const resolved = await readJson("exports/tokens.resolved.json");
  const t = (p) => resolved.profiles[resolved.defaultProfile].tokens[p].css;
  const states = component.states.map((s) => `<div data-state="${s}"><input aria-label="x" value="v"></div>`).join("");
  const good = `<!doctype html><html><head><style>
    body { font-family: "SauceCodePro NFM", "Source Code Pro", monospace; background: ${t("color.surface.canvas")}; color: ${t("color.text.default")}; }
    input { border: 1px solid ${t("color.border.control")}; border-radius: 0; background: ${t("color.surface.input")}; color: ${t("color.text.default")}; }
    input:focus-visible { outline: 1px dashed ${t("color.interaction.focus.ring")}; outline-offset: -2px; }
  </style></head><body>${states}</body></html>`;
  const bad = good.replace("border-radius: 0", "border-radius: 6px").replace(t("color.border.control"), "#123456");
  await fs.writeFile(path.join(scratch, "good.html"), good);
  await fs.writeFile(path.join(scratch, "bad.html"), bad);
  const run = (file) => {
    try {
      execFileSync(process.execPath, ["scripts/consumption-judge.mjs", id, path.join(scratch, file)], { cwd: repoRoot, encoding: "utf8" });
      return true;
    } catch {
      return false;
    }
  };
  assert.equal(run("good.html"), true, "conforming reconstruction passes");
  assert.equal(run("bad.html"), false, "rounded corners and a foreign colour fail");
});

test("every committed consumption fixture still passes the static judge", async () => {
  for (const result of results) {
    const dir = path.posix.dirname(result);
    const id = dir.split("/")[3];
    const provenance = await readJson(`${dir}/provenance.json`);
    assert.ok(provenance.agent && provenance.date, `${dir}/provenance.json`);
    execFileSync(process.execPath, ["scripts/consumption-judge.mjs", id, path.join(repoRoot, result)], { cwd: repoRoot, encoding: "utf8" });
  }
});
