#!/usr/bin/env node
import { pinnedKitSource } from "./lib/task-kit-source.mjs";
import { buildFigmaPayload } from "./lib/figma-payload.mjs";
import { stableJson } from "./lib/fs.mjs";
const args = process.argv.slice(2), options = {};
for (let index = 0; index < args.length; index += 2) {
  if (!["--ref", "--roles"].includes(args[index]) || !args[index + 1] || options[args[index]]) throw new Error("Usage: node scripts/figma-bridge.mjs --ref FULL_COMMIT_OR_TAG [--roles role,role]");
  options[args[index]] = args[index + 1];
}
if (!options["--ref"]) throw new Error("--ref is required; an implicit moving HEAD is not a pin.");
process.stdout.write(stableJson(await buildFigmaPayload(await pinnedKitSource(options["--ref"]), options["--roles"]?.split(","))));
