import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { parse } from "yaml";
import { converge, digest, run, redactor, stateDirectory, atomicJson, gitAdapter, parseArgs, liveTransport } from "../ports/telegram/publish.mjs";
import { ARTIFACTS } from "../ports/telegram/src/contract.mjs";

const artifacts = { android: Buffer.from("fixture android\n"), tdesktop: Buffer.from([0, 255, 17, 33, 10]) };
const cloud = { schemaVersion: 1, title: "j3w1", slugCandidates: ["j3w1", "j3w1_theme"], slug: null, published: false };
const rev = "a".repeat(40);
const auth = () => ({ apiId: 12345, apiHash: "ab".repeat(16), session: "1" + "FaKe0_".repeat(30) });
const rpc = code => Object.assign(new Error(code), { errorMessage: code });

function mock(initial = []) {
  const events = [];
  const themes = new Map();
  let next = 1;
  const add = (slug, docs = artifacts, creator = true) => {
    const theme = { id: String(next++), accessHash: "access", slug, title: "j3w1", creator, settings: [], docs: { ...docs } };
    themes.set(slug, theme);
    return theme;
  };
  for (const theme of initial) add(...theme);
  const remote = (theme, format) => ({ ...theme, document: theme.docs[format] ? { id: `doc-${format}`, mimeType: format === "android" ? ARTIFACTS.android.mime : ARTIFACTS.desktop.mime, size: theme.docs[format].length, bytes: async () => { events.push(["download", format]); return theme.docs[format]; } } : undefined });
  const transport = {
    events, themes, add,
    checkAuthorization: async () => { events.push(["auth"]); return true; },
    connect: async () => { events.push(["connect"]); },
    destroy: async () => { events.push(["destroy"]); },
    getTheme: async (format, ref) => {
      events.push(["get", format, { ...ref }]);
      const theme = ref.slug ? themes.get(ref.slug) : [...themes.values()].find(t => t.id === ref.id);
      if (!theme) return { kind: "not-found" };
      if (!theme.docs[format]) return { kind: "absent" };
      return remote(theme, format);
    },
    uploadTheme: async (bytes, mime, fileName) => { events.push(["upload", mime, fileName]); return { bytes, mime }; },
    createTheme: async payload => {
      events.push(["create", payload]);
      assert.equal(Object.hasOwn(payload, "settings"), false);
      assert.equal(payload.document.mime, ARTIFACTS.android.mime);
      if (themes.has(payload.slug)) throw rpc("THEME_SLUG_OCCUPIED");
      return remote(add(payload.slug, { android: payload.document.bytes }), "android");
    },
    updateTheme: async payload => {
      events.push(["update", payload]);
      assert.equal(Object.hasOwn(payload, "settings"), false);
      const theme = [...themes.values()].find(t => t.id === payload.theme.id);
      assert.ok(theme.creator);
      theme.docs[payload.format] = payload.document.bytes;
      return remote(theme, payload.format);
    },
  };
  return transport;
}
const core = (transport, extra = {}) => converge({ transport, artifacts, cloud, ...extra });
const writes = transport => transport.events.filter(e => ["create", "update", "upload"].includes(e[0]));

async function fixture(t, { configured = true, transport = mock(), localCloud = cloud } = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "telegram-publisher-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const repo = path.join(root, "repo");
  const stateRoot = path.join(root, "private");
  await fs.mkdir(path.join(repo, "ports/telegram"), { recursive: true });
  await fs.writeFile(path.join(repo, "ports/telegram/cloud.json"), JSON.stringify(localCloud));
  const env = { HOME: root, J3W1_THEME_STATE_DIR: stateRoot };
  const state = await stateDirectory(env, repo);
  if (configured) await atomicJson(path.join(state, "auth.json"), auth());
  const calls = [];
  const git = {
    resolve: async ref => { calls.push(["resolve", ref]); return rev; },
    read: async (revision, file) => {
      calls.push(["read", revision, file]);
      if (file === "exports/port-capabilities.json") return Buffer.from(JSON.stringify({ ports: [{ id: "telegram", files: Object.values(ARTIFACTS).map(a => ({ source: `ports/telegram/${a.path}`, digest: digest(artifacts[a.format]) })) }] }));
      const artifact = Object.values(ARTIFACTS).find(a => file === `ports/telegram/${a.path}`);
      assert.ok(artifact, file);
      return artifacts[artifact.format];
    },
    dirty: async () => false,
    checks: async () => { calls.push(["checks"]); },
    isTag: async () => false,
    isAncestor: async () => true,
    remoteTip: async () => rev,
  };
  const output = [];
  const deps = { repo, env, git, transport, log: line => output.push(line), prompt: async () => { throw new Error("must not prompt"); }, clock: { now: () => new Date("2026-10-03T12:00:00.000Z"), sleep: async () => {} } };
  return { root, repo, state, stateRoot, deps, git, calls, output, transport };
}

test("first publication creates Android then attaches Desktop on the same identity without settings", async () => {
  const transport = mock();
  const result = await core(transport);
  assert.equal(result.result, "created");
  assert.equal(result.readbackVerified, true);
  const operations = writes(transport);
  assert.deepEqual(operations.map(e => e[0]), ["upload", "create", "upload", "update"]);
  assert.equal(operations[3][1].theme.id, result.themeId);
  assert.equal(operations[3][1].format, "tdesktop");
  assert.deepEqual(operations.filter(e => e[0] === "upload").map(e => e[2]), ["theme.attheme", "j3w1.tdesktop-theme"]);
});

