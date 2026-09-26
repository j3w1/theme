/* The devbox commands: apply, update, test, restore and specimen. Every change
   is planned in full first: each file's next bytes are computed and checked
   with a real parse before the backup exists or anything is written. Each
   file is then read again just before its atomic write, and compared once
   more just before the rename; if another program changed it since the plan,
   that file is planned again once, and if it changes again the run stops
   with nothing further written. */

import { execFileSync } from "node:child_process";
import { existsSync, promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { atomicWrite, ChangedError, decodeText, EditError, encodeText, jsonGet, jsonMembers, jsonRemove, jsonSetRaw, jsonVerify, readMaybe, removeFile, sameBytes, tomlHasTable, tomlParser, tomlRead, tomlRestore, tomlSet, tomlVerify, WrittenError } from "./edit.mjs";
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

/* The hosts may write their own settings when probed, so every writing
   command probes before it reads a single host file. */
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
  try {
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
  } catch (error) {
    throw new KitError(`state directory ${paths.stateRoot} is not writable (${error.code ?? error.message}); nothing was changed. Pass --state-dir <dir> or set J3W1_TERMINAL_KIT_STATE_DIR.`);
  }
};

/* pin.json is what installs before per-integration pins recorded; it is
   read only for an integration that has a lock and no pin of its own. */
const STATE_FILES = ["manifest.json", "pin.json", ...INTEGRATIONS.flatMap((i) => [`pin.${i}.json`, `theme.lock.${i}.json`])];

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

/* Each integration's pin and lock name what is installed for it; an update
   records them even when no managed file changes, and only for the
   integrations it was asked to move. */
const recordPin = async (ctx, paths, integrations, iso) => {
  for (const i of integrations) {
    await writeJson(path.join(currentDir(paths), `pin.${i}.json`), { ref: ctx.theme.ref, revision: ctx.theme.revision, version: ctx.theme.version, profile: ctx.theme.profile, kitSource: ctx.source.kitFrom === "local" ? "local" : "revision", tokensDigest: ctx.tokensDigest });
    await writeJson(path.join(currentDir(paths), `theme.lock.${i}.json`), lock(ctx, i, { resolvedAt: iso }));
  }
};

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

/* A manifest settings entry as a target-like reference. */
const keyRef = (entry) => {
  const [table, key] = entry.format === "toml" ? entry.key.split(".") : [undefined, entry.key];
  return { path: entry.file, format: entry.format, table, key, integration: entry.integration };
};

const readKey = (t, text, parse) => {
  if (t.format === "json") return text.trim() === "" ? { present: false } : jsonGet(text, t.key);
  return tomlRead(parse, text, t.table, t.key, t.path);
};

const verifyKey = (t, before, after, want, parse) =>
  t.format === "json" ? jsonVerify(before, after, t.key, want, t.path) : tomlVerify(parse, before, after, t.table, t.key, want, t.path);

/* What a key was before a write: enough to put it back byte for byte. */
const keyBefore = (t, text, current, fileExisted) => {
  const out = { fileExistedBefore: fileExisted };
  if (current.present) {
    out.before = current.value;
    if (t.format === "toml") out.beforeLine = current.line;
    else out.beforeRaw = current.raw;
  } else {
    out.absent = true;
    if (t.format === "toml" && !tomlHasTable(text, t.table, t.key)) out.appendedTable = { addedNewline: text !== "" && !text.endsWith("\n") };
  }
  return out;
};

/* A planning failure names the file and says nothing was written. */
const planned = async (file, fn) => {
  try {
    return await fn();
  } catch (error) {
    if (!(error instanceof EditError)) throw error;
    throw new EditError(`${error.message.includes(file) ? "" : `${file}: `}${error.message}`);
  }
};

const nothingWritten = (error) => {
  if (error instanceof EditError && !/nothing was (written|changed)/i.test(error.message)) error.message += "; nothing was written";
  return error;
};

