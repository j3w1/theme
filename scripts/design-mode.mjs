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

   Usage:
     node scripts/design-mode.mjs                enter design mode
     node scripts/design-mode.mjs --baseline     re-anchor "before" to the working tree
     node scripts/design-mode.mjs --note "..."   append a change to the ledger
     node scripts/design-mode.mjs --exit         print the parsed session report */

import { promises as fs, watch } from "node:fs";
import { createServer } from "node:http";
import { connect as netConnect } from "node:net";
import { spawn, execFileSync } from "node:child_process";
import path from "node:path";
import { dev } from "astro";
import { repoRoot, readJson, readText } from "./lib/fs.mjs";
import { scopeRecipeCss, RECIPE_SCOPE } from "./lib/recipe-css.mjs";
import { loadResolvedProfile, toResolvedExport } from "./lib/tokens.mjs";
import { tokensGenerator } from "./lib/generators.mjs";
import { decorateHexHtml } from "./lib/hex-html.mjs";
import { tokenColorIndex } from "./lib/hex-literals.mjs";

const cache = path.join(repoRoot, ".cache/design-mode");
const baselineDir = path.join(cache, "baseline");
const ledgerFile = path.join(cache, "session.json");
const toolDir = path.join(repoRoot, "tools/design-mode");
const uiDir = path.join(repoRoot, "packages/ui/dist");

const manifest = await readJson("theme.json");
const base = `${manifest.site.base}/`;

const port = Number(process.env.DESIGN_PORT ?? 4400);
if (!Number.isInteger(port) || port < 1024 || port > 65000) throw new Error("DESIGN_PORT must be an integer between 1024 and 65000");
const beforePort = port + 1;
const afterPort = port + 2;
const devPort = Number(process.env.DESIGN_DEV_PORT ?? port + 3);

const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".ico": "image/x-icon",
  ".tgz": "application/gzip", ".map": "application/json; charset=utf-8", ".woff2": "font/woff2" };

/* The routes the build-time hex integration decorates, so the live side shows
   the same inline previews (D-014) the frozen side already has. */
const DECORATED = ["", "reference/", "tokens/", "ports/", "recipes/", "kit/", "workbench/", "preview/", "components/",
  "foundations/", "tools/", "patterns/", "builder/", "figma/", "implement/", "agents/"];

