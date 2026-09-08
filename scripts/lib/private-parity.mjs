import { promises as fs } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { z } from "zod";
import { parse as parseYaml } from "yaml";
import { privateParitySchema, PARITY_COMPONENTS } from "../../schemas/private-parity.mjs";
import { sha256, stableJson, repoRoot, readText } from "./fs.mjs";
import { writeNewPrivateFiles, assertRealFile, assertRealDirectory } from "./safe-kit-writer.mjs";
import { pinnedKitSource } from "./task-kit-source.mjs";
import { splitVariants } from "./spec.mjs";
import { renderSpecimenMarkup, stateAttributes } from "./specimen-markup.mjs";
import { sourceFingerprint } from "./evidence.mjs";

export const parityPrerequisites = input => {
  if (!input) return { result: "not run", missing: ["Operator-supplied licensed checkout", "Applicable license review", "Private output directory and pinned theme"], checks: [] };
  const parsed = privateParitySchema(z).safeParse(input);
  return parsed.success ? null : { result: "not run", missing: parsed.error.issues.map(issue => issue.path.join(".") + ": " + issue.message), checks: [] };
};
const inside = (parent, child) => {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith(".." + path.sep) && relative !== ".." && !path.isAbsolute(relative));
};
export const assertPrivateDestination = (target, out) => {
  for (const excluded of [repoRoot, target]) if (inside(excluded, out) || inside(out, excluded)) throw new Error("Private output must be separate from the theme and source checkout");
  try {
    const gitRoot = execFileSync("git", ["-C", path.dirname(out), "rev-parse", "--show-toplevel"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], windowsHide: true }).trim();
    if (gitRoot) throw new Error("Private output must not be inside any Git checkout");
  } catch (error) { if (!Number.isInteger(error.status)) throw error; }
};
const sourceFile = async (target, relative) => {
  const resolved = path.resolve(target, relative);
  if (!inside(target, resolved)) throw new Error("Private source escaped the supplied target");
  if ((await fs.lstat(resolved)).isDirectory()) await assertRealDirectory(resolved);
  else await assertRealFile(resolved);
  return resolved;
};
export const compareProperties = (expected, actual) => Object.entries(expected).map(([property, value]) => ({
  property, expected: value, actual: actual[property] ?? null, result: actual[property] === value ? "matched" : "different",
}));
export const preparePrivateParity = async input => {
  const prerequisite = parityPrerequisites(input);
  if (prerequisite) return prerequisite;
  const config = privateParitySchema(z).parse(input);
  const target = path.resolve(config.target), out = path.resolve(config.out);
  assertPrivateDestination(target, out);
  const packageText = await fs.readFile(await sourceFile(target, "package.json"), "utf8");
  const pkg = JSON.parse(packageText);
  if (pkg.version !== config.templateVersion) throw new Error("Template version differs from the operator's selected version");
  const lockText = await fs.readFile(await sourceFile(target, config.lock), "utf8");
  const lock = parseYaml(lockText);
  const requireTarget = createRequire(path.join(target, "package.json"));
  const versions = {};
  for (const name of ["vue", "vuetify", "vite"]) {
    const installed = JSON.parse(await fs.readFile(path.join(target, "node_modules", name, "package.json"), "utf8"));
    const declared = pkg.dependencies?.[name] ?? pkg.devDependencies?.[name];
    const locked = lock.importers?.["."]?.dependencies?.[name]?.version ?? lock.importers?.["."]?.devDependencies?.[name]?.version;
    if (installed.version !== declared || !locked || String(locked).split("(")[0] !== installed.version) throw new Error("Installed framework, package declaration and dependency lock must agree exactly");
    versions[name] = installed.version;
  }
  const source = await pinnedKitSource(config.themeRef);
  const canonicalInputs = {}, readPinned = source.read;
  source.read = async file => { const text = await readPinned(file); canonicalInputs[file] = sha256(text); return text; };
  const ledger = JSON.parse(await source.read("exports/digests.json"));
  const tokenText = await source.read("exports/tokens.resolved.json");
  const digestEntries = ledger.files ?? ledger.digests ?? ledger;
  const tokenEntry = digestEntries["exports/tokens.resolved.json"];
  if ((typeof tokenEntry === "string" ? tokenEntry : tokenEntry?.digest) !== sha256(tokenText)) throw new Error("Pinned canonical token digest is unavailable or mismatched");
  const resolved = JSON.parse(tokenText), profile = resolved.profiles.default;
  if (profile.status !== "approved") throw new Error("Private parity uses the approved default profile only");
  const files = {}, inputDigests = {};
  const copy = async (from, to) => {
    const full = await sourceFile(target, from), stat = await fs.lstat(full);
    if (stat.isDirectory()) {
      for (const entry of (await fs.readdir(full)).sort()) await copy(from + "/" + entry, to + "/" + entry);
    } else {
      if (!/\.(?:m?js|scss|css)$/.test(from)) throw new Error("Only explicitly selected script/style inputs may enter a private fixture");
      const bytes = await fs.readFile(full);
      if (Object.hasOwn(files, "host/" + to) || !bytes.equals(Buffer.from(bytes.toString("utf8")))) throw new Error("Private inputs must be unique UTF-8 script/style files");
      files["host/" + to] = bytes.toString("utf8"); inputDigests[from] = sha256(bytes);
    }
  };
  for (const item of config.sources) await copy(item.from, item.to);
  if (!files["host/" + config.defaults] || !files["host/" + config.styles]) throw new Error("Declared host defaults and style entry must be among the copied inputs");
  const nativeSelectors = { button: ".button", "text-field": ".text-field-input", select: ".select-control", checkbox: ".checkbox-option", tabs: ".tabs", dialog: ".dialog", table: ".table" };
  const css = [await source.read("site/src/styles/tokens.generated.css"), await source.read("site/src/styles/base.css"), await source.read("site/src/styles/site.css")];
  for (const id of PARITY_COMPONENTS) css.push(await source.read("site/src/styles/components/" + id + ".css"));
  files["native.css"] = css.join("\n");
  files["tokens.css"] = await source.read("exports/tokens.css");
  const cases = [];
  for (const id of PARITY_COMPONENTS) {
    const contract = JSON.parse(await source.read("exports/components/" + id + ".json"));
    const demo = await source.read("spec/components/" + id + ".demo.html");
    const variant = contract.variants[0].id;
    const fragment = splitVariants(demo).get(variant);
    for (const state of ["default", "focus-visible", "disabled", "invalid", "checked", "selected"].filter(state => contract.states.includes(state))) {
      const key = id + "/" + state;
      const markup = renderSpecimenMarkup(fragment, "parity-" + id, { state, inert: false });
      files["native/" + key + ".html"] = '<!doctype html><html lang="en" dir="ltr" data-density="comfortable"><head><meta charset="utf-8"><link rel="stylesheet" href="../../native.css"><title>Private native specimen</title></head><body><main data-parity-native ' + stateAttributes(state) + '>' + markup + '</main></body></html>';
      cases.push({ id, state, variant, key, native: "native/" + key + ".html", nativeSelector: nativeSelectors[id], fixtureDigest: sha256(fragment), contractDigest: sha256(stableJson(contract)) });
    }
  }
  const data = { label: "Sample", value: "Example", options: ["One", "Two"], row: ["Example", "Ready"] };
  files["fixture.json"] = stableJson({ cases, data, tokens: profile.tokens });
  files["App.mjs"] = await readText("templates/private-parity/App.mjs");
  files["main.mjs"] = 'import defaults from "./host/' + config.defaults + '";\nimport "./host/' + config.styles + '";\nimport "./tokens.css";\nimport { mountParity } from "./App.mjs";\nmountParity(defaults);\n';
  files["index.html"] = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Private framework parity fixture</title></head><body><div id="app"></div><script type="module" src="./main.mjs"></script></body></html>';
  const metadata = { schemaVersion: 1, result: "prepared; browser checks not run", harnessSourceDigest: await sourceFingerprint(), themeRevision: source.revision, themeProfile: "default", templateVersion: pkg.version, frameworks: versions,
    packageDigest: sha256(packageText), lockDigest: sha256(lockText), inputDigests, canonicalInputs, fixtureDigest: sha256(files["App.mjs"] + files["fixture.json"]), cases,
    licenseReview: config.license, limits: "Synthetic fixture, copied host defaults and styles. No application routes, backend, accounts, production data or complete port verification." };
  files["metadata.json"] = stableJson(metadata);
  await writeNewPrivateFiles(out, files);
  return { result: "prepared", out, target, config, metadata, requireTarget };
};
