import { parseFragment } from "parse5";
import postcss from "postcss";
import valueParser from "postcss-value-parser";
import { z } from "zod";
import { readJson, sha256, stableJson } from "./fs.mjs";
import { walkMarkup } from "./markup.mjs";
import { escapeHtml } from "./hex-literals.mjs";
import { splitVariants } from "./spec.mjs";
import { renderSpecimenMarkup, stateAttributes } from "./specimen-markup.mjs";
import { pinnedKitSource } from "./task-kit-source.mjs";
import { readRelease, compareReleases, comparisonMarkdown } from "./release-comparison.mjs";
import { releaseCatalogueSchema } from "../../schemas/release-comparison.mjs";
import { PREVIEW_IDS } from "../../schemas/playground.mjs";

export const assertHistoricalMarkup = (html) => {
  const tree = parseFragment(html);
  walkMarkup(tree, (node) => {
    if (["script", "style", "link", "meta", "base", "iframe", "object", "embed", "template", "image", "use", "foreignObject", "animate", "set"].includes(node.tagName)) throw new Error("Unsupported active historical markup");
    for (const attr of node.attrs ?? []) {
      if (/^on/i.test(attr.name) || ["src", "srcset", "srcdoc", "action", "formaction", "poster", "style", "ping"].includes(attr.name) || (attr.name === "href" && !attr.value.startsWith("#"))) throw new Error("Unsupported historical resource or behavior attribute");
    }
  });
  return html;
};
export const assertHistoricalCss = (css) => {
  if (/<\/style/i.test(css)) throw new Error("Unsupported historical style boundary");
  const tree = postcss.parse(css);
  tree.walkAtRules((rule) => { if (!["media", "supports", "container", "layer", "font-face", "keyframes"].includes(rule.name.toLowerCase())) throw new Error(`Unsupported historical CSS rule: ${rule.name}`); });
  tree.walkDecls((decl) => {
    if (["behavior", "-moz-binding"].includes(decl.prop.toLowerCase())) throw new Error("Unsupported historical CSS behavior");
    valueParser(decl.value).walk((node) => { if (node.type === "function" && ["url", "expression", "image-set", "-webkit-image-set"].includes(node.value.toLowerCase())) throw new Error("Historical CSS cannot fetch resources or execute expressions"); });
  });
  return css;
};

export const renderReleaseSpecimens = async (snapshot) => {
  const files = {}, cases = [], unavailable = [];
  if (!snapshot.supported) return { files, cases, unavailable: ["Unsupported historical contract."] };
  const cssFiles = ["site/src/styles/tokens.generated.css", "site/src/styles/base.css", "site/src/styles/site.css", ...Object.keys(snapshot.appearance).filter((f) => /^site\/src\/styles\/components\/.*\.css$/.test(f)).sort()];
  const css = [];
  for (const file of cssFiles) {
    const content = await snapshot.read(file);
    if (content === null) return { files, cases, unavailable: [`Missing historical appearance input: ${file}`] };
    css.push(assertHistoricalCss(content));
  }
  // The shared presentation wrapper freezes only animation/interaction; token
  // values, density, type size and component geometry remain historical inputs.
  files["style.css"] = `${css.join("\n")}\n*, *::before, *::after { animation: none !important; transition: none !important; }\n`;
  for (const id of PREVIEW_IDS) {
    const contract = snapshot.components[id];
    const demo = await snapshot.read(`spec/components/${id}.demo.html`);
    if (!contract || demo === null) { unavailable.push(`${id}: historical contract/demo unavailable.`); continue; }
    const variants = splitVariants(demo);
    for (const variant of contract.variants) for (const state of contract.states) {
      if (!/^[a-z][a-z0-9-]*$/.test(variant.id) || !/^[a-z][a-z0-9-]*(?:\+[a-z][a-z0-9-]*)*$/.test(state)) throw new Error("Unsupported historical variant/state identifier");
      const fragment = variants.get(variant.id);
      if (!fragment) { unavailable.push(`${id}/${variant.id}/${state}: no historical variant fragment.`); continue; }
      const name = `${id}/${variant.id}/${state.replaceAll("+", "_")}.html`;
      const markup = renderSpecimenMarkup(assertHistoricalMarkup(fragment), `release-${id}-${variant.id}`, { state, inert: true });
      const label = `${id}, ${variant.id}, ${state}`;
      const profile = escapeHtml(snapshot.metadata.profile);
      files[name] = `<!doctype html><html lang="en" dir="ltr" data-profile="${profile}" data-demo-profile="${profile}" data-density="comfortable"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self'; form-action 'none'; base-uri 'none'"><title>${escapeHtml(label)} historical specimen</title><link rel="stylesheet" href="../../style.css"></head><body><main><h1>${escapeHtml(label)}</h1><p>Reconstructed static specimen. ${profile} (${escapeHtml(snapshot.metadata.profileStatus)}). Forced visual state; no historical JavaScript is executed.</p><div data-release-specimen ${stateAttributes(state)} inert>${markup}</div></main></body></html>\n`;
      cases.push({ component: id, variant: variant.id, state, path: name, fixtureDigest: sha256(fragment), artifactDigest: sha256(files[name]), styleDigest: sha256(files["style.css"]) });
    }
  }
  return { files, cases, unavailable };
};

let published;
export const publishedComparisons = () => published ??= (async () => {
  const catalogue = releaseCatalogueSchema(z).parse(await readJson("site/releases.json"));
  const snapshots = [];
  for (const pin of catalogue.revisions) {
    const original = await pinnedKitSource(pin.ref);
    const names = await original.list(), cache = new Map();
    const source = { ...original, list: async () => names, read: (file) => { if (!cache.has(file)) cache.set(file, original.read(file)); return cache.get(file); } };
    for (const profile of catalogue.profiles) {
      const snapshot = await readRelease(pin.ref, profile, { source, expectedRevision: pin.revision });
      snapshots.push({ pin, profile, snapshot, specimens: await renderReleaseSpecimens(snapshot) });
    }
  }
  const comparisons = [];
  for (const from of snapshots) for (const to of snapshots) if (from.profile === to.profile) comparisons.push({ from, to, path: `${from.pin.id}/${to.pin.id}/${from.profile}`, report: compareReleases(from.snapshot, to.snapshot) });
  return { catalogue, snapshots, comparisons };
})();

export const comparisonFiles = (report, fromSpecimens, toSpecimens) => ({
  "comparison.json": stableJson(report), "comparison.md": comparisonMarkdown(report),
  "specimens.json": stableJson({ schemaVersion: 1, rendererVersion: report.rendererVersion, settings: report.visual.settings, from: { revision: report.from.revision, ...fromSpecimens, files: undefined }, to: { revision: report.to.revision, ...toSpecimens, files: undefined } }),
  ...Object.fromEntries(Object.entries(fromSpecimens.files).map(([name, data]) => [`before/${name}`, data])),
  ...Object.fromEntries(Object.entries(toSpecimens.files).map(([name, data]) => [`after/${name}`, data])),
});
