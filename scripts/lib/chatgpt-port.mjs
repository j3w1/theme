/* The ChatGPT port: resolves ports/chatgpt/src/presets.json against
   the default profile into dist/presets.json (both presets, their settings,
   where each value comes from, and a codex-theme-v1 import string), and
   renders the README's settings tables from the same data. */

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { chatgptPresetsSchema, codexThemeSampleSchema, codexThemeV1Schema, CODEX_THEME_PREFIX, fieldSet, parseCodexTheme } from "../../schemas/chatgpt.mjs";
import { repoRoot, stableJson } from "./fs.mjs";

export const CHATGPT_SOURCE = "ports/chatgpt/src/presets.json";

const valueOf = (exported, role, kind) => {
  const token = exported.tokens?.[role] ?? exported[role];
  if (!token) throw new Error(`ports/chatgpt: ${role} is not a role of the profile`);
  if (token.eligibility?.action === "blocked") throw new Error(`ports/chatgpt: ${role} is blocked for delivery`);
  const v = token.value;
  if (kind === "color" && typeof v === "object" && v?.hex) return v.hex.toLowerCase();
  if (kind === "px" && typeof v === "object" && v?.unit === "px") return v.value;
  throw new Error(`ports/chatgpt: ${role} is not a ${kind === "px" ? "px size" : "colour"}`);
};

/* ChatGPT's own exports, recorded as evidence: `# build: <name>` and
   `# date: <yyyy-mm-dd>` lines, then the codex-theme-v1 string. */
