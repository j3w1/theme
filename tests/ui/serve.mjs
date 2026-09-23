import { promises as fs } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { resolveWithin } from "../../scripts/lib/fs.mjs";
import { requestPath, send, sendFile } from "../../scripts/tooling/static-server.mjs";
const { root } = JSON.parse(await fs.readFile(".cache/ui-consumers.json", "utf8"));
createServer(async (request, response) => {
  try {
    const pathname = requestPath(request);
    if (pathname === null) throw new Error();
    const kind = ["astro", "copy", "basic", "kit"].find(name => pathname.startsWith(`/${name}/`)) ?? "web";
    const relative = kind === "web" ? pathname : pathname.slice(kind.length + 1);
    const file = resolveWithin(path.join(root, "built", kind), `.${relative}${relative.endsWith("/") ? "index.html" : ""}`);
    if (!file) throw new Error();
    await sendFile(response, file);
  } catch { send(response, 404, null, "Not found"); }
}).listen(4187, "127.0.0.1");