test("only a changed format updates; no-op validates both documents without writes", async () => {
  const transport = mock([["j3w1", { ...artifacts, tdesktop: Buffer.from("old") }]]);
  const result = await core(transport);
  assert.equal(result.result, "updated");
  assert.deepEqual(result.formats, { android: "unchanged", tdesktop: "updated" });
  assert.equal(writes(transport).length, 2);
  assert.equal(writes(transport)[1][1].theme.id, "1");
  transport.events.length = 0;
  assert.equal((await core(transport)).result, "unchanged");
  assert.equal(writes(transport).length, 0);
  assert.deepEqual(transport.events.filter(e => e[0] === "download").map(e => e[1]), ["android", "tdesktop"]);
});

test("readback mismatch fails and writes only a failed receipt", async t => {
  const transport = mock([["j3w1", { ...artifacts, tdesktop: Buffer.from("old") }]]);
  transport.updateTheme = async payload => { transport.events.push(["update", payload]); };
  const f = await fixture(t, { transport });
  const result = await run([], f.deps);
  assert.equal(result.code, 1);
  assert.match(result.error, /Readback failed/);
  assert.equal(result.receipt.result, "failed");
  assert.equal(result.receipt.readbackVerified, false);
  assert.equal(result.receipt.slug, "j3w1");
  assert.equal(result.receipt.themeId, "1");
  assert.equal(JSON.parse(await fs.readFile(path.join(f.repo, "ports/telegram/cloud.json"))).published, false);
  const files = await fs.readdir(path.join(f.state, "receipts"));
  assert.equal(files.length, 1);
  assert.equal(JSON.parse(await fs.readFile(path.join(f.state, "receipts", files[0]))).result, "failed");
});

test("readback enforces title, slug, empty settings, creator, identity and MIME", async () => {
  for (const patch of [{ title: "other" }, { slug: "other_slug" }, { settings: [{}] }, { creator: false }, { id: "other" }]) {
    const transport = mock([["j3w1"]]);
    const get = transport.getTheme;
    transport.getTheme = async (format, ref) => {
      const theme = await get(format, ref);
      return ref.id ? { ...theme, ...patch } : theme;
    };
    await assert.rejects(core(transport), /mismatch|foreign|identity/i);
    assert.equal(writes(transport).length, 0);
  }
  const transport = mock([["j3w1"]]);
  const get = transport.getTheme;
  transport.getTheme = async (format, ref) => {
    const theme = await get(format, ref);
    return { ...theme, document: { ...theme.document, mimeType: "application/octet-stream" } };
  };
  await assert.rejects(core(transport), /Readback failed/);
});

test("foreign themes fall back and exhausted candidates ask for exactly one replacement slug", async () => {
  const transport = mock([["j3w1", artifacts, false]]);
  const result = await core(transport);
  assert.equal(result.slug, "j3w1_theme");
  assert.equal(transport.themes.get("j3w1").creator, false);
  const taken = mock([["j3w1", artifacts, false], ["j3w1_theme", artifacts, false]]);
  await assert.rejects(core(taken), /one replacement slug/);
  assert.equal(writes(taken).length, 0);
  await assert.rejects(core(transport, { cloud: { ...cloud, slug: "j3w1", published: true } }), /replacement slug/);
});

test("create slug rejection uses only configured fallback candidates", async () => {
  for (const code of ["THEME_SLUG_INVALID", "THEME_SLUG_OCCUPIED"]) {
    const transport = mock();
    const create = transport.createTheme;
    transport.createTheme = async payload => {
      if (payload.slug === "j3w1") { transport.events.push(["rejected", payload.slug]); throw rpc(code); }
      return create(payload);
    };
    assert.equal((await core(transport)).slug, "j3w1_theme");
    assert.equal(transport.themes.size, 1);
  }
});

test("typed not-found and absent-format errors are handled, while revoked authorization stops", async () => {
  const transport = mock();
  const get = transport.getTheme;
  transport.getTheme = async (format, ref) => {
    const result = await get(format, ref);
    if (result.kind === "not-found") throw rpc("THEME_INVALID");
    if (result.kind === "absent") throw rpc("THEME_FORMAT_INVALID");
    return result;
  };
  assert.equal((await core(transport)).result, "created");
  for (const code of [false, "SESSION_REVOKED", "AUTH_KEY_UNREGISTERED", "SESSION_EXPIRED", "USER_DEACTIVATED", "AUTH_KEY_DUPLICATED"]) {
    const revoked = mock();
    revoked.checkAuthorization = async () => { if (code === false) return false; throw rpc(code); };
    await assert.rejects(core(revoked), /revoked|SESSION|AUTH_KEY|USER_DEACTIVATED/);
    assert.equal(writes(revoked).length, 0);
  }
});

test("a Desktop-only theme is adopted and gets Android without creating a second identity", async () => {
  const transport = mock([["j3w1", { tdesktop: artifacts.tdesktop }]]);
  const result = await core(transport);
  assert.equal(result.themeId, "1");
  assert.equal(result.result, "updated");
  assert.equal(transport.themes.size, 1);
  assert.equal(transport.events.filter(e => e[0] === "create").length, 0);
  assert.deepEqual(writes(transport).map(e => e[0]), ["upload", "update"]);
  assert.equal(writes(transport)[1][1].format, "android");
});

test("CI missing configuration never prompts and consumes all credential environment keys", async t => {
  const f = await fixture(t, { configured: false });
  f.deps.env.TELEGRAM_API_HASH = auth().apiHash;
  f.deps.env.TELEGRAM_SESSION = auth().session;
  const result = await run(["--ci"], f.deps);
  assert.equal(result.code, 1);
  assert.match(result.error, /not configured/);
  assert.equal(Object.hasOwn(f.deps.env, "TELEGRAM_SESSION"), false);
  assert.equal(Object.hasOwn(f.deps.env, "TELEGRAM_API_HASH"), false);
  assert.equal(f.calls.length, 0);
});

