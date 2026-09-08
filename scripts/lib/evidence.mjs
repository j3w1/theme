import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { gitFiles, listFiles, readJson, readText, repoRoot, sha256, stableJson } from "./fs.mjs";
import { evidenceSchema } from "../../schemas/evidence.mjs";

// Conservative invalidation: every tracked source/dependency input can affect
// every claim. Run metadata never participates in the source digest.
export const sourceFingerprint = async () => {
  const files = [...new Set(gitFiles())].filter((file) => /^(?:packages\/ui\/src\/|packages\/ui\/package\.json$|apps\/demo\/(?!dist\/|node_modules\/)|tokens\/|references\/|ports\/|templates\/|spec\/|schemas\/|scripts\/|site\/|tests\/|agents\/|\.github\/workflows\/|(?:theme\.json|package(?:-lock)?\.json|astro\.config\.mjs|playwright(?:\.verification|\.ui)?\.config\.mjs|AGENTS\.md|README\.md)$)/.test(file) && !file.startsWith("schemas/json/") && file !== "site/src/styles/tokens.generated.css");
  const digests = {};
  for (const file of files) digests[file] = sha256(await readText(file));
  return sha256(stableJson(digests));
};

export const artifactFiles = async () => {
  const files = {};
  for (const file of await listFiles("dist", { filter: (f) => !f.startsWith("dist/verification/") })) files[file.slice(5)] = sha256(await fs.readFile(path.join(repoRoot, file)));
  if (!files["index.html"]) throw new Error("Build the site before collecting evidence");
  return files;
};
export const artifactFingerprint = (files) => sha256(stableJson(files));
export const freshnessOf = (evidence, subject) => evidence.sourceDigest === subject.sourceDigest && evidence.artifactDigest === subject.artifactDigest ? "current" : "stale";
export const displayResult = (record, freshness) => freshness === "stale" ? `stale (${record.result})` : record.result;

export const validateEvidence = async (input) => {
  const evidence = evidenceSchema(z).parse(input);
  const coverage = await readJson("exports/coverage.json");
  const ids = new Set();
  for (const record of evidence.records) {
    if (ids.has(record.id)) throw new Error(`Duplicate evidence ID: ${record.id}`);
    ids.add(record.id);
    const { component, states, variants } = record.scope;
    if (component === "page") continue;
    if (!coverage.components[component]) throw new Error(`Unknown evidence component: ${component}`);
    const spec = await readJson(`exports/components/${component}.json`);
    if (states.some((s) => !spec.states.includes(s))) throw new Error(`Unknown state for ${component}`);
    if (variants.some((v) => !spec.variants.some((entry) => entry.id === v))) throw new Error(`Unknown variant for ${component}`);
  }
  return evidence;
};

export const subjectOfBuild = async () => {
  const subject = await readJson("dist/verification/subject.json");
  const current = { sourceDigest: await sourceFingerprint(), artifactDigest: artifactFingerprint(await artifactFiles()) };
  if (current.sourceDigest !== subject.sourceDigest || current.artifactDigest !== subject.artifactDigest) throw new Error("Source or specimen assets changed after the build; rebuild before recording evidence");
  return subject;
};
