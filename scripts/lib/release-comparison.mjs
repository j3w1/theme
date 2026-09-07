import { z } from "zod";
import { sha256, stableJson } from "./fs.mjs";
import { pinnedKitSource } from "./task-kit-source.mjs";
import { releaseComparisonSchema, releaseMigrationSchema, RELEASE_RENDERER_VERSION } from "../../schemas/release-comparison.mjs";

const sorted = (values) => [...new Set(values)].sort();
const canonical = (value) => value && typeof value === "object" ? Array.isArray(value) ? value.map(canonical) : Object.fromEntries(Object.keys(value).sort().map((k) => [k, canonical(value[k])])) : value;
const same = (a, b) => JSON.stringify(canonical(a ?? null)) === JSON.stringify(canonical(b ?? null));
export const releaseSource = (revision, file, pointer = "") => ({ revision, file, pointer, url: `https://github.com/j3w1/theme/blob/${revision}/${file}` });
const pointer = (key) => key.replaceAll("~", "~0").replaceAll("/", "~1");
export const readRelease = async (ref, profile, { source, expectedRevision } = {}) => {
  source ??= await pinnedKitSource(ref);
  if (expectedRevision && source.revision !== expectedRevision) throw new Error(`Release pin moved: ${ref}`);
  const files = await source.list();
  const available = new Set(files);
  const contents = new Map();
  const read = async (file) => {
    if (!available.has(file)) return null;
    if (!contents.has(file)) contents.set(file, await source.read(file));
    return contents.get(file);
  };
  const json = async (file) => { const text = await read(file); return text === null ? null : JSON.parse(text); };
  const manifest = await json("theme.json");
  const resolved = await json("exports/tokens.resolved.json");
  const digests = await json("exports/digests.json");
  const availability = [];
  if (manifest?.name !== "j3w1-theme" || manifest.schemaVersion !== 1 || resolved?.schemaVersion !== 1 || resolved.theme !== manifest.name || resolved.version !== manifest.version || !resolved.profiles?.[profile]?.tokens) availability.push("Unsupported or missing version-1 manifest/resolved-token export or selected profile.");
  if (digests?.schemaVersion !== 1 || !digests.files) availability.push("Missing supported export digest ledger; historical semantic evidence is unsupported.");
  let supported = availability.length === 0;
  const components = {};
  const componentFiles = files.filter((f) => /^exports\/components\/[a-z][a-z0-9-]*\.json$/.test(f));
  await Promise.all(componentFiles.map(async (file) => {
    const component = await json(file);
    if (component.schemaVersion !== 1 || component.theme !== manifest?.name || component.version !== manifest?.version || file !== `exports/components/${component.id}.json` || !Array.isArray(component.states) || !Array.isArray(component.variants) || !component.tokens) throw new Error(`Unsupported component export: ${file}`);
    components[component.id] = component;
  }));
  if (!componentFiles.length) { availability.push("No historical component contracts; component changes and their impact are unknown."); supported = false; }
  for (const file of files.filter((f) => /^spec\/components\/[a-z][a-z0-9-]*\.md$/.test(f))) {
    const id = file.split("/").at(-1).replace(/\.md$/, "");
    if (!components[id]) { availability.push(`Missing historical component export: ${id}; semantic evidence is unsupported.`); supported = false; }
  }
  const usage = await json("exports/token-usage.json");
  if (usage && (usage.schemaVersion !== 1 || usage.theme !== manifest?.name || usage.version !== manifest?.version)) throw new Error("Unsupported historical usage index");
  if (!usage) availability.push("No historical usage index; impact uses the recorded component and port mappings. Prose and composite alias dependencies may be unknown.");
  const docs = {};
  for (const id of ["decisions", "portability"]) {
    docs[id] = await read(`spec/${id}.md`);
    if (docs[id] === null) availability.push(`Missing historical ${id} document.`);
  }
  const ports = {};
  for (const file of files.filter((f) => /^ports\/[a-z][a-z0-9-]*\/port\.json$/.test(f))) {
    const port = await json(file);
    const mappingFile = file.replace("port.json", "mapping.json");
    const mapping = await json(mappingFile);
    ports[port.id] = { manifest: port, mapping, file: mappingFile };
    if (!mapping || mapping.schemaVersion !== 1) availability.push(`Unsupported or missing port mapping: ${mappingFile}`);
  }
  const appearance = {};
  const appearanceFiles = files.filter((f) => /^site\/src\/styles\/.*\.css$/.test(f) || /^spec\/components\/[a-z][a-z0-9-]*\.demo\.html$/.test(f));
  await Promise.all(appearanceFiles.map(async (file) => { appearance[file] = sha256(await read(file)); }));
  const evidenceSchema = await json("schemas/json/verification-evidence.schema.json");
  // Verify only bytes actually read, against this revision's own ledger.
  for (const [file, text] of contents) if (file.startsWith("exports/") && file !== "exports/digests.json" && digests?.files) {
    if (!digests.files[file] || sha256(text) !== digests.files[file]) throw new Error(`Historical export digest mismatch: ${source.revision}:${file}`);
  }
  const inputs = Object.fromEntries([...contents].sort(([a], [b]) => a.localeCompare(b, "en")).map(([f, text]) => [f, sha256(text)]));
  const metadata = { ref, revision: source.revision, version: manifest?.version ?? null, profile, profileStatus: resolved?.profiles?.[profile]?.status ?? null, contractSchemaVersion: resolved?.schemaVersion ?? null, evidenceSchemaVersion: evidenceSchema?.properties?.schemaVersion?.const ?? null, sourceDigest: sha256(stableJson(inputs)), inputs, availability };
  return { metadata, supported, tokens: supported ? resolved.profiles[profile].tokens : {}, components, usage: usage?.profiles?.[profile]?.tokens ?? null, docs, ports, appearance, read };
};

