/* The generator registry. Each generator receives the validated context
   (manifest, decisions, profiles, defaultId, components, check, produced)
   and returns { files, changed, orphans?, note? }. Files it produces are
   listed so the digests generator can hash them and orphan detection can
   prune what no generator claims. */

import { z } from "zod";
import { buildUI } from "../build-ui.mjs";
import { formSchema } from "../../schemas/form-schema.mjs";
import { patternExportSchema } from "../../schemas/pattern.mjs";
import { patternGenerator } from "./patterns.mjs";
import { evidenceSchema } from "../../schemas/evidence.mjs";
import { eligibilitySchema } from "../../schemas/eligibility.mjs";
import { POLICY_TEXT, releaseOf, eligibilityOf, eligibilityText } from "./eligibility.mjs";
import { exists, listFiles, pruneOrphans, readText, replaceMarkerBlock, sha256, stableJson, writeOrCheck } from "./fs.mjs";
import { statusOf, toCss, toResolvedExport } from "./tokens.mjs";
import { buildCss, buildDensityCss } from "./css.mjs";
import { loadDeclaredPairs, validateDocs, validatePorts, validateReferences } from "./validators.mjs";
import { buildBrief, buildCompact, buildComponentJson, buildFull, buildLlms, contrastTable, coverageTable, demoVariantsOf, portsTable, sourceDigestOf } from "./exports.mjs";
import { loadFamilies } from "./spec.mjs";
import { themeSchema } from "../../schemas/theme.mjs";
import { componentSchema } from "../../schemas/component.mjs";
import { portSchema } from "../../schemas/port.mjs";
import { lockSchema } from "../../schemas/lock.mjs";
import { docSchema, familySchema } from "../../schemas/doc.mjs";
import { catalogueSchema, screenshotProvenanceSchema, sourcesSchema } from "../../schemas/provenance.mjs";
import { provenanceExtensionSchema } from "../../schemas/tokens.mjs";
import { usageSchema, portMappingSchema } from "../../schemas/usage.mjs";
import { usageGenerator } from "./usage-generator.mjs";
import { recipeGenerator } from "./recipe-generator.mjs";
import { recipeDependenciesSchema } from "../../schemas/recipe.mjs";
import { taskInputsGenerator } from "./task-inputs-generator.mjs";
import { taskInputsSchema, kitRequestSchema } from "../../schemas/task-kit.mjs";
import { portCapabilitiesSchema, portImportEvidenceSchema, portCatalogueSchema } from "../../schemas/port-capabilities.mjs";
import { portCatalogueGenerator, readPortDescription } from "./port-capabilities.mjs";
import { privateParitySchema } from "../../schemas/private-parity.mjs";
import { releaseComparisonSchema, releaseCatalogueSchema, releaseMigrationSchema } from "../../schemas/release-comparison.mjs";

const write = async (relative, content, { check, changed, files }) => {
  files.push(relative);
  if (await writeOrCheck(relative, content, { check })) changed.push(relative);
};

/* Inputs whose bytes define the source digest: token files, spec, families, decisions. */
const sourceInputs = async (manifest) => {
  const files = new Set();
  for (const p of manifest.profiles) for (const f of p.tokens) files.add(f);
  for (const f of await listFiles("spec")) files.add(f);
  const inputs = [];
  for (const f of [...files].sort()) inputs.push([f, await readText(f)]);
  return inputs;
};

