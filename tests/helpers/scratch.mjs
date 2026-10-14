/* Temporary directories for tests that write real files. Both helpers create
   the directory with mkdtemp under the OS tmpdir and remove exactly that
   directory afterwards, never a path a caller could point elsewhere. */

import { mkdtempSync, rmSync } from "node:fs";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

const assertScratch = root => {
  if (!path.resolve(root).startsWith(path.resolve(os.tmpdir()) + path.sep)) throw new Error(`Scratch directory escaped the tmpdir: ${root}`);
};
const remove = async root => {
  assertScratch(root);
  await fs.rm(root, { recursive: true, force: true });
};

export const scratchDirSync = (t, prefix) => {
  const root = mkdtempSync(path.join(os.tmpdir(), prefix));
  t.after(() => {
    assertScratch(root);
    rmSync(root, { recursive: true, force: true });
  });
  return root;
};

/* Runs `fn(root)` and removes `root` when it settles. */
export const withScratch = async (prefix, fn) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  try {
    return await fn(root);
  } finally {
    await remove(root);
  }
};

/* For node:test cases that keep `root` across the whole test body: removal
   is registered with `t.after`. */
export const scratchDir = async (t, prefix) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  t.after(() => remove(root));
  return root;
};
