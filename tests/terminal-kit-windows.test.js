/* Drives the Windows Orca kit (tools/terminal-kit/windows) through a real
   PowerShell 7 against a fake APPDATA/LOCALAPPDATA tree. The kit's test seam
   (J3W1_KIT_TEST_ROOT) maps both folders under the scratch root, reads
   Orca's running state and the installed fonts from variables and refuses
   the network, so every read and write stays inside the scratch root; HOME,
   TMPDIR and the XDG folders of pwsh itself are pointed there too.
   Expected values and the Ghostty reference are read through git at the
   pinned revision, never from HEAD, so a release bump or a token change on
   HEAD does not break these tests (CI checks out with fetch-depth 0).
   Without pwsh or the pinned commit the suite skips locally and fails in
   CI. */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, promises as fs, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { readJson, repoRoot } from "../scripts/lib/fs.mjs";
import { scratchDir } from "./helpers/scratch.mjs";

const windows = path.join(repoRoot, "tools/terminal-kit/windows");
const FONT = "SauceCodePro NFM Regular (TrueType)";
const BLOCK_START = "# >>> j3w1-theme (managed; do not edit) >>>";
const BLOCK_END = "# <<< j3w1-theme <<<";

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
  test("PowerShell 7.4+ is available for the Windows kit tests", () => assert.fail(noPwsh));
}

const roles = await readJson("tools/terminal-kit/roles/terminal.json");
const kit = await readJson("tools/terminal-kit/kit.json");

/* One file at the pinned revision, from git objects; null when absent. */
const atPin = (file) => {
  const result = spawnSync("git", ["-C", repoRoot, "cat-file", "blob", `${kit.theme.revision}:${file}`], { maxBuffer: 64 * 1024 * 1024 });
  return result.status === 0 ? result.stdout : null;
};
const pinnedTokensBytes = atPin(kit.exports.tokens);
const noPin = pinnedTokensBytes ? false : `the pinned commit ${kit.theme.revision} is not in this clone; fetch it (git fetch --tags)`;
if (noPin && process.env.CI) {
  test("the pinned commit is in the clone for the Windows kit tests", () => assert.fail(noPin));
}
const skip = noPwsh || noPin;

const digestOf = (bytes) => `sha256-${createHash("sha256").update(bytes).digest("base64")}`;
const pinnedDigests = noPin ? { files: {} } : JSON.parse(atPin(kit.exports.digests).toString("utf8"));
const tokens = noPin ? {} : JSON.parse(pinnedTokensBytes.toString("utf8")).profiles.default.tokens;
const color = (id) => tokens[id].css.toLowerCase();
const expectedOverrides = noPin ? {} : Object.fromEntries(Object.entries(roles.orca.terminalColorOverrides).map(([key, id]) => [key, color(id)]));
const managedKeys = ["terminalColorOverrides", ...Object.keys(roles.orca.settings)];
/* Every value the kit sets except the font size (a preference): what Orca
   holds after the GUI steps (Import from Ghostty, Color Contrast Off, Match
   Terminal). */
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

/* The child sees a PATH without any claude binary, so the kit's Claude Code
   probe never starts a real client from the tests. */
const childPath = () => {
  const keep = (process.env.PATH ?? "").split(path.delimiter).filter((dir) => dir && !["claude", "claude.exe", "claude.cmd"].some((name) => existsSync(path.join(dir, name))));
  return [path.dirname(pwsh.exe), ...keep].join(path.delimiter);
};

/* A store with unrelated state the kit must carry byte-significantly:
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
  const root = await scratchDir(t, "j3w1-kit-win-");
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

const run = (tree, script, args = [], env = {}) => {
  const result = spawnSync(pwsh.exe, ["-NoProfile", "-NonInteractive", "-File", path.join(windows, script), ...args], {
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
  return { status: result.status, stdout: result.stdout, stderr: result.stderr, output: result.stdout + result.stderr };
};

const apply = (tree, args = [], env = {}) => run(tree, "Apply-J3w1OrcaTheme.ps1", ["-SourceRoot", repoRoot, ...args], env);
const restore = (tree, args = [], env = {}) => run(tree, "Restore-J3w1OrcaTheme.ps1", args, env);
const verify = (tree, args = []) => run(tree, "Test-J3w1OrcaTheme.ps1", ["-SourceRoot", repoRoot, "-NoSpecimen", ...args]);
const WORKTREE = { J3W1_KIT_TEST_SOURCE: "worktree" };
/* A plain folder with the pinned export (optionally edited), for the seam's
   working-tree source and for the cache. `recompute` rewrites digests.json
   to match the edited export, as a consistent tamper would. */
