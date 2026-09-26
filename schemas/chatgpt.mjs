/* The ChatGPT desktop appearance port: its source presets and the
   one import format it emits. Both are strict, so a field ChatGPT adds,
   renames or drops fails generation instead of emitting a stale string. */

import { z } from "zod";

const role = z.string().regex(/^(color|font)\.[a-z0-9.-]+$/);
const hex = z.string().regex(/^#[0-9a-f]{6}$/);

export const chatgptPresetsSchema = z.object({
  schemaVersion: z.literal(1),
  payload: z.literal("codex-theme-v1"),
  about: z.string().min(1),
  shared: z.object({
    mode: z.literal("dark"),
    baseTheme: z.object({ label: z.string().min(1), codeThemeId: z.string().regex(/^[a-z0-9-]+$/) }).strict(),
    accent: role,
    background: role,
    uiFontSize: role,
    codeFontSize: role,
    semanticColors: z.object({ diffAdded: role, diffRemoved: role, skill: role }).strict(),
    calibration: z.object({
      reduceMotion: z.enum(["system", "on", "off"]),
      separateLightDarkModes: z.boolean(),
      diffMarkers: z.enum(["plus-minus", "colour-only"]),
      opaqueWindows: z.boolean(),
    }).strict(),
  }).strict(),
  presets: z.array(z.object({
    id: z.string().regex(/^[a-z][a-z0-9-]*$/),
    displayName: z.string().min(1),
    recommended: z.boolean(),
    summary: z.string().min(1),
    foreground: role,
    contrast: z.number().int().min(0).max(100),
  }).strict()).min(1),
}).strict();

/* codex-theme-v1, as the ChatGPT desktop app's Appearance > Import reads it.
   The field set follows public descriptions of the format; it is verified
   only when the owner imports a generated string (the port stays
   experimental until then). */
export const CODEX_THEME_PREFIX = "codex-theme-v1:";
export const codexThemeV1Schema = z.object({
  codeThemeId: z.string().min(1),
  theme: z.object({
    accent: hex,
    contrast: z.number().int().min(0).max(100),
    fonts: z.object({ code: z.string().nullable(), ui: z.string().nullable() }).strict(),
    ink: hex,
    opaqueWindows: z.boolean(),
    semanticColors: z.object({ diffAdded: hex, diffRemoved: hex, skill: hex }).strict(),
    surface: hex,
  }).strict(),
  variant: z.enum(["dark", "light"]),
}).strict();

export const parseCodexTheme = (text) => {
  if (!text.startsWith(CODEX_THEME_PREFIX)) throw new Error(`not a ${CODEX_THEME_PREFIX} string`);
  return codexThemeV1Schema.parse(JSON.parse(text.slice(CODEX_THEME_PREFIX.length)));
};
