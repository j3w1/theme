/* Drives the Orca installer (ports/orca/install) through a real PowerShell 7
   against a fake APPDATA/LOCALAPPDATA tree. The installer's test seam
   (J3W1_KIT_TEST_ROOT) maps both folders under the scratch root, reads Orca's
   running state and the installed fonts from variables and refuses the
   network, so every read and write stays inside the scratch root; HOME,
   TMPDIR and the XDG folders of pwsh itself are pointed there too.
   Run from this clone, the scripts take every value from git objects at
   HEAD; the expected values and the Ghostty reference are read the same way,
   so a change that is not committed does not break these tests (commit
   first). Without pwsh, or with a HEAD that has no ports/orca/install, the
   suite skips locally and fails in CI. */

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, promises as fs, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { readJson, repoRoot } from "../scripts/lib/fs.mjs";
import { scratchDir } from "./helpers/scratch.mjs";

const install = path.join(repoRoot, "ports/orca/install");
const FONT = "SauceCodePro NFM Regular (TrueType)";
const BLOCK_START = "# >>> j3w1-theme (managed; do not edit) >>>";
const BLOCK_END = "# <<< j3w1-theme <<<";
const TOKENS = "exports/tokens.resolved.json";
const DIGESTS = "exports/digests.json";
const INSTALLER_ID = "j3w1-theme-installer";

/* pwsh from $J3W1_PWSH or PATH, 7.4 or later. `pwsh --version` starts no
   session, so the probe writes nothing under the real HOME. */
const findPwsh = () => {
  const names = process.platform === "win32" ? ["pwsh.exe"] : ["pwsh"];
  const onPath = (process.env.PATH ?? "").split(path.delimiter).filter(Boolean).flatMap((dir) => names.map((name) => path.join(dir, name)));
  for (const exe of [process.env.J3W1_PWSH, ...onPath].filter((file) => file && existsSync(file))) {
    const probe = spawnSync(exe, ["--version"], { encoding: "utf8" });
    const version = probe.status === 0 && /PowerShell (\d+)\.(\d+)/.exec(probe.stdout);
    if (!version) continue;
    const [major, minor] = [Number(version[1]), Number(version[2])];
    if (major > 7 || (major === 7 && minor >= 4)) return { exe: path.resolve(exe), version: probe.stdout.trim() };
  }
  return null;
};
const pwsh = findPwsh();
const noPwsh = pwsh ? false : "PowerShell 7.4+ (pwsh) not found; put it on PATH or set J3W1_PWSH";
if (noPwsh && process.env.CI) {
  test("PowerShell 7.4+ is available for the Orca installer tests", () => assert.fail(noPwsh));
}

const gitText = (args, cwd = repoRoot) => spawnSync("git", ["-C", cwd, ...args], { encoding: "utf8" }).stdout.trim();
const HEAD = gitText(["rev-parse", "HEAD"]);
/* One file at HEAD, from git objects; null when absent. */
const atHead = (file) => {
  const result = spawnSync("git", ["-C", repoRoot, "cat-file", "blob", `${HEAD}:${file}`], { maxBuffer: 64 * 1024 * 1024 });
  return result.status === 0 ? result.stdout : null;
};
const noHead = atHead("ports/orca/install/J3w1Orca.psm1") ? false : `HEAD (${HEAD}) has no committed ports/orca/install; commit it first`;
if (noHead && process.env.CI) {
  test("HEAD carries the Orca installer for its tests", () => assert.fail(noHead));
}
const skip = noPwsh || noHead;

const TAG = /^v\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;
const headTags = gitText(["tag", "--points-at", HEAD]).split("\n").filter((t) => TAG.test(t));
const HEAD_REF = headTags.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))[0] ?? HEAD;
const roles = noHead ? { orca: { terminalColorOverrides: {}, settings: {}, preserve: [] }, deviations: [] } : JSON.parse(atHead("ports/orca/host.json").toString("utf8"));
const headTokensBytes = atHead(TOKENS);
const digestOf = (bytes) => `sha256-${createHash("sha256").update(bytes).digest("base64")}`;
const headDigests = noHead ? { files: {} } : JSON.parse(atHead(DIGESTS).toString("utf8"));
const HEAD_VERSION = noHead ? "" : JSON.parse(headTokensBytes.toString("utf8")).version;
const tokens = noHead ? {} : JSON.parse(headTokensBytes.toString("utf8")).profiles.default.tokens;
const color = (id) => tokens[id].css.toLowerCase();
const expectedOverrides = noHead ? {} : Object.fromEntries(Object.entries(roles.orca.terminalColorOverrides).map(([key, id]) => [key, color(id)]));
/* The keys the installer sets: a preference (the font size) is carried from
   the machine and never set. */
const managedKeys = ["terminalColorOverrides", ...Object.keys(roles.orca.settings).filter((key) => !roles.orca.settings[key].preference)];
/* Every value the installer sets except the font size (a preference): what
   Orca holds after the GUI steps (Import from Ghostty, Color Contrast Off,
   Match Terminal). */
const kitSettings = () => {
  const values = { terminalColorOverrides: expectedOverrides };
  for (const [key, rule] of Object.entries(roles.orca.settings)) {
    if (rule.preference) continue;
    if ("value" in rule) values[key] = rule.value;
    else if (tokens[rule.token].type === "fontFamily") values[key] = tokens[rule.token].value[0];
    else values[key] = color(rule.token);
  }
  return values;
};

