/* Structural native-theme contracts only: no import, screenshot, browser or
   Windows execution is implied by these assertions. */
import assert from "node:assert/strict";
import test from "node:test";
import postcss from "postcss";
import { readJson, readText, sha256 } from "../scripts/lib/fs.mjs";
import { loadResolvedProfile, toResolvedExport } from "../scripts/lib/tokens.mjs";
import { PORT_EMITTERS, assertPortArtifacts } from "../scripts/lib/port-artifacts.mjs";
import { obsidianArtifacts, OBSIDIAN_MIN_APP_VERSION, OBSIDIAN_RULES, OBSIDIAN_VARIABLE_TYPES } from "../scripts/lib/obsidian-port.mjs";
import { assertPortMapping } from "../schemas/usage.mjs";
import { assertCapabilities } from "../schemas/port-capabilities.mjs";
import { evaluatePair } from "../scripts/lib/contrast.mjs";
import { downloadsTable } from "../scripts/lib/exports.mjs";

const manifest = await readJson("theme.json"), port = await readJson("ports/obsidian/port.json");
const mapping = await readJson("ports/obsidian/mapping.json"), capabilities = await readJson("ports/obsidian/capabilities.json");
const profile = manifest.profiles.find(p => p.id === port.profile);
const resolved = await loadResolvedProfile(profile.tokens), exported = toResolvedExport(resolved, profile);
const args = { manifest, port, mapping, resolved, exported };
const css = await readText("ports/obsidian/dist/theme.css"), native = await readJson("ports/obsidian/dist/manifest.json");
const ast = postcss.parse(css);
const declarations = new Map();
ast.walkRules(rule => {
  // Forced-color overrides are system colors, separate from canonical mapping.
  if (rule.parent.type === "atrule" && rule.parent.params === "(forced-colors: active)") return;
  for (const declaration of rule.nodes.filter(n => n.type === "decl")) {
    const key = rule.selector === ".theme-dark" ? declaration.prop : `${rule.selector} | ${declaration.prop}`;
    assert.ok(!declarations.has(key), `${key} emitted twice`);
    declarations.set(key, declaration.value);
  }
});
const owner = Object.fromEntries(Object.entries(mapping.mappings).flatMap(([role, keys]) => keys.map(key => [key, role])));
const assertRole = (key, role) => { assert.equal(owner[key], role, key); assert.equal(declarations.get(key), exported[role].css, key); };

