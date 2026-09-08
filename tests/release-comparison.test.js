import test from "node:test";
import assert from "node:assert/strict";
import { sha256, stableJson } from "../scripts/lib/fs.mjs";
import { pinnedKitSource } from "../scripts/lib/task-kit-source.mjs";
import { readRelease, compareReleases, comparisonMarkdown } from "../scripts/lib/release-comparison.mjs";
import { assertHistoricalMarkup, assertHistoricalCss, historicalStyleClosure, renderReleaseSpecimens } from "../scripts/lib/release-rendering.mjs";

const A = "a".repeat(40), B = "b".repeat(40);
const token = (css, aliasOf = null) => ({ type: "color", value: css, css, aliasOf, description: "Controlled test role", status: "proposed", deprecated: false });
const fixture = (revision = A, edit = () => {}) => {
  const tokens = { "color.primitive.test.a": token("#e99499"), "color.primitive.test.b": token("#e99499"), "color.text.default": token("#e99499", "color.primitive.test.a") };
  const component = { schemaVersion: 1, theme: "j3w1-theme", version: "0.1.0", id: "button", states: ["default", "hover"], variants: [{ id: "default", name: "Primary" }], tokens: { "root.text": { alias: "color.text.default", value: "#e99499" } }, stateRules: [], contrast: [] };
  const data = { tokens, component, decisions: "## D-000 Test decision\n\nStatus: proposed.\n", portability: "Recorded historical mapping rule." };
  edit(data);
  const files = {
    "theme.json": stableJson({ schemaVersion: 1, name: "j3w1-theme", version: "0.1.0" }),
    "exports/tokens.resolved.json": stableJson({ schemaVersion: 1, theme: "j3w1-theme", version: "0.1.0", profiles: { default: { status: "approved", tokens } } }),
    "exports/components/button.json": stableJson(component),
    "spec/decisions.md": data.decisions,
    "spec/portability.md": data.portability,
    "spec/components/button.md": "Historical component source",
    "spec/components/button.demo.html": '<button class="button" type="button">Example</button>',
    "site/src/styles/tokens.generated.css": ":root { --color-text-default: #e99499; }",
    "site/src/styles/base.css": "body { color: var(--color-text-default); }",
    "site/src/styles/site.css": "* { box-sizing: border-box; }",
    "site/src/styles/components/button.css": ".button { color: var(--color-text-default); }",
  };
  files["exports/digests.json"] = stableJson({ schemaVersion: 1, files: Object.fromEntries(Object.entries(files).filter(([name]) => name.startsWith("exports/")).map(([name, text]) => [name, sha256(text)])) });
  return { files, source: { revision, list: async () => Object.keys(files).sort(), read: async (file) => { assert.ok(file in files); return files[file]; } } };
};
const read = (input, profile = "default") => readRelease(input.source.revision, profile, { source: input.source });

test('pinned historical styles resolve shared imports while rejecting escapes, resources and cycles', async()=>{
  const files={'site/src/styles/components/select.css':'@import "../shared.css"; .select { color:var(--color-text-default) }','site/src/styles/shared.css':'.choice { background:var(--color-surface-input) }'};
  const requested=[],read=async name=>{requested.push(name);return files[name]??null;};
  const result=await historicalStyleClosure(read,['site/src/styles/components/select.css']);
  assert.match(result,/\.choice/);assert.match(result,/\.select/);assert.doesNotMatch(result,/@import/);
  assert.deepEqual(requested,['site/src/styles/components/select.css','site/src/styles/shared.css']);
  for(const invalid of ['@import "../../../../outside.css";','@import "https://example.invalid/theme.css";','@import "../missing.css";']){
    files['site/src/styles/components/select.css']=invalid;await assert.rejects(historicalStyleClosure(read,['site/src/styles/components/select.css']),/Unsafe|Unsupported|Missing/);
  }
  files['site/src/styles/components/select.css']='@import "../shared.css";';files['site/src/styles/shared.css']='@import "components/select.css";';
  await assert.rejects(historicalStyleClosure(read,['site/src/styles/components/select.css']),/Circular/);
  files['site/src/styles/shared.css']='.choice { background:url(external.png) }';await assert.rejects(historicalStyleClosure(read,['site/src/styles/components/select.css']),/cannot fetch/);
});

