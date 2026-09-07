import assert from "node:assert/strict";
import test from "node:test";
import { workbenchData } from "../scripts/lib/workbench-data.mjs";
import { PREVIEW_IDS, validatePlaygroundConfig, defaultPlaygroundConfig } from "../schemas/playground.mjs";
import { encodeWorkbenchLink, decodeWorkbenchLink, reproductionPayload } from "../scripts/lib/workbench-config.mjs";
import { evaluateWorkbenchContrast } from "../scripts/lib/workbench-contrast.mjs";
import { parseFragment } from "parse5";
import { attribute, walkMarkup } from "../scripts/lib/markup.mjs";
import { reportContext, issueDraft, issueComposer } from "../scripts/lib/issue-draft.mjs";
import { evaluatePair } from "../scripts/lib/contrast.mjs";

test("every workbench declaration matches the canonical contrast engine in every profile", async () => {
  for (const id of PREVIEW_IDS) {
    const data = await workbenchData(id);
    for (const { id: profile } of data.profiles) for (const [index, pair] of data.contract.contrast.entries()) {
      const tokens = data.tokens[profile];
      const result = evaluateWorkbenchContrast(data, { profile, fg: pair.fg, bg: pair.bg, underlay: "color.surface.default", context: "declared", pair: String(index) });
      const canonical = evaluatePair({ fg: tokens[pair.fg].value, bg: tokens[pair.bg].value, surface: tokens["color.surface.default"].value, min: pair.min, kind: pair.kind, waiver: pair.waiver ?? null });
      for (const field of ["ratio", "display", "pass", "min", "waiver", "fg", "bg"]) assert.equal(result[field], canonical[field], `${id}/${profile}/${index}/${field}`);
    }
  }
});

test("issue reporting validates targets, preserves public context and handles long encoded drafts", () => {
  const data = { themeVersion: "0.1.0", siteUrl: "https://j3w1.github.io/theme/", revision: "a".repeat(40), sourceDigest: "snapshot", components: ["button", "checkbox"], tokens: ["color.text.default"], profiles: ["default"] };
  const context = reportContext(data, "token", "color.text.default");
  assert.equal(context.publicAnchor, "https://j3w1.github.io/theme/#t-color-text-default");
  assert.throws(() => reportContext(data, "component", "unknown"));
  assert.throws(() => reportContext(data, "token", "color.text.default", "unknown"));
  const draft = issueDraft({ expected: "A & B", actual: "長".repeat(1600), unrelated: "not collected" }, context);
  assert.doesNotMatch(draft, /not collected/);
  const large = issueComposer(context.id, draft);
  assert.equal(large.manualPaste, true);
  assert.equal(new URL(large.href).searchParams.has("body"), false);
  const small = issueComposer(context.id, "A & B\n# heading");
  assert.equal(new URL(small.href).searchParams.get("body"), "A & B\n# heading");
});

test("workbench metadata binds every declared variant to maintained content and roles", async () => {
  for (const id of PREVIEW_IDS) {
    const data = await workbenchData(id);
    assert.equal(data.contract.id, id);
    assert.match(data.sourceDigest, /^sha256-/);
    assert.equal(data.contract.variants.length, Object.keys(data.fragments).length);
    for (const profile of data.profiles) for (const role of Object.values(data.contract.tokens)) assert.ok(data.tokens[profile.id][role]);
    if (data.measurements) assert.ok(data.parts.some((part) => part.part === data.measurements.part), `${id}: measurement part is declared`);
  }
});

