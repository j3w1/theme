/* Frontmatter for spec/*.md documents and spec/families.json entries. */

export const docSchema = (z) =>
  z
    .object({
      id: z.string().regex(/^[a-z][a-z0-9-]*$/),
      title: z.string().min(1),
      order: z.number().int().min(0),
      summary: z.string().min(1).max(300),
    })
    .strict();

export const familySchema = (z) =>
  z
    .array(
      z
        .object({
          id: z.string().regex(/^[a-z][a-z0-9-]*$/),
          title: z.string().min(1),
          order: z.number().int().min(0),
          description: z.string().min(1),
        })
        .strict(),
    )
    .min(1)
    .superRefine((families, ctx) => {
      const ids = new Set();
      for (const f of families) {
        if (ids.has(f.id)) ctx.addIssue({ code: "custom", message: `duplicate family ${f.id}` });
        ids.add(f.id);
      }
    });