test("identical pinned revisions have an empty semantic diff and byte-identical reconstructed specimens", async () => {
  const a = await read(fixture()), b = await read(fixture());
  const report = compareReleases(a, b);
  assert.equal(report.semanticStatus, "compared"); assert.deepEqual(report.changes, []);
  assert.deepEqual(report.impact.components, []); assert.equal(report.impact.catalogue, "no registered ports");
  assert.deepEqual(await renderReleaseSpecimens(a), await renderReleaseSpecimens(b));
  assert.equal(stableJson(report), stableJson(compareReleases(a, b)));
  assert.match(comparisonMarkdown(report), /No semantic changes/);
  assert.equal(report.visual.status, "not run");
});

test("controlled value, alias-only, removed-state, approval and policy changes retain separate categories", async () => {
  const from = await read(fixture());
  const to = await read(fixture(B, (data) => {
    data.tokens["color.primitive.test.a"].css = "#ffa2a7";
    data.tokens["color.primitive.test.a"].value = "#ffa2a7";
    data.tokens["color.text.default"].aliasOf = "color.primitive.test.b";
    data.tokens["color.text.default"].status = "approved";
    data.tokens["color.text.default"].eligibility = { action: "use", reason: "Recorded test policy", decisionIds: [] };
    data.component.states = ["default"];
    data.decisions = "## D-000 Test decision\n\nStatus: accepted.\n";
    data.portability = "Changed explicit mapping rule.";
  }));
  const report = compareReleases(from, to);
  for (const kind of ["token-value", "token-alias", "token-status", "component-states", "decision", "portability"]) assert.ok(report.changes.some((c) => c.kind === kind), kind);
  assert.equal(report.changes.filter((c) => c.kind === "token-value").length, 1);
  assert.equal(report.changes.find((c) => c.key === "color.text.default:eligibility").before, null);
  assert.deepEqual(report.impact.components[0].roles, ["color.text.default"]);
  assert.ok(report.impact.components[0].sources.every((s) => s.url.includes(s.revision)));
});

test("equal values never imply a rename; explicit mappings require exact pins and unambiguous roles", async () => {
  const from = await read(fixture());
  const to = await read(fixture(B, (data) => { data.tokens["color.text.replacement"] = data.tokens["color.text.default"]; delete data.tokens["color.text.default"]; }));
  const ordinary = compareReleases(from, to);
  assert.ok(ordinary.changes.some((c) => c.kind === "token-added"));
  assert.ok(ordinary.changes.some((c) => c.kind === "token-removed"));
  assert.ok(!ordinary.changes.some((c) => c.kind === "role-renamed"));
  const migrations = { schemaVersion: 1, from: A, to: B, roles: [{ from: "color.text.default", to: "color.text.replacement", reason: "Explicit test-only migration" }] };
  assert.ok(compareReleases(from, to, { migrations }).changes.some((c) => c.kind === "role-renamed"));
  assert.throws(() => compareReleases(from, to, { migrations: { ...migrations, to: A } }), /pins/);
  assert.throws(() => compareReleases(from, to, { migrations: { ...migrations, roles: [...migrations.roles, ...migrations.roles] } }), /Ambiguous/);
});

test("missing historical exports/profile stay unsupported and altered exported bytes fail integrity checks", async () => {
  const missing = fixture(); delete missing.files["exports/tokens.resolved.json"];
  const a = await read(missing), b = await read(fixture(B));
  assert.equal(compareReleases(a, b).semanticStatus, "unsupported");
  assert.deepEqual(compareReleases(a, b).changes, []);
  assert.equal((await read(fixture(), "unknown")).supported, false);
  const missingComponent = fixture(); delete missingComponent.files["exports/components/button.json"];
  assert.equal((await read(missingComponent)).supported, false);
  const corrupt = fixture(); corrupt.files["exports/tokens.resolved.json"] += " ";
  await assert.rejects(read(corrupt), /digest mismatch/);
  await assert.rejects(readRelease(A, "default", { source: fixture().source, expectedRevision: B }), /pin moved/);
});

