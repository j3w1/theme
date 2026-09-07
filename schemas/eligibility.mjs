export const eligibilitySchema = (z) => z.object({
  action: z.enum(["use", "use-and-report", "blocked", "historical-only"]),
  reason: z.string().min(1),
  decisionIds: z.array(z.string().regex(/^D-\d{3}$/)),
}).strict();