test("FLOOD_WAIT retries within the cap and stops above it without a real wait", async () => {
  const transport = mock();
  const upload = transport.uploadTheme;
  let once = true;
  transport.uploadTheme = async (...args) => { if (once) { once = false; throw rpc("FLOOD_WAIT_5"); } return upload(...args); };
  const sleeps = [];
  assert.equal((await core(transport, { ci: true, allowCreate: true, clock: { sleep: async ms => sleeps.push(ms) } })).result, "created");
  assert.deepEqual(sleeps, [5000]);
  for (const [ci, seconds] of [[true, 121], [false, 601]]) {
    const limited = mock();
    limited.uploadTheme = async () => { throw rpc(`FLOOD_WAIT_${seconds}`); };
    await assert.rejects(core(limited, { ci, allowCreate: true, clock: { sleep: async () => assert.fail("must not sleep beyond cap") } }), new RegExp(`retry after ${seconds} s`));
  }
  const repeating = mock();
  repeating.uploadTheme = async () => { throw rpc("FLOOD_WAIT_60"); };
  await assert.rejects(core(repeating, { ci: true, allowCreate: true, clock: { sleep: async () => {} } }), /retry after 60 s/);
});

test("interrupted upload reads the slug before retrying", async () => {
  const transport = mock();
  const upload = transport.uploadTheme;
  let once = true;
  transport.uploadTheme = async (...args) => {
    if (once) { once = false; transport.events.push(["interrupted-upload"]); throw new Error("network timeout"); }
    return upload(...args);
  };
  assert.equal((await core(transport)).result, "created");
  const index = transport.events.findIndex(e => e[0] === "interrupted-upload");
  assert.equal(transport.events[index + 1][0], "get");
  assert.equal(transport.events.filter(e => e[0] === "create").length, 1);
});

test("interrupted create and update read back before retrying and never duplicate the theme", async () => {
  for (const operation of ["createTheme", "updateTheme"]) {
    const transport = mock();
    const write = transport[operation];
    let once = true;
    transport[operation] = async payload => {
      const result = await write(payload);
      if (once) { once = false; transport.events.push(["interrupted", operation]); throw new Error("connection lost after write"); }
      return result;
    };
    const result = await core(transport);
    assert.equal(result.readbackVerified, true);
    // The label follows verified state, not whether a response arrived.
    assert.equal(result.result, "created");
    assert.deepEqual(result.formats, { android: "updated", tdesktop: "updated" });
    const index = transport.events.findIndex(e => e[0] === "interrupted");
    assert.equal(transport.events[index + 1][0], "get");
    assert.equal(transport.events.filter(e => e[0] === "create").length, 1);
    assert.equal(transport.themes.size, 1);
  }
});

test("an update applied but whose response was lost is reported as updated, not unchanged", async () => {
  const transport = mock([["j3w1", { ...artifacts, tdesktop: Buffer.from("old") }]]);
  const update = transport.updateTheme;
  transport.updateTheme = async payload => { await update(payload); throw new Error("RPC timed out after 30000ms"); };
  const result = await core(transport);
  assert.equal(result.result, "updated");
  assert.deepEqual(result.formats, { android: "unchanged", tdesktop: "updated" });
  assert.equal(transport.events.filter(e => e[0] === "update").length, 1);
});

test("an owned theme at a later candidate is adopted instead of creating one at a free earlier slug", async () => {
  const transport = mock([["j3w1_theme"]]);
  const result = await core(transport);
  assert.equal(result.slug, "j3w1_theme");
  assert.equal(result.result, "unchanged");
  assert.equal(transport.events.filter(e => e[0] === "create").length, 0);
  assert.equal(transport.themes.size, 1);
});

test("CI never creates a theme: converge refuses a missing identity without writing", async () => {
  const transport = mock();
  await assert.rejects(core(transport, { ci: true, cloud: { ...cloud, slug: "j3w1", published: true } }), /CI only updates/);
  assert.equal(writes(transport).length, 0);
});

test("an update rejected by a network interruption reads both formats before retrying the changed one", async () => {
  const transport = mock([["j3w1", { ...artifacts, tdesktop: Buffer.from("old") }]]);
  const update = transport.updateTheme;
  let once = true;
  transport.updateTheme = async payload => {
    if (once) { once = false; transport.events.push(["interrupted-update"]); throw new Error("network interruption before response"); }
    return update(payload);
  };
  assert.equal((await core(transport)).result, "updated");
  const index = transport.events.findIndex(e => e[0] === "interrupted-update");
  const later = transport.events.slice(index + 1);
  assert.deepEqual(later.slice(0, 4).map(e => e[0]), ["get", "download", "get", "download"]);
  assert.equal(later[4][0], "upload");
  assert.equal(later[5][0], "update");
  assert.equal(transport.themes.size, 1);
});

test("artifact bytes are read from Git and digest mismatch or dirty trees refuse all network writes", async t => {
  const f = await fixture(t);
  const read = f.git.read;
  f.git.read = async (revision, file) => file.endsWith("attheme") ? Buffer.from("tampered") : read(revision, file);
  assert.match((await run([], f.deps)).error, /digest mismatch/);
  assert.equal(f.transport.events.length, 0);
  f.git.read = read;
  f.git.dirty = async () => true;
  assert.match((await run([], f.deps)).error, /dirty tree/);
  assert.equal(f.transport.events.length, 0);
});