const run = (command, args, options = {}) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { cwd: repoRoot, stdio: "inherit", shell: process.platform === "win32", ...options });
  child.on("error", reject);
  child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${command} ${args.join(" ")} exited ${code}`))));
});

const git = (...args) => execFileSync("git", args, { cwd: repoRoot, encoding: "utf8" }).trim();
const safeGit = (...args) => { try { return git(...args); } catch { return null; } };
const head = () => safeGit("rev-parse", "HEAD");
const workingTreeDirty = () => (safeGit("status", "--porcelain") ?? "").length > 0;

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

/* ---- session ledger ---------------------------------------------------- */

export const CHANGE_CLASSES = ["page-local", "token", "spec-rule", "component", "copy/identity"];

const emptyLedger = () => ({ schemaVersion: 1, startedAt: new Date().toISOString(), startCommit: head(), branch: safeGit("rev-parse", "--abbrev-ref", "HEAD"), entries: [] });

export const readLedger = async () => {
  try { return JSON.parse(await fs.readFile(ledgerFile, "utf8")); } catch { return null; }
};

const writeLedger = async (ledger) => {
  await fs.mkdir(cache, { recursive: true });
  await fs.writeFile(ledgerFile, `${JSON.stringify(ledger, null, 2)}\n`);
};

export const appendNote = async ({ note, changeClass, files }) => {
  if (!note) throw new Error("--note needs the change described in the owner's own words");
  if (changeClass && !CHANGE_CLASSES.includes(changeClass)) throw new Error(`--class must be one of ${CHANGE_CLASSES.join(", ")}`);
  const ledger = (await readLedger()) ?? emptyLedger();
  ledger.entries.push({ at: new Date().toISOString(), note, changeClass: changeClass ?? "unclassified", files: files ?? [], commit: head() });
  await writeLedger(ledger);
  return ledger;
};

/* ---- baseline ---------------------------------------------------------- */

const baselineMeta = async () => {
  try { return JSON.parse(await fs.readFile(path.join(cache, "baseline.json"), "utf8")); } catch { return null; }
};

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
  const meta = await baselineMeta();
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
    const next = { commit, dirty: workingTreeDirty(), anchoredAt: new Date().toISOString() };
    await fs.mkdir(cache, { recursive: true });
    await fs.writeFile(path.join(cache, "baseline.json"), `${JSON.stringify(next, null, 2)}\n`);
    console.log(`design mode: baseline anchored at ${commit?.slice(0, 12) ?? "the working tree"}`);
    return next;
  } finally { baselinePhase = null; }
};

/* ---- token stylesheet -------------------------------------------------- */

const loadProfiles = async () => {
  const profiles = new Map();
  for (const profile of manifest.profiles) profiles.set(profile.id, await loadResolvedProfile(profile.tokens));
  return { profiles, defaultId: manifest.profiles.find((p) => p.default).id };
};

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
  const { profiles, defaultId } = await loadProfiles();
  const { changed } = await tokensGenerator.run({ manifest, profiles, defaultId, check: false });
  colorIndex = tokenColorIndex(Object.fromEntries(manifest.profiles.map((p) => [p.id, { tokens: toResolvedExport(profiles.get(p.id), p) }])));
  return changed ?? [];
};

/* ---- themed controls --------------------------------------------------- */

/* The package's controls stylesheet is generated from the canonical one, and
   npm run ui:build regenerates all 67 component distributions to get there —
   35 seconds for a change to one shared file, which is not a design loop.
   This is the same expression build-ui.mjs uses, so the bytes match, and it
   costs milliseconds. Both the previewed site and this screen load the
   package's copy, so rewriting it is what makes a themed-control change show
   up on both sides without a build. */
export const regenerateControls = async () => {
  const css = scopeRecipeCss(`${await readText("site/src/styles/recipe-foundation.css")}\n${await readText("site/src/styles/themed-controls.css")}`)
    .replaceAll(RECIPE_SCOPE, "[data-j3w1-controls]");
  const file = path.join(uiDir, "styles/controls.css");
  const current = await fs.readFile(file, "utf8").then((text) => text.replaceAll("\r\n", "\n")).catch(() => null);
  if (current !== css) await fs.writeFile(file, css);
  return current !== css;
};

/* ---- frame agent ------------------------------------------------------- */

/* The two sides are separate origins so every internal link, asset and runtime
   fetch resolves exactly as it does in production. Cross-origin means the
   frames cannot read each other, so each carries a small agent that relays its
   scroll position and route through the comparison screen. */
const agentScript = (side) => `<script>(function(){
var side=${JSON.stringify(side)},lock=0;
function post(m){m.j3w1design=true;m.side=side;try{parent.postMessage(m,"*")}catch(e){}}
function span(){return Math.max(1,document.documentElement.scrollHeight-innerHeight)}
addEventListener("scroll",function(){if(lock)return;post({type:"scroll",ratio:scrollY/span()})},{passive:true});
addEventListener("message",function(e){var d=e.data;if(!d||!d.j3w1design||d.side===side)return;
if(d.type==="scroll"){lock=1;scrollTo(0,d.ratio*span());requestAnimationFrame(function(){lock=0})}});
post({type:"ready",path:location.pathname,title:document.title});
})();</script>`;

const injectAgent = (html, side) => (html.includes("</body>")
  ? html.replace("</body>", () => `${agentScript(side)}</body>`)
  : html + agentScript(side));

const routeOf = (pathname) => {
  let relative = pathname.slice(base.length);
  if (relative === "" || relative.endsWith("/")) relative += "index.html";
  return relative;
};

/* ---- the frozen side --------------------------------------------------- */

const serveBaseline = () => createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${beforePort}`);
  const pathname = decodeURIComponent(url.pathname);
  if (pathname === manifest.site.base) { res.writeHead(301, { location: base }); res.end(); return; }
  if (!pathname.startsWith(base)) { res.writeHead(404, { "content-type": "text/plain" }); res.end(`404 outside ${base}`); return; }
  const file = path.join(baselineDir, routeOf(pathname));
  if (!file.startsWith(baselineDir)) { res.writeHead(403); res.end(); return; }
  try {
    const stat = await fs.stat(file);
    if (stat.isDirectory()) { res.writeHead(301, { location: `${pathname}/` }); res.end(); return; }
    const type = TYPES[path.extname(file)] ?? "application/octet-stream";
    /* Already decorated by the build; it only needs the agent. */
    const body = type.startsWith("text/html") ? Buffer.from(injectAgent(await fs.readFile(file, "utf8"), "before")) : await fs.readFile(file);
    res.writeHead(200, { "content-type": type, "cache-control": "no-store" });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
    res.end(injectAgent('<!doctype html><meta charset="utf-8"><title>Not in the baseline</title><body style="font:14px system-ui;padding:24px"><p>This route is not in the frozen build. It is probably new in the working tree.</p></body>', "before"));
  }
});

