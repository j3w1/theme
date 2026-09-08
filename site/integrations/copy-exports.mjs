/* After the build, copy the committed exports and the agent contract into
   dist/ so they are fetchable under /theme/. The copies are derived from the
   committed files; tests/dist/consistency.test.js asserts byte equality. */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { KIT_SHARED_FILES } from "../../scripts/lib/task-inputs-generator.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const copyDir = async (from, to) => {
  await fs.mkdir(to, { recursive: true });
  for (const entry of await fs.readdir(from, { withFileTypes: true })) {
    const source = path.join(from, entry.name);
    const target = path.join(to, entry.name);
    if (entry.isDirectory()) await copyDir(source, target);
    else await fs.copyFile(source, target);
  }
};

export default function copyExports() {
  return {
    name: "j3w1-copy-exports",
    hooks: {
      "astro:build:done": async ({ dir }) => {
        const out = fileURLToPath(dir);
        await copyDir(path.join(repoRoot, "exports"), path.join(out, "exports"));
        await copyDir(path.join(repoRoot, "packages/ui/dist"), path.join(out, "ui"));
        await copyDir(path.join(repoRoot, "apps/demo/dist"), path.join(out, "demo"));
        const release = JSON.parse(await fs.readFile(path.join(repoRoot, ".cache/packages/release.json"), "utf8"));
        await fs.mkdir(path.join(out, "downloads"), { recursive: true });
        await fs.copyFile(path.join(repoRoot, ".cache/packages", release.file), path.join(out, "downloads", release.file));
        await fs.copyFile(path.join(repoRoot, ".cache/packages/release.json"), path.join(out, "downloads/release.json"));
        await fs.mkdir(path.join(out, "agents"), { recursive: true });
        await fs.copyFile(path.join(repoRoot, "agents", "consume.md"), path.join(out, "agents", "consume.md"));
        await fs.copyFile(path.join(repoRoot, "theme.json"), path.join(out, "theme.json"));
        await fs.copyFile(path.join(repoRoot, "exports", "llms.txt"), path.join(out, "llms.txt"));
        const kitIndex = JSON.parse(await fs.readFile(path.join(repoRoot, "exports", "task-inputs.json"), "utf8"));
        const kitSources = new Set([...KIT_SHARED_FILES, ...Object.values(kitIndex.components).flatMap((entry) => entry.files)]);
        for (const relative of kitSources) {
          const target = path.join(out, relative);
          await fs.mkdir(path.dirname(target), { recursive: true });
          await fs.copyFile(path.join(repoRoot, relative), target);
        }
        await fs.writeFile(path.join(out, ".nojekyll"), "");
      },
    },
  };
}
