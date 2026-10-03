#!/usr/bin/env node
// One cloud identity, two document formats. Importing this module never connects.
import { createHash, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { ARTIFACTS, validSlug, installLink, readCloudConfig, assertCloudConfig } from "./src/contract.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const FORMATS = Object.values(ARTIFACTS);
const AUTH_LOSS = /AUTH_KEY_UNREGISTERED|AUTH_KEY_INVALID|SESSION_REVOKED|SESSION_EXPIRED|USER_DEACTIVATED|AUTH_KEY_DUPLICATED/;
const codeOf = error => String(error?.errorMessage ?? error?.code ?? error?.message ?? error);
const absent = value => !value || value.kind === "absent" || value.kind === "not-found";
export const digest = bytes => `sha256-${createHash("sha256").update(bytes).digest("base64")}`;
const identity = theme => ({ id: theme.id, accessHash: theme.accessHash });
const systemClock = { now: () => new Date(), sleep: ms => new Promise(resolve => setTimeout(resolve, ms)) };
// Client calls outside invoke() have no RPC timeout of their own; a stall
// becomes an uncertain failure that the next round reads back.
export const withTimeout = (promise, ms, label) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000} s`)), ms);
  timer.unref?.();
  promise.then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
});

export function redactor(initial = []) {
  const secrets = new Set(initial.filter(Boolean).map(String));
  const redact = value => {
    let text = typeof value === "string" ? value : JSON.stringify(value, (_, v) => typeof v === "bigint" ? String(v) : v);
    for (const secret of [...secrets].sort((a, b) => b.length - a.length)) text = text.split(secret).join("[redacted]");
    return text.replace(/\b1[A-Za-z0-9+/=_-]{100,}/g, "[redacted]")
      .replace(/(TELEGRAM_(?:SESSION|API_HASH)\s*[:=]\s*)\S+/g, "$1[redacted]");
  };
  redact.add = value => { if (value) secrets.add(String(value)); return value; };
  return redact;
}

// FLOOD_WAIT is a definite rejection. All other uncertain writes return to the
// outer convergence round, which reads the server before any further write.
async function floodCall(fn, { ci, clock, log }) {
  let total = 0;
  const cap = ci ? 120 : 600;
  for (let attempt = 0; attempt < 3; attempt++) {
    try { return await fn(); }
    catch (error) {
      const code = codeOf(error);
      const match = code.match(/FLOOD_WAIT_?(\d+)/);
      const seconds = match ? Number(match[1]) : /FLOOD_WAIT/.test(code) ? Number(error.seconds) : NaN;
      if (!Number.isFinite(seconds)) throw error;
      if (seconds > cap || total + seconds > cap || attempt === 2) throw new Error(`Telegram rate limit: retry after ${seconds} s`);
      total += seconds;
      log(`Telegram rate limit: waiting ${seconds} s`);
      // Short chunks keep interactive cancellation and progress responsive.
      for (let left = seconds * 1000; left > 0; left -= 30000) await clock.sleep(Math.min(left, 30000));
    }
  }
}

// allowCreate is false in CI: only a verified local first publication, recorded
// in cloud.json, may create the theme; CI only ever updates that identity.
export async function converge({ transport, artifacts, cloud, dryRun = false, ci = false, allowCreate = !ci, clock = systemClock, log = () => {}, onIdentity = () => {} }) {
  assertCloudConfig(cloud);
  if (cloud.title !== "j3w1") throw new Error("cloud.json title must be j3w1");
  const call = fn => floodCall(fn, { ci, clock, log });
  if (!await call(() => transport.checkAuthorization())) throw new Error("Telegram authorization missing or revoked; reconnect locally");
  const get = async (format, ref) => {
    try { return await call(() => transport.getTheme(format, ref)); }
    catch (error) {
      const code = codeOf(error);
      if (code === "THEME_FORMAT_INVALID") return { kind: "absent" };
      if (code === "THEME_INVALID" || code === "THEME_SLUG_INVALID") return { kind: "not-found" };
      throw error;
    }
  };
  const compare = async (theme, slug) => {
    const result = {};
    for (const artifact of FORMATS) {
      const remote = theme ? await get(artifact.format, identity(theme)) : null;
      if (!absent(remote)) {
        if (remote.creator !== true) throw new Error(`Refusing foreign theme at ${slug}`);
        if (String(remote.id) !== String(theme.id)) throw new Error("Theme identity changed during readback");
        if (remote.slug !== slug || remote.title !== "j3w1" || (remote.settings != null && (!Array.isArray(remote.settings) || remote.settings.length !== 0))) throw new Error(`Readback metadata mismatch for ${artifact.format}`);
      }
      const document = absent(remote) ? null : remote.document;
      const same = Boolean(document && document.mimeType === artifact.mime && digest(await call(() => document.bytes())) === digest(artifacts[artifact.format]));
      result[artifact.format] = { same, remote };
    }
    return result;
  };
  const getIdentity = async slug => {
    const android = await get("android", { slug });
    // Format absence is not identity absence: discover a Desktop-only theme
    // before considering creation, including after an interrupted write.
    return android?.kind === "absent" ? get("tdesktop", { slug }) : android;
  };
  let candidates = cloud.slug ? [cloud.slug] : cloud.slugCandidates;
  if (candidates.some(slug => !validSlug(slug))) throw new Error("Invalid configured Telegram slug");
  if (!cloud.slug) {
    // Adopt a theme the owner already created at any candidate before ever
    // creating one, so an earlier candidate freeing up never splits identity.
    for (const slug of candidates) {
      const found = await getIdentity(slug);
      if (!absent(found) && found.creator === true) { candidates = [slug]; break; }
    }
  }
  for (const slug of candidates) {
    let theme = await getIdentity(slug);
    if (absent(theme)) theme = null;
    else if (theme.creator !== true) continue;
    if (!theme && !allowCreate && !dryRun) throw new Error(`No owned cloud theme at ${slug}; CI only updates the theme a verified local publication recorded in cloud.json`);
    onIdentity({ slug, themeId: theme ? String(theme.id) : null });
    let created = false;
    let attemptedCreate = false;
    let lastError;
    const changed = new Set();
    for (let round = 0; round < 3; round++) {
      // After an uncertain create, discover exactly this slug, never another.
      if (!theme && (attemptedCreate || round > 0)) {
        const found = await getIdentity(slug);
        if (!absent(found)) {
          if (found.creator !== true) throw new Error(`Uncertain creation at ${slug}; owner must inspect this slug before retrying`);
          theme = found;
          created = attemptedCreate;
          onIdentity({ slug, themeId: String(theme.id) });
        }
      }
      const comparison = await compare(theme, slug);
      const different = FORMATS.filter(a => !comparison[a.format].same);
      if (dryRun) return { result: "dry-run", slug, themeId: theme ? String(theme.id) : null, readbackVerified: !different.length, formats: Object.fromEntries(FORMATS.map(a => [a.format, comparison[a.format].same ? "unchanged" : "would update"])) };
      // Labels come from verified state: a format reaches `changed` only when it
      // differed, so a final match after a lost response is still an update.
      if (!different.length) return { result: created ? "created" : changed.size ? "updated" : "unchanged", slug, themeId: String(theme.id), readbackVerified: true, formats: Object.fromEntries(FORMATS.map(a => [a.format, changed.has(a.format) ? "updated" : "unchanged"])) };
      if (round === 2) break; // third round is a final readback, never a blind write
      try {
        for (const artifact of different) {
          changed.add(artifact.format);
          const document = await call(() => transport.uploadTheme(artifacts[artifact.format], artifact.mime, artifact.fileName));
          if (!theme) {
            attemptedCreate = true;
            theme = await call(() => transport.createTheme({ slug, title: "j3w1", document }));
            if (!theme || theme.creator !== true) throw new Error("Unknown create result");
            created = true;
            onIdentity({ slug, themeId: String(theme.id) });
          } else await call(() => transport.updateTheme({ format: artifact.format, theme: identity(theme), document }));
        }
      } catch (error) {
        const code = codeOf(error);
        if (AUTH_LOSS.test(code) || /retry after \d+ s/.test(code) || /THEME_(?:FILE|MIME|TITLE|FORMAT)_INVALID/.test(code)) throw error;
        if (/^THEME_SLUG_(?:INVALID|OCCUPIED)$/.test(code) && !theme) {
          // Definite slug rejection permits fallback only before an uncertain write.
          if (lastError) throw new Error(`Uncertain creation at ${slug}; owner must inspect this slug before retrying`);
          break;
        }
        if (/^THEME_INVALID$/.test(code)) throw error;
        lastError = error;
        log("Interrupted Telegram write; reading back before retrying");
      }
    }
    if (lastError || theme) throw new Error(`Readback failed for ${slug}${lastError ? `: ${codeOf(lastError)}` : ": document digest mismatch"}`);
  }
  throw new Error("Configured Telegram slugs are taken or rejected; ask the owner for one replacement slug in cloud.json");
}

export function command(binary, args, { cwd = ROOT, input, env = process.env } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, { cwd, env, stdio: ["pipe", "pipe", "pipe"] });
    const chunks = [];
    child.stdout.on("data", chunk => chunks.push(chunk));
    // Never surface child stderr: remote tools may echo supplied credentials.
    child.stderr.resume();
    child.on("error", () => reject(new Error(`Could not start ${binary}`)));
    child.on("close", code => code === 0 ? resolve(Buffer.concat(chunks)) : reject(new Error(`${binary} failed (exit ${code})`)));
    child.stdin.on("error", () => {});
    child.stdin.end(input);
  });
}

export function gitAdapter(repo = ROOT, exec = command) {
  const git = async args => exec("git", args, { cwd: repo });
  return {
    resolve: async ref => (await git(["rev-parse", "--verify", "--end-of-options", `${ref}^{commit}`])).toString().trim(),
    read: (rev, file) => git(["show", `${rev}:${file}`]),
    dirty: async () => Boolean((await git(["status", "--porcelain", "--untracked-files=all", "--", "ports/telegram", "tokens", "exports"])).length),
    // The same scripts `npm run check` and `npm run validate` run, started
    // with this Node directly so no npm shim is needed (Windows included).
    checks: async () => {
      for (const [check, script] of [["check", ["scripts/generate.mjs", "--check"]], ["validate", ["scripts/validate.mjs"]]]) {
        try { await exec(process.execPath, script, { cwd: repo }); }
        catch { throw new Error(`npm run ${check} failed; run it locally to inspect the source defects`); }
      }
    },
    remoteTip: async () => (await git(["ls-remote", "--exit-code", "origin", "refs/heads/main"])).toString().split(/\s/)[0],
    isTag: async ref => { try { await git(["show-ref", "--verify", `refs/tags/${ref}`]); return true; } catch { return false; } },
    isAncestor: async rev => { try { await git(["merge-base", "--is-ancestor", rev, "origin/main"]); return true; } catch { return false; } },
  };
}

export async function preflight({ ref, ci, rollback, git, prompt, log }) {
  const revision = await git.resolve(ref);
  if (rollback) {
    if (!await git.isTag(ref) && (!/^[a-f0-9]{7,40}$/i.test(ref) || !await git.isAncestor(revision))) throw new Error("Rollback ref must be a tag or a commit SHA that is an ancestor of origin/main");
    const word = `ROLLBACK ${revision}`;
    if (await prompt(`Type ${word} to replace the documents on the existing theme: `) !== word) throw new Error("Rollback confirmation did not match");
  } else if (ci) {
    // Never let an older or rerun workflow overwrite newer cloud documents.
    if (await git.remoteTip() !== revision) throw new Error("CI publishes only the current tip of main; this revision is older or not on main");
  } else if (await git.resolve("HEAD") !== revision) {
    // The local checks below inspect the checkout, so only HEAD is publishable;
    // an earlier reviewed revision goes through rollback and its confirmation.
    throw new Error("Publish the checked-out commit (HEAD); use rollback --ref for an earlier revision");
  }
  const capabilities = JSON.parse((await git.read(revision, "exports/port-capabilities.json")).toString());
  const entries = capabilities.ports?.find(port => port.id === "telegram")?.files;
  const artifacts = {};
  for (const artifact of FORMATS) {
    const source = `ports/telegram/${artifact.path}`;
    const bytes = await git.read(revision, source);
    if (!entries?.some(file => file.source === source && file.digest === digest(bytes))) throw new Error(`Artifact digest mismatch against port-capabilities.json: ${source}`);
    artifacts[artifact.format] = bytes;
  }
  if (!ci) {
    if (await git.dirty()) throw new Error("Refusing dirty tree under ports/telegram, tokens or exports; generate and commit first");
    log("Checking generated files and source validation");
    await git.checks();
  }
  return { revision, artifacts };
}

const within = (file, dir) => file === dir || file.startsWith(`${dir}${path.sep}`);
async function canonical(file, io) {
  try { return await io.realpath(file); }
  catch (error) { if (error.code !== "ENOENT") throw error; return path.join(await canonical(path.dirname(file), io), path.basename(file)); }
}
export async function stateDirectory(env, repo = ROOT, io = fs) {
  const home = env.HOME || os.homedir();
  const root = path.resolve(env.J3W1_THEME_STATE_DIR || path.join(env.XDG_STATE_HOME || path.join(home, ".local", "state"), "j3w1-theme"));
  const directory = path.join(root, "telegram");
  if (within(await canonical(root, io), await canonical(repo, io))) throw new Error("Telegram state directory must be outside the git work tree");
  if (within(await canonical(directory, io), await canonical(repo, io))) throw new Error("Telegram state directory must be outside the git work tree");
  return directory;
}
async function secureDirectory(dir, io) {
  await io.mkdir(dir, { recursive: true, mode: 0o700 });
  await io.chmod(dir, 0o700);
}
export async function atomicJson(file, value, io = fs) {
  await secureDirectory(path.dirname(file), io);
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    await io.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600, flag: "wx" });
    await io.rename(temporary, file);
  } finally { await io.rm(temporary, { force: true }); }
}
async function readMaybe(file, io) {
  try { return JSON.parse(await io.readFile(file, "utf8")); }
  catch (error) { if (error.code === "ENOENT") return null; throw error; }
}

export async function hiddenPrompt(label) {
  const input = process.stdin;
  if (!input.isTTY || !process.stderr.isTTY) throw new Error("Setup required: run in a terminal; secrets require hidden TTY input");
  process.stderr.write(label);
  const previousRaw = input.isRaw;
  input.setRawMode(true);
  input.resume();
  return new Promise((resolve, reject) => {
    let value = "";
    const finish = error => {
      input.removeListener("data", onData);
      input.setRawMode(previousRaw);
      input.pause();
      process.stderr.write("\n");
      if (error) reject(error); else resolve(value);
    };
    const onData = chunk => {
      for (const char of chunk.toString()) {
        if (char === "\u0003") { finish(new Error("Cancelled")); return; }
        if (char === "\r" || char === "\n") { finish(); return; }
        if (char === "\u007f" || char === "\b") value = value.slice(0, -1);
        else if (char >= " ") value += char;
      }
    };
    input.on("data", onData);
  });
}

// Typed confirmations are not secrets: show what the owner types.
export async function visiblePrompt(label) {
  if (!process.stdin.isTTY || !process.stderr.isTTY) throw new Error("Confirmation requires an interactive terminal");
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  try { return (await rl.question(label)).trim(); } finally { rl.close(); }
}

// API names and camelCase fields verified against teleproto 1.229.1's
// tl/generated/api.d.ts and client sources; no theme settings are sent.
export async function liveTransport(auth, { deviceModel = "j3w1 theme publisher" } = {}) {
  const { TelegramClient, Api } = await import("teleproto");
  const { StringSession } = await import("teleproto/sessions");
  const { CustomFile } = await import("teleproto/client/uploads.js");
  const { Logger } = await import("teleproto/extensions");
  const client = new TelegramClient(new StringSession(auth.session || ""), auth.apiId, auth.apiHash, {
    deviceModel, requestRetries: 1, connectionRetries: 3, floodSleepThreshold: 0,
    baseLogger: new Logger("none"),
  });
  client.setLogLevel("none");
  const invoke = request => client.invoke(request, undefined, { maxRetryCount: 0, timeout: 30000, floodSleepThreshold: 0 });
  const invokeRedirected = async request => {
    for (let redirects = 0; ; redirects++) {
      try { return await invoke(request); }
      catch (error) {
        const migration = codeOf(error).match(/^(?:PHONE|NETWORK|USER)_MIGRATE_(\d+)$/);
        if (!migration || redirects === 2) throw error;
        // With maxRetryCount=0 teleproto throws before its migration policy.
        // This pinned client method follows only definitive pre-delivery
        // redirects; uncertain requests and flood waits are never retried here.
        await client._switchDC(Number(migration[1]));
      }
    }
  };
  const inputTheme = theme => theme.slug ? new Api.InputThemeSlug({ slug: theme.slug }) : new Api.InputTheme(theme);
  const inputDocument = document => new Api.InputDocument({ id: document.id, accessHash: document.accessHash, fileReference: document.fileReference });
  const normalized = theme => ({
    creator: theme.creator === true, id: theme.id, accessHash: theme.accessHash, slug: theme.slug, title: theme.title, settings: theme.settings ?? [],
    document: theme.document ? { id: theme.document.id, mimeType: theme.document.mimeType, size: Number(theme.document.size), bytes: async () => {
      const bytes = await withTimeout(client.downloadMedia(theme.document, {}), 120000, "Theme document download");
      if (!Buffer.isBuffer(bytes)) throw new Error("Theme document download returned no bytes");
      return bytes;
    } } : undefined,
  });
  let codeRequested = false;
  return {
    connect: () => withTimeout(client.connect(), 60000, "Telegram connection"),
    // teleproto's own checkAuthorization() turns every error into `false`, so a
    // transient network or flood error would look like a revoked session. Only
    // definite authorization errors mean "not authorized"; anything else is
    // rethrown so flood handling and ordinary failure reporting apply.
    checkAuthorization: async () => {
      try { await invoke(new Api.updates.GetState()); }
      catch (error) {
        if (AUTH_LOSS.test(codeOf(error)) || codeOf(error) === "SESSION_PASSWORD_NEEDED" || error?.code === 401) return false;
        throw error;
      }
      if ((await withTimeout(client.getMe(), 30000, "Telegram account lookup")).bot) throw new Error("Telegram Cloud Themes require a user account, not a bot");
      return true;
    },
    login: async prompt => {
      if (codeRequested) throw new Error("A login code was already requested; rerun to start a fresh login");
      const phoneNumber = await prompt("Telegram phone number: ");
      codeRequested = true;
      const sent = await invokeRedirected(new Api.auth.SendCode({ phoneNumber, apiId: auth.apiId, apiHash: auth.apiHash, settings: new Api.CodeSettings({}) }));
      if (sent instanceof Api.auth.SentCodeSuccess) return;
      const phoneCode = await prompt("Telegram login code: ");
      try { await invokeRedirected(new Api.auth.SignIn({ phoneNumber, phoneCodeHash: sent.phoneCodeHash, phoneCode })); }
      catch (error) {
        if (codeOf(error) !== "SESSION_PASSWORD_NEEDED") throw error;
        await client.signInWithPassword(auth, { password: hint => prompt(`Telegram 2FA password${hint ? " (hint available in Telegram)" : ""}: `), onError: async error => { throw error; } });
      }
    },
    session: () => client.session.save(),
    getTheme: async (format, theme) => normalized(await invoke(new Api.account.GetTheme({ format, theme: inputTheme(theme) }))),
    uploadTheme: async (bytes, mimeType, fileName) => {
      const file = await withTimeout(client.uploadFile({ file: new CustomFile(fileName, bytes.length, "", bytes), workers: 1 }), 120000, "Theme document upload");
      return invoke(new Api.account.UploadTheme({ file, fileName, mimeType }));
    },
    createTheme: async ({ slug, title, document }) => normalized(await invoke(new Api.account.CreateTheme({ slug, title, document: inputDocument(document) }))),
    updateTheme: async ({ format, theme, document }) => normalized(await invoke(new Api.account.UpdateTheme({ format, theme: inputTheme(theme), document: inputDocument(document) }))),
    logout: () => invoke(new Api.auth.LogOut()),
    destroy: () => client.destroy(),
  };
}

export const HELP = `Usage: npm run telegram:publish -- [publish] [--ref REV] [--dry-run] [--ci]
       npm run telegram:publish -- rollback --ref TAG_OR_SHA
       npm run telegram:publish -- ci-enable
       npm run telegram:publish -- disconnect [--ci]

