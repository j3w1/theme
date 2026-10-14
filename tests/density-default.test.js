import assert from "node:assert/strict";
import test from "node:test";
import postcss from "postcss";
import { readText } from "../scripts/lib/fs.mjs";

/* D-038: compact is the default density. The density variables must carry the
   compact values where no data-density is set, and comfortable stays opt-in. */

const declarations = (css, ...selectors) => {
  const rule = postcss.parse(css).nodes.find((node) => node.type === "rule" && selectors.every((s) => node.selectors.includes(s)));
  assert.ok(rule, `no rule for ${selectors.join(", ")}`);
  return Object.fromEntries(rule.nodes.filter((node) => node.type === "decl").map((decl) => [decl.prop, decl.value]));
};

const COMPACT = { "--density-control-height": "24px", "--density-row-height": "28px", "--density-control-padding-x": "8px", "--density-icon": "12px", "--density-gap": "2px" };
const COMFORTABLE = { "--density-control-height": "32px", "--density-row-height": "36px", "--density-control-padding-x": "12px", "--density-icon": "16px", "--density-gap": "4px" };

for (const file of ["site/src/styles/tokens.generated.css", "packages/ui/dist/tokens.css"]) {
  test(`${file} defines compact on :root and keeps comfortable opt-in`, async () => {
    const css = await readText(file);
    const compact = declarations(css, ":root", '[data-density="compact"]');
    for (const [prop, value] of Object.entries(COMPACT)) assert.equal(compact[prop], value, prop);
    for (const [prop, value] of Object.entries(COMFORTABLE)) assert.equal(declarations(css, '[data-density="comfortable"]')[prop], value, prop);
  });
}

test("recipe wrappers without data-density are compact", async () => {
  const css = await readText("exports/recipes/button/tokens.css");
  const rule = postcss.parse(css).nodes.find((node) => node.type === "rule" && node.selectors.includes(".j3w1-recipe") && node.selectors.includes('.j3w1-recipe[data-density="compact"]'));
  assert.ok(rule, "the compact density rule also applies to the bare .j3w1-recipe wrapper");
});