/* One target's current bytes, its next bytes and every guard. */
const planTarget = (t, parse) =>
  planned(t.path, async () => {
    const before = await readMaybe(t.path);
    if (t.kind === "file") return { ...t, before, after: t.content, changed: !before || !before.equals(t.content) };
    const { bom, text } = decodeText(before);
    const current = readKey(t, text, parse);
    const step = { ...t, before, bom, text, current, changed: !(current.present && current.value === t.value), after: null };
    if (step.changed) {
      const edited = t.format === "json" ? jsonSetRaw(text, t.key, JSON.stringify(t.value)) : tomlSet(text, t.table, t.key, t.value);
      verifyKey(t, text, edited, { value: t.value }, parse);
      step.after = encodeText(bom, edited);
    }
    return step;
  });

const show = (v) => (v === undefined ? "(absent)" : JSON.stringify(v));

/* ---- commit ------------------------------------------------------------- */

/* The file must still hold the planned `before` bytes at the rename. */
const writeStep = async (step, hooks) => {
  const guard = { expect: step.before, beforeCommit: hooks?.beforeCommit };
  if (step.after === null) await removeFile(step.path, guard);
  else await atomicWrite(step.path, step.after, { ...guard, ...(step.kind === "key" ? { mode: 0o600 } : {}) });
};

class Stopped extends KitError {}

/* Writes the planned steps under one backup. `record` saves a step's
   previous bytes in the backup and returns its manifest entry; `replan`
   plans a step again from the file's new bytes (null: nothing to do now).
   A run that stops, for any reason, keeps a manifest of exactly what it
   wrote; `resume` tells the owner what finishes the job. */
const commit = async ({ backup, manifest, steps, record, replan, describe, log, hooks, resume }) => {
  const slots = [];
  for (const step of steps) slots.push({ step, entry: await record(step) });
  const save = (list) => {
    manifest.files = list.filter((s) => s.step.kind === "file").map((s) => s.entry);
    manifest.settings = list.filter((s) => s.step.kind === "key").map((s) => s.entry);
    return writeJson(path.join(backup.dir, "manifest.json"), manifest);
  };
  await save(slots);
  const done = [];
  const stop = async (file, why) => {
    manifest.incomplete = `stopped at ${file}: ${why}`;
    if (done.length) await save(done);
    else await fs.rm(backup.dir, { recursive: true, force: true });
    const written = done.length ? `Already written: ${done.map((s) => s.step.path).join(", ")}; backup ${backup.name} records them. ${resume}` : "Nothing was written and no backup was kept.";
    throw new Stopped(`${file}: ${why}; stopped with nothing further written. ${written}`);
  };
  /* One step: compare, write (compared once more at the rename), and plan
     it again once if another program wrote the file in between. */
  const writeSlot = async (slot) => {
    let { step } = slot;
    for (let attempt = 1; ; attempt += 1) {
      await hooks?.beforeWrite?.(step.path, attempt);
      if (sameBytes(await readMaybe(step.path), step.before)) {
        try {
          await writeStep(step, hooks);
          return step;
        } catch (error) {
          if (!(error instanceof ChangedError)) throw error;
        }
      }
      if (attempt > 1) await stop(step.path, "another program changed it again while the kit was writing; close it and run the command again");
      log(`  ${step.path} changed since the plan (another program wrote it); planning it again`);
      try {
        step = await replan(step);
      } catch (error) {
        if (!(error instanceof EditError || error instanceof KitError)) throw error;
        await stop(step.path, `planning it again failed: ${error.message}`);
      }
      if (!step) {
        log(`  same   ${slot.step.path} (the other program already made the change)`);
        slots.splice(slots.indexOf(slot), 1);
        await save(slots);
        return null;
      }
      slot.step = step;
      slot.entry = await record(step);
      await save(slots);
    }
  };
  for (const slot of [...slots]) {
    let step;
    try {
      step = await writeSlot(slot);
    } catch (error) {
      if (error instanceof Stopped) throw error;
      /* Renamed into place but not read back as written: the file holds the
         kit's write, so it stays in the manifest and restore undoes it. */
      if (error instanceof WrittenError) done.push(slot);
      await stop(slot.step.path, `writing it failed (${error.message})`);
    }
    if (!step) continue;
    done.push(slot);
    log(describe(step));
  }
  return slots;
};

/* ---- apply and update --------------------------------------------------- */

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

