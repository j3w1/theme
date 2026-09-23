import { promises as fs } from "node:fs";
import path from "node:path";
import { sha256, stableJson, writeFileEnsured } from "./fs.mjs";
import { escapeHtml } from "./hex-literals.mjs";
import { scopeRecipeCss, RECIPE_SCOPE } from "./recipe-css.mjs";
import { init, parse } from "es-module-lexer";
import postcss from "postcss";

export async function cssSourceClosure(root, entries, { read = name => fs.readFile(path.join(root, name), 'utf8') } = {}) {
  const files = new Map(), visiting = new Set();
  const visit = async relative => {
    const name = path.posix.normalize(relative);
    if (name.startsWith("../") || path.posix.isAbsolute(name) || name.includes("\\")) throw new Error(`Unsafe CSS dependency: ${name}`);
    if (visiting.has(name)) throw new Error(`Circular CSS dependency: ${name}`);
    if (files.has(name)) return;
    visiting.add(name);
    const content = await read(name);
    if (typeof content !== 'string') throw new Error(`Missing CSS dependency: ${name}`);
    const tree = postcss.parse(content.replaceAll("\r\n", "\n"));
    const imports = [];
    tree.walkAtRules("import", rule => {
      const match = /^["']([^"']+)["']$/.exec(rule.params);
      if (!match || /^(?:[a-z]+:|\/)/i.test(match[1])) throw new Error(`Unsupported CSS import: ${name}: ${rule.params}`);
      imports.push(path.posix.join(path.posix.dirname(name), match[1])); rule.remove();
    });
    for (const dependency of imports) await visit(dependency);
    visiting.delete(name); files.set(name, tree.toString());
  };
  for (const entry of entries) await visit(entry);
  return files;
}

// Follow the literal ESM imports emitted by the build, never arbitrary source code.
export async function moduleClosure(root, entries) {
  await init;
  const files = new Map();
  const visit = async relative => {
    const name = path.posix.normalize(relative);
    if (name.startsWith("../") || path.posix.isAbsolute(name) || name.includes("\\")) throw new Error(`Unsafe module dependency: ${name}`);
    if (files.has(name)) return;
    const text = await fs.readFile(path.join(root, name), "utf8");
    files.set(name, text);
    for (const dependency of parse(text, name)[0]) {
      if (dependency.type === "import-meta") continue; // import.meta is not a module dependency.
      // A template-literal import() reports a glob such as "./x/*.js": not a literal module.
      if (!dependency.specifier || dependency.glob) throw new Error(`Non-literal runtime dependency: ${name}`);
      if (!dependency.specifier.startsWith(".")) throw new Error(`Unbundled runtime dependency: ${name}: ${dependency.specifier}`);
      await visit(path.posix.join(path.posix.dirname(name), dependency.specifier));
    }
  };
  for (const entry of entries) await visit(entry);
  return files;
}

/* The package's standalone controls stylesheet: the canonical themed
   controls on the recipe foundation, rescoped from the recipe class to the
   application enhancement boundary. Design mode rewrites it from the same
   expression, so the two never drift. */
export const controlsCss = (foundation, themedControls) => scopeRecipeCss(`${foundation}\n${themedControls}`).replaceAll(RECIPE_SCOPE, "[data-j3w1-controls]");

export async function writeCopyBundle({ root, component, markup, styles, tokens, notices, version }) {
  const runtime = await moduleClosure(root, [`register/${component.id}.js`]);
  const files = Object.fromEntries([...runtime].map(([name, text]) => [`runtime/${name}`, text]));
  files["tokens.css"] = tokens;
  files["component.css"] = styles;
  files["LICENSE.md"] = notices;
  files["element.html"] = markup + "\n";
  const title = escapeHtml(component.name);
  files["index.html"] = `<!doctype html>\n<html lang="en" data-density="comfortable" style="background:var(--color-surface-canvas)"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} · j3w1</title><link rel="stylesheet" href="./tokens.css"><link rel="stylesheet" href="./component.css"></head><body>${markup}<script type="module" src="./runtime/register/${component.id}.js"></script></body></html>\n`;
  files["README.md"] = `# ${component.name}\n\nComplete copy distribution from @j3w1/ui ${version}.\n\nServe this directory over HTTP and open index.html. For an existing app, copy\nelement.html where needed, load tokens.css and component.css, and import\nruntime/register/${component.id}.js once. Keep the complete runtime directory.\nUse a unique ID prefix for each copied instance, updating for/ARIA references\ntogether. Native controls retain native form behavior. No site or backend is\nrequired. See LICENSE.md for code and specimen attribution.\n\nCanonical contract: ${component.contract}\n\nPackage alternative: import '@j3w1/ui/register/${component.id}';\nLoad '@j3w1/ui/tokens.css' and '@j3w1/ui/styles/${component.id}.css'.\n\nThe package classes have refresh() for deliberate dynamic child replacement.\nProperties change state; native input/change and documented j3w1 events report\ninteraction. Keep application persistence and authorization in the host app.\n`;
  files["manifest.json"] = stableJson({ schemaVersion: 1, component: component.id, version, contract: component.contract, dependencies: [...runtime.keys()], files: Object.fromEntries(Object.entries(files).map(([name, text]) => [name, sha256(text)])) });
  const destination = path.join(root, "copy", component.id);
  for (const [name, text] of Object.entries(files)) await writeFileEnsured(path.join(destination, name), text);
  return { directory: `copy/${component.id}/`, files: Object.fromEntries(Object.entries(files).map(([name, text]) => [name, sha256(text)])) };
}
