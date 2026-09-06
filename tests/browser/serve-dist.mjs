#!/usr/bin/env node
/* Serves dist/ only under the configured base path (/theme/) and answers 404
   for everything else, so any root-absolute link or runtime fetch that
   ignores the base fails loudly in the browser tests. Usage:
   node tests/browser/serve-dist.mjs [port] */

import { createServer } from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const manifest = JSON.parse(await fs.readFile(path.join(repoRoot, "theme.json"), "utf8"));
const base = `${manifest.site.base}/`;
const dist = path.join(repoRoot, "dist");
const port = Number(process.argv[2] ?? process.env.PORT ?? 4173);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${port}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === manifest.site.base) {
    res.writeHead(301, { location: base });
    res.end();
    return;
  }
  if (!pathname.startsWith(base)) {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end(`404 outside ${base}`);
    return;
  }
  let relative = pathname.slice(base.length);
  if (relative === "" || relative.endsWith("/")) relative += "index.html";
  const file = path.join(dist, relative);
  if (!file.startsWith(dist)) {
    res.writeHead(403);
    res.end();
    return;
  }
  try {
    const stat = await fs.stat(file);
    if (stat.isDirectory()) {
      res.writeHead(301, { location: `${pathname}/` });
      res.end();
      return;
    }
    const body = await fs.readFile(file);
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream", "cache-control": "no-store" });
    res.end(body);
  } catch {
    const notFound = path.join(dist, "404.html");
    try {
      const body = await fs.readFile(notFound);
      res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end("404");
    }
  }
});

server.listen(port, () => {
  console.log(`serving dist at http://localhost:${port}${base}`);
});
