import { promises as fs } from "node:fs";
import path from "node:path";
import { readJson, stableJson, repoRoot, sha256 } from "./lib/fs.mjs";
import { verifyConsumerSubject, consumerProtocolDigest } from "./lib/ui-evidence.mjs";

// Publish only reviewed metadata, never Playwright configuration, local paths,
// traces, test stdout, entered values or temporary consumer directory names.
if (process.argv.includes("--publish")) {
  const report = await readJson(".cache/ui-evidence/report.json");
  const release = await readJson("dist/downloads/release.json");
  if (report.subject.tarballDigest !== release.sha256 || report.subject.protocolDigest !== await consumerProtocolDigest()) throw new Error("UI report does not match the deployed package or current protocol");
  if (sha256(await fs.readFile(path.join(repoRoot,"dist/downloads",release.file))) !== release.sha256) throw new Error("Downloaded package bytes changed");
  await fs.mkdir("dist/verification",{recursive:true});
  await fs.copyFile(".cache/ui-evidence/report.json","dist/verification/ui.json");
  console.log("Published packed-consumer evidence for the exact downloadable package.");
} else {
  const consumer = await readJson(".cache/ui-consumers.json");
  await verifyConsumerSubject(consumer);
  const subject = await readJson(".cache/ui-evidence/subject.json");
  if (subject.tarballDigest !== consumer.tarballDigest || subject.fixturesDigest !== consumer.fixtures.digest || subject.protocolDigest !== await consumerProtocolDigest()) throw new Error("Consumer subject or protocol changed during the run");
  const raw = await readJson(".cache/ui-evidence/results.json");
  const records = [];
  const visit = suite => {
    for (const spec of suite.specs ?? []) for (const test of spec.tests) {
      const result = test.results.at(-1);
      const annotations = result?.annotations ?? test.annotations;
      const read = name => { const entry=annotations.find(item=>item.type===name); if(!entry)throw new Error(`Missing ${name}: ${spec.title}`); return JSON.parse(entry.description); };
      records.push({ test: spec.title, project: test.projectName, result: result.status, durationMs: result.duration, scope: read("verification"), environment: read("verification-environment") });
    }
    for (const child of suite.suites ?? []) visit(child);
  };
  visit(raw);
  if (!records.length || raw.errors?.length || records.some(record=>record.result!=="passed")) throw new Error("The packed-consumer suite has incomplete or failed results");
  // This protocol contains four framework form tests, four gallery/copy tests
  // and nine interaction tests per engine. A filtered run cannot pass as full.
  for (const browser of ["chromium","firefox","webkit"]) if(records.filter(record=>record.environment.browser===browser).length!==17)throw new Error(`Incomplete ${browser} protocol: expected 17 tests`);
  if(records.length!==51 || new Set(records.map(record=>`${record.project}/${record.test}`)).size!==51)throw new Error("Incomplete or duplicated packed-consumer protocol");
  const report = { schemaVersion: 1, package: "@j3w1/ui", version: (await readJson("packages/ui/package.json")).version, subject, integrity: consumer.integrity, fixtures: consumer.fixtures, typeCheck: consumer.typeCheck, build: consumer.build, kind: "automated packed consumers", records, limits: "Scripted clean-fixture evidence for these recorded protocols. Not an independent acceptance, blanket component conformance, manual screen-reader or physical-device pass." };
  await fs.writeFile(".cache/ui-evidence/report.json",stableJson(report));
  console.log(`${records.length} packed-consumer passes recorded with artifact, fixture and protocol identities.`);
}
