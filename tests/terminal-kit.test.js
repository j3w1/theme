import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { existsSync, promises as fs } from "node:fs";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { z } from "zod";
import { lockSchema } from "../schemas/lock.mjs";
import { repoRoot } from "../scripts/lib/fs.mjs";
import { jsonRemove, jsonSet, tomlGet, tomlRestore, tomlSet } from "../tools/terminal-kit/devbox/lib/edit.mjs";
import { claudeTheme, codexTmTheme, ghosttyConfig, lock, roleTokenIds } from "../tools/terminal-kit/devbox/lib/generators.mjs";
import { parsePlist } from "../tools/terminal-kit/devbox/lib/plist.mjs";
import { loadContext, sha256Base64 } from "../tools/terminal-kit/devbox/lib/source.mjs";
import { renderSpecimen } from "../tools/terminal-kit/devbox/lib/specimen.mjs";
import { scratchDir } from "./helpers/scratch.mjs";

const run = promisify(execFile);
const CLI = path.join(repoRoot, "tools/terminal-kit/devbox/j3w1-terminal.mjs");
const KIT = path.join(repoRoot, "tools/terminal-kit");
const readKitJson = async (file) => JSON.parse(await fs.readFile(path.join(KIT, file), "utf8"));

/* The Claude Code theme roles observed in 2.1.281-2.1.283. */
const OBSERVED_CLAUDE_ROLES = [
  "autoAccept", "autoAcceptShimmer", "background", "bashBorder", "bashMessageBackgroundColor",
  "blue_FOR_SUBAGENTS_ONLY", "briefLabelClaude", "briefLabelYou", "chromeYellow", "claude",
  "claudeBlueShimmer_FOR_SYSTEM_SPINNER", "claudeBlue_FOR_SYSTEM_SPINNER", "claudeShimmer",
  "clawd_background", "clawd_body", "composerSidebarBackground", "cyan_FOR_SUBAGENTS_ONLY", "diffAdded",
  "diffAddedDimmed", "diffAddedWord", "diffRemoved", "diffRemovedDimmed", "diffRemovedWord", "effortUltra",
  "error", "fastMode", "fastModeShimmer", "green_FOR_SUBAGENTS_ONLY", "ide", "inactive", "inactiveShimmer",
  "inverseText", "memoryBackgroundColor", "merged", "orange_FOR_SUBAGENTS_ONLY", "permission",
  "permissionShimmer", "pink_FOR_SUBAGENTS_ONLY", "planMode", "professionalBlue", "promptBorder",
  "promptBorderShimmer", "purple_FOR_SUBAGENTS_ONLY", "rainbow_blue", "rainbow_blue_shimmer",
  "rainbow_green", "rainbow_green_shimmer", "rainbow_indigo", "rainbow_indigo_shimmer", "rainbow_orange",
  "rainbow_orange_shimmer", "rainbow_red", "rainbow_red_shimmer", "rainbow_violet", "rainbow_violet_shimmer",
  "rainbow_yellow", "rainbow_yellow_shimmer", "rate_limit_empty", "rate_limit_fill",
  "red_FOR_SUBAGENTS_ONLY", "remember", "selectionBg", "skill", "subtle", "success", "suggestion", "text",
  "userMessageBackground", "userMessageBackgroundHover", "warning", "warningShimmer",
  "yellow_FOR_SUBAGENTS_ONLY",
];

/* The pending decisions the kit's role maps disclose. */
const DISCLOSED = { "color.border.divider": ["D-008"] };

let context;
const ctx = async () => (context ??= await loadContext({ sourceRoot: repoRoot, offline: true }));

const specimenTokenIds = (specimen) => {
  const ids = new Set();
  for (const section of specimen.sections) for (const line of section.lines ?? []) for (const s of line) for (const k of ["fgToken", "bgToken"]) if (s[k]) ids.add(s[k]);
  return [...ids];
};

