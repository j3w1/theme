import { promises as fs } from "node:fs";
import path from "node:path";
import { sha256, stableJson } from "./fs.mjs";

export async function snapshotDirectory(root) {
  const files = {};
  const walk = async directory => {
    for (const entry of (await fs.readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name, "en"))) {
      const file = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error("Evidence fixtures cannot contain symlinks");
      if (entry.isDirectory()) await walk(file);
      else if (entry.isFile()) files[path.relative(root, file).split(path.sep).join("/")] = sha256(await fs.readFile(file));
    }
  };
  await walk(root);
  return { files, digest: sha256(stableJson(files)) };
}

export async function verifyConsumerSubject(subject) {
  const tarballDigest = sha256(await fs.readFile(subject.tarball));
  const fixtures = await snapshotDirectory(path.join(subject.root, "built"));
  if (tarballDigest !== subject.tarballDigest || fixtures.digest !== subject.fixtures.digest) throw new Error("Packed artifact or consumer fixture bytes changed; rebuild consumers before recording evidence");
  return { tarballDigest, fixturesDigest: fixtures.digest, files: Object.keys(fixtures.files).length };
}
