#!/usr/bin/env node
/* Local design mode: the published site rendered twice behind one comparison
   screen. "Before" is a frozen production build of the commit the session
   started from; "after" is the live dev server. Judging a theme change against
   what it replaces is the whole point, so both sides are the real site — not a
   synthetic preview and not a screenshot.

   The site is confirmation-only (theme.json): it never carries a value that is
   not in tokens/ or spec/. Design mode therefore edits the canonical sources
   and regenerates the generated artifacts, rather than letting a colour live in a
   hand-written rule. The session ledger records where each change belongs so
   the exit pass can reconcile it into the specification.

   The testable units live in scripts/tooling/design-mode.mjs; this file wires
   them to the real servers, processes and file system.

   Usage:
     node scripts/design-mode.mjs                enter design mode
     node scripts/design-mode.mjs --baseline     re-anchor "before" to the working tree
     node scripts/design-mode.mjs --note "..."   append a change to the ledger
     node scripts/design-mode.mjs --exit         print the parsed session report */

import { promises as fs, watch } from "node:fs";
import { createServer } from "node:http";
import { connect as netConnect } from "node:net";
import { spawn } from "node:child_process";
import path from "node:path";
import { dev } from "astro";
import { repoRoot, readJson, readText, resolveWithin } from "./lib/fs.mjs";
import { loadProfiles, toResolvedExport } from "./lib/tokens.mjs";
import { tokensGenerator } from "./lib/generators.mjs";
import { decorateHexHtml } from "./lib/hex-html.mjs";
import { tokenColorIndex } from "./lib/hex-literals.mjs";
import { hexIndexForRoute } from "./lib/hex-routes.mjs";
import { controlsCss } from "./lib/ui-distribution.mjs";
import { parseArgs, runCli } from "./tooling/cli.mjs";
import { head, branch, isDirty } from "./tooling/git.mjs";
import { contentType, listen, requestPath, send, sendFile, serveTree } from "./tooling/static-server.mjs";
import { createLedger, derivePorts, discoverRoutes, formatReport, injectAgent, readBaselineMeta, routeOf, writeBaselineMeta } from "./tooling/design-mode.mjs";

const cache = path.join(repoRoot, ".cache/design-mode");
const baselineDir = path.join(cache, "baseline");
const toolDir = path.join(repoRoot, "tools/design-mode");
const uiDir = path.join(repoRoot, "packages/ui/dist");

const manifest = await readJson("theme.json");
const base = `${manifest.site.base}/`;
const ports = derivePorts();

const ledger = createLedger({ file: path.join(cache, "session.json"), git: { head, branch } });