const recordApply = (backup) => async (t) => {
  if (t.kind === "file") {
    let saved = null;
    if (t.before) {
      await fs.mkdir(path.join(backup.dir, "files"), { recursive: true, mode: 0o700 });
      saved = `files/${t.id}${path.extname(t.path)}`;
      await fs.writeFile(path.join(backup.dir, saved), t.before, { mode: 0o600 });
    }
    return { path: t.path, integration: t.integration, existedBefore: Boolean(t.before), sha256Before: t.before ? sha256Hex(t.before) : null, sha256After: sha256Hex(t.content), backup: saved };
  }
  return { file: t.path, integration: t.integration, format: t.format, key: keyName(t), ...keyBefore(t, t.text, t.current, Boolean(t.before)), after: t.value };
};

const restartNotes = (steps, createdDirs, paths, log) => {
  const claude = steps.filter((t) => t.integration === "claude-code");
  const codex = steps.filter((t) => t.integration === "codex");
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

const describePlan = (plan, log) => {
  for (const t of plan) {
    if (t.kind === "file") log(`  ${t.changed ? (t.before ? "update" : "create") : "same  "} ${t.path}`);
    else log(`  ${t.changed ? "set   " : "same  "} ${t.path} ${keyName(t)}: ${show(t.current.present ? t.current.value : undefined)} -> ${JSON.stringify(t.value)}`);
  }
};

const planTargets = async (targets) => {
  const parse = targets.some((t) => t.format === "toml") ? await tomlParser() : null;
  const plan = [];
  for (const t of targets) plan.push(await planTarget(t, parse));
  return { plan, parse };
};

const planRun = async (ctx, paths, integrations) => {
  try {
    return await planTargets(buildTargets(ctx, paths, integrations));
  } catch (error) {
    throw nothingWritten(error);
  }
};

const run = async ({ ctx, paths, opts, command, integrations, log, before, planning }) => {
  const versions = opts.dryRun ? null : hostVersions(opts);
  const { plan, parse } = planning ?? (await planRun(ctx, paths, integrations));
  log(`j3w1-theme ${ctx.theme.version} ${ctx.theme.ref} (${ctx.theme.revision}) profile ${ctx.theme.profile}; export via ${ctx.source.via} (${ctx.source.tagCheck}); ${ctx.source.digestCheck}`);
  if (before) before(plan);
  describePlan(plan, log);
  const changed = plan.filter((t) => t.changed);
  if (!changed.length) {
    if (command.startsWith("update") && !opts.dryRun) {
      await recordPin(ctx, paths, integrations, now());
      log(`recorded the pin ${ctx.theme.ref} (${ctx.theme.revision}) and the locks for ${integrations.join(", ")}`);
    }
    log("no changes");
    return 0;
  }
  if (opts.dryRun) {
    log("dry run: nothing written");
    return 0;
  }
  const iso = now();
  const createdDirs = missingDirs(changed);
  /* The backup comes first, so a state directory the host will not let us
     create stops the run before any managed file changes. */
  const backup = await newBackupDir(paths, iso);
  const manifest = {
    ...baseManifest(ctx, command, iso, versions),
    backup: backup.name,
    integrations,
    files: [],
    createdDirs,
    settings: [],
    state: await snapshotState(paths, backup.dir),
    disclosures: integrations.flatMap((i) => integrationDisclosures(ctx, i).map((d) => ({ integration: i, ...d }))),
    deviations: integrations.flatMap((i) => ctx.roles[i].deviations.map((d) => ({ integration: i, ...d }))),
  };
  const slots = await commit({
    backup,
    manifest,
    steps: changed,
    record: recordApply(backup),
    replan: async (t) => {
      const again = await planTarget(t, parse);
      return again.changed ? again : null;
    },
    describe: (t) => `  wrote ${t.path}${t.kind === "key" ? ` (${keyName(t)} = ${JSON.stringify(t.value)})` : ""}`,
    log,
    hooks: opts.hooks,
    resume: "Restore undoes them; or run the command again to finish it.",
  });
  await writeJson(path.join(currentDir(paths), "manifest.json"), manifest);
  await recordPin(ctx, paths, integrations, iso);
  log(`backup ${backup.dir}`);
  restartNotes(slots.map((s) => s.step), createdDirs, paths, log);
  printDisclosures(ctx, integrations, log);
  return 0;
};

const semver = (v) => String(v ?? "").replace(/^v/, "").split(/[.-]/).slice(0, 3).map(Number);
const newer = (a, b) => {
  const [x, y] = [semver(a), semver(b)];
  for (let i = 0; i < 3; i += 1) if (x[i] !== y[i]) return x[i] > y[i];
  return false;
};

const FLAG = { "claude-code": "--claude", codex: "--codex" };
const flagsFor = (integrations) => (integrations.length === INTEGRATIONS.length ? "" : ` ${integrations.map((i) => FLAG[i]).join(" ")}`);

/* One integration's installed pin: its own pin file, else (installed before
   pins were per integration) its lock, with pin.json's kit source when that
   names the same revision. */
const installedPin = async (paths, integration, kit) => {
  const own = await readJsonMaybe(path.join(currentDir(paths), `pin.${integration}.json`));
  if (own) return own;
  const locked = await readJsonMaybe(path.join(currentDir(paths), `theme.lock.${integration}.json`));
  if (!locked) return null;
  const legacy = await readJsonMaybe(path.join(currentDir(paths), "pin.json"));
  const kitSource = legacy?.revision === locked.revision ? legacy.kitSource : locked.revision === kit.theme.revision ? "local" : "revision";
  return { ref: locked.ref, revision: locked.revision, version: locked.version, profile: locked.profile, tokensDigest: locked.exports?.[kit.exports.tokens], kitSource };
};

/* Each integration's installed pin wins over kit.json's once there is one:
   only update moves it, and only for the integrations it names, so apply
   never goes back to an older release and never jumps ahead to a newer one
   on its own. An integration not installed yet takes kit.json's pin. The
   result has one context per distinct pin. */
const pinnedContexts = async (opts, paths, log, integrations = opts.integrations) => {
  const kit = localKit().kit;
  const where = { sourceRoot: opts.sourceRoot ?? DEFAULT_SOURCE_ROOT, offline: Boolean(opts.sourceRoot) };
  const groups = new Map();
  for (const i of integrations) {
    const pin = await installedPin(paths, i, kit);
    const id = pin ? JSON.stringify([pin.ref, pin.revision, pin.version, pin.profile, pin.tokensDigest ?? null, pin.kitSource ?? "local"]) : "kit.json";
    if (!groups.has(id)) groups.set(id, { pin, integrations: [] });
    groups.get(id).integrations.push(i);
  }
  const out = [];
  for (const { pin, integrations: members } of groups.values()) {
    if (!pin) {
      out.push({ ctx: await loadContext(where), integrations: members });
      continue;
    }
    const names = members.join(", ");
    if (pin.revision !== kit.theme.revision) {
      const direction = newer(kit.theme.ref, pin.ref) ? "to move to it" : "to go back to it";
      log(`${names}: using the installed pin ${pin.ref} (${pin.revision}); this checkout's kit.json pins ${kit.theme.ref}. Run update --version ${kit.theme.ref}${flagsFor(members)} ${direction}.`);
    }
    try {
      out.push({ ctx: await loadContext({ ...where, pin: { ref: pin.ref, revision: pin.revision, version: pin.version, profile: pin.profile, ...(pin.tokensDigest ? { tokensDigest: pin.tokensDigest } : {}) }, kitSource: pin.kitSource ?? "local" }), integrations: members });
    } catch (error) {
      if (!(error instanceof KitError)) throw error;
      throw new KitError(`${names}: the installed pin ${pin.ref} (${pin.revision}) cannot be loaded: ${error.message}. The kit does not fall back to kit.json's ${kit.theme.ref}; pass --source-root <a checkout that has ${pin.revision}>, or run update --version <tag>${flagsFor(members)} to move the pin on purpose.`);
    }
  }
  return out;
};

/* Every pin group is planned, with every guard, before any group is
   written: a planning error in any group writes nothing. Each group is then
   written under its own backup. */
export const apply = async (opts, paths, log) => {
  const groups = await pinnedContexts(opts, paths, log);
  for (const g of groups) g.planning = await planRun(g.ctx, paths, g.integrations);
  for (const { ctx, integrations, planning } of groups) {
    const code = await run({ ctx, paths, opts, command: "apply", integrations, log, planning });
    if (code) return code;
  }
  return 0;
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

/* ---- specimen and test -------------------------------------------------- */

export const specimen = async (opts, paths, log, out) => {
  for (const { ctx } of await pinnedContexts(opts, paths, log)) out(renderSpecimen(ctx));
  return 0;
};

export const test = async (opts, paths, log, out) => {
  const groups = await pinnedContexts(opts, paths, log);
  if (!opts.noSpecimen) for (const { ctx } of groups) out(renderSpecimen(ctx));
  const results = [];
  const check = (status, what) => {
    results.push(status);
    log(`${status.padEnd(4)} ${what}`);
  };
  const targets = groups.flatMap(({ ctx, integrations }) => buildTargets(ctx, paths, integrations));
  const parse = targets.some((t) => t.format === "toml") ? await tomlParser() : null;
  const ctxOf = (i) => groups.find((g) => g.integrations.includes(i)).ctx;
  for (const target of targets) {
    let t;
    try {
      t = await planTarget(target, parse);
    } catch (error) {
      if (!(error instanceof EditError)) throw error;
      check("FAIL", error.message);
      continue;
    }
    if (t.kind === "file") check(t.changed ? "FAIL" : "PASS", `${t.path} ${t.before ? (t.changed ? "differs from" : "equals") : "is missing; expected"} the generated ${t.integration} theme`);
    else check(t.changed ? "FAIL" : "PASS", `${t.path} ${keyName(t)} = ${show(t.current.present ? t.current.value : undefined)} (expected ${JSON.stringify(t.value)})`);
  }
  if (opts.integrations.includes("codex")) {
    const ctx = ctxOf("codex");
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
      const configPath = path.join(rt, "config.toml");
      const config = await readMaybe(configPath);
      const want = ctx.roles.codex.theme.name;
      let value = { present: false };
      let problem = null;
      try {
        if (config) value = tomlRead(parse, decodeText(config).text, "tui", "theme", configPath);
      } catch (error) {
        if (!(error instanceof EditError)) throw error;
        problem = error.message;
      }
      if (problem) check("WARN", `Orca runtime config: ${problem}`);
      else check(value.present && value.value === want ? "PASS" : "WARN", `Orca runtime config tui.theme = ${show(value.present ? value.value : undefined)}${value.value === want ? "" : `; Orca syncs ${want} from ${path.join(paths.codexHome, "config.toml")} at the next Codex pane launch`}`);
    }
  }
  const versions = hostVersions(opts);
  for (const i of opts.integrations) {
    const { host } = ctxOf(i).roles[i];
    const v = versions[i];
    if (!v) check("WARN", `${host.name} version unknown (not probed or not installed); roles observed on ${host.observedVersions.join(", ")}`);
    else check(host.observedVersions.includes(v) ? "PASS" : "WARN", `${host.name} ${v}; roles observed on ${host.observedVersions.join(", ")}`);
  }
  for (const { ctx, integrations } of groups) printDisclosures(ctx, integrations, log);
  const failed = results.includes("FAIL");
  log(failed ? "FAIL" : "PASS");
  return failed ? 1 : 0;
};

/* ---- restore ------------------------------------------------------------ */

const restoreKeyText = (entry, ref, text) => {
  if (entry.format === "json") {
    if (entry.absent) return text.trim() === "" ? text : jsonRemove(text, ref.key);
    return jsonSetRaw(text, ref.key, entry.beforeRaw ?? JSON.stringify(entry.before));
  }
  if (entry.absent) return tomlRestore(text, ref.table, ref.key, { appendedTable: entry.appendedTable });
  return tomlRestore(text, ref.table, ref.key, { beforeLine: entry.beforeLine ?? `${ref.key} = ${JSON.stringify(entry.before)}` });
};

const emptyDocument = (ref, text) => (ref.format === "json" ? text.trim() === "" || jsonMembers(text).members.length === 0 : text.trim() === "");

/* A restore is written as not complete and marked complete only after its
   last write and the state reset. A complete restore that left nothing of
   the kit applied (default, --backup or --latest, and a restore that had
   nothing to change) is a baseline: the default restore undoes everything
   since the last one. Manifests written before completion was recorded count
   as one when they say so and did not stop partway, or, older still, when
   they restored the first backup, which was then the default. */
const isRestore = (manifest) => String(manifest.command ?? "").startsWith("restore");
const interrupted = (manifest) => isRestore(manifest) && (manifest.complete === false || (manifest.complete === undefined && Boolean(manifest.incomplete)));
const isBaseline = (manifest, first) => {
  if (!isRestore(manifest) || interrupted(manifest)) return false;
  if (manifest.complete === true) return manifest.baseline === true;
  return manifest.baseline === true || (manifest.baseline === undefined && manifest.command === `restore ${first}`);
};

const keyBeforeValue = (e) => (e.absent ? undefined : e.before);
const keyAfterValue = (e) => (e.afterAbsent ? undefined : e.after);

/* Per file and per key: the earliest entry (its before-value is the target)
   and the latest one (what the kit last wrote, to detect later edits). Where
   a later run found something other than what the run before it left, the
   owner (or another program) changed it in between: that is recorded, and
   restore still puts back the earliest before-value. */
const mergeManifests = (chosen, { bridged = () => false } = {}) => {
  const files = new Map();
  const keys = new Map();
  for (const b of chosen) {
    /* A restore that stopped partway is not undone, but what it wrote is the
       kit's own change: it only moves "last" on for what is undone. */
    const bridge = bridged(b.manifest);
    for (const f of b.manifest.files ?? []) {
      const m = files.get(f.path);
      if (!m && bridge) continue;
      if (!m) files.set(f.path, { first: f, firstName: b.name, dir: b.dir, last: f, lastName: b.name, changedBetween: [] });
      else {
        if ((f.sha256Before ?? null) !== (m.last.sha256After ?? null)) m.changedBetween.push({ from: m.lastName, to: b.name });
        Object.assign(m, { last: f, lastName: b.name });
      }
    }
    for (const s of b.manifest.settings ?? []) {
      const id = `${s.file}\u0000${s.key}`;
      const m = keys.get(id);
      if (!m && bridge) continue;
      if (!m) keys.set(id, { first: s, firstName: b.name, last: s, lastName: b.name, changedBetween: [] });
      else {
        if (!isDeepStrictEqual(keyBeforeValue(s), keyAfterValue(m.last))) m.changedBetween.push({ from: m.lastName, to: b.name, found: keyBeforeValue(s), left: keyAfterValue(m.last) });
        Object.assign(m, { last: s, lastName: b.name });
      }
    }
  }
  return { files: [...files.values()], keys: [...keys.values()] };
};

const planRestoreFile = async (merged) => {
  const { first, dir, last } = merged;
  const before = await readMaybe(first.path);
  const saved = first.existedBefore ? path.join(dir, first.backup ?? "") : null;
  const after = saved ? await readMaybe(saved) : null;
  if (saved && !after) throw new KitError(`${saved}, the saved copy of ${first.path}, is missing; nothing was written`);
  const changed = !sameBytes(before, after);
  const drift = changed && before !== null && typeof last.sha256After === "string" && sha256Hex(before) !== last.sha256After;
  return { kind: "file", merged, path: first.path, integration: first.integration, before, after, changed, drift };
};

const planRestoreKey = (merged, parse) => {
  const { first, last } = merged;
  const ref = keyRef(first);
  return planned(ref.path, async () => {
    const before = await readMaybe(ref.path);
    const { bom, text } = decodeText(before);
    const current = readKey(ref, text, parse);
    const want = first.absent ? { absent: true } : { value: first.beforeRaw !== undefined ? JSON.parse(first.beforeRaw) : first.before };
    const edited = before === null && first.absent ? text : restoreKeyText(first, ref, text);
    const remove = before !== null && !first.fileExistedBefore && emptyDocument(ref, edited);
    const changed = remove || edited !== text;
    if (changed) verifyKey(ref, text, edited, want, parse);
    const value = current.present ? current.value : undefined;
    const kitValue = last.afterAbsent ? undefined : last.after;
    return { kind: "key", merged, ref, path: ref.path, integration: first.integration, before, bom, text, current, want, remove, changed, after: remove ? null : encodeText(bom, edited), drift: changed && value !== kitValue, value, kitValue };
  });
};

/* The kit state afterwards names only what is still installed: each undone
   integration's pin and lock return to what they were before the earliest
   undone change; the manifest (and a pin.json from before per-integration
   pins) go when no lock is left. Returns whether any lock is left. */
const resetState = async (paths, chosen) => {
  const covered = new Set(chosen.flatMap((b) => b.manifest.integrations ?? []));
  const snap = chosen[0];
  const saved = async (n) => (snap.manifest.state?.includes(n) ? readMaybe(path.join(snap.dir, "current", n)) : null);
  const put = async (n, bytes) => (bytes ? writeJson(path.join(currentDir(paths), n), JSON.parse(bytes.toString("utf8"))) : removeFile(path.join(currentDir(paths), n)));
  for (const i of INTEGRATIONS) {
    if (!covered.has(i)) continue;
    for (const n of [`pin.${i}.json`, `theme.lock.${i}.json`]) await put(n, await saved(n));
  }
  const installed = INTEGRATIONS.some((i) => existsSync(path.join(currentDir(paths), `theme.lock.${i}.json`)));
  for (const n of ["manifest.json", "pin.json"]) {
    if (!installed) await removeFile(path.join(currentDir(paths), n));
    else {
      const bytes = await saved(n);
      if (bytes) await put(n, bytes);
    }
  }
  return installed;
};

export const restore = async (opts, paths, log) => {
  const versions = opts.dryRun ? null : hostVersions(opts);
  const names = await listBackups(paths);
  if (!names.length) throw new KitError(`no backups in ${backupsDir(paths)}`);
  const all = [];
  for (const name of names) {
    const dir = path.join(backupsDir(paths), name);
    const manifest = await readJsonMaybe(path.join(dir, "manifest.json"));
    if (manifest) all.push({ name, dir, manifest });
  }
  const byDefault = !(opts.backup || opts.latest);
  let chosen;
  let undo;
  if (!byDefault) {
    const name = opts.backup ?? names.at(-1);
    if (!names.includes(name)) throw new KitError(`backup ${name} not found; have ${names.join(", ")}`);
    const one = all.find((b) => b.name === name);
    if (!one) throw new KitError(`${path.join(backupsDir(paths), name)} has no manifest.json`);
    chosen = [one];
    undo = chosen;
    log(`restore ${name} (${one.manifest.command} at ${one.manifest.timestamp})`);
  } else {
    const last = all.findLastIndex((b) => isBaseline(b.manifest, names[0]));
    chosen = all.slice(last + 1);
    const since = last >= 0 ? `the restore ${all[last].name}` : "the first apply";
    if (!chosen.length) {
      log(`nothing was applied since ${since}; no changes`);
      return 0;
    }
    /* A restore that stopped partway is finished, not undone: its records
       only carry what it wrote into the gap check, and the files are read as
       they are now. */
    undo = chosen.filter((b) => !interrupted(b.manifest));
    const stopped = (m) => (!interrupted(m) ? "" : m.command === "restore" ? ", stopped partway: finishing it" : ", stopped partway");
    log(`restore: undo every change since ${since}: ${chosen.map((b) => `${b.name} (${b.manifest.command}${stopped(b.manifest)})`).join(", ")}`);
  }

  const merged = byDefault ? mergeManifests(chosen, { bridged: interrupted }) : mergeManifests(undo);
  const steps = [];
  let parse = null;
  try {
    if (merged.keys.some((k) => k.first.format === "toml")) parse = await tomlParser();
    for (const f of merged.files) steps.push(await planRestoreFile(f));
    for (const k of merged.keys) steps.push(await planRestoreKey(k, parse));
  } catch (error) {
    throw nothingWritten(error);
  }
  for (const s of steps) {
    const { merged: m } = s;
    if (s.kind === "file") {
      log(`  ${s.changed ? (s.after ? "put   " : "delete") : "same  "} ${s.path}`);
      for (const c of s.changed ? m.changedBetween : []) log(`  WARN   ${s.path} changed between ${c.from} and ${c.to}, not by the kit; restore puts back what was there before ${m.firstName}${s.after ? "" : " (no file)"}`);
      if (s.drift) log(`  WARN   ${s.path} changed after the kit wrote it (its sha256 is not the manifest's); restore replaces it and keeps this copy in its own backup`);
    } else {
      const target = s.want.absent ? "(absent)" : JSON.stringify(s.want.value);
      log(`  ${s.changed ? (s.remove ? "delete" : "set   ") : "same  "} ${s.path} ${m.first.key} -> ${target}`);
      for (const c of s.changed ? m.changedBetween : []) log(`  WARN   ${s.path} ${m.first.key} was ${show(c.found)} when ${c.to} ran, not the ${show(c.left)} ${c.from} left: it changed between them, not by the kit; restore sets the value from before ${m.firstName}, ${target}`);
      if (s.drift) log(`  WARN   ${s.path} ${m.first.key} is ${show(s.value)} now, not the kit's ${show(s.kitValue)}; restore replaces it and keeps it in its own backup manifest`);
    }
  }
  const changed = steps.filter((s) => s.changed);
  if (opts.dryRun) {
    log(changed.length ? "dry run: nothing written" : "no changes");
    return 0;
  }

  /* Back up the state being replaced; restoring this backup undoes the
     restore. A restore with nothing to change still records itself: it can
     be the baseline the next default restore starts from. */
  const iso = now();
  const backup = await newBackupDir(paths, iso);
  const own = {
    schemaVersion: 1,
    kit: chosen[0].manifest.kit,
    command: byDefault ? "restore" : `restore ${chosen[0].name}`,
    baseline: false,
    complete: false,
    restored: chosen.map((b) => b.name),
    timestamp: iso,
    hosts: versions,
    theme: (await readJsonMaybe(path.join(currentDir(paths), "manifest.json")))?.theme ?? null,
    backup: backup.name,
    integrations: [...new Set(chosen.flatMap((b) => b.manifest.integrations ?? []))],
    files: [],
    createdDirs: [],
    settings: [],
    state: await snapshotState(paths, backup.dir),
    disclosures: [],
    deviations: [],
  };
  const record = async (s) => {
    if (s.kind === "file") {
      let saved = null;
      if (s.before) {
        await fs.mkdir(path.join(backup.dir, "files"), { recursive: true, mode: 0o700 });
        saved = `files/${path.basename(s.merged.first.backup ?? s.path)}`;
        await fs.writeFile(path.join(backup.dir, saved), s.before, { mode: 0o600 });
      }
      return { path: s.path, integration: s.integration, existedBefore: Boolean(s.before), sha256Before: s.before ? sha256Hex(s.before) : null, sha256After: s.after ? sha256Hex(s.after) : null, backup: saved };
    }
    const e = s.merged.first;
    return { file: s.path, integration: s.integration, format: e.format, key: e.key, ...keyBefore(s.ref, s.text, s.current, Boolean(s.before)), ...(e.absent ? { afterAbsent: true } : { after: s.want.value }) };
  };
  const slots = await commit({
    backup,
    manifest: own,
    steps: changed,
    record,
    replan: async (s) => {
      const again = s.kind === "file" ? await planRestoreFile(s.merged) : await planRestoreKey(s.merged, parse);
      return again.changed ? again : null;
    },
    describe: (s) => (s.kind === "file" ? `  ${s.after ? "restored" : "deleted"} ${s.path}` : s.remove ? `  deleted ${s.path} (the kit created it)` : `  restored ${s.path} ${s.merged.first.key}`),
    log,
    hooks: opts.hooks,
    resume: `This restore is not complete: run restore${byDefault ? "" : ` --backup ${chosen[0].name}`} again; it finishes the job.${opts.latest ? " Not restore --latest: that undoes this stopped restore instead." : ""}`,
  });
  for (const { step, entry } of slots) {
    if (!step.drift) continue;
    if (step.kind === "file") log(`  kept the edited ${step.path} as ${path.join(backup.dir, entry.backup)}`);
    else log(`  kept the replaced ${step.path} ${entry.key} value in ${path.join(backup.dir, "manifest.json")}`);
  }
  const dirs = undo.flatMap((b) => b.manifest.createdDirs ?? []);
  for (const d of [...new Set(dirs)].sort().reverse()) {
    try {
      await fs.rmdir(d);
      log(`  removed empty ${d}`);
    } catch {
      /* not empty or already gone: leave it */
    }
  }
  const installed = await resetState(paths, chosen);
  Object.assign(own, { baseline: !installed, complete: true });
  await writeJson(path.join(backup.dir, "manifest.json"), own);
  if (!changed.length) log("no changes");
  else log(`backup of the replaced state ${backup.dir}`);
  if (!installed) log(`nothing of the kit is applied now; the next restore undoes only what is applied after this one (${backup.name})`);
  if (changed.length) log("restart: Codex: new sessions only. Claude Code: restart a running session if it keeps the j3w1 theme.");
  return 0;
};