test("Git adapter reads binary blobs and resolves options safely", async () => {
  const calls = [];
  const git = gitAdapter("/fixture", async (binary, args) => { calls.push([binary, args]); return args[0] === "show" ? artifacts.tdesktop : Buffer.from(rev); });
  assert.deepEqual(await git.read(rev, "ports/telegram/dist/j3w1.tdesktop-theme"), artifacts.tdesktop);
  await git.resolve("-unsafe");
  assert.deepEqual(calls[1][1], ["rev-parse", "--verify", "--end-of-options", "-unsafe^{commit}"]);
});

test("rollback requires a tag or main ancestry and exact typed confirmation, retaining cloud identity", async t => {
  const f = await fixture(t, { transport: mock([["j3w1_theme", { ...artifacts, android: Buffer.from("newer") }]]), localCloud: { ...cloud, slug: "j3w1_theme", published: true } });
  f.git.isAncestor = async () => false;
  assert.match((await run(["rollback", "--ref", rev], f.deps)).error, /ancestor/);
  f.git.isTag = async () => true;
  f.deps.prompt = async () => "wrong";
  assert.match((await run(["rollback", "--ref", "v1.0.0"], f.deps)).error, /confirmation/);
  f.deps.prompt = async () => `ROLLBACK ${rev}`;
  const result = await run(["rollback", "--ref", "v1.0.0"], f.deps);
  assert.equal(result.code, 0);
  assert.equal(result.slug, "j3w1_theme");
  assert.equal(result.themeId, "1");
  assert.equal(f.transport.events.filter(e => e[0] === "create").length, 0);
  f.git.isTag = async () => false;
  f.git.isAncestor = async () => true;
  const ancestral = await run(["rollback", "--ref", rev], f.deps);
  assert.equal(ancestral.result, "unchanged");
  assert.equal(ancestral.themeId, "1");
  assert.throws(() => parseArgs(["rollback", "--ci", "--ref", "old"]), /interactive/);
});

test("logs, thrown errors and receipts redact seeded credentials, phone, code and password", async t => {
  const f = await fixture(t);
  const secrets = [auth().apiHash, auth().session, "+51999000000", "123456", "fixture-password"];
  f.deps.secrets = secrets;
  f.transport.getTheme = async () => { throw new Error(secrets.join(" | ")); };
  const result = await run([], f.deps);
  const files = await fs.readdir(path.join(f.state, "receipts"));
  const receiptText = await fs.readFile(path.join(f.state, "receipts", files[0]), "utf8");
  for (const secret of secrets) {
    assert.ok(!f.output.join("\n").includes(secret));
    assert.ok(!receiptText.includes(secret));
    assert.ok(!result.error.includes(secret));
  }
  assert.equal(redactor(secrets)(secrets.join(" ")), Array(5).fill("[redacted]").join(" "));
});

test("state directories are 0700, atomic files 0600, and repository paths including symlinks are refused", async t => {
  const f = await fixture(t);
  await run([], f.deps);
  for (const dir of [f.stateRoot, f.state, path.join(f.state, "receipts")]) assert.equal((await fs.stat(dir)).mode & 0o777, 0o700);
  const receiptFile = (await fs.readdir(path.join(f.state, "receipts")))[0];
  for (const file of [path.join(f.state, "auth.json"), path.join(f.state, "receipts", receiptFile)]) assert.equal((await fs.stat(file)).mode & 0o777, 0o600);
  await assert.rejects(stateDirectory({ J3W1_THEME_STATE_DIR: path.join(f.repo, "state") }, f.repo), /outside the git work tree/);
  const link = path.join(f.root, "link");
  await fs.symlink(f.repo, link);
  await assert.rejects(stateDirectory({ J3W1_THEME_STATE_DIR: path.join(link, "state") }, f.repo), /outside the git work tree/);
});

test("only first verified local publication writes cloud.json; CI uses env and skips local checks", async t => {
  const f = await fixture(t);
  assert.equal((await run([], f.deps)).code, 0);
  const file = path.join(f.repo, "ports/telegram/cloud.json");
  const first = await fs.readFile(file, "utf8");
  assert.equal(JSON.parse(first).published, true);
  assert.equal(JSON.parse(first).slug, "j3w1");
  assert.equal((await run([], f.deps)).result, "unchanged");
  assert.equal(await fs.readFile(file, "utf8"), first);
  const published = { ...cloud, slug: "j3w1", published: true };
  const ci = await fixture(t, { configured: false, transport: mock([["j3w1", { ...artifacts, tdesktop: Buffer.from("old") }]]), localCloud: published });
  Object.assign(ci.deps.env, { TELEGRAM_API_ID: String(auth().apiId), TELEGRAM_API_HASH: auth().apiHash, TELEGRAM_SESSION: auth().session, GITHUB_SHA: rev });
  const result = await run(["--ci"], ci.deps);
  assert.equal(result.code, 0);
  assert.equal(result.result, "updated");
  assert.deepEqual(JSON.parse(await fs.readFile(path.join(ci.repo, "ports/telegram/cloud.json"))), published);
  assert.equal(ci.calls.some(call => call[0] === "checks"), false);
  assert.deepEqual(ci.calls[0], ["resolve", rev]);
  assert.equal((await fs.readdir(path.join(ci.state, "receipts"))).every(name => !name.includes(":")), true, "receipt names are valid on Windows");
});

test("CI and ci-enable refuse before any network call until a verified local publication is recorded", async t => {
  const f = await fixture(t, { configured: false });
  Object.assign(f.deps.env, { TELEGRAM_API_ID: String(auth().apiId), TELEGRAM_API_HASH: auth().apiHash, TELEGRAM_SESSION: auth().session, GITHUB_SHA: rev });
  assert.match((await run(["--ci"], f.deps)).error, /Publish once locally first/);
  assert.equal(f.transport.events.length, 0);
  assert.equal(f.calls.length, 0);
  const enable = await fixture(t);
  enable.deps.command = async () => assert.fail("no gh call before the refusal");
  assert.match((await run(["ci-enable"], enable.deps)).error, /Publish once locally first/);
});

