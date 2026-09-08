import { promises as fs } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
const { root } = JSON.parse(await fs.readFile(".cache/ui-consumers.json", "utf8"));
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json" };
createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://localhost");
    const pathname = decodeURIComponent(url.pathname);
    if (pathname.includes("\\") || pathname.includes("\0") || pathname.split("/").includes("..")) throw new Error();
    const kind = ["astro", "copy", "basic", "kit"].find(name => pathname.startsWith(`/${name}/`)) ?? "web";
    const base = path.join(root, "built", kind);
    const relative = kind === "web" ? pathname : pathname.slice(kind.length + 1);
    const file = path.resolve(base, `.${relative}${relative.endsWith("/") ? "index.html" : ""}`);
    if (!file.startsWith(base + path.sep)) throw new Error();
    response.setHeader("Content-Type", types[path.extname(file)] ?? "application/octet-stream");
    response.end(await fs.readFile(file));
  } catch { response.writeHead(404); response.end("Not found"); }
}).listen(4187, "127.0.0.1");
