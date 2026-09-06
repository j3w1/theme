/* Structural schema for DTCG 2025.10 token files, as a zod factory so the same
   definition serves Node scripts (root zod) and any other zod instance.

   The format's semantic rules that need context (type inheritance from the
   nearest group, alias resolution, per-type value shapes after inheritance)
   are enforced by scripts/lib/tokens.mjs. This file validates what can be
   checked locally: reserved `$` keys, the shape of each typed value, the
   alias syntax, and the project's provenance extension. */

export const EXTENSIONS_KEY = "io.github.j3w1.theme";

export const TOKEN_TYPES = [
  "color",
  "dimension",
  "fontFamily",
  "fontWeight",
  "number",
  "duration",
  "border",
  "typography",
  "shadow",
];

export const ALIAS = /^\{[a-z0-9][a-z0-9.-]*\}$/;
export const HEX = /^#[0-9a-f]{6}$/;
export const NAME = /^[a-z0-9][a-z0-9-]*$/;

export const aliasSchema = (z) => z.string().regex(ALIAS, "alias must look like {group.path.token}");

export const colorValueSchema = (z) =>
  z
    .object({
      colorSpace: z.literal("srgb"),
      components: z.array(z.number().min(0).max(1)).length(3),
      alpha: z.number().min(0).max(1).optional(),
      hex: z.string().regex(HEX, "hex must be lowercase #rrggbb"),
    })
    .strict()
    .refine(
      (value) => value.components.every((c, i) => Math.round(c * 255) === parseInt(value.hex.slice(1 + i * 2, 3 + i * 2), 16)),
      { message: "hex must agree with components (round(c * 255))" },
    );

export const dimensionValueSchema = (z) =>
  z.object({ value: z.number(), unit: z.enum(["px", "rem"]) }).strict();

export const durationValueSchema = (z) =>
  z.object({ value: z.number().min(0), unit: z.enum(["ms", "s"]) }).strict();

export const fontFamilyValueSchema = (z) => z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]);

export const fontWeightValueSchema = (z) =>
  z.union([z.number().int().min(1).max(1000), z.enum(["normal", "bold", "regular", "medium", "semi-bold", "light"])]);

export const numberValueSchema = (z) => z.number();

/* Composite values may reference other tokens per part. */
export const borderValueSchema = (z) =>
  z
    .object({
      color: z.union([aliasSchema(z), colorValueSchema(z)]),
      width: z.union([aliasSchema(z), dimensionValueSchema(z)]),
      style: z.union([aliasSchema(z), z.enum(["solid", "dashed", "dotted", "double", "none"])]),
    })
    .strict();

export const typographyValueSchema = (z) =>
  z
    .object({
      fontFamily: z.union([aliasSchema(z), fontFamilyValueSchema(z)]),
      fontSize: z.union([aliasSchema(z), dimensionValueSchema(z)]),
      fontWeight: z.union([aliasSchema(z), fontWeightValueSchema(z)]),
      lineHeight: z.union([aliasSchema(z), z.number()]),
      letterSpacing: z.union([aliasSchema(z), dimensionValueSchema(z)]).optional(),
    })
    .strict();

export const shadowValueSchema = (z) =>
  z
    .object({
      color: z.union([aliasSchema(z), colorValueSchema(z)]),
      offsetX: z.union([aliasSchema(z), dimensionValueSchema(z)]),
      offsetY: z.union([aliasSchema(z), dimensionValueSchema(z)]),
      blur: z.union([aliasSchema(z), dimensionValueSchema(z)]),
      spread: z.union([aliasSchema(z), dimensionValueSchema(z)]),
      inset: z.boolean().optional(),
    })
    .strict();

export const valueSchemaFor = (z, type) => {
  switch (type) {
    case "color": return colorValueSchema(z);
    case "dimension": return dimensionValueSchema(z);
    case "duration": return durationValueSchema(z);
    case "fontFamily": return fontFamilyValueSchema(z);
    case "fontWeight": return fontWeightValueSchema(z);
    case "number": return numberValueSchema(z);
    case "border": return borderValueSchema(z);
    case "typography": return typographyValueSchema(z);
    case "shadow": return shadowValueSchema(z);
    default: throw new Error(`unsupported token type ${type}`);
  }
};

/* The project's provenance extension. `status` says whether a value was read
   from a source (observed), proposed in this repository, or is a site-only
   value catalogued for completeness. */
export const provenanceExtensionSchema = (z) =>
  z
    .object({
      status: z.enum(["observed", "proposed", "approved", "site-specific", "heritage"]),
      origin: z
        .object({
          kind: z.enum(["xresources", "i3", "i3status", "dunst", "dmenu", "site", "gedit", "intellij", "proposed", "derived"]),
          ref: z.string().min(1),
          key: z.string().min(1).optional(),
          note: z.string().optional(),
        })
        .strict()
        .optional(),
      approval: z.object({ decision: z.string().regex(/^D-\d{3}$/) }).strict().optional(),
      textSafe: z.enum(["canvas", "default", "raised", "none"]).optional(),
      contrast: z.record(z.string(), z.number()).optional(),
      forbiddenGroups: z.array(z.string()).optional(),
      overlay: z.string().optional(),
    })
    .strict();

export const extensionsSchema = (z) =>
  z.object({ [EXTENSIONS_KEY]: provenanceExtensionSchema(z).optional() }).passthrough();

/* A token file is a tree of groups. Every non-`$` key is a group or a token;
   a token is recognised by the presence of `$value`. The value shape is
   checked here only when `$type` is declared on the token itself; inherited
   types are checked after resolution in scripts/lib/tokens.mjs. */
export const tokenTreeSchema = (z) => {
  const node = z.lazy(() =>
    z
      .object({
        $type: z.enum(TOKEN_TYPES).optional(),
        $value: z.unknown().optional(),
        $description: z.string().optional(),
        $extensions: extensionsSchema(z).optional(),
        $deprecated: z.union([z.boolean(), z.string()]).optional(),
        $root: z.unknown().optional(),
      })
      .catchall(node)
      .superRefine((obj, ctx) => {
        for (const key of Object.keys(obj)) {
          if (key.startsWith("$")) {
            if (!["$type", "$value", "$description", "$extensions", "$deprecated", "$root"].includes(key)) {
              ctx.addIssue({ code: "custom", message: `unknown reserved key ${key}`, path: [key] });
            }
          } else if (!NAME.test(key)) {
            ctx.addIssue({ code: "custom", message: `name "${key}" must be lowercase kebab-case`, path: [key] });
          }
        }
        if ("$value" in obj) {
          for (const key of Object.keys(obj)) {
            if (!key.startsWith("$")) ctx.addIssue({ code: "custom", message: "a token cannot contain child groups", path: [key] });
          }
          if (typeof obj.$value === "string") {
            if (!ALIAS.test(obj.$value)) ctx.addIssue({ code: "custom", message: "string values must be aliases like {group.token}", path: ["$value"] });
          } else if (obj.$type) {
            const result = valueSchemaFor(z, obj.$type).safeParse(obj.$value);
            if (!result.success) {
              for (const issue of result.error.issues) ctx.addIssue({ ...issue, path: ["$value", ...issue.path] });
            }
          }
        }
      }),
  );
  return node;
};

export const tokenFileSchema = (z) => tokenTreeSchema(z);
