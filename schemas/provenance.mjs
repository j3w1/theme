/* references/sources.json (pinned revisions), references/catalogue.json
   (what each reference is and what it does not prove), and the per-directory
   provenance.json next to any screenshot. */

const SHA = /^[0-9a-f]{40}$/;

export const sourcesSchema = (z) =>
  z
    .object({
      observedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      repositories: z.record(
        z.string().regex(/^[a-z0-9-]+$/),
        z
          .object({
            repo: z.string().regex(/^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/),
            revision: z.string().regex(SHA),
            branch: z.string().min(1),
            revisionDate: z.string().min(1),
            role: z.enum(["reference-implementation", "historical-source"]),
            files: z.array(z.string().min(1)).min(1),
          })
          .strict(),
      ),
      external: z.record(
        z.string().regex(/^[a-z0-9-]+$/),
        z.object({ title: z.string().min(1), url: z.string().url(), kind: z.string().min(1) }).strict(),
      ),
    })
    .strict();

export const catalogueSchema = (z) =>
  z
    .object({
      schemaVersion: z.literal(1),
      entries: z
        .array(
          z
            .object({
              id: z.string().regex(/^[a-z0-9-]+$/),
              kind: z.enum(["historical", "screenshot", "reference-implementation"]),
              title: z.string().min(1),
              source: z
                .object({ repository: z.string().regex(/^[a-z0-9-]+$/), path: z.string().min(1) })
                .strict()
                .optional(),
              path: z.string().regex(/^references\//).optional(),
              verificationStatus: z.literal("reference-only"),
              notes: z.string().min(1),
              license: z.string().min(1),
            })
            .strict()
            .refine((e) => Boolean(e.source) !== Boolean(e.path), { message: "an entry has either a source (repo + path) or a local path, not both" }),
        )
        .min(1),
    })
    .strict();

export const screenshotProvenanceSchema = (z) =>
  z
    .object({
      file: z.string().min(1),
      kind: z.enum(["user-screenshot", "illustrative", "live-capture"]),
      application: z.string().min(1),
      applicationVersion: z.string().nullable(),
      os: z.string().nullable(),
      profile: z.string().nullable(),
      sourceRevision: z.string().nullable(),
      capturedOn: z.string().nullable(),
      receivedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      width: z.number().int().positive(),
      height: z.number().int().positive(),
      redactions: z.array(z.string()),
      caption: z.string().min(1),
      notProofOf: z.string().min(1),
    })
    .strict();
