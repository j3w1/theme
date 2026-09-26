import assert from "node:assert/strict";
import { execFile, execFileSync, spawn } from "node:child_process";
import { existsSync, promises as fs, readFileSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { parse as parseToml } from "smol-toml";
import { z } from "zod";
import { lockSchema } from "../schemas/lock.mjs";
import { repoRoot } from "../scripts/lib/fs.mjs";
import { apply, resolvePaths, restore } from "../tools/terminal-kit/devbox/lib/commands.mjs";
import { EditError, jsonRemove, jsonSet, tomlGet, tomlRestore, tomlSet } from "../tools/terminal-kit/devbox/lib/edit.mjs";
import { claudeTheme, codexTmTheme, ghosttyConfig, lock, roleTokenIds } from "../tools/terminal-kit/devbox/lib/generators.mjs";
import { parsePlist } from "../tools/terminal-kit/devbox/lib/plist.mjs";
import { FETCH_TIMEOUT_MS, fetchText, KitError, loadContext, sha256Base64 } from "../tools/terminal-kit/devbox/lib/source.mjs";
import { renderSpecimen } from "../tools/terminal-kit/devbox/lib/specimen.mjs";
import { scratchDir } from "./helpers/scratch.mjs";

const run = promisify(execFile);
const CLI = path.join(repoRoot, "tools/terminal-kit/devbox/j3w1-terminal.mjs");
const KIT = path.join(repoRoot, "tools/terminal-kit");
const readKitJson = async (file) => JSON.parse(await fs.readFile(path.join(KIT, file), "utf8"));

/* Everything the kit consumes is read at the pinned revision, never from
   HEAD's working tree: a release bump moves HEAD's exports before the pin
   can follow (CI checks out the full history, so the pin is present). */
const PIN = JSON.parse(readFileSync(path.join(KIT, "kit.json"), "utf8")).theme;
const gitAt = (root, args, options = {}) => execFileSync("git", ["-C", root, ...args], { maxBuffer: 64 * 1024 * 1024, stdio: ["pipe", "pipe", "ignore"], ...options });
const atPin = (file) => gitAt(repoRoot, ["show", `${PIN.revision}:${file}`]);
const STATE_FILES = ["manifest.json", "pin.json", "pin.claude-code.json", "pin.codex.json", "theme.lock.claude-code.json", "theme.lock.codex.json"];

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
const DISCLOSED = { "color.border.divider": ["D-008"], "color.border.overlay": ["D-008"] };

let context;
const ctx = async () => (context ??= await loadContext({ sourceRoot: repoRoot, offline: true }));

const specimenTokenIds = (specimen) => {
  const ids = new Set();
  for (const section of specimen.sections) for (const line of section.lines ?? []) for (const s of line) for (const k of ["fgToken", "bgToken"]) if (s[k]) ids.add(s[k]);
  return [...ids];
};

test("the pinned export matches its digests and every consumed token is eligible", async () => {
  const kit = await readKitJson("kit.json");
  const digests = JSON.parse(atPin(kit.exports.digests).toString("utf8"));
  const bytes = atPin(kit.exports.tokens);
  assert.equal(sha256Base64(bytes), digests.files[kit.exports.tokens], "the pinned export matches the pinned digests.json");
  assert.equal(sha256Base64(bytes), kit.exports.tokensDigest, "kit.json pins the export's digest");
  const c = await ctx();
  assert.equal(c.source.via, "git");
  assert.equal(c.exports[kit.exports.tokens], kit.exports.tokensDigest, "the context is built from the pinned export");
  assert.match(c.source.digestCheck, /pinned by kit\.json/);
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

test("warning only: this checkout's exports have moved past the kit's pin", async (t) => {
  /* Never fails: a release commit changes the export before the kit can pin
     the tag that contains it. It says so, so the pin is moved on purpose. */
  const kit = await readKitJson("kit.json");
  for (const file of [kit.exports.tokens, "ports/orca/dist/config.ghostty"]) {
    const head = await fs.readFile(path.join(repoRoot, file)).catch(() => null);
    const pinned = atPin(file);
    if (!head || sha256Base64(head) !== sha256Base64(pinned)) t.diagnostic(`WARNING: ${file} in this checkout differs from ${PIN.ref} (${PIN.revision}); the kit keeps installing the pin until kit.json moves to a tag that contains the change`);
  }
});

test("an export that does not match the pinned digest is refused", async () => {
  await assert.rejects(loadContext({ sourceRoot: repoRoot, offline: true, pin: { tokensDigest: "sha256-not-the-export" } }), (e) => e instanceof KitError && /not the sha256-not-the-export the installed pin records; refusing/.test(e.message));
});

test("network requests time out with a clear error", { timeout: 10000 }, async (t) => {
  assert.equal(FETCH_TIMEOUT_MS, 20000);
  const server = http.createServer(() => {});
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => {
    server.closeAllConnections();
    server.close();
  });
  const url = `http://127.0.0.1:${server.address().port}/never`;
  await assert.rejects(fetchText(url, undefined, { timeoutMs: 300 }), (e) => e instanceof KitError && e.message.includes(`GET ${url} timed out after 0.3 s`));
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
  const port = atPin("ports/orca/dist/config.ghostty").toString("utf8").split("\n").filter((l) => l.trim() && !l.startsWith("#"));
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

test("the specimen shows exactly the six attributes the spec defines", async () => {
  const c = await ctx();
  const text = renderSpecimen(c);
  for (const name of ["bold", "dim", "italic", "underline", "inverse", "strikethrough"]) assert.ok(text.includes(`${name} in slot 1`), name);
  assert.ok(!text.includes("blink") && !text.includes("hidden"));
  assert.doesNotMatch(text, /\u001b\[(?:[\d;]*;)?[58](?:;[\d;]*)?m/, "no SGR 5 (blink) or 8 (hidden)");
  const bad = { ...c, specimen: { sections: [{ title: "x", lines: [[{ text: "x", attrs: ["blink"] }]] }] } };
  assert.throws(() => renderSpecimen(bad), /does not define/);
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
  const crlf = '{\r\n  "a": 1\r\n}\r\n';
  assert.equal(jsonSet(crlf, "theme", "x"), '{\r\n  "a": 1,\r\n  "theme": "x"\r\n}\r\n', "an inserted member takes the file's line ending");
  assert.equal(jsonRemove(jsonSet(crlf, "theme", "x"), "theme"), crlf);
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

test("TOML edits keep CRLF line endings and find a commented header", () => {
  const crlf = 'model = "gpt-6"\r\n\r\n[tui] # interface\r\nnotifications = true\r\n';
  const set = tomlSet(crlf, "tui", "theme", "j3w1");
  assert.equal(set, 'model = "gpt-6"\r\n\r\n[tui] # interface\r\ntheme = "j3w1"\r\nnotifications = true\r\n');
  assert.equal(parseToml(set).tui.theme, "j3w1");
  assert.equal(tomlRestore(set, "tui", "theme", {}), crlf);

  const withKey = crlf.replace("notifications", 'theme = "ansi" # old\r\nnotifications');
  assert.deepEqual(tomlGet(withKey, "tui", "theme"), { present: true, line: 'theme = "ansi" # old', value: "ansi" });
  const replaced = tomlSet(withKey, "tui", "theme", "j3w1");
  assert.equal(replaced, withKey.replace('"ansi"', '"j3w1"'));
  assert.equal(tomlRestore(replaced, "tui", "theme", { beforeLine: 'theme = "ansi" # old' }), withKey);

  for (const noTable of ['model = "x"\r\n', 'a = 1\r\nmodel = "x"']) {
    const appended = tomlSet(noTable, "tui", "theme", "j3w1");
    assert.doesNotMatch(appended, /[^\r]\n/, "every line ending stays CRLF");
    assert.equal(tomlRestore(appended, "tui", "theme", { appendedTable: { addedNewline: !noTable.endsWith("\n") } }), noTable, JSON.stringify(noTable));
  }
});

test("TOML forms the line editor would get wrong are refused", () => {
  for (const [text, why] of [
    ['["tui"]\ntheme = "ansi"\n', /array or a quoted key/],
    ["[ 'tui' ]\nx = 1\n", /array or a quoted key/],
    ['[[tui]]\nx = 1\n', /array or a quoted key/],
    ['tui.theme = "ansi"\n', /dotted or inline keys at the top level/],
    ['tui = { theme = "ansi" }\n', /dotted or inline keys at the top level/],
    ['"tui".theme = "ansi"\r\n', /dotted or inline keys at the top level/],
    ['[tui]\n"theme" = "ansi"\n', /plain one-line string/],
    ['[tui]\ntheme = """ansi"""\n', /plain one-line string/],
    ['[tui]\ntheme.x = 1\n', /plain one-line string/],
    ['[tui]\na = 1\n\n[tui]\nb = 2\n', /repeats the \[tui\] header/],
  ]) {
    assert.throws(() => tomlSet(text, "tui", "theme", "j3w1"), (e) => e instanceof EditError && why.test(e.message), text);
    assert.throws(() => tomlGet(text, "tui", "theme"), EditError, text);
  }
});

test("TOML string escapes are decoded, or refused as an EditError", () => {
  assert.equal(tomlGet('[tui]\ntheme = "a\\U0001F600\\u00e9\\t\\\\"\n', "tui", "theme").value, "a\u{1F600}\u00e9\t\\");
  assert.equal(tomlGet("[tui]\ntheme = 'C:\\no\\escape'\n", "tui", "theme").value, "C:\\no\\escape");
  for (const bad of ["\\q", "\\uD800", "\\U00110000"]) assert.throws(() => tomlGet(`[tui]\ntheme = "${bad}"\n`, "tui", "theme"), EditError, bad);
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

/* The CLI always runs with an explicit environment: HOME is the scratch
   directory and nothing else from this session (CLAUDE_CONFIG_DIR, XDG_*)
   reaches it. */
const cli = async (home, args, extra = {}, { probe = false, sourceRoot = repoRoot } = {}) => {
  const env = { PATH: process.env.PATH, HOME: home, ...extra };
  try {
    const { stdout, stderr } = await run(process.execPath, [CLI, ...args, "--source-root", sourceRoot, ...(probe ? [] : ["--skip-version-probe"]), "--orca-runtime-home", path.join(home, "orca-runtime")], { env, maxBuffer: 16 * 1024 * 1024 });
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

  const pinned = await cli(h.home, ["update", "--version", (await readKitJson("kit.json")).theme.ref]);
  assert.equal(pinned.code, 0, pinned.stderr);
  assert.match(pinned.stdout, /kit files from this checkout \(the tag is its own pin\)/, "the kit's own pin keeps the checkout's maps");
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

const current = (h, name) => path.join(h.state, "current", name);

test("split installs: the default restore undoes both halves; one backup undoes its half", async (t) => {
  const installBoth = async () => {
    const h = await setupHome(t, { settings: null, config: null });
    const codexOnly = await cli(h.home, ["apply", "--codex"]);
    assert.equal(codexOnly.code, 0, codexOnly.stderr);
    assert.ok(!existsSync(h.claudeTheme) && !existsSync(h.settings));
    assert.equal(await fs.readFile(h.config, "utf8"), '[tui]\ntheme = "j3w1"\n');
    assert.equal((await cli(h.home, ["apply", "--claude"])).code, 0);
    assert.equal(JSON.parse(await fs.readFile(h.settings, "utf8")).theme, "custom:j3w1");
    assert.equal((await backups(h)).length, 2);
    return h;
  };

  const h = await installBoth();
  const restored = await cli(h.home, ["restore"]);
  assert.equal(restored.code, 0, restored.stderr);
  assert.ok(![h.config, h.codexTheme, h.settings, h.claudeTheme].some(existsSync), "both halves are gone");
  for (const n of STATE_FILES) assert.ok(!existsSync(current(h, n)), `${n} is gone: nothing is installed`);
  assert.match((await cli(h.home, ["restore"])).stdout, /nothing was applied since the restore/);

  const one = await installBoth();
  const [first] = await backups(one);
  assert.equal((await cli(one.home, ["restore", "--backup", first])).code, 0);
  assert.ok(!existsSync(one.config) && !existsSync(one.codexTheme), "the Codex half is undone");
  assert.ok(existsSync(one.settings) && existsSync(one.claudeTheme), "the Claude half stays");
  assert.ok(!existsSync(current(one, "theme.lock.codex.json")));
  for (const n of ["theme.lock.claude-code.json", "pin.claude-code.json", "manifest.json"]) assert.ok(existsSync(current(one, n)), `${n} still describes the Claude half`);
  assert.ok(!existsSync(current(one, "pin.codex.json")));
  assert.equal((await cli(one.home, ["test", "--claude", "--no-specimen"])).code, 0);
  assert.equal((await cli(one.home, ["restore"])).code, 0, "the default restore undoes the rest");
  assert.ok(![one.config, one.codexTheme, one.settings, one.claudeTheme].some(existsSync));
  for (const n of STATE_FILES) assert.ok(!existsSync(current(one, n)), n);
});

test("restore, an owner change, apply, restore: the owner's value comes back", async (t) => {
  const h = await setupHome(t);
  assert.equal((await cli(h.home, ["apply"])).code, 0);
  assert.equal((await cli(h.home, ["restore"])).code, 0);
  const owners = SETTINGS.replace('"theme": "dark-ansi"', '"theme": "light"');
  await fs.writeFile(h.settings, owners);
  await fs.writeFile(h.config, CONFIG.replace('"ansi"', '"base16"'));
  assert.equal((await cli(h.home, ["apply"])).code, 0);
  const again = await cli(h.home, ["restore"]);
  assert.equal(again.code, 0, again.stderr);
  assert.equal(await fs.readFile(h.settings, "utf8"), owners, "not the value from before the first apply");
  assert.equal(await fs.readFile(h.config, "utf8"), CONFIG.replace('"ansi"', '"base16"'));
});

test("restore warns about a managed file edited after apply and keeps the edited copy", async (t) => {
  const h = await setupHome(t);
  assert.equal((await cli(h.home, ["apply"])).code, 0);
  const edited = `${await fs.readFile(h.claudeTheme, "utf8")}\n`;
  await fs.writeFile(h.claudeTheme, edited);
  await fs.writeFile(h.settings, SETTINGS.replace('"theme": "dark-ansi"', '"theme": "custom:mine"'));
  const dry = await cli(h.home, ["restore", "--dry-run"]);
  assert.equal(dry.code, 0, dry.stderr);
  assert.match(dry.stdout, /WARN .*j3w1\.json changed after the kit wrote it/);
  assert.match(dry.stdout, /WARN .*settings\.json theme is "custom:mine" now, not the kit's "custom:j3w1"/);
  const restored = await cli(h.home, ["restore"]);
  assert.equal(restored.code, 0, restored.stderr);
  const kept = /kept the edited .*j3w1\.json as (\S+)/.exec(restored.stdout);
  assert.ok(kept, restored.stdout);
  assert.equal(await fs.readFile(kept[1], "utf8"), edited);
  assert.ok(!existsSync(h.claudeTheme));
  assert.equal(await fs.readFile(h.settings, "utf8"), SETTINGS);
});

test("CRLF config.toml with a commented [tui] header: apply, test and restore stay valid", async (t) => {
  const config = 'model = "gpt-6"\r\n\r\n[tui] # interface\r\nnotifications = true\r\n';
  const h = await setupHome(t, { config });
  const applied = await cli(h.home, ["apply", "--codex"]);
  assert.equal(applied.code, 0, applied.stderr);
  const text = await fs.readFile(h.config, "utf8");
  assert.equal(text, 'model = "gpt-6"\r\n\r\n[tui] # interface\r\ntheme = "j3w1"\r\nnotifications = true\r\n');
  assert.deepEqual(parseToml(text), { model: "gpt-6", tui: { theme: "j3w1", notifications: true } });
  assert.equal((await cli(h.home, ["test", "--codex", "--no-specimen"])).code, 0);
  assert.equal((await cli(h.home, ["restore"])).code, 0);
  assert.equal(await fs.readFile(h.config, "utf8"), config);
});

test("test FAILs and restore refuses when config.toml does not parse", async (t) => {
  const h = await setupHome(t);
  assert.equal((await cli(h.home, ["apply"])).code, 0);
  const broken = `${await fs.readFile(h.config, "utf8")}\n[tui]\nextra = 1\n`;
  await fs.writeFile(h.config, broken);
  const checked = await cli(h.home, ["test", "--codex", "--no-specimen"]);
  assert.equal(checked.code, 1, checked.stdout);
  assert.match(checked.stdout, /FAIL .*config\.toml.*(is not valid TOML|repeats the \[tui\] header)/);
  const settingsBefore = await fs.readFile(h.settings, "utf8");
  const restored = await cli(h.home, ["restore"]);
  assert.equal(restored.code, 1, restored.stdout);
  assert.match(restored.stderr, /config\.toml.*nothing was written/);
  assert.equal(await fs.readFile(h.config, "utf8"), broken, "no duplicate table is written or left behind by restore");
  assert.equal(await fs.readFile(h.settings, "utf8"), settingsBefore, "restore planned everything before writing anything");
  assert.equal((await backups(h)).length, 1);
});

test("a guard failure writes nothing and makes no backup", async (t) => {
  for (const config of ['tui.theme = "ansi"\n', '["tui"]\ntheme = "ansi"\n', 'tui = { theme = "ansi" }\n', '[tui]\ntheme = "\\q"\n']) {
    const h = await setupHome(t, { config });
    for (const args of [["apply", "--dry-run"], ["apply"]]) {
      const result = await cli(h.home, args);
      assert.equal(result.code, 1, `${config} ${args}`);
      assert.match(result.stderr, /^j3w1-terminal: .*config\.toml.*nothing was written\n$/s, result.stderr);
      assert.doesNotMatch(result.stderr, /SyntaxError|\n\s+at /);
      assert.doesNotMatch(result.stdout, /tui\.theme: \(absent\)/, "the plan never reports the key as absent");
    }
    assert.ok(![h.state, h.claudeTheme, h.codexTheme].some(existsSync), config);
    assert.equal(await fs.readFile(h.settings, "utf8"), SETTINGS);
    assert.equal(await fs.readFile(h.config, "utf8"), config);
  }
});

test("a BOM is kept on settings.json and config.toml, and restore is byte-exact", async (t) => {
  const settings = `\uFEFF${SETTINGS}`;
  const config = `\uFEFF${CONFIG}`;
  const h = await setupHome(t, { settings, config });
  const applied = await cli(h.home, ["apply"]);
  assert.equal(applied.code, 0, applied.stderr);
  assert.equal(await fs.readFile(h.settings, "utf8"), settings.replace('"theme": "dark-ansi"', '"theme": "custom:j3w1"'));
  assert.equal(await fs.readFile(h.config, "utf8"), config.replace('theme = "ansi" #', 'theme = "j3w1" #'));
  assert.equal((await cli(h.home, ["restore"])).code, 0);
  assert.equal(await fs.readFile(h.settings, "utf8"), settings);
  assert.equal(await fs.readFile(h.config, "utf8"), config);
});

test("a host that writes its settings when probed loses nothing", async (t) => {
  const h = await setupHome(t);
  const bin = path.join(h.home, "bin");
  await fs.mkdir(bin);
  const hostWrites = '{"model":"opus","permissions":{"allow":["Read"]},"theme":"dark-ansi"}';
  await fs.writeFile(path.join(bin, "claude"), `#!/bin/sh\nprintf '%s\\n' '${hostWrites}' > "$HOME/.claude/settings.json"\necho "2.1.283 (Claude Code)"\n`, { mode: 0o755 });
  await fs.writeFile(path.join(bin, "codex"), "#!/bin/sh\necho codex-cli 0.0.0\n", { mode: 0o755 });
  const applied = await cli(h.home, ["apply"], { PATH: `${bin}${path.delimiter}${process.env.PATH}` }, { probe: true });
  assert.equal(applied.code, 0, applied.stderr);
  assert.deepEqual(JSON.parse(await fs.readFile(h.settings, "utf8")), { model: "opus", permissions: { allow: ["Read"] }, theme: "custom:j3w1" });
  assert.equal(JSON.parse(await fs.readFile(current(h, "manifest.json"), "utf8")).hosts["claude-code"], "2.1.283", "the probe ran");
  assert.equal((await cli(h.home, ["restore"])).code, 0);
  assert.equal(await fs.readFile(h.settings, "utf8"), `${hostWrites}\n`);
});

/* The commands in this process, against a scratch HOME, with explicit paths. */
const quiet = () => {};
const inProcess = async (t, files) => {
  const h = await setupHome(t, files);
  const paths = resolvePaths({ stateDir: h.state, claudeConfigDir: path.join(h.home, ".claude"), codexHome: path.join(h.home, ".codex"), orcaRuntimeHome: path.join(h.home, "orca-runtime") }, { HOME: h.home });
  const opts = (hooks, more = {}) => ({ integrations: ["claude-code", "codex"], sourceRoot: repoRoot, skipVersionProbe: true, hooks, ...more });
  return { h, paths, opts };
};

const manifestOf = async (h, name) => JSON.parse(await fs.readFile(path.join(h.state, "backups", name, "manifest.json"), "utf8"));

test("a file changed between plan and write is planned again once, then the run stops", async (t) => {
  const setup = () => inProcess(t);

  /* Once: the other program's write is kept and the kit's key still lands. */
  const a = await setup();
  const sonnet = SETTINGS.replace('"model": "opus"', '"model": "sonnet"');
  const lines = [];
  let once = true;
  const onceHook = async (file) => {
    if (file === a.h.settings && once) {
      once = false;
      await fs.writeFile(a.h.settings, sonnet);
    }
  };
  assert.equal(await apply(a.opts({ beforeWrite: onceHook }), a.paths, (l) => lines.push(l)), 0);
  assert.match(lines.join("\n"), /settings\.json changed since the plan .*planning it again/);
  assert.equal(await fs.readFile(a.h.settings, "utf8"), sonnet.replace('"theme": "dark-ansi"', '"theme": "custom:j3w1"'));
  assert.equal(await restore(a.opts(), a.paths, quiet), 0);
  assert.equal(await fs.readFile(a.h.settings, "utf8"), sonnet, "the backup holds the bytes that were actually replaced");

  /* Always: stop at that file; what was written before it stays recorded. */
  const b = await setup();
  let n = 0;
  const always = async (file) => {
    if (file === b.h.config) await fs.writeFile(b.h.config, `${CONFIG}# edit ${(n += 1)}\n`);
  };
  await assert.rejects(apply(b.opts({ beforeWrite: always }), b.paths, quiet), (e) => e instanceof KitError && /config\.toml: another program changed it again.*stopped with nothing further written\. Already written: /.test(e.message));
  assert.equal(await fs.readFile(b.h.config, "utf8"), `${CONFIG}# edit 2\n`, "the kit never wrote config.toml");
  const [only] = await backups(b.h);
  const manifest = JSON.parse(await fs.readFile(path.join(b.h.state, "backups", only, "manifest.json"), "utf8"));
  assert.match(manifest.incomplete, /config\.toml/);
  assert.deepEqual(manifest.settings.map((s) => s.key), ["theme"], "the manifest lists only what was written");
  assert.equal(await restore(b.opts(), b.paths, quiet), 0);
  assert.equal(await fs.readFile(b.h.settings, "utf8"), SETTINGS);
  assert.ok(!existsSync(b.h.claudeTheme) && !existsSync(b.h.codexTheme));
  assert.equal(await fs.readFile(b.h.config, "utf8"), `${CONFIG}# edit 2\n`);

  /* At the first write: nothing is written and no backup is kept. */
  const c = await setup();
  const first = async (file) => {
    if (file === c.h.claudeTheme) await fs.mkdir(path.dirname(file), { recursive: true }).then(() => fs.writeFile(file, `{"n": ${(n += 1)}}`));
  };
  await assert.rejects(apply(c.opts({ beforeWrite: first }), c.paths, quiet), /Nothing was written and no backup was kept/);
  assert.deepEqual(await backups(c.h), []);
  assert.equal(await fs.readFile(c.h.settings, "utf8"), SETTINGS);

  /* Restore takes the same care. */
  const d = await setup();
  assert.equal(await apply(d.opts(), d.paths, quiet), 0);
  const edits = async (file) => {
    if (file === d.h.settings) await fs.writeFile(d.h.settings, SETTINGS.replace('"theme": "dark-ansi"', `"theme": "custom:j3w1", "n": ${(n += 1)}`));
  };
  await assert.rejects(restore({ ...d.opts({ beforeWrite: edits }) }, d.paths, quiet), /settings\.json: another program changed it again/);
  assert.match(await fs.readFile(d.h.settings, "utf8"), /"n": \d+/, "restore did not overwrite the other program's write");
});

/* The state after a finished restore of everything: pre-kit files, no kit
   files and no kit state. */
const assertPreKit = async (h, { settings = SETTINGS, config = CONFIG } = {}) => {
  assert.equal(await fs.readFile(h.settings, "utf8"), settings);
  assert.equal(await fs.readFile(h.config, "utf8"), config);
  assert.ok(!existsSync(h.claudeTheme) && !existsSync(h.codexTheme), "no kit theme file is left");
  for (const n of STATE_FILES) assert.ok(!existsSync(current(h, n)), `${n} is gone: nothing is installed`);
};

test("a restore stopped by another program's writes is not a baseline; running it again finishes the job", async (t) => {
  const { h, paths, opts } = await inProcess(t);
  assert.equal(await apply(opts(), paths, quiet), 0);
  let n = 0;
  const edits = async (file) => {
    if (file === h.settings) await fs.writeFile(h.settings, SETTINGS.replace('"theme": "dark-ansi"', `"theme": "custom:j3w1", "n": ${(n += 1)}`));
  };
  await assert.rejects(restore(opts({ beforeWrite: edits }), paths, quiet), (e) => e instanceof KitError && /settings\.json: another program changed it again.*Already written: .*j3w1\.json.*This restore is not complete: run restore again; it finishes the job\./s.test(e.message));
  assert.ok(!existsSync(h.claudeTheme) && !existsSync(h.codexTheme), "the theme files were already deleted");
  const stopped = (await backups(h)).at(-1);
  const record = await manifestOf(h, stopped);
  assert.deepEqual([record.complete, record.baseline], [false, false]);
  assert.match(record.incomplete, /settings\.json/);

  const lines = [];
  assert.equal(await restore(opts(), paths, (l) => lines.push(l)), 0);
  assert.match(lines.join("\n"), new RegExp(`${stopped} \\(restore, stopped partway: finishing it\\)`));
  await assertPreKit(h, { settings: SETTINGS.replace('"theme": "dark-ansi"', `"theme": "dark-ansi", "n": ${n}`) });
  const done = await manifestOf(h, (await backups(h)).at(-1));
  assert.deepEqual([done.complete, done.baseline], [true, true]);
  const third = [];
  assert.equal(await restore(opts(), paths, (l) => third.push(l)), 0);
  assert.match(third.join("\n"), /nothing was applied since the restore/);
});

test("a restore stopped by a write error is not a baseline; running it again finishes the job", { skip: process.getuid?.() === 0 && "root ignores the permission" }, async (t) => {
  const { h, paths, opts } = await inProcess(t);
  assert.equal(await apply(opts(), paths, quiet), 0);
  const codexHome = path.dirname(h.config);
  const lock = async (file) => {
    if (file === h.config) await fs.chmod(codexHome, 0o500);
  };
  try {
    await assert.rejects(restore(opts({ beforeWrite: lock }), paths, quiet), (e) => e instanceof KitError && /config\.toml: writing it failed \(EACCES.*stopped with nothing further written\. Already written: .*settings\.json.*run restore again; it finishes the job\./s.test(e.message));
  } finally {
    await fs.chmod(codexHome, 0o700);
  }
  assert.equal(await fs.readFile(h.settings, "utf8"), SETTINGS, "settings.json was restored before the failure");
  assert.match(await fs.readFile(h.config, "utf8"), /theme = "j3w1"/, "config.toml still holds the kit's value");
  const record = await manifestOf(h, (await backups(h)).at(-1));
  assert.equal(record.complete, false);
  assert.deepEqual(record.settings.map((e) => e.key), ["theme"], "the record lists only what was written");
  assert.equal(await restore(opts(), paths, quiet), 0);
  await assertPreKit(h);
});

test("a closed output pipe never interrupts restore", async (t) => {
  const h = await setupHome(t);
  assert.equal((await cli(h.home, ["apply"])).code, 0);
  /* Both ends the reader holds are closed before the kit prints its first
     line, as with `restore | head -1` once head has exited. */
  const child = spawn(process.execPath, [CLI, "restore", "--source-root", repoRoot, "--skip-version-probe"], { env: { PATH: process.env.PATH, HOME: h.home }, stdio: ["ignore", "pipe", "pipe"] });
  child.stdout.destroy();
  child.stderr.destroy();
  const code = await new Promise((resolve) => child.on("close", resolve));
  assert.equal(code, 0, "restore finished although nobody read its output");
  await assertPreKit(h);
  assert.equal((await manifestOf(h, (await backups(h)).at(-1))).complete, true);
  const again = await cli(h.home, ["restore"]);
  assert.equal(again.code, 0, again.stderr);
  assert.match(again.stdout, /nothing was applied since the restore/);
});

test("output that cannot be written for any reason but a closed reader fails the command", { skip: !existsSync("/dev/full") && "no /dev/full" }, async (t) => {
  const h = await setupHome(t);
  const full = await fs.open("/dev/full", "w");
  t.after(() => full.close());
  const child = spawn(process.execPath, [CLI, "specimen", "--source-root", repoRoot, "--skip-version-probe"], { env: { PATH: process.env.PATH, HOME: h.home }, stdio: ["ignore", full.fd, "pipe"] });
  let stderr = "";
  child.stderr.on("data", (d) => (stderr += d));
  const code = await new Promise((resolve) => child.on("close", resolve));
  assert.equal(code, 1, "a full disk is not a closed pipe");
  assert.match(stderr, /the output could not be written \(ENOSPC\)/);
});

test("a write that fails after its rename stays in the manifest, so restore undoes it", async (t) => {
  const { h, paths, opts } = await inProcess(t);
  /* The rename lands other bytes than the kit's (a host rewrote the file in
     between), so it does not read back as written. */
  const temp = path.join(path.dirname(h.settings), `.settings.json.j3w1-${process.pid}.tmp`);
  const race = async (file) => {
    if (file === h.settings) await fs.writeFile(temp, (await fs.readFile(temp, "utf8")).replace('"theme": "custom:j3w1"', '"theme": "custom:j3w1", "n": 1'));
  };
  await assert.rejects(apply(opts({ beforeCommit: race }), paths, quiet), (e) => e instanceof KitError && /settings\.json: writing it failed \(.*did not read back as written\).*Already written: .*j3w1\.json, .*settings\.json;/s.test(e.message));
  const record = await manifestOf(h, (await backups(h)).at(-1));
  assert.deepEqual(record.settings.map((e) => e.key), ["theme"], "the renamed file is recorded");
  assert.equal(await restore(opts(), paths, quiet), 0);
  await assertPreKit(h, { settings: SETTINGS.replace('"theme": "dark-ansi"', '"theme": "dark-ansi", "n": 1') });
});

test("a stopped restore's own writes are not reported as another program's", async (t) => {
  const { h, paths, opts } = await inProcess(t);
  assert.equal(await apply(opts(), paths, quiet), 0);
  const kits = CONFIG.replace('"ansi"', '"j3w1"');
  let n = 0;
  const always = async (file) => {
    if (file === h.config) await fs.writeFile(h.config, `${kits}# edit ${(n += 1)}\n`);
  };
  /* Both theme files deleted and settings.json restored, then it stops. */
  await assert.rejects(restore(opts({ beforeWrite: always }), paths, quiet), /config\.toml: another program changed it again/);
  assert.equal(await fs.readFile(h.settings, "utf8"), SETTINGS);
  assert.equal(await apply(opts(), paths, quiet), 0);
  const lines = [];
  assert.equal(await restore(opts(), paths, (l) => lines.push(l)), 0);
  assert.match(lines.join("\n"), /\(restore, stopped partway: finishing it\)/);
  assert.doesNotMatch(lines.join("\n"), /WARN/);
  await assertPreKit(h, { config: `${CONFIG}# edit 2\n` });

  /* A value changed between two applies and set back by hand before the
     restore: restore has nothing to do there and does not warn. */
  const b = await inProcess(t);
  assert.equal(await apply(b.opts(), b.paths, quiet), 0);
  await fs.writeFile(b.h.settings, SETTINGS.replace('"theme": "dark-ansi"', '"theme": "light"'));
  assert.equal(await apply(b.opts(), b.paths, quiet), 0);
  await fs.writeFile(b.h.settings, SETTINGS);
  const quietLines = [];
  assert.equal(await restore(b.opts(), b.paths, (l) => quietLines.push(l)), 0);
  assert.match(quietLines.join("\n"), /same {3}.*settings\.json theme/);
  assert.doesNotMatch(quietLines.join("\n"), /WARN/);
  await assertPreKit(b.h);
});

test("a stopped --latest restore names restore --backup, and the default restore does not claim to finish it", async (t) => {
  const { h, paths, opts } = await inProcess(t);
  assert.equal(await apply(opts(), paths, quiet), 0);
  const [applied] = await backups(h);
  const kits = CONFIG.replace('"ansi"', '"j3w1"');
  let n = 0;
  const always = async (file) => {
    if (file === h.config) await fs.writeFile(h.config, `${kits}# edit ${(n += 1)}\n`);
  };
  await assert.rejects(restore(opts({ beforeWrite: always }, { latest: true }), paths, quiet), (e) => e instanceof KitError && e.message.includes(`This restore is not complete: run restore --backup ${applied} again; it finishes the job. Not restore --latest: that undoes this stopped restore instead.`));
  const stopped = (await backups(h)).at(-1);
  const lines = [];
  assert.equal(await restore(opts(), paths, (l) => lines.push(l)), 0);
  assert.match(lines.join("\n"), new RegExp(`${stopped} \\(restore ${applied}, stopped partway\\)`));
  assert.doesNotMatch(lines.join("\n"), /finishing it|WARN/);
  await assertPreKit(h, { config: `${CONFIG}# edit 2\n` });
});

test("every restore that leaves nothing of the kit applied is a baseline", async (t) => {
  const light = SETTINGS.replace('"theme": "dark-ansi"', '"theme": "light"');
  const base16 = CONFIG.replace('"ansi"', '"base16"');
  const ownerChange = async (h) => {
    await fs.writeFile(h.settings, light);
    await fs.writeFile(h.config, base16);
  };
  const reapplyAndRestore = async (h) => {
    assert.equal((await cli(h.home, ["apply"])).code, 0);
    const again = await cli(h.home, ["restore"]);
    assert.equal(again.code, 0, again.stderr);
    assert.doesNotMatch(again.stdout, /WARN/);
    await assertPreKit(h, { settings: light, config: base16 });
  };

  for (const how of [["--latest"], ["--backup"]]) {
    const h = await setupHome(t);
    assert.equal((await cli(h.home, ["apply"])).code, 0);
    const [only] = await backups(h);
    const undone = await cli(h.home, ["restore", ...how, ...(how[0] === "--backup" ? [only] : [])]);
    assert.equal(undone.code, 0, undone.stderr);
    assert.match(undone.stdout, /nothing of the kit is applied now/);
    await ownerChange(h);
    await reapplyAndRestore(h);
  }

  /* The owner undid the kit by hand; the restore that finds nothing to do
     still records itself. */
  const h = await setupHome(t);
  assert.equal((await cli(h.home, ["apply"])).code, 0);
  await fs.writeFile(h.settings, SETTINGS);
  await fs.writeFile(h.config, CONFIG);
  await fs.rm(h.claudeTheme);
  await fs.rm(h.codexTheme);
  const noop = await cli(h.home, ["restore"]);
  assert.equal(noop.code, 0, noop.stderr);
  assert.match(noop.stdout, /no changes\nnothing of the kit is applied now/);
  assert.equal((await backups(h)).length, 2);
  await ownerChange(h);
  await reapplyAndRestore(h);
});

test("a restore that leaves the kit applied is not a baseline", async (t) => {
  const clone = await releaseClone(t);
  const h = await setupHome(t);
  const at = { sourceRoot: clone.dir };
  assert.equal((await cli(h.home, ["apply"], {}, at)).code, 0);
  assert.equal((await cli(h.home, ["update", "--version", "v1.2.1"], {}, at)).code, 0);
  const latest = await cli(h.home, ["restore", "--latest"], {}, at);
  assert.equal(latest.code, 0, latest.stderr);
  assert.doesNotMatch(latest.stdout, /nothing of the kit is applied now/);
  assert.equal(await codexVersion(h), `${PIN.ref.slice(1)} ${PIN.ref}`, "the update alone is undone");
  const all = await cli(h.home, ["restore"], {}, at);
  assert.equal(all.code, 0, all.stderr);
  assert.match(all.stdout, /undo every change since the first apply/);
  await assertPreKit(h);
});

test("a value changed by hand between two applies is reported, and restore says what it sets", async (t) => {
  const h = await setupHome(t);
  assert.equal((await cli(h.home, ["apply"])).code, 0);
  await fs.writeFile(h.settings, SETTINGS.replace('"theme": "custom:j3w1"', '"theme": "light"').replace('"theme": "dark-ansi"', '"theme": "light"'));
  assert.equal((await cli(h.home, ["apply"])).code, 0);
  const [first, second] = await backups(h);
  const dry = await cli(h.home, ["restore", "--dry-run"]);
  assert.equal(dry.code, 0, dry.stderr);
  const warning = new RegExp(`WARN .*settings\\.json theme was "light" when ${second} ran, not the "custom:j3w1" ${first} left: it changed between them, not by the kit; restore sets the value from before ${first}, "dark-ansi"`);
  assert.match(dry.stdout, warning);
  assert.doesNotMatch(dry.stdout, /config\.toml .*WARN|WARN .*config\.toml/, "only the changed key is reported");
  const restored = await cli(h.home, ["restore"]);
  assert.equal(restored.code, 0, restored.stderr);
  assert.match(restored.stdout, warning);
  await assertPreKit(h);
});

test("a write just before the rename is kept: the file is compared once more", async (t) => {
  const { h, paths, opts } = await inProcess(t);
  const sonnet = SETTINGS.replace('"model": "opus"', '"model": "sonnet"');
  let fired = 0;
  const late = async (file) => {
    if (file === h.settings && !fired) {
      fired += 1;
      await fs.writeFile(h.settings, sonnet);
    }
  };
  const lines = [];
  assert.equal(await apply(opts({ beforeCommit: late }), paths, (l) => lines.push(l)), 0);
  assert.equal(fired, 1, "the hook ran between the temporary file and the rename");
  assert.match(lines.join("\n"), /settings\.json changed since the plan .*planning it again/);
  assert.equal(await fs.readFile(h.settings, "utf8"), sonnet.replace('"theme": "dark-ansi"', '"theme": "custom:j3w1"'));
  assert.deepEqual((await fs.readdir(path.dirname(h.settings))).filter((n) => n.endsWith(".tmp")), [], "no temporary file is left");

  const kits = CONFIG.replace('"ansi"', '"j3w1"');
  let n = 0;
  const always = async (file) => {
    if (file === h.config) await fs.writeFile(h.config, `${kits}# edit ${(n += 1)}\n`);
  };
  await assert.rejects(restore(opts({ beforeCommit: always }), paths, quiet), /config\.toml: another program changed it again/);
  assert.equal(await fs.readFile(h.config, "utf8"), `${kits}# edit 2\n`, "the other program's write is never replaced");
});

test("a 64-bit integer at the edge of the range is valid TOML", async (t) => {
  const config = `limit = 9223372036854775807\nlow = -9223372036854775808\n${CONFIG}`;
  const h = await setupHome(t, { config });
  const applied = await cli(h.home, ["apply", "--codex"]);
  assert.equal(applied.code, 0, applied.stderr);
  assert.equal(await fs.readFile(h.config, "utf8"), config.replace('theme = "ansi" #', 'theme = "j3w1" #'));
  assert.equal((await cli(h.home, ["test", "--codex", "--no-specimen"])).code, 0);
  assert.equal((await cli(h.home, ["restore"])).code, 0);
  assert.equal(await fs.readFile(h.config, "utf8"), config);
});

test("a kit.json whose tokensDigest is not the export's is refused", async (t) => {
  /* A copy of the kit with one changed digest, run against this checkout. */
  const root = await scratchDir(t, "j3w1-terminal-kit-copy-");
  const copy = path.join(root, "tools/terminal-kit");
  await fs.mkdir(copy, { recursive: true });
  for (const part of ["devbox", "roles", "specimen.json", "kit.json"]) await fs.cp(path.join(KIT, part), path.join(copy, part), { recursive: true });
  const kit = await readKitJson("kit.json");
  const wrong = `sha256-${Buffer.alloc(32, 7).toString("base64")}`;
  await fs.writeFile(path.join(copy, "kit.json"), `${JSON.stringify({ ...kit, exports: { ...kit.exports, tokensDigest: wrong } }, null, 2)}\n`);
  const h = await setupHome(t);
  for (const args of [["apply", "--claude", "--dry-run"], ["apply", "--claude"], ["test", "--claude", "--no-specimen"]]) {
    let result;
    try {
      result = await run(process.execPath, [path.join(copy, "devbox/j3w1-terminal.mjs"), ...args, "--source-root", repoRoot, "--skip-version-probe"], { env: { PATH: process.env.PATH, HOME: h.home } });
      result.code = 0;
    } catch (error) {
      result = error;
    }
    assert.equal(result.code, 1, args.join(" "));
    assert.match(result.stderr, new RegExp(`at ${PIN.revision} is sha256-\\S+, not the ${wrong.replace(/[+/]/g, "\\$&")} kit\\.json records; refusing`));
  }
  assert.ok(!existsSync(h.state) && !existsSync(h.claudeTheme));
  assert.equal(await fs.readFile(h.settings, "utf8"), SETTINGS);
});

/* A scratch clone with one more release tag, v1.2.1: the pinned export with
   its version moved, committed on top of HEAD without a checkout. */
const releaseClone = async (t) => {
  const dir = await scratchDir(t, "j3w1-terminal-clone-");
  execFileSync("git", ["clone", "--quiet", "--shared", "--no-checkout", repoRoot, dir], { stdio: "ignore" });
  const env = { ...process.env, GIT_AUTHOR_NAME: "kit test", GIT_AUTHOR_EMAIL: "kit@test.invalid", GIT_COMMITTER_NAME: "kit test", GIT_COMMITTER_EMAIL: "kit@test.invalid", GIT_INDEX_FILE: path.join(dir, ".git", "kit-test-index") };
  const g = (args, input) => gitAt(dir, args, { env, input }).toString().trim();
  const kit = await readKitJson("kit.json");
  const base = gitAt(repoRoot, ["rev-parse", "HEAD"]).toString().trim();
  const tokens = JSON.parse(atPin(kit.exports.tokens).toString("utf8"));
  tokens.version = "1.2.1";
  const tokenBytes = `${JSON.stringify(tokens, null, 2)}\n`;
  const digests = JSON.parse(gitAt(repoRoot, ["show", `${base}:${kit.exports.digests}`]).toString("utf8"));
  digests.files[kit.exports.tokens] = sha256Base64(Buffer.from(tokenBytes));
  g(["read-tree", base]);
  for (const [file, text] of [[kit.exports.tokens, tokenBytes], [kit.exports.digests, `${JSON.stringify(digests, null, 2)}\n`]]) {
    g(["update-index", "--add", "--cacheinfo", `100644,${g(["hash-object", "-w", "--stdin"], text)},${file}`]);
  }
  const commit = g(["commit-tree", g(["write-tree"]), "-p", base, "-m", "test release 1.2.1"]);
  g(["tag", "v1.2.1", commit]);
  return { dir, commit };
};

const pinOf = async (h, i) => JSON.parse(await fs.readFile(current(h, `pin.${i}.json`), "utf8"));
const codexVersion = async (h) => /j3w1-theme (\S+) \((\S+) /.exec(await fs.readFile(h.codexTheme, "utf8")).slice(1, 3).join(" ");

test("pins are per integration: update moves only what it names, apply keeps each installed pin", async (t) => {
  const clone = await releaseClone(t);
  const h = await setupHome(t);
  const at = { sourceRoot: clone.dir };
  assert.equal((await cli(h.home, ["apply"], {}, at)).code, 0);
  for (const i of ["claude-code", "codex"]) assert.equal((await pinOf(h, i)).ref, PIN.ref);

  const moved = await cli(h.home, ["update", "--claude", "--version", "v1.2.1"], {}, at);
  assert.equal(moved.code, 0, moved.stderr);
  assert.match(moved.stdout, /72 of 72 overrides unchanged/);
  assert.match(moved.stdout, /recorded the pin v1\.2\.1 .* and the locks for claude-code\n/);
  const pin = await pinOf(h, "claude-code");
  assert.deepEqual([pin.ref, pin.revision, pin.version], ["v1.2.1", clone.commit, "1.2.1"]);
  assert.equal(JSON.parse(await fs.readFile(current(h, "theme.lock.claude-code.json"), "utf8")).revision, clone.commit);
  assert.deepEqual([(await pinOf(h, "codex")).ref, JSON.parse(await fs.readFile(current(h, "theme.lock.codex.json"), "utf8")).revision], [PIN.ref, PIN.revision], "update --claude never moves Codex");

  const codexTest = await cli(h.home, ["test", "--codex", "--no-specimen"], {}, at);
  assert.equal(codexTest.code, 0, codexTest.stdout);
  const codexApply = await cli(h.home, ["apply", "--codex"], {}, at);
  assert.equal(codexApply.code, 0, codexApply.stderr);
  assert.match(codexApply.stdout, /no changes/);
  assert.equal(await codexVersion(h), `${PIN.ref.slice(1)} ${PIN.ref}`, "apply --codex keeps Codex's own pin");

  const again = await cli(h.home, ["apply"], {}, at);
  assert.equal(again.code, 0, again.stderr);
  assert.match(again.stdout, /claude-code: using the installed pin v1\.2\.1 .*update --version v1\.2\.0 --claude to go back to it/);
  assert.doesNotMatch(again.stdout, /codex: using the installed pin/);
  assert.equal((await pinOf(h, "claude-code")).ref, "v1.2.1", "apply did not move the pin back");
  assert.equal(await codexVersion(h), `${PIN.ref.slice(1)} ${PIN.ref}`);
  assert.equal((await cli(h.home, ["test", "--no-specimen"], {}, at)).code, 0, "each integration is tested at its own pin");

  const both = await cli(h.home, ["update", "--version", "v1.2.1"], {}, at);
  assert.equal(both.code, 0, both.stderr);
  assert.equal(await codexVersion(h), "1.2.1 v1.2.1");
  assert.equal((await pinOf(h, "codex")).ref, "v1.2.1");

  const elsewhere = await cli(h.home, ["apply"]);
  assert.equal(elsewhere.code, 1, "a source without the installed pin is refused, not replaced by kit.json's pin");
  assert.match(elsewhere.stderr, /claude-code, codex: the installed pin v1\.2\.1 .*cannot be loaded.*does not fall back to kit\.json's v1\.2\.0.*update --version/);
});

test("with two pins, apply plans every group before writing any, and makes one backup per pin", async (t) => {
  const clone = await releaseClone(t);
  const h = await setupHome(t);
  const at = { sourceRoot: clone.dir };
  assert.equal((await cli(h.home, ["apply"], {}, at)).code, 0);
  assert.equal((await cli(h.home, ["update", "--claude", "--version", "v1.2.1"], {}, at)).code, 0);
  const light = SETTINGS.replace('"theme": "dark-ansi"', '"theme": "light"');
  await fs.writeFile(h.settings, light);
  const kits = await fs.readFile(h.config, "utf8");
  await fs.writeFile(h.config, `${kits}[[[\n`);
  const before = await backups(h);
  const refused = await cli(h.home, ["apply"], {}, at);
  assert.equal(refused.code, 1, refused.stdout);
  assert.match(refused.stderr, /config\.toml is not valid TOML .*nothing was written/);
  assert.doesNotMatch(refused.stdout, /wrote/);
  assert.equal(await fs.readFile(h.settings, "utf8"), light, "the Claude group was not written either");
  assert.deepEqual(await backups(h), before);

  const base16 = kits.replace('"j3w1"', '"base16"');
  await fs.writeFile(h.config, base16);
  assert.equal((await cli(h.home, ["apply"], {}, at)).code, 0);
  assert.equal((await backups(h)).length, before.length + 2, "one backup per pin");
  const latest = await cli(h.home, ["restore", "--latest"], {}, at);
  assert.equal(latest.code, 0, latest.stderr);
  assert.equal(await fs.readFile(h.config, "utf8"), base16, "--latest undoes the newest backup: the Codex half");
  assert.match(await fs.readFile(h.settings, "utf8"), /"theme": "custom:j3w1"/);
  const help = await cli(h.home, ["help"]);
  assert.match(help.stdout.replace(/\s+/g, " "), /An apply across two pins makes one backup per pin; --latest undoes the newest one\./);
});

test("an install from before per-integration pins reads each integration's lock", async (t) => {
  const clone = await releaseClone(t);
  const h = await setupHome(t);
  const at = { sourceRoot: clone.dir };
  assert.equal((await cli(h.home, ["apply"], {}, at)).code, 0);
  assert.equal((await cli(h.home, ["update", "--claude", "--version", "v1.2.1"], {}, at)).code, 0);
  /* The old layout: one pin.json, moved by the Claude update, and no pin files. */
  await fs.writeFile(current(h, "pin.json"), JSON.stringify({ ...(await pinOf(h, "claude-code")) }));
  for (const i of ["claude-code", "codex"]) await fs.rm(current(h, `pin.${i}.json`));
  const checked = await cli(h.home, ["test", "--no-specimen"], {}, at);
  assert.equal(checked.code, 0, checked.stdout);
  assert.match(checked.stdout, /claude-code: using the installed pin v1\.2\.1/);
  assert.equal((await cli(h.home, ["apply", "--codex"], {}, at)).code, 0);
  assert.equal(await codexVersion(h), `${PIN.ref.slice(1)} ${PIN.ref}`, "Codex stays at its lock's revision");
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
