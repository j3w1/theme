/* Frontmatter schema for spec/components/<id>.md, shared by the Astro
   content collection and scripts/validate.mjs. The same factory receives
   whichever zod instance the caller has, so only API common to zod 3 and 4
   is used. */

export const ID = /^[a-z][a-z0-9-]*$/;
export const ROLE_PATH = /^[a-z0-9][a-z0-9.-]*$/;

/* Canonical single states. Combinations are written `a+b` (e.g.
   `invalid+focus-visible`); every part must be a canonical state. */
export const STATES = [
  "default",
  "hover",
  "active",
  "focus-visible",
  "selected",
  "container-inactive",
  "disabled",
  "invalid",
  "read-only",
  "required",
  "placeholder-shown",
  "filled",
  "loading",
  "busy",
  "checked",
  "mixed",
  "expanded",
  "collapsed",
  "current",
  "open",
  "closed",
  "focus-trapped",
  "reduced-motion",
  "drop-target",
  "dragging",
  "pressed",
  "toggled",
  "empty",
  "error",
  "no-results",
  "sorted",
  "truncated",
  "stacked",
  "visited",
];

export const isState = (value) => value.split("+").every((part) => STATES.includes(part));

export const FIXTURES = [
  "FX-LONG", "FX-320", "FX-360", "FX-ZOOM-200", "FX-I18N", "FX-RTL", "FX-RM", "FX-HC", "FX-TOUCH", "FX-DENSITY", "FX-OVERFLOW", "FX-STATE-MATRIX",
];

export const componentSchema = (z, { families } = {}) => {
  const family = families ? z.enum(families) : z.string().regex(ID);
  const stateString = z.string().refine(isState, { message: "unknown state; combine canonical states with +" });
  return z
    .object({
      id: z.string().regex(ID),
      name: z.string().min(1),
      family,
      maturity: z.enum(["draft", "stable", "deprecated"]),
      priority: z.enum(["R1", "R2", "L"]),
      since: z.string().regex(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/),
      order: z.number().int().min(0),
      summary: z.string().min(1).max(200),
      native: z.boolean(),
      aria: z
        .object({
          pattern: z.string().min(1),
          apg: z.string().url().optional(),
          role: z.string().optional(),
        })
        .strict(),
      variants: z
        .array(z.object({ id: z.string().regex(ID), name: z.string().min(1), description: z.string().optional() }).strict())
        .min(1),
      sizes: z.array(z.enum(["compact", "comfortable"])).min(1),
      states: z.array(stateString).min(1).refine((s) => s.includes("default"), { message: "states must include default" }),
      tokens: z.record(z.string().regex(/^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)+$/), z.string().regex(ROLE_PATH)),
      stateTokens: z
        .record(
          stateString,
          z.object({ fg: z.string().regex(ROLE_PATH).optional(), bg: z.string().regex(ROLE_PATH).optional(), border: z.string().regex(ROLE_PATH).optional(), outline: z.string().regex(ROLE_PATH).optional() }).strict(),
        )
        .default({}),
      contrast: z
        .array(
          z
            .object({
              fg: z.string().regex(ROLE_PATH),
              bg: z.string().regex(ROLE_PATH),
              min: z.number().positive().default(4.5),
              kind: z.enum(["text", "ui"]).default("text"),
              state: stateString.optional(),
              label: z.string().optional(),
              waiver: z.string().optional(),
            })
            .strict(),
        )
        .default([]),
      anatomy: z.array(z.object({ part: z.string().min(1), description: z.string().min(1) }).strict()).min(1),
      keyboard: z.array(z.object({ key: z.string().min(1), action: z.string().min(1) }).strict()).default([]),
      responsive: z.string().min(1),
      portability: z.object({ web: z.string().min(1), nativeFallbacks: z.array(z.string().min(1)).default([]) }).strict(),
      fixtures: z.array(z.enum(FIXTURES)).default([]),
      related: z.array(z.string().regex(ID)).default([]),
      specimens: z.array(z.string().regex(ID)).default([]),
      keywords: z.array(z.string().min(1)).default([]),
      sources: z.array(z.string().min(1)).default([]),
      compact: z.boolean().default(false),
    })
    .strict()
    .superRefine((c, ctx) => {
      if (!c.native && !c.aria.apg) ctx.addIssue({ code: "custom", message: "custom widgets must cite an APG pattern URL", path: ["aria", "apg"] });
      for (const state of Object.keys(c.stateTokens)) {
        if (!c.states.includes(state)) ctx.addIssue({ code: "custom", message: `stateTokens.${state} is not a declared state`, path: ["stateTokens", state] });
      }
      const ids = new Set();
      for (const v of c.variants) {
        if (ids.has(v.id)) ctx.addIssue({ code: "custom", message: `duplicate variant ${v.id}`, path: ["variants"] });
        ids.add(v.id);
      }
      if (new Set(c.states).size !== c.states.length) ctx.addIssue({ code: "custom", message: "duplicate states", path: ["states"] });
    });
};

export const BODY_SECTIONS = ["Purpose", "Anatomy", "States", "Keyboard", "Accessibility", "Portability", "Non-examples"];
