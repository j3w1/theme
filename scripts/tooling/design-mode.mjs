/* The parts of design mode that need no server, no Astro and no Vite, so
   they can be tested with node --test. scripts/design-mode.mjs wires them
   to the real processes, ports and file system. */

import { promises as fs, watch } from "node:fs";
import path from "node:path";
import { npmExecPath } from "./npm.mjs";

/* ---- ports ------------------------------------------------------------- */

/* The comparison screen takes DESIGN_PORT (4400 unless set); the frozen
   side, the live side and the dev server take the next three, and
   DESIGN_DEV_PORT can move only the last one. */
export const derivePorts = (env = process.env) => {
  const compare = Number(env.DESIGN_PORT ?? 4400);
  if (!Number.isInteger(compare) || compare < 1024 || compare > 65000) throw new Error("DESIGN_PORT must be an integer between 1024 and 65000");
  const dev = Number(env.DESIGN_DEV_PORT ?? compare + 3);
  if (!Number.isInteger(dev) || dev < 1024 || dev > 65535) throw new Error("DESIGN_DEV_PORT must be an integer between 1024 and 65535");
  return { compare, before: compare + 1, after: compare + 2, dev };
};

/* ---- routes ------------------------------------------------------------ */

/* The built-file path a request under the site base names: "" and a
   trailing slash mean index.html. */
export const routeOf = (pathname, base) => {
  let relative = pathname.slice(base.length);
  if (relative === "" || relative.endsWith("/")) relative += "index.html";
  return relative;
};

/* The top-level routes the frozen build has pages for. Package, demo,
   export and evidence trees are not pages of the site. */
export const NON_PAGE_DIRECTORIES = ["ui", "demo", "downloads", "exports", "schemas", "spec", "verification", "_astro", "specimens", "report"];

export const discoverRoutes = async (baselineDir, skip = NON_PAGE_DIRECTORIES) => {
  const skipped = new Set(skip);
  const routes = [""];
  try {
    for (const entry of await fs.readdir(baselineDir, { withFileTypes: true })) {
      if (!entry.isDirectory() || skipped.has(entry.name)) continue;
      try { await fs.access(path.join(baselineDir, entry.name, "index.html")); routes.push(`${entry.name}/`); } catch { /* not a page */ }
    }
  } catch { /* no baseline yet */ }
  return routes;
};

/* ---- source watching --------------------------------------------------- */

/* Calls onChange(relativePath) for every change under `root`. It watches
   each directory on its own rather than using fs.watch's recursive mode:
   on Linux the recursive watcher follows file inodes, so once an editor
   saves by writing a temporary file and renaming it over the original
   (vim, JetBrains safe write, sed -i) that file never reports again. A
   directory watch reports its children however they are replaced.
   Directories created after the watch starts are not followed. */
export const watchTree = async (root, onChange) => {
  const watchers = [];
  const add = async (dir) => {
    const watcher = watch(dir, (event, name) => { if (name) onChange(path.relative(root, path.join(dir, String(name))).split(path.sep).join("/")); });
    watcher.on("error", () => {});
    watchers.push(watcher);
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) if (entry.isDirectory()) await add(path.join(dir, entry.name));
  };
  await add(root);
  return { close: () => { for (const watcher of watchers) watcher.close(); } };
};

/* ---- frame agent ------------------------------------------------------- */

/* The two sides are separate origins so every internal link, asset and
   runtime fetch resolves exactly as it does in production. Cross-origin
   means the frames cannot read each other, so each carries a small agent
   that relays its scroll position and route through the comparison
   screen. */
export const agentScript = (side) => `<script>(function(){
var side=${JSON.stringify(side)},lock=0;
function post(m){m.j3w1design=true;m.side=side;try{parent.postMessage(m,"*")}catch(e){}}
function span(){return Math.max(1,document.documentElement.scrollHeight-innerHeight)}
addEventListener("scroll",function(){if(lock)return;post({type:"scroll",ratio:scrollY/span()})},{passive:true});
addEventListener("message",function(e){var d=e.data;if(!d||!d.j3w1design||d.side===side)return;
if(d.type==="scroll"){lock=1;scrollTo(0,d.ratio*span());requestAnimationFrame(function(){lock=0})}});
post({type:"ready",path:location.pathname,title:document.title});
})();</script>`;

export const injectAgent = (html, side) => (html.includes("</body>")
  ? html.replace("</body>", () => `${agentScript(side)}</body>`)
  : html + agentScript(side));

/* ---- baseline metadata ------------------------------------------------- */

export const readBaselineMeta = async (cache) => {
  try { return JSON.parse(await fs.readFile(path.join(cache, "baseline.json"), "utf8")); } catch { return null; }
};

export const writeBaselineMeta = async (cache, meta) => {
  await fs.mkdir(cache, { recursive: true });
  await fs.writeFile(path.join(cache, "baseline.json"), `${JSON.stringify(meta, null, 2)}\n`);
};

/* ---- session ledger ---------------------------------------------------- */

export const CHANGE_CLASSES = ["page-local", "token", "spec-rule", "component", "copy/identity"];

/* The ledger records each change in the owner's words and where it
   belongs, so the exit pass reconciles into tokens/ and spec/ instead of
   reconstructing intent afterwards. `git` supplies head() and branch(). */