test("the pinned export matches its digest and every consumed token is eligible", async () => {
  const kit = await readKitJson("kit.json");
  const digests = JSON.parse(await fs.readFile(path.join(repoRoot, kit.exports.digests), "utf8"));
  const bytes = await fs.readFile(path.join(repoRoot, kit.exports.tokens));
  assert.equal(sha256Base64(bytes), digests.files[kit.exports.tokens], "the checkout's export matches digests.json");
  const c = await ctx();
  assert.equal(c.source.via, "git");
  assert.equal(c.exports[kit.exports.tokens], digests.files[kit.exports.tokens], "the pinned revision's export is the checkout's");
  const tokens = c.tokens;
  const reported = {};
  const all = new Set([...Object.values(c.roles).flatMap(roleTokenIds), ...specimenTokenIds(c.specimen)]);
  for (const id of all) {
    assert.ok(tokens[id], `${id} exists in the pinned default profile`);
    assert.ok(!id.startsWith("color.primitive."), `${id} is not a primitive`);
    assert.ok(["use", "use-and-report"].includes(tokens[id].eligibility.action), `${id} is eligible`);
    if (tokens[id].eligibility.action === "use-and-report") reported[id] = tokens[id].eligibility.decisionIds;
  }
  assert.deepEqual(reported, DISCLOSED);
  for (const role of Object.values((await readKitJson("roles/claude-code.json")).roles)) assert.ok(all.has(role.token));
});

test("the resolver refuses primitives and blocked tokens", async () => {
  const c = await ctx();
  assert.throws(() => c.resolver.color("color.primitive.ink.0"), /primitives/);
  const blocked = Object.keys(c.tokens).find((id) => !id.startsWith("color.primitive.") && c.tokens[id].eligibility.action === "blocked");
  if (blocked) assert.throws(() => c.resolver.token(blocked), /blocked/);
  assert.throws(() => c.resolver.token("color.not.a.role"), /not in the pinned/);
});

