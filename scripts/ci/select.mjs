#!/usr/bin/env node
// Decides which checks a change needs (D-031). Node built-ins only, so it runs
// before any dependency install. The same inputs always give the same plan;
// release-gate recomputes it and refuses a plan that does not match.
//
//   node scripts/ci/select.mjs --event pull_request --base <sha> --head <sha>
//   node scripts/ci/select.mjs --event push --base <last deployed sha> --head <sha>
//   node scripts/ci/select.mjs --event workflow_dispatch --head <sha> [--full]
//
// Writes the plan as JSON to stdout, and to $GITHUB_OUTPUT when set.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, appendFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const registryPath = path.join(root, "scripts/ci/proofs.json");
const ALL_BROWSER = "all";
const CHEAP = ["sources", "unit", "unit-kit", "unit-kit-windows"];
const SHA = /^[0-9a-f]{40}$/;
export const FULL_SHARDS = ["desktop:1/3", "desktop:2/3", "desktop:3/3", "narrow:1/1", "zoom200:1/1", "nojs:1/1"];

export function globToRegExp(glob) {
  let out = "";
  const names = [];
  for (let i = 0; i < glob.length; i += 1) {
    const c = glob[i];
    if (c === "*" && glob[i + 1] === "*") { out += ".*"; i += 1; if (glob[i + 1] === "/") i += 1; }
    else if (c === "*") out += "[^/]*";
    else if (c === "{") { const end = glob.indexOf("}", i); names.push(glob.slice(i + 1, end)); out += "([^/]+?)"; i = end; }
    else out += c.replace(/[.+?^$()|[\]\\]/g, "\\$&");
  }
  return { re: new RegExp(`^${out}$`), names };
}

const matches = (glob, file) => {
  const { re, names } = globToRegExp(glob);
  const m = file.match(re);
  return m ? Object.fromEntries(names.map((n, k) => [n, m[k + 1]])) : null;
};

const fill = (text, vars) => text.replace(/\{(\w+)\}/g, (_, n) => vars[n] ?? `{${n}}`);

// Pure: registry + changed paths + event → plan. `specExists` tells whether a
// browser spec file exists at the tested head.
export function plan({ registry, event, paths, full = false, reason = null, specExists = () => true }) {
  const proofs = new Set();
  const browser = new Set();
  const reasons = [];
  let floor = full || paths === null;
  let site = false;
  if (full) reasons.push(reason ?? "full run requested");
  if (paths === null) reasons.push(reason ?? "the changed paths could not be determined");
  for (const file of paths ?? []) {
    if (registry.controls.some((g) => matches(g, file))) { floor = true; reasons.push(`${file}: control file`); continue; }
    const hits = registry.rules.map((rule) => ({ rule, vars: rule.paths.map((g) => matches(g, file)).find(Boolean) })).filter((h) => h.vars);
    if (!hits.length) { floor = true; reasons.push(`${file}: no rule claims it`); continue; }
    for (const { rule, vars } of hits) {
      site ||= rule.site;
      for (const p of rule.proofs) {
        if (p.startsWith("browser:")) {
          const spec = fill(p.slice(8), vars);
          if (specExists(spec)) browser.add(spec);
        } else proofs.add(p);
      }
    }
  }
  if (floor) {
    site = true;
    for (const p of ["sources", "unit", "unit-kit", "unit-kit-windows", "build", "smoke", "consumers"]) proofs.add(p);
  }
  if (browser.size || floor) proofs.add("build");
  // The deployment path: a push to main that changes the site runs the whole
  // matrix with evidence, then deploys (D-028 keeps this; D-031 makes it fast).
  const matrix = event === "push" ? site : event === "workflow_dispatch" && floor;
  if (matrix) { proofs.add("build"); proofs.add("consumers"); }
  const browserSpecs = matrix || floor ? ALL_BROWSER : [...browser].sort();
  const needsBrowser = browserSpecs === ALL_BROWSER || browserSpecs.length > 0;
  // Playwright shards in contiguous blocks, which here is one project per
  // shard, and desktop runs by far the most tests. So the whole suite splits
  // by project, with desktop in three parts; a small subset is one job.
  const shards = !needsBrowser ? [] : browserSpecs === ALL_BROWSER || browserSpecs.length > 4 ? FULL_SHARDS : ["all:1/1"];
  const body = {
    schemaVersion: 1,
    event,
    floor,
    site,
    matrix,
    deploy: matrix && event === "push",
    proofs: [...proofs].sort(),
    browser: browserSpecs,
    shards,
    paths: paths === null ? null : paths.length,
    reasons: [...new Set(reasons)].sort().slice(0, 40),
  };
  return { ...body, planHash: createHash("sha256").update(JSON.stringify(body)).digest("hex") };
}