export const schemasGenerator = {
  name: "json schemas",
  async run({ check }) {
    const changed = [];
    const files = [];
    const emit = async (name, schema) => write(`schemas/json/${name}.schema.json`, stableJson(z.toJSONSchema(schema, { unrepresentable: "any" })), { check, changed, files });
    await emit("theme", themeSchema(z));
    await emit("form-definition", formSchema(z));
    await emit("form-pattern", patternExportSchema(z));
    await emit("eligibility", eligibilitySchema(z));
    await emit("token-usage", usageSchema(z));
    await emit("port-mapping", portMappingSchema(z));
    await emit("port-capabilities", portCapabilitiesSchema(z));
    await emit("port-catalogue", portCatalogueSchema(z));
    await emit("port-import-evidence", portImportEvidenceSchema(z));
    await emit("private-parity", privateParitySchema(z));
    await emit("recipe-dependencies", recipeDependenciesSchema(z));
    await emit("task-inputs", taskInputsSchema(z));
    await emit("task-kit-request", kitRequestSchema(z));
    await emit("release-comparison", releaseComparisonSchema(z));
    await emit("release-catalogue", releaseCatalogueSchema(z));
    await emit("release-migration", releaseMigrationSchema(z));
    await emit("verification-evidence", evidenceSchema(z));
    await emit("component-frontmatter", componentSchema(z));
    await emit("port", portSchema(z));
    await emit("theme.lock", lockSchema(z));
    await emit("doc-frontmatter", docSchema(z));
    await emit("families", familySchema(z));
    await emit("sources", sourcesSchema(z));
    await emit("catalogue", catalogueSchema(z));
    await emit("screenshot-provenance", screenshotProvenanceSchema(z));
    await emit("token-extension", provenanceExtensionSchema(z));
    const orphans = await pruneOrphans("schemas/json", files, { check });
    return { files, changed, orphans };
  },
};

export const tokensGenerator = {
  name: "tokens",
  async run({ manifest, profiles, defaultId, check }) {
    const changed = [];
    const files = [];
    const resolved = {};
    for (const profile of manifest.profiles) {
      resolved[profile.id] = { status: profile.status, default: profile.default, overlay: profile.overlay ?? null, tokens: toResolvedExport(profiles.get(profile.id), profile) };
    }
    const json = { schemaVersion: 1, theme: manifest.name, version: manifest.version, tokenFormat: manifest.tokenFormat.spec, defaultProfile: defaultId, release: releaseOf(manifest.version), profiles: resolved };
    await write("exports/tokens.resolved.json", stableJson(json), { check, changed, files });
    const css = buildCss({ profiles, defaultId });
    await write("exports/tokens.css", css, { check, changed, files });
    await write("site/src/styles/tokens.generated.css", `${css}\n${buildDensityCss(profiles.get(defaultId))}`, { check, changed, files });
    return { files, changed, note: `${profiles.get(defaultId).size} tokens × ${profiles.size} profiles` };
  },
};

export const contrastGenerator = {
  name: "contrast report",
  async run({ manifest, profiles, defaultId, components, check }) {
    const changed = [];
    const files = [];
    const pairs = await loadDeclaredPairs({ profiles, defaultId, components });
    const json = {
      schemaVersion: 1,
      theme: manifest.name,
      version: manifest.version,
      profile: defaultId,
      method: "WCAG 2.x relative luminance on resolved sRGB values; translucent colours composited over the surface; pass decided on the unrounded ratio",
      pairs: pairs.map(({ source, label, state, kind, min, fgPath, bgPath, fg, bg, display, pass, waiver }) => ({ source, label, state, kind, min, fg: fgPath, bg: bgPath, fgHex: fg, bgHex: bg, ratio: Number(display), pass, waiver })),
    };
    await write("exports/contrast.json", stableJson(json), { check, changed, files });
    const md = [
      `# Contrast report (${manifest.version}, profile: ${defaultId})`,
      "",
      "Measured on resolved sRGB values with the WCAG 2.x formula. A pass here is a design target for the named role, not an application-wide conformance claim. Waived pairs are listed with their reason.",
      "",
      ...contrastTable(pairs),
      "",
    ].join("\n");
    await write("exports/contrast.md", md, { check, changed, files });
    return { files, changed, note: `${pairs.length} pairs, ${pairs.filter((p) => !p.pass && p.waiver).length} waived, ${pairs.filter((p) => !p.pass && !p.waiver).length} failing`, pairs };
  },
};

