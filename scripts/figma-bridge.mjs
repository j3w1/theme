#!/usr/bin/env node
/* Prints the Figma Variables payload for one pinned revision. An implicit
   moving HEAD is not a pin, so --ref is required. */
import { pinnedKitSource } from "./lib/task-kit-source.mjs";
import { buildFigmaPayload } from "./lib/figma-payload.mjs";
import { stableJson } from "./lib/fs.mjs";
import { parseArgs, runCli } from "./tooling/cli.mjs";

await runCli(async () => {
  const { values } = parseArgs({ options: { ref: { type: "string" }, roles: { type: "string" } } });
  if (!values.ref) throw new Error("Usage: node scripts/figma-bridge.mjs --ref FULL_COMMIT_OR_TAG [--roles role,role]; --ref is required; an implicit moving HEAD is not a pin.");
  process.stdout.write(stableJson(await buildFigmaPayload(await pinnedKitSource(values.ref), values.roles?.split(","))));
});
