#!/usr/bin/env node
/* Regenerates every committed artifact derived from the sources, or with
   --check verifies that the committed copies are current. Generated files
   are committed (D-012) so agents can read exports at a tag without building;
   CI runs --check so they cannot drift.

   Order matters: tokens feed contrast and components, components feed docs
   and coverage, everything feeds digests, and README blocks come last. */

import { validateAll } from "./lib/validators.mjs";
import { GENERATORS } from "./lib/generators.mjs";

const check = process.argv.includes("--check");
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);

let context;
try {
  context = await validateAll();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

let failures = 0;
const produced = [];
for (const generator of GENERATORS) {
  if (only && generator.name !== only) continue;
  try {
    const result = await generator.run({ ...context, check, produced });
    const changed = result?.changed ?? [];
    const orphans = result?.orphans ?? [];
    if (result?.files) produced.push(...result.files);
    const note = [result?.note, changed.length ? `${changed.length} ${check ? "stale" : "written"}` : null, orphans.length ? `${orphans.length} orphan${check ? "" : " removed"}` : null].filter(Boolean).join(", ");
    console.log(`${check ? "checked" : "generated"} ${generator.name}${note ? `: ${note}` : ""}`);
    if (check && (changed.length || orphans.length)) {
      failures += 1;
      for (const f of changed) console.error(`  stale: ${f}`);
      for (const f of orphans) console.error(`  orphan: ${f}`);
    }
  } catch (error) {
    failures += 1;
    console.error(`${generator.name}: ${error.message}`);
  }
}
if (check && failures) console.error("generated files are out of date — run npm run generate");
process.exit(failures ? 1 : 0);