const exportFolder = async (folder, { edit = (text) => text, recompute = false } = {}) => {
  await fs.mkdir(path.join(folder, "exports"), { recursive: true });
  const text = edit(pinnedTokensBytes.toString("utf8"));
  const digests = structuredClone(pinnedDigests);
  if (recompute) digests.files[kit.exports.tokens] = digestOf(Buffer.from(text));
  await fs.writeFile(path.join(folder, kit.exports.tokens), text);
  await fs.writeFile(path.join(folder, kit.exports.digests), recompute ? JSON.stringify(digests, null, 2) : atPin(kit.exports.digests));
  return folder;
};
const git = (args, cwd) => {
  const result = spawnSync("git", ["-c", "user.name=kit-test", "-c", "user.email=kit-test@example.invalid", "-c", "commit.gpgsign=false", "-c", "tag.gpgsign=false", ...args], { cwd, encoding: "utf8" });
  assert.equal(result.status, 0, `git ${args.join(" ")}\n${result.stderr}`);
  return result.stdout.trim();
};
/* Slot 1 of the pinned export changed to another colour (its hex digits
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

test("the generated Ghostty block equals the Orca port except font-size", { skip }, async (t) => {
  const tree = await makeTree(t);
  ok(apply(tree), "apply succeeds");
  const written = await fs.readFile(tree.ghostty, "utf8");
  assert.ok(written.startsWith(GHOSTTY), "every line outside the block is kept, byte for byte");
  const port = settingLines(atPin("ports/orca/dist/config.ghostty").toString("utf8"));
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

test("the token font size is used only when the machine has none", { skip }, async (t) => {
  const tree = await makeTree(t);
  const store = JSON.parse(STORE);
  delete store.settings.terminalFontSize;
  await fs.writeFile(tree.store, JSON.stringify(store, null, 2));
  ok(apply(tree), "apply succeeds");
  const size = tokens["font.size.terminal"].value.value;
  assert.equal((await readStore(tree)).settings.terminalFontSize, size);
  assert.ok(settingLines(await fs.readFile(tree.ghostty, "utf8")).includes(`font-size = ${size}`));
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
  assert.deepEqual(first.observed.find((entry) => entry.key === "leftSidebarAppearanceMode"), { key: "leftSidebarAppearanceMode", value: "custom", equalsKit: false }, "observed although not written");
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

test("HEAD's exports have moved past the pin (a warning only, never a failure)", { skip: noPin }, async (t) => {
  const head = await fs.readFile(path.join(repoRoot, kit.exports.tokens));
  if (Buffer.compare(head, pinnedTokensBytes) === 0) return t.diagnostic(`HEAD's export equals the pinned ${kit.theme.ref}`);
  const version = JSON.parse(head.toString("utf8")).version;
  t.diagnostic(`WARN: HEAD's ${kit.exports.tokens} (version ${version}) differs from the pinned ${kit.theme.ref} @ ${kit.theme.revision}; the kit keeps applying the pin until kit.json moves to a release tag.`);
});

test("Test passes after apply, renders the specimen, and fails after a manual tamper", { skip }, async (t) => {
  const tree = await makeTree(t);
  ok(apply(tree), "apply succeeds");
  const checked = run(tree, "Test-J3w1OrcaTheme.ps1", ["-SourceRoot", repoRoot]);
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
  const tampered = run(tree, "Test-J3w1OrcaTheme.ps1", ["-SourceRoot", repoRoot, "-NoSpecimen"]);
  assert.equal(tampered.status, 1, tampered.output);
  assert.match(tampered.stdout, /FAIL\s+terminalColorOverrides\s+red=/);

  store.settings.terminalColorOverrides = expectedOverrides;
  store.settings.theme = "dark";
  await fs.writeFile(tree.store, JSON.stringify(store, null, 2));
  const preserved = run(tree, "Test-J3w1OrcaTheme.ps1", ["-SourceRoot", repoRoot, "-NoSpecimen"]);
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
    assert.deepEqual(Object.keys(manifest).sort(), ["claudeCodeVersion", "deviations", "disclosures", "files", "ghosttyBlockBefore", "kit", "observed", "operation", "orcaVersion", "preferences", "preserved", "schemaVersion", "settings", "source", "storeWritten", "theme", "timestamp"]);
    assert.equal(manifest.kit, kit.id);
    assert.deepEqual(manifest.theme, { name: kit.theme.name, version: kit.theme.version, ref: kit.theme.ref, revision: kit.theme.revision, profile: kit.theme.profile });
    assert.deepEqual(manifest.source, { kind: "git", pinVerified: true });
    for (const entry of manifest.settings) assert.ok(managedKeys.includes(entry.key), `${entry.key} is managed`);
    assert.deepEqual(manifest.observed.map((entry) => entry.key).sort(), [...managedKeys].sort(), "every managed key is observed");
    assert.deepEqual(manifest.observed.find((entry) => entry.key === "terminalColorOverrides").value, { foreground: "tomato" });
    assert.deepEqual(manifest.preserved.map((entry) => entry.key), roles.orca.preserve);
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
  assert.equal(lock.exports["exports/tokens.resolved.json"], pinnedDigests.files["exports/tokens.resolved.json"]);
  assert.equal(lock.exports["exports/tokens.resolved.json"], kit.exports.tokensDigest, "the digest kit.json pins");
  for (const value of Object.values(lock.exports)) assert.match(value, /^sha256-[A-Za-z0-9+/=]+$/);
});

test("an export that differs from its digests is refused before anything is written", { skip }, async (t) => {
  const tree = await makeTree(t);
  const source = await exportFolder(path.join(tree.root, "source"), { edit: (text) => text.replace("Terminal background.", "Terminal background!") });
  const result = run(tree, "Apply-J3w1OrcaTheme.ps1", ["-SourceRoot", source], WORKTREE);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Digest mismatch for exports\/tokens\.resolved\.json/);
  assert.equal(await fs.readFile(tree.store, "utf8"), STORE);
  assert.equal(await fs.readFile(tree.ghostty, "utf8"), GHOSTTY);
  assert.equal(existsSync(tree.state), false);
});

test("a consistent tamper (export and digests.json rewritten together) is refused by kit.json's pinned digest", { skip }, async (t) => {
  const tree = await makeTree(t);
  const source = await exportFolder(path.join(tree.root, "source"), { edit: changeSlotOne, recompute: true });
  const result = run(tree, "Apply-J3w1OrcaTheme.ps1", ["-SourceRoot", source], WORKTREE);
  assert.notEqual(result.status, 0, result.output);
  assert.match(result.stderr, /kit\.json exports\.tokensDigest pins/);
  assert.equal(await fs.readFile(tree.store, "utf8"), STORE);
  assert.equal(existsSync(tree.state), false);
});

test("the cache is re-verified against the pinned digest on every run", { skip }, async (t) => {
  const tree = await makeTree(t);
  const cache = path.join(tree.state, "cache", kit.theme.revision);
  await exportFolder(cache, { edit: changeSlotOne, recompute: true });
  const refused = run(tree, "Apply-J3w1OrcaTheme.ps1");
  assert.notEqual(refused.status, 0, refused.output);
  assert.match(refused.stderr, /kit\.json exports\.tokensDigest pins/);
  assert.match(refused.stderr, /cached copy was removed/);
  assert.equal(existsSync(path.join(cache, kit.exports.tokens)), false, "the bad copy is gone");
  assert.equal(await fs.readFile(tree.store, "utf8"), STORE);

  await exportFolder(cache);
  const cached = run(tree, "Apply-J3w1OrcaTheme.ps1");
  ok(cached, "a good cached copy applies without the network");
  assert.match(cached.stdout, /cache of [0-9a-f]{40}; pinned digest verified/);
  assert.equal((await readStore(tree)).settings.terminalColorOverrides.red, slotOne().toLowerCase());
});

test("-SourceRoot must be a git checkout holding the pinned commit; its working tree is never read", { skip }, async (t) => {
  const tree = await makeTree(t);
  const plain = await exportFolder(path.join(tree.root, "plain"));
  const notGit = run(tree, "Apply-J3w1OrcaTheme.ps1", ["-SourceRoot", plain]);
  assert.notEqual(notGit.status, 0);
  assert.match(notGit.stderr, /is not a git checkout/);
  const notGitTest = run(tree, "Test-J3w1OrcaTheme.ps1", ["-SourceRoot", plain, "-NoSpecimen"]);
  assert.notEqual(notGitTest.status, 0);
  assert.match(notGitTest.stderr, /is not a git checkout/);

  const other = path.join(tree.root, "other");
  await fs.mkdir(other);
  git(["init", "--quiet"], other);
  await fs.writeFile(path.join(other, "README"), "unrelated\n");
  git(["add", "README"], other);
  git(["commit", "--quiet", "-m", "unrelated"], other);
  const missing = run(tree, "Apply-J3w1OrcaTheme.ps1", ["-SourceRoot", other]);
  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, new RegExp(`does not contain the pinned commit ${kit.theme.revision}`));
  assert.equal(await fs.readFile(tree.store, "utf8"), STORE);
  assert.equal(existsSync(tree.state), false, "nothing written by a refused source");

  // A clone whose working tree carries another slot 1 (and a digests.json to
  // match): the kit reads git objects at the pin and writes the pinned value.
  const clone = path.join(tree.root, "clone");
  git(["clone", "--quiet", "--shared", "--no-checkout", repoRoot, clone], tree.root);
  await exportFolder(clone, { edit: changeSlotOne, recompute: true });
  ok(run(tree, "Apply-J3w1OrcaTheme.ps1", ["-SourceRoot", clone]), "apply from the clone");
  assert.equal((await readStore(tree)).settings.terminalColorOverrides.red, slotOne().toLowerCase(), "the pinned slot 1, not the working tree's");
  const lock = await readFileJson(path.join(tree.state, "current", "theme.lock.orca.json"));
  assert.equal(lock.revision, kit.theme.revision);
  assert.equal(lock.exports[kit.exports.tokens], kit.exports.tokensDigest);
  ok(run(tree, "Test-J3w1OrcaTheme.ps1", ["-SourceRoot", clone, "-NoSpecimen"]), "Test reads the same pinned objects");

  // A local tag of the pinned name that points elsewhere is refused.
  git(["update-ref", `refs/tags/${kit.theme.ref}`, git(["rev-parse", "HEAD"], clone)], clone);
  if (git(["rev-parse", `${kit.theme.ref}^{commit}`], clone) !== kit.theme.revision) {
    const moved = run(tree, "Test-J3w1OrcaTheme.ps1", ["-SourceRoot", clone, "-NoSpecimen"]);
    assert.notEqual(moved.status, 0);
    assert.match(moved.stderr, new RegExp(`Tag ${kit.theme.ref.replace(/\./g, "\\.")} resolves to [0-9a-f]{40} in .*, not the pinned`));
  }
});

test("a working-tree source exists only inside the test seam, and never records the pin as verified", { skip }, async (t) => {
  const tree = await makeTree(t);
  const source = await exportFolder(path.join(tree.root, "source"));
  const result = run(tree, "Apply-J3w1OrcaTheme.ps1", ["-SourceRoot", source], WORKTREE);
  ok(result, "apply from a folder inside the seam");
  assert.match(result.stdout, /the pin is NOT verified/);
  const manifest = await readFileJson(path.join(tree.state, "current", "manifest.json"));
  assert.deepEqual(manifest.source, { kind: "worktree", pinVerified: false });
  assert.equal(existsSync(path.join(tree.state, "current", "theme.lock.orca.json")), false, "no lock claims the pin");
});

test("the seam never reaches the network, and without it the kit refuses a non-Windows host", { skip }, async (t) => {
  const tree = await makeTree(t);
  const offline = run(tree, "Apply-J3w1OrcaTheme.ps1");
  assert.notEqual(offline.status, 0);
  assert.match(offline.stderr, /network is disabled, pass -SourceRoot/);
  if (process.platform !== "win32") {
    const guarded = run(tree, "Apply-J3w1OrcaTheme.ps1", ["-SourceRoot", repoRoot], { J3W1_KIT_TEST_ROOT: "" });
    assert.notEqual(guarded.status, 0);
    assert.match(guarded.stderr, /Orca desktop client on Windows/);
  }
  assert.equal(await fs.readFile(tree.store, "utf8"), STORE);
});

test("Update takes only an exact release tag", { skip }, async (t) => {
  const tree = await makeTree(t);
  for (const version of ["main", "latest", "1.2.0", "v1.2", "refs/heads/main"]) {
    const result = run(tree, "Update-J3w1OrcaTheme.ps1", ["-Version", version, "-SourceRoot", repoRoot]);
    assert.notEqual(result.status, 0, version);
    assert.match(result.stderr, /exact release tag/, version);
  }
  assert.equal(await fs.readFile(tree.store, "utf8"), STORE);
  const tagged = spawnSync("git", ["-C", repoRoot, "rev-parse", "--verify", "--quiet", `refs/tags/${kit.theme.ref}^{commit}`], { encoding: "utf8" });
  if (tagged.status !== 0) return t.diagnostic(`tag ${kit.theme.ref} is not in this clone; the update path was not exercised`);
  assert.equal(tagged.stdout.trim(), kit.theme.revision);
  const updated = run(tree, "Update-J3w1OrcaTheme.ps1", ["-Version", kit.theme.ref, "-SourceRoot", repoRoot]);
  ok(updated, "update to the pinned tag succeeds and verifies");
  assert.match(updated.stdout, /~ red\s+\(absent\) -> "#[0-9a-f]{6}"/, "shows a before/after diff");
  assert.match(updated.stdout, /Result: \d+ PASS, 0 FAIL/);
  assert.equal((await readFileJson(path.join(tree.state, "current", "manifest.json"))).operation, "update");
});

test("Get-J3w1Kit takes only a full commit SHA and reads it from git", { skip }, async (t) => {
  const tree = await makeTree(t);
  for (const revision of ["main", "latest", "v1.2.0", kit.theme.revision.slice(0, 12), kit.theme.revision.toUpperCase()]) {
    const result = run(tree, "Get-J3w1Kit.ps1", ["-Revision", revision, "-SourceRoot", repoRoot]);
    assert.notEqual(result.status, 0, revision);
    assert.match(result.stderr, /full 40-character lowercase commit SHA/, revision);
  }
  const absent = run(tree, "Get-J3w1Kit.ps1", ["-Revision", "0".repeat(40), "-SourceRoot", repoRoot]);
  assert.notEqual(absent.status, 0);
  assert.match(absent.stderr, /does not contain commit/);
  const revision = git(["rev-parse", "HEAD"], repoRoot);
  const listed = spawnSync("git", ["-C", repoRoot, "cat-file", "-e", `${revision}:tools/terminal-kit/windows/Get-J3w1Kit.ps1`]);
  if (listed.status !== 0) return t.diagnostic("HEAD has no committed kit; the copy path was not exercised");
  const fetched = run(tree, "Get-J3w1Kit.ps1", ["-Revision", revision, "-SourceRoot", repoRoot]);
  ok(fetched, "copies the kit");
  const target = path.join(tree.root, "AppData", "Local", "j3w1-theme", "kit", revision);
  for (const file of ["kit.json", "roles/terminal.json", "specimen.json", "windows/J3w1Kit.psm1", "windows/Apply-J3w1OrcaTheme.ps1"]) {
    const committed = spawnSync("git", ["-C", repoRoot, "cat-file", "blob", `${revision}:tools/terminal-kit/${file}`], { maxBuffer: 16 * 1024 * 1024 }).stdout;
    assert.deepEqual(await fs.readFile(path.join(target, file)), committed, `${file} is the committed blob`);
  }
  assert.ok(fetched.stdout.includes(path.join(target, "windows", "Apply-J3w1OrcaTheme.ps1")), "prints the next command");
});