const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();

export function changedPaths(base, head) {
  if (!SHA.test(base ?? "") || !SHA.test(head ?? "")) return null;
  try {
    git("cat-file", "-e", `${base}^{commit}`);
    const mergeBase = git("merge-base", base, head);
    const out = git("diff", "--name-only", "--no-renames", mergeBase, head);
    return out ? out.split("\n").sort() : [];
  } catch { return null; }
}

export function summary(p) {
  const browser = p.browser === ALL_BROWSER ? "the whole suite" : p.browser.length ? p.browser.join(", ") : "none";
  return [
    `### Plan \`${p.planHash.slice(0, 12)}\``,
    "",
    `- Changed paths: ${p.paths ?? "unknown"}${p.floor ? " (every check runs)" : ""}`,
    `- Checks: ${p.proofs.join(", ") || "none"}`,
    `- Browser: ${browser}${p.shards.length > 1 ? ` in ${p.shards.length} jobs (${p.shards.join(", ")})` : ""}`,
    `- Site changes: ${p.site ? "yes" : "no"}; full matrix: ${p.matrix ? "yes" : "no"}; deploy: ${p.deploy ? "yes" : "no"}`,
    ...(p.reasons.length ? ["", "Why everything runs:", ...p.reasons.map((r) => `- ${r}`)] : []),
    "",
  ].join("\n");
}

function main(argv) {
  const arg = (name) => { const i = argv.indexOf(`--${name}`); return i >= 0 ? argv[i + 1] : undefined; };
  const event = arg("event") ?? "workflow_dispatch";
  const resolve = (ref) => { try { return git("rev-parse", "--verify", `${ref}^{commit}`); } catch { return ref; } };
  const head = resolve(arg("head") ?? "HEAD");
  const base = arg("base") ? resolve(arg("base")) : undefined;
  const full = argv.includes("--full");
  const registry = JSON.parse(readFileSync(registryPath, "utf8"));
  const paths = event === "workflow_dispatch" && !base ? null : changedPaths(base, head);
  const reason = event === "workflow_dispatch" && !base ? "manual dispatch without a base runs everything" : null;
  const specExists = (spec) => existsSync(path.join(root, "tests/browser", `${spec}.spec.js`));
  const result = { ...plan({ registry, event, paths, full, reason, specExists }), base: base ?? null, head };
  const json = JSON.stringify(result);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (process.env.GITHUB_OUTPUT) {
    const has = (p) => result.proofs.includes(p);
    const lines = {
      plan: json,
      plan_hash: result.planHash,
      checks: String(CHEAP.some(has) || has("build")),
      build: String(has("build")),
      smoke: String(has("smoke")),
      consumers: String(has("consumers")),
      browser: String(result.shards.length > 0),
      shards: JSON.stringify(result.shards),
      matrix: String(result.matrix),
      deploy: String(result.deploy),
    };
    appendFileSync(process.env.GITHUB_OUTPUT, Object.entries(lines).map(([k, v]) => `${k}=${v}\n`).join(""));
  }
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary(result));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
