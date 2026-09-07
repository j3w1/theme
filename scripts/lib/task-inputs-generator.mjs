import { z } from "zod";
import { readJson, readText, listFiles, sha256, stableJson, writeOrCheck } from "./fs.mjs";
import { taskInputsSchema } from "../../schemas/task-kit.mjs";
export const KIT_SHARED_FILES = ["theme.json", "agents/consume.md", "LICENSE.md", "schemas/json/theme.lock.schema.json", "exports/theme.compact.md", "exports/tokens.resolved.json", "spec/identity.md", "spec/foundations.md", "spec/accessibility.md", "spec/portability.md"];
export const taskInputsGenerator = {
  name: "task kit dependency inputs",
  async run({ manifest, defaultId, components, check }) {
    const usage = (await readJson("exports/token-usage.json")).profiles[defaultId].tokens;
    const compact = await readText("exports/theme.compact.md");
    // All global role/foundation rows remain required by the compact contract.
    const sharedTokens = [...new Set([
      ...[...compact.matchAll(/^\| `([a-z0-9.-]+)` \|/gm)].map((m) => m[1]).filter((p) => usage[p]),
      // Compact explicitly delegates spacing, density and line-height values
      // to resolved tokens. Preserve those shared foundations in every mode.
      ...Object.keys(usage).filter((p) => !p.startsWith("color.")),
    ])].sort();
    const files = {};
    const entries = {};
    const include = async (file) => { files[file] = sha256(await readText(file)); };
    for (const file of KIT_SHARED_FILES) await include(file);
    for (const component of components) {
      const componentFiles = [`exports/components/${component.id}.json`, component.file];
      const recipeFiles = await listFiles(`exports/recipes/${component.id}`);
      const recipe = recipeFiles.length ? await readJson(`exports/recipes/${component.id}/manifest.json`) : null;
      for (const file of [...componentFiles, ...recipeFiles]) await include(file);
      entries[component.id] = { title: component.name, files: componentFiles,
        tokens: Object.values(usage).filter((t) => t.uses.some((u) => u.component === component.id)).map((t) => t.path).sort(),
        recipeFiles, recipeTokens: recipe?.roles ?? [] };
    }
    const index = taskInputsSchema(z).parse({ schemaVersion: 1, theme: manifest.name, version: manifest.version, profile: defaultId, sharedFiles: KIT_SHARED_FILES,
      sharedTokens, tokenDependencies: Object.fromEntries(Object.values(usage).map((t) => [t.path, t.aliases])), usageDigest: sha256(await readText("exports/token-usage.json")), files: Object.fromEntries(Object.entries(files).sort(([a], [b]) => a.localeCompare(b, "en"))), components: entries });
    const file = "exports/task-inputs.json";
    return { files: [file], changed: await writeOrCheck(file, stableJson(index), { check }) ? [file] : [], note: `${components.length} selectable contracts` };
  },
};
