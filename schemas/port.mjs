/* ports/<slug>/port.json — a native application implementation of the
   approved theme. Statuses are the only three the catalogue understands;
   reference implementations and roadmap candidates live in references/ and
   spec/decisions.md, never here. */

export const portSchema = (z) =>
  z
    .object({
      schemaVersion: z.literal(1),
      id: z.string().regex(/^[a-z][a-z0-9-]*$/),
      displayName: z.string().min(1),
      status: z.enum(["experimental", "verified", "deprecated"]),
      themeVersion: z.string().regex(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/),
      tokenDigest: z.string().regex(/^sha256-[A-Za-z0-9+/=]+$/),
      profile: z.string().regex(/^[a-z0-9-]+$/),
      format: z.string().min(1),
      targetVersions: z.array(z.string().min(1)).min(1),
      testedVersions: z.array(z.string().min(1)),
      os: z.array(z.enum(["windows", "linux", "macos", "any"])).min(1),
      surfaces: z
        .object({
          supported: z.array(z.string().min(1)),
          inherited: z.array(z.string().min(1)),
          unsupported: z.array(z.string().min(1)),
        })
        .strict(),
      files: z.array(z.object({ path: z.string().regex(/^dist\//), install: z.string().min(1) }).strict()).min(1),
      mappingPath: z.literal("mapping.json"),
      capabilitiesPath: z.literal("capabilities.json").optional(),
      evidence: z
        .array(
          z
            .object({
              kind: z.enum(["screenshot", "log", "report"]),
              path: z.string().regex(/^evidence\//),
              app: z.string().min(1),
              os: z.string().min(1),
              date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
              artifactDigest: z.string().regex(/^sha256-[A-Za-z0-9+/=]+$/).optional(),
            })
            .strict(),
        ),
      reason: z.string().optional(),
    })
    .strict()
    .superRefine((port, ctx) => {
      if (port.status === "verified") {
        if (port.testedVersions.length === 0) ctx.addIssue({ code: "custom", message: "verified ports need testedVersions", path: ["testedVersions"] });
        if (port.evidence.length === 0) ctx.addIssue({ code: "custom", message: "verified ports need evidence", path: ["evidence"] });
      }
      if (port.status === "deprecated" && !port.reason) ctx.addIssue({ code: "custom", message: "deprecated ports need a reason", path: ["reason"] });
    });
