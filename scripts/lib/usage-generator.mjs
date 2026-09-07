import { z } from "zod";
import { readJson, writeOrCheck, stableJson } from "./fs.mjs";
import { buildUsageIndex } from "./usage.mjs";
import { usageSchema, portMappingSchema } from "../../schemas/usage.mjs";
import { validatePorts } from "./validators.mjs";
import { attachSourceLines } from "./source-locations.mjs";

export const usageGenerator = {
  name: "semantic usage index",
  async run({ manifest, profiles, components, check }) {
    const ports = [];
    for (const port of await validatePorts()) ports.push({ ...port, mapping: portMappingSchema(z).parse(await readJson(`ports/${port.id}/mapping.json`)) });
    const globalPairs = (await readJson("spec/contrast.json")).pairs;
    const index = usageSchema(z).parse(await attachSourceLines(buildUsageIndex({ manifest, profiles, components, ports, globalPairs })));
    const file = "exports/token-usage.json";
    return { files: [file], changed: await writeOrCheck(file, stableJson(index), { check }) ? [file] : [], note: `${Object.keys(index.profiles).length} profiles` };
  },
};
