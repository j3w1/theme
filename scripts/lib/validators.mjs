/* Validators over the hand-authored sources. Each returns nothing or throws
   with a message that names the file. scripts/validate.mjs and
   scripts/generate.mjs run them; tests call them directly. */

import { z } from "zod";
import { exists, gitFiles, listFiles, readJson, readText } from "./fs.mjs";
import { EXTENSIONS_KEY } from "../../schemas/tokens.mjs";
import { themeSchema } from "../../schemas/theme.mjs";
import { portSchema } from "../../schemas/port.mjs";
import { portMappingSchema, assertPortMapping } from "../../schemas/usage.mjs";
import { releaseCatalogueSchema } from "../../schemas/release-comparison.mjs";
import { catalogueSchema, screenshotProvenanceSchema, sourcesSchema } from "../../schemas/provenance.mjs";
import { EXTENSION_ALLOWED_GROUPS, EXTENSION_HUES, HERITAGE_ANSI, REQUIRED_ROLES } from "../../schemas/roles.mjs";
import { cssVar, extensionOf, loadProfile, loadResolvedProfile, resolveTokens, statusOf } from "./tokens.mjs";
import { evaluatePair } from "./contrast.mjs";
import { loadComponents, loadDecisions, loadDoc, loadFamilies, listDocs, splitVariants, tokenRefsOf } from "./spec.mjs";
import { scanFiles } from "./private-material.mjs";

export class ValidationError extends Error {}

const fail = (message) => {
  throw new ValidationError(message);
};

const formatIssues = (issues) => issues.map((i) => `  ${i.path.join(".") || "(root)"}: ${i.message}`).join("\n");

export const loadManifest = async () => {
  const raw = await readJson("theme.json");
  const parsed = themeSchema(z).safeParse(raw);
  if (!parsed.success) fail(`theme.json:\n${formatIssues(parsed.error.issues)}`);
  return parsed.data;
};

