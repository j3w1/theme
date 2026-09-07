export const RECIPE_IDS = ["button", "text-field", "dialog"];
export const recipeDependenciesSchema = (z) => z.object({
  schemaVersion: z.literal(1),
  recipes: z.array(z.object({
    id: z.enum(RECIPE_IDS),
    variant: z.literal("default"),
    markup: z.string().regex(/^spec\/components\/[a-z-]+\.demo\.html$/),
    styles: z.array(z.string().regex(/^site\/src\/styles\/components\/[a-z-]+\.css$/)).min(1),
    foundation: z.literal("site/src/styles/recipe-foundation.css"),
    // No maintained behavior module exists for these recipes yet.
    behavior: z.array(z.never()).length(0),
    removeClasses: z.array(z.enum(["dialog-trap-note"])),
    states: z.array(z.string()).min(1),
    limitations: z.array(z.string()).min(1),
  }).strict()).length(RECIPE_IDS.length).refine((items) => new Set(items.map((r) => r.id)).size === RECIPE_IDS.length, "Recipe IDs must be unique"),
}).strict();