/* ---- the live side ----------------------------------------------------- */

/* Every Astro integration in this repository hooks astro:build:done, so under
   astro dev the ui/, demo/, exports/ and downloads/ trees are missing and the
   inline hex previews are never applied. Both would read as differences the
   session did not cause, so the proxy closes them: it applies the same
   decoration the build applies, and falls back to the frozen build for
   anything the dev server cannot answer. */
const hexIndexFor = (relative) => {
  if (relative.includes("/specimens/")) return null;
  /* Historical literals keep their exact fill without today's token matches. */
  if (relative.startsWith("releases/")) return {};
  const route = relative.replace(/index\.html$/, "");
  return DECORATED.some((prefix) => route === prefix || (prefix && route.startsWith(prefix))) ? colorIndex : null;
};

const serveLive = () => createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${afterPort}`);
  const pathname = decodeURIComponent(url.pathname);
  if (pathname === manifest.site.base) { res.writeHead(301, { location: base }); res.end(); return; }
  /* The built site answers only under /theme/, and the frozen side still holds
     to that. A dev server does not: it serves its stylesheets, its module
     graph and its HMR client from root paths such as /site/src/styles/base.css
     and /@vite/client. Refusing those left the live frame with no hot reload
     at all, which is the whole reason it is the live side. */
  const inSite = pathname.startsWith(base);
  const relative = inSite ? routeOf(pathname) : null;

  let upstream = null;
  try {
    upstream = await fetch(`http://127.0.0.1:${devPort}${url.pathname}${url.search}`, { headers: { accept: req.headers.accept ?? "*/*" }, redirect: "manual" });
  } catch { upstream = null; }

  if (upstream && upstream.status >= 300 && upstream.status < 400 && upstream.headers.get("location")) {
    res.writeHead(upstream.status, { location: upstream.headers.get("location") });
    res.end();
    return;
  }

  if (upstream?.ok) {
    const type = upstream.headers.get("content-type") ?? (relative && TYPES[path.extname(relative)]) ?? "application/octet-stream";
    if (type.includes("text/html")) {
      const index = relative ? hexIndexFor(relative) : null;
      const html = await upstream.text();
      res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
      res.end(injectAgent(index ? decorateHexHtml(html, index) : html, "after"));
      return;
    }
    res.writeHead(200, { "content-type": type, "cache-control": "no-store" });
    res.end(Buffer.from(await upstream.arrayBuffer()));
    return;
  }

  /* The package is a working-tree artifact the session edits, so /theme/ui/
     comes from packages/ui/dist rather than the frozen build. Falling back to
     the baseline here meant every component stylesheet the custom elements
     load stayed at the session's starting bytes, and a rebuilt component never
     appeared on the live side at all. */
  if (inSite && relative.startsWith("ui/")) {
    const asset = path.resolve(uiDir, `./${relative.slice(3)}`);
    if (asset.startsWith(`${uiDir}${path.sep}`)) {
      try {
        res.writeHead(200, { "content-type": TYPES[path.extname(asset)] ?? "application/octet-stream", "cache-control": "no-store" });
        res.end(await fs.readFile(asset));
        return;
      } catch { /* not in the package either; fall through */ }
    }
  }

  /* Only the site's own tree has a frozen counterpart to fall back to. */
  const file = inSite ? path.join(baselineDir, relative) : null;
  if (file && file.startsWith(baselineDir)) {
    try {
      const type = TYPES[path.extname(file)] ?? "application/octet-stream";
      const body = type.startsWith("text/html") ? Buffer.from(injectAgent(await fs.readFile(file, "utf8"), "after")) : await fs.readFile(file);
      res.writeHead(200, { "content-type": type, "cache-control": "no-store", "x-design-mode": "baseline-fallback" });
      res.end(body);
      return;
    } catch { /* neither side has it */ }
  }
  res.writeHead(upstream?.status ?? 502, { "content-type": "text/plain; charset=utf-8" });
  res.end(`Neither the dev server nor the frozen build answered ${pathname}`);
});