test("only HEAD is published locally and only the tip of main in CI; older revisions need rollback", async t => {
  const f = await fixture(t);
  f.git.resolve = async ref => ref === "HEAD" ? rev : "b".repeat(40);
  assert.match((await run(["--ref", "some-branch"], f.deps)).error, /checked-out commit \(HEAD\)/);
  assert.equal(f.transport.events.length, 0);
  const ci = await fixture(t, { configured: false, transport: mock([["j3w1"]]), localCloud: { ...cloud, slug: "j3w1", published: true } });
  Object.assign(ci.deps.env, { TELEGRAM_API_ID: String(auth().apiId), TELEGRAM_API_HASH: auth().apiHash, TELEGRAM_SESSION: auth().session, GITHUB_SHA: rev });
  ci.git.remoteTip = async () => "c".repeat(40);
  assert.match((await run(["--ci"], ci.deps)).error, /only the current tip of main/);
  assert.equal(ci.transport.events.length, 0);
});

test("dry run performs identity and compare only, and missing setup neither prompts nor creates state", async t => {
  const f = await fixture(t);
  const before = await fs.readFile(path.join(f.repo, "ports/telegram/cloud.json"));
  assert.equal((await run(["--dry-run"], f.deps)).result, "dry-run");
  assert.equal(writes(f.transport).length, 0);
  assert.deepEqual(await fs.readFile(path.join(f.repo, "ports/telegram/cloud.json")), before);
  await assert.rejects(fs.stat(path.join(f.state, "receipts")), /ENOENT/);
  const missing = await fixture(t, { configured: false });
  assert.match((await run(["--dry-run"], missing.deps)).error, /Setup required/);
  await assert.rejects(fs.stat(missing.state), /ENOENT/);
});

test("guided setup saves auth atomically and continues after a single login", async t => {
  const f = await fixture(t, { configured: false });
  let authorized = false;
  const prompts = [String(auth().apiId), auth().apiHash, "+51999000000", "123456", "fixture-password"];
  f.deps.prompt = async () => prompts.shift();
  f.transport.checkAuthorization = async () => authorized;
  f.transport.login = async prompt => { await prompt("phone"); await prompt("code"); await prompt("password"); authorized = true; };
  f.transport.session = () => auth().session;
  const result = await run([], f.deps);
  assert.equal(result.result, "created");
  assert.equal(prompts.length, 0);
  assert.deepEqual(JSON.parse(await fs.readFile(path.join(f.state, "auth.json"))), auth());
  for (const secret of [auth().apiHash, auth().session, "+51999000000", "123456", "fixture-password"]) assert.ok(!f.output.join("\n").includes(secret));
});

test("disconnect is confirmed, logs out, deletes local state and destroys the client", async t => {
  const f = await fixture(t);
  let loggedOut = false;
  f.deps.transportFactory = async () => f.transport;
  f.transport.logout = async () => { loggedOut = true; };
  f.deps.prompt = async () => "DISCONNECT TELEGRAM";
  assert.equal((await run(["disconnect"], f.deps)).code, 0);
  assert.equal(loggedOut, true);
  assert.equal(f.transport.events.at(-1)[0], "destroy");
  await assert.rejects(fs.stat(f.state), /ENOENT/);
  assert.match(f.output.join("\n"), /Settings → Devices/);
});

test("ci-enable uses a fresh dedicated login, stdin secrets, main-only policy, and no disk session", async t => {
  const f = await fixture(t, { localCloud: { ...cloud, slug: "j3w1", published: true } });
  const commands = [];
  let authorized = false;
  const prompts = ["ENABLE TELEGRAM CI", "+51999000000", "123456"];
  f.deps.prompt = async () => prompts.shift();
  f.deps.transportFactory = async (credentials, options) => {
    assert.equal(credentials.session, "");
    assert.equal(options.deviceModel, "j3w1 theme CI");
    return f.transport;
  };
  delete f.deps.transport;
  f.transport.checkAuthorization = async () => authorized;
  f.transport.login = async prompt => { await prompt("phone"); await prompt("code"); authorized = true; };
  const dedicated = "1" + "Dedicated_".repeat(20);
  f.transport.session = () => dedicated;
  f.deps.command = async (binary, args, opts) => {
    assert.equal(binary, "gh");
    commands.push({ args, input: opts.input });
    if (args[0] === "repo") return Buffer.from("fixture/theme\n");
    if (args[0] === "api" && args[1].includes("?per_page=")) return Buffer.from(JSON.stringify([{ branch_policies: [{ id: 7, name: "*", type: "branch" }] }]));
    return Buffer.from("");
  };
  assert.equal((await run(["ci-enable"], f.deps)).code, 0);
  const secretCalls = commands.filter(c => c.args[0] === "secret");
  assert.equal(secretCalls.length, 3);
  assert.equal(secretCalls.find(c => c.args[2] === "TELEGRAM_SESSION").input, dedicated);
  assert.ok(!JSON.stringify(commands.map(c => c.args)).includes(dedicated));
  assert.ok(commands.some(c => c.input === JSON.stringify({ name: "main", type: "branch" })));
  assert.ok(commands.some(c => c.args[2] === "DELETE"));
  assert.equal(commands.at(-1).args.join(" "), "variable set TELEGRAM_PUBLISH --body enabled");
  assert.deepEqual(JSON.parse(await fs.readFile(path.join(f.state, "auth.json"))), auth());
  assert.ok(!f.output.join("\n").includes(dedicated));
});