export const createLedger = ({ file, git, now = () => new Date() }) => {
  const empty = () => ({ schemaVersion: 1, startedAt: now().toISOString(), startCommit: git.head(), branch: git.branch(), entries: [] });
  const read = async () => {
    try { return JSON.parse(await fs.readFile(file, "utf8")); } catch { return null; }
  };
  const write = async (ledger) => {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, `${JSON.stringify(ledger, null, 2)}\n`);
  };
  const init = async () => {
    if (!(await read())) await write(empty());
  };
  const append = async ({ note, changeClass, files }) => {
    if (!note) throw new Error("--note needs the change described in the owner's own words");
    if (changeClass && !CHANGE_CLASSES.includes(changeClass)) throw new Error(`--class must be one of ${CHANGE_CLASSES.join(", ")}`);
    const ledger = (await read()) ?? empty();
    ledger.entries.push({ at: now().toISOString(), note, changeClass: changeClass ?? "unclassified", files: files ?? [], commit: git.head() });
    await write(ledger);
    return ledger;
  };
  return { read, init, append };
};

/* The exit report: the session grouped by class, and how many changes
   still owe a reconciliation into tokens/ or spec/. */
export const formatReport = (ledger) => {
  if (!ledger) return ["No design-mode session recorded."];
  const lines = [];
  const groups = new Map();
  for (const entry of ledger.entries) groups.set(entry.changeClass, [...(groups.get(entry.changeClass) ?? []), entry]);
  lines.push(`Design-mode session on ${ledger.branch ?? "an unknown branch"}, started ${ledger.startedAt} from ${ledger.startCommit?.slice(0, 12) ?? "an unknown commit"}.`);
  lines.push(`${ledger.entries.length} change${ledger.entries.length === 1 ? "" : "s"} recorded.`, "");
  for (const changeClass of [...CHANGE_CLASSES, "unclassified"]) {
    const entries = groups.get(changeClass);
    if (!entries?.length) continue;
    lines.push(`## ${changeClass} (${entries.length})`);
    for (const entry of entries) lines.push(`  - ${entry.note}${entry.files.length ? `\n      ${entry.files.join(", ")}` : ""}`);
    lines.push("");
  }
  const owed = ledger.entries.filter((entry) => entry.changeClass !== "page-local");
  if (owed.length) lines.push(`${owed.length} change${owed.length === 1 ? " belongs" : "s belong"} in tokens/ or spec/, not in the site. Reconcile before the gate.`);
  return lines;
};

/* ---- package manager --------------------------------------------------- */

/* How the baseline build is started. The project is an npm workspace and
   its pack script is npm-specific, so the build always runs npm: the npm
   that started design mode when there is one (no PATH lookup, no shell),
   otherwise npm from PATH with a note saying so. */
export const resolvePackageManager = (env = process.env, { execPath = process.execPath, platform = process.platform } = {}) => {
  const agent = (env.npm_config_user_agent ?? "").split("/")[0] || null;
  const execpath = npmExecPath(env);
  if (agent === "npm" && execpath) return { name: "npm", command: execPath, args: [execpath], shell: false, warning: null };
  const warning = agent && agent !== "npm"
    ? `started through ${agent}; the baseline build runs npm from PATH because the workspace and its pack script are npm-specific`
    : "started outside npm; the baseline build runs npm from PATH";
  return { name: "npm", command: "npm", args: [], shell: platform === "win32", warning };
};

/* ---- prerequisites ----------------------------------------------------- */

/* What has to be true before design mode can enter. `probes` answers the
   questions; each failure names its fix. */
export const checkPrerequisites = async ({ ports, probes }) => {
  const problems = [];
  const major = Number(String(probes.nodeVersion()).replace(/^v/, "").split(".")[0]);
  if (!(major >= 24)) problems.push({ check: `Node ${probes.nodeVersion()}`, fix: "Use Node 24 (package.json engines)." });
  for (const name of ["astro", "vite"]) if (!(await probes.resolvable(name))) problems.push({ check: `${name} is installed`, fix: "Run npm ci." });
  for (const file of ["packages/ui/dist/index.json", "packages/ui/dist/styles/controls.css", "packages/ui/dist/enhance/choice.js"]) {
    if (!(await probes.exists(file))) problems.push({ check: `${file} exists`, fix: "Run npm run generate; the comparison screen and the live side load the package from packages/ui/dist." });
  }
  if (!(await probes.exists("site/src/styles/tokens.generated.css"))) problems.push({ check: "site/src/styles/tokens.generated.css exists", fix: "Run npm run generate." });
  if (!probes.gitHead()) problems.push({ check: "git answers rev-parse HEAD", fix: "Run design mode inside the repository checkout with git on PATH." });
  for (const [label, port] of Object.entries(ports)) if (!(await probes.portFree(port))) problems.push({ check: `port ${port} (${label}) is free`, fix: "Stop whatever holds it, or set DESIGN_PORT." });
  const runner = await probes.runner();
  if (!runner) problems.push({ check: "npm answers --version", fix: "Install npm, or start design mode with npm run design." });
  if (!(await probes.writable(".cache"))) problems.push({ check: ".cache is writable", fix: "Make the checkout writable; the baseline and the ledger live in .cache/design-mode." });
  return { ok: problems.length === 0, problems };
};