/* Vite's HMR client opens a socket back to the origin that served the page,
   which is this proxy rather than the dev server. Without the upgrade being
   carried across, the client retries forever and nothing hot-reloads. */
const proxyHmr = (server) => server.on("upgrade", (req, socket, head) => {
  const upstream = netConnect({ host: "127.0.0.1", port: devPort }, () => {
    upstream.write(`${req.method} ${req.url} HTTP/1.1\r\n${Object.entries(req.headers).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join("\r\n")}\r\n\r\n`);
    if (head?.length) upstream.write(head);
    upstream.pipe(socket);
    socket.pipe(upstream);
  });
  const drop = () => { socket.destroy(); upstream.destroy(); };
  upstream.on("error", drop);
  socket.on("error", drop);
});

/* ---- comparison screen ------------------------------------------------- */

const discoverRoutes = async () => {
  const skip = new Set(["ui", "demo", "downloads", "exports", "schemas", "spec", "verification", "_astro", "specimens", "report"]);
  const routes = [""];
  try {
    for (const entry of await fs.readdir(baselineDir, { withFileTypes: true })) {
      if (!entry.isDirectory() || skip.has(entry.name)) continue;
      try { await fs.access(path.join(baselineDir, entry.name, "index.html")); routes.push(`${entry.name}/`); } catch { /* not a page */ }
    }
  } catch { /* no baseline yet */ }
  return routes;
};

const serveCompare = () => createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${port}`);
  const send = (code, type, body) => { res.writeHead(code, { "content-type": type, "cache-control": "no-store" }); res.end(body); };
  try {
    if (url.pathname === "/api/state") {
      const ledger = await readLedger();
      return send(200, "application/json; charset=utf-8", JSON.stringify({
        base, before: `http://localhost:${beforePort}`, after: `http://localhost:${afterPort}`,
        routes: await discoverRoutes(), baseline: await baselineMeta(), baselineBuilding: baselinePhase !== null, baselinePhase,
        ledger: ledger?.entries ?? [], branch: ledger?.branch ?? null, version: manifest.version,
      }));
    }
    if (url.pathname === "/api/baseline" && req.method === "POST") {
      if (!baselinePhase) ensureBaseline({ force: true }).catch((error) => console.error(`design mode: baseline failed — ${error.message}`));
      return send(202, "application/json; charset=utf-8", JSON.stringify({ building: true }));
    }
    /* The site's stylesheet rather than exports/tokens.css: only this one
       carries the [data-density] blocks the themed controls size from. */
    if (url.pathname === "/tokens.css") return send(200, "text/css; charset=utf-8", await fs.readFile(path.join(repoRoot, "site/src/styles/tokens.generated.css")));
    /* The comparison screen is built from the theme's own controls, so it
       serves the package the same way copy-exports puts it under dist/ui. */
    if (url.pathname.startsWith("/ui/")) {
      const asset = path.resolve(uiDir, `.${url.pathname.slice(3)}`);
      if (!asset.startsWith(`${uiDir}${path.sep}`)) return send(403, "text/plain", "Outside the package");
      return send(200, TYPES[path.extname(asset)] ?? "application/octet-stream", await fs.readFile(asset));
    }
    const target = path.join(toolDir, url.pathname === "/" ? "screen.html" : path.basename(url.pathname));
    if (!target.startsWith(toolDir)) return send(403, "text/plain", "Outside the tool");
    return send(200, TYPES[path.extname(target)] ?? "application/octet-stream", await fs.readFile(target));
  } catch { return send(404, "text/plain", "Design mode route not found"); }
});

