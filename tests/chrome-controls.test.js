/* One control language (docs/ui-architecture.md, "Site chrome"; button.md):
   only component stylesheets give a button its look, and the chrome takes
   its spacing and type from tokens. The browser half of this guard is
   tests/browser/chrome-controls.spec.js. */

import assert from "node:assert/strict";
import test from "node:test";
import postcss from "postcss";
import { listFiles, readText } from "../scripts/lib/fs.mjs";

/* Chrome stylesheets: the site's own stylesheets and the demo app's. Not
   chrome: component stylesheets and their partials, the generated tokens,
   and the two component-level sources the package builds controls.css and
   the recipes from (themed-controls.css, recipe-foundation.css). */
const COMPONENT_LEVEL = new Set(["tokens.generated.css", "themed-controls.css", "recipe-foundation.css"]);
const chrome = [
  ...(await listFiles("site/src/styles", { filter: (f) => /^site\/src\/styles\/[^/]+\.css$/.test(f) && !COMPONENT_LEVEL.has(f.split("/").pop()) })),
  "apps/demo/src/style.css",
];

/* The last compound of a selector targets a button: the element, a class
   named like one (.button-*, .btn, .copy-button), a button input type, or
   the file input's button. :is() and :where() arguments count; :not() and
   :has() arguments do not. */
