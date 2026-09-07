import { PREVIEW_IDS } from "./playground.mjs";
export const workbenchBindingsSchema = (z) => z.record(z.enum(PREVIEW_IDS), z.object({
  label: z.string().regex(/^\.[a-z][a-z0-9-]*$/), labelName: z.string().min(1),
  help: z.string().regex(/^\.[a-z][a-z0-9-]*$/).nullable(),
  motion: z.string().regex(/^\.[a-z][a-z0-9-]*$/).nullable(),
  motionState: z.literal("hover").optional(),
}).strict());