test("the Claude map covers every observed role and the generated theme is all hex", async () => {
  const c = await ctx();
  assert.deepEqual(Object.keys(c.roles["claude-code"].roles).sort(), [...OBSERVED_CLAUDE_ROLES].sort());
  assert.equal(OBSERVED_CLAUDE_ROLES.length, 72);
  const theme = claudeTheme(c);
  assert.equal(theme.base, "dark-ansi");
  assert.equal(theme.name, "j3w1");
  assert.deepEqual(Object.keys(theme.overrides), Object.keys(c.roles["claude-code"].roles));
  for (const [role, value] of Object.entries(theme.overrides)) assert.match(value, /^#[0-9a-f]{6}$/, role);
});

test("the Codex tmTheme parses as a plist with every mapped scope", async () => {
  const c = await ctx();
  const map = c.roles.codex;
  const theme = parsePlist(codexTmTheme(c));
  assert.equal(theme.name, map.theme.name);
  assert.equal(theme.uuid, map.theme.uuid);
  const [globals, ...rules] = theme.settings;
  assert.deepEqual(Object.keys(globals.settings), Object.keys(map.globals));
  assert.deepEqual(rules.map((r) => r.scope), map.scopes.map((s) => s.scope));
  for (const [i, rule] of rules.entries()) {
    const entry = map.scopes[i];
    for (const k of ["foreground", "background"]) {
      if (entry[k]) assert.equal(rule.settings[k], c.resolver.color(entry[k]), `${entry.name} ${k}`);
      else assert.equal(rule.settings[k], undefined);
    }
    assert.equal(rule.settings.fontStyle, entry.fontStyle);
  }
  for (const v of Object.values(globals.settings)) assert.match(v, /^#[0-9a-f]{6}$/);
});

test("ghosttyConfig matches the Orca port and only font-size follows the host", async () => {
  const c = await ctx();
  const port = (await fs.readFile(path.join(repoRoot, "ports/orca/dist/config.ghostty"), "utf8")).split("\n").filter((l) => l.trim() && !l.startsWith("#"));
  const at13 = ghosttyConfig(c, 13).split("\n").filter(Boolean);
  assert.deepEqual(at13, port);
  const at14 = ghosttyConfig(c, 14).split("\n").filter(Boolean);
  const differ = at13.flatMap((l, i) => (l === at14[i] ? [] : [[l, at14[i]]]));
  assert.deepEqual(differ, [["font-size = 13", "font-size = 14"]]);
  assert.deepEqual(ghosttyConfig(c).split("\n").filter(Boolean), port, "without a preference the token size applies");
});

test("lock objects validate against the theme.lock schema", async () => {
  const c = await ctx();
  for (const integration of ["claude-code", "codex", "terminal"]) {
    const value = lock(c, integration, { resolvedAt: "2026-09-25T12:00:00Z" });
    lockSchema(z).parse(value);
    assert.equal(value.revision, c.kit.theme.revision);
    assert.deepEqual(Object.keys(value.exports), [c.kit.exports.tokens]);
    assert.deepEqual(value.deviations, c.roles[integration].deviations);
  }
});

test("no hex colour literal lives under tools/terminal-kit", async () => {
  const offenders = [];
  const walk = async (dir) => {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else {
        const text = await fs.readFile(full, "utf8");
        for (const m of text.matchAll(/#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9A-Za-z_])/g)) offenders.push(`${path.relative(repoRoot, full)}: ${m[0]}`);
      }
    }
  };
  await walk(KIT);
  assert.deepEqual(offenders, []);
});

test("the specimen renders every section from the pinned values", async () => {
  const c = await ctx();
  const text = renderSpecimen(c);
  for (const section of c.specimen.sections) assert.ok(text.includes(section.title), section.title);
  assert.ok(text.includes(c.resolver.color("color.terminal.ansi.1")));
  assert.match(text, /\u001b\[38;2;\d+;\d+;\d+m/);
  assert.match(text, / ✕/);
});

test("JSON key edits keep every other byte", () => {
  const original = '{\n    "a": [1,2],\n    "theme":   "dark-ansi",\n    "nested": {"x": {"y": "}"}}\n}';
  const set = jsonSet(original, "theme", "custom:j3w1");
  assert.equal(set, original.replace('"dark-ansi"', '"custom:j3w1"'));
  const without = '{\n\t"a": 1,\n\t"b": {"c": [true, null]}\n}\n';
  const added = jsonSet(without, "theme", "custom:j3w1");
  assert.equal(added, '{\n\t"a": 1,\n\t"b": {"c": [true, null]},\n\t"theme": "custom:j3w1"\n}\n');
  assert.equal(jsonRemove(added, "theme"), without);
  assert.equal(jsonRemove(jsonSet("{}\n", "theme", "x"), "theme"), "{}\n");
  assert.equal(jsonRemove(original, "theme"), '{\n    "a": [1,2],\n    "nested": {"x": {"y": "}"}}\n}');
});

test("TOML line edits keep comments, other keys and tables", () => {
  const original = '# top\nmodel = "x"\n\n[tui]\n# the theme\nnotifications = true\ntheme = "ansi"  # was ansi\n\n[tui.sub]\ntheme = "not this"\n';
  const set = tomlSet(original, "tui", "theme", "j3w1");
  assert.equal(set, original.replace('theme = "ansi"  # was ansi', 'theme = "j3w1"  # was ansi'));
  assert.equal(tomlGet(set, "tui", "theme").value, "j3w1");
  assert.equal(tomlRestore(set, "tui", "theme", { beforeLine: tomlGet(original, "tui", "theme").line }), original);

  const noKey = "[tui]\nnotifications = true\n";
  const inserted = tomlSet(noKey, "tui", "theme", "j3w1");
  assert.equal(inserted, '[tui]\ntheme = "j3w1"\nnotifications = true\n');
  assert.equal(tomlRestore(inserted, "tui", "theme", {}), noKey);

  for (const noTable of ['model = "x"\n', 'model = "x"', "", '[projects."/a"]\ntrust_level = "trusted"\n\n']) {
    const appended = tomlSet(noTable, "tui", "theme", "j3w1");
    assert.equal(tomlGet(appended, "tui", "theme").value, "j3w1");
    const addedNewline = noTable !== "" && !noTable.endsWith("\n");
    assert.equal(tomlRestore(appended, "tui", "theme", { appendedTable: { addedNewline } }), noTable, JSON.stringify(noTable));
  }
  assert.throws(() => tomlSet('tui.theme = "x"\n', "tui", "theme", "j3w1"), /dotted or inline/);
});

/* ---- the CLI in a temporary HOME ---------------------------------------- */

const SETTINGS = `{
  "permissions": {
    "defaultMode": "default",
    "allow": ["Bash(npm test)", "Read"]
  },
  "model": "opus",
  "hooks": {"SessionStart": [{"hooks": [{"type": "command", "command": "echo \\"hi\\""}]}]},
  "theme": "dark-ansi",
  "statusLine": { "type": "command", "command": "~/statusline.py", "padding": 0 },
  "env": {
    "NESTED": {"deep": [1, 2.5, -3e2, false, null]}
  },
  "unicode": "caf\\u00e9 ✓"
}
`;

const CONFIG = `# Codex configuration
model = "gpt-6"
approval_policy = "on-request"

[tui]
# keep this comment
notifications = true
theme = "ansi" # the previous theme
status_line_use_colors = true

[tui.model_availability_nux]
seen = 1

[projects."/home/someone/dev/x"]
trust_level = "trusted"
`;

const cli = async (home, args, extra = {}) => {
  const env = { PATH: process.env.PATH, HOME: home, ...extra };
  try {
    const { stdout, stderr } = await run(process.execPath, [CLI, ...args, "--source-root", repoRoot, "--skip-version-probe", "--orca-runtime-home", path.join(home, "orca-runtime")], { env, maxBuffer: 16 * 1024 * 1024 });
    return { code: 0, stdout, stderr };
  } catch (error) {
    return { code: error.code, stdout: error.stdout, stderr: error.stderr };
  }
};

const setupHome = async (t, { settings = SETTINGS, config = CONFIG } = {}) => {
  const home = await scratchDir(t, "j3w1-terminal-");
  await fs.mkdir(path.join(home, ".claude"), { recursive: true });
  await fs.mkdir(path.join(home, ".codex"), { recursive: true });
  if (settings !== null) await fs.writeFile(path.join(home, ".claude/settings.json"), settings);
  if (config !== null) await fs.writeFile(path.join(home, ".codex/config.toml"), config);
  return {
    home,
    state: path.join(home, ".local/state/j3w1-theme/devbox"),
    claudeTheme: path.join(home, ".claude/themes/j3w1.json"),
    codexTheme: path.join(home, ".codex/themes/j3w1.tmTheme"),
    settings: path.join(home, ".claude/settings.json"),
    config: path.join(home, ".codex/config.toml"),
  };
};

const backups = async (h) => {
  try {
    return (await fs.readdir(path.join(h.state, "backups"))).sort();
  } catch {
    return [];
  }
};

test("apply, test, apply again, restore: a byte-exact round trip", async (t) => {
  const h = await setupHome(t);

  const dry = await cli(h.home, ["apply", "--dry-run"]);
  assert.equal(dry.code, 0, dry.stderr);
  assert.match(dry.stdout, /dry run: nothing written/);
  assert.ok(!existsSync(h.state) && !existsSync(h.claudeTheme) && !existsSync(h.codexTheme));
  assert.equal(await fs.readFile(h.settings, "utf8"), SETTINGS);
  assert.equal(await fs.readFile(h.config, "utf8"), CONFIG);

  const before = await cli(h.home, ["test", "--no-specimen"]);
  assert.equal(before.code, 1, "test fails before apply");

  const applied = await cli(h.home, ["apply"]);
  assert.equal(applied.code, 0, applied.stderr);
  assert.match(applied.stdout, /restart: Claude Code: .*themes was created now/);
  assert.match(applied.stdout, /restart: Codex: new sessions only/);
  const c = await ctx();
  assert.equal(await fs.readFile(h.claudeTheme, "utf8"), `${JSON.stringify(claudeTheme(c), null, 2)}\n`);
  assert.equal(await fs.readFile(h.codexTheme, "utf8"), codexTmTheme(c));
  assert.equal(await fs.readFile(h.settings, "utf8"), SETTINGS.replace('"theme": "dark-ansi"', '"theme": "custom:j3w1"'));
  assert.equal(await fs.readFile(h.config, "utf8"), CONFIG.replace('theme = "ansi" #', 'theme = "j3w1" #'));
  assert.equal((await backups(h)).length, 1);

  const [first] = await backups(h);
  const manifest = JSON.parse(await fs.readFile(path.join(h.state, "backups", first, "manifest.json"), "utf8"));
  assert.equal(manifest.kit, "j3w1-terminal-kit");
  assert.equal(manifest.theme.revision, c.kit.theme.revision);
  assert.deepEqual(manifest.files.map((f) => [path.basename(f.path), f.existedBefore]), [["j3w1.json", false], ["j3w1.tmTheme", false]]);
  assert.deepEqual(manifest.settings.map((s) => [s.key, s.before, s.after]), [["theme", "dark-ansi", "custom:j3w1"], ["tui.theme", "ansi", "j3w1"]]);
  assert.ok(!JSON.stringify(manifest).includes("statusLine"), "the manifest holds no unrelated configuration");
  for (const i of ["claude-code", "codex"]) lockSchema(z).parse(JSON.parse(await fs.readFile(path.join(h.state, "current", `theme.lock.${i}.json`), "utf8")));

  const checked = await cli(h.home, ["test", "--no-specimen"]);
  assert.equal(checked.code, 0, checked.stderr);
  assert.match(checked.stdout, /SKIP Orca runtime home/);
  assert.match(checked.stdout, /disclose|deviation/);
  assert.match(checked.stdout, /\nPASS\n$/);

  const again = await cli(h.home, ["apply"]);
  assert.equal(again.code, 0, again.stderr);
  assert.match(again.stdout, /no changes/);
  assert.equal((await backups(h)).length, 1, "no new backup when nothing changed");

  const pinned = await cli(h.home, ["update", "--version", "v1.2.0"]);
  assert.equal(pinned.code, 0, pinned.stderr);
  assert.match(pinned.stdout, /72 of 72 overrides unchanged/);
  assert.match(pinned.stdout, /no changes/);

  const dryRestore = await cli(h.home, ["restore", "--dry-run"]);
  assert.equal(dryRestore.code, 0, dryRestore.stderr);
  assert.ok(existsSync(h.claudeTheme));

  const restored = await cli(h.home, ["restore"]);
  assert.equal(restored.code, 0, restored.stderr);
  assert.equal(await fs.readFile(h.settings, "utf8"), SETTINGS);
  assert.equal(await fs.readFile(h.config, "utf8"), CONFIG);
  assert.ok(!existsSync(h.claudeTheme) && !existsSync(h.codexTheme));
  assert.ok(!existsSync(path.dirname(h.claudeTheme)) && !existsSync(path.dirname(h.codexTheme)), "directories the kit created are removed");
  assert.ok(!existsSync(path.join(h.state, "current", "pin.json")));
  assert.equal((await backups(h)).length, 2, "restore backs up the state it replaces");

  const redo = await cli(h.home, ["restore", "--latest"]);
  assert.equal(redo.code, 0, redo.stderr);
  assert.equal(await fs.readFile(h.claudeTheme, "utf8"), `${JSON.stringify(claudeTheme(c), null, 2)}\n`);
  assert.equal((await cli(h.home, ["test", "--no-specimen"])).code, 0, "restoring the pre-restore backup reinstates the kit");
});

test("apply adds absent keys and tables and restore removes exactly them", async (t) => {
  const settings = '{\n  "model": "opus",\n  "nested": {"theme": "not the top-level key"}\n}\n';
  const config = 'model = "gpt-6"\n\n[projects."/x"]\ntrust_level = "trusted"';
  const h = await setupHome(t, { settings, config });
  assert.equal((await cli(h.home, ["apply"])).code, 0);
  assert.equal(await fs.readFile(h.settings, "utf8"), '{\n  "model": "opus",\n  "nested": {"theme": "not the top-level key"},\n  "theme": "custom:j3w1"\n}\n');
  assert.equal(await fs.readFile(h.config, "utf8"), `${config}\n\n[tui]\ntheme = "j3w1"\n`);
  assert.equal((await cli(h.home, ["test", "--no-specimen"])).code, 0);
  assert.equal((await cli(h.home, ["restore"])).code, 0);
  assert.equal(await fs.readFile(h.settings, "utf8"), settings);
  assert.equal(await fs.readFile(h.config, "utf8"), config);
});

test("missing host files are created and removed again; one host can be chosen", async (t) => {
  const h = await setupHome(t, { settings: null, config: null });
  const codexOnly = await cli(h.home, ["apply", "--codex"]);
  assert.equal(codexOnly.code, 0, codexOnly.stderr);
  assert.ok(!existsSync(h.claudeTheme) && !existsSync(h.settings));
  assert.equal(await fs.readFile(h.config, "utf8"), '[tui]\ntheme = "j3w1"\n');
  assert.equal((await cli(h.home, ["apply", "--claude"])).code, 0);
  assert.equal(JSON.parse(await fs.readFile(h.settings, "utf8")).theme, "custom:j3w1");
  assert.equal((await cli(h.home, ["restore"])).code, 0, "the first backup covers the Codex half only");
  assert.ok(!existsSync(h.config) && !existsSync(h.codexTheme));
  assert.ok(existsSync(h.settings), "the Claude half belongs to the second backup");
  const [, second] = await backups(h);
  assert.equal((await cli(h.home, ["restore", "--backup", second])).code, 0);
  assert.ok(!existsSync(h.settings) && !existsSync(h.claudeTheme));
});

test("the Orca runtime home is checked read-only through Orca's themes link", async (t) => {
  const h = await setupHome(t);
  const rt = path.join(h.home, "orca-runtime");
  await fs.mkdir(rt, { recursive: true });
  await fs.writeFile(path.join(rt, "config.toml"), CONFIG);
  assert.equal((await cli(h.home, ["apply"])).code, 0);
  const pending = await cli(h.home, ["test", "--no-specimen"]);
  assert.equal(pending.code, 0, pending.stderr);
  assert.match(pending.stdout, /WARN .*orca-runtime\/themes is not there yet/);
  assert.match(pending.stdout, /WARN Orca runtime config tui.theme = "ansi"/);
  assert.ok(!existsSync(path.join(rt, "themes")), "the kit never writes into the runtime home");
  await fs.symlink(path.join(h.home, ".codex/themes"), path.join(rt, "themes"));
  await fs.writeFile(path.join(rt, "config.toml"), CONFIG.replace('"ansi"', '"j3w1"'));
  const linked = await cli(h.home, ["test", "--no-specimen"]);
  assert.equal(linked.code, 0, linked.stderr);
  assert.match(linked.stdout, /PASS Orca runtime home: .* links to .* resolves to the generated theme/);
  assert.match(linked.stdout, /PASS Orca runtime config tui.theme = "j3w1"/);
});

test("an unwritable state directory stops apply before any file changes", async (t) => {
  const h = await setupHome(t);
  const locked = path.join(h.home, "locked");
  await fs.mkdir(locked, { mode: 0o500 });
  const state = path.join(locked, "j3w1-theme");
  let result;
  try {
    result = await cli(h.home, ["apply"], { J3W1_TERMINAL_KIT_STATE_DIR: state });
  } finally {
    await fs.chmod(locked, 0o700);
  }
  assert.equal(result.code, 1, result.stderr);
  assert.match(result.stderr, /is not writable .*nothing was changed/);
  assert.ok(!existsSync(state) && !existsSync(h.claudeTheme) && !existsSync(h.codexTheme));
  assert.equal(await fs.readFile(h.settings, "utf8"), SETTINGS);
  assert.equal(await fs.readFile(h.config, "utf8"), CONFIG);
});

test("J3W1_TERMINAL_KIT_STATE_DIR moves the state directory", async (t) => {
  const h = await setupHome(t);
  const state = path.join(h.home, "elsewhere");
  const result = await cli(h.home, ["apply"], { J3W1_TERMINAL_KIT_STATE_DIR: state });
  assert.equal(result.code, 0, result.stderr);
  assert.ok(existsSync(path.join(state, "current", "manifest.json")) && !existsSync(h.state));
});

test("update takes explicit release tags only", async (t) => {
  const h = await setupHome(t);
  for (const ref of ["main", "latest", "1.2.0", "0838171cb6907f21f91f45ac9f7a992d7164a4eb"]) {
    const result = await cli(h.home, ["update", "--version", ref]);
    assert.equal(result.code, 1, ref);
    assert.match(result.stderr, /explicit release tag/);
  }
  assert.equal((await cli(h.home, ["update"])).code, 1);
  assert.ok(!existsSync(h.state));
});

test("the specimen command renders to stdout", async (t) => {
  const h = await setupHome(t);
  const result = await cli(h.home, ["specimen"]);
  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /Claude Code roles under the j3w1 custom theme/);
  assert.match(result.stdout, /\u001b\[48;2;/);
});
