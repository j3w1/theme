import { mkdir, writeFile } from "node:fs/promises";
import { publishedComparisons } from "../../scripts/lib/release-rendering.mjs";
import { comparisonMarkdown } from "../../scripts/lib/release-comparison.mjs";
import { stableJson } from "../../scripts/lib/fs.mjs";

export default function releaseComparisons() {
  return { name: "j3w1-release-comparisons", hooks: {
    "astro:config:setup": ({ updateConfig }) => {
      const id = "virtual:j3w1-release-comparisons";
      updateConfig({ vite: { plugins: [{
        name: "j3w1-prepared-release-data",
        resolveId(source) { if (source === id) return `\0${id}`; },
        async load(source) {
          if (source !== `\0${id}`) return;
          const data = await publishedComparisons();
          const side = (entry) => ({ pin: entry.pin, profile: entry.profile, snapshot: { tokens: { "font.family.mono": entry.snapshot.tokens["font.family.mono"] } }, specimens: { cases: entry.specimens.cases, unavailable: entry.specimens.unavailable } });
          // Supply data, never a bundled filesystem loader or historical code.
          return `export default ${JSON.stringify({ catalogue: data.catalogue, comparisons: data.comparisons.map((entry) => ({ path: entry.path, report: entry.report, from: side(entry.from), to: side(entry.to) })) })};`;
        },
      }] } });
    },
    "astro:build:done": async ({ dir }) => {
    const { snapshots, comparisons } = await publishedComparisons();
    const write = async (path, text) => { const file = new URL(`releases/${path}`, dir); await mkdir(new URL(".", file), { recursive: true }); await writeFile(file, text); };
    for (const entry of snapshots) {
      const prefix = `specimens/${entry.pin.id}/${entry.profile}`;
      for (const [name, text] of Object.entries(entry.specimens.files)) await write(`${prefix}/${name}`, text);
      await write(`${prefix}/index.json`, stableJson({ schemaVersion: 1, revision: entry.snapshot.metadata.revision, profile: entry.profile, cases: entry.specimens.cases, unavailable: entry.specimens.unavailable }));
    }
    for (const entry of comparisons) {
      await write(`${entry.path}/comparison.json`, stableJson(entry.report));
      await write(`${entry.path}/comparison.md`, comparisonMarkdown(entry.report));
    }
  } } };
}
