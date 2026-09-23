#!/usr/bin/env node
/* Serves dist/ only under the configured base path (/theme/) and answers 404
   for everything else, so any root-absolute link or runtime fetch that
   ignores the base fails loudly in the browser tests. Usage:
   node tests/browser/serve-dist.mjs [port] */

import { promises as fs } from "node:fs";
import path from "node:path";
import { readJson, repoRoot } from "../../scripts/lib/fs.mjs";
import { send, serveTree } from "../../scripts/tooling/static-server.mjs";

const manifest = await readJson("theme.json");
const base = `${manifest.site.base}/`;
const dist = path.join(repoRoot, "dist");
const port = Number(process.argv[2] ?? process.env.PORT ?? 4173);

const notFound = async (res) => {
  try {
    send(res, 404, "text/html; charset=utf-8", await fs.readFile(path.join(dist, "404.html")));
  } catch {
    send(res, 404, null, "404");
  }
};

serveTree({ root: dist, base, notFound }).listen(port, () => {
  console.log(`serving dist at http://localhost:${port}${base}`);
});