const run = (command, args, options = {}) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { cwd: repoRoot, stdio: "inherit", shell: process.platform === "win32", ...options });
  child.on("error", reject);
  child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${command} ${args.join(" ")} exited ${code}`))));
});

/* The build is ~3600 files. Copying them one awaited file at a time took about
   two minutes, which reads as a hang; fs.cp does the whole tree natively.
   Staging beside the live baseline and swapping also means the frozen side
   keeps serving the previous build for the whole copy, instead of answering
   404 through it. */
const replaceBaseline = async () => {
  const staging = `${baselineDir}.next`;
  await fs.rm(staging, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  await fs.cp(path.join(repoRoot, "dist"), staging, { recursive: true, force: true });
  await fs.rm(baselineDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  await fs.rename(staging, baselineDir);
};

/* ---- baseline ---------------------------------------------------------- */

/* null when idle, otherwise the phase the comparison screen reports, so a
   three-minute re-anchor looks like work rather than a hang. */
let baselinePhase = null;

/* "Before" is whatever it was last anchored to, and it stays there until the
   owner moves it. It deliberately does not follow HEAD: a session takes a
   checkpoint commit after every accepted change, and rebuilding the reference
   each time would both destroy what is being compared against and put a
   minute of build in the middle of the loop. baseline.json records the commit
   it came from, so the screen can say what "before" actually is. */
export const ensureBaseline = async ({ force = false } = {}) => {
  const meta = await readBaselineMeta(cache);
  const commit = head();
  const present = await fs.access(path.join(baselineDir, "index.html")).then(() => true).catch(() => false);
  if (!force && meta && present) {
    console.log(`design mode: before is anchored at ${meta.commit?.slice(0, 12) ?? "the working tree"}${meta.dirty ? " + working tree" : ""} (npm run design:baseline to move it)`);
    return meta;
  }
  baselinePhase = "building";
  try {
    console.log("design mode: building the baseline (npm run build) — the one slow step");
    await run("npm", ["run", "build"]);
    baselinePhase = "copying";
    await replaceBaseline();
    const next = { commit, dirty: isDirty(), anchoredAt: new Date().toISOString() };
    await writeBaselineMeta(cache, next);
    console.log(`design mode: baseline anchored at ${commit?.slice(0, 12) ?? "the working tree"}`);
    return next;
  } finally { baselinePhase = null; }
};

/* ---- token stylesheet -------------------------------------------------- */

let colorIndex = {};

/* tokens.generated.css and exports/tokens.resolved.json are generated
   artifacts, so a colour change edits tokens/ and regenerates. The real tokens
   generator runs, because the page prints token hexes read back out of the
   exports: writing only the stylesheet would repaint the swatch while its
   printed value still claimed the old hex.

   What this skips is validation and the other fourteen generators. npm run
   generate at exit is what brings contrast, usage, the README blocks and the
   digests back into line, and npm run check is what proves it. */
export const regenerateTokens = async () => {
  const profiles = await loadProfiles(manifest);
  const defaultId = manifest.profiles.find((p) => p.default).id;
  const { changed } = await tokensGenerator.run({ manifest, profiles, defaultId, check: false });
  colorIndex = tokenColorIndex(Object.fromEntries(manifest.profiles.map((p) => [p.id, { tokens: toResolvedExport(profiles.get(p.id), p) }])));
  return changed ?? [];
};

/* ---- themed controls --------------------------------------------------- */

/* The package's controls stylesheet is generated from the canonical one, and
   npm run ui:build regenerates all 67 component distributions to get there —
   35 seconds for a change to one shared file, which is not a design loop.
   controlsCss is the expression build-ui.mjs uses, so the bytes match, and it
   costs milliseconds. Both the previewed site and this screen load the
   package's copy, so rewriting it is what makes a themed-control change show
   up on both sides without a build. */
export const regenerateControls = async () => {
  const css = controlsCss(await readText("site/src/styles/recipe-foundation.css"), await readText("site/src/styles/themed-controls.css"));
  const file = path.join(uiDir, "styles/controls.css");
  const current = await fs.readFile(file, "utf8").then((text) => text.replaceAll("\r\n", "\n")).catch(() => null);
  if (current !== css) await fs.writeFile(file, css);
  return current !== css;
};

/* ---- the frozen side --------------------------------------------------- */

const NOT_IN_BASELINE = '<!doctype html><meta charset="utf-8"><title>Not in the baseline</title><body style="font:14px system-ui;padding:24px"><p>This route is not in the frozen build. It is probably new in the working tree.</p></body>';

/* Already decorated by the build; it only needs the agent. */
const serveBaseline = () => serveTree({
  root: baselineDir,
  base,
  decorate: (html) => injectAgent(html, "before"),
  notFound: (res) => send(res, 404, "text/html; charset=utf-8", injectAgent(NOT_IN_BASELINE, "before")),
});

/* ---- the live side ----------------------------------------------------- */

/* Every Astro integration in this repository hooks astro:build:done, so under
   astro dev the ui/, demo/, exports/ and downloads/ trees are missing and the
   inline hex previews are never applied. Both would read as differences the
   session did not cause, so the proxy closes them: it applies the same
   decoration the build applies, and falls back to the frozen build for
   anything the dev server cannot answer. */
const serveLive = () => createServer(async (req, res) => {
  const pathname = requestPath(req, `http://localhost:${ports.after}`);
  if (pathname === null) return send(res, 400, "text/plain; charset=utf-8", "400 undecodable path");
  if (pathname === manifest.site.base) return send(res, 301, null, "", { location: base });
  /* The built site answers only under /theme/, and the frozen side still holds
     to that. A dev server does not: it serves its stylesheets, its module
     graph and its HMR client from root paths such as /site/src/styles/base.css
     and /@vite/client. Refusing those left the live frame with no hot reload
     at all, which is the whole reason it is the live side. */
  const inSite = pathname.startsWith(base);
  const relative = inSite ? routeOf(pathname, base) : null;
  const url = new URL(req.url ?? "/", `http://localhost:${ports.after}`);

  let upstream = null;
  try {
    upstream = await fetch(`http://127.0.0.1:${ports.dev}${url.pathname}${url.search}`, { headers: { accept: req.headers.accept ?? "*/*" }, redirect: "manual" });
  } catch { upstream = null; }

  if (upstream && upstream.status >= 300 && upstream.status < 400 && upstream.headers.get("location")) {
    res.writeHead(upstream.status, { location: upstream.headers.get("location") });
    res.end();
    return;
  }

  if (upstream?.ok) {
    const type = upstream.headers.get("content-type") ?? (relative ? contentType(relative) : "application/octet-stream");
    if (type.includes("text/html")) {
      const index = relative ? hexIndexForRoute(relative, colorIndex) : null;
      const html = await upstream.text();
      return send(res, 200, "text/html; charset=utf-8", injectAgent(index ? decorateHexHtml(html, index) : html, "after"));
    }
    return send(res, 200, type, Buffer.from(await upstream.arrayBuffer()));
  }

  /* The package is a working-tree artifact the session edits, so /theme/ui/
     comes from packages/ui/dist rather than the frozen build. Falling back to
     the baseline here meant every component stylesheet the custom elements
     load stayed at the session's starting bytes, and a rebuilt component never
     appeared on the live side at all. */
  if (inSite && relative.startsWith("ui/")) {
    const asset = resolveWithin(uiDir, relative.slice(3));
    if (asset) {
      try { return await sendFile(res, asset); } catch { /* not in the package either; fall through */ }
    }
  }

  /* Only the site's own tree has a frozen counterpart to fall back to. */
  const file = inSite ? resolveWithin(baselineDir, relative) : null;
  if (file) {
    try { return await sendFile(res, file, { headers: { "x-design-mode": "baseline-fallback" }, decorate: (html) => injectAgent(html, "after") }); } catch { /* neither side has it */ }
  }
  send(res, upstream?.status ?? 502, "text/plain; charset=utf-8", `Neither the dev server nor the frozen build answered ${pathname}`);
});