export const validateManifest = async () => {
  const manifest = await loadManifest();
  releaseCatalogueSchema(z).parse(await readJson("site/releases.json"));
  const paths = [
    ...Object.values(manifest.spec),
    ...Object.values(manifest.agents),
    manifest.exports.dir,
    manifest.ports.catalogue,
    manifest.ports.dir,
    manifest.references.catalogue,
    manifest.references.sources,
    manifest.license.file,
    ...manifest.profiles.flatMap((p) => p.tokens),
  ];
  for (const p of paths) if (!(await exists(p))) fail(`theme.json references ${p}, which does not exist`);
  const pkg = await readJson("package.json");
  if (pkg.version !== manifest.version) fail(`package.json version ${pkg.version} differs from theme.json ${manifest.version}`);
  if (await exists("CHANGELOG.md")) {
    const changelog = await readText("CHANGELOG.md");
    const head = changelog.match(/^## \[([^\]]+)\]/m)?.[1];
    if (head && head !== "Unreleased" && head !== manifest.version) fail(`CHANGELOG.md head entry ${head} differs from theme.json ${manifest.version}`);
  }
  return manifest;
};

export const validateDecisions = async () => {
  const decisions = await loadDecisions();
  if (!decisions.size) fail("spec/decisions.md has no decision rows");
  return decisions;
};

/* Loads and resolves every profile; returns Map id → resolved. */
export const loadProfiles = async (manifest) => {
  const profiles = new Map();
  for (const profile of manifest.profiles) profiles.set(profile.id, await loadResolvedProfile(profile.tokens));
  return profiles;
};

export const validateTokens = async ({ manifest, decisions } = {}) => {
  manifest ??= await loadManifest();
  decisions ??= await loadDecisions();
  const profiles = await loadProfiles(manifest);
  const defaultId = manifest.profiles.find((p) => p.default).id;
  const problems = [];

  for (const profile of manifest.profiles) {
    const resolved = profiles.get(profile.id);
    for (const role of REQUIRED_ROLES) if (!resolved.has(role)) problems.push(`profile ${profile.id}: required role ${role} is missing`);
    for (let i = 0; i < 16; i += 1) {
      const token = resolved.get(`color.primitive.ansi.${i}`);
      if (token && token.resolved.hex !== HERITAGE_ANSI[i]) problems.push(`profile ${profile.id}: color.primitive.ansi.${i} is ${token.resolved.hex}, expected ${HERITAGE_ANSI[i]}`);
    }
    const vars = new Map();
    for (const path of resolved.keys()) {
      const v = cssVar(path);
      if (vars.has(v)) problems.push(`profile ${profile.id}: ${path} and ${vars.get(v)} both map to ${v}`);
      vars.set(v, path);
    }
    for (const [path, token] of resolved) {
      if (token.type !== "color" || !path.startsWith("color.") || path.startsWith("color.primitive.")) continue;
      const group = path.split(".")[1];
      if (EXTENSION_HUES.includes(token.resolved.hex) && !EXTENSION_ALLOWED_GROUPS.includes(group)) {
        problems.push(`profile ${profile.id}: ${path} uses extension hue ${token.resolved.hex} outside the allowed groups (${EXTENSION_ALLOWED_GROUPS.join(", ")})`);
      }
      const ext = extensionOf(token);
      if (ext?.status === "approved" && !ext.approval?.decision) problems.push(`profile ${profile.id}: ${path} is approved without a decision`);
      if (ext?.approval?.decision) {
        const decision = decisions.get(ext.approval.decision);
        if (!decision) problems.push(`${path}: unknown decision ${ext.approval.decision}`);
        else if (ext.status === "approved" && decision.status !== "accepted") problems.push(`${path}: approved but ${ext.approval.decision} is ${decision.status}`);
      }
      if (profile.id === defaultId) {
        for (const target of token.chain) {
          const t = resolved.get(target);
          if (statusOf(t) === "proposed" && statusOf(token) !== "proposed") problems.push(`default profile: ${path} depends on proposed value ${target}`);
        }
      }
    }
    if (profile.overlay) {
      const base = profiles.get(profile.overlay);
      const flat = await loadProfile(profile.tokens);
      for (const [path, decl] of flat) {
        if (decl.overrides && !base.has(path)) problems.push(`overlay ${profile.id} overrides ${path}, which ${profile.overlay} does not define`);
      }
    }
  }
  for (const [path, token] of profiles.get(defaultId)) {
    const ext = extensionOf(token);
    if (path.startsWith("color.primitive.") && ext && !ext.origin) problems.push(`${path}: primitives must record an origin`);
  }
  if (problems.length) fail(`tokens:\n  ${problems.join("\n  ")}`);
  return { profiles, defaultId };
};

/* Contrast pairs declared in spec/contrast.json and by components. */
export const loadDeclaredPairs = async ({ profiles, defaultId, components }) => {
  const resolved = profiles.get(defaultId);
  const surface = resolved.get("color.surface.canvas").resolved;
  const pairs = [];
  const colorOf = (path, where) => {
    const token = resolved.get(path);
    if (!token) fail(`${where}: unknown token ${path}`);
    if (token.type !== "color") fail(`${where}: ${path} is not a color`);
    return token.resolved;
  };
  if (await exists("spec/contrast.json")) {
    const declared = await readJson("spec/contrast.json");
    for (const pair of declared.pairs ?? []) {
      pairs.push({ source: "spec/contrast.json", label: pair.label, fgPath: pair.fg, bgPath: pair.bg, ...evaluatePair({ fg: colorOf(pair.fg, "spec/contrast.json"), bg: colorOf(pair.bg, "spec/contrast.json"), min: pair.min ?? 4.5, kind: pair.kind ?? "text", surface, label: pair.label, waiver: pair.waiver ?? null }) });
    }
  }
  for (const component of components ?? []) {
    for (const [state, roles] of Object.entries(component.stateTokens)) {
      if (roles.fg && roles.bg) pairs.push({ source: component.id, label: `${component.id} ${state} text`, fgPath: roles.fg, bgPath: roles.bg, ...evaluatePair({ fg: colorOf(roles.fg, component.file), bg: colorOf(roles.bg, component.file), min: 4.5, kind: "text", surface, state, label: `${component.id} ${state} text` }) });
      for (const edge of ["border", "outline"]) {
        if (roles[edge] && roles.bg) pairs.push({ source: component.id, label: `${component.id} ${state} ${edge}`, fgPath: roles[edge], bgPath: roles.bg, ...evaluatePair({ fg: colorOf(roles[edge], component.file), bg: colorOf(roles.bg, component.file), min: 3, kind: "ui", surface, state, label: `${component.id} ${state} ${edge}` }) });
      }
    }
    for (const pair of component.contrast) {
      pairs.push({ source: component.id, label: pair.label ?? `${component.id} ${pair.fg} on ${pair.bg}`, fgPath: pair.fg, bgPath: pair.bg, ...evaluatePair({ fg: colorOf(pair.fg, component.file), bg: colorOf(pair.bg, component.file), min: pair.min, kind: pair.kind, surface, state: pair.state ?? null, label: pair.label ?? null, waiver: pair.waiver ?? null }) });
    }
  }
  return pairs;
};

export const validateContrast = async (context) => {
  const pairs = await loadDeclaredPairs(context);
  const failures = pairs.filter((p) => !p.pass && !p.waiver);
  if (failures.length) fail(`contrast:\n  ${failures.map((p) => `${p.label ?? p.source}: ${p.fg} on ${p.bg} = ${p.display} < ${p.min}`).join("\n  ")}`);
  return pairs;
};

export const validateDocs = async (manifest) => {
  manifest ??= await loadManifest();
  const docs = [];
  for (const file of await listDocs()) docs.push(await loadDoc(file));
  for (const key of ["identity", "foundations", "accessibility", "portability", "decisions"]) {
    const file = manifest.spec[key];
    if (!(await exists(file))) fail(`spec: ${file} (theme.json spec.${key}) is missing`);
  }
  const ids = new Set();
  for (const doc of docs) {
    if (ids.has(doc.id)) fail(`spec: duplicate doc id ${doc.id}`);
    ids.add(doc.id);
    if (/\]\(\/|href="\//.test(doc.body)) fail(`${doc.file}: root-absolute links are forbidden (base path)`);
  }
  return docs;
};

export const loadInventory = async () => {
  const inventory = await readJson("spec/inventory.json");
  const ids = new Set();
  for (const entry of inventory.components) {
    if (!/^[a-z][a-z0-9-]*$/.test(entry.id)) fail(`spec/inventory.json: bad id ${entry.id}`);
    if (ids.has(entry.id)) fail(`spec/inventory.json: duplicate ${entry.id}`);
    if (!["R1", "R2", "L"].includes(entry.priority)) fail(`spec/inventory.json: ${entry.id} has priority ${entry.priority}`);
    ids.add(entry.id);
  }
  for (const id of inventory.tested) if (!ids.has(id)) fail(`spec/inventory.json: tested ${id} is not in the inventory`);
  return { ...inventory, ids };
};

export const validateSpec = async ({ profiles, defaultId } = {}) => {
  ({ profiles, defaultId } = profiles ? { profiles, defaultId } : await validateTokens());
  const resolved = profiles.get(defaultId);
  const components = await loadComponents();
  const inventory = await loadInventory();
  const families = new Set((await loadFamilies()).map((f) => f.id));
  for (const entry of inventory.components) if (!families.has(entry.family)) fail(`spec/inventory.json: ${entry.id} has unknown family ${entry.family}`);
  const problems = [];
  for (const component of components) {
    const planned = inventory.components.find((e) => e.id === component.id);
    if (!planned) problems.push(`${component.file}: ${component.id} is not in spec/inventory.json (adding a component is a decision)`);
    else {
      if (planned.family !== component.family) problems.push(`${component.file}: family ${component.family} differs from the inventory (${planned.family})`);
      if (planned.priority !== component.priority) problems.push(`${component.file}: priority ${component.priority} differs from the inventory (${planned.priority})`);
    }
    for (const ref of tokenRefsOf(component)) if (!resolved.has(ref)) problems.push(`${component.file}: token ${ref} does not resolve in the ${defaultId} profile`);
    for (const rel of component.related) if (!inventory.ids.has(rel)) problems.push(`${component.file}: related ${rel} is not in the inventory`);
    for (const spec of component.specimens) if (!inventory.ids.has(spec)) problems.push(`${component.file}: specimen ${spec} is not in the inventory`);
    for (const source of component.sources) if (!(await sourceExists(source))) problems.push(`${component.file}: source ${source} is not in references/sources.json`);
    if (/\]\(\/|href="\//.test(component.body)) problems.push(`${component.file}: root-absolute links are forbidden (base path)`);
    if (component.maturity !== "draft" && !component.demo) problems.push(`${component.file}: ${component.maturity} components need ${component.id}.demo.html`);
    if (component.demo) {
      if (/<script|\sstyle=|\son[a-z]+=/i.test(component.demo)) problems.push(`${component.demoFile}: no scripts, inline styles or inline handlers`);
      if (/\]\(\/|href="\/|src="\//.test(component.demo)) problems.push(`${component.demoFile}: root-absolute links are forbidden (base path)`);
      const variants = splitVariants(component.demo);
      for (const v of component.variants) if (!variants.has(v.id)) problems.push(`${component.demoFile}: variant ${v.id} has no fragment (add <!-- @variant ${v.id} -->)`);
      for (const id of variants.keys()) if (!component.variants.some((v) => v.id === id)) problems.push(`${component.demoFile}: fragment for undeclared variant ${id}`);
    }
    const statesTable = component.sections.get("States") ?? "";
    for (const state of component.states) {
      if (state === "default") continue;
      if (!statesTable.includes(state)) problems.push(`${component.file}: state ${state} is declared but not described in ## States`);
    }
    if (component.maturity !== "draft") {
      const stateRows = statesTable.split("\n").filter((line) => line.startsWith("|") && !/^\|\s*-/.test(line) && !/^\|\s*state\s*\|/i.test(line));
      for (const row of stateRows) {
        const cells = row.split("|").map((c) => c.trim()).filter(Boolean);
        if (cells.length >= 3 && !cells[2]) problems.push(`${component.file}: state row "${cells[0]}" needs a non-colour channel`);
      }
    }
    if (component.maturity !== "draft" && (await exists(`site/src/styles/components/${component.id}.css`))) {
      const css = await readText(`site/src/styles/components/${component.id}.css`);
      for (const match of css.matchAll(/#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/gi)) problems.push(`site/src/styles/components/${component.id}.css: raw colour literal ${match[0]}; use token variables`);
      for (const match of css.matchAll(/var\((--[a-z0-9-]+)\)/g)) {
        const v = match[1];
        if (v.startsWith("--_") || v.startsWith("--density-")) continue;
        const known = [...resolved.keys()].some((p) => cssVar(p) === v);
        if (!known) problems.push(`site/src/styles/components/${component.id}.css: ${v} is not a token variable`);
      }
      for (const state of component.states) {
        if (state === "default" || state === "filled") continue;
        /* "filled" is a data condition (the demo carries a value), not a style */
        const parts = state.split("+").filter((p) => p !== "filled");
        const covered = css.includes(`[data-state="${state}"]`) || parts.every((p) => css.includes(`[data-state-${p}]`));
        if (!covered) problems.push(`site/src/styles/components/${component.id}.css: no forced-state selector for ${state} ([data-state="${state}"] or [data-state-<part>] for every part)`);
      }
    }
  }
  /* The compact export carries exactly the ten core (tested) components; in a partial checkout the rule is "compact ⇔ core and present". */
  const core = new Set(inventory.tested);
  for (const component of components) {
    if (component.compact && !core.has(component.id)) problems.push(`${component.file}: compact is reserved for the core components (${inventory.tested.join(", ")})`);
    if (!component.compact && core.has(component.id)) problems.push(`${component.file}: core components must be marked compact: true`);
  }
  if (problems.length) fail(`spec:\n  ${problems.join("\n  ")}`);
  return components;
};

const sourceExists = async (id) => {
  if (!(await exists("references/sources.json"))) return false;
  const sources = await readJson("references/sources.json");
  return Boolean(sources.repositories?.[id] || sources.external?.[id]);
};

export const validatePorts = async () => {
  const ports = [];
  const dirs = new Set((await listFiles("ports")).map((f) => f.split("/")[1]).filter((d) => d && !d.endsWith(".md")));
  for (const dir of dirs) {
    const file = `ports/${dir}/port.json`;
    if (!(await exists(file))) fail(`${file} is missing; every port directory needs a manifest`);
    const parsed = portSchema(z).safeParse(await readJson(file));
    if (!parsed.success) fail(`${file}:\n${formatIssues(parsed.error.issues)}`);
    const port = parsed.data;
    if (port.id !== dir) fail(`${file}: id ${port.id} must equal the directory name`);
    for (const f of port.files) if (!(await exists(`ports/${dir}/${f.path}`))) fail(`${file}: ${f.path} does not exist`);
    for (const e of port.evidence) if (!(await exists(`ports/${dir}/${e.path}`))) fail(`${file}: evidence ${e.path} does not exist`);
    if (!(await exists(`ports/${dir}/mapping.json`))) fail(`${file}: mapping.json is missing`);
    const mapping = portMappingSchema(z).safeParse(await readJson(`ports/${dir}/mapping.json`));
    if (!mapping.success) fail(`${file}: invalid mapping.json: ${formatIssues(mapping.error.issues)}`);
    const profile = (await loadManifest()).profiles.find((p) => p.id === port.profile);
    if (!profile) fail(`${file}: unknown profile ${port.profile}`);
    assertPortMapping({ ...port, mapping: mapping.data }, (await loadResolvedProfile(profile.tokens)).keys());
    if (!(await exists(`ports/${dir}/README.md`))) fail(`${file}: README.md is missing`);
    ports.push(port);
  }
  return ports.sort((a, b) => a.id.localeCompare(b.id));
};

export const validateReferences = async () => {
  const sources = sourcesSchema(z).safeParse(await readJson("references/sources.json"));
  if (!sources.success) fail(`references/sources.json:\n${formatIssues(sources.error.issues)}`);
  const catalogue = catalogueSchema(z).safeParse(await readJson("references/catalogue.json"));
  if (!catalogue.success) fail(`references/catalogue.json:\n${formatIssues(catalogue.error.issues)}`);
  const problems = [];
  const localFiles = new Set();
  for (const entry of catalogue.data.entries) {
    if (entry.source && !sources.data.repositories[entry.source.repository]) problems.push(`catalogue ${entry.id}: repository ${entry.source.repository} is not in sources.json`);
    if (entry.source && !sources.data.repositories[entry.source.repository]?.files.includes(entry.source.path)) problems.push(`catalogue ${entry.id}: ${entry.source.path} is not listed under ${entry.source.repository} in sources.json`);
    if (entry.path) {
      if (!(await exists(entry.path))) problems.push(`catalogue ${entry.id}: ${entry.path} does not exist`);
      localFiles.add(entry.path);
    }
  }
  const images = await listFiles("references", { filter: (f) => /\.(png|webp)$/.test(f) });
  for (const image of images) {
    if (!localFiles.has(image)) problems.push(`${image} is not catalogued in references/catalogue.json`);
    const dir = image.slice(0, image.lastIndexOf("/"));
    const provFile = `${dir}/provenance.json`;
    if (!(await exists(provFile))) {
      problems.push(`${image}: ${provFile} is missing`);
      continue;
    }
    const prov = await readJson(provFile);
    const entry = (Array.isArray(prov) ? prov : [prov]).find((p) => `${dir}/${p.file}` === image);
    if (!entry) problems.push(`${image}: no entry in ${provFile}`);
    else {
      const parsed = screenshotProvenanceSchema(z).safeParse(entry);
      if (!parsed.success) problems.push(`${provFile} (${entry.file}):\n${formatIssues(parsed.error.issues)}`);
    }
  }
  if (problems.length) fail(`references:\n  ${problems.join("\n  ")}`);
  return { sources: sources.data, catalogue: catalogue.data };
};

export const validatePrivateMaterial = async () => {
  const findings = await scanFiles(gitFiles().filter((f) => !f.startsWith("node_modules/")), { textOnly: true });
  if (findings.length) fail(`private material:\n  ${findings.map((f) => `${f.file}: ${f.problem}`).join("\n  ")}`);
};

export const validateAll = async () => {
  const manifest = await validateManifest();
  const decisions = await validateDecisions();
  const tokens = await validateTokens({ manifest, decisions });
  await validateDocs(manifest);
  const components = await validateSpec(tokens);
  await validateContrast({ ...tokens, components });
  await validatePorts();
  await validateReferences();
  await validatePrivateMaterial();
  return { manifest, decisions, ...tokens, components };
};

export const VALIDATORS = {
  manifest: async () => { await validateManifest(); },
  decisions: async () => { await validateDecisions(); },
  tokens: async () => { await validateTokens(); },
  docs: async () => { await validateDocs(); },
  spec: async () => { const t = await validateTokens(); const components = await validateSpec(t); await validateContrast({ ...t, components }); },
  ports: async () => { await validatePorts(); },
  references: async () => { await validateReferences(); },
  private: async () => { await validatePrivateMaterial(); },
};

export { resolveTokens, EXTENSIONS_KEY, loadFamilies };