/* ---- entry ------------------------------------------------------------- */

const listen = (server, at, label) => new Promise((resolve, reject) => {
  server.once("error", (error) => reject(new Error(`${label} cannot listen on ${at}: ${error.message}`)));
  server.listen(at, "127.0.0.1", () => resolve(server));
});

/* Astro's own `astro dev` cannot start this project: the CLI forks the dev
   server and gives it 30s to report ready, and syncing 67 component
   collections takes longer than that on a cold cache. The JS API runs the
   server in this process instead, with no such deadline. */
const startDev = async () => {
  console.log("design mode: starting the dev server (the first content sync takes about a minute)");
  const server = await dev({ root: repoRoot, server: { port: devPort, host: "127.0.0.1" }, logLevel: "warn" });
  const stop = () => { server.stop?.().catch(() => {}); };
  process.on("SIGINT", () => { stop(); process.exit(0); });
  process.on("exit", stop);
  return server;
};

/* Debounced so an editor's write-then-rename does not run it twice. */
const watchFor = (dir, run, label) => {
  let pending = null;
  watch(path.join(repoRoot, dir), { recursive: true }, (event, name) => {
    if (name && !run.matches(String(name))) return;
    clearTimeout(pending);
    pending = setTimeout(() => {
      run.go()
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
  if (!(await readLedger())) await writeLedger(emptyLedger());

  await listen(serveBaseline(), beforePort, "The frozen side");
  proxyHmr(await listen(serveLive(), afterPort, "The live side"));
  await listen(serveCompare(), port, "The comparison screen");
  await startDev();
  watchSources();

  console.log(`\ndesign mode: http://localhost:${port}/\n  before  http://localhost:${beforePort}${base}\n  after   http://localhost:${afterPort}${base}\nStop with Ctrl+C.\n`);
};

const report = async () => {
  const ledger = await readLedger();
  if (!ledger) { console.log("No design-mode session recorded."); return; }
  const groups = new Map();
  for (const entry of ledger.entries) groups.set(entry.changeClass, [...(groups.get(entry.changeClass) ?? []), entry]);
  console.log(`Design-mode session on ${ledger.branch ?? "an unknown branch"}, started ${ledger.startedAt} from ${ledger.startCommit?.slice(0, 12) ?? "an unknown commit"}.`);
  console.log(`${ledger.entries.length} change${ledger.entries.length === 1 ? "" : "s"} recorded.\n`);
  for (const changeClass of [...CHANGE_CLASSES, "unclassified"]) {
    const entries = groups.get(changeClass);
    if (!entries?.length) continue;
    console.log(`## ${changeClass} (${entries.length})`);
    for (const entry of entries) console.log(`  - ${entry.note}${entry.files.length ? `\n      ${entry.files.join(", ")}` : ""}`);
    console.log("");
  }
  const owed = ledger.entries.filter((entry) => entry.changeClass !== "page-local");
  if (owed.length) console.log(`${owed.length} change${owed.length === 1 ? " belongs" : "s belong"} in tokens/ or spec/, not in the site. Reconcile before the gate.`);
};

if (process.argv[1] && path.resolve(process.argv[1]) === path.join(repoRoot, "scripts/design-mode.mjs")) {
  const args = process.argv.slice(2);
  const flag = (name) => { const at = args.indexOf(name); return at < 0 ? null : args[at + 1]; };
  if (args.includes("--exit")) await report();
  else if (args.includes("--note")) {
    const ledger = await appendNote({ note: flag("--note"), changeClass: flag("--class"), files: flag("--files")?.split(",").map((file) => file.trim()).filter(Boolean) });
    console.log(`recorded change ${ledger.entries.length} (${ledger.entries.at(-1).changeClass})`);
  } else if (args.includes("--baseline")) await ensureBaseline({ force: true });
  else await enter();
}
