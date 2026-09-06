/* theme.lock.json — written by a consuming project to make "based on
   j3w1/theme" reproducible. Not a package manager: no graph, no install. */

export const INTEGRATION_KINDS = ["css-vars", "vuetify", "tailwind", "jetbrains-icls", "gtk-css", "terminal-16", "other"];

export const lockSchema = (z) =>
  z
    .object({
      schemaVersion: z.literal(1),
      theme: z.literal("j3w1-theme"),
      version: z.string().regex(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/),
      ref: z.string().min(1),
      revision: z.string().regex(/^[0-9a-f]{40}$/, "revision must be the full 40-character commit"),
      profile: z.string().regex(/^[a-z0-9-]+$/),
      integration: z
        .object({ id: z.string().min(1), version: z.string().min(1), kind: z.enum(INTEGRATION_KINDS) })
        .strict(),
      resolvedAt: z.string().datetime(),
      exports: z.record(z.string().regex(/^exports\//), z.string().regex(/^sha256-[A-Za-z0-9+/=]+$/)),
      components: z.array(z.string().regex(/^[a-z][a-z0-9-]*$/)),
      deviations: z.array(
        z
          .object({
            component: z.string().min(1),
            target: z.string().min(1),
            kind: z.enum(["unsupported", "substituted", "omitted", "host-rule"]),
            specValue: z.string().min(1),
            applied: z.string().nullable(),
            reason: z.string().min(1),
          })
          .strict(),
      ),
    })
    .strict();