/* The files Get-J3w1Orca.ps1 downloads, as its own list names them. */
const GET_FILES = [...readFileSync(path.join(install, "Get-J3w1Orca.ps1"), "utf8").match(/\$files = @\(([\s\S]*?)\n\)/)[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);

/* The child sees a PATH without any claude binary, so the installer's Claude
   Code probe never starts a real client from the tests. */
const childPath = () => {
  const keep = (process.env.PATH ?? "").split(path.delimiter).filter((dir) => dir && !["claude", "claude.exe", "claude.cmd"].some((name) => existsSync(path.join(dir, name))));
  return [path.dirname(pwsh.exe), ...keep].join(path.delimiter);
};

/* A store with unrelated state the installer must carry byte-significantly:
   nested objects, ISO dates, a number beyond double precision, an exponent,
   unicode, and a pre-existing override object and sidebar mode. */
const STORE = `{
  "repos": [
    { "id": "r-1", "path": "C:\\\\dev\\\\theme", "addedAt": "2026-09-20T08:15:30.123Z", "pinned": true }
  ],
  "sshTargets": [{ "host": "devbox.example", "port": 22, "identity": null }],
  "counter": 90071992547409931234,
  "settings": {
    "theme": "system",
    "appFontFamily": "JetBrainsMono NF",
    "editorFontFamily": "Consolas",
    "terminalFontSize": 14,
    "terminalCursorStyle": "bar",
    "terminalColorOverrides": { "foreground": "tomato" },
    "leftSidebarAppearanceMode": "custom",
    "workspaces": { "nested": { "deep": [1, [2, [3, { "x": "y" }]]] } },
    "greeting": "h\u00e9llo w\u00f6rld \u2713 \u65e5\u672c \ud83d\ude00",
    "lastOpened": "2026-09-24T21:00:00.000Z",
    "ratio": 1.5e-7
  },
  "ui": { "uiZoomLevel": 0, "sidebarWidth": 280 }
}
`;
const GHOSTTY = "# my own settings\nfont-thicken = true\nwindow-padding-x = 4\n";

const makeTree = async (t, { ghostty = GHOSTTY } = {}) => {
  const root = await scratchDir(t, "j3w1-orca-install-");
  const roaming = path.join(root, "AppData", "Roaming");
  const profile = path.join(roaming, "orca", "profiles", "local-default");
  await fs.mkdir(profile, { recursive: true });
  await fs.mkdir(path.join(roaming, "ghostty"), { recursive: true });
  for (const dir of ["home", "tmp", "xdg-cache", "xdg-data", "xdg-config"]) await fs.mkdir(path.join(root, dir));
  await fs.writeFile(path.join(roaming, "orca", "orca-profile-index.json"), JSON.stringify({ activeProfileId: "local-default" }));
  const store = path.join(profile, "orca-data.json");
  await fs.writeFile(store, STORE);
  const ghosttyPath = path.join(roaming, "ghostty", "config.ghostty");
  if (ghostty !== null) await fs.writeFile(ghosttyPath, ghostty);
  return {
    root,
    store,
    ghostty: ghosttyPath,
    later: path.join(roaming, "ghostty", "config"),
    state: path.join(root, "AppData", "Local", "j3w1-theme", "orca"),
  };
};

/* PowerShell prints an uncaught error (Get-J3w1Orca.ps1 throws, so it can
   run as a scriptblock) in colour and wrapped to the console width: the
   colour codes go and the wrapped lines are joined again. */
const unwrap = (text) => text.replace(/\u001b\[[0-9;]*m/g, "").replace(/\n\s*\|\s?(?!\s*~)/g, " ");

/* One script, from this clone's ports/orca/install unless `dir` names
   another folder (a downloaded release, a clone). */
const run = (tree, script, args = [], env = {}, { dir = install } = {}) => {
  const result = spawnSync(pwsh.exe, ["-NoProfile", "-NonInteractive", "-File", path.join(dir, script), ...args], {
    cwd: tree.root,
    encoding: "utf8",
    timeout: 180_000,
    env: {
      ...(process.platform === "win32" ? process.env : {}),
      PATH: childPath(),
      HOME: path.join(tree.root, "home"),
      TMPDIR: path.join(tree.root, "tmp"),
      XDG_CACHE_HOME: path.join(tree.root, "xdg-cache"),
      XDG_DATA_HOME: path.join(tree.root, "xdg-data"),
      XDG_CONFIG_HOME: path.join(tree.root, "xdg-config"),
      NO_COLOR: "1",
      POWERSHELL_TELEMETRY_OPTOUT: "1",
      POWERSHELL_UPDATECHECK: "Off",
      DOTNET_CLI_TELEMETRY_OPTOUT: "1",
      DOTNET_EnableDiagnostics: "0",
      J3W1_KIT_TEST_ROOT: tree.root,
      J3W1_KIT_TEST_FONTS: FONT,
      J3W1_KIT_TEST_ORCA_RUNNING: "0",
      ...env,
    },
  });
  if (result.error) throw result.error;
  const stderr = unwrap(result.stderr);
  return { status: result.status, stdout: result.stdout, stderr, output: result.stdout + stderr };
};

const apply = (tree, args = [], env = {}) => run(tree, "Apply-J3w1OrcaTheme.ps1", args, env);
const restore = (tree, args = [], env = {}) => run(tree, "Restore-J3w1OrcaTheme.ps1", args, env);
const verify = (tree, args = []) => run(tree, "Test-J3w1OrcaTheme.ps1", ["-NoSpecimen", ...args]);
/* Get-J3w1Orca.ps1 at HEAD, from this clone's git objects. */
const get = (tree, args = [], env = {}, revision = HEAD) => run(tree, "Get-J3w1Orca.ps1", ["-Revision", revision, "-SourceRoot", repoRoot, ...args], env);
const releaseOf = (tree, revision = HEAD) => path.join(tree.root, "AppData", "Local", "j3w1-theme", "orca", "releases", revision);
const releaseScripts = (tree, revision = HEAD) => path.join(releaseOf(tree, revision), "ports", "orca", "install");
const WORKTREE = { J3W1_KIT_TEST_SOURCE: "worktree" };
/* A plain folder with HEAD's copy of every file Get downloads (the export
   optionally edited), for the seam's working-tree source. `recompute`
   rewrites digests.json to match the edited export, as a consistent tamper
   would. */
const plainRelease = async (folder, { edit = (text) => text, recompute = false } = {}) => {
  for (const file of GET_FILES) {
    await fs.mkdir(path.dirname(path.join(folder, file)), { recursive: true });
    await fs.writeFile(path.join(folder, file), atHead(file));
  }
  await tamper(folder, { edit, recompute });
  return folder;
};
/* Edits the export in a folder laid out like the repository. */
const tamper = async (folder, { edit, recompute = false }) => {
  const text = edit(headTokensBytes.toString("utf8"));
  const digests = structuredClone(headDigests);
  if (recompute) digests.files[TOKENS] = digestOf(Buffer.from(text));
  await fs.writeFile(path.join(folder, TOKENS), text);
  await fs.writeFile(path.join(folder, DIGESTS), recompute ? JSON.stringify(digests, null, 2) : atHead(DIGESTS));
};
const git = (args, cwd) => {
  const result = spawnSync("git", ["-c", "user.name=installer-test", "-c", "user.email=installer-test@example.invalid", "-c", "commit.gpgsign=false", "-c", "tag.gpgsign=false", ...args], { cwd, encoding: "utf8" });
  assert.equal(result.status, 0, `git ${args.join(" ")}\n${result.stderr}`);
  return result.stdout.trim();
};
/* Slot 1 of HEAD's export changed to another colour (its hex digits
   reversed), as a tampered or moved-on export would carry. */
const slotOne = () => tokens["color.terminal.ansi.1"].css;
const otherSlotOne = () => `#${[...slotOne().slice(1)].reverse().join("")}`.toLowerCase();
const changeSlotOne = (text) => {
  assert.notEqual(otherSlotOne(), slotOne().toLowerCase(), "the changed colour differs");
  return text.split(slotOne()).join(otherSlotOne());
};
const readFileJson = async (file) => JSON.parse(await fs.readFile(file, "utf8"));
const readStore = (tree) => readFileJson(tree.store);
const backups = (tree) => (existsSync(path.join(tree.state, "backups")) ? readdirSync(path.join(tree.state, "backups")).sort() : []);
const settingLines = (text) => text.split(/\r?\n/).filter((line) => line.trim() && !line.trim().startsWith("#"));
const managedBlock = (text) => {
  const start = text.indexOf(BLOCK_START);
  const end = text.indexOf(BLOCK_END);
  assert.ok(start >= 0 && end > start, "the managed block is present");
  return text.slice(start, end + BLOCK_END.length);
};
const withoutManaged = (store) => {
  const copy = structuredClone(store);
  for (const key of managedKeys) delete copy.settings[key];
  return copy;
};
const ok = (result, message) => assert.equal(result.status, 0, `${message}\n${result.output}`);
const ORCA_OPEN = { J3W1_KIT_TEST_ORCA_RUNNING: "1" };
const writeStore = (tree, store) => fs.writeFile(tree.store, JSON.stringify(store, null, 2));
/* The owner changes managed keys in Orca between runs. */
const ownerSets = async (tree, values) => {
  const store = await readStore(tree);
  Object.assign(store.settings, values);
  await writeStore(tree, store);
};
/* The test store on a machine that has no terminal font size. */
const bareStore = () => {
  const store = JSON.parse(STORE);
  delete store.settings.terminalFontSize;
  return store;
};
/* The owner does the printed GUI steps: Orca's Import from Ghostty writes
   the installer's values, and the font size only when the block carries one
   (ports/orca/capabilities.json), then Color Contrast Off and Match
   Terminal. */
const importFromBlock = async (tree) => {
  const store = await readStore(tree);
  Object.assign(store.settings, kitSettings());
  const size = settingLines(managedBlock(await fs.readFile(tree.ghostty, "utf8"))).find((line) => line.startsWith("font-size = "));
  if (size) store.settings.terminalFontSize = Number(size.slice("font-size = ".length));
  await writeStore(tree, store);
};
const restoreManifest = (tree, name) => readFileJson(path.join(tree.state, "backups", name, "manifest.json"));
/* Orca open at apply, Orca's Import from Ghostty and Color Contrast Off but
   not Match Terminal, then the installer's records lost (a cleaned
   LOCALAPPDATA) and an apply with Orca closed: the terminal keys' earlier
   values are unknown to the installer. */
const importWithoutRecords = async (tree) => {
  ok(apply(tree, [], ORCA_OPEN), "apply while Orca runs");
  const imported = JSON.parse(STORE);
  const values = kitSettings();
  delete values.leftSidebarAppearanceMode;
  Object.assign(imported.settings, values);
  await writeStore(tree, imported);
  await fs.rm(tree.state, { recursive: true, force: true });
  ok(apply(tree), "apply with Orca closed writes the sidebar mode");
};
/* An apply on a machine without a font size, recorded as an earlier kit
   version recorded it: that version wrote the token size (13 here) to the
   store and listed it as managed, written and observed. */
const earlierKitAddedSize = async (tree) => {
  await writeStore(tree, bareStore());
  ok(apply(tree), "apply");
  const size = 13;
  for (const file of [path.join(tree.state, "backups", backups(tree)[0], "manifest.json"), path.join(tree.state, "current", "manifest.json")]) {
    const manifest = await readFileJson(file);
    manifest.managedKeys.push("terminalFontSize");
    manifest.observed.push({ key: "terminalFontSize", value: { absent: true }, equalsKit: false, kit: size });
    manifest.settings.push({ key: "terminalFontSize", before: { absent: true }, after: size });
    manifest.preserved = manifest.preserved.filter((entry) => entry.key !== "terminalFontSize");
    manifest.preferences.terminalFontSize = size;
    await fs.writeFile(file, JSON.stringify(manifest, null, 2));
  }
  await ownerSets(tree, { terminalFontSize: size });
};
/* A shared clone of this repository for -SourceRoot, without a working tree. */
const cloneRepo = async (tree) => {
  const clone = path.join(tree.root, "clone");
  git(["clone", "--quiet", "--shared", "--no-checkout", repoRoot, clone], tree.root);
  return clone;
};
/* A commit on top of `parent` (HEAD by default) that replaces `files`
   (repository path -> text), built from git objects so nothing is checked
   out. */
const commitOn = (clone, files, message, parent = HEAD) => {
  const env = { ...process.env, GIT_INDEX_FILE: path.join(clone, ".git", "j3w1-installer-test-index") };
  const raw = (args, input) => {
    const result = spawnSync("git", ["-c", "user.name=installer-test", "-c", "user.email=installer-test@example.invalid", "-c", "commit.gpgsign=false", ...args], { cwd: clone, env, input, encoding: "utf8" });
    assert.equal(result.status, 0, `git ${args.join(" ")}\n${result.stderr}`);
    return result.stdout.trim();
  };
  raw(["read-tree", parent]);
  for (const [file, text] of Object.entries(files)) {
    raw(["update-index", "--add", "--cacheinfo", `100644,${raw(["hash-object", "-w", "--stdin"], text)},${file}`]);
  }
  return raw(["commit-tree", raw(["write-tree"]), "-p", parent, "-m", message]);
};
/* HEAD's export with `edit` applied to its tokens file, and a digests.json
   that matches it. */
const exportFiles = (edit) => {
  const text = edit(headTokensBytes.toString("utf8"));
  const digests = structuredClone(headDigests);
  digests.files[TOKENS] = digestOf(Buffer.from(text));
  return { [TOKENS]: text, [DIGESTS]: `${JSON.stringify(digests, null, 2)}\n` };
};
/* HEAD's export as release `version`. */
const releaseExport = (version) => exportFiles((text) => `${JSON.stringify({ ...JSON.parse(text), version }, null, 2)}\n`);

test("Get-J3w1Orca.ps1 downloads every file under ports/orca/install, and each file it names exists", async () => {
  const listed = new Set(GET_FILES);
  const installFiles = readdirSync(install).map((name) => `ports/orca/install/${name}`);
  for (const file of installFiles) assert.ok(listed.has(file), `${file} is downloaded`);
  for (const file of GET_FILES) assert.ok(existsSync(path.join(repoRoot, file)), `${file} exists`);
  for (const file of ["ports/orca/host.json", TOKENS, DIGESTS]) assert.ok(listed.has(file), `${file} is downloaded`);
  assert.equal(listed.size, GET_FILES.length, "no file is listed twice");
});

test("the generated Ghostty block equals the Orca port except font-size", { skip }, async (t) => {
  const tree = await makeTree(t);
  ok(apply(tree), "apply succeeds");
  const written = await fs.readFile(tree.ghostty, "utf8");
  assert.ok(written.startsWith(GHOSTTY), "every line outside the block is kept, byte for byte");
  const port = settingLines(atHead("ports/orca/dist/config.ghostty").toString("utf8"));
  const block = settingLines(managedBlock(written));
  const isSize = (line) => line.startsWith("font-size");
  assert.deepEqual(block.filter((line) => !isSize(line)), port.filter((line) => !isSize(line)));
  assert.deepEqual(block.filter(isSize), ["font-size = 14"], "font-size follows the machine's preference");
});

test("apply sets exactly the managed keys and keeps every other value", { skip }, async (t) => {
  const tree = await makeTree(t);
  const before = JSON.parse(STORE);
  ok(apply(tree), "apply succeeds");
  const text = await fs.readFile(tree.store, "utf8");
  const after = JSON.parse(text);
  assert.deepEqual(withoutManaged(after), withoutManaged(before), "nothing outside the managed keys changed");
  assert.deepEqual(after.settings.terminalColorOverrides, expectedOverrides);
  assert.equal(after.settings.terminalMinimumContrastRatio, 1);
  assert.equal(after.settings.leftSidebarAppearanceMode, "match-terminal");
  assert.equal(after.settings.terminalDividerColorDark, color(roles.orca.settings.terminalDividerColorDark.token));
  assert.equal(after.settings.terminalDividerColorLight, color(roles.orca.settings.terminalDividerColorLight.token));
  assert.equal(after.settings.terminalFontFamily, tokens["font.family.mono"].value[0]);
  assert.equal(after.settings.terminalFontSize, 14, "the machine's font size is kept");
  for (const literal of ["90071992547409931234", "1.5e-7", '"2026-09-20T08:15:30.123Z"', "h\u00e9llo w\u00f6rld \u2713 \u65e5\u672c"]) {
    assert.ok(text.includes(literal), `${literal} survives verbatim`);
  }
});

test("the kit never sets the font size: without one on the machine the store keeps none and the block has no font-size line", { skip }, async (t) => {
  const tree = await makeTree(t);
  await writeStore(tree, bareStore());
  const plan = apply(tree, ["-WhatIf"]);
  ok(plan, "-WhatIf");
  assert.doesNotMatch(plan.stdout, /terminalFontSize\s+set to/);
  ok(apply(tree), "apply succeeds");
  assert.equal("terminalFontSize" in (await readStore(tree)).settings, false, "no size is added");
  const port = settingLines(atHead("ports/orca/dist/config.ghostty").toString("utf8"));
  const block = settingLines(managedBlock(await fs.readFile(tree.ghostty, "utf8")));
  assert.deepEqual(block.filter((line) => line.startsWith("font-size")), [], "no font-size line, so Import from Ghostty leaves the size alone");
  assert.deepEqual(block, port.filter((line) => !line.startsWith("font-size")), "every other line equals the Orca port");
  const manifest = await readFileJson(path.join(tree.state, "current", "manifest.json"));
  assert.equal(manifest.observed.some((entry) => entry.key === "terminalFontSize"), false);
  assert.equal(manifest.settings.some((entry) => entry.key === "terminalFontSize"), false);
  assert.deepEqual(manifest.preserved.find((entry) => entry.key === "terminalFontSize"), { key: "terminalFontSize", value: { absent: true } }, "recorded with the preserved keys");
  const checked = verify(tree);
  ok(checked, "Test passes");
  assert.match(checked.stdout, /PASS\s+ghostty block/);
  assert.match(checked.stdout, /PASS\s+terminalFontSize\s+observed \(absent\)/);
});

test("Orca open, Import from Ghostty, then Restore leaves the machine without a font size when it had none", { skip }, async (t) => {
  for (const closedApply of [false, true]) {
    const tree = await makeTree(t);
    await writeStore(tree, bareStore());
    ok(apply(tree, [], ORCA_OPEN), "apply while Orca runs");
    await importFromBlock(tree);
    if (closedApply) ok(apply(tree), "apply with Orca closed");
    const restored = restore(tree);
    ok(restored, "restore");
    assert.match(restored.stdout, /Result: restored/);
    assert.deepEqual(await readStore(tree), bareStore(), `the pre-kit store, without a size (closed apply: ${closedApply})`);
  }
});

test("a font size the owner sets between two applies stays after Restore", { skip }, async (t) => {
  const tree = await makeTree(t);
  await writeStore(tree, bareStore());
  ok(apply(tree), "first apply");
  await ownerSets(tree, { terminalFontSize: 16 });
  ok(apply(tree), "second apply");
  assert.ok(settingLines(await fs.readFile(tree.ghostty, "utf8")).includes("font-size = 16"), "the block carries the machine's size");
  const restored = restore(tree);
  ok(restored, "restore");
  assert.doesNotMatch(restored.stdout, /terminalFontSize/, "the size is not part of the restore");
  assert.deepEqual(await readStore(tree), { ...bareStore(), settings: { ...bareStore().settings, terminalFontSize: 16 } });
});

test("a second apply changes nothing and makes no backup", { skip }, async (t) => {
  const tree = await makeTree(t);
  ok(apply(tree), "first apply succeeds");
  assert.equal(backups(tree).length, 1);
  const store = await fs.readFile(tree.store);
  const second = apply(tree);
  ok(second, "second apply succeeds");
  assert.match(second.stdout, /no changes/);
  assert.equal(backups(tree).length, 1, "no second backup");
  assert.deepEqual(await fs.readFile(tree.store), store);
});

test("-WhatIf prints the plan and writes nothing", { skip }, async (t) => {
  const tree = await makeTree(t);
  const result = apply(tree, ["-WhatIf"]);
  ok(result, "-WhatIf succeeds");
  assert.match(result.stdout, /nothing written/);
  assert.equal(await fs.readFile(tree.store, "utf8"), STORE);
  assert.equal(await fs.readFile(tree.ghostty, "utf8"), GHOSTTY);
  assert.equal(existsSync(tree.state), false, "no kit state either");
});

test("with Orca running the store is untouched, the Ghostty block is written and the GUI steps are printed", { skip }, async (t) => {
  const tree = await makeTree(t);
  const result = apply(tree, [], { J3W1_KIT_TEST_ORCA_RUNNING: "1" });
  ok(result, "apply succeeds");
  assert.equal(await fs.readFile(tree.store, "utf8"), STORE, "store bytes unchanged");
  managedBlock(await fs.readFile(tree.ghostty, "utf8"));
  for (const step of [
    "Settings > Terminal > Import from Ghostty > Apply Changes",
    "Settings > Terminal > Color Contrast > Off",
    "Settings > Appearance > Left Sidebar Appearance > Match Terminal",
    "quit Orca (tray too) and rerun",
  ]) {
    assert.ok(result.stdout.includes(step), `prints: ${step}`);
  }
  const manifest = await readFileJson(path.join(tree.state, "current", "manifest.json"));
  assert.equal(manifest.storeWritten, false);
  assert.deepEqual(manifest.settings, [], "no settings recorded as changed");
});

test("a theme key in the later Ghostty config is reported", { skip }, async (t) => {
  const tree = await makeTree(t);
  await fs.writeFile(tree.later, `font-size = 12\nforeground = ${color("color.terminal.ansi.1")}\n`);
  const result = apply(tree);
  ok(result, "apply succeeds with a warning");
  assert.match(result.stdout, /WARNING: Ghostty conflict: config line 2 sets 'foreground'/);
  assert.doesNotMatch(result.stdout, /sets 'font-size'/, "font-size is a preference, not a theme key");
});

test("a missing font stops with the exact fix; -SkipFontCheck proceeds", { skip }, async (t) => {
  const tree = await makeTree(t);
  const refused = apply(tree, [], { J3W1_KIT_TEST_FONTS: "Cascadia Mono Regular (TrueType)" });
  assert.notEqual(refused.status, 0, "refused without the font");
  for (const text of ["'SauceCodePro NFM' is not installed", "nerd-fonts/releases", "SauceCodePro Nerd Font Mono", "SauceCodeProNerdFontMono-", "-SkipFontCheck"]) {
    assert.ok(refused.stderr.includes(text), `the fix names ${text}\n${refused.stderr}`);
  }
  assert.equal(await fs.readFile(tree.store, "utf8"), STORE);
  assert.equal(await fs.readFile(tree.ghostty, "utf8"), GHOSTTY);
  assert.deepEqual(backups(tree), []);
  const skipped = apply(tree, ["-SkipFontCheck"], { J3W1_KIT_TEST_FONTS: "" });
  ok(skipped, "-SkipFontCheck proceeds");
  assert.match(skipped.stdout, /WARNING: The terminal font 'SauceCodePro NFM' was not found/);
  const long = apply(await makeTree(t), [], { J3W1_KIT_TEST_FONTS: "SauceCodePro Nerd Font Mono Regular (TrueType)" });
  ok(long, "the long Nerd Fonts family name also counts");
});

test("restore returns every touched key and the Ghostty file to their pre-kit state", { skip }, async (t) => {
  const tree = await makeTree(t);
  ok(apply(tree), "apply succeeds");
  const restored = run(tree, "Restore-J3w1OrcaTheme.ps1");
  ok(restored, "restore succeeds");
  const store = await readStore(tree);
  assert.deepEqual(store, JSON.parse(STORE), "every key back, absent keys removed again");
  assert.equal("terminalMinimumContrastRatio" in store.settings, false);
  assert.deepEqual(store.settings.terminalColorOverrides, { foreground: "tomato" });
  assert.ok((await fs.readFile(tree.store, "utf8")).includes("90071992547409931234"));
  assert.deepEqual(await fs.readFile(tree.ghostty), Buffer.from(GHOSTTY), "Ghostty file byte-exact");
  assert.equal(backups(tree).length, 2, "the state before the restore was backed up");
  const again = run(tree, "Restore-J3w1OrcaTheme.ps1");
  ok(again, "a second restore succeeds");
  assert.match(again.stdout, /nothing to restore/);
});

test("restore deletes a Ghostty file the kit created and refuses the store while Orca runs", { skip }, async (t) => {
  const tree = await makeTree(t, { ghostty: null });
  ok(apply(tree), "apply succeeds");
  assert.ok(existsSync(tree.ghostty));
  const applied = await fs.readFile(tree.store, "utf8");
  const partial = run(tree, "Restore-J3w1OrcaTheme.ps1", [], { J3W1_KIT_TEST_ORCA_RUNNING: "1" });
  assert.equal(partial.status, 2, `the store part is refused\n${partial.output}`);
  assert.match(partial.stdout, /store part is refused/);
  assert.equal(await fs.readFile(tree.store, "utf8"), applied, "store untouched while Orca runs");
  assert.equal(existsSync(tree.ghostty), false, "the Ghostty file the kit created is gone");
  ok(run(tree, "Restore-J3w1OrcaTheme.ps1"), "restore finishes once Orca is gone");
  assert.deepEqual(await readStore(tree), JSON.parse(STORE));
});

test("Orca open, then Import from Ghostty in the GUI, then apply with Orca closed: restore returns the pre-kit values", { skip }, async (t) => {
  const tree = await makeTree(t);
  ok(apply(tree, [], { J3W1_KIT_TEST_ORCA_RUNNING: "1" }), "apply while Orca runs");
  const first = await readFileJson(path.join(tree.state, "current", "manifest.json"));
  // The owner does the printed GUI steps: Orca writes the kit's values.
  const imported = JSON.parse(STORE);
  Object.assign(imported.settings, kitSettings());
  await fs.writeFile(tree.store, JSON.stringify(imported, null, 2));
  ok(apply(tree), "apply with Orca closed");
  const restored = restore(tree);
  ok(restored, "restore succeeds");
  assert.match(restored.stdout, /Result: restored/);
  assert.deepEqual(await readStore(tree), JSON.parse(STORE), "every managed key has its pre-kit value again");
  assert.deepEqual(await fs.readFile(tree.ghostty), Buffer.from(GHOSTTY));
  assert.equal(first.storeWritten, false);
  assert.deepEqual(first.observed.find((entry) => entry.key === "leftSidebarAppearanceMode"), { key: "leftSidebarAppearanceMode", value: "custom", equalsKit: false, kit: "match-terminal" }, "observed although not written");
});

test("a key whose only records already hold the kit's value from an import is left, said so, and the restore exits non-zero", { skip }, async (t) => {
  const tree = await makeTree(t);
  ok(apply(tree, [], { J3W1_KIT_TEST_ORCA_RUNNING: "1" }), "apply while Orca runs");
  // Import from Ghostty and Color Contrast Off, but not Match Terminal.
  const imported = JSON.parse(STORE);
  const values = kitSettings();
  delete values.leftSidebarAppearanceMode;
  Object.assign(imported.settings, values);
  await fs.writeFile(tree.store, JSON.stringify(imported, null, 2));
  // The kit's records are lost (a cleaned LOCALAPPDATA); the next apply only
  // finds the kit's values and the managed block.
  await fs.rm(tree.state, { recursive: true, force: true });
  ok(apply(tree), "apply with Orca closed writes the sidebar mode");
  const result = restore(tree);
  assert.equal(result.status, 3, result.output);
  assert.match(result.stdout, /terminalColorOverrides\s+left as .*cannot know the pre-kit value/);
  assert.match(result.stdout, /terminalFontFamily\s+left as .*cannot know the pre-kit value/);
  assert.match(result.stdout, /Cannot know the pre-kit value of /);
  assert.doesNotMatch(result.stdout, /Result: restored/);
  const store = await readStore(tree);
  assert.equal(store.settings.leftSidebarAppearanceMode, "custom", "a key with a known pre-kit value is restored");
  assert.deepEqual(store.settings.terminalColorOverrides, expectedOverrides, "an unknown key is left as it is");
  assert.equal(store.settings.terminalFontSize, 14, "the font size is the owner's, never unknown");
  const ghostty = await fs.readFile(tree.ghostty, "utf8");
  assert.ok(!ghostty.includes(BLOCK_START) && ghostty.startsWith(GHOSTTY), "the managed block is removed, the rest kept");
});

test("restore undoes only what was applied since the last restore", { skip }, async (t) => {
  const tree = await makeTree(t);
  ok(apply(tree), "first apply");
  ok(restore(tree), "first restore");
  const owner = await readStore(tree);
  owner.settings.terminalFontFamily = "Iosevka Term";
  await fs.writeFile(tree.store, JSON.stringify(owner, null, 2));
  ok(apply(tree), "second apply");
  assert.notEqual((await readStore(tree)).settings.terminalFontFamily, "Iosevka Term");
  const second = restore(tree);
  ok(second, "second restore");
  assert.equal((await readStore(tree)).settings.terminalFontFamily, "Iosevka Term", "the owner's font from between the runs is back");
  assert.deepEqual(await fs.readFile(tree.ghostty), Buffer.from(GHOSTTY));
  assert.match(restore(tree).stdout, /nothing to restore; no apply or update since the restore/);
});

test("restore removes only the managed block of an edited config.ghostty and warns about the edit", { skip }, async (t) => {
  const tree = await makeTree(t);
  ok(apply(tree), "apply succeeds");
  const keybind = "keybind = ctrl+a=select_all\n";
  await fs.appendFile(tree.ghostty, keybind);
  const plan = restore(tree, ["-WhatIf"]);
  ok(plan, "-WhatIf succeeds");
  ok(restore(tree), "restore succeeds");
  const text = await fs.readFile(tree.ghostty, "utf8");
  assert.equal(text.includes(BLOCK_START), false, "the block is gone");
  assert.ok(text.startsWith(GHOSTTY), "the lines before the block are kept");
  assert.ok(text.endsWith(keybind), "the owner's later line is kept");
  assert.deepEqual(await readStore(tree), JSON.parse(STORE));
  assert.match(plan.stdout, /WARNING: .*config\.ghostty changed since the kit last wrote it/);
  assert.match(plan.stdout, /remove the managed block; every byte outside it is kept/);
});

test("a symlinked config.ghostty is written through and stays a link", { skip }, async (t) => {
  const tree = await makeTree(t, { ghostty: null });
  const dotfile = path.join(tree.root, "dotfiles", "config.ghostty");
  await fs.mkdir(path.dirname(dotfile));
  await fs.writeFile(dotfile, GHOSTTY);
  try {
    await fs.symlink(dotfile, tree.ghostty);
  } catch (error) {
    return t.skip(`cannot create a symlink here: ${error.code}`);
  }
  ok(apply(tree), "apply succeeds");
  assert.ok(lstatSync(tree.ghostty).isSymbolicLink(), "still a link after apply");
  managedBlock(await fs.readFile(dotfile, "utf8"));
  ok(restore(tree), "restore succeeds");
  assert.ok(lstatSync(tree.ghostty).isSymbolicLink(), "still a link after restore");
  assert.equal(await fs.readFile(dotfile, "utf8"), GHOSTTY);
});

test("a font size changed after apply is a warning, not a failure", { skip }, async (t) => {
  const tree = await makeTree(t);
  ok(apply(tree), "apply succeeds");
  const store = await readStore(tree);
  store.settings.terminalFontSize = 16;
  await fs.writeFile(tree.store, JSON.stringify(store, null, 2));
  await fs.writeFile(tree.ghostty, (await fs.readFile(tree.ghostty, "utf8")).replace("font-size = 14", "font-size = 16"));
  const checked = verify(tree);
  ok(checked, "Test passes");
  assert.match(checked.stdout, /WARN\s+terminalFontSize\s+observed 16/);
  assert.match(checked.stdout, /PASS\s+ghostty block/);
});

test("the store is copied whole exactly once, before the kit first writes it", { skip }, async (t) => {
  const tree = await makeTree(t);
  const first = apply(tree);
  ok(first, "first apply");
  const preKit = path.join(tree.state, "pre-kit", "orca-data.json");
  assert.ok(first.stdout.includes(preKit), "the first write names the full copy");
  const owner = await readStore(tree);
  owner.settings.terminalFontFamily = "Iosevka Term";
  await fs.writeFile(tree.store, JSON.stringify(owner, null, 2));
  ok(apply(tree), "second apply writes the store again");
  ok(restore(tree), "restore writes the store again");
  assert.equal(await fs.readFile(preKit, "utf8"), STORE, "the one full copy is the pre-kit store");
  const names = backups(tree);
  assert.equal(names.length, 3);
  for (const name of names) {
    assert.equal(existsSync(path.join(tree.state, "backups", name, "orca-data.json")), false, `${name} holds no store copy`);
  }
});

test("a store that cannot be serialised stops the run before any backup or manifest", { skip }, async (t) => {
  const tree = await makeTree(t);
  const broken = STORE.replace('"ratio": 1.5e-7', '"ratio": 1.5e-7,\n    "note": "\\ud800"');
  assert.notEqual(broken, STORE);
  await fs.writeFile(tree.store, broken);
  const result = apply(tree);
  assert.notEqual(result.status, 0, result.output);
  assert.equal(await fs.readFile(tree.store, "utf8"), broken);
  assert.equal(await fs.readFile(tree.ghostty, "utf8"), GHOSTTY);
  assert.equal(existsSync(tree.state), false, "no backup folder, no manifest, no state");
});

test("Test passes after apply, renders the specimen, and fails after a manual tamper", { skip }, async (t) => {
  const tree = await makeTree(t);
  ok(apply(tree), "apply succeeds");
  const checked = run(tree, "Test-J3w1OrcaTheme.ps1");
  ok(checked, "Test passes");
  assert.match(checked.stdout, /Result: \d+ PASS, 0 FAIL/);
  assert.ok(checked.stdout.includes("\u001b[0;31m"), "slot 1 is drawn with SGR 31");
  assert.ok(checked.stdout.includes("\u001b[0;101m"), "slot 9 background is drawn with SGR 101");
  assert.match(checked.stdout, /\u001b\[0;38;2;\d+;\d+;\d+m/, "tokens and roles are drawn in 24-bit colour");
  assert.ok(checked.stdout.includes(color("color.terminal.ansi.1")), "the expected hex is printed beside the slot");
  for (const deviation of roles.deviations) assert.ok(checked.stdout.includes(deviation.reason), `prints the ${deviation.target} deviation`);
  assert.match(checked.stdout, /D-008\s+color\.border\.divider/, "discloses the use-and-report role");

  const store = await readStore(tree);
  store.settings.terminalColorOverrides.red = color("color.terminal.fg");
  await fs.writeFile(tree.store, JSON.stringify(store, null, 2));
  const tampered = run(tree, "Test-J3w1OrcaTheme.ps1", ["-NoSpecimen"]);
  assert.equal(tampered.status, 1, tampered.output);
  assert.match(tampered.stdout, /FAIL\s+terminalColorOverrides\s+red=/);

  store.settings.terminalColorOverrides = expectedOverrides;
  store.settings.theme = "dark";
  await fs.writeFile(tree.store, JSON.stringify(store, null, 2));
  const preserved = run(tree, "Test-J3w1OrcaTheme.ps1", ["-NoSpecimen"]);
  assert.equal(preserved.status, 1, preserved.output);
  assert.match(preserved.stdout, /FAIL\s+preserved keys\s+theme "system" -> "dark"/);
  assert.match(preserved.stdout, /WARN\s+preference theme/);
});

test("manifests name only managed and preserved keys; the lock follows its schema", { skip }, async (t) => {
  const tree = await makeTree(t);
  ok(apply(tree), "apply succeeds");
  const [backup] = backups(tree);
  for (const file of [path.join(tree.state, "current", "manifest.json"), path.join(tree.state, "backups", backup, "manifest.json")]) {
    const text = await fs.readFile(file, "utf8");
    const manifest = JSON.parse(text);
    assert.deepEqual(Object.keys(manifest).sort(), ["claudeCodeVersion", "deviations", "disclosures", "files", "ghosttyBlockBefore", "kit", "managedKeys", "observed", "operation", "orcaVersion", "preferences", "preserved", "schemaVersion", "settings", "source", "storeWritten", "theme", "timestamp"]);
    assert.deepEqual(manifest.managedKeys, managedKeys, "the keys this run's maps manage");
    assert.equal(manifest.kit, INSTALLER_ID);
    assert.deepEqual(manifest.theme, { name: "j3w1-theme", version: HEAD_VERSION, ref: HEAD_REF, revision: HEAD, profile: "default" });
    assert.deepEqual(manifest.source, { kind: "git", pinVerified: true });
    for (const entry of manifest.settings) assert.ok(managedKeys.includes(entry.key), `${entry.key} is managed`);
    assert.deepEqual(manifest.observed.map((entry) => entry.key).sort(), [...managedKeys].sort(), "every managed key is observed");
    assert.deepEqual(manifest.observed.find((entry) => entry.key === "terminalColorOverrides").value, { foreground: "tomato" });
    assert.deepEqual(manifest.preserved.map((entry) => entry.key), [...roles.orca.preserve, "terminalFontSize"], "the font size is recorded, never set");
    assert.deepEqual(manifest.preferences, { terminalFontSize: 14 });
    assert.deepEqual(manifest.settings.find((entry) => entry.key === "terminalMinimumContrastRatio").before, { absent: true });
    assert.deepEqual(manifest.deviations, roles.deviations);
    assert.deepEqual(manifest.disclosures, [{ decisionId: "D-008", token: "color.border.divider" }]);
    for (const secret of ["repos", "sshTargets", "devbox.example", "workspaces", "greeting", "sidebarWidth"]) {
      assert.equal(text.includes(secret), false, `no unrelated Orca state (${secret})`);
    }
  }
  const schema = await readJson("schemas/json/theme.lock.schema.json");
  const lock = await readFileJson(path.join(tree.state, "current", "theme.lock.orca.json"));
  assert.deepEqual(Object.keys(lock).sort(), [...schema.required].sort(), "exactly the schema's properties");
  assert.match(lock.revision, new RegExp(schema.properties.revision.pattern));
  assert.match(lock.resolvedAt, new RegExp(schema.properties.resolvedAt.pattern));
  assert.deepEqual(lock.integration, roles.integration);
  assert.deepEqual(lock.components, roles.components);
  assert.deepEqual(lock.deviations, roles.deviations);
  assert.deepEqual(Object.keys(lock.exports), ["exports/tokens.resolved.json", "exports/digests.json"]);
  assert.equal(lock.exports["exports/tokens.resolved.json"], headDigests.files["exports/tokens.resolved.json"], "the digest digests.json lists at the same commit");
  assert.equal(lock.revision, HEAD);
  for (const value of Object.values(lock.exports)) assert.match(value, /^sha256-[A-Za-z0-9+/=]+$/);
});

test("an interrupted default restore is not recorded as done, and rerunning it finishes the job", { skip }, async (t) => {
  if (process.platform === "win32" || process.getuid?.() === 0) return t.skip("needs POSIX folder permissions and a non-root user");
  const tree = await makeTree(t);
  ok(apply(tree), "apply");
  // The store's folder refuses the write, after the Ghostty file was restored.
  const profile = path.dirname(tree.store);
  await fs.chmod(profile, 0o555);
  let first;
  try {
    first = restore(tree);
  } finally {
    await fs.chmod(profile, 0o755);
  }
  assert.equal(first.status, 1, first.output);
  assert.notDeepEqual(await readStore(tree), JSON.parse(STORE), "the store was not written");
  const second = restore(tree);
  ok(second, "the rerun succeeds");
  assert.match(second.stdout, /Result: restored/);
  assert.deepEqual(await readStore(tree), JSON.parse(STORE), "the pre-kit values are back");
  assert.deepEqual(await fs.readFile(tree.ghostty), Buffer.from(GHOSTTY));
  assert.match(restore(tree).stdout, /nothing to restore; no apply or update since the restore/);
  const [, interrupted, finished] = backups(tree);
  assert.equal((await restoreManifest(tree, interrupted)).complete, false);
  assert.equal((await restoreManifest(tree, finished)).complete, true);
  assert.match(first.stderr, /not recorded as done: .*run Restore again; it finishes the job/);
});

test("restore leaves keys the kit never wrote, and a font size an earlier kit version wrote only while nobody changed it", { skip }, async (t) => {
  const tree = await makeTree(t);
  const store = JSON.parse(STORE);
  store.settings.terminalMinimumContrastRatio = 1;
  await writeStore(tree, store);
  ok(apply(tree), "apply");
  await ownerSets(tree, { terminalFontSize: 16, terminalMinimumContrastRatio: 4.5 });
  ok(restore(tree), "restore");
  const restored = await readStore(tree);
  assert.equal(restored.settings.terminalFontSize, 16, "the kit never wrote the size; the owner's stays");
  assert.equal(restored.settings.terminalMinimumContrastRatio, 4.5, "a key that already held the kit's value was never written");
  assert.equal(restored.settings.leftSidebarAppearanceMode, "custom", "a key the kit wrote is restored");

  const changed = await makeTree(t);
  await earlierKitAddedSize(changed);
  await ownerSets(changed, { terminalFontSize: 16 });
  const kept = restore(changed);
  ok(kept, "restore");
  assert.match(kept.stdout, /terminalFontSize\s+kept at 16: changed after the kit set it/);
  assert.equal((await readStore(changed)).settings.terminalFontSize, 16);
  const untouched = await makeTree(t);
  await earlierKitAddedSize(untouched);
  ok(restore(untouched), "restore");
  assert.deepEqual(await readStore(untouched), bareStore(), "a size an earlier kit version added and nobody changed is removed again");
});

test("an existing empty config.ghostty is a file, and restore gives it back empty", { skip }, async (t) => {
  const tree = await makeTree(t, { ghostty: "" });
  const applied = apply(tree);
  ok(applied, "apply");
  assert.match(applied.stdout, /config\.ghostty: append the managed block/);
  const restored = restore(tree);
  ok(restored, "restore");
  assert.match(restored.stdout, /restore the pre-kit bytes/);
  assert.ok(existsSync(tree.ghostty), "the file is kept");
  assert.equal((await fs.readFile(tree.ghostty)).length, 0, "and is empty again");
});

test("-Latest and -Backup leave config.ghostty alone when the runs they undo never wrote it", { skip }, async (t) => {
  const tree = await makeTree(t);
  ok(apply(tree), "apply writes the store and the block");
  await ownerSets(tree, { terminalFontFamily: "Iosevka Term" });
  ok(apply(tree), "apply writes only the store");
  const [, second] = backups(tree);
  assert.deepEqual((await restoreManifest(tree, second)).files.map((file) => file.role), ["store"]);
  const plan = restore(tree, ["-Backup", second, "-WhatIf"]);
  ok(plan, "-Backup -WhatIf");
  assert.doesNotMatch(plan.stdout, /config\.ghostty: /);
  ok(restore(tree, ["-Latest"]), "-Latest");
  managedBlock(await fs.readFile(tree.ghostty, "utf8"));
  assert.equal((await readStore(tree)).settings.terminalFontFamily, "Iosevka Term", "the state before the latest run");
});

test("a -Latest or no-op restore that left no kit value is where the next default restore starts", { skip }, async (t) => {
  const latest = await makeTree(t);
  ok(apply(latest), "apply");
  ok(restore(latest, ["-Latest"]), "-Latest undoes the only run");
  await ownerSets(latest, { terminalFontFamily: "Iosevka Term" });
  ok(apply(latest), "apply again");
  ok(restore(latest), "default restore");
  assert.equal((await readStore(latest)).settings.terminalFontFamily, "Iosevka Term", "the owner's font from after the -Latest restore");

  const noop = await makeTree(t);
  ok(apply(noop, [], ORCA_OPEN), "apply while Orca runs writes only the block");
  await fs.writeFile(noop.ghostty, GHOSTTY);
  const idle = restore(noop);
  ok(idle, "a restore with nothing left to change");
  assert.match(idle.stdout, /Result: nothing to restore\.\s+Recorded as the last restore/);
  await ownerSets(noop, { terminalFontFamily: "Iosevka Term" });
  ok(apply(noop), "apply with Orca closed");
  ok(restore(noop), "default restore");
  assert.equal((await readStore(noop)).settings.terminalFontFamily, "Iosevka Term", "the owner's font from after the no-op restore");
});

test("restore warns per key when a value changed after the kit set it", { skip }, async (t) => {
  const tree = await makeTree(t);
  ok(apply(tree), "apply");
  await ownerSets(tree, { terminalFontFamily: "Iosevka Term" });
  ok(apply(tree), "apply again over the owner's font");
  await ownerSets(tree, { leftSidebarAppearanceMode: "separate" });
  const plan = restore(tree, ["-WhatIf"]);
  ok(plan, "-WhatIf");
  assert.match(plan.stdout, /WARNING: terminalFontFamily was "Iosevka Term" at backup \S+, not "[^"]+" as the kit left or asked for at backup \S+\. Restore returns the earlier value, \(absent\)\./);
  assert.match(plan.stdout, /WARNING: leftSidebarAppearanceMode is "separate" now, not "match-terminal" as the kit last left or asked for \(backup \S+\); it changed since\. Restore sets it to "custom"\./);
  assert.doesNotMatch(plan.stdout, /WARNING: terminalColorOverrides/, "an unchanged key gives no warning");
  ok(restore(tree), "restore");
  assert.deepEqual(await readStore(tree), JSON.parse(STORE), "the earliest value wins");
});

test("apply with Orca open, then quit Orca and apply again (or import first): restore warns about nothing", { skip }, async (t) => {
  for (const imported of [false, true]) {
    const tree = await makeTree(t);
    ok(apply(tree, [], ORCA_OPEN), "apply while Orca runs");
    if (imported) await importFromBlock(tree);
    ok(apply(tree), "apply with Orca closed");
    const restored = restore(tree);
    ok(restored, "restore");
    assert.doesNotMatch(restored.output, /WARNING/, `nobody changed a value (import: ${imported})`);
    assert.deepEqual(await readStore(tree), JSON.parse(STORE));
  }
});

test("an interrupted -Latest or -Backup restore names the exact command that finishes it", { skip }, async (t) => {
  if (process.platform === "win32" || process.getuid?.() === 0) return t.skip("needs POSIX folder permissions and a non-root user");
  for (const mode of ["latest", "backup"]) {
    const tree = await makeTree(t);
    ok(apply(tree), "apply");
    await ownerSets(tree, { terminalFontFamily: "Iosevka Term" });
    ok(apply(tree), "apply again over the owner's font");
    const args = mode === "latest" ? ["-Latest"] : ["-Backup", backups(tree)[1]];
    const profile = path.dirname(tree.store);
    await fs.chmod(profile, 0o555);
    let first;
    try {
      first = restore(tree, args);
    } finally {
      await fs.chmod(profile, 0o755);
    }
    assert.equal(first.status, 1, first.output);
    assert.ok(first.stderr.includes(`not recorded as done: quit Orca (tray too) and run Restore ${args.join(" ")} again; it finishes the job`), first.stderr);
    ok(restore(tree, args), "the named command finishes it");
    assert.equal((await readStore(tree)).settings.terminalFontFamily, "Iosevka Term", `the state before the second apply (${mode})`);
    managedBlock(await fs.readFile(tree.ghostty, "utf8"));
  }
});

test("the one store copy is taken by the first run even while Orca runs, and never by Restore", { skip }, async (t) => {
  const tree = await makeTree(t);
  const preKit = path.join(tree.state, "pre-kit", "orca-data.json");
  const first = apply(tree, [], ORCA_OPEN);
  ok(first, "apply while Orca runs");
  assert.ok(first.stdout.includes(`as this run read it, before any kit write`) && first.stdout.includes(preKit), "names the copy");
  assert.equal(await fs.readFile(preKit, "utf8"), STORE, "the bytes the first run read");
  await ownerSets(tree, kitSettings());
  ok(apply(tree), "apply with Orca closed after the import");
  ok(restore(tree), "restore");
  assert.equal(await fs.readFile(preKit, "utf8"), STORE, "still the pre-kit store");

  const other = await makeTree(t);
  ok(apply(other), "apply");
  await fs.rm(path.join(other.state, "pre-kit"), { recursive: true });
  ok(restore(other), "restore writes the store");
  assert.equal(existsSync(path.join(other.state, "pre-kit")), false, "Restore takes no copy");
});

test("Restore -WhatIf exits with the code the real run would", { skip }, async (t) => {
  const tree = await makeTree(t);
  await importWithoutRecords(tree);
  const plan = restore(tree, ["-WhatIf"]);
  assert.equal(plan.status, 3, plan.output);
  assert.match(plan.stdout, /Result: -WhatIf, nothing written/);
  const running = restore(tree, ["-WhatIf"], ORCA_OPEN);
  assert.equal(running.status, 2, running.output);
});

test("a key whose pre-kit value is unknown stays unknown across the next restore", { skip }, async (t) => {
  const tree = await makeTree(t);
  await importWithoutRecords(tree);
  const first = restore(tree);
  assert.equal(first.status, 3, first.output);
  ok(apply(tree), "apply again");
  const second = restore(tree);
  assert.equal(second.status, 3, second.output);
  assert.match(second.stdout, /terminalColorOverrides\s+left as .*cannot know the pre-kit value/);
  assert.doesNotMatch(second.stdout, /Result: restored/);
  const store = await readStore(tree);
  assert.equal(store.settings.leftSidebarAppearanceMode, "custom");
  assert.deepEqual(store.settings.terminalColorOverrides, expectedOverrides, "left as it is");
});

test("a duplicated managed block is refused before anything is written", { skip }, async (t) => {
  const tree = await makeTree(t);
  ok(apply(tree), "apply");
  const text = await fs.readFile(tree.ghostty, "utf8");
  const doubled = `${text}\n${managedBlock(text)}\n`;
  await fs.writeFile(tree.ghostty, doubled);
  const store = await fs.readFile(tree.store);
  for (const result of [apply(tree), restore(tree)]) {
    assert.equal(result.status, 1, result.output);
    assert.match(result.stderr, /holds 2 j3w1-theme managed blocks\. Delete the extra copies/);
  }
  assert.equal(await fs.readFile(tree.ghostty, "utf8"), doubled);
  assert.deepEqual(await fs.readFile(tree.store), store);
  assert.equal(backups(tree).length, 1, "no new backup");
  assert.match(verify(tree).stdout, /FAIL\s+ghostty block count\s+2 managed blocks/);
});

test("a config.ghostty link whose target is missing stops the run with a clear message", { skip }, async (t) => {
  const tree = await makeTree(t, { ghostty: null });
  try {
    await fs.symlink(path.join(tree.root, "dotfiles", "config.ghostty"), tree.ghostty);
  } catch (error) {
    return t.skip(`cannot create a symlink here: ${error.code}`);
  }
  const result = apply(tree);
  assert.equal(result.status, 1, result.output);
  assert.match(result.stderr, /config\.ghostty is a symbolic link to .*dotfiles.config\.ghostty, which does not exist/);
  assert.equal(existsSync(tree.state), false, "nothing written");
  assert.equal(await fs.readFile(tree.store, "utf8"), STORE);
});

test("the test seam refuses to map onto the real APPDATA or LOCALAPPDATA", { skip }, async (t) => {
  const tree = await makeTree(t);
  for (const [name, folder] of [["APPDATA", "Roaming"], ["LOCALAPPDATA", "Local"]]) {
    const result = apply(tree, [], { [name]: path.join(tree.root, "AppData", folder) });
    assert.equal(result.status, 1, `${name}\n${result.output}`);
    assert.match(result.stderr, /Test seam refused: .*maps onto the real profile folder/, name);
  }
  assert.equal(existsSync(tree.state), false);
  assert.equal(await fs.readFile(tree.store, "utf8"), STORE);
});

test("warning only: the working tree differs from HEAD, whose values the scripts use", { skip: noHead }, async (t) => {
  for (const file of [TOKENS, "ports/orca/host.json", "ports/orca/install/specimen.json"]) {
    const tree = await fs.readFile(path.join(repoRoot, file));
    if (Buffer.compare(tree, atHead(file)) !== 0) t.diagnostic(`WARN: ${file} in the working tree differs from HEAD (${HEAD}); the scripts use HEAD's until it is committed.`);
  }
});

test("an export that differs from its digests is refused before anything is written", { skip }, async (t) => {
  const tree = await makeTree(t);
  const source = await plainRelease(path.join(tree.root, "source"), { edit: (text) => text.replace("Terminal background.", "Terminal background!") });
  const result = run(tree, "Apply-J3w1OrcaTheme.ps1", [], WORKTREE, { dir: path.join(source, "ports/orca/install") });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Digest mismatch for exports\/tokens\.resolved\.json/);
  assert.equal(await fs.readFile(tree.store, "utf8"), STORE);
  assert.equal(await fs.readFile(tree.ghostty, "utf8"), GHOSTTY);
  assert.equal(existsSync(tree.state), false);
});

test("a consistent tamper after apply (export and digests.json rewritten together) is refused by the digest the last apply recorded", { skip }, async (t) => {
  const tree = await makeTree(t);
  ok(get(tree), "download");
  ok(run(tree, "Apply-J3w1OrcaTheme.ps1", [], {}, { dir: releaseScripts(tree) }), "apply from the release folder");
  await tamper(releaseOf(tree), { edit: changeSlotOne, recompute: true });
  const result = run(tree, "Test-J3w1OrcaTheme.ps1", ["-NoSpecimen"], {}, { dir: releaseScripts(tree) });
  assert.notEqual(result.status, 0, result.output);
  assert.match(result.stderr, /Digest mismatch for exports\/tokens\.resolved\.json: the last apply \(theme\.lock\.orca\.json\) records sha256-/);
  assert.match(result.stderr, /downloaded copy was removed/);
  assert.equal((await readStore(tree)).settings.terminalColorOverrides.red, slotOne().toLowerCase(), "the store keeps what was applied");
});

test("a release folder is verified again on every run: a failing copy is removed, and a fresh download applies", { skip }, async (t) => {
  const tree = await makeTree(t);
  ok(get(tree), "download");
  await tamper(releaseOf(tree), { edit: changeSlotOne });
  const refused = run(tree, "Apply-J3w1OrcaTheme.ps1", [], {}, { dir: releaseScripts(tree) });
  assert.notEqual(refused.status, 0, refused.output);
  assert.match(refused.stderr, /Digest mismatch for exports\/tokens\.resolved\.json: expected sha256-\S+ from exports\/digests\.json/);
  assert.match(refused.stderr, /downloaded copy was removed; download the release again \(Get-J3w1Orca\.ps1 -Revision [0-9a-f]{40}\)/);
  assert.equal(existsSync(path.join(releaseOf(tree), TOKENS)), false, "the bad copy is gone");
  assert.equal(await fs.readFile(tree.store, "utf8"), STORE);
  assert.equal(existsSync(path.join(tree.state, "backups")), false);

  ok(get(tree), "download again");
  const applied = run(tree, "Apply-J3w1OrcaTheme.ps1", [], {}, { dir: releaseScripts(tree) });
  ok(applied, "a good copy applies without the network");
  assert.match(applied.stdout, /digest verified; exports\/digests\.json at the same commit/);
  assert.equal((await readStore(tree)).settings.terminalColorOverrides.red, slotOne().toLowerCase());
  assert.deepEqual((await readFileJson(path.join(tree.state, "current", "manifest.json"))).source, { kind: "download", pinVerified: true });
});

test("-SourceRoot of Get must be a git clone holding the commit; neither Get nor the scripts read a working tree", { skip }, async (t) => {
  const tree = await makeTree(t);
  const plain = await plainRelease(path.join(tree.root, "plain"));
  const refusedPlain = run(tree, "Get-J3w1Orca.ps1", ["-Revision", HEAD, "-SourceRoot", plain]);
  assert.notEqual(refusedPlain.status, 0);
  assert.match(refusedPlain.stderr, /is not a git checkout/);

  const other = path.join(tree.root, "other");
  await fs.mkdir(other);
  git(["init", "--quiet"], other);
  await fs.writeFile(path.join(other, "README"), "unrelated\n");
  git(["add", "README"], other);
  git(["commit", "--quiet", "-m", "unrelated"], other);
  const missing = run(tree, "Get-J3w1Orca.ps1", ["-Revision", HEAD, "-SourceRoot", other]);
  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, new RegExp(`does not contain commit ${HEAD}`));
  assert.equal(await fs.readFile(tree.store, "utf8"), STORE);
  assert.equal(existsSync(tree.state), false, "nothing written by a refused source");

  // A clone whose working tree carries another slot 1 (and a digests.json to
  // match): Get copies git objects at the commit, and the scripts run from
  // the clone read git objects at its HEAD.
  const clone = path.join(tree.root, "clone");
  git(["clone", "--quiet", "--shared", repoRoot, clone], tree.root);
  git(["checkout", "--quiet", "--detach", HEAD], clone);
  await tamper(clone, { edit: changeSlotOne, recompute: true });
  ok(run(tree, "Get-J3w1Orca.ps1", ["-Revision", HEAD, "-SourceRoot", clone]), "download from the clone");
  assert.deepEqual(await fs.readFile(path.join(releaseOf(tree), TOKENS)), headTokensBytes, "the committed export, not the working tree's");
  ok(run(tree, "Apply-J3w1OrcaTheme.ps1", [], {}, { dir: path.join(clone, "ports/orca/install") }), "apply from the clone");
  assert.equal((await readStore(tree)).settings.terminalColorOverrides.red, slotOne().toLowerCase(), "HEAD's slot 1, not the working tree's");
  const lock = await readFileJson(path.join(tree.state, "current", "theme.lock.orca.json"));
  assert.equal(lock.revision, HEAD);
  assert.equal(lock.exports[TOKENS], headDigests.files[TOKENS]);
  ok(run(tree, "Test-J3w1OrcaTheme.ps1", ["-NoSpecimen"], {}, { dir: releaseScripts(tree) }), "Test from the release folder reads the same commit");
});

test("a working-tree source exists only inside the test seam, and never records the pin as verified", { skip }, async (t) => {
  const tree = await makeTree(t);
  const source = await plainRelease(path.join(tree.root, "source"));
  const scripts = path.join(source, "ports/orca/install");
  const refused = run(tree, "Apply-J3w1OrcaTheme.ps1", [], {}, { dir: scripts });
  assert.notEqual(refused.status, 0);
  assert.match(refused.stderr, /is neither a release folder \(it has no release\.json\) nor a clone of j3w1\/theme/);
  const result = run(tree, "Apply-J3w1OrcaTheme.ps1", [], WORKTREE, { dir: scripts });
  ok(result, "apply from a folder inside the seam");
  assert.match(result.stdout, /the pin is NOT verified/);
  const manifest = await readFileJson(path.join(tree.state, "current", "manifest.json"));
  assert.deepEqual(manifest.source, { kind: "worktree", pinVerified: false });
  assert.equal(existsSync(path.join(tree.state, "current", "theme.lock.orca.json")), false, "no lock claims the pin");
});

test("the seam never reaches the network, and without it the installer refuses a non-Windows host", { skip }, async (t) => {
  const tree = await makeTree(t);
  const offline = run(tree, "Get-J3w1Orca.ps1", ["-Revision", HEAD]);
  assert.notEqual(offline.status, 0);
  assert.match(offline.stderr, /network is disabled, pass -SourceRoot/);
  const update = run(tree, "Update-J3w1OrcaTheme.ps1", ["-Version", "v3.0.0"]);
  assert.notEqual(update.status, 0);
  assert.match(update.stderr, /network is disabled, pass -SourceRoot/);
  if (process.platform !== "win32") {
    const guarded = apply(tree, [], { J3W1_KIT_TEST_ROOT: "" });
    assert.notEqual(guarded.status, 0);
    assert.match(guarded.stderr, /Orca desktop client on Windows/);
    const guardedGet = run(tree, "Get-J3w1Orca.ps1", ["-Revision", HEAD, "-SourceRoot", repoRoot], { J3W1_KIT_TEST_ROOT: "" });
    assert.notEqual(guardedGet.status, 0);
    assert.match(guardedGet.stderr, /Orca desktop client on Windows/);
  }
  assert.equal(await fs.readFile(tree.store, "utf8"), STORE);
});

test("Update takes only an exact release tag, v3.0.0 or later with an installer", { skip }, async (t) => {
  const tree = await makeTree(t);
  for (const version of ["main", "latest", "1.2.0", "v1.2", "refs/heads/main"]) {
    const result = run(tree, "Update-J3w1OrcaTheme.ps1", ["-Version", version, "-SourceRoot", repoRoot]);
    assert.notEqual(result.status, 0, version);
    assert.match(result.stderr, /exact release tag/, version);
  }
  for (const version of ["v2.0.0", "v1.2.0"]) {
    const result = run(tree, "Update-J3w1OrcaTheme.ps1", ["-Version", version, "-SourceRoot", repoRoot]);
    assert.notEqual(result.status, 0, version);
    assert.match(result.stderr, new RegExp(`${version.replace(/\./g, "\\.")} predates this installer \\(v3\\.0\\.0 and later have ports/orca/install\\)\\. To take the theme out, run Restore-J3w1OrcaTheme\\.ps1`), version);
  }
  const clone = await cloneRepo(tree);
  const root = gitText(["rev-list", "--max-parents=0", "HEAD"]).split("\n")[0];
  git(["tag", "v97.5.0", root], clone);
  const bare = run(tree, "Update-J3w1OrcaTheme.ps1", ["-Version", "v97.5.0", "-SourceRoot", clone]);
  assert.notEqual(bare.status, 0, bare.output);
  assert.match(bare.stderr, /Tag v97\.5\.0 \([0-9a-f]{40}\) has no ports\/orca\/install\/Get-J3w1Orca\.ps1, so it predates this installer/);
  assert.equal(await fs.readFile(tree.store, "utf8"), STORE);
  assert.equal(existsSync(tree.state), false, "nothing written");
});

test("Update installs the tag's commit from its own release folder, shows a diff and checks; Test follows the last apply", { skip }, async (t) => {
  const tree = await makeTree(t);
  const clone = await cloneRepo(tree);
  const commit = commitOn(clone, releaseExport("99.0.0"), "a release");
  git(["tag", "v99.0.0", commit], clone);
  const updated = run(tree, "Update-J3w1OrcaTheme.ps1", ["-Version", "v99.0.0", "-SourceRoot", clone]);
  ok(updated, "update succeeds and verifies");
  assert.match(updated.output, /Tag v99\.0\.0 is trusted as a local tag/);
  assert.match(updated.stdout, /Update to v99\.0\.0 = [0-9a-f]{40} \(resolved through git in /);
  assert.match(updated.stdout, /~ red\s+\(absent\) -> "#[0-9a-f]{6}"/, "shows a before/after diff");
  assert.match(updated.stdout, /Result: \d+ PASS, 0 FAIL/);
  const manifest = await readFileJson(path.join(tree.state, "current", "manifest.json"));
  assert.equal(manifest.operation, "update");
  assert.deepEqual(manifest.theme, { name: "j3w1-theme", version: "99.0.0", ref: "v99.0.0", revision: commit, profile: "default" });
  assert.equal((await readFileJson(path.join(releaseOf(tree, commit), "release.json"))).ref, "v99.0.0");
  const checked = verify(tree);
  ok(checked, "Test from this clone checks the last apply");
  assert.match(checked.stdout, new RegExp(`Checking the last apply \\(v99\\.0\\.0 @ ${commit}\\), not this folder's commit \\(${HEAD}\\)`));

  const plan = run(tree, "Update-J3w1OrcaTheme.ps1", ["-Version", "v99.0.0", "-SourceRoot", clone, "-WhatIf"]);
  ok(plan, "-WhatIf");
  assert.match(plan.stdout, /Result: (no changes|-WhatIf, nothing written)/);
  assert.equal(backups(tree).length, 1, "-WhatIf writes no backup");
});

test("Update refuses a tag whose export names another version, before anything is written", { skip }, async (t) => {
  const tree = await makeTree(t);
  const clone = await cloneRepo(tree);
  const moved = commitOn(clone, exportFiles(changeSlotOne), "a tag on an export of another version");
  git(["tag", "v98.0.0", moved], clone);
  const result = run(tree, "Update-J3w1OrcaTheme.ps1", ["-Version", "v98.0.0", "-SourceRoot", clone]);
  assert.notEqual(result.status, 0, result.output);
  assert.match(result.output, new RegExp(`The export at v98\\.0\\.0 \\(${moved}\\) is version ${HEAD_VERSION.replace(/\./g, "\\.")}, not 98\\.0\\.0\\. Refusing; nothing was written\\.`));
  assert.equal(await fs.readFile(tree.store, "utf8"), STORE);
  assert.equal(existsSync(tree.state), false, "nothing written");
});

test("Get-J3w1Orca takes only a full commit SHA and copies the committed files from git", { skip }, async (t) => {
  const tree = await makeTree(t);
  for (const revision of ["main", "latest", "v1.2.0", HEAD.slice(0, 12), HEAD.toUpperCase()]) {
    const result = run(tree, "Get-J3w1Orca.ps1", ["-Revision", revision, "-SourceRoot", repoRoot]);
    assert.notEqual(result.status, 0, revision);
    assert.match(result.stderr, /full 40-character lowercase commit SHA/, revision);
  }
  const absent = run(tree, "Get-J3w1Orca.ps1", ["-Revision", "0".repeat(40), "-SourceRoot", repoRoot]);
  assert.notEqual(absent.status, 0);
  assert.match(absent.stderr, /does not contain commit/);
  const root = gitText(["rev-list", "--max-parents=0", "HEAD"]).split("\n")[0];
  const old = run(tree, "Get-J3w1Orca.ps1", ["-Revision", root, "-SourceRoot", repoRoot]);
  assert.notEqual(old.status, 0);
  assert.match(old.stderr, /has no ports\/orca\/README\.md in .*; it predates this installer \(v3\.0\.0 and later\)/);
  assert.equal(existsSync(tree.state), false, "a refused download writes nothing");

  const fetched = get(tree);
  ok(fetched, "copies the release");
  const target = releaseOf(tree);
  for (const file of GET_FILES) assert.deepEqual(await fs.readFile(path.join(target, file)), atHead(file), `${file} is the committed blob`);
  assert.deepEqual(await readFileJson(path.join(target, "release.json")), { schemaVersion: 1, id: INSTALLER_ID, repository: "j3w1/theme", revision: HEAD, ref: HEAD, files: GET_FILES });
  assert.ok(fetched.stdout.includes(path.join(target, "ports", "orca", "install", "Apply-J3w1OrcaTheme.ps1")), "prints the next command");
  assert.equal(await fs.readFile(tree.store, "utf8"), STORE, "without -Apply nothing else changes");
  assert.equal(existsSync(path.join(tree.state, "current")), false);
});

test("Get -Apply downloads, checks, applies and runs the checks; Test and Restore run from the release folder", { skip }, async (t) => {
  const tree = await makeTree(t);
  const plan = get(tree, ["-Apply", "-WhatIf"]);
  ok(plan, "-WhatIf");
  assert.match(plan.stdout, /Result: -WhatIf, nothing written/);
  assert.equal(existsSync(tree.state), false, "-WhatIf writes no release folder and no state");
  assert.equal(await fs.readFile(tree.store, "utf8"), STORE);

  const installed = get(tree, ["-Apply"]);
  ok(installed, "one command installs");
  assert.match(installed.stdout, /Result: applied\./);
  assert.match(installed.stdout, /Result: \d+ PASS, 0 FAIL/);
  assert.ok(installed.stdout.includes(path.join(releaseScripts(tree), "Test-J3w1OrcaTheme.ps1")), "names the Test command");
  assert.ok(installed.stdout.includes(path.join(releaseScripts(tree), "Restore-J3w1OrcaTheme.ps1")), "names the Restore command");
  assert.deepEqual((await readStore(tree)).settings.terminalColorOverrides, expectedOverrides);
  const manifest = await readFileJson(path.join(tree.state, "current", "manifest.json"));
  assert.deepEqual(manifest.source, { kind: "download", pinVerified: true });
  assert.equal(manifest.theme.revision, HEAD);
  ok(run(tree, "Test-J3w1OrcaTheme.ps1", [], {}, { dir: releaseScripts(tree) }), "Test from the release folder");
  ok(run(tree, "Restore-J3w1OrcaTheme.ps1", [], {}, { dir: releaseScripts(tree) }), "Restore from the release folder");
  assert.deepEqual(await readStore(tree), JSON.parse(STORE));
  assert.deepEqual(await fs.readFile(tree.ghostty), Buffer.from(GHOSTTY));
});

test("Get -Apply with Orca open writes only the Ghostty block and prints the three Orca steps and the Test command", { skip }, async (t) => {
  const tree = await makeTree(t);
  const result = get(tree, ["-Apply"], ORCA_OPEN);
  ok(result, "apply while Orca runs");
  assert.equal(await fs.readFile(tree.store, "utf8"), STORE, "store bytes unchanged");
  managedBlock(await fs.readFile(tree.ghostty, "utf8"));
  for (const step of ["Settings > Terminal > Import from Ghostty > Apply Changes", "Settings > Terminal > Color Contrast > Off", "Settings > Appearance > Left Sidebar Appearance > Match Terminal"]) assert.ok(result.stdout.includes(step), step);
  assert.match(result.stdout, /After the three Orca steps above, check the result in an Orca terminal:/);
  assert.doesNotMatch(result.stdout, /Checks:/, "no checks run before the Orca steps");
});

test("Update to a tag whose host map adds a managed key: Restore accepts the key it recorded", { skip }, async (t) => {
  const tree = await makeTree(t);
  const clone = await cloneRepo(tree);
  const version = "96.0.0";
  const files = releaseExport(version);
  const terminal = structuredClone(roles);
  terminal.orca.settings.terminalKitProbe = { value: "on", why: "a key only the newer map manages (test)" };
  files["ports/orca/host.json"] = `${JSON.stringify(terminal, null, 2)}\n`;
  git(["tag", `v${version}`, commitOn(clone, files, "a release whose map adds a key")], clone);
  const updated = run(tree, "Update-J3w1OrcaTheme.ps1", ["-Version", `v${version}`, "-SourceRoot", clone]);
  ok(updated, "update");
  assert.equal((await readStore(tree)).settings.terminalKitProbe, "on");
  const restored = restore(tree);
  ok(restored, "restore with this clone's map");
  assert.deepEqual(await readStore(tree), JSON.parse(STORE));
  assert.ok((await restoreManifest(tree, backups(tree)[0])).managedKeys.includes("terminalKitProbe"), "the update recorded the key as managed");
  assert.match(updated.output, /trusted as a local tag/);
});

test("Get refuses a commit whose export does not match its digests.json, before writing anything (review r3)", { skip }, async (t) => {
  const tree = await makeTree(t);
  const clone = await scratchDir(t, "j3w1-orca-tamper-");
  execFileSync("git", ["clone", "--quiet", "--shared", "--no-checkout", repoRoot, clone], { stdio: "ignore" });
  const env = { ...process.env, GIT_AUTHOR_NAME: "installer test", GIT_AUTHOR_EMAIL: "installer@test.invalid", GIT_COMMITTER_NAME: "installer test", GIT_COMMITTER_EMAIL: "installer@test.invalid", GIT_INDEX_FILE: path.join(clone, ".git", "installer-test-index") };
  const g = (args, input) => execFileSync("git", ["-C", clone, ...args], { env, input, stdio: ["pipe", "pipe", "ignore"] }).toString().trim();
  const tokens = JSON.parse(atHead("exports/tokens.resolved.json").toString("utf8"));
  tokens.tampered = true;
  g(["read-tree", HEAD]);
  g(["update-index", "--add", "--cacheinfo", `100644,${g(["hash-object", "-w", "--stdin"], `${JSON.stringify(tokens, null, 2)}\n`)},exports/tokens.resolved.json`]);
  const commit = g(["commit-tree", g(["write-tree"]), "-p", HEAD, "-m", "tampered export"]);
  const refused = run(tree, "Get-J3w1Orca.ps1", ["-Revision", commit, "-SourceRoot", clone]);
  assert.notEqual(refused.status, 0);
  assert.match(refused.stderr, /digests\.json/);
  assert.match(refused.stderr, /Nothing was written/);
  assert.equal(existsSync(tree.state), false, "no release folder, no state");
  assert.equal(await fs.readFile(tree.store, "utf8"), STORE);
});
