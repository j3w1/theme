#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { parityPrerequisites, preparePrivateParity } from "./lib/private-parity.mjs";
import { runPrivateParity } from "./lib/private-parity-browser.mjs";
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log(JSON.stringify(parityPrerequisites(null), null, 2));
} else if (args.length !== 2 || args[0] !== "--config") {
  console.error("Usage: npm run parity:private -- --config <private operator JSON>");
  process.exitCode = 1;
} else {
  try {
    const input = JSON.parse(await readFile(args[1], "utf8"));
    const missing = parityPrerequisites(input);
    if (missing) { console.log(JSON.stringify(missing, null, 2)); process.exitCode = 2; }
    else {
      const prepared = await preparePrivateParity(input);
      const report = await runPrivateParity(prepared);
      console.log(JSON.stringify({ result: report.result, cases: report.records.length, privateReport: "report.json in the operator-selected private output directory" }));
      if (report.result !== "completed") process.exitCode = 1;
    }
  } catch {
    // A compiler error may include private source. Never print it to CI logs.
    console.error("Private parity failed. Check the operator configuration, installed dependencies and private output; no pass is claimed.");
    process.exitCode = 1;
  }
}