export const coverageOf = async (components) => {
  const coverage = {};
  for (const component of components) {
    const variants = demoVariantsOf(component);
    const demonstrated = Boolean(component.demo) && component.variants.every((v) => variants.includes(v.id));
    const tested = await exists(`tests/browser/components/${component.id}.spec.js`);
    coverage[component.id] = { family: component.family, priority: component.priority, maturity: component.maturity, specified: true, demonstrated, tested, testImplemented: tested, states: component.states.length };
  }
  return coverage;
};

export const componentsGenerator = {
  name: "component exports",
  async run(context) {
    const { manifest, profiles, defaultId, components, check } = context;
    const changed = [];
    const files = [];
    const resolved = profiles.get(defaultId);
    const sourceDigest = sourceDigestOf(await sourceInputs(manifest));
    const contrastPairs = await loadDeclaredPairs({ profiles, defaultId, components });
    const coverage = await coverageOf(components);
    for (const component of components) {
      const json = buildComponentJson({ manifest, profileId: defaultId, sourceDigest, resolved, component, contrastPairs, coverage: coverage[component.id] });
      await write(`exports/components/${component.id}.json`, stableJson(json), { check, changed, files });
      await write(`exports/components/${component.id}.brief.txt`, buildBrief({ manifest, profileId: defaultId, sourceDigest, resolved, component }), { check, changed, files });
    }
    const orphans = await pruneOrphans("exports/components", files, { check });
    context.sourceDigest = sourceDigest;
    context.coverage = coverage;
    context.contrastPairs = contrastPairs;
    return { files, changed, orphans, note: `${components.length} components` };
  },
};

export const docsGenerator = {
  name: "markdown exports",
  async run(context) {
    const { manifest, profiles, defaultId, components, check } = context;
    const changed = [];
    const files = [];
    const resolved = profiles.get(defaultId);
    const sourceDigest = context.sourceDigest ?? sourceDigestOf(await sourceInputs(manifest));
    const coverage = context.coverage ?? (await coverageOf(components));
    const contrastPairs = context.contrastPairs ?? (await loadDeclaredPairs({ profiles, defaultId, components }));
    const docs = await validateDocs(manifest);
    const families = await loadFamilies();
    const ports = [];
    for (const port of await validatePorts()) {
      const description = context.portDescriptions?.find(item => item.id === port.id) ?? await readPortDescription(port, await readJson("exports/tokens.resolved.json"));
      ports.push({ ...port, verification: description.verification });
    }
    const { catalogue } = await validateReferences();
    const decisionsMarkdown = (await readText("spec/decisions.md")).replace(/^---\n[\s\S]*?\n---\n/, "");
    const compact = buildCompact({ manifest, profileId: defaultId, sourceDigest, resolved, docs, components, coverage });
    const compactLines = compact.split("\n").length;
    if (compactLines > 300) throw new Error(`theme.compact.md is ${compactLines} lines; the limit is 300`);
    await write("exports/theme.compact.md", compact, { check, changed, files });
    await write("exports/theme.full.md", buildFull({ manifest, profileId: defaultId, sourceDigest, profiles, docs, components, families, coverage, contrastPairs, ports, catalogue, decisionsMarkdown }), { check, changed, files });
    await write("exports/llms.txt", buildLlms({ manifest }), { check, changed, files });
    context.ports = ports;
    context.catalogue = catalogue;
    return { files, changed, note: `compact ${compactLines} lines` };
  },
};

export const coverageGenerator = {
  name: "coverage ledger",
  async run(context) {
    const { manifest, components, check } = context;
    const changed = [];
    const files = [];
    const coverage = context.coverage ?? (await coverageOf(components));
    const summary = {};
    for (const [id, c] of Object.entries(coverage)) {
      summary[c.family] ??= { specified: 0, demonstrated: 0, tested: 0, testImplemented: 0, total: 0 };
      summary[c.family].total += 1;
      if (c.specified) summary[c.family].specified += 1;
      if (c.demonstrated) summary[c.family].demonstrated += 1;
      if (c.tested) { summary[c.family].tested += 1; summary[c.family].testImplemented += 1; }
      void id;
    }
    await write("exports/coverage.json", stableJson({ schemaVersion: 1, theme: manifest.name, version: manifest.version, definitions: { specified: "spec/components/<id>.md validates", demonstrated: "<id>.demo.html exists with a fragment for every declared variant and renders on the site", tested: "Compatibility alias for testImplemented; never an execution result", testImplemented: "tests/browser/components/<id>.spec.js exists; does not establish a pass" }, byFamily: summary, components: coverage }), { check, changed, files });
    return { files, changed };
  },
};

