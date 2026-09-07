import { readJson } from "./lib/fs.mjs";
import { writeReport } from "./lib/verification-report.mjs";
await writeReport(await readJson(process.argv[2] ?? "test-results/evidence.json"));
console.log("Verification report published alongside unchanged specimen assets.");
