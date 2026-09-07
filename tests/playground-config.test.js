import assert from "node:assert/strict";
import test from "node:test";
import { readJson } from "../scripts/lib/fs.mjs";
import { loadComponents } from "../scripts/lib/spec.mjs";
import { PLAYGROUND_IDS, defaultPlaygroundConfig, playgroundPayload, validatePlaygroundConfig } from "../schemas/playground.mjs";

const { profiles } = await readJson("theme.json");
const contracts = (await loadComponents()).filter((c) => PLAYGROUND_IDS.includes(c.id));

test("playground choices are closed and derive from each maintained contract", () => {
  assert.equal(contracts.length, PLAYGROUND_IDS.length);
  for (const contract of contracts) {
    const config = defaultPlaygroundConfig(contract, profiles);
    assert.deepEqual(validatePlaygroundConfig(config, contract, profiles), config);
    for (const state of contract.states) assert.equal(validatePlaygroundConfig({ state }, contract, profiles).state, state);
    for (const variant of contract.variants) assert.equal(validatePlaygroundConfig({ variant: variant.id }, contract, profiles).variant, variant.id);
    for (const input of [{ component: "unknown" }, { variant: "unknown" }, { state: "default+unknown" }, { density: "wide" }, { profile: "approved" }, { direction: "auto" }, { css: "body{}" }, { label: null }, { help: "a".repeat(513) }, { label: "\u0000" }, null, []]) assert.throws(() => validatePlaygroundConfig(input, contract, profiles));
  }
});

test("sample text is excluded from shared configuration unless explicitly selected", () => {
  const contract = contracts[0];
  const input = { label: "Private sample <b>text</b>", help: "Another private sample", direction: "rtl" };
  const safe = playgroundPayload(input, contract, profiles);
  assert.equal(safe.label, ""); assert.equal(safe.help, ""); assert.equal(safe.direction, "rtl");
  assert.equal(playgroundPayload(input, contract, profiles, { includeText: true }).label, input.label);
  assert.equal(input.help, "Another private sample");
});