/* Vite's HMR client opens a socket back to the origin that served the page,
   which is this proxy rather than the dev server. Without the upgrade being
   carried across, the client retries forever and nothing hot-reloads. */
const proxyHmr = (server) => server.on("upgrade", (req, socket, headBytes) => {
  const upstream = netConnect({ host: "127.0.0.1", port: ports.dev }, () => {
    upstream.write(`${req.method} ${req.url} HTTP/1.1\r\n${Object.entries(req.headers).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join("\r\n")}\r\n\r\n`);
    if (headBytes?.length) upstream.write(headBytes);
    upstream.pipe(socket);
    socket.pipe(upstream);
  });
  const drop = () => { socket.destroy(); upstream.destroy(); };
  upstream.on("error", drop);
  socket.on("error", drop);
});

/* ---- comparison screen ------------------------------------------------- */

const serveCompare = () => createServer(async (req, res) => {
  const pathname = requestPath(req, `http://localhost:${ports.compare}`);
  if (pathname === null) return send(res, 400, "text/plain; charset=utf-8", "400 undecodable path");
  try {
    if (pathname === "/api/state") {
      const session = await ledger.read();
      return send(res, 200, "application/json; charset=utf-8", JSON.stringify({
        base, before: `http://localhost:${ports.before}`, after: `http://localhost:${ports.after}`,
        routes: await discoverRoutes(baselineDir), baseline: await readBaselineMeta(cache), baselineBuilding: baselinePhase !== null, baselinePhase,
        ledger: session?.entries ?? [], branch: session?.branch ?? null, version: manifest.version,
      }));
    }
    if (pathname === "/api/baseline" && req.method === "POST") {
      if (!baselinePhase) ensureBaseline({ force: true }).catch((error) => console.error(`design mode: baseline failed — ${error.message}`));
      return send(res, 202, "application/json; charset=utf-8", JSON.stringify({ building: true }));
    }
    /* The site's stylesheet rather than exports/tokens.css: only this one
       carries the [data-density] blocks the themed controls size from. */
    if (pathname === "/tokens.css") return send(res, 200, "text/css; charset=utf-8", await fs.readFile(path.join(repoRoot, "site/src/styles/tokens.generated.css")));
    /* The comparison screen is built from the theme's own controls, so it
       serves the package the same way copy-exports puts it under dist/ui. */
    if (pathname.startsWith("/ui/")) {
      const asset = resolveWithin(uiDir, pathname.slice(4));
      if (!asset) return send(res, 403, "text/plain", "Outside the package");
      return await sendFile(res, asset);
    }
    const target = resolveWithin(toolDir, pathname === "/" ? "screen.html" : path.basename(pathname));
    if (!target) return send(res, 403, "text/plain", "Outside the tool");
    return await sendFile(res, target);
  } catch { return send(res, 404, "text/plain", "Design mode route not found"); }
});

