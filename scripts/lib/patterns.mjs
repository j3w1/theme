import { z } from "zod";
import { readText, readJson, sha256, stableJson, writeOrCheck } from "./fs.mjs";
import { splitVariants } from "./spec.mjs";
import { FIELD_COMPONENTS } from "./form-fields.mjs";
import { patternSchema } from "../../schemas/pattern.mjs";
export const loadFieldTemplates = async () => Object.fromEntries(await Promise.all(Object.entries(FIELD_COMPONENTS).map(async ([kind, id]) => [kind, splitVariants(await readText(`spec/components/${id}.demo.html`)).get("default")])));
export const validatePatterns = async () => {
  const pattern = patternSchema(z).parse(await readJson("spec/patterns/validation-recovery.json"));
  for (const id of pattern.components) await readText(`spec/components/${id}.md`);
  return pattern;
};
export const patternGenerator = {
  name: "form patterns",
  async run({ manifest, check }) {
    const pattern = await validatePatterns(), files = [], changed = [];
    const components = {};
    for (const id of [...new Set([...pattern.components, ...Object.values(FIELD_COMPONENTS)])].sort()) components[id] = sha256(await readText(`exports/components/${id}.json`));
    const theme = { name: manifest.name, version: manifest.version, profile: "default", sourceDigest: sha256(stableJson(components)) };
    for (const [file, value] of [["exports/patterns/validation-recovery.json", { ...pattern, version: manifest.version, theme, componentDigests: components }], ["exports/forms/identity.json", theme], ["exports/forms/templates.json", { schemaVersion: 1, version: manifest.version, templates: await loadFieldTemplates() }]]) {
      files.push(file); if (await writeOrCheck(file, stableJson(value), { check })) changed.push(file);
    }
    return { files, changed };
  },
};