const decisionSections = (text) => Object.fromEntries([...(text ?? "").matchAll(/^## (D-\d{3}) ([\s\S]*?)(?=^## D-\d{3} |$(?![\s\S]))/gm)].map((m) => [m[1], m[2].trim()]));
const contractOnly = (component) => {
  const { sourceDigest, version, release, coverage, anchors, ...contract } = component;
  return contract;
};
const refsOf = (component) => {
  const refs = [];
  const visit = (value, location) => {
    if (!value || typeof value !== "object") return;
    if (typeof value.alias === "string") refs.push({ role: value.alias, pointer: location });
    for (const [key, child] of Object.entries(value)) visit(child, `${location}/${pointer(key)}`);
  };
  visit(component.tokens, "/tokens"); visit(component.stateRules, "/stateRules");
  for (const [i, pair] of (component.contrast ?? []).entries()) for (const key of ["fg", "bg"]) refs.push({ role: pair[key], pointer: `/contrast/${i}/${key}` });
  return refs;
};

export const compareReleases = (from, to, { migrations = null } = {}) => {
  if (from.metadata.profile !== to.metadata.profile) throw new Error("Select the same profile on both sides");
  const changes = [];
  const add = (kind, key, before, after, file, location = "") => {
    if (!same(before, after)) changes.push({ kind, key, before: before ?? null, after: after ?? null, sources: [from, to].map((s) => releaseSource(s.metadata.revision, file, location)) });
  };
  const semanticStatus = from.supported && to.supported ? "compared" : "unsupported";
  const tokenFile = "exports/tokens.resolved.json";
  const profile = from.metadata.profile;
  if (semanticStatus === "compared") {
    const renamed = new Set();
    if (migrations) {
      const map = releaseMigrationSchema(z).parse(migrations);
      if (map.from !== from.metadata.revision || map.to !== to.metadata.revision) throw new Error("Migration map pins do not match comparison");
      for (const row of map.roles) {
        if (!from.tokens[row.from] || to.tokens[row.from] || from.tokens[row.to] || !to.tokens[row.to] || renamed.has(row.from) || renamed.has(row.to)) throw new Error("Ambiguous migration mapping");
        renamed.add(row.from); renamed.add(row.to);
        add("role-renamed", `${row.from} → ${row.to}`, { role: row.from, token: from.tokens[row.from] }, { role: row.to, token: to.tokens[row.to], reason: row.reason }, tokenFile);
      }
    }
    for (const role of sorted([...Object.keys(from.tokens), ...Object.keys(to.tokens)])) {
      if (renamed.has(role)) continue;
      const a = from.tokens[role], b = to.tokens[role];
      const at = `/profiles/${pointer(profile)}/tokens/${pointer(role)}`;
      if (!a || !b) { add(a ? "token-removed" : "token-added", role, a, b, tokenFile, at); continue; }
      add("token-value", role, { type: a.type, value: a.value, css: a.css }, { type: b.type, value: b.value, css: b.css }, tokenFile, at);
      add("token-alias", role, a.aliasOf, b.aliasOf, tokenFile, at);
      for (const field of ["status", "deprecated", "decisionId", "eligibility"]) add("token-status", `${role}:${field}`, a[field], b[field], tokenFile, `${at}/${field}`);
      add("token-metadata", role, a.description, b.description, tokenFile, `${at}/description`);
    }
    add("profile", profile, from.metadata.profileStatus, to.metadata.profileStatus, tokenFile, `/profiles/${pointer(profile)}/status`);
    for (const id of sorted([...Object.keys(from.components), ...Object.keys(to.components)])) {
      const a = from.components[id], b = to.components[id], file = `exports/components/${id}.json`;
      if (!a || !b) { add(a ? "component-removed" : "component-added", id, a && contractOnly(a), b && contractOnly(b), file); continue; }
      add("component-states", id, a.states, b.states, file, "/states");
      add("component-variants", id, a.variants, b.variants, file, "/variants");
      const { states: sa, variants: va, ...ca } = contractOnly(a);
      const { states: sb, variants: vb, ...cb } = contractOnly(b);
      add("component-contract", id, ca, cb, file);
    }
    if (from.docs.decisions !== null && to.docs.decisions !== null) {
      const aDecisions = decisionSections(from.docs.decisions), bDecisions = decisionSections(to.docs.decisions);
      for (const id of sorted([...Object.keys(aDecisions), ...Object.keys(bDecisions)])) add("decision", id, aDecisions[id], bDecisions[id], "spec/decisions.md");
    }
    if (from.docs.portability !== null && to.docs.portability !== null) add("portability", "global portability rules", from.docs.portability, to.docs.portability, "spec/portability.md");
    for (const file of sorted([...Object.keys(from.appearance), ...Object.keys(to.appearance)])) add("appearance-source", file, from.appearance[file], to.appearance[file], file);
    for (const id of sorted([...Object.keys(from.ports), ...Object.keys(to.ports)])) add("port-mapping", id, from.ports[id], to.ports[id], `ports/${id}/mapping.json`);
  }
  const affectedRoles = new Set(changes.filter((c) => c.kind.startsWith("token-")).map((c) => c.key.split(":")[0]));
  for (const row of migrations?.roles ?? []) { affectedRoles.add(row.from); affectedRoles.add(row.to); }
  // Follow recorded alias edges, including composite edges from the reverse index.
  let grew = true;
  while (grew) {
    grew = false;
    for (const side of [from, to]) for (const [role, token] of Object.entries(side.tokens)) {
      const deps = [...(token.aliasOf ? [token.aliasOf] : []), ...(side.usage?.[role]?.aliases ?? [])];
      if (!affectedRoles.has(role) && deps.some((r) => affectedRoles.has(r))) { affectedRoles.add(role); grew = true; }
    }
  }
  const components = [], ports = [];
  const globalAppearance = changes.some((c) => c.kind === "appearance-source" && !c.key.includes("/components/"));
  for (const id of sorted([...Object.keys(from.components), ...Object.keys(to.components)])) {
    const sources = [], roles = [];
    for (const side of [from, to]) if (side.components[id]) for (const ref of refsOf(side.components[id])) if (affectedRoles.has(ref.role)) { roles.push(ref.role); sources.push(releaseSource(side.metadata.revision, `exports/components/${id}.json`, ref.pointer)); }
    const own = changes.filter((c) => (c.kind.startsWith("component-") && c.key === id) || (c.kind === "appearance-source" && (c.key.endsWith(`/components/${id}.css`) || c.key.endsWith(`/components/${id}.demo.html`))));
    if (roles.length || own.length || globalAppearance) components.push({ id, classification: roles.length || own.length ? "known affected" : "potentially affected", roles: sorted(roles), sources: [...sources, ...own.flatMap((c) => c.sources), ...(globalAppearance ? changes.filter((c) => c.kind === "appearance-source" && !c.key.includes("/components/")).flatMap((c) => c.sources) : [])] });
  }
  for (const id of sorted([...Object.keys(from.ports), ...Object.keys(to.ports)])) {
    const roles = [], sources = [];
    for (const side of [from, to]) for (const role of Object.keys(side.ports[id]?.mapping?.mappings ?? {})) if (affectedRoles.has(role)) { roles.push(role); sources.push(releaseSource(side.metadata.revision, side.ports[id].file, `/mappings/${pointer(role)}`)); }
    if (roles.length) ports.push({ id, classification: "potentially affected", roles: sorted(roles), sources });
  }
  const report = {
    schemaVersion: 1, rendererVersion: RELEASE_RENDERER_VERSION, from: from.metadata, to: to.metadata, semanticStatus, changes,
    impact: { components, ports, catalogue: semanticStatus === "unsupported" ? "unknown" : Object.keys(from.ports).length + Object.keys(to.ports).length ? "registered mappings" : "no registered ports", unknownConsumers: "Unknown: consumers without registered mappings cannot be enumerated." },
    visual: { status: "not run", description: "Matched reconstructed specimens are visual references. Source equality is not a pixel comparison or a historical execution pass. Browser capture results are separate run evidence.", settings: { width: 640, height: 480, density: "comfortable", direction: "ltr", motion: "reduce", javaScript: false } },
    verification: ["Review changed roles and their explicit dependencies.", "Recheck applicable component states, focus, selection and contrast in each actual consumer.", "Run matched browser captures and inspect differences; record browser, fonts, viewport and input digests.", "Resolve unsupported historical inputs and unmapped consumers before claiming migration coverage."],
    limitations: ["Historical JavaScript and historical build tools are never executed.", "Only explicit revision-bound migration mappings establish renames.", "Missing eligibility or evidence fields remain unknown; current rules are never backfilled.", "Known affected means a recorded contract/dependency changed, not that a downstream application regressed.", "No native-port verification or automatic consumer upgrade is performed."],
  };
  return releaseComparisonSchema(z).parse(report);
};

export const comparisonMarkdown = (report) => {
  const cell = (v) => JSON.stringify(v).replaceAll("|", "\\|").replaceAll("\n", " ");
  return [`# Release comparison`, "", `From: ${report.from.revision} (${report.from.profile}, ${report.from.profileStatus ?? "unknown"})`, `To: ${report.to.revision} (${report.to.profile}, ${report.to.profileStatus ?? "unknown"})`, `Semantic status: ${report.semanticStatus}. Visual execution: ${report.visual.status}.`, "", ...[...report.from.availability, ...report.to.availability].map((s) => `- ${s}`), "", "## Changes", "", "| Kind | Contract | Before | After |", "| --- | --- | --- | --- |", ...report.changes.map((c) => `| ${c.kind} | ${c.key} | ${cell(c.before)} | ${cell(c.after)} |`), ...(report.changes.length ? [] : ["No semantic changes detected in supported inputs."]), "", "## Impact", "", `Ports: ${report.impact.catalogue}. ${report.impact.unknownConsumers}`, ...report.impact.components.map((c) => `- ${c.id}: ${c.classification}; roles: ${c.roles.join(", ") || "component/shared appearance input"}. ${c.sources.map((s) => `${s.url} (${s.pointer || "file"})`).join("; ")}`), ...report.impact.ports.map((p) => `- ${p.id}: ${p.classification}; ${p.roles.join(", ")}. ${p.sources.map((s) => s.url).join("; ")}`), "", "## Expected verification", "", ...report.verification.map((s) => `- ${s}`), "", "## Limits", "", ...report.limitations.map((s) => `- ${s}`), ""].join("\n");
};
