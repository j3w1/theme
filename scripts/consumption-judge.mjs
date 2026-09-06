#!/usr/bin/env node
/* Judges a fresh agent's reconstruction of a component against the exports.
   Usage:
     node scripts/consumption-judge.mjs <component-id> <result.html> [--browser] [--json <report>]
   Static checks: one inline style, no external resources, only token colours,
   radius 0, 1px/2px borders, the focus rule, a data-state element per
   declared state, the monospace family. --browser additionally renders the
   file in Chromium and compares the computed colours of every declared state
   with the component's stateRules. Exit code 1 on any failure; the judge is
   never loosened to make a run pass (tests/consumption/PROTOCOL.md). */

import { promises as fs } from "node:fs";
import path from "node:path";
import { readJson, repoRoot } from "./lib/fs.mjs";

const args = process.argv.slice(2);
const positional = args.filter((a) => !a.startsWith("--"));
const [id, resultPath] = positional;
const browser = args.includes("--browser");
const jsonIndex = args.indexOf("--json");
if (!id || !resultPath) {
  console.error("usage: node scripts/consumption-judge.mjs <component-id> <result.html> [--browser] [--json <report>]");
  process.exit(2);
}

const manifest = await readJson("theme.json");
const component = await readJson(`exports/components/${id}.json`);
const resolved = await readJson("exports/tokens.resolved.json");
const tokens = resolved.profiles[resolved.defaultProfile].tokens;
const html = (await fs.readFile(path.resolve(resultPath), "utf8")).replaceAll("\r\n", "\n");

const allowedColours = new Set();
for (const t of Object.values(tokens)) {
  if (t.type === "color") {
    allowedColours.add(t.value.hex.toLowerCase());
    allowedColours.add(t.css.toLowerCase());
  }
}
const KEYWORDS = new Set(["transparent", "currentcolor", "inherit", "initial", "unset", "highlight", "highlighttext", "canvastext", "canvas", "buttontext", "buttonface", "graytext", "linktext"]);

const findings = [];
const check = (ok, message) => {
  if (!ok) findings.push(message);
};

const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]);
check(styles.length === 1, `exactly one <style> element expected, found ${styles.length}`);
const css = styles.join("\n");
check(!/<link\b/i.test(html), "no <link> elements allowed");
check(!/<script\b[^>]*\ssrc=/i.test(html), "no external scripts allowed");
check(!/@import/i.test(css), "no @import allowed");
check(!/url\(\s*["']?https?:/i.test(css), "no remote url() allowed");
check(!/@font-face/i.test(css), "no web fonts: the family is named, not bundled");

const normalise = (value) => {
  const v = value.trim().toLowerCase();
  const rgb = v.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)(?:[\s,/]+([\d.]+%?))?\s*\)$/);
  if (rgb) {
    const hex = `#${[rgb[1], rgb[2], rgb[3]].map((n) => Number(n).toString(16).padStart(2, "0")).join("")}`;
    if (rgb[4] === undefined) return hex;
    const alpha = rgb[4].endsWith("%") ? Number(rgb[4].slice(0, -1)) / 100 : Number(rgb[4]);
    return alpha >= 1 ? hex : `rgb(${rgb[1]} ${rgb[2]} ${rgb[3]} / ${Math.round(alpha * 100)}%)`;
  }
  const short = v.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/);
  if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`;
  return v;
};

const colourLiterals = [...css.matchAll(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/gi)].map((m) => m[0]);
for (const literal of colourLiterals) {
  const n = normalise(literal);
  check(allowedColours.has(n) || KEYWORDS.has(n), `colour ${literal} is not a token value`);
}
const namedColours = [...css.matchAll(/:\s*(red|blue|green|white|black|gray|grey|orange|yellow|purple|pink|silver|maroon|navy|teal|olive|lime|aqua|fuchsia)\b/gi)].map((m) => m[1]);
for (const name of namedColours) check(false, `named colour ${name} is not a token value`);

for (const m of css.matchAll(/border(?:-top|-right|-bottom|-left|-start|-end|-inline|-block)?(?:-start|-end)?-radius\s*:\s*([^;]+);/gi)) {
  check(/^\s*0(?:px)?(?:\s+0(?:px)?){0,3}\s*$/.test(m[1]), `border-radius must be 0, found ${m[1].trim()}`);
}
for (const m of css.matchAll(/border(?:-top|-right|-bottom|-left|-inline-start|-inline-end|-block-start|-block-end)?\s*:\s*([^;]+);/gi)) {
  const width = m[1].match(/(\d+(?:\.\d+)?)(px|rem|em)/);
  if (width) check(width[2] === "px" && ["0", "1", "2"].includes(width[1]), `border width ${width[0]} is not 1px or 2px`);
}
for (const m of css.matchAll(/border(?:-\w+)?-width\s*:\s*([^;]+);/gi)) {
  for (const w of m[1].matchAll(/(\d+(?:\.\d+)?)(px|rem|em)/g)) check(w[2] === "px" && ["0", "1", "2"].includes(w[1]), `border width ${w[0]} is not 1px or 2px`);
}

const ringHex = tokens["color.interaction.focus.ring"].value.hex;
const focusBlocks = [...css.matchAll(/([^{}]*(?::focus-visible|data-state[^\]]*focus-visible)[^{}]*)\{([^}]*)\}/gi)];
check(focusBlocks.length > 0, "no focus-visible rule found");
const hasRing = focusBlocks.some(([, , body]) => {
  const outline = body.match(/outline\s*:\s*([^;]+);/i)?.[1] ?? "";
  const offset = body.match(/outline-offset\s*:\s*([^;]+);/i)?.[1] ?? "";
  const colour = outline.match(/#[0-9a-f]{3,8}|rgba?\([^)]*\)/i)?.[0];
  return /dashed/.test(outline) && /\b1px\b/.test(outline) && colour && normalise(colour) === ringHex && /-2px/.test(offset);
});
check(hasRing, `a focus-visible rule must set outline: 1px dashed ${ringHex} with outline-offset: -2px`);
check(!/outline\s*:\s*(?:none|0)\s*;/i.test(css) || /outline\s*:\s*1px dashed/i.test(css), "outline: none without the specified ring");
check(!/box-shadow\s*:[^;]*(?:0 0 \d+px|blur)/i.test(css), "no glow: focus is a ring, elevation is a border");

for (const state of component.states) {
  check(new RegExp(`data-state=["']${state.replace(/[+]/g, "\\+")}["']`).test(html), `no element with data-state="${state}"`);
}

