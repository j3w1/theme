import { readText, sha256 } from "./fs.mjs";
import { splitFrontmatter, splitVariants } from "./spec.mjs";
import { componentSchema } from "../../schemas/component.mjs";
import { z } from "zod";
import { workbenchBindingsSchema } from "../../schemas/workbench.mjs";
import { parseFragment } from "parse5";
import { walkMarkup, hasClass } from "./markup.mjs";
import { PREVIEW_IDS } from "../../schemas/playground.mjs";

const measurementMaps = {
  button: { part: "root", selector: ".button", properties: { minHeight: "density.$density.control-height", paddingInlineStart: "density.$density.control-padding-x", borderRadius: "radius.none" } },
  "text-field": { part: "input", selector: ".text-field-input", properties: { minHeight: "density.$density.control-height", paddingInlineStart: "density.$density.control-padding-x" } },
  checkbox: { part: "input", selector: ".checkbox-input", properties: { width: "icon.size.md", height: "icon.size.md", borderRadius: "radius.none" } },
  tabs: { part: "tab", selector: ".tabs-tab", properties: { minHeight: "density.$density.control-height", paddingInlineStart: "density.$density.control-padding-x" } },
  dialog: { part: "root", selector: ".dialog", properties: { paddingTop: "space.16", borderRadius: "radius.none" } },
};
export const workbenchData = async (id, read = readText) => {
  if (!PREVIEW_IDS.includes(id)) throw new Error("Unknown workbench component");
  const readJson = async (file) => JSON.parse(await read(file));
  const file = `spec/components/${id}.md`;
  const demoFile = `spec/components/${id}.demo.html`;
  const component = { ...componentSchema(z).parse(splitFrontmatter(await read(file), file).data), file, demoFile, demo: await read(demoFile) };
  const manifest = await readJson("theme.json");
  const resolved = await readJson("exports/tokens.resolved.json");
  const usage = await readJson("exports/token-usage.json");
  const bindings = workbenchBindingsSchema(z).parse(await readJson("site/workbench.json"))[id];
  const fragments = Object.fromEntries(splitVariants(component.demo));
  for (const [variant, html] of Object.entries(fragments)) for (const selector of [bindings.label, bindings.help, bindings.motion].filter(Boolean)) {
    let found = false;
    walkMarkup(parseFragment(html), (node) => { if (hasClass(node, selector.slice(1))) found = true; });
    if (!found) throw new Error(`Workbench binding ${selector} is absent from ${id}/${variant}`);
  }
  if (bindings.motion && !component.states.includes(bindings.motionState)) throw new Error("Motion endpoint is not a declared state");
  const css = await read(`site/src/styles/components/${id}.css`);
  const transition = bindings.motion ? css.match(/transition:\s*(background-color)\s+var\(--(motion-duration-[a-z-]+)\)\s*;/) : null;
  if (bindings.motion && !transition) throw new Error("Mapped motion must use a maintained background transition and timing token");
  const motion = transition ? { property: transition[1], role: transition[2].replaceAll("-", "."), easing: "ease (CSS default)", endpoints: ["default", bindings.motionState] } : null;
  const contract = Object.fromEntries(["id", "name", "variants", "states", "sizes", "tokens", "stateTokens", "anatomy", "contrast"].map((key) => [key, component[key]]));
  const parts = component.anatomy.map((item) => ({ ...item, selector: item.part.split(/\s*\/\s*/).map((part) => {
    if (part === "root") return id === "text-field" ? ".text-field-root" : `.${id}`;
    if (id === "text-field" && ["clear", "reveal"].includes(part)) return ".text-field-action";
    if (part === "indicator") return id === "tabs" ? '.tabs-tab[aria-selected="true"]' : '.sidebar-nav-current';
    return `.${id}-${part}`;
  }).join(", ") }));
  const paths = new Set([...Object.values(component.tokens), ...component.contrast.flatMap((pair) => [pair.fg, pair.bg]), "color.surface.canvas", "color.surface.default", "color.surface.input", "color.surface.overlay"]);
  if (motion) paths.add(motion.role);
  for (const path of Object.values(measurementMaps[id]?.properties ?? {})) for (const density of component.sizes) paths.add(path.replace("$density", density));
  const tokens = Object.fromEntries(Object.entries(resolved.profiles).map(([profile, values]) => [profile, Object.fromEntries([...paths].map((path) => {
    const value = values.tokens[path];
    if (!value) throw new Error(`Missing workbench role ${path}`);
    return [path, { css: value.css, type: value.type, value: value.value, eligibility: value.eligibility, uses: (usage.profiles[profile].tokens[path]?.uses ?? []).filter((use) => use.component === id).map(({ kind, part, state, variant, surface }) => ({ kind, part, state, variant, surface })) }];
  }))]));
  const files = [component.file, component.demoFile, `site/src/styles/components/${id}.css`, "site/workbench.json", "schemas/playground.mjs", "scripts/lib/workbench-config.mjs", "scripts/lib/workbench-data.mjs", "scripts/lib/specimen-markup.mjs", "scripts/lib/markup.mjs", "scripts/lib/specimen-fixtures.mjs", "site/src/scripts/workbench.ts", "site/src/scripts/preview.ts", "site/src/scripts/specimen-behavior.ts", "site/src/styles/workbench.css", "site/src/pages/preview/[id].astro", "site/src/pages/workbench/[id].astro", "site/src/components/Workbench.astro"];
  files.push("scripts/lib/workbench-contrast.mjs", "scripts/lib/contrast.mjs", "scripts/lib/hex-literals.mjs");
  files.push("theme.json", "site/src/lib/workbench.ts", "schemas/workbench.mjs", "scripts/lib/issue-draft.mjs", "site/src/scripts/issue-draft.ts", "site/src/components/IssueDraft.astro");
  const sources = Object.fromEntries(await Promise.all(files.map(async (file) => [file, sha256(await read(file))])));
  return { themeVersion: manifest.version, siteUrl: manifest.site.url, contract, profiles: manifest.profiles.map(({ id, displayName, default: isDefault, status }) => ({ id, displayName, default: isDefault, status })), bindings, motion, parts, measurements: measurementMaps[id] ?? null, tokens, sourceDigest: sha256(JSON.stringify({ sources, tokens })), revision: /^[a-f0-9]{40}$/.test(process.env.GITHUB_SHA ?? "") ? process.env.GITHUB_SHA : null, fragments };
};
