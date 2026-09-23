/* The one static file server behind the built-site test server, the packed
   consumer server, the phase 6 review server and design mode. Every route
   resolves inside its root, every response says no-store, and a request
   that cannot be decoded gets a 400 instead of a rejected handler. */

import { promises as fs } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { resolveWithin } from "../lib/fs.mjs";

export const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".tgz": "application/gzip",
  ".woff2": "font/woff2",
};

export const contentType = (file) => MIME[path.extname(file)] ?? "application/octet-stream";

/* The request's decoded pathname, or null when it cannot be decoded. */
export const requestPath = (req, origin = "http://localhost") => {
  try {
    return decodeURIComponent(new URL(req.url ?? "/", origin).pathname);
  } catch {
    return null;
  }
};

export const send = (res, status, type, body = "", headers = {}) => {
  res.writeHead(status, { ...(type ? { "content-type": type } : {}), "cache-control": "no-store", ...headers });
  res.end(body);
};

/* Sends a file; `decorate(text, file)` may rewrite an HTML body first. */
export const sendFile = async (res, file, { headers = {}, decorate } = {}) => {
  const type = contentType(file);
  const bytes = await fs.readFile(file);
  const body = decorate && type.startsWith("text/html") ? Buffer.from(decorate(bytes.toString("utf8"), file)) : bytes;
  send(res, 200, type, body, headers);
};

export const listen = (server, port, host, label) => new Promise((resolve, reject) => {
  server.once("error", (error) => reject(new Error(`${label} cannot listen on ${port}: ${error.message}`)));
  server.listen(port, host, () => resolve(server));
});

/* A built site served only under its base path, the way Pages serves it:
   the bare base redirects to base/, anything outside answers 404, a
   directory redirects to its trailing slash, and "" or a trailing slash
   means index.html. `notFound(res, side)` answers what the tree lacks. */
export const serveTree = ({ root, base, decorate, notFound = (res) => send(res, 404, "text/plain; charset=utf-8", "404") }) => createServer(async (req, res) => {
  const pathname = requestPath(req);
  if (pathname === null) return send(res, 400, "text/plain; charset=utf-8", "400 undecodable path");
  if (pathname === base.slice(0, -1)) return send(res, 301, null, "", { location: base });
  if (!pathname.startsWith(base)) return send(res, 404, "text/plain", `404 outside ${base}`);
  let relative = pathname.slice(base.length);
  if (relative === "" || relative.endsWith("/")) relative += "index.html";
  const file = resolveWithin(root, relative);
  if (!file) return send(res, 403, null);
  try {
    if ((await fs.stat(file)).isDirectory()) return send(res, 301, null, "", { location: `${pathname}/` });
    await sendFile(res, file, { decorate });
  } catch {
    await notFound(res);
  }
});
