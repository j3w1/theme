/* The ChatGPT desktop appearance port: its source presets and the one import
   format it emits. The emitted strings are checked against this strict
   schema, and the schema against the samples ChatGPT itself exported
   (ports/chatgpt/evidence/*.codex-theme.txt): once a sample from a new build
   has a different field set, generation stops instead of emitting stale
   strings. Until the first sample is recorded, the field set follows the
   public description of the format and the port must stay experimental. */

import { z } from "zod";

const colorRole = z.string().regex(/^color\.[a-z0-9.-]+$/);
const sizeRole = z.string().regex(/^font\.size\.[a-z0-9.-]+$/);
const hex = z.string().regex(/^#[0-9a-f]{6}$/);
const anyHex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const chatgptPresetsSchema = z.object({
  schemaVersion: z.literal(1),
  payload: z.literal("codex-theme-v1"),
  about: z.string().min(1),
  shared: z.object({
    mode: z.literal("dark"),
    baseTheme: z.object({ label: z.string().min(1), codeThemeId: z.string().regex(/^[a-z0-9-]+$/) }).strict(),
    accent: colorRole,
    background: colorRole,
    uiFontSize: sizeRole,
    codeFontSize: sizeRole,
    semanticColors: z.object({ diffAdded: colorRole, diffRemoved: colorRole, skill: colorRole }).strict(),
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
    foreground: colorRole,
    contrast: z.number().int().min(0).max(100),
  }).strict()).min(1),
}).strict();

/* codex-theme-v1, as the ChatGPT desktop app's Appearance > Import reads it.
   `codeThemeId: "chatgpt"` in the presets is a guess until the first import. */
export const CODEX_THEME_PREFIX = "codex-theme-v1:";
const payloadSchema = (colour) => z.object({
  codeThemeId: z.string().min(1),
  theme: z.object({
    accent: colour,
    contrast: z.number().int().min(0).max(100),
    fonts: z.object({ code: z.string().nullable(), ui: z.string().nullable() }).strict(),
    ink: colour,
    opaqueWindows: z.boolean(),
    semanticColors: z.object({ diffAdded: colour, diffRemoved: colour, skill: colour }).strict(),
    surface: colour,
  }).strict(),
  variant: z.enum(["dark", "light"]),
}).strict();
/* What the port emits (lower-case hex) and what a ChatGPT export may hold. */
export const codexThemeV1Schema = payloadSchema(hex);
export const codexThemeSampleSchema = payloadSchema(anyHex);

/* The dotted field paths of a payload, to compare formats. */
export const fieldSet = (value, prefix = "") => Object.entries(value).flatMap(([k, v]) => (v && typeof v === "object" ? [`${prefix}${k}`, ...fieldSet(v, `${prefix}${k}.`)] : [`${prefix}${k}`])).sort();

export const parseCodexTheme = (text, schema = codexThemeV1Schema) => {
  if (!text.startsWith(CODEX_THEME_PREFIX)) throw new Error(`not a ${CODEX_THEME_PREFIX} string`);
  return schema.parse(JSON.parse(text.slice(CODEX_THEME_PREFIX.length)));
};