export const SAMPLE_DIR = "ports/chatgpt/evidence";
export const readSamples = (root = repoRoot) => {
  let names = [];
  try { names = readdirSync(path.join(root, SAMPLE_DIR)).filter((n) => n.endsWith(".codex-theme.txt")).sort(); } catch { return []; }
  return names.map((name) => {
    const text = readFileSync(path.join(root, SAMPLE_DIR, name), "utf8").replace(/^\uFEFF/, "");
    const meta = Object.fromEntries([...text.matchAll(/^#\s*(build|date):\s*(.+)$/gm)].map((m) => [m[1], m[2].trim()]));
    const line = text.split("\n").find((l) => l.startsWith(CODEX_THEME_PREFIX));
    if (!meta.build || !meta.date || !line) throw new Error(`${SAMPLE_DIR}/${name}: needs "# build:", "# date:" and a ${CODEX_THEME_PREFIX} line`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date)) throw new Error(`${SAMPLE_DIR}/${name}: "# date:" must be yyyy-mm-dd`);
    let payload;
    try { payload = parseCodexTheme(line.trim(), codexThemeSampleSchema); } catch (error) {
      throw new Error(`${SAMPLE_DIR}/${name}: ChatGPT ${meta.build} (${meta.date}) exports a theme format this port does not emit; update schemas/chatgpt.mjs and the emitter before publishing strings. ${error.issues ? error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ") : error.message}`);
    }
    return { name, build: meta.build, date: meta.date, payload };
  }).sort((a, b) => (a.date === b.date ? a.name.localeCompare(b.name) : a.date.localeCompare(b.date)));
};

/* Every recorded sample must match the current format (readSamples parses it
   strictly); the emitted payload must also have the newest sample's field set
   and code theme id. */
export const assertSampleFormat = (payload, samples) => {
  const newest = samples.at(-1);
  if (!newest) return;
  if (newest.payload.codeThemeId !== payload.codeThemeId) {
    throw new Error(`ports/chatgpt: ChatGPT ${newest.build} (${newest.date}) exports codeThemeId "${newest.payload.codeThemeId}", but src/presets.json names "${payload.codeThemeId}"; set baseTheme.codeThemeId to the id ChatGPT uses`);
  }
  const want = fieldSet(newest.payload);
  const got = fieldSet(payload);
  if (JSON.stringify(want) !== JSON.stringify(got)) {
    throw new Error(`ports/chatgpt: ChatGPT ${newest.build} (${newest.date}) exports a different theme format than the port emits; update schemas/chatgpt.mjs and the emitter before publishing strings. Missing: ${want.filter((k) => !got.includes(k)).join(", ") || "none"}; extra: ${got.filter((k) => !want.includes(k)).join(", ") || "none"}`);
  }
};

/* The roles the port maps, each with the ChatGPT setting it fills. */
export const chatgptRoles = (source) => {
  const s = chatgptPresetsSchema.parse(source).shared;
  const roles = {};
  const add = (role, ...keys) => (roles[role] ??= []).push(...keys);
  add(s.accent, "Accent", "theme.accent");
  add(s.background, "Background", "theme.surface");
  add(s.uiFontSize, "UI font size");
  add(s.codeFontSize, "Code font size");
  add(s.semanticColors.diffAdded, "theme.semanticColors.diffAdded");
  add(s.semanticColors.diffRemoved, "theme.semanticColors.diffRemoved");
  add(s.semanticColors.skill, "theme.semanticColors.skill");
  for (const p of source.presets) add(p.foreground, `Foreground (${p.displayName})`, `theme.ink (${p.displayName})`);
  return roles;
};

export const buildChatgptPresets = (source, exported, manifest, { status = "experimental", samples = readSamples() } = {}) => {
  const src = chatgptPresetsSchema.parse(source);
  const s = src.shared;
  const presets = src.presets.map((p) => {
    const payload = codexThemeV1Schema.parse({
      codeThemeId: s.baseTheme.codeThemeId,
      theme: {
        accent: valueOf(exported, s.accent, "color"),
        contrast: p.contrast,
        fonts: { code: null, ui: null },
        ink: valueOf(exported, p.foreground, "color"),
        opaqueWindows: s.calibration.opaqueWindows,
        semanticColors: {
          diffAdded: valueOf(exported, s.semanticColors.diffAdded, "color"),
          diffRemoved: valueOf(exported, s.semanticColors.diffRemoved, "color"),
          skill: valueOf(exported, s.semanticColors.skill, "color"),
        },
        surface: valueOf(exported, s.background, "color"),
      },
      variant: s.mode,
    });
    assertSampleFormat(payload, samples);
    const importString = `${CODEX_THEME_PREFIX}${JSON.stringify(payload)}`;
    parseCodexTheme(importString);
    return {
      id: p.id,
      displayName: p.displayName,
      recommended: p.recommended,
      summary: p.summary,
      settings: [
        { setting: "Mode", value: s.mode === "dark" ? "Dark" : "Light", source: "calibration" },
        { setting: "Theme", value: s.baseTheme.label, source: "calibration" },
        { setting: "Accent", value: payload.theme.accent, source: s.accent },
        { setting: "Background", value: payload.theme.surface, source: s.background },
        { setting: "Foreground", value: payload.theme.ink, source: p.foreground },
        { setting: "UI font size", value: `${valueOf(exported, s.uiFontSize, "px")} px`, source: s.uiFontSize },
        { setting: "Code font size", value: `${valueOf(exported, s.codeFontSize, "px")} px`, source: s.codeFontSize },
        { setting: "Reduce motion", value: { system: "System", on: "On", off: "Off" }[s.calibration.reduceMotion], source: "calibration" },
        { setting: "Separate light and dark", value: s.calibration.separateLightDarkModes ? "On" : "Off", source: "calibration" },
        { setting: "Contrast", value: String(p.contrast), source: "calibration" },
        { setting: "Diff markers", value: s.calibration.diffMarkers === "plus-minus" ? "+/-" : "Colour only", source: "calibration" },
        { setting: "Opaque windows", value: s.calibration.opaqueWindows ? "On (translucent sidebar off)" : "Off", source: "calibration" },
      ],
      importString,
    };
  });
  return {
    schemaVersion: 1,
    theme: manifest.name,
    version: manifest.version,
    host: "ChatGPT desktop app, Settings > Appearance",
    status: status === "experimental" ? "experimental: the import strings are verified only once imported into a real ChatGPT build" : status,
    formatSamples: samples.map(({ build, date }) => ({ build, date })),
    presets,
  };
};

export const chatgptAppearance = ({ manifest, exported, port }) => (source) => stableJson(buildChatgptPresets(source, exported, manifest, { status: port?.status }));

/* The README block: one settings table per preset, then its import string. */
export const chatgptReadmeBlock = (built) => built.presets.flatMap((p) => [
  `### ${p.displayName}${p.recommended ? " (recommended)" : ""}`,
  "",
  p.summary,
  "",
  "| Setting | Value |",
  "| --- | --- |",
  ...p.settings.map((row) => `| ${row.setting} | ${/^#/.test(row.value) ? `\`${row.value}\`` : row.value} |`),
  "",
  "Import string (Settings > Appearance > Dark theme > Import):",
  "",
  "```text",
  p.importString,
  "```",
  "",
]).join("\n").trimEnd();

/* The port may leave experimental, or name a tested build, only with a
   recorded export from each build it names. */
export const chatgptPortProblems = (port, samples) => {
  const problems = [];
  if (!samples.length && (port.status !== "experimental" || port.testedVersions.length)) problems.push("the ChatGPT port stays experimental with no tested versions until a ChatGPT export is recorded in ports/chatgpt/evidence/");
  for (const build of port.testedVersions) if (!samples.some((s) => s.build === build)) problems.push(`tested build ${build} has no recorded export in ports/chatgpt/evidence/`);
  return problems;
};