test("Obsidian is a normal experimental two-artifact default-profile port", () => {
  assert.equal(PORT_EMITTERS[port.format], obsidianArtifacts);
  assert.equal(port.format, "obsidian-theme");
  assert.equal(port.status, "experimental");
  assert.equal(port.profile, "default");
  assert.deepEqual(port.targetVersions, ["1.13.4", "1.13.7"]);
  assert.deepEqual(port.testedVersions, []);
  assert.deepEqual(port.evidence, []);
  assert.deepEqual(port.os, ["any"]);
  assert.equal(capabilities.integrationKind, "other");
  assert.equal(capabilities.surfaces["light-mode"].state, "unsupported");
  assert.equal(capabilities.verificationPath, undefined);
  assert.deepEqual(port.files.map(f => f.path), ["dist/manifest.json", "dist/theme.css"]);
  assert.equal(port.themeVersion, manifest.version);
});
test("reviewed Windows helper stages a validated pair before replacement and preserves a recovery path", async () => {
  const installer = await readText("ports/obsidian/install.ps1");
  assert.match(installer, /^param\(\s*\[Parameter\(Mandatory\)\]\[string\]\$VaultPath,\s*\[string\]\$SourcePath\s*\)/);
  assert.match(installer, /\$ErrorActionPreference = 'Stop'/);
  assert.match(installer, /https:\/\/j3w1\.github\.io\/theme\/ports\/obsidian\//);
  assert.match(installer, /\$names = @\('manifest\.json', 'theme\.css'\)/);
  assert.match(installer, /ConvertFrom-Json -ErrorAction Stop/);
  assert.match(installer, /\$manifest\.name -cne 'j3w1'/);
  assert.match(installer, /\$manifest\.minAppVersion -notmatch/);
  assert.match(installer, /\$header -cne \$expected/);
  assert.ok(installer.indexOf("$header -cne $expected") < installer.indexOf("New-Item -ItemType Directory -Path $themes"));
  assert.match(installer, /Existing theme has only one of the two files/);
  assert.match(installer, /previous theme pair restored/);
  assert.match(installer, /Keep recovery copies at \$staging/);
  assert.match(installer, /\} finally \{/);
  assert.doesNotMatch(installer, /Invoke-Expression|iex\b|ExecutionPolicy|Set-Content|\.obsidian[\\/]plugins/i);
});
test("native manifest and exact artifact bytes are deterministic and current", async () => {
  assert.deepEqual(native, { name: "j3w1", version: manifest.version, minAppVersion: "1.13.4", author: "j3w1", authorUrl: "https://github.com/j3w1" });
  assert.equal(native.minAppVersion, OBSIDIAN_MIN_APP_VERSION);
  const first = obsidianArtifacts(args), again = obsidianArtifacts(args);
  assert.deepEqual(first, again);
  assertPortArtifacts(port, first);
  for (const file of first) assert.equal(file.text, await readText(`ports/obsidian/${file.path}`));
  assert.equal(sha256(await readText("exports/tokens.resolved.json")), port.tokenDigest);
});
test("every profile token is classified exactly once and native keys have a single semantic owner", () => {
  assertPortMapping({ ...port, mapping }, resolved.keys());
  assertCapabilities({ ...port, mapping }, capabilities);
  const keys = Object.values(mapping.mappings).flat();
  assert.equal(new Set(keys).size, keys.length);
  for (const [role, names] of Object.entries(mapping.mappings)) {
    assert.ok(!role.startsWith("color.primitive."), role);
    assert.ok(["use", "use-and-report"].includes(exported[role].eligibility.action), role);
    for (const key of names) assert.equal(declarations.get(key), exported[role].css, key);
  }
  for (const role of resolved.keys()) {
    const detail = capabilities.roles[role];
    if (role.startsWith("color.primitive.")) assert.equal(detail.state, "out-of-scope", role);
    if (detail.state !== "mapped") assert.equal(detail.reason, mapping.unmapped[role], role);
  }
  for (const state of ["inherited", "unsupported", "out-of-scope"]) assert.ok(Object.values(capabilities.roles).some(r => r.state === state));
  for (const [state, names] of Object.entries(port.surfaces)) assert.deepEqual(names.sort(), Object.entries(capabilities.surfaces).filter(([, s]) => s.state === state).map(([name]) => name).sort());
  const duplicate = structuredClone(mapping);
  duplicate.mappings["color.text.default"].push("--background-primary");
  assert.throws(() => obsidianArtifacts({ ...args, mapping: duplicate }), /Duplicate Obsidian/);
  const primitive = structuredClone(mapping);
  primitive.mappings["color.primitive.ink.0"] = ["--background-primary"];
  assert.throws(() => obsidianArtifacts({ ...args, mapping: primitive }), /semantic role/);
  const unknown = structuredClone(mapping); unknown.mappings["color.text.default"].push("--not-an-obsidian-hook");
  assert.throws(() => obsidianArtifacts({ ...args, mapping: unknown }), /Unknown Obsidian/);
  const missing = structuredClone(mapping); delete missing.mappings["color.text.default"];
  assert.throws(() => obsidianArtifacts({ ...args, mapping: missing }), /Missing Obsidian/);
  const wrongType = new Map(resolved); wrongType.set("color.surface.canvas", resolved.get("space.4"));
  assert.throws(() => obsidianArtifacts({ ...args, resolved: wrongType }), /requires color/);
});
test("native semantic families keep surfaces, text, controls, status, focus and selection separate", () => {
  for (const [key, role] of Object.entries({
    "--background-primary": "color.surface.canvas", "--background-secondary": "color.surface.default",
    "--menu-background": "color.surface.raised", "--prompt-background": "color.surface.raised",
    "--modal-background": "color.surface.overlay", "--background-modifier-form-field": "color.surface.input",
    "--ribbon-background": "color.surface.chrome", "--settings-background": "color.surface.default",
    "--text-normal": "color.text.default", "--text-muted": "color.text.muted",
    "--inline-title-color": "color.text.heading",
    "--h1-color": "color.text.heading", "--h2-color": "color.text.heading", "--h3-color": "color.text.heading",
    "--h4-color": "color.text.heading", "--h5-color": "color.text.heading", "--h6-color": "color.text.heading",
    "--italic-color": "color.text.bright", "--setting-group-heading-color": "color.text.bright",
    "--text-faint": "color.text.subtle", "--input-placeholder-color": "color.text.placeholder",
    "--background-modifier-border": "color.border.control",
    "--color-accent": "color.text.accent-strong",
    "--background-modifier-border-focus": "color.interaction.focus.ring", "--caret-color": "color.code.caret",
    "--nav-item-background-selected": "color.interaction.selection.bg", "--nav-item-color-selected": "color.interaction.selection.text",
    "--background-modifier-hover": "color.interaction.hover.bg", "--interactive-accent": "color.action.primary.bg",
    "--text-error": "color.status.danger.text", "--text-warning": "color.status.warning.text",
    "--text-success": "color.status.success.text", "--callout-info": "color.status.info.text",
    "--code-background": "color.code.bg", "--code-keyword": "color.code.syntax.keyword"
  })) assertRole(key, role);
  for (const selector of [
    ".theme-dark.is-phone .search-input-container.mod-raised input",
    ".theme-dark .workspace-drawer .search-input-container input",
    ".theme-dark .metadata-property-value .multi-select-container input",
    ".theme-dark .bases-search-row .search-input-container input"
  ]) assertRole(`${selector} | background-color`, "color.surface.input");
  assert.deepEqual(Object.keys(owner).filter(key => key.endsWith("| --input-placeholder-color")), [], "scoped fields keep the approved placeholder role");
  for (const key of Object.keys(OBSIDIAN_VARIABLE_TYPES).filter(k => /radius|tab-curve/.test(k))) assertRole(key, "radius.none");
  for (const [key, role] of Object.entries(owner)) if (/^color\.status\.(warning|success|info)\./.test(role)) assert.match(key, /^--(?:text-(?:warning|success)|background-modifier-(?:warning|success)|callout-(?:warning|success|info))/);
  for (const key of Object.keys(owner).filter(k => k.startsWith("--code-") && k !== "--code-background" && !k.includes("border") && k !== "--code-radius")) assert.match(owner[key], /^color\.code\.syntax\./);
});
test("rose reading scopes, semantic headings and inherited bold, compact command rows and filled focus match the audited gaps", () => {
  assert.equal(exported["color.text.default"].css, "#e99499");
  assert.equal(exported["color.text.prose"].css, "#e99499");
  assertRole(".theme-dark .markdown-preview-view | color", "color.text.prose");
  assertRole(".theme-dark .markdown-source-view.mod-cm6 .cm-content | color", "color.text.prose");
  assert.deepEqual(Object.keys(owner).filter(k => owner[k] === "color.text.heading").sort(), ["--h1-color", "--h2-color", "--h3-color", "--h4-color", "--h5-color", "--h6-color", "--inline-title-color"].sort());
  assertRole(".theme-dark .prompt .suggestion-item.is-selected | background-color", "color.interaction.selection.bg");
  assertRole(".theme-dark .prompt .suggestion-item.is-selected | border-inline-start-color", "color.border.selected-indicator");
  assertRole(".theme-dark .prompt .suggestion-item | min-height", "density.compact.row-height");
  assertRole(".theme-dark .prompt input.prompt-input:focus-visible | outline", "focus.ring");
  assertRole(".theme-dark button.mod-cta | --background-modifier-border-focus", "color.interaction.focus.ring-container");
  assertRole(".theme-dark .checkbox-container.is-enabled | --background-modifier-border-focus", "color.interaction.focus.ring-container");
  assertRole(".theme-dark button.mod-warning | --background-modifier-border-focus", "color.action.destructive.filled-text");
  assertRole(".theme-dark:not(.is-focused) .workspace-tab-header-container .workspace-tab-header.is-active | background-color", "color.interaction.selection.inactive-bg");
  // Only the native-suppressed prompt ring is replaced; other focus hooks recolor native geometry.
  for (const key of declarations.keys()) if (key.endsWith(" | outline")) assert.equal(key, ".theme-dark .prompt input.prompt-input:focus-visible | outline");
});
test("native font hooks preserve all fallback families and user sizing/overrides", () => {
  for (const key of ["--font-interface-theme", "--font-text-theme", "--font-monospace-theme"]) assertRole(key, "font.family.mono");
  assert.doesNotMatch(css, /--font-(?:interface|text|monospace)(?:-override)?\s*:|--font-ui-[a-z-]+\s*:|--font-text-size\s*:|font-size\s*:|zoom\s*:|@font-face/);
  for (const r of ["font.size.reading", "font.size.code", "font.size.ui-sm"]) assert.equal(capabilities.roles[r].state, "inherited");
});
test("the 1.13 hook audit, selector ledger and dark-only hazard contracts stay closed", async () => {
  const audit = await readJson("tests/fixtures/obsidian-hooks.json");
  assert.deepEqual(audit.nativeVariables.sort(), Object.keys(OBSIDIAN_VARIABLE_TYPES).sort());
  assert.deepEqual(audit.selectors.sort(), OBSIDIAN_RULES.map(r => r.selector).sort());
  assert.deepEqual(audit.versions.map(v => v.version), ["1.13.4", "1.13.7"]);
  assert.deepEqual(port.targetVersions, audit.versions.map(v => v.version), "targets are exactly the audited host versions");
  for (const version of audit.versions) {
    for (const key of [...audit.nativeVariables, ...audit.resetVariables]) {
      assert.ok(version.hooks[key].definitionLine > 0, `${version.version}: ${key} definition`);
      assert.ok(version.hooks[key].consumerCount > 0, `${version.version}: ${key} consumer`);
      assert.ok(version.hooks[key].example.selector, `${version.version}: ${key} consumer selector`);
    }
    for (const key of audit.unusedVariables) {
      assert.ok(version.hooks[key].definitionLine > 0, `${version.version}: ${key} inert definition`);
      assert.equal(version.hooks[key].consumerCount, 0, `${version.version}: ${key} inert consumer`);
      assert.ok(!declarations.has(key), `${key} must not inflate mapped coverage`);
    }
  }
  assert.equal(capabilities.roles["color.status.warning.tint"].state, "unsupported");
  assert.equal(capabilities.roles["color.action.destructive.text"].state, "mapped");
  assert.equal(capabilities.roles["color.action.destructive.filled-bg"].state, "inherited");
  assert.doesNotMatch(css, /--color-accent-[12]\s*:/);
  const implementation = await readText("ports/obsidian/IMPLEMENTATION.md");
  for (const rule of OBSIDIAN_RULES) {
    assert.ok(implementation.includes('`' + rule.selector + '`'), rule.selector);
    assert.ok(rule.reason.length > 20);
  }
  ast.walkRules(rule => {
    for (const selector of rule.selector.split(",")) assert.ok(selector.trim().startsWith(".theme-dark"), selector);
    assert.doesNotMatch(rule.selector, /:has\(|:nth-|:first-|:last-|\s>\s|\+|~/);
    assert.ok(rule.selector.trim().split(/\s+/).length <= 4 || rule.parent.params === "(forced-colors: active)", rule.selector);
  });
  assert.doesNotMatch(css, /\.theme-light|!important|:has\(|@import|@font-face|url\(|https?:|OLED|telemetry|--[a-z-]*(?:rgb|hsl)|--accent-[hsl]\s*:/i);
  assert.doesNotMatch(await readText("scripts/lib/obsidian-port.mjs"), /#[0-9a-f]{3,8}\b/i, "no literal palette in renderer");
  const readme = await readText("ports/obsidian/README.md");
  assert.match(readme, /experimental/i);
  assert.match(readme, /user-reported/i);
  assert.match(readme, /minimum app version \*\*1\.13\.4\*\*/);
  assert.doesNotMatch(readme, /1\.13\.4\+/, "no open-ended version claim beyond the audited targets");
  assert.match(readme, /install\.ps1/);
  assert.match(readme, /IMPLEMENTATION\.md/);
  for (const file of ["manifest.json", "theme.css"]) assert.ok(readme.includes(`https://j3w1.github.io/theme/ports/obsidian/${file}`));
  for (const instruction of ["Get-Content -LiteralPath $installer", "& $installer -VaultPath $vault", "Invoke-WebRequest", "Restart Obsidian", "roll back", "Base color scheme → Dark"]) assert.ok(readme.includes(instruction), instruction);
  assert.match(implementation, /NOT_RUN/);
  assert.match(implementation, /user/);
  assert.match(implementation, /platform[\s\S]*`android`/);
  assert.match(readme, /no Android import is recorded/);
});
test("Android shares the port: one README entry, an operational guide and the same reviewed-download discipline", async () => {
  const readme = await readText("ports/obsidian/README.md"), android = await readText("ports/obsidian/ANDROID.md");
  const termux = [
    "curl -fL --proto '=https' https://j3w1.github.io/theme/ports/obsidian/install-android.sh -o \"$HOME/j3w1-install-android.sh\"",
    "cat \"$HOME/j3w1-install-android.sh\"", "sh \"$HOME/j3w1-install-android.sh\" --vault \"$vault\"",
  ];
  for (const line of [...termux, "termux-setup-storage", "pkg install curl jq", "device storage", "(ANDROID.md)"]) assert.ok(readme.includes(line), `README: ${line}`);
  for (const line of [...termux, "termux-setup-storage", "pkg install curl jq", "**Device storage**", "**App storage**", "Manual fallback without Termux", "roll back", "Base color scheme → Dark", "No Android import", "(README.md)", "(IMPLEMENTATION.md)"]) assert.ok(android.includes(line), `ANDROID.md: ${line}`);
  for (const file of ["manifest.json", "theme.css"]) assert.ok(android.includes(`https://j3w1.github.io/theme/ports/obsidian/${file}`), file);
  // Recovery after an abrupt stop, and the audited versions, are stated rather than implied.
  for (const line of [".j3w1-backup-…", ".j3w1-install-…", "as long as no other app changes", "later versions are not"]) assert.ok(android.includes(line), `ANDROID.md: ${line}`);
  assert.doesNotMatch(android, /delete what is left/, "recovery never tells the user to delete unknown content");
  assert.match(readme, /source-audited on 1\.13\.4\s+and\s+1\.13\.7\s+only;\s+later\s+versions\s+are\s+not\s+audited\s+or\s+imported/);
  for (const [name, text] of [["README.md", readme], ["ANDROID.md", android]]) {
    assert.doesNotMatch(text, /\|\s*(?:ba|da)?sh\b/, `${name} never pipes a download into a shell`);
    assert.doesNotMatch(text, /\/main\//, `${name} links no branch`);
  }
});
test("contrast pairs validate actual native values without rounding a failure into a pass", () => {
  const check = (foreground, background, min = 4.5) => {
    const fg = resolved.get(owner[foreground]).resolved, bg = resolved.get(owner[background]).resolved;
    assert.equal(declarations.get(foreground), exported[owner[foreground]].css);
    assert.equal(declarations.get(background), exported[owner[background]].css);
    const result = evaluatePair({ fg, bg, min });
    assert.ok(result.pass, `${foreground} on ${background}: ${result.ratio}`);
  };
  for (const surface of ["--background-primary", "--background-secondary", "--menu-background", "--modal-background"]) {
    for (const text of ["--text-normal", "--text-muted", "--text-faint", "--text-error", "--text-warning", "--text-success", "--callout-info"]) check(text, surface);
    check("--background-modifier-border-focus", surface, 3);
  }
  check("--background-modifier-border", "--background-modifier-form-field", 3);
  check("--nav-item-color-selected", "--nav-item-background-selected");
  check("--text-on-accent", "--interactive-accent");
  check(".theme-dark button.mod-cta | --background-modifier-border-focus", "--interactive-accent", 3);
  check(".theme-dark button.mod-warning | --text-color", "--background-modifier-error");
  check(".theme-dark button.mod-warning | --background-modifier-border-focus", "--background-modifier-error", 3);
  check("--text-error", "--interactive-normal");
  for (const property of ["color", "--text-muted", "--text-faint", "--text-accent"]) check(`.theme-dark .prompt .suggestion-item.is-selected | ${property}`, ".theme-dark .prompt .suggestion-item.is-selected | background-color");
});
test("source preparation pins Obsidian downloads to the next version and preserves the latest published release", async () => {
  assert.equal(manifest.version, "4.0.0");
  assert.deepEqual(manifest.release, { tag: "v3.0.0", commit: "f0e9e25a00357c0b47ae3d1392b87e5bc0aa91e6" });
  const rows = downloadsTable(manifest, [{ ...port, verification: { status: "not verified" } }]).join("\n");
  for (const file of port.files) assert.ok(rows.includes(`/v4.0.0/ports/obsidian/${file.path}`));
  assert.doesNotMatch(rows, /\/v3.0.0\/ports\/obsidian|\/main\//);
  const catalog = await readJson("exports/port-capabilities.json");
  assert.equal(catalog.ports.find(p => p.id === "obsidian").verification.status, "not verified");
  const usage = await readJson("exports/token-usage.json");
  assert.ok(usage.profiles.default.tokens["color.surface.canvas"].uses.some(use => use.port === "obsidian"));
});