test("disconnect --ci only invokes confirmed scoped secret and repository variable deletes", async t => {
  const f = await fixture(t);
  const calls = [];
  f.deps.prompt = async () => "DISCONNECT TELEGRAM CI";
  f.deps.command = async (binary, args) => { assert.equal(binary, "gh"); calls.push(args); return Buffer.from(""); };
  assert.equal((await run(["disconnect", "--ci"], f.deps)).code, 0);
  // Publishing is disabled before the secrets go.
  assert.deepEqual(calls[0], ["variable", "delete", "TELEGRAM_PUBLISH"]);
  assert.deepEqual(calls.slice(1, 4).map(c => c.slice(-2)), Array(3).fill(["--env", "telegram"]));
  assert.equal(f.transport.events.length, 0);
  // An already-missing secret does not abort the remaining deletions.
  calls.length = 0;
  f.deps.command = async (binary, args) => { calls.push(args); if (args[2] === "TELEGRAM_API_HASH") throw new Error("gh failed (exit 1)"); return Buffer.from(""); };
  assert.equal((await run(["disconnect", "--ci"], f.deps)).code, 0);
  assert.equal(calls.length, 4);
  assert.match(f.output.join("\n"), /Not deleted \(absent or not permitted\): TELEGRAM_API_HASH/);
});

