import { z } from "zod";
import { recipeDependenciesSchema } from "../../schemas/recipe.mjs";
import { readJson, readText, sha256, stableJson, writeOrCheck, pruneOrphans } from "./fs.mjs";
import { splitVariants } from "./spec.mjs";
import { instantiateRecipe } from "./recipe-markup.mjs";
import { scopeRecipeCss, recipeTokenCss } from "./recipe-css.mjs";

const attribution = "Markup adapted from j3w1 UI Theme Spec, https://github.com/j3w1/theme, CC BY 4.0: https://creativecommons.org/licenses/by/4.0/. Changes: scoped instance IDs and documentation-only content removed. CSS and generator: MIT; see LICENSE.md.";
export const recipeGenerator = {
  name: "standalone recipes",
  async run({ manifest, profiles, defaultId, components, check }) {
    const dependencies = recipeDependenciesSchema(z).parse(await readJson("site/recipes.json"));
    const changed = [], files = [], index = [];
    const emit = async (file, content) => { files.push(file); if (await writeOrCheck(file, content, { check })) changed.push(file); };
    const license = await readText("LICENSE.md");
    const mit = license.slice(license.indexOf("Copyright (c)"), license.indexOf("## CC BY")).trim();
    const credit = `j3w1 theme ${manifest.version}. ${attribution}`;
    const cssNotice = `/* j3w1 theme ${manifest.version} — MIT\n${mit}\n*/\n`;
    for (const recipe of dependencies.recipes) {
      const component = components.find((c) => c.id === recipe.id);
      if (!component || recipe.markup !== component.demoFile || recipe.states.some((s) => !component.states.includes(s))) throw new Error(`Recipe ${recipe.id} disagrees with its component contract`);
      const sources = {};
      for (const file of ["theme.json", "site/recipes.json", "scripts/lib/recipe-generator.mjs", "scripts/lib/recipe-css.mjs", "scripts/lib/recipe-markup.mjs", component.file, recipe.markup, recipe.foundation, ...recipe.styles, "LICENSE.md", ...manifest.profiles.find((p) => p.id === defaultId).tokens]) sources[file] = sha256(await readText(file));
      const fragment = splitVariants(await readText(recipe.markup)).get(recipe.variant);
      if (!fragment) throw new Error(`Missing recipe variant: ${recipe.id}/${recipe.variant}`);
      const markup = `<!-- ${credit} -->\n${instantiateRecipe(fragment, "recipe", recipe)}`;
      const foundation = cssNotice + scopeRecipeCss(await readText(recipe.foundation));
      const componentCss = cssNotice + (await Promise.all(recipe.styles.map(async (file) => scopeRecipeCss(await readText(file), recipe)))).join("\n");
      const tokenBundle = recipeTokenCss([foundation, componentCss], profiles.get(defaultId), manifest.profiles.find((p) => p.id === defaultId));
      const tokenCss = cssNotice + tokenBundle.css;
      const instance = (prefix) => `<div class="j3w1-recipe" data-density="comfortable">\n${instantiateRecipe(markup, prefix)}</div>`;
      const html = (prefixes) => `<!doctype html>\n<!-- ${credit} -->\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>j3w1 ${recipe.id} reference</title>\n<style>\n${tokenCss}\n${foundation}\n${componentCss}</style>\n</head><body>\n${prefixes.map(instance).join("\n")}\n</body></html>\n`;
      const outputs = {
        "markup.html": `<!-- ${credit} -->\n${instance("example")}\n`,
        "template.html": markup,
        "tokens.css": tokenCss,
        "foundation.css": foundation,
        "component.css": componentCss,
        "example.html": html(["example"]),
        "two-instances.html": html(["first", "second"]),
        "LICENSE.md": `Recipe distribution for j3w1 theme ${manifest.version}. Source license text follows unchanged.\n\n${license}`,
      };
      const metadata = {
        schemaVersion: 1, theme: manifest.name, version: manifest.version, component: recipe.id, variant: recipe.variant, profile: defaultId,
        source: { algorithm: "sha256 over LF file bytes, base64", files: sources, digest: sha256(stableJson(sources)), revisionPolicy: "Resolve these paths at the same pinned commit as this manifest. The hosted source viewer identifies its supplying commit; generated source files contain content digests, never a floating revision claim." },
        dependencies: { markup: recipe.markup, styles: recipe.styles, foundation: recipe.foundation, behavior: recipe.behavior },
        tokens: tokenBundle.paths, roles: tokenBundle.roles, eligibility: tokenBundle.eligibility,
        states: recipe.states, limitations: recipe.limitations,
        transformations: ["Use the default maintained demo fragment before documentation rendering.", "Remove forced-state selectors and documentation notes; retain actual native pseudo-classes.", "Scope CSS to .j3w1-recipe; rewrite IDs and ID references together for each instance.", "Convert rem lengths to multiples of font.size.ui-md, preserving the canonical 13px root geometry without changing the host root."],
        licenses: { markup: "CC-BY-4.0", css: "MIT", notice: credit },
        files: Object.fromEntries(Object.entries(outputs).map(([name, text]) => [name, sha256(text)])),
      };
      const readme = `# ${recipe.id} standalone reference\n\n${credit}\n\nVersion ${manifest.version}; profile ${defaultId}; source digest ${metadata.source.digest}. Pin the supplying commit and verify manifest source/file digests; the version alone does not identify a revision.\n\nOpen example.html directly, without Astro, network assets or a build step. two-instances.html demonstrates independent IDs. For integration, include tokens.css, foundation.css and component.css in that order, then markup.html. Keep .j3w1-recipe and data-density on the wrapper. The source viewer can make a fresh instance prefix; use a unique prefix for every copy and rewrite all ID references together.\n\n## Behavior and limits\n\n${recipe.limitations.map((s) => `- ${s}`).join("\n")}\n\nSupported visual states: ${recipe.states.join(", ")}. No JavaScript behavior module is supplied. No font binaries or third-party assets are bundled.\n\n## Transformations\n\n${metadata.transformations.map((s) => `- ${s}`).join("\n")}\n\n## Policy\n\nPending roles retain their use-and-report decision IDs in manifest.json. Alias dependencies, including inspection-only primitives, support the role values; they are not recommendations to consume primitives directly.\n`;
      metadata.files["README.md"] = sha256(readme);
      for (const [name, text] of Object.entries({ ...outputs, "README.md": readme, "manifest.json": stableJson(metadata) })) await emit(`exports/recipes/${recipe.id}/${name}`, text);
      index.push({ id: recipe.id, variant: recipe.variant, manifest: `exports/recipes/${recipe.id}/manifest.json`, sourceDigest: metadata.source.digest, limitations: recipe.limitations });
    }
    await emit("exports/recipes/index.json", stableJson({ schemaVersion: 1, theme: manifest.name, version: manifest.version, recipes: index }));
    return { files, changed, orphans: await pruneOrphans("exports/recipes", files, { check }), note: `${index.length} maintained references` };
  },
};
