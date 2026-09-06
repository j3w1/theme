/* theme.json — the project manifest. */

export const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
export const PROFILE_ID = /^[a-z0-9-]+$/;

export const themeSchema = (z) =>
  z
    .object({
      $schema: z.string().optional(),
      schemaVersion: z.literal(1),
      name: z.literal("j3w1-theme"),
      displayName: z.string().min(1),
      version: z.string().regex(SEMVER),
      description: z.string().min(1),
      repository: z.string().url(),
      tokenFormat: z
        .object({
          spec: z.literal("dtcg-2025.10"),
          specUrl: z.string().url(),
          note: z.string(),
          supported: z
            .object({
              types: z.array(z.string()).min(1),
              colorSpaces: z.array(z.literal("srgb")).length(1),
              colorHexRequired: z.literal(true),
              aliases: z.string(),
              extensionsKey: z.literal("io.github.j3w1.theme"),
            })
            .strict(),
        })
        .strict(),
      sourceRevision: z
        .object({
          policy: z.literal("consumer-pinned-git-revision"),
          allowed: z.array(z.enum(["tag", "commit"])).min(1),
          forbidden: z.array(z.literal("branch")),
          tagPattern: z.string(),
          resolveTag: z.string().url(),
          rawBase: z.string().url(),
          note: z.string(),
        })
        .strict(),
      profiles: z
        .array(
          z
            .object({
              id: z.string().regex(PROFILE_ID),
              displayName: z.string().min(1),
              status: z.enum(["approved", "proposed", "heritage"]),
              default: z.boolean(),
              overlay: z.string().regex(PROFILE_ID).optional(),
              tokens: z.array(z.string().regex(/^tokens\/.+\.tokens\.json$/)).min(1),
            })
            .strict(),
        )
        .min(1)
        .superRefine((profiles, ctx) => {
          const defaults = profiles.filter((p) => p.default);
          if (defaults.length !== 1) ctx.addIssue({ code: "custom", message: "exactly one profile must be default" });
          if (defaults[0] && defaults[0].status !== "approved") ctx.addIssue({ code: "custom", message: "the default profile must be approved" });
          const ids = new Set();
          for (const p of profiles) {
            if (ids.has(p.id)) ctx.addIssue({ code: "custom", message: `duplicate profile id ${p.id}` });
            ids.add(p.id);
          }
          for (const p of profiles) {
            if (p.overlay && !ids.has(p.overlay)) ctx.addIssue({ code: "custom", message: `${p.id} overlays unknown profile ${p.overlay}` });
          }
        }),
      spec: z
        .object({
          identity: z.string(),
          foundations: z.string(),
          accessibility: z.string(),
          portability: z.string(),
          decisions: z.string(),
          families: z.string(),
          componentsDir: z.string().regex(/\/$/),
        })
        .strict(),
      agents: z.object({ consume: z.string(), contributors: z.string() }).strict(),
      exports: z
        .object({
          dir: z.string().regex(/\/$/),
          canonicalForAgents: z.array(z.string()).min(1),
          derivative: z.array(z.string()),
          digests: z.string(),
        })
        .strict(),
      site: z
        .object({
          url: z.string().url().regex(/\/$/, "site url must end with a slash"),
          base: z.string().regex(/^\/[a-z0-9-]+$/, "base is a single path segment without trailing slash"),
          role: z.literal("confirmation-only"),
          note: z.string(),
        })
        .strict()
        .refine((site) => site.url.endsWith(`${site.base}/`), { message: "site.url must end with site.base + '/'" }),
      ports: z
        .object({
          catalogue: z.string(),
          dir: z.string().regex(/\/$/),
          statuses: z.array(z.enum(["experimental", "verified", "deprecated"])).length(3),
        })
        .strict(),
      references: z.object({ catalogue: z.string(), sources: z.string() }).strict(),
      font: z
        .object({ family: z.string().min(1), lineage: z.string(), source: z.string().url(), bundled: z.literal(false) })
        .strict(),
      license: z
        .object({ code: z.literal("MIT"), prose: z.literal("CC-BY-4.0"), screenshots: z.string(), file: z.string() })
        .strict(),
    })
    .strict();
