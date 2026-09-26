/* The ChatGPT port: resolves ports/chatgpt/src/presets.json against
   the default profile into dist/presets.json (both presets, their settings,
   where each value comes from, and a codex-theme-v1 import string), and
   renders the README's settings tables from the same data. */

import { chatgptPresetsSchema, codexThemeV1Schema, CODEX_THEME_PREFIX, parseCodexTheme } from "../../schemas/chatgpt.mjs";
import { stableJson } from "./fs.mjs";

export const CHATGPT_SOURCE = "ports/chatgpt/src/presets.json";

const valueOf = (exported, path) => {
  const token = exported.tokens?.[path] ?? exported[path];
  if (!token) throw new Error(`ports/chatgpt: ${path} is not a role of the profile`);
  if (token.eligibility?.action === "blocked") throw new Error(`ports/chatgpt: ${path} is blocked for delivery`);
  const v = token.value;
  if (typeof v === "object" && v?.hex) return v.hex.toLowerCase();
  if (typeof v === "object" && v?.unit === "px") return v.value;
  throw new Error(`ports/chatgpt: ${path} has no colour or px value`);
};

/* The roles the port maps, each with the ChatGPT setting it fills. */
export const chatgptRoles = (source) => {
  const s = chatgptPresetsSchema.parse(source).shared;
  const roles = {
    [s.accent]: ["Accent", "theme.accent"],
    [s.background]: ["Background", "theme.surface"],
    [s.uiFontSize]: ["UI font size"],
    [s.codeFontSize]: ["Code font size"],
    [s.semanticColors.diffAdded]: ["theme.semanticColors.diffAdded"],
    [s.semanticColors.diffRemoved]: ["theme.semanticColors.diffRemoved"],
    [s.semanticColors.skill]: ["theme.semanticColors.skill"],
  };
  for (const p of source.presets) (roles[p.foreground] ??= []).push(`Foreground (${p.displayName})`, `theme.ink (${p.displayName})`);
  return roles;
};

export const buildChatgptPresets = (source, exported, manifest) => {
  const src = chatgptPresetsSchema.parse(source);
  const s = src.shared;
  const presets = src.presets.map((p) => {
    const payload = codexThemeV1Schema.parse({
      codeThemeId: s.baseTheme.codeThemeId,
      theme: {
        accent: valueOf(exported, s.accent),
        contrast: p.contrast,
        fonts: { code: null, ui: null },
        ink: valueOf(exported, p.foreground),
        opaqueWindows: s.calibration.opaqueWindows,
        semanticColors: {
          diffAdded: valueOf(exported, s.semanticColors.diffAdded),
          diffRemoved: valueOf(exported, s.semanticColors.diffRemoved),
          skill: valueOf(exported, s.semanticColors.skill),
        },
        surface: valueOf(exported, s.background),
      },
      variant: s.mode,
    });
    const importString = `${CODEX_THEME_PREFIX}${JSON.stringify(payload)}`;
    parseCodexTheme(importString);
    return {
      id: p.id,
      displayName: p.displayName,
      recommended: p.recommended,
      summary: p.summary,
      settings: [
        { setting: "Mode", value: "Dark", source: "calibration" },
        { setting: "Theme", value: s.baseTheme.label, source: "calibration" },
        { setting: "Accent", value: payload.theme.accent, source: s.accent },
        { setting: "Background", value: payload.theme.surface, source: s.background },
        { setting: "Foreground", value: payload.theme.ink, source: p.foreground },
        { setting: "UI font size", value: `${valueOf(exported, s.uiFontSize)} px`, source: s.uiFontSize },
        { setting: "Code font size", value: `${valueOf(exported, s.codeFontSize)} px`, source: s.codeFontSize },
        { setting: "Reduce motion", value: { system: "System", on: "On", off: "Off" }[s.calibration.reduceMotion], source: "calibration" },
        { setting: "Separate light and dark", value: s.calibration.separateLightDarkModes ? "On" : "Off", source: "calibration" },
        { setting: "Contrast", value: String(p.contrast), source: "calibration" },
        { setting: "Diff markers", value: s.calibration.diffMarkers === "plus-minus" ? "+/-" : "Colour only", source: "calibration" },
      ],
      importString,
    };
  });
  return {
    schemaVersion: 1,
    theme: manifest.name,
    version: manifest.version,
    host: "ChatGPT desktop app, Settings > Appearance",
    status: "experimental: the import strings are verified only once imported into a real ChatGPT build",
    presets,
  };
};

export const chatgptAppearance = ({ manifest, exported }) => (source) => stableJson(buildChatgptPresets(source, exported, manifest));

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
