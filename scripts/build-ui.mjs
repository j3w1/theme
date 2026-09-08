#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { build } from "vite";
import { parseFragment } from "parse5";
import { repoRoot, readJson, readText, listFiles, sha256, stableJson } from "./lib/fs.mjs";
import { loadComponents } from "./lib/spec.mjs";
import { loadProfile, resolveTokens } from "./lib/tokens.mjs";
import { buildCss, buildDensityCss } from "./lib/css.mjs";
import { scopeRecipeCss, recipeTokenCss, RECIPE_SCOPE } from "./lib/recipe-css.mjs";
import { walkMarkup, attribute } from "./lib/markup.mjs";
import { writeCopyBundle, cssSourceClosure } from "./lib/ui-distribution.mjs";
import { consumerExamples } from "./lib/ui-consumer-examples.mjs";

export async function buildUI({ check = false } = {}) {
  const manifest = await readJson("theme.json");
  const inventory = await readJson("spec/inventory.json");
  const components = await loadComponents();
  const { definitions } = await import(pathToFileURL(path.join(repoRoot, "packages/ui/src/catalogue.mjs")));
  const { renderUsage } = await import(pathToFileURL(path.join(repoRoot, "packages/ui/src/examples.mjs")));
  const ids = inventory.components.map(c => c.id);
  if (ids.some(id => !definitions[id]) || Object.keys(definitions).some(id => !ids.includes(id))) throw new Error("Every inventory entry must have exactly one official implementation mapping");
  if (ids.some(id => !components.some(c => c.id === id))) throw new Error("Complete canonical component contracts before building the inventory");
  const stage = path.join(repoRoot, ".cache", "ui-build");
  if (path.dirname(stage) !== path.join(repoRoot, ".cache")) throw new Error("Invalid build staging path");
  await fs.rm(stage, { force: true, recursive: true });
  await fs.mkdir(stage, { recursive: true });
  const output = path.join(stage, "dist"), entries = path.join(stage, "entries");
  const put = async (root, file, text) => { const target = path.join(root, file); await fs.mkdir(path.dirname(target), { recursive: true }); await fs.writeFile(target, text); };
  const input = {};
  const types = new Map();
  const index = [], register = [];
  const packageRoot = path.join(repoRoot, "packages/ui/src");
  // Conservative identity includes reused form/schema modules and locked bundled
  // dependencies, so separate copy directories cannot silently mix builds.
  const runtimeSources = [...await listFiles("packages/ui/src"), ...await listFiles("scripts/lib"), ...await listFiles("schemas")].filter(file => /\.m?js$/.test(file));
  runtimeSources.push("scripts/build-ui.mjs", "package-lock.json", ...await listFiles("exports/forms"));
  const runtimeIdentity = (await Promise.all(runtimeSources.sort().map(async file => `${file}\n${await readText(file)}`))).join("\n");
  const baseImport = path.relative(path.join(entries, "components"), path.join(packageRoot, "internal/element.js")).split(path.sep).join("/");
  for (const id of ids) {
    const d = definitions[id];
    const className = `J3w1${id.split("-").map(s => s[0].toUpperCase() + s.slice(1)).join("")}`;
    const sourcePath = `packages/ui/src/behaviors/${d.module}.js`;
    const behaviorImport = path.relative(path.join(entries, "components"), path.join(repoRoot, sourcePath)).split(path.sep).join("/");
    const api = d.api ?? {};
    const methods = (api.methods ?? []).filter(method => !["refresh", "focus", "checkValidity", "reportValidity"].includes(method.name)).map(method => `  ${method.name}(...args) { if (!this._api?.${method.name}) throw new Error('Connect the component before calling ${method.name}'); return this._api.${method.name}(...args); }`).join("\n");
    const properties = (api.properties ?? []).filter(p => p.controller).map(p => `  get ${p.name}() { return this._api?.${p.name}; }${p.readonly ? "" : `\n  set ${p.name}(value) { if (this._api) this._api.${p.name} = value; else Object.defineProperty(this, '${p.name}', { value, configurable: true, writable: true }); }`}`).join("\n");
    const implementationId = sha256(runtimeIdentity + stableJson(d));
    const entry = `import { J3w1Element } from ${JSON.stringify(baseImport)};\nimport { ${d.behavior} } from ${JSON.stringify(behaviorImport)};\nexport class ${className} extends J3w1Element {\n  static componentId = ${JSON.stringify(id)};\n  static version = ${JSON.stringify(manifest.version)};\n  static implementationId = ${JSON.stringify(implementationId)};\n  static connect = ${d.behavior};\n  static upgradeProperties = ${JSON.stringify((api.properties ?? []).filter(p => !p.readonly).map(p => p.name))};\n  static observedAttributes = [...J3w1Element.observedAttributes, ...${JSON.stringify((api.attributes ?? []).map(p => p.name))}];\n${methods}\n${properties}\n}\n`;
    await put(entries, `components/${id}.js`, entry);
    const registryImport = path.relative(path.join(entries, "register"), path.join(packageRoot, "internal/element.js")).split(path.sep).join("/");
    await put(entries, `register/${id}.js`, `${(d.dependencies ?? []).map(dep => `import './${dep}.js';`).join("\n")}\nimport { ${className} } from '../components/${id}.js';\nimport { registerElement } from ${JSON.stringify(registryImport)};\nexport const element = registerElement('j3w1-${id}', ${className});\n`);
    input[`components/${id}`] = path.join(entries, `components/${id}.js`);
    input[`register/${id}`] = path.join(entries, `register/${id}.js`);
    index.push(`export { ${className} } from './components/${id}.js';`);
    register.push(`import './register/${id}.js';`);
    const declarations = [...(api.methods ?? []).map(m => `  ${m.name}${m.signature};`), ...(api.properties ?? []).filter(p => p.controller).map(p => `  ${p.readonly ? "readonly " : ""}${p.name}: ${p.type};`)].join("\n");
    types.set(`components/${id}.d.ts`, `import { J3w1Element } from '../element.js';\nexport declare class ${className} extends J3w1Element { static readonly componentId: '${id}'; static readonly version: '${manifest.version}';\n${declarations}\n}\ndeclare global { interface HTMLElementTagNameMap { 'j3w1-${id}': ${className}; } }\n`);
  }
  await put(entries, "index.js", index.join("\n") + "\n");
  await put(entries, "register.js", register.join("\n") + "\n");
  input.index = path.join(entries, "index.js"); input.register = path.join(entries, "register.js");
  for (const [id, name] of [["form-builder", "mountBuilder"], ["form-workflow", "mountWorkflow"], ["choice", "enhanceControls"]]) {
    const source = path.relative(path.join(entries, "enhance"), path.join(packageRoot, "internal", `${id}.js`)).split(path.sep).join("/");
    await put(entries, `enhance/${id}.js`, `export { ${name} } from ${JSON.stringify(source)};\n`);
    input[`enhance/${id}`] = path.join(entries, `enhance/${id}.js`);
  }
  await build({ configFile: false, root: repoRoot, logLevel: "warn", build: { outDir: output, emptyOutDir: true, target: "es2022", minify: false, sourcemap: false, rollupOptions: { preserveEntrySignatures: "strict", input, output: { format: "es", entryFileNames: "[name].js", chunkFileNames: "chunks/[name]-[hash].js" } } } });
  for (const [file, text] of types) await put(output, file, text);
  await put(output, "index.d.ts", index.join("\n") + "\n");
  await put(output, "element.d.ts", await readText("packages/ui/src/internal/element.d.ts"));
  await put(output, "cli.js", await readText("packages/ui/src/cli.js"));
  for (const id of ["form-builder", "form-workflow", "choice"]) await put(output, `enhance/${id}.d.ts`, await readText(`packages/ui/src/internal/${id}.d.ts`));
  for (const [name, content] of await consumerExamples()) if (!name.startsWith("gallery/")) await put(output, `frameworks/${name}`, content);
  await put(output, "consumption.md", await readText("docs/ui-consumption.md"));
  for (const [name, source] of [["consume.md", "agents/consume.md"], ["accessibility.md", "spec/accessibility.md"], ["identity.md", "spec/identity.md"]]) await put(output, `rules/${name}`, await readText(source));
  const defaultProfile = manifest.profiles.find(p => p.default);
  const resolved = resolveTokens(await loadProfile(defaultProfile.tokens));
  const tokens = buildCss({ profiles: new Map([[defaultProfile.id, resolved]]), defaultId: defaultProfile.id }) + buildDensityCss(resolved);
  await put(output, "tokens.css", tokens);
  const foundation = await readText("site/src/styles/recipe-foundation.css");
  const shared = await readText("packages/ui/src/styles/behavior.css");
  const choiceStyles = await readText('site/src/styles/themed-controls.css');
  await put(output, 'styles/controls.css', scopeRecipeCss(foundation + '\n' + choiceStyles).replaceAll(RECIPE_SCOPE, '[data-j3w1-controls]'));
  const thirdParty = (await Promise.all(["zod", "parse5", "entities"].map(async name => `## Bundled dependency: ${name}\n\n${await readText(`node_modules/${name}/LICENSE`)}\n`))).join("\n");
  const notices = await readText("LICENSE.md") + "\n## Distribution attribution\n\nExamples adapt j3w1 UI Theme Spec specimens under CC BY 4.0. Package behavior and generated code remain MIT. Keep these notices when copying. No fonts or external template material are bundled.\n\n" + thirdParty;
  await put(output, "LICENSE.md", notices);
  const implementations = [], examples = {};
  for (const id of ids) {
    const component = components.find(c => c.id === id), d = definitions[id];
    await put(output, `canonical/${id}.json`, await readText(`exports/components/${id}.json`));
    const variants = Object.fromEntries(component.variants.map(v => [v.id, renderUsage(component, v.id, `example-${id}-${v.id}`)]));
    const nestedTags = new Set(), nestedStyles = new Set();
    for (const markup of Object.values(variants)) walkMarkup(parseFragment(markup), node => {
      if (node.tagName?.startsWith("j3w1-") && node.tagName !== `j3w1-${id}`) nestedTags.add(node.tagName.slice(5));
      for (const name of (attribute(node, "class") ?? "").split(/\s+/)) if (ids.includes(name)) nestedStyles.add(name);
    });
    const registrations = new Set();
    const visitRegistration = name => { if (registrations.has(name)) return; if (!definitions[name]) throw new Error(`Unknown dependency: ${name}`); registrations.add(name); for (const dependency of definitions[name].dependencies ?? []) visitRegistration(dependency); };
    visitRegistration(id);
    for (const name of nestedTags) if (!registrations.has(name)) throw new Error(`Missing registration dependency: ${id} uses ${name}`);
    const sourceStyles = [];
    const visitStyles = name => {
      if (sourceStyles.includes(name)) return;
      sourceStyles.push(name);
      for (const dependency of [...(definitions[name]?.styles ?? []), ...(definitions[name]?.dependencies ?? [])]) visitStyles(dependency);
    };
    visitStyles(id);
    for (const name of nestedStyles) visitStyles(name);
    const cssEntries = [...sourceStyles.map(name => `components/${name}.css`), ...sourceStyles.flatMap(name => definitions[name]?.extraStyles ?? []).map(file => file.replace(/^site\/src\/styles\//, ""))];
    const sourceCss = await cssSourceClosure(path.join(repoRoot, "site/src/styles"), cssEntries);
    const css = [foundation, ...sourceCss.values(), shared].map(source => scopeRecipeCss(source).replaceAll(RECIPE_SCOPE, `j3w1-${id}`)).join("\n");
    const styles = `j3w1-${id} { display: ${d.display ?? "block"}; }\n` + css;
    const tokenClosure = recipeTokenCss([styles], resolved, defaultProfile);
    await put(output, `styles/${id}.css`, styles);
    examples[id] = variants;
    await put(output, `examples/${id}.json`, stableJson(variants));
    const contract = `${manifest.repository}/blob/v${manifest.version}/spec/components/${id}.md`;
    const item = { id, name: component.name, version: manifest.version, tag: `j3w1-${id}`, contract, source: `${manifest.repository}/blob/v${manifest.version}/packages/ui/src/behaviors/${d.module}.js`, imports: { class: `@j3w1/ui/components/${id}`, register: `@j3w1/ui/register/${id}`, styles: `@j3w1/ui/styles/${id}.css`, tokens: "@j3w1/ui/tokens.css" }, dom: "light", domReason: d.domReason, api: d.api, variants: component.variants, states: component.states, dependencies: d.dependencies ?? [], tokens: component.tokens, status: { implemented: true, packaged: true, verification: "See separate revision-aware execution evidence" } };
    item.styleDependencies = sourceStyles.filter(name => name !== id);
    item.tokenDependencies = { roles: tokenClosure.roles, paths: tokenClosure.paths, eligibility: tokenClosure.eligibility };
    item.maturity = component.maturity;
    item.copy = await writeCopyBundle({ root: output, component: item, markup: variants.default ?? Object.values(variants)[0], styles, tokens, notices, version: manifest.version });
    await put(output, `contracts/${id}.json`, stableJson({ ...item, copy: { directory: item.copy.directory, manifest: `${item.copy.directory}manifest.json`, digest: item.copy.files["manifest.json"] } }));
    implementations.push(item);
  }
  await put(output, "styles/index.css", ids.map(id => `@import './${id}.css';`).join("\n") + "\n");
  await put(output, "manifest.json", stableJson({ schemaVersion: 1, name: "@j3w1/ui", version: manifest.version, profile: defaultProfile.id, components: implementations }));
  await put(output, "examples.json", stableJson(examples));
  await put(output, "index.json", stableJson({ version: manifest.version, components: implementations.map(({ id, name, maturity }) => ({ id, name, maturity, contract: `contracts/${id}.json`, examples: `examples/${id}.json` })) }));
  const generatedFiles = await listFiles(".cache/ui-build/dist");
  const changed = [], files = [];
  for (const file of generatedFiles) {
    const relative = file.slice(".cache/ui-build/dist/".length), target = `packages/ui/dist/${relative}`;
    const text = await fs.readFile(path.join(repoRoot, file));
    let previous; try { previous = await fs.readFile(path.join(repoRoot, target)); } catch {}
    files.push(target);
    if (!previous?.equals(text)) { changed.push(target); if (!check) { await fs.mkdir(path.dirname(path.join(repoRoot, target)), { recursive: true }); await fs.writeFile(path.join(repoRoot, target), text); } }
  }
  const orphans = (await listFiles("packages/ui/dist")).filter(file => !files.includes(file));
  if (!check) for (const file of orphans) await fs.unlink(path.join(repoRoot, file));
  return { files, changed, orphans, implementations, examples, note: `${implementations.length} complete component distributions` };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildUI({ check: process.argv.includes("--check") }).then(result => { console.log(result.note); if (process.argv.includes("--check") && (result.changed.length || result.orphans.length)) process.exitCode = 1; }).catch(error => { console.error(error); process.exitCode = 1; });
}
