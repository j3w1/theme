import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import families from "../../spec/families.json";
import { componentSchema } from "../../schemas/component.mjs";
import { docSchema } from "../../schemas/doc.mjs";
import { portSchema } from "../../schemas/port.mjs";

const familyIds = families.map((f) => f.id);

export const collections = {
  components: defineCollection({
    loader: glob({ pattern: "*.md", base: "./spec/components", generateId: ({ entry }) => entry.replace(/\.md$/, "") }),
    schema: componentSchema(z, { families: familyIds }),
  }),
  docs: defineCollection({
    loader: glob({ pattern: "*.md", base: "./spec", generateId: ({ entry }) => entry.replace(/\.md$/, "") }),
    schema: docSchema(z),
  }),
  agents: defineCollection({
    loader: glob({ pattern: "*.md", base: "./agents", generateId: ({ entry }) => entry.replace(/\.md$/, "") }),
    schema: z.object({}).passthrough(),
  }),
  ports: defineCollection({
    loader: glob({ pattern: "*/port.json", base: "./ports", generateId: ({ entry }) => entry.split("/")[0] }),
    schema: portSchema(z),
  }),
};