/* ---- entry ------------------------------------------------------------- */

/* Astro's own `astro dev` cannot start this project: the CLI forks the dev
   server and gives it 30s to report ready, and syncing 67 component
   collections takes longer than that on a cold cache. The JS API runs the
   server in this process instead, with no such deadline. */
const startDev = async () => {
  console.log("design mode: starting the dev server (the first content sync takes about a minute)");
  const server = await dev({ root: repoRoot, server: { port: ports.dev, host: "127.0.0.1" }, logLevel: "warn" });
  const stop = () => { server.stop?.().catch(() => {}); };
  process.on("SIGINT", () => { stop(); process.exit(0); });
  process.on("exit", stop);
  return server;
};

/* Debounced so an editor's write-then-rename does not run it twice. */
const watchFor = (dir, task, label) => {
  let pending = null;
  watch(path.join(repoRoot, dir), { recursive: true }, (event, name) => {
    if (name && !task.matches(String(name))) return;
    clearTimeout(pending);
    pending = setTimeout(() => {
      task.go()
        .then((changed) => { if (changed) console.log(`design mode: ${label}`); })
        .catch((error) => console.error(`design mode: ${label} failed — ${error.message}`));
    }, 120);
  });
};

const watchSources = () => {
  watchFor("tokens", { matches: () => true, go: async () => (await regenerateTokens()).join(", ") }, "regenerated the token stylesheet and exports");
  /* Only the two files controls.css is built from; every other stylesheet
     under site/src is served straight to the dev server and needs nothing. */
  watchFor("site/src/styles", {
    matches: (name) => name.endsWith("themed-controls.css") || name.endsWith("recipe-foundation.css"),
    go: async () => (await regenerateControls()) && "rebuilt the themed controls stylesheet",
  }, "rebuilt the themed controls stylesheet");
};

const enter = async () => {
  await ensureBaseline();
  await regenerateTokens();
  await regenerateControls();
  await ledger.init();

  await listen(serveBaseline(), ports.before, "127.0.0.1", "The frozen side");
  proxyHmr(await listen(serveLive(), ports.after, "127.0.0.1", "The live side"));
  await listen(serveCompare(), ports.compare, "127.0.0.1", "The comparison screen");
  await startDev();
  watchSources();

  console.log(`\ndesign mode: http://localhost:${ports.compare}/\n  before  http://localhost:${ports.before}${base}\n  after   http://localhost:${ports.after}${base}\nStop with Ctrl+C.\n`);
};

if (process.argv[1] && path.resolve(process.argv[1]) === path.join(repoRoot, "scripts/design-mode.mjs")) {
  await runCli(async () => {
    const { values } = parseArgs({ options: {
      exit: { type: "boolean", default: false }, baseline: { type: "boolean", default: false },
      note: { type: "string" }, class: { type: "string" }, files: { type: "string" },
    } });
    if (values.exit) console.log(formatReport(await ledger.read()).join("\n"));
    else if (values.note !== undefined || values.class !== undefined || values.files !== undefined) {
      const session = await ledger.append({ note: values.note, changeClass: values.class, files: values.files?.split(",").map((file) => file.trim()).filter(Boolean) });
      console.log(`recorded change ${session.entries.length} (${session.entries.at(-1).changeClass})`);
    } else if (values.baseline) await ensureBaseline({ force: true });
    else await enter();
  });
}
