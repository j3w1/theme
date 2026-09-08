import { safeKitPath } from "./task-kit.mjs";
import { privateAssetPath } from "./private-path.mjs";
export const PARITY_COMPONENTS = ["button", "text-field", "select", "checkbox", "tabs", "dialog", "table"];
export const privateParitySchema = z => z.object({
  schemaVersion: z.literal(1), target: z.string().min(1), out: z.string().min(1),
  themeRef: z.string().regex(/^(?:[a-f0-9]{40}|v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/),
  templateVersion: z.string().min(1),
  license: z.object({ type: z.enum(["regular", "extended"]), reference: z.string().min(1), reviewed: z.literal(true) }).strict(),
  lock: z.string().refine(safeKitPath),
  sources: z.array(z.object({ from: z.string().refine(privateAssetPath), to: z.string().refine(privateAssetPath) }).strict()).min(1),
  defaults: z.string().refine(privateAssetPath), styles: z.string().refine(privateAssetPath),
  frameworkStyles: z.string().refine(privateAssetPath).optional(),
  aliases: z.record(z.string().min(1), z.string().refine(privateAssetPath)),
}).strict();