test("pinned source resolves an annotated release tag and refuses moving branch names", async () => {
  for (const ref of ["main", "origin/main", "HEAD", "v0.1.0~1", "--all"]) await assert.rejects(pinnedKitSource(ref), /full commit or release tag/);
  const source = await pinnedKitSource("v0.1.0");
  assert.equal(source.revision, "328076217d2728ee7dc2aea01c2f71452dbfc9c5");
  assert.ok((await source.list()).includes("exports/tokens.resolved.json"));
});

test("historical rendering rejects active content and network dependencies while retaining maintained states", async () => {
  for (const markup of ['<script>void 0</script>', '<button onclick="void 0">X</button>', '<img src="https://example.invalid/image.png">', '<form action="https://example.invalid/">X</form>']) assert.throws(() => assertHistoricalMarkup(markup), /Unsupported/);
  for (const css of ['@import "external.css";', 'div { background: url(image.png) }']) assert.throws(() => assertHistoricalCss(css), /historical|Historical/);
  const rendered = await renderReleaseSpecimens(await read(fixture()));
  assert.equal(rendered.cases.length, 2);
  assert.match(rendered.files["button/default/hover.html"], /data-state-hover/);
  assert.match(rendered.files["button/default/hover.html"], /Content-Security-Policy/);
  assert.doesNotMatch(rendered.files["button/default/hover.html"], /<script/);
});

test("registered port impact cites actual mapping edges and never implies verification", async () => {
  const before = fixture(), after = fixture(B, (d) => { d.tokens["color.text.default"].status = "approved"; });
  for (const input of [before, after]) {
    input.files["ports/synthetic/port.json"] = stableJson({ id: "synthetic", status: "experimental" });
    input.files["ports/synthetic/mapping.json"] = stableJson({ schemaVersion: 1, mappings: { "color.text.default": ["editor.text"] }, unmapped: {} });
  }
  const report = compareReleases(await read(before), await read(after));
  assert.equal(report.impact.catalogue, "registered mappings");
  assert.equal(report.impact.ports[0].classification, "potentially affected");
  assert.equal(report.impact.ports[0].sources[0].pointer, "/mappings/color.text.default");
});

test("capability-only port changes enter downstream impact with pinned, digest-checked sources", async () => {
  const before = fixture(), after = fixture(B);
  const addCatalogue = (input, state) => {
    input.files["ports/synthetic/port.json"] = stableJson({ id: "synthetic", status: "experimental" });
    input.files["ports/synthetic/mapping.json"] = stableJson({ schemaVersion: 1, mappings: {}, unmapped: {} });
    input.files["exports/port-capabilities.json"] = stableJson({ schemaVersion: 1, theme: "j3w1-theme", version: "0.1.0", ports: [{ id: "synthetic", surfaces: { geometry: { state, reason: "Controlled test-only declaration" } } }] });
    const ledger = JSON.parse(input.files["exports/digests.json"]);
    ledger.files["exports/port-capabilities.json"] = sha256(input.files["exports/port-capabilities.json"]);
    input.files["exports/digests.json"] = stableJson(ledger);
  };
  addCatalogue(before, "inherited"); addCatalogue(after, "unsupported");
  const report = compareReleases(await read(before), await read(after));
  assert.deepEqual(report.changes.map(change => change.key), ["synthetic:capabilities"]);
  assert.equal(report.impact.ports[0].classification, "potentially affected");
  assert.deepEqual(report.impact.ports[0].roles, []);
  assert.ok(report.impact.ports[0].sources.every(source => source.file === "exports/port-capabilities.json" && source.url.includes(source.revision)));
  after.files["exports/port-capabilities.json"] += " ";
  await assert.rejects(read(after), /digest mismatch/);
  delete before.files["ports/synthetic/port.json"];
  await assert.rejects(read(before), /missing port manifest/);
  const historical = fixture();
  historical.files["ports/synthetic/port.json"] = stableJson({ id: "synthetic", status: "experimental" });
  assert.equal((await read(historical)).ports.synthetic.capabilities, null);
});