Publishes one j3w1 Telegram Cloud Theme with Android and Desktop documents.
Artifacts are read from committed Git objects and checked against their export.
Local setup uses hidden input; CI never prompts. Dry run never writes.
Rollback, CI enablement and disconnection require typed owner confirmation.
`;
export function parseArgs(argv) {
  const options = { command: "publish", ci: false, dryRun: false };
  const args = [...argv];
  if (["publish", "rollback", "ci-enable", "disconnect"].includes(args[0])) options.command = args.shift();
  while (args.length) {
    const arg = args.shift();
    if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--ci") options.ci = true;
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--ref" && args.length) options.ref = args.shift();
    else throw new Error(`Unknown or incomplete argument: ${arg}`);
  }
  if (options.command === "rollback" && (!options.ref || options.ci || options.dryRun)) throw new Error("Rollback requires --ref and interactive confirmation");
  if (options.command === "ci-enable" && options.ci) throw new Error("ci-enable requires interactive owner intent");
  if (["ci-enable", "disconnect"].includes(options.command) && (options.ref || options.dryRun)) throw new Error("--ref and --dry-run apply to publishing only");
  return options;
}

function consumeCiEnv(env, redact) {
  const values = {};
  for (const key of ["TELEGRAM_API_ID", "TELEGRAM_API_HASH", "TELEGRAM_SESSION"]) {
    values[key] = env[key];
    redact.add(env[key]);
    delete env[key];
    delete process.env[key];
  }
  if (!Object.values(values).every(Boolean)) throw new Error("Telegram CI not configured: TELEGRAM_API_ID, TELEGRAM_API_HASH and TELEGRAM_SESSION are required");
  return { apiId: Number(values.TELEGRAM_API_ID), apiHash: values.TELEGRAM_API_HASH, session: values.TELEGRAM_SESSION };
}
function validateAuth(auth) {
  if (!Number.isSafeInteger(auth.apiId) || auth.apiId <= 0 || !/^[a-f0-9]{32}$/i.test(auth.apiHash)) throw new Error("Invalid Telegram API credentials; obtain api_id and api_hash at https://my.telegram.org/apps");
  return auth;
}

export async function run(argv, deps = {}) {
  const env = deps.env ?? process.env;
  const io = deps.fs ?? fs;
  const repo = deps.repo ?? ROOT;
  const git = deps.git ?? gitAdapter(repo);
  const clock = deps.clock ?? systemClock;
  const redact = redactor(deps.secrets ?? []);
  const log = value => (deps.log ?? console.log)(redact(value));
  const prompt = async label => redact.add(await (deps.prompt ?? hiddenPrompt)(redact(label)));
  const confirm = async label => (deps.confirm ?? deps.prompt ?? visiblePrompt)(redact(label));
  const exec = deps.command ?? command;
  const factory = deps.transportFactory ?? liveTransport;
  let transport;
  let receipt;
  let directory;
  let source;
  let options;
  let observedIdentity = {};
  const writeReceipt = async result => {
    receipt = JSON.parse(redact({ sourceRevision: source.revision, artifactDigests: Object.fromEntries(FORMATS.map(a => [a.format, digest(source.artifacts[a.format])])), slug: result.slug ?? null, themeId: result.themeId ?? null, result: result.result, readbackVerified: result.readbackVerified === true, androidImportObserved: false, desktopImportObserved: false, ...(result.error ? { error: result.error } : {}) }));
    const file = path.join(directory, "receipts", `${clock.now().toISOString().replace(/[:.]/g, "-")}-${source.revision.slice(0, 8)}.json`);
    await secureDirectory(path.dirname(directory), io);
    await secureDirectory(directory, io);
    await atomicJson(file, receipt, io);
    if (env.GITHUB_STEP_SUMMARY) await io.appendFile(env.GITHUB_STEP_SUMMARY, redact(`Telegram theme: ${receipt.result}; readback verified: ${receipt.readbackVerified}.\n${receipt.slug ? installLink(receipt.slug) : ""}\n`));
  };
  try {
    options = parseArgs(argv);
    if (options.help) { log(HELP); return { code: 0 }; }
    const ciAuth = options.ci && options.command !== "disconnect" ? consumeCiEnv(env, redact) : null;
    directory = await stateDirectory(env, repo, io);
    const authFile = path.join(directory, "auth.json");
    let auth = ciAuth ?? await readMaybe(authFile, io);
    for (const value of [auth?.apiHash, auth?.session]) redact.add(value);
    if (options.command === "disconnect") {
      const word = options.ci ? "DISCONNECT TELEGRAM CI" : "DISCONNECT TELEGRAM";
      if (await confirm(`Type ${word} to revoke publisher access: `) !== word) throw new Error("Disconnection confirmation did not match");
      if (options.ci) {
        // Disable publishing first, so a partial failure never leaves it
        // enabled with incomplete secrets. Read what exists so a rerun after an
        // interruption continues, while real permission or network failures
        // still stop the command.
        const names = async args => (await exec("gh", [...args, "--json", "name", "--jq", ".[].name"], { cwd: repo, env })).toString().split("\n").map(s => s.trim()).filter(Boolean);
        if ((await names(["variable", "list"])).includes("TELEGRAM_PUBLISH")) await exec("gh", ["variable", "delete", "TELEGRAM_PUBLISH"], { cwd: repo, env });
        else log("Automatic publishing was already disabled (no TELEGRAM_PUBLISH variable).");
        const present = await names(["secret", "list", "--env", "telegram"]);
        for (const name of ["TELEGRAM_API_ID", "TELEGRAM_API_HASH", "TELEGRAM_SESSION"]) {
          if (present.includes(name)) await exec("gh", ["secret", "delete", name, "--env", "telegram"], { cwd: repo, env });
        }
        log("Terminate the \"j3w1 theme CI\" session in Telegram → Settings → Devices.");
      } else {
        let logoutError;
        try {
          if (auth?.session) {
            transport = await factory(validateAuth(auth));
            await transport.connect();
            await transport.logout();
          }
        } catch (error) { logoutError = error; }
        finally { await io.rm(directory, { recursive: true, force: true }); }
        log("Local publisher state deleted. Telegram → Settings → Devices → terminate the publisher session (required when a session is under 24 h old).");
        if (logoutError) throw logoutError;
      }
      log("Telegram publisher disconnected");
      return { code: 0 };
    }
    const enabling = options.command === "ci-enable";
    const cloud = deps.cloud ?? await readCloudConfig(path.join(repo, "ports/telegram"));
    // CI only ever updates the identity a verified local first publication
    // recorded; it never discovers or creates one.
    if ((options.ci || enabling) && !(cloud.published && cloud.slug)) throw new Error("Publish once locally first: CI updates only the cloud theme recorded in cloud.json (published with a slug)");
    if (enabling && await confirm("Type ENABLE TELEGRAM CI to create dedicated main-only publishing access: ") !== "ENABLE TELEGRAM CI") throw new Error("CI enablement confirmation did not match");
    if (enabling) {
      const repository = (await exec("gh", ["repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"], { cwd: repo, env })).toString().trim();
      if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) throw new Error("Could not identify GitHub repository");
      const endpoint = `repos/${repository}/environments/telegram`;
      await exec("gh", ["api", "--method", "PUT", endpoint, "--input", "-"], { cwd: repo, env, input: JSON.stringify({ deployment_branch_policy: { protected_branches: false, custom_branch_policies: true } }) });
      const pages = JSON.parse((await exec("gh", ["api", `${endpoint}/deployment-branch-policies?per_page=100`, "--paginate", "--slurp"], { cwd: repo, env })).toString());
      const policies = pages.flatMap(page => page.branch_policies ?? []);
      for (const policy of policies) if (policy.name !== "main" || policy.type !== "branch") await exec("gh", ["api", "--method", "DELETE", `${endpoint}/deployment-branch-policies/${policy.id}`], { cwd: repo, env });
      if (!policies.some(p => p.name === "main" && p.type === "branch")) await exec("gh", ["api", "--method", "POST", `${endpoint}/deployment-branch-policies`, "--input", "-"], { cwd: repo, env, input: JSON.stringify({ name: "main", type: "branch" }) });
    }
    // A noninteractive dry run diagnoses missing setup without prompting or
    // touching state, even before artifacts have been committed for publishing.
    if (options.dryRun && !auth?.session) throw new Error("Setup required: authorize the publisher locally before a dry run");
    if (!enabling) source = await preflight({ ref: options.ref ?? (options.ci ? env.GITHUB_SHA : "HEAD"), ci: options.ci, rollback: options.command === "rollback", git, prompt: confirm, log });
    if (!auth?.apiId || !auth?.apiHash) {
      if (options.ci) throw new Error("Telegram CI not configured");
      log("Open https://my.telegram.org/apps and sign in with your Telegram account.\nCreate an API application to obtain api_id and api_hash.\nEnter them below; they stay in private local state and are never committed.");
      auth = { apiId: Number(await prompt("Telegram api_id: ")), apiHash: await prompt("Telegram api_hash: "), session: "" };
    }
    validateAuth(auth);
    if (enabling) auth = { ...auth, session: "" };
    transport = deps.transport ?? await factory(auth, { deviceModel: enabling ? "j3w1 theme CI" : "j3w1 theme publisher" });
    await transport.connect?.();
    if (!await floodCall(() => transport.checkAuthorization(), { ci: options.ci, clock, log })) {
      if (options.ci || options.dryRun || auth.session) throw new Error("Telegram authorization missing or revoked; disconnect and reconnect locally");
      await transport.login(prompt);
      if (!await floodCall(() => transport.checkAuthorization(), { ci: options.ci, clock, log })) throw new Error("Telegram login failed authorization readback");
      auth.session = redact.add(transport.session());
      if (!enabling) {
        await secureDirectory(path.dirname(directory), io);
        await atomicJson(authFile, auth, io);
      }
    }
    if (enabling) {
      try {
        for (const [name, value] of [["TELEGRAM_API_ID", String(auth.apiId)], ["TELEGRAM_API_HASH", auth.apiHash], ["TELEGRAM_SESSION", auth.session]]) await exec("gh", ["secret", "set", name, "--env", "telegram"], { cwd: repo, env, input: value });
        await exec("gh", ["variable", "set", "TELEGRAM_PUBLISH", "--body", "enabled"], { cwd: repo, env });
      } catch (error) { await transport.logout(); throw error; }
      log("Telegram CI enabled for main with a dedicated session; no CI session was saved locally");
      return { code: 0 };
    }
    const result = await converge({ transport, artifacts: source.artifacts, cloud, dryRun: options.dryRun, ci: options.ci, clock, log, onIdentity: value => { observedIdentity = value; } });
    if (!options.dryRun) {
      await writeReceipt(result);
      if (!options.ci && !cloud.published && result.readbackVerified) {
        const next = assertCloudConfig({ ...cloud, slug: result.slug, published: true });
        await io.writeFile(path.join(repo, "ports/telegram/cloud.json"), `${JSON.stringify(next, null, 2)}\n`);
        log("First local publication verified: run npm run generate and commit cloud.json and the generated files");
      }
    }
    log(`${result.result}: ${Object.entries(result.formats).map(([format, outcome]) => `${format} ${outcome}`).join(", ")}\n${installLink(result.slug)}`);
    return { code: 0, ...result, receipt };
  } catch (error) {
    const message = redact(codeOf(error));
    if (source && directory && !options?.dryRun) {
      try { await writeReceipt({ ...observedIdentity, result: "failed", error: message }); }
      catch { log("Could not write the failed publication receipt"); }
    }
    log(message);
    return { code: 1, error: message, receipt };
  } finally {
    if (transport) {
      try { await transport.destroy(); }
      catch { log("Telegram client cleanup failed"); }
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await run(process.argv.slice(2));
  process.exit(result.code);
}
