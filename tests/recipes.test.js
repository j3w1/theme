import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import { readJson, readText, sha256 } from "../scripts/lib/fs.mjs";
import { loadProfile, resolveTokens } from "../scripts/lib/tokens.mjs";
import { instantiateRecipe } from "../scripts/lib/recipe-markup.mjs";
import { scopeRecipeCss, recipeTokenCss } from "../scripts/lib/recipe-css.mjs";
import { recipeDependenciesSchema } from "../schemas/recipe.mjs";

test("recipe manifests identify maintained dependencies and byte-identical outputs", async () => {
  const declarations = recipeDependenciesSchema(z).parse(await readJson("site/recipes.json"));
  for (const recipe of declarations.recipes) {
    const root = `exports/recipes/${recipe.id}/`;
    const metadata = await readJson(root + "manifest.json");
    for (const [file, digest] of Object.entries(metadata.source.files)) assert.equal(sha256(await readText(file)), digest, file);
    for (const [file, digest] of Object.entries(metadata.files)) assert.equal(sha256(await readText(root + file)), digest, file);
    const html = await readText(root + "example.html");
    assert.doesNotMatch(html, /data-state-|data-token=|hex-swatch|state-label|dialog-trap-note|<script|<link/);
    assert.match(html, /CC BY 4\.0/);
    assert.match(html, /Permission is hereby granted/);
    assert.deepEqual(metadata.dependencies.behavior, []);
    for (const policy of Object.values(metadata.eligibility)) assert.ok(["use", "use-and-report"].includes(policy.action));
  }
  assert.throws(() => recipeDependenciesSchema(z).parse({ ...declarations, recipes: declarations.recipes.map((r) => ({ ...r, behavior: ["missing.js"] })) }));
});

test("instances preserve every local relationship and reject ambiguous markup", () => {
  const source = '<label for="name">Name</label><input id="name" aria-describedby="help error"><p id="help">Help</p><p id="error">Error</p>';
  const first = instantiateRecipe(source, "first");
  const second = instantiateRecipe(source, "second");
  assert.match(first, /for="first-name"/);
  assert.match(first, /aria-describedby="first-help first-error"/);
  const ids = [...(first + second).matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, 6);
  assert.throws(() => instantiateRecipe('<label for="absent">Missing</label>', "first"), /Unresolved/);
  assert.throws(() => instantiateRecipe('<p id="same"></p><p id="same"></p>', "first"), /duplicate/);
  assert.throws(() => instantiateRecipe(source, 'x" onclick="bad'), /prefix/);
  assert.throws(() => instantiateRecipe('<button onclick="bad()">x</button>', "first"), /behavior/);
});

test("CSS scoping preserves nested selector lists and rem geometry without rewriting strings", () => {
  const scoped = scopeRecipeCss('.field:has(input, textarea), [data-state-hover] .field { width: 28rem; content: "28rem"; } @media (hover: none) { .field:hover { opacity: 1; } }');
  assert.match(scoped, /\.j3w1-recipe \.field:has\(input, textarea\)/);
  assert.match(scoped, /calc\(var\(--font-size-ui-md\) \* 28\)/);
  assert.match(scoped, /content: "28rem"/);
  assert.doesNotMatch(scoped, /data-state/);
  assert.match(scoped, /\.j3w1-recipe \.field:hover/);
  assert.throws(() => scopeRecipeCss('@import "missing.css";'), /dependency/);
  assert.throws(() => scopeRecipeCss('.x { background: url(asset.png); }'), /assets/);
});

test("token closure includes aliases and both densities, rejecting missing and blocked dependencies", async () => {
  const manifest = await readJson("theme.json");
  const profile = manifest.profiles.find((p) => p.default);
  const tokens = resolveTokens(await loadProfile(profile.tokens));
  const result = recipeTokenCss(['.x { color: var(--color-text-default); height: var(--density-control-height); }'], tokens, profile);
  assert.ok(result.paths.includes("density.compact.control-height"));
  assert.ok(result.paths.includes("density.comfortable.control-height"));
  for (const dependency of tokens.get("color.text.default").chain) assert.ok(result.paths.includes(dependency));
  assert.throws(() => recipeTokenCss(['.x { color: var(--missing); }'], tokens, profile), /Missing/);
  assert.throws(() => recipeTokenCss(['.x { color: var(--color-text-default); }'], tokens, { ...profile, status: "proposed" }), /blocked/);
});