const BUTTON_CLASS = /^(btn(-[\w-]+)?|button(-[\w-]+)?|[\w-]+-button)$/;
const splitTop = (list) => {
  const parts = [];
  let depth = 0, start = 0;
  for (let i = 0; i < list.length; i++) {
    if ("([".includes(list[i])) depth++;
    else if (")]".includes(list[i])) depth--;
    else if (list[i] === "," && depth === 0) { parts.push(list.slice(start, i)); start = i + 1; }
  }
  return [...parts, list.slice(start)].map((part) => part.trim()).filter(Boolean);
};
const lastCompound = (selector) => {
  let depth = 0, start = 0;
  for (let i = 0; i < selector.length; i++) {
    if ("([".includes(selector[i])) depth++;
    else if (")]".includes(selector[i])) depth--;
    else if (depth === 0 && /[\s>+~]/.test(selector[i])) start = i + 1;
  }
  return selector.slice(start);
};
const targetsButton = (selector) => {
  let hit = false;
  const compound = lastCompound(selector.trim())
    .replace(/:(is|where|matches)\(((?:[^()]|\([^()]*\))*)\)/g, (_, __, inner) => { if (splitTop(inner).some(targetsButton)) hit = true; return ""; })
    .replace(/:(not|has)\((?:[^()]|\([^()]*\))*\)/g, "");
  if (/^button(?![\w-])/i.test(compound)) hit = true;
  for (const [, name] of compound.matchAll(/\.([\w-]+)/g)) if (BUTTON_CLASS.test(name)) hit = true;
  if (/\[type=["']?(button|submit|reset)["']?\]/.test(compound)) hit = true;
  if (/::(-webkit-)?file-(selector|upload)-button/.test(compound)) hit = true;
  return hit;
};

const LOOK = /^(background|border|padding)(-|$)/;
const RESET = new Set(["font", "color", "border-radius"]);

/* Reviewed exceptions, each with its reason and its exact selectors. */
const EXCEPTIONS = {
  /* The reference page's own chrome until it moves to SiteLayout; its
     components still render .btn and .copy-button. Remove with them. */
  "site/src/styles/site.css": { selectors: new Set([".btn", ".btn:hover", ".btn:active", ".btn-quiet", ".btn-quiet:hover", ".copy-button", ".copy-button:hover", '.copy-button[data-copied="true"]']) },
  /* The verification report is a standalone generated page that loads no
     component CSS; its reset button may only mirror the secondary tone. */
  "site/src/styles/verification.css": { selectors: new Set(["button", "button:hover", "button:active"]), values: /^var\(--(color-action-secondary-[\w-]+|color-border-active|density-compact-[\w-]+|border-width-default|radius-none)\)$/ },
};

const rulesOf = async (file) => {
  const rules = [];
  postcss.parse(await readText(file)).walkRules((rule) => {
    if (rule.parent?.type === "atrule" && /keyframes/.test(rule.parent.name)) return;
    rules.push(rule);
  });
  return rules;
};

test("no chrome stylesheet declares a button look; base.css only resets", async () => {
  const problems = [];
  for (const file of chrome) {
    for (const rule of await rulesOf(file)) {
      for (const selector of rule.selectors) {
        if (!targetsButton(selector)) continue;
        const exception = EXCEPTIONS[file];
        const excepted = exception?.selectors.has(selector.trim());
        for (const decl of rule.nodes.filter((node) => node.type === "decl")) {
          if (excepted && exception.values && LOOK.test(decl.prop)) {
            for (const [variable] of decl.value.matchAll(/var\([^)]*\)/g)) if (!exception.values.test(variable)) problems.push(`${file}: ${selector.trim()} { ${decl.prop}: ${decl.value} } is not the secondary tone`);
            continue;
          }
          if (excepted) continue;
          const allowed = !LOOK.test(decl.prop) || (file.endsWith("/base.css") && RESET.has(decl.prop));
          if (!allowed) problems.push(`${file}: ${selector.trim()} { ${decl.prop}: ${decl.value} }`);
        }
      }
    }
  }
  assert.deepEqual(problems, [], "button looks belong in site/src/styles/components (or the shared partial they import)");
});

test("the reference-only exception stays on the reference page", async () => {
  const importers = (await listFiles("site/src", { filter: (f) => /\.(astro|ts)$/.test(f) }));
  const users = [];
  for (const file of importers) if (/styles\/site\.css["']/.test(await readText(file))) users.push(file);
  assert.deepEqual(users.sort(), ["site/src/layouts/SpecLayout.astro", "site/src/pages/preview/[id].astro"]);
});

test("component partials are imported only by component stylesheets", async () => {
  const partials = await listFiles("site/src/styles/partials", { filter: (f) => f.endsWith(".css") });
  assert.ok(partials.length > 0);
  const sources = await listFiles("site/src", { filter: (f) => /\.(css|astro|ts)$/.test(f) && !f.includes("/partials/") });
  for (const partial of partials) {
    const name = partial.split("/").pop();
    for (const file of sources) {
      if (!(await readText(file)).includes(`partials/${name}`)) continue;
      assert.match(file, /^site\/src\/styles\/components\//, `${file} imports ${partial}`);
    }
  }
});

/* Spacing and type come from --space-* and the font tokens; 0 and 1px
   (a border, a hairline) are the only literal lengths. */
const SPACING_AND_TYPE = /^(margin|padding|inset)(-.+)?$|^(gap|row-gap|column-gap|top|right|bottom|left|font|font-size|line-height)$/;
const LITERAL = /(?<![\w.-])(\d*\.?\d+)px\b/g;

test("chrome stylesheets take spacing and font sizes from tokens", async () => {
  const problems = [];
  for (const file of chrome) {
    postcss.parse(await readText(file)).walkDecls((decl) => {
      if (!SPACING_AND_TYPE.test(decl.prop)) return;
      for (const [, number] of decl.value.matchAll(LITERAL)) {
        if (Number(number) !== 0 && Number(number) !== 1) problems.push(`${file}: ${decl.parent.selector} { ${decl.prop}: ${decl.value} }`);
      }
    });
  }
  assert.deepEqual(problems, []);
});

test("the guard recognises button selectors", () => {
  for (const selector of ["button", ".btn", ".btn-quiet:hover", ".copy-button", ".x :is(input, button)", "[type=submit]", "input::file-selector-button", ".button-secondary"]) assert.ok(targetsButton(selector), selector);
  for (const selector of [".button-group .label", "a", ".site-actions", "button .icon", ".toolbar"]) assert.equal(targetsButton(selector), false, selector);
});