const family = manifest.font.family.toLowerCase();
const families = [...css.matchAll(/font-family\s*:\s*([^;]+);/gi)].map((m) => m[1].toLowerCase());
check(families.length > 0, "no font-family declared");
check(families.every((f) => f.includes(family) || f.includes("source code pro") || /monospace/.test(f)), `font-family must name ${manifest.font.family} (or Source Code Pro) with a monospace fallback`);

let computed = null;
if (browser && findings.length === 0) {
  const { chromium } = await import("@playwright/test");
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 1200, height: 900 } });
  await page.goto(`file://${path.resolve(resultPath)}`);
  const rules = Object.fromEntries(component.stateRules.map((r) => [r.state, r.tokens]));
  computed = await page.evaluate((states) => {
    const toHex = (rgb) => {
      const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      return m ? `#${[m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, "0")).join("")}` : rgb;
    };
    const out = {};
    for (const state of states) {
      const wrapper = document.querySelector(`[data-state="${state.replace(/"/g, '\\"')}"]`);
      if (!wrapper) continue;
      const control = wrapper.querySelector("input, select, textarea, button, [role]") ?? wrapper.firstElementChild;
      if (!control) continue;
      if (state.includes("focus-visible")) control.focus?.();
      /* The specification names roles, not markup: the border, outline and
         background may sit on the control or on the box around it. Measure
         whichever element actually declares each property. */
      const candidates = [control, control.parentElement, control.parentElement?.parentElement].filter((el) => el && el !== wrapper && wrapper.contains(el));
      const styles = candidates.map((el) => getComputedStyle(el));
      const pick = (test, fallback) => styles.find(test) ?? fallback;
      const cs = styles[0];
      const borderStyle = pick((s) => s.borderTopStyle !== "none" && parseFloat(s.borderTopWidth) > 0, cs);
      const outlineStyle = pick((s) => s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0, cs);
      const bgStyle = pick((s) => s.backgroundColor !== "rgba(0, 0, 0, 0)", cs);
      const placeholder = state.includes("placeholder-shown") && "value" in control && control.value === "" ? getComputedStyle(control, "::placeholder").color : null;
      out[state] = { color: toHex(placeholder ?? cs.color), background: toHex(bgStyle.backgroundColor), border: toHex(borderStyle.borderTopColor), outline: toHex(outlineStyle.outlineColor), outlineStyle: outlineStyle.outlineStyle, radius: borderStyle.borderRadius };
    }
    return out;
  }, component.states);
  await b.close();
  for (const [state, expected] of Object.entries(rules)) {
    const actual = computed[state];
    if (!actual || !expected) continue;
    const want = (part) => expected[part]?.value?.toLowerCase();
    if (want("fg") && want("fg").startsWith("#")) check(actual.color === want("fg"), `${state}: color ${actual.color} ≠ ${want("fg")}`);
    if (want("bg") && want("bg").startsWith("#")) check(actual.background === want("bg"), `${state}: background ${actual.background} ≠ ${want("bg")}`);
    if (want("border") && want("border").startsWith("#")) check(actual.border === want("border"), `${state}: border ${actual.border} ≠ ${want("border")}`);
    if (want("outline") && want("outline").startsWith("#")) check(actual.outline === want("outline") && actual.outlineStyle !== "none", `${state}: outline ${actual.outline}/${actual.outlineStyle} ≠ ${want("outline")}`);
    check(actual.radius === "0px", `${state}: radius ${actual.radius}`);
  }
}

const report = { component: id, version: manifest.version, result: resultPath, mode: browser ? "browser" : "static", pass: findings.length === 0, findings, computed };
if (jsonIndex >= 0) await fs.writeFile(path.resolve(args[jsonIndex + 1]), `${JSON.stringify(report, null, 2)}\n`);
console.log(report.pass ? `PASS ${id} (${report.mode})` : `FAIL ${id} (${report.mode})\n  ${findings.join("\n  ")}`);
process.exit(report.pass ? 0 : 1);
