import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import { readJson, readText } from "../scripts/lib/fs.mjs";
import { loadResolvedProfile } from "../scripts/lib/tokens.mjs";
import { loadComponents } from "../scripts/lib/spec.mjs";
import { buildUsageIndex } from "../scripts/lib/usage.mjs";
import { queryUsage, queryIndexOf } from "../scripts/lib/usage-query.mjs";
import { usageSchema, portMappingSchema } from "../schemas/usage.mjs";
const manifest = await readJson("theme.json");
const profiles = new Map(await Promise.all(manifest.profiles.map(async (p) => [p.id, await loadResolvedProfile(p.tokens)])));
const components = await loadComponents();
const index = await readJson("exports/token-usage.json");

test("the browser query projection returns the same documented results", () => {
  const projected = queryIndexOf(index);
  const cases = [ {}, { query: "input boundary" }, { query: "#e53935" }, { eligible: true },
    { component: "text-field", state: "default", part: "border", surface: "color.surface.input", eligible: true },
    ...components.map((c) => ({ component: c.id, state: "default" })),
    ...Object.keys(index.profiles).flatMap((profile) => [ { profile, status: "heritage" }, { profile, eligible: true } ]),
  ];
  for (const options of cases) assert.deepEqual(queryUsage(projected, options).map((t) => t.path), queryUsage(index, options).map((t) => t.path));
});

test("semantic queries require one documented edge and preserve eligibility", () => {
  const results = queryUsage(index, { component: "text-field", state: "default", part: "border" });
  assert.deepEqual(results.map((t) => t.path), ["color.border.control"]);
  assert.equal(results[0].eligibility.action, "use-and-report");
  assert.equal(queryUsage(index, { component: "text-field", part: "root.border", state: "default" }).length, 0);
  assert.equal(queryUsage(index, { profile: "extended", eligible: true }).length, 0);
  assert.ok(queryUsage(index, { query: "#e53935" }).length > 1);
  assert.equal(queryUsage(index, { query: "--color-border-control" })[0].path, "color.border.control");
  assert.ok(!queryUsage(index, { query: "input boundary" }).some((t) => t.path === "color.border.divider"));
});

test("a controlled mapping change updates reverse usage without merging equal values", () => {
  const changed = structuredClone(components);
  changed.find((c) => c.id === "text-field").tokens["root.border"] = "color.border.active";
  const next = buildUsageIndex({ manifest, profiles, components: changed });
  assert.equal(queryUsage(next, { component: "text-field", part: "root.border" })[0].path, "color.border.active");
  assert.notDeepEqual(next.profiles.default.tokens["color.border.active"].uses, next.profiles.default.tokens["color.border.overlay"].uses);
  assert.equal(next.profiles.default.tokens["color.border.active"].css, next.profiles.default.tokens["color.border.overlay"].css);
});

test("every indexed source resolves to an actual source line and the schema is closed", async () => {
  usageSchema(z).parse(index);
  const cache = new Map();
  for (const p of Object.values(index.profiles)) for (const token of Object.values(p.tokens)) {
    for (const source of [token.source, ...token.uses.map((u) => u.source), ...token.contrast.map((c) => c.source)]) {
      if (!cache.has(source.file)) cache.set(source.file, (await readText(source.file)).split("\n"));
      assert.ok(source.line > 0 && source.line <= cache.get(source.file).length, JSON.stringify(source));
    }
  }
  const source = index.profiles.default.tokens["color.border.control"].uses.find((u) => u.component === "text-field" && u.part === "root.border").source;
  assert.match(cache.get(source.file)[source.line - 1], /root.border: color.border.control/);
  assert.throws(() => usageSchema(z).parse({ ...index, guessedConsumers: [] }));
});

test("ports are explicit, complete and never fabricated", () => {
  assert.equal(Object.values(index.profiles.default.tokens).flatMap((t) => t.uses).filter((u) => u.kind === "port").length, 0);
  const mapping = { schemaVersion: 1, mappings: { "color.border.control": ["InputBorder"] },
    unmapped: Object.fromEntries([...profiles.get("default").keys()].filter((p) => p !== "color.border.control").map((p) => [p, "Outside fixture scope"])) };
  portMappingSchema(z).parse(mapping);
  const port = { id: "fixture", profile: "default", mapping };
  const next = buildUsageIndex({ manifest, profiles, components: [], ports: [port] });
  assert.equal(next.profiles.default.tokens["color.border.control"].uses[0].nativeKey, "InputBorder");
  assert.equal(next.profiles.default.tokens["color.border.divider"].unmappedPorts[0].reason, "Outside fixture scope");
  assert.throws(() => buildUsageIndex({ manifest, profiles, components: [], ports: [{ ...port, profile: "unknown" }] }), /unknown profile/);
  assert.throws(() => buildUsageIndex({ manifest, profiles, components: [], ports: [{ ...port, mapping: { ...mapping, unmapped: {} } }] }), /exactly once/);
});
