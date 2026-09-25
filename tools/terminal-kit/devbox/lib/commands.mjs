/* The devbox commands: apply, update, test, restore and specimen. Every write
   is planned first, backed up, written atomically and read back. */

import { execFileSync } from "node:child_process";
import { existsSync, promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { atomicWrite, jsonGet, jsonMembers, jsonRemove, jsonSet, readMaybe, removeFile, tomlGet, tomlRestore, tomlSet } from "./edit.mjs";
import { claudeTheme, claudeThemeText, codexThemeObject, codexTmTheme, integrationDisclosures, INTEGRATIONS, lock } from "./generators.mjs";
import { parsePlist } from "./plist.mjs";
import { assertTag, DEFAULT_SOURCE_ROOT, KitError, loadContext, localKit, resolveTagRemote, sha256Hex } from "./source.mjs";
import { renderSpecimen } from "./specimen.mjs";

const CLAUDE_THEME_VALUE = (slug) => `custom:${slug}`;

export const now = () => new Date().toISOString().replace(/\.\d+Z$/, "Z");
const stamp = (iso) => iso.replaceAll("-", "").replaceAll(":", "");

/* ---- environment -------------------------------------------------------- */

/* Codex's home is always the user's registered one (~/.codex), never
   $CODEX_HOME: inside an Orca pane that variable names Orca's runtime copy,
   which Orca rebuilds from ~/.codex at every launch. */
export const resolvePaths = (opts, env = process.env) => {
  const home = env.HOME || os.homedir();
  const xdgState = env.XDG_STATE_HOME || path.join(home, ".local", "state");
  const xdgConfig = env.XDG_CONFIG_HOME || path.join(home, ".config");
  return {
    home,
    claudeDir: opts.claudeConfigDir ?? env.CLAUDE_CONFIG_DIR ?? path.join(home, ".claude"),
    codexHome: opts.codexHome ?? path.join(home, ".codex"),
    orcaRuntimeHome: opts.orcaRuntimeHome ?? path.join(xdgConfig, "orca", "codex-runtime-home", "home"),
    stateRoot: opts.stateDir ?? (env.J3W1_TERMINAL_KIT_STATE_DIR ? path.resolve(env.J3W1_TERMINAL_KIT_STATE_DIR) : path.join(xdgState, "j3w1-theme", "devbox")),
  };
};

const hostVersion = (bin, skip) => {
  if (skip) return null;
  try {
    const out = execFileSync(bin, ["--version"], { stdio: ["ignore", "pipe", "ignore"], timeout: 15000 }).toString();
    return /(\d+\.\d+\.\d+)/.exec(out)?.[1] ?? null;
  } catch {
    return null;
  }
};

export const hostVersions = (opts) => ({ "claude-code": hostVersion("claude", opts.skipVersionProbe), codex: hostVersion("codex", opts.skipVersionProbe) });

/* ---- state -------------------------------------------------------------- */

const currentDir = (paths) => path.join(paths.stateRoot, "current");
const backupsDir = (paths) => path.join(paths.stateRoot, "backups");

const readJsonMaybe = async (file) => {
  const bytes = await readMaybe(file);
  return bytes ? JSON.parse(bytes.toString("utf8")) : null;
};

const writeJson = async (file, value) => {
  await fs.mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  await atomicWrite(file, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
};

export const listBackups = async (paths) => {
  try {
    return (await fs.readdir(backupsDir(paths))).filter((n) => /^\d{8}T\d{6}Z(?:-\d+)?$/.test(n)).sort((a, b) => {
      const [ab, as = "0"] = a.split("-");
      const [bb, bs = "0"] = b.split("-");
      return ab === bb ? Number(as) - Number(bs) : ab < bb ? -1 : 1;
    });
  } catch {
    return [];
  }
};

const newBackupDir = async (paths, iso) => {
  await fs.mkdir(backupsDir(paths), { recursive: true, mode: 0o700 });
  const base = stamp(iso);
  for (let n = 0; ; n += 1) {
    const name = n ? `${base}-${n}` : base;
    try {
      await fs.mkdir(path.join(backupsDir(paths), name), { mode: 0o700 });
      return { name, dir: path.join(backupsDir(paths), name) };
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
    }
  }
};

const STATE_FILES = ["manifest.json", "pin.json", ...INTEGRATIONS.map((i) => `theme.lock.${i}.json`)];

/* ---- targets ------------------------------------------------------------ */

/* The desired state of every managed file and key for the chosen hosts. */
export const buildTargets = (ctx, paths, integrations) => {
  const targets = [];
  if (integrations.includes("claude-code")) {
    const map = ctx.roles["claude-code"];
    targets.push({ kind: "file", id: "claude-code-theme", integration: "claude-code", path: path.join(paths.claudeDir, "themes", `${map.theme.slug}.json`), content: Buffer.from(claudeThemeText(ctx)) });
    targets.push({ kind: "key", id: "claude-code-setting", integration: "claude-code", format: "json", path: path.join(paths.claudeDir, "settings.json"), key: map.host.setting, value: CLAUDE_THEME_VALUE(map.theme.slug) });
  }
  if (integrations.includes("codex")) {
    const map = ctx.roles.codex;
    const [table, key] = map.host.setting.split(".");
    targets.push({ kind: "file", id: "codex-theme", integration: "codex", path: path.join(paths.codexHome, "themes", map.theme.file), content: Buffer.from(codexTmTheme(ctx)) });
    targets.push({ kind: "key", id: "codex-setting", integration: "codex", format: "toml", path: path.join(paths.codexHome, "config.toml"), table, key, value: map.theme.name });
  }
  return targets;
};

const keyName = (t) => (t.format === "toml" ? `${t.table}.${t.key}` : t.key);

const readKey = (t, text) => {
  if (t.format === "json") return text.trim() === "" ? { present: false } : jsonGet(text, t.key);
  return tomlGet(text, t.table, t.key);
};

/* Current bytes and values next to the desired ones. */
const inspect = async (targets) => {
  const out = [];
  for (const t of targets) {
    const bytes = await readMaybe(t.path);
    if (t.kind === "file") out.push({ ...t, before: bytes, changed: !bytes || !bytes.equals(t.content) });
    else {
      const text = bytes ? bytes.toString("utf8") : "";
      const current = readKey(t, text);
      out.push({ ...t, fileBefore: bytes, text, current, changed: !(current.present && current.value === t.value) });
    }
  }
  return out;
};

const show = (v) => (v === undefined ? "(absent)" : JSON.stringify(v));

/* ---- backup, manifest and write ---------------------------------------- */

const snapshotState = async (paths, dir) => {
  const saved = [];
  for (const name of STATE_FILES) {
    const bytes = await readMaybe(path.join(currentDir(paths), name));
    if (bytes) {
      await fs.mkdir(path.join(dir, "current"), { recursive: true, mode: 0o700 });
      await fs.writeFile(path.join(dir, "current", name), bytes, { mode: 0o600 });
      saved.push(name);
    }
  }
  return saved;
};

const missingDirs = (targets) => {
  const dirs = new Set();
  for (const t of targets) if (t.kind === "file" && !existsSync(path.dirname(t.path))) dirs.add(path.dirname(t.path));
  return [...dirs].sort();
};

const baseManifest = (ctx, command, iso, versions) => ({
  schemaVersion: 1,
  kit: ctx.kit.id,
  command,
  timestamp: iso,
  hosts: versions,
  theme: { name: ctx.kit.theme.name, version: ctx.theme.version, ref: ctx.theme.ref, revision: ctx.theme.revision, profile: ctx.theme.profile },
  source: { via: ctx.source.via, kitFrom: ctx.source.kitFrom },
});

/* Applies the changed targets under a fresh backup. */
const writeTargets = async ({ ctx, paths, command, plan, integrations, versions, log }) => {
  const iso = now();
  const createdDirs = missingDirs(plan.filter((t) => t.changed));
  /* The backup comes first, so a state directory the host will not let us
     create stops the run before any managed file changes. */
  let backup;
  try {
    backup = await newBackupDir(paths, iso);
  } catch (error) {
    throw new KitError(`state directory ${paths.stateRoot} is not writable (${error.code ?? error.message}); nothing was changed. Pass --state-dir <dir> or set J3W1_TERMINAL_KIT_STATE_DIR.`);
  }
  const files = [];
  const settings = [];
  for (const t of plan) {
    if (!t.changed) continue;
    if (t.kind === "file") {
      let saved = null;
      if (t.before) {
        await fs.mkdir(path.join(backup.dir, "files"), { recursive: true, mode: 0o700 });
        saved = `files/${t.id}${path.extname(t.path)}`;
        await fs.writeFile(path.join(backup.dir, saved), t.before, { mode: 0o600 });
      }
      files.push({ path: t.path, integration: t.integration, existedBefore: Boolean(t.before), sha256Before: t.before ? sha256Hex(t.before) : null, sha256After: sha256Hex(t.content), backup: saved });
    } else {
      const entry = { file: t.path, integration: t.integration, format: t.format, key: keyName(t), fileExistedBefore: Boolean(t.fileBefore) };
      if (t.current.present) entry.before = t.current.value;
      else entry.absent = true;
      entry.after = t.value;
      if (t.format === "toml") {
        if (t.current.present) entry.beforeLine = t.current.line;
        else if (!new RegExp(`^\\s*\\[\\s*${t.table}\\s*\\]`, "m").test(t.text)) entry.appendedTable = { addedNewline: t.text !== "" && !t.text.endsWith("\n") };
      } else if (t.current.present) {
        const m = jsonMembers(t.text).members.find((x) => x.key === t.key);
        entry.beforeRaw = t.text.slice(m.valueStart, m.valueEnd);
      }
      settings.push(entry);
    }
  }
  const manifest = {
    ...baseManifest(ctx, command, iso, versions),
    backup: backup.name,
    integrations,
    files,
    createdDirs,
    settings,
    state: await snapshotState(paths, backup.dir),
    disclosures: integrations.flatMap((i) => integrationDisclosures(ctx, i).map((d) => ({ integration: i, ...d }))),
    deviations: integrations.flatMap((i) => ctx.roles[i].deviations.map((d) => ({ integration: i, ...d }))),
  };
  await writeJson(path.join(backup.dir, "manifest.json"), manifest);

  for (const t of plan) {
    if (!t.changed) continue;
    if (t.kind === "file") await atomicWrite(t.path, t.content);
    else {
      const next = t.format === "json" ? jsonSet(t.text, t.key, t.value) : tomlSet(t.text, t.table, t.key, t.value);
      await atomicWrite(t.path, next, { mode: 0o600 });
      const back = readKey(t, (await fs.readFile(t.path)).toString("utf8"));
      if (!(back.present && back.value === t.value)) throw new KitError(`${t.path}: ${keyName(t)} did not read back as ${t.value}`);
    }
    log(`  wrote ${t.path}${t.kind === "key" ? ` (${keyName(t)} = ${JSON.stringify(t.value)})` : ""}`);
  }

  await writeJson(path.join(currentDir(paths), "manifest.json"), manifest);
  await writeJson(path.join(currentDir(paths), "pin.json"), { ref: ctx.theme.ref, revision: ctx.theme.revision, version: ctx.theme.version, profile: ctx.theme.profile, kitSource: ctx.source.kitFrom === "local" ? "local" : "revision" });
  for (const i of integrations) await writeJson(path.join(currentDir(paths), `theme.lock.${i}.json`), lock(ctx, i, { resolvedAt: iso }));
  log(`backup ${path.join(backupsDir(paths), backup.name)}`);
  return { manifest, createdDirs };
};

const restartNotes = (plan, createdDirs, paths, log) => {
  const claude = plan.filter((t) => t.integration === "claude-code" && t.changed);
  const codex = plan.filter((t) => t.integration === "codex" && t.changed);
  if (claude.length) {
    if (createdDirs.includes(path.join(paths.claudeDir, "themes"))) log(`restart: Claude Code: ${path.join(paths.claudeDir, "themes")} was created now; restart running sessions once so they watch it.`);
    else log("restart: Claude Code: new sessions start with the theme; running sessions watch the themes directory, restart one if it keeps its previous theme.");
  }
  if (codex.length) {
    log("restart: Codex: new sessions only. A running Codex keeps the theme it started with.");
    log(`         Orca panes: Orca links ${path.join(paths.codexHome, "themes")} into its runtime home and syncs tui.theme at each Codex pane launch.`);
  }
};

const printDisclosures = (ctx, integrations, log) => {
  for (const i of integrations) {
    const ds = integrationDisclosures(ctx, i);
    for (const d of ds) log(`disclose ${i}: ${d.token} uses pending decision ${d.decisionIds.join(", ")}`);
    for (const d of ctx.roles[i].deviations) log(`deviation ${i}: ${d.component} / ${d.target}: ${d.kind}; spec ${d.specValue}; applied ${d.applied ?? "none"}. ${d.reason}`);
  }
};

/* ---- commands ----------------------------------------------------------- */

const pinnedContext = async (opts, paths, log) => {
  const pin = await readJsonMaybe(path.join(currentDir(paths), "pin.json"));
  const kit = localKit().kit;
  if (pin && pin.revision !== kit.theme.revision) log(`using the installed pin ${pin.ref} (${pin.revision}) from ${currentDir(paths)}`);
  return loadContext({ pin: pin ? { ref: pin.ref, revision: pin.revision, version: pin.version, profile: pin.profile } : undefined, kitSource: pin?.kitSource ?? "local", sourceRoot: opts.sourceRoot ?? DEFAULT_SOURCE_ROOT, offline: Boolean(opts.sourceRoot) });
};

const describePlan = (plan, log) => {
  for (const t of plan) {
    if (t.kind === "file") log(`  ${t.changed ? (t.before ? "update" : "create") : "same  "} ${t.path}`);
    else log(`  ${t.changed ? "set   " : "same  "} ${t.path} ${keyName(t)}: ${show(t.current.present ? t.current.value : undefined)} -> ${JSON.stringify(t.value)}`);
  }
};

const run = async ({ ctx, paths, opts, command, integrations, log, before }) => {
  const plan = await inspect(buildTargets(ctx, paths, integrations));
  log(`j3w1-theme ${ctx.theme.version} ${ctx.theme.ref} (${ctx.theme.revision}) profile ${ctx.theme.profile}; export via ${ctx.source.via} (${ctx.source.tagCheck}); digest verified`);
  if (before) before(plan);
  describePlan(plan, log);
  if (!plan.some((t) => t.changed)) {
    log("no changes");
    return 0;
  }
  if (opts.dryRun) {
    log("dry run: nothing written");
    return 0;
  }
  const { createdDirs } = await writeTargets({ ctx, paths, command, plan, integrations, versions: hostVersions(opts), log });
  restartNotes(plan, createdDirs, paths, log);
  printDisclosures(ctx, integrations, log);
  return 0;
};

export const apply = async (opts, paths, log) => {
  const ctx = await loadContext({ sourceRoot: opts.sourceRoot ?? DEFAULT_SOURCE_ROOT, offline: Boolean(opts.sourceRoot) });
  return run({ ctx, paths, opts, command: "apply", integrations: opts.integrations, log });
};

const overrideDiff = (installed, next, log) => {
  let same = 0;
  for (const [role, value] of Object.entries(next.overrides)) {
    if (installed?.overrides?.[role] === value) same += 1;
    else log(`    claude ${role}: ${installed?.overrides?.[role] ?? "(absent)"} -> ${value}`);
  }
  for (const role of Object.keys(installed?.overrides ?? {})) if (!(role in next.overrides)) log(`    claude ${role}: ${installed.overrides[role]} -> (removed)`);
  log(`    claude: ${same} of ${Object.keys(next.overrides).length} overrides unchanged; base ${installed?.base ?? "(absent)"} -> ${next.base}`);
};

const tmSettings = (theme) => {
  const out = {};
  const [globals, ...rules] = theme?.settings ?? [];
  for (const [k, v] of Object.entries(globals?.settings ?? {})) out[`globals.${k}`] = v;
  for (const r of rules) for (const [k, v] of Object.entries(r.settings ?? {})) out[`${r.name}.${k}`] = v;
  return out;
};

export const update = async (opts, paths, log) => {
  assertTag(opts.version);
  const sourceRoot = opts.sourceRoot ?? DEFAULT_SOURCE_ROOT;
  let revision = null;
  try {
    revision = execFileSync("git", ["-C", sourceRoot, "rev-parse", "--verify", "--quiet", `refs/tags/${opts.version}^{commit}`], { stdio: ["ignore", "pipe", "ignore"] }).toString().trim() || null;
  } catch {
    revision = null;
  }
  if (!revision) {
    if (opts.sourceRoot) throw new KitError(`tag ${opts.version} is not in ${sourceRoot}; without --source-root the tag is resolved on GitHub`);
    revision = await resolveTagRemote(localKit().kit, opts.version);
  }
  if (!revision) throw new KitError(`tag ${opts.version} does not resolve to a commit`);
  const version = opts.version.slice(1);
  const ctx = await loadContext({ pin: { ref: opts.version, revision, version }, kitSource: "revision", sourceRoot, offline: Boolean(opts.sourceRoot) });
  log(`update to ${opts.version} = ${revision}; kit files from ${ctx.source.kitFrom === "local" ? "this checkout (the tag predates the kit)" : "the tag"}`);
  return run({
    ctx, paths, opts, command: `update ${opts.version}`, integrations: opts.integrations, log,
    before: (plan) => {
      for (const t of plan.filter((x) => x.kind === "file")) {
        if (t.id === "claude-code-theme") {
          let installed = null;
          try { installed = t.before ? JSON.parse(t.before.toString("utf8")) : null; } catch { installed = null; }
          overrideDiff(installed, claudeTheme(ctx), log);
        } else {
          let installed = {};
          try { installed = t.before ? tmSettings(parsePlist(t.before.toString("utf8"))) : {}; } catch { installed = {}; }
          const next = tmSettings(codexThemeObject(ctx));
          let same = 0;
          for (const [k, v] of Object.entries(next)) {
            if (installed[k] === v) same += 1;
            else log(`    codex ${k}: ${installed[k] ?? "(absent)"} -> ${v}`);
          }
          log(`    codex: ${same} of ${Object.keys(next).length} values unchanged`);
        }
      }
    },
  });
};

export const specimen = async (opts, paths, log, out) => {
  const ctx = await pinnedContext(opts, paths, log);
  out(renderSpecimen(ctx));
  return 0;
};

export const test = async (opts, paths, log, out) => {
  const ctx = await pinnedContext(opts, paths, log);
  if (!opts.noSpecimen) out(renderSpecimen(ctx));
  const results = [];
  const check = (status, what) => {
    results.push(status);
    log(`${status.padEnd(4)} ${what}`);
  };
  const plan = await inspect(buildTargets(ctx, paths, opts.integrations));
  for (const t of plan) {
    if (t.kind === "file") check(t.changed ? "FAIL" : "PASS", `${t.path} ${t.before ? (t.changed ? "differs from" : "equals") : "is missing; expected"} the generated ${t.integration} theme`);
    else check(t.changed ? "FAIL" : "PASS", `${t.path} ${keyName(t)} = ${show(t.current.present ? t.current.value : undefined)} (expected ${JSON.stringify(t.value)})`);
  }
  if (opts.integrations.includes("codex")) {
    const rt = paths.orcaRuntimeHome;
    const file = ctx.roles.codex.theme.file;
    if (!existsSync(rt)) check("SKIP", `Orca runtime home ${rt} does not exist`);
    else {
      const themes = path.join(rt, "themes");
      const expected = Buffer.from(codexTmTheme(ctx));
      let linked = null;
      try { linked = await fs.realpath(themes); } catch { linked = null; }
      const own = await fs.realpath(path.join(paths.codexHome, "themes")).catch(() => null);
      if (!linked) check("WARN", `${themes} is not there yet: Orca links ${path.join(paths.codexHome, "themes")} at the next Codex pane launch`);
      else {
        const bytes = await readMaybe(path.join(themes, file));
        const ok = bytes && bytes.equals(expected);
        const how = linked === own ? `links to ${own}` : "is a separate directory Orca will not replace";
        check(ok ? "PASS" : "FAIL", `Orca runtime home: ${themes} ${how}; ${file} ${bytes ? (ok ? "resolves to the generated theme" : "differs") : "is missing"}`);
      }
      const config = await readMaybe(path.join(rt, "config.toml"));
      let value;
      try { value = config ? tomlGet(config.toString("utf8"), "tui", "theme") : { present: false }; } catch { value = { present: false }; }
      const want = ctx.roles.codex.theme.name;
      check(value.present && value.value === want ? "PASS" : "WARN", `Orca runtime config tui.theme = ${show(value.present ? value.value : undefined)}${value.value === want ? "" : `; Orca syncs ${want} from ${path.join(paths.codexHome, "config.toml")} at the next Codex pane launch`}`);
    }
  }
  const versions = hostVersions(opts);
  for (const i of opts.integrations) {
    const observed = ctx.roles[i].host.observedVersions;
    const v = versions[i];
    if (!v) check("WARN", `${ctx.roles[i].host.name} version unknown (not probed or not installed); roles observed on ${observed.join(", ")}`);
    else check(observed.includes(v) ? "PASS" : "WARN", `${ctx.roles[i].host.name} ${v}; roles observed on ${observed.join(", ")}`);
  }
  printDisclosures(ctx, opts.integrations, log);
  const failed = results.includes("FAIL");
  log(failed ? "FAIL" : "PASS");
  return failed ? 1 : 0;
};

/* ---- restore ------------------------------------------------------------ */

const restoreKeyText = (entry, text) => {
  if (entry.format === "json") {
    if (entry.absent) return jsonRemove(text, entry.key);
    return entry.beforeRaw !== undefined ? jsonSetRaw(text, entry.key, entry.beforeRaw) : jsonSet(text, entry.key, entry.before);
  }
  const [table, key] = entry.key.split(".");
  if (entry.absent) return tomlRestore(text, table, key, { appendedTable: entry.appendedTable });
  return tomlRestore(text, table, key, { beforeLine: entry.beforeLine ?? `${key} = ${JSON.stringify(entry.before)}` });
};

const jsonSetRaw = (text, key, raw) => {
  const m = jsonMembers(text).members.find((x) => x.key === key);
  return m ? text.slice(0, m.valueStart) + raw + text.slice(m.valueEnd) : jsonSet(text, key, JSON.parse(raw));
};

const emptyAfterRestore = (entry, text) => {
  if (entry.fileExistedBefore) return false;
  if (entry.format === "json") return jsonMembers(text).members.length === 0;
  return text.trim() === "";
};

export const restore = async (opts, paths, log) => {
  const backups = await listBackups(paths);
  if (!backups.length) throw new KitError(`no backups in ${backupsDir(paths)}`);
  const name = opts.backup ?? (opts.latest ? backups.at(-1) : backups[0]);
  if (!backups.includes(name)) throw new KitError(`backup ${name} not found; have ${backups.join(", ")}`);
  const dir = path.join(backupsDir(paths), name);
  const manifest = await readJsonMaybe(path.join(dir, "manifest.json"));
  if (!manifest) throw new KitError(`${dir} has no manifest.json`);
  log(`restore ${name} (${manifest.command} at ${manifest.timestamp})`);

  /* Desired bytes for every file and key the backup covers. */
  const steps = [];
  for (const f of manifest.files) {
    const current = await readMaybe(f.path);
    const want = f.existedBefore ? await fs.readFile(path.join(dir, f.backup)) : null;
    const changed = want ? !(current && current.equals(want)) : Boolean(current);
    steps.push({ kind: "file", entry: f, current, want, changed });
    log(`  ${changed ? (want ? "put   " : "delete") : "same  "} ${f.path}`);
  }
  for (const s of manifest.settings) {
    const current = await readMaybe(s.file);
    const text = current ? current.toString("utf8") : "";
    const next = current ? restoreKeyText(s, text) : null;
    const remove = next !== null && emptyAfterRestore(s, next);
    const changed = current !== null && (remove || next !== text);
    steps.push({ kind: "key", entry: s, current, text, next, remove, changed });
    log(`  ${changed ? (remove ? "delete" : "set   ") : "same  "} ${s.file} ${s.key} -> ${s.absent ? "(absent)" : JSON.stringify(s.before)}`);
  }
  if (!steps.some((s) => s.changed)) {
    log("no changes");
    return 0;
  }
  if (opts.dryRun) {
    log("dry run: nothing written");
    return 0;
  }

  /* Back up the state being replaced; restoring this backup undoes the restore. */
  const iso = now();
  const backup = await newBackupDir(paths, iso);
  const files = [];
  for (const s of steps.filter((x) => x.kind === "file" && x.changed)) {
    let saved = null;
    if (s.current) {
      await fs.mkdir(path.join(backup.dir, "files"), { recursive: true, mode: 0o700 });
      saved = `files/${path.basename(s.entry.backup ?? s.entry.path)}`;
      await fs.writeFile(path.join(backup.dir, saved), s.current, { mode: 0o600 });
    }
    files.push({ path: s.entry.path, integration: s.entry.integration, existedBefore: Boolean(s.current), sha256Before: s.current ? sha256Hex(s.current) : null, sha256After: s.want ? sha256Hex(s.want) : null, backup: saved });
  }
  const settings = [];
  for (const s of steps.filter((x) => x.kind === "key" && x.changed)) {
    const e = s.entry;
    const [table, key] = e.key.split(".");
    const cur = e.format === "json" ? jsonGet(s.text, e.key) : tomlGet(s.text, table, key);
    const entry = { file: e.file, integration: e.integration, format: e.format, key: e.key, fileExistedBefore: true };
    if (cur.present) entry.before = cur.value;
    else entry.absent = true;
    if (e.absent) entry.afterAbsent = true;
    else entry.after = e.before;
    if (e.format === "toml" && cur.present) entry.beforeLine = cur.line;
    if (e.format === "json" && cur.present) {
      const m = jsonMembers(s.text).members.find((x) => x.key === e.key);
      entry.beforeRaw = s.text.slice(m.valueStart, m.valueEnd);
    }
    settings.push(entry);
  }
  const own = {
    schemaVersion: 1,
    kit: manifest.kit,
    command: `restore ${name}`,
    timestamp: iso,
    hosts: hostVersions(opts),
    theme: (await readJsonMaybe(path.join(currentDir(paths), "manifest.json")))?.theme ?? null,
    backup: backup.name,
    integrations: manifest.integrations,
    files,
    createdDirs: [],
    settings,
    state: await snapshotState(paths, backup.dir),
    disclosures: [],
    deviations: [],
  };
  await writeJson(path.join(backup.dir, "manifest.json"), own);

  for (const s of steps.filter((x) => x.changed)) {
    if (s.kind === "file") {
      if (s.want) await atomicWrite(s.entry.path, s.want);
      else await removeFile(s.entry.path);
      log(`  ${s.want ? "restored" : "deleted"} ${s.entry.path}`);
    } else if (s.remove) {
      await removeFile(s.entry.file);
      log(`  deleted ${s.entry.file} (the kit created it)`);
    } else {
      await atomicWrite(s.entry.file, s.next, { mode: 0o600 });
      log(`  restored ${s.entry.file} ${s.entry.key}`);
    }
  }
  for (const d of [...(manifest.createdDirs ?? [])].reverse()) {
    try {
      await fs.rmdir(d);
      log(`  removed empty ${d}`);
    } catch {
      /* not empty or already gone: leave it */
    }
  }
  /* The kit state returns to what it was when the backup was taken. */
  for (const n of STATE_FILES) {
    const saved = manifest.state?.includes(n) ? await readMaybe(path.join(dir, "current", n)) : null;
    if (saved) await writeJson(path.join(currentDir(paths), n), JSON.parse(saved.toString("utf8")));
    else await removeFile(path.join(currentDir(paths), n));
  }
  log(`backup of the replaced state ${path.join(backupsDir(paths), backup.name)}`);
  log("restart: Codex: new sessions only. Claude Code: restart a running session if it keeps the j3w1 theme.");
  return 0;
};