export const readmeGenerator = {
  name: "README blocks",
  async run(context) {
    const { manifest, components, profiles, defaultId, check } = context;
    const changed = [];
    const files = ["README.md"];
    const coverage = context.coverage ?? (await coverageOf(components));
    const ports = context.ports ?? (await validatePorts());
    let readme = await readText("README.md");
    readme = replaceMarkerBlock(readme, "ports", portsTable(ports).join("\n"));
    readme = replaceMarkerBlock(readme, "coverage", components.length ? coverageTable(components, coverage).join("\n") : "No components are specified yet.");
    const resolved = profiles.get(defaultId);
    const keyRoles = ["color.surface.canvas", "color.surface.default", "color.surface.raised", "color.text.default", "color.text.bright", "color.text.prose", "color.text.muted", "color.text.subtle", "color.border.control", "color.border.default", "color.interaction.focus.ring", "color.interaction.selection.bg", "color.action.primary.bg", "color.status.danger.text", "color.status.warning.text", "color.status.success.text", "color.status.info.text"];
    const rows = keyRoles.map((path) => {
      const token = resolved.get(path);
      return `| \`${path}\` | \`${toCss(token.type, token.resolved)}\` | ${statusOf(token)}; ${eligibilityText(eligibilityOf(manifest.profiles.find((p) => p.id === defaultId), token, resolved))} | ${token.description ?? ""} |`;
    });
    readme = replaceMarkerBlock(readme, "tokens", ["| Role | Value | Status | Use |", "| --- | --- | --- | --- |", ...rows].join("\n"));
    readme = replaceMarkerBlock(readme, "version", `Specification version **${manifest.version}** (${releaseOf(manifest.version).stability}; ${manifest.profiles.map((p) => `${p.id}: ${p.status}`).join(", ")}).\n\n${POLICY_TEXT}`);
    const consume = replaceMarkerBlock(await readText("agents/consume.md"), "eligibility", POLICY_TEXT);
    files.push("agents/consume.md");
    if (await writeOrCheck("agents/consume.md", consume, { check })) changed.push("agents/consume.md");
    if (await writeOrCheck("README.md", readme, { check })) changed.push("README.md");
    return { files, changed };
  },
};

export const digestsGenerator = {
  name: "digests",
  async run({ manifest, check }) {
    const changed = [];
    const files = [];
    const entries = {};
    for (const file of await listFiles("exports", { filter: (f) => f !== "exports/digests.json" })) entries[file] = sha256(await readText(file));
    await write("exports/digests.json", stableJson({ schemaVersion: 1, theme: manifest.name, version: manifest.version, algorithm: "sha256 over the file bytes with LF line endings, base64", files: entries }), { check, changed, files });
    return { files, changed, note: `${Object.keys(entries).length} files` };
  },
};

export const figmaGenerator = {
  name: "Figma Variables adapter",
  async run({ manifest, check }) {
    const files = ["exports/figma/importer.mjs"], changed = [];
    if (await writeOrCheck(files[0], `// j3w1 theme ${manifest.version}; generated from the independently authored Variables adapter.\n` + await readText("scripts/lib/figma-importer.mjs"), { check })) changed.push(files[0]);
    return { files, changed };
  },
};

export const GENERATORS = [schemasGenerator, tokensGenerator, contrastGenerator, componentsGenerator, patternGenerator, figmaGenerator, usageGenerator, portCatalogueGenerator, recipeGenerator, docsGenerator, coverageGenerator, readmeGenerator, { name: "official UI distribution", run: buildUI }, taskInputsGenerator, digestsGenerator];