test("preview links preserve valid configurations, reject foreign fields, and report unavailable revisions", async () => {
  const data = await workbenchData("button");
  const config = { ...defaultPlaygroundConfig(data.contract, data.profiles), width: 360, label: "private <script>text</script>", part: "root" };
  const link = encodeWorkbenchLink(config, data);
  assert.doesNotMatch(decodeURIComponent(link), /private/);
  assert.equal(decodeWorkbenchLink(link, data).config.width, 360);
  assert.equal(decodeWorkbenchLink(link, data).mismatch, false);
  assert.equal(decodeWorkbenchLink(encodeWorkbenchLink(config, { ...data, revision: "a".repeat(40) }), data).mismatch, data.revision !== "a".repeat(40));
  assert.equal(decodeWorkbenchLink(encodeWorkbenchLink(config, data, { includeText: true }), data).config.label, config.label);
  assert.throws(() => decodeWorkbenchLink("#" + encodeURIComponent(JSON.stringify({ version: 2 })), data));
  assert.throws(() => decodeWorkbenchLink("#" + "x".repeat(12001), data));
  assert.throws(() => decodeWorkbenchLink(encodeWorkbenchLink(config, { ...data, revision: "main" }), data));
  for (const bad of [{ width: 319 }, { width: 1281 }, { width: 320.5 }, { fixture: "unknown" }, { part: "body" }, { motion: "override-system" }, { css: "anything" }]) assert.throws(() => validatePlaygroundConfig({ ...config, ...bad }, data.contract, data.profiles));
  const reproduction = reproductionPayload(config, data, { width: 360, height: 560, outerOverflow: 0, innerOverflow: [], sample: "private" });
  assert.doesNotMatch(JSON.stringify(reproduction), /private|script|sample/);
});

test("overflow tabs have complete reciprocal panel relationships", async () => {
  const data = await workbenchData("tabs");
  const nodes = []; walkMarkup(parseFragment(data.fragments.overflow), (node) => { if (node.tagName) nodes.push(node); });
  const tabs = nodes.filter((node) => attribute(node, "role") === "tab");
  assert.equal(tabs.length, 8);
  for (const tab of tabs) {
    const panel = nodes.find((node) => attribute(node, "id") === attribute(tab, "aria-controls"));
    assert.equal(attribute(panel, "role"), "tabpanel");
    assert.equal(attribute(panel, "aria-labelledby"), attribute(tab, "id"));
  }
});

test("contrast lab keeps unrounded decisions, requires alpha underlays, and never treats eligibility as a ratio", () => {
  const gray = 1.055 * ((1.05 / 4.4996 - 0.05) ** (1 / 2.4)) - 0.055;
  const token = (components, alpha = 1, action = "use") => ({ type: "color", value: { colorSpace: "srgb", components, alpha, hex: "#777777" }, eligibility: { action, reason: "test classification", decisionIds: [] }, uses: [] });
  const data = { contract: { contrast: [] }, tokens: { default: { fg: token([gray, gray, gray], 1, "blocked"), bg: token([1, 1, 1]), alpha: token([0, 0, 0], .5) } } };
  const selection = { profile: "default", fg: "fg", bg: "bg", underlay: "bg", context: "text" };
  const result = evaluateWorkbenchContrast(data, selection);
  assert.equal(result.display, "4.50"); assert.equal(result.pass, false);
  assert.equal(result.eligibility[0].action, "blocked");
  assert.throws(() => evaluateWorkbenchContrast(data, { ...selection, underlay: "alpha" }), /opaque/);
  assert.throws(() => evaluateWorkbenchContrast(data, { ...selection, fg: "unknown" }), /documented/);
  assert.throws(() => evaluateWorkbenchContrast(data, { ...selection, context: "declared" }), /explicit/);
  assert.equal(evaluateWorkbenchContrast(data, { ...selection, bg: "alpha" }).bg, "#808080");
  data.tokens.default.fg.uses = [{ kind: "contrast", part: null, state: null, variant: null, surface: "bg" }];
  data.tokens.default.bg.uses = [...data.tokens.default.fg.uses];
  assert.deepEqual(evaluateWorkbenchContrast(data, selection).alternatives, [], "Sharing a contrast pair does not make foreground and background interchangeable");
});
