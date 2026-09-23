#!/usr/bin/env node
import { parseArgs, runCli } from "./tooling/cli.mjs";
import { readFile } from "node:fs/promises";
import { readRelease, compareReleases } from "./lib/release-comparison.mjs";
import { renderReleaseSpecimens, comparisonFiles } from "./lib/release-rendering.mjs";
import { writeNewKit } from "./lib/safe-kit-writer.mjs";

await runCli(async () => {
  const { values } = parseArgs({ options: { from: { type: "string" }, to: { type: "string" }, profile: { type: "string", default: "default" }, out: { type: "string" }, migrations: { type: "string" } } });
  if (!values.from || !values.to || !values.out) throw new Error("Usage: npm run release:compare -- --from <tag-or-full-commit> --to <tag-or-full-commit> --out <new-directory> [--profile default] [--migrations <revision-bound-json>]");
  const from = await readRelease(values.from, values.profile), to = await readRelease(values.to, values.profile);
  const migrations = values.migrations ? JSON.parse(await readFile(values.migrations, "utf8")) : null;
  const report = compareReleases(from, to, { migrations });
  const files = comparisonFiles(report, await renderReleaseSpecimens(from), await renderReleaseSpecimens(to));
  const destination = await writeNewKit(values.out, files);
  console.log(`${report.semanticStatus}: ${report.changes.length} changes. Visual execution: not run. Written to ${destination}`);
});