test("publisher import allowlist and live transport single-code, cleanup and settings invariants", async () => {
  const source = await fs.readFile("ports/telegram/publish.mjs", "utf8");
  for (const match of source.matchAll(/^import .*? from "([^"]+)";/gm)) assert.ok(match[1].startsWith("node:") || match[1] === "./src/contract.mjs", match[1]);
  const liveStart = source.indexOf("export async function liveTransport");
  const liveEnd = source.indexOf("export const HELP");
  for (const match of source.matchAll(/import\("([^"]+)"\)/g)) {
    assert.ok(match[1] === "teleproto" || match[1].startsWith("teleproto/"));
    assert.ok(match.index > liveStart && match.index < liveEnd);
  }
  assert.equal((source.match(/new Api.auth.SendCode\(/g) ?? []).length, 1);
  assert.ok(!source.includes("client.start("));
  assert.ok(source.includes('client.setLogLevel("none")'));
  assert.ok(source.includes("password: hint => prompt("));
  assert.ok(!source.includes("Api.account.InstallTheme"));
  assert.ok(!source.includes("settings: undefined"));
});

test("live adapter uses vetted API objects, third-argument RPC controls, a single code request and 2FA callback without a network", async t => {
  const { TelegramClient, Api } = await import("teleproto");
  const calls = [];
  const document = { id: 3n, accessHash: 4n, fileReference: Buffer.alloc(0), mimeType: ARTIFACTS.android.mime, size: 7n };
  const theme = { creator: true, id: 1n, accessHash: 2n, slug: "j3w1", title: "j3w1", document };
  let didDestroy = false;
  let passwordCallback = false;
  const replacements = {
    connect: async () => true,
    checkAuthorization: async () => true,
    getMe: async () => ({ bot: false }),
    invoke: async (request, dcId, options) => {
      assert.equal(dcId, undefined);
      assert.deepEqual(options, { maxRetryCount: 0, timeout: 30000, floodSleepThreshold: 0 });
      calls.push(request);
      // Exercise the actual pinned TL serializer, including long identifiers.
      assert.ok(Buffer.isBuffer(request.getBytes()));
      if (request instanceof Api.auth.SendCode) return { phoneCodeHash: "fixture" };
      if (request instanceof Api.auth.SignIn) throw rpc("SESSION_PASSWORD_NEEDED");
      if (request instanceof Api.account.UploadTheme) return document;
      return theme;
    },
    signInWithPassword: async (credentials, params) => {
      assert.equal(typeof params.password, "function");
      assert.equal(await params.password("hint"), "fixture-password");
      passwordCallback = true;
    },
    uploadFile: async ({ file, workers }) => {
      assert.deepEqual(file.buffer, artifacts.android);
      assert.equal(file.name, ARTIFACTS.android.fileName);
      assert.equal(workers, 1);
      return new Api.InputFile({ id: 5n, parts: 1, name: file.name, md5Checksum: "" });
    },
    downloadMedia: async () => artifacts.android,
    destroy: async () => { didDestroy = true; },
  };
  for (const [name, replacement] of Object.entries(replacements)) {
    const previous = TelegramClient.prototype[name];
    TelegramClient.prototype[name] = replacement;
    t.after(() => { TelegramClient.prototype[name] = previous; });
  }
  const transport = await liveTransport({ ...auth(), session: "" });
  await transport.connect();
  assert.equal(await transport.checkAuthorization(), true);
  const prompts = ["+51999000000", "123456", "fixture-password"];
  await transport.login(async () => prompts.shift());
  await assert.rejects(transport.login(async () => assert.fail("no second prompt")), /already requested/);
  assert.equal(calls.filter(c => c instanceof Api.auth.SendCode).length, 1);
  assert.equal(passwordCallback, true);
  const uploaded = await transport.uploadTheme(artifacts.android, ARTIFACTS.android.mime, ARTIFACTS.android.fileName);
  assert.equal(uploaded, document);
  await transport.createTheme({ slug: "j3w1", title: "j3w1", document });
  await transport.updateTheme({ format: "tdesktop", theme: { id: 1n, accessHash: 2n }, document });
  const readback = await transport.getTheme("android", { slug: "j3w1" });
  assert.deepEqual(await readback.document.bytes(), artifacts.android);
  assert.deepEqual(readback.settings, []);
  for (const request of calls.filter(c => c instanceof Api.account.CreateTheme || c instanceof Api.account.UpdateTheme)) assert.equal(request.settings, undefined);
  assert.ok(calls.some(c => c instanceof Api.account.GetTheme && c.theme instanceof Api.InputThemeSlug));
  await transport.logout();
  await transport.destroy();
  assert.equal(didDestroy, true);
});

test("live login follows only definitive DC redirects with a two-redirect cap and no uncertain resend", async t => {
  const { TelegramClient, Api } = await import("teleproto");
  const beforeInvoke = TelegramClient.prototype.invoke;
  const beforeSwitch = TelegramClient.prototype._switchDC;
  t.after(() => {
    TelegramClient.prototype.invoke = beforeInvoke;
    TelegramClient.prototype._switchDC = beforeSwitch;
  });
  for (const [rejections, success, switchesExpected] of [
    [[rpc("PHONE_MIGRATE_1")], true, [1]],
    [[rpc("NETWORK_MIGRATE_3"), rpc("USER_MIGRATE_4")], true, [3, 4]],
    [[rpc("PHONE_MIGRATE_1"), rpc("PHONE_MIGRATE_2"), rpc("PHONE_MIGRATE_3")], false, [1, 2]],
    [[new Error("network loss after send")], false, []],
    [[new Error("RPC timed out")], false, []],
  ]) {
    const switches = [];
    let sends = 0;
    TelegramClient.prototype._switchDC = async dc => { switches.push(dc); return true; };
    TelegramClient.prototype.invoke = async request => {
      if (request instanceof Api.auth.SendCode) {
        sends++;
        if (rejections.length) throw rejections.shift();
        return { phoneCodeHash: "fixture" };
      }
      return {};
    };
    const transport = await liveTransport({ ...auth(), session: "" });
    const prompts = ["+51999000000", "123456"];
    try {
      if (success) await transport.login(async () => prompts.shift());
      else await assert.rejects(transport.login(async () => prompts.shift()));
      assert.deepEqual(switches, switchesExpected);
      assert.equal(sends, switchesExpected.length + 1);
      const sendsBefore = sends;
      await assert.rejects(transport.login(async () => assert.fail("second logical request")), /already requested/);
      assert.equal(sends, sendsBefore);
    } finally { await transport.destroy(); }
  }
});

test("live authorization check reports only definite auth loss as unauthorized and rethrows transient errors", async t => {
  const { TelegramClient, Api } = await import("teleproto");
  const before = { invoke: TelegramClient.prototype.invoke, getMe: TelegramClient.prototype.getMe, checkAuthorization: TelegramClient.prototype.checkAuthorization };
  t.after(() => Object.assign(TelegramClient.prototype, before));
  // teleproto's own checkAuthorization swallows every error; it must not be used.
  TelegramClient.prototype.checkAuthorization = async () => assert.fail("teleproto checkAuthorization must not be used");
  TelegramClient.prototype.getMe = async () => ({ bot: false });
  for (const [failure, expected] of [[null, true], [rpc("AUTH_KEY_UNREGISTERED"), false], [rpc("SESSION_REVOKED"), false], [Object.assign(new Error("unauthorized"), { code: 401 }), false]]) {
    TelegramClient.prototype.invoke = async request => { assert.ok(request instanceof Api.updates.GetState); if (failure) throw failure; return {}; };
    const transport = await liveTransport({ ...auth(), session: "" });
    try { assert.equal(await transport.checkAuthorization(), expected); } finally { await transport.destroy(); }
  }
  for (const failure of [new Error("network unreachable"), rpc("FLOOD_WAIT_7"), new Error("RPC timed out after 30000ms")]) {
    TelegramClient.prototype.invoke = async () => { throw failure; };
    const transport = await liveTransport({ ...auth(), session: "" });
    try { await assert.rejects(transport.checkAuthorization(), error => error === failure); } finally { await transport.destroy(); }
  }
});

test("Telegram CI is opt-in main-only, decides in a job without an environment, and confines credentials to one publish step", async () => {
  const source = await fs.readFile(".github/workflows/ci.yml", "utf8");
  const workflow = parse(source);
  const gateJob = workflow.jobs["telegram-gate"];
  const job = workflow.jobs.telegram;
  // A refused or no-op run must never record a successful deployment, so the
  // decision lives in a job that has no environment at all.
  assert.deepEqual(gateJob.needs, ["select", "release-gate", "deploy"]);
  assert.equal(gateJob.environment, undefined);
  assert.equal(gateJob.if, "${{ !cancelled() && github.event_name == 'push' && github.ref == 'refs/heads/main' && vars.TELEGRAM_PUBLISH == 'enabled' && needs.release-gate.result == 'success' }}");
  assert.ok(!gateJob.if.includes("needs.deploy.result") && !gateJob.if.includes("pull_request"));
  assert.deepEqual(gateJob.permissions, { contents: "read", deployments: "read" });
  assert.equal(gateJob.outputs.publish, "${{ steps.changes.outputs.publish }}");
  assert.ok(!JSON.stringify(gateJob).includes("secrets."));
  assert.deepEqual(job.needs, ["telegram-gate"]);
  assert.equal(job.if, "${{ needs.telegram-gate.outputs.publish == 'true' }}");
  assert.equal(job.environment, "telegram");
  assert.deepEqual(job.concurrency, { group: "telegram-publish", "cancel-in-progress": false });
  assert.deepEqual(job.permissions, { contents: "read" });
  const checkout = job.steps.find(s => s.uses?.startsWith("actions/checkout"));
  assert.deepEqual(checkout.with, { ref: "${{ github.sha }}", "fetch-depth": 0, "persist-credentials": false });
  assert.ok(job.steps.some(s => s.run === "npm ci --ignore-scripts"));
  const publish = job.steps.find(s => s.id === "publish");
  assert.equal(publish.run, 'node ports/telegram/publish.mjs --ci --ref "$GITHUB_SHA"');
  assert.deepEqual(Object.keys(publish.env).sort(), ["TELEGRAM_API_HASH", "TELEGRAM_API_ID", "TELEGRAM_SESSION"]);
  for (const [name, value] of Object.entries(publish.env)) assert.equal(value, `\${{ secrets.${name} }}`);
  assert.ok(!JSON.stringify({ ...job, steps: job.steps.filter(s => s !== publish) }).includes("secrets.TELEGRAM_"));
  for (const [name, other] of Object.entries(workflow.jobs)) if (name !== "telegram") assert.ok(!JSON.stringify(other).includes("secrets.TELEGRAM_"), name);
  const gate = gateJob.steps.find(s => s.id === "changes").run;
  assert.ok(gate.includes("git ls-remote --exit-code origin refs/heads/main"));
  assert.ok(gate.includes('scripts/ci/deployed.mjs "$GITHUB_REPOSITORY" telegram'));
  assert.ok(gate.includes('git merge-base --is-ancestor "$previous" HEAD'));
  assert.ok(gate.includes('git diff --quiet "$previous" HEAD -- ports/telegram/dist'));
  assert.ok(gate.includes("::notice::"));
});

test("deployed lookup preserves Pages default and supports Telegram, empty history and API failure", async t => {
  const f = await fixture(t);
  const preload = path.join(f.root, "fetch.mjs");
  await fs.writeFile(preload, `globalThis.fetch = async url => {
    if (process.env.LOOKUP_FAIL) return { ok: false, status: 503 };
    if (url.includes('/statuses?')) return { ok: true, json: async () => [{state:'success'}] };
    const environment = new URL(url).searchParams.get('environment');
    return { ok: true, json: async () => process.env.LOOKUP_EMPTY ? [] : [{id:1,sha:environment}] };
  };`);
  const lookup = (args, extra = {}) => spawnSync(process.execPath, ["--import", preload, "scripts/ci/deployed.mjs", "fixture/theme", ...args], { encoding: "utf8", env: { ...process.env, ...extra } });
  assert.equal(lookup([]).stdout, "github-pages");
  assert.equal(lookup(["telegram"]).stdout, "telegram");
  assert.equal(lookup(["telegram"], { LOOKUP_EMPTY: "1" }).status, 1);
  assert.equal(lookup(["telegram"], { LOOKUP_FAIL: "1" }).status, 2);
});

test("release change gate publishes only the tip of main with new bytes, and reruns never republish older files", async t => {
  const f = await fixture(t);
  const bin = path.join(f.root, "bin");
  await fs.mkdir(bin);
  await fs.writeFile(path.join(bin, "node"), `#!${process.execPath}\nprocess.stdout.write(process.env.PREVIOUS_SHA || ''); process.exit(Number(process.env.LOOKUP_STATUS || 0));\n`, { mode: 0o700 });
  await fs.writeFile(path.join(bin, "git"), `#!${process.execPath}\nconst cmd = process.argv[2];\nif (cmd === 'ls-remote') { process.stdout.write((process.env.TIP_SHA ?? process.env.GITHUB_SHA) + '\\trefs/heads/main\\n'); process.exit(0); }\nprocess.exit(cmd === 'merge-base' ? Number(process.env.ANCESTOR_STATUS || 0) : Number(process.env.DIFF_STATUS || 0));\n`, { mode: 0o700 });
  const workflow = parse(await fs.readFile(".github/workflows/ci.yml", "utf8"));
  const gate = workflow.jobs["telegram-gate"].steps.find(step => step.id === "changes").run;
  const [A, X, B] = ["1", "2", "3"].map(n => n.repeat(40));
  for (const [extra, want, notice] of [
    [{ LOOKUP_STATUS: "1" }, "true", false],
    [{ PREVIOUS_SHA: rev, DIFF_STATUS: "1" }, "true", false],
    [{ PREVIOUS_SHA: rev }, "false", false],
    [{ PREVIOUS_SHA: rev, ANCESTOR_STATUS: "1" }, "false", true],
    [{ LOOKUP_STATUS: "2" }, 2, false],
    [{ PREVIOUS_SHA: rev, ANCESTOR_STATUS: "128" }, 128, false],
    // Review R1: main is A → X → B and B is published. Rerunning A, then X,
    // never reaches a publication, because neither is the tip of main.
    [{ GITHUB_SHA: A, TIP_SHA: B, PREVIOUS_SHA: B, ANCESTOR_STATUS: "1" }, "false", true],
    [{ GITHUB_SHA: X, TIP_SHA: B, PREVIOUS_SHA: A, DIFF_STATUS: "1" }, "false", true],
  ]) {
    const outputFile = path.join(f.root, `output-${Math.random()}`);
    const result = spawnSync("bash", ["-e", "-o", "pipefail", "-c", gate], { encoding: "utf8", env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, GITHUB_REPOSITORY: "fixture/theme", GITHUB_SHA: rev, GITHUB_OUTPUT: outputFile, PREVIOUS_SHA: "", LOOKUP_STATUS: "0", ANCESTOR_STATUS: "0", DIFF_STATUS: "0", ...extra } });
    if (typeof want === "number") {
      assert.equal(result.status, want);
      await assert.rejects(fs.stat(outputFile), /ENOENT/);
    } else {
      assert.equal(result.status, 0, result.stderr);
      assert.equal((await fs.readFile(outputFile, "utf8")).trim(), `publish=${want}`);
      assert.equal(result.stdout.includes("::notice::"), notice);
    }
  }
});
