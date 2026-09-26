/* The devbox installers: ports/claude-code/install.mjs and
   ports/codex/install.mjs, and the library they share,
   scripts/lib/host-install/. Every value an installer uses is read from git
   objects at one commit (this checkout's HEAD, an exact --revision, or a
   release tag), never from the working tree, so these tests read the same
   commit and a local change to the exports cannot break them. Commit before
   running them: the installers read ports/<app>/host.json at HEAD. */

import assert from "node:assert/strict";
import { execFile, execFileSync, spawn } from "node:child_process";
import { existsSync, promises as fs } from "node:fs";
import http from "node:http";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { parse as parseToml } from "smol-toml";
import { z } from "zod";
import { lockSchema } from "../schemas/lock.mjs";
import { repoRoot } from "../scripts/lib/fs.mjs";
import { apply, resolvePaths, restore } from "../scripts/lib/host-install/commands.mjs";
import { EditError, jsonRemove, jsonSet, tomlGet, tomlRestore, tomlSet } from "../scripts/lib/host-install/edit.mjs";
import { claudeTheme, codexTmTheme, ghosttyConfig, lock, roleTokenIds } from "../scripts/lib/host-install/generators.mjs";
import { parsePlist } from "../scripts/lib/host-install/plist.mjs";
import { DIGESTS, FETCH_TIMEOUT_MS, fetchText, headRevision, INSTALLER_ID, KitError, loadContext, sha256Base64, TOKENS } from "../scripts/lib/host-install/source.mjs";
import { renderSpecimen, resolveSpecimen } from "../scripts/lib/host-install/specimen.mjs";
import { scratchDir } from "./helpers/scratch.mjs";

const run = promisify(execFile);
const APPS = ["claude-code", "codex"];
const CLI = Object.fromEntries(APPS.map((app) => [app, path.join(repoRoot, "ports", app, "install.mjs")]));
const gitAt = (root, args, options = {}) => execFileSync("git", ["-C", root, ...args], { maxBuffer: 64 * 1024 * 1024, stdio: ["pipe", "pipe", "ignore"], ...options });
const HEAD = headRevision(repoRoot);
const atHead = (file) => gitAt(repoRoot, ["show", `${HEAD.revision}:${file}`]);
const HEAD_VERSION = JSON.parse(atHead(TOKENS).toString("utf8")).version;
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

/* The pending decisions the host maps disclose. */
const DISCLOSED = { "color.border.divider": ["D-008"], "color.border.overlay": ["D-008"] };

let context;
const ctx = async () => (context ??= await loadContext({ sourceRoot: repoRoot, offline: true, ...HEAD }));

const specimenTokenIds = (specimen) => {
  const ids = new Set();
  for (const section of specimen.sections) for (const line of section.lines ?? []) for (const s of line) for (const k of ["fgToken", "bgToken"]) if (s[k]) ids.add(s[k]);
  return [...ids];
};

test("HEAD's export matches its digests.json and every consumed token is eligible", async () => {
  const digests = JSON.parse(atHead(DIGESTS).toString("utf8"));
  const bytes = atHead(TOKENS);
  assert.equal(sha256Base64(bytes), digests.files[TOKENS], "the export matches digests.json from the same commit");
  const c = await ctx();
  assert.equal(c.source.via, "git");
  assert.equal(c.theme.revision, HEAD.revision);
  assert.equal(c.exports[TOKENS], digests.files[TOKENS], "the context is built from HEAD's export");
  assert.match(c.source.digestCheck, /digests\.json at the same commit/);
  const tokens = c.tokens;
  const reported = {};
  const all = new Set([...Object.values(c.roles).flatMap(roleTokenIds), ...specimenTokenIds(c.specimen)]);
  for (const id of all) {
    assert.ok(tokens[id], `${id} exists in the default profile`);
    assert.ok(!id.startsWith("color.primitive."), `${id} is not a primitive`);
    assert.ok(["use", "use-and-report"].includes(tokens[id].eligibility.action), `${id} is eligible`);
    if (tokens[id].eligibility.action === "use-and-report") reported[id] = tokens[id].eligibility.decisionIds;
  }
  assert.deepEqual(reported, DISCLOSED);
  for (const role of Object.values(c.roles["claude-code"].roles)) assert.ok(all.has(role.token));
});

test("warning only: this checkout's working tree differs from HEAD, whose values the installers use", async (t) => {
  /* Never fails: a change that is not committed yet is not what an
     installer installs. It says so. */
  for (const file of [TOKENS, "ports/orca/dist/config.ghostty", "ports/claude-code/host.json", "ports/codex/host.json"]) {
    const tree = await fs.readFile(path.join(repoRoot, file)).catch(() => null);
    if (!tree || sha256Base64(tree) !== sha256Base64(atHead(file))) t.diagnostic(`WARNING: ${file} in the working tree differs from HEAD (${HEAD.revision}); the installers use HEAD's until it is committed`);
  }
});

test("an export that does not match the installed pin's digest is refused", async () => {
  await assert.rejects(loadContext({ sourceRoot: repoRoot, offline: true, ...HEAD, pinnedDigest: "sha256-not-the-export" }), (e) => e instanceof KitError && /not the sha256-not-the-export the installed pin records; refusing/.test(e.message));
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
  assert.throws(() => c.resolver.token("color.not.a.role"), /not in the default profile/);
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
  assert.doesNotMatch(theme.comment, /[0-9a-f]{40}|\d{4}-\d{2}-\d{2}/, "no commit and no date, so an installed file equals the published one");
});

test("an installed theme file is the port's published file, byte for byte", async () => {
  const c = await ctx();
  assert.equal(`${JSON.stringify(claudeTheme(c), null, 2)}\n`, atHead("ports/claude-code/dist/j3w1.json").toString("utf8"));
  assert.equal(codexTmTheme(c), atHead("ports/codex/dist/j3w1.tmTheme").toString("utf8"));
});

test("ghosttyConfig matches the Orca port and only font-size follows the host", async () => {
  const c = await ctx();
  const port = atHead("ports/orca/dist/config.ghostty").toString("utf8").split("\n").filter((l) => l.trim() && !l.startsWith("#"));
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
    assert.equal(value.revision, HEAD.revision);
    assert.deepEqual(Object.keys(value.exports), [TOKENS]);
    assert.deepEqual(value.deviations, c.roles[integration].deviations);
  }
});

test("no hex colour literal lives in the three app folders or the installer library, outside generated dist/", async () => {
  const offenders = [];
  const walk = async (dir) => {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== "dist") await walk(full);
      } else {
        const text = await fs.readFile(full, "utf8");
        for (const m of text.matchAll(/#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9A-Za-z_])/g)) offenders.push(`${path.relative(repoRoot, full)}: ${m[0]}`);
      }
    }
  };
  for (const dir of ["ports/orca", "ports/claude-code", "ports/codex", "scripts/lib/host-install"]) await walk(path.join(repoRoot, dir));
  assert.deepEqual(offenders, []);
});

test("the specimen renders every section from HEAD's values", async () => {
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

test("the generated specimen names slots and tokens only: every Claude role and Codex scope resolves through its host map", async () => {
  const c = await ctx();
  const source = JSON.parse(atHead("ports/orca/src/specimen.json").toString("utf8"));
  const resolved = resolveSpecimen(source, { claude: c.roles["claude-code"], codex: c.roles.codex });
  assert.deepEqual(resolved, c.specimen, "ports/orca/install/specimen.json is resolveSpecimen of its source");
  const keys = new Set(c.specimen.sections.flatMap((s) => (s.lines ?? []).flat().flatMap(Object.keys)));
  for (const key of ["fgRole", "bgRole", "fgScope", "bgScope"]) assert.ok(!keys.has(key), `${key} is resolved`);
  const claude = source.sections.find((s) => s.id === "claude").lines[0][0];
  assert.equal(resolved.sections.find((s) => s.id === "claude").lines[0][0].bgToken, c.roles["claude-code"].roles[claude.bgRole].token);
  const codex = source.sections.find((s) => s.id === "code-truecolor").lines[0][4];
  assert.equal(resolved.sections.find((s) => s.id === "code-truecolor").lines[0][4].fgToken, c.roles.codex.scopes.find((s) => s.name === codex.fgScope).foreground);
  assert.throws(() => resolveSpecimen({ sections: [{ lines: [[{ text: "x", fgRole: "notARole" }]] }] }, { claude: c.roles["claude-code"], codex: c.roles.codex }), /not a role/);
  assert.throws(() => resolveSpecimen({ sections: [{ lines: [[{ text: "x", bgScope: "String" }]] }] }, { claude: c.roles["claude-code"], codex: c.roles.codex }), /does not set/);
  assert.throws(() => renderSpecimen({ ...c, specimen: { sections: [{ title: "x", lines: [[{ text: "x", fgRole: "text" }]] }] } }), /run npm run generate/);
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

/* ---- the installers in a temporary HOME -------------------------------- */

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

/* One installer, always with an explicit environment: HOME is the scratch
   directory and nothing else from this session (CLAUDE_CONFIG_DIR, XDG_*)
   reaches it. */
const cli = async (home, app, args, extra = {}, { probe = false, sourceRoot = repoRoot } = {}) => {
  const env = { PATH: process.env.PATH, HOME: home, ...extra };
  const hostArgs = app === "codex" ? ["--orca-runtime-home", path.join(home, "orca-runtime")] : [];
  try {
    const { stdout, stderr } = await run(process.execPath, [CLI[app], ...args, "--source-root", sourceRoot, ...(probe ? [] : ["--skip-version-probe"]), ...hostArgs], { env, maxBuffer: 16 * 1024 * 1024 });
    return { code: 0, stdout, stderr };
  } catch (error) {
    return { code: error.code, stdout: error.stdout, stderr: error.stderr };
  }
};

/* Both installers, Claude Code first, as the guides run them. */
const both = async (home, args, extra, options) => {
  const results = [];
  for (const app of APPS) results.push(await cli(home, app, args, extra, options));
  return { code: results.find((r) => r.code)?.code ?? 0, stdout: results.map((r) => r.stdout).join(""), stderr: results.map((r) => r.stderr).join(""), results };
};

const setupHome = async (t, { settings = SETTINGS, config = CONFIG } = {}) => {
  const home = await scratchDir(t, "j3w1-host-install-");
  await fs.mkdir(path.join(home, ".claude"), { recursive: true });
  await fs.mkdir(path.join(home, ".codex"), { recursive: true });
  if (settings !== null) await fs.writeFile(path.join(home, ".claude/settings.json"), settings);
  if (config !== null) await fs.writeFile(path.join(home, ".codex/config.toml"), config);
  return {
    home,
    state: path.join(home, ".local/state/j3w1-theme"),
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

  const dry = await both(h.home, ["apply", "--dry-run"]);
  assert.equal(dry.code, 0, dry.stderr);
  for (const r of dry.results) assert.match(r.stdout, /dry run: nothing written/);
  assert.ok(!existsSync(h.state) && !existsSync(h.claudeTheme) && !existsSync(h.codexTheme));
  assert.equal(await fs.readFile(h.settings, "utf8"), SETTINGS);
  assert.equal(await fs.readFile(h.config, "utf8"), CONFIG);

  for (const app of APPS) assert.equal((await cli(h.home, app, ["test", "--no-specimen"])).code, 1, `${app}: test fails before apply`);

  const applied = await both(h.home, ["apply"]);
  assert.equal(applied.code, 0, applied.stderr);
  assert.match(applied.stdout, /restart: Claude Code: .*themes was created now/);
  assert.match(applied.stdout, /restart: Codex: new sessions only/);
  const c = await ctx();
  assert.equal(await fs.readFile(h.claudeTheme, "utf8"), `${JSON.stringify(claudeTheme(c), null, 2)}\n`);
  assert.equal(await fs.readFile(h.codexTheme, "utf8"), codexTmTheme(c));
  assert.equal(await fs.readFile(h.settings, "utf8"), SETTINGS.replace('"theme": "dark-ansi"', '"theme": "custom:j3w1"'));
  assert.equal(await fs.readFile(h.config, "utf8"), CONFIG.replace('theme = "ansi" #', 'theme = "j3w1" #'));
  assert.equal((await backups(h)).length, 2, "one backup per installer");

  const [claudeBackup, codexBackup] = await backups(h);
  const manifest = JSON.parse(await fs.readFile(path.join(h.state, "backups", claudeBackup, "manifest.json"), "utf8"));
  assert.equal(manifest.kit, INSTALLER_ID);
  assert.equal(manifest.theme.revision, HEAD.revision);
  assert.deepEqual(manifest.integrations, ["claude-code"]);
  assert.deepEqual(manifest.files.map((f) => [path.basename(f.path), f.existedBefore]), [["j3w1.json", false]]);
  assert.deepEqual(manifest.settings.map((s) => [s.key, s.before, s.after]), [["theme", "dark-ansi", "custom:j3w1"]]);
  assert.ok(!JSON.stringify(manifest).includes("statusLine"), "the manifest holds no unrelated configuration");
  const codexManifest = JSON.parse(await fs.readFile(path.join(h.state, "backups", codexBackup, "manifest.json"), "utf8"));
  assert.deepEqual(codexManifest.files.map((f) => [path.basename(f.path), f.existedBefore]), [["j3w1.tmTheme", false]]);
  assert.deepEqual(codexManifest.settings.map((s) => [s.key, s.before, s.after]), [["tui.theme", "ansi", "j3w1"]]);
  for (const i of APPS) lockSchema(z).parse(JSON.parse(await fs.readFile(path.join(h.state, "current", `theme.lock.${i}.json`), "utf8")));

  for (const app of APPS) {
    const checked = await cli(h.home, app, ["test", "--no-specimen"]);
    assert.equal(checked.code, 0, checked.stderr);
    assert.match(checked.stdout, /disclose|deviation/);
    assert.match(checked.stdout, /\nPASS\n$/);
    if (app === "codex") assert.match(checked.stdout, /SKIP Orca runtime home/);
  }

  const again = await both(h.home, ["apply"]);
  assert.equal(again.code, 0, again.stderr);
  for (const r of again.results) assert.match(r.stdout, /no changes/);
  assert.equal((await backups(h)).length, 2, "no new backup when nothing changed");

  const dryRestore = await both(h.home, ["restore", "--dry-run"]);
  assert.equal(dryRestore.code, 0, dryRestore.stderr);
  assert.ok(existsSync(h.claudeTheme) && existsSync(h.codexTheme));

  const restored = await both(h.home, ["restore"]);
  assert.equal(restored.code, 0, restored.stderr);
  assert.equal(await fs.readFile(h.settings, "utf8"), SETTINGS);
  assert.equal(await fs.readFile(h.config, "utf8"), CONFIG);
  assert.ok(!existsSync(h.claudeTheme) && !existsSync(h.codexTheme));
  assert.ok(!existsSync(path.dirname(h.claudeTheme)) && !existsSync(path.dirname(h.codexTheme)), "directories the installer created are removed");
  assert.ok(!existsSync(path.join(h.state, "current", "pin.json")));
  assert.equal((await backups(h)).length, 4, "each restore backs up the state it replaces");

  const redo = await cli(h.home, "claude-code", ["restore", "--latest"]);
  assert.equal(redo.code, 0, redo.stderr);
  assert.equal(await fs.readFile(h.claudeTheme, "utf8"), `${JSON.stringify(claudeTheme(c), null, 2)}\n`);
  assert.equal((await cli(h.home, "claude-code", ["test", "--no-specimen"])).code, 0, "restoring the pre-restore backup reinstates the theme");
  assert.ok(!existsSync(h.codexTheme), "Claude Code's --latest never touches Codex");
});

test("apply adds absent keys and tables and restore removes exactly them", async (t) => {
  const settings = '{\n  "model": "opus",\n  "nested": {"theme": "not the top-level key"}\n}\n';
  const config = 'model = "gpt-6"\n\n[projects."/x"]\ntrust_level = "trusted"';
  const h = await setupHome(t, { settings, config });
  assert.equal((await both(h.home, ["apply"])).code, 0);
  assert.equal(await fs.readFile(h.settings, "utf8"), '{\n  "model": "opus",\n  "nested": {"theme": "not the top-level key"},\n  "theme": "custom:j3w1"\n}\n');
  assert.equal(await fs.readFile(h.config, "utf8"), `${config}\n\n[tui]\ntheme = "j3w1"\n`);
  assert.equal((await both(h.home, ["test", "--no-specimen"])).code, 0);
  assert.equal((await both(h.home, ["restore"])).code, 0);
  assert.equal(await fs.readFile(h.settings, "utf8"), settings);
  assert.equal(await fs.readFile(h.config, "utf8"), config);
});

const current = (h, name) => path.join(h.state, "current", name);

test("each installer restores its own host: a default restore undoes its half, one backup undoes that backup", async (t) => {
  const installBoth = async () => {
    const h = await setupHome(t, { settings: null, config: null });
    const codexOnly = await cli(h.home, "codex", ["apply"]);
    assert.equal(codexOnly.code, 0, codexOnly.stderr);
    assert.ok(!existsSync(h.claudeTheme) && !existsSync(h.settings));
    assert.equal(await fs.readFile(h.config, "utf8"), '[tui]\ntheme = "j3w1"\n');
    assert.equal((await cli(h.home, "claude-code", ["apply"])).code, 0);
    assert.equal(JSON.parse(await fs.readFile(h.settings, "utf8")).theme, "custom:j3w1");
    assert.equal((await backups(h)).length, 2);
    return h;
  };

  const h = await installBoth();
  const codexRestored = await cli(h.home, "codex", ["restore"]);
  assert.equal(codexRestored.code, 0, codexRestored.stderr);
  assert.ok(![h.config, h.codexTheme].some(existsSync), "the Codex half is gone");
  assert.ok(existsSync(h.settings) && existsSync(h.claudeTheme), "the Claude half stays");
  assert.equal((await cli(h.home, "claude-code", ["test", "--no-specimen"])).code, 0);
  const claudeRestored = await cli(h.home, "claude-code", ["restore"]);
  assert.equal(claudeRestored.code, 0, claudeRestored.stderr);
  assert.ok(![h.config, h.codexTheme, h.settings, h.claudeTheme].some(existsSync), "both halves are gone");
  for (const n of STATE_FILES) assert.ok(!existsSync(current(h, n)), `${n} is gone: nothing is installed`);
  for (const app of APPS) assert.match((await cli(h.home, app, ["restore"])).stdout, /nothing was applied since the restore/);

  const one = await installBoth();
  const [first] = await backups(one);
  assert.equal((await cli(one.home, "codex", ["restore", "--backup", first])).code, 0);
  assert.ok(!existsSync(one.config) && !existsSync(one.codexTheme), "the Codex half is undone");
  assert.ok(existsSync(one.settings) && existsSync(one.claudeTheme), "the Claude half stays");
  assert.ok(!existsSync(current(one, "theme.lock.codex.json")));
  for (const n of ["theme.lock.claude-code.json", "pin.claude-code.json", "manifest.json"]) assert.ok(existsSync(current(one, n)), `${n} still describes the Claude half`);
  assert.ok(!existsSync(current(one, "pin.codex.json")));
  const refused = await cli(one.home, "claude-code", ["restore", "--backup", first]);
  assert.equal(refused.code, 1, "Claude Code's installer refuses a backup that changed only Codex");
  assert.match(refused.stderr, /changed nothing of claude-code; the other installer restores it/);
  assert.equal((await cli(one.home, "claude-code", ["test", "--no-specimen"])).code, 0);
  assert.equal((await cli(one.home, "claude-code", ["restore"])).code, 0, "the default restore undoes the rest");
  assert.ok(![one.config, one.codexTheme, one.settings, one.claudeTheme].some(existsSync));
  for (const n of STATE_FILES) assert.ok(!existsSync(current(one, n)), n);
});

test("a backup the terminal kit made for both hosts at once is restored by each installer, half by half", async (t) => {
  /* The kit's combined apply: one backup whose entries name both hosts. */
  const { h, paths, opts } = await inProcess(t);
  assert.equal(await apply(opts(), paths, quiet), 0);
  const [combined] = await backups(h);
  assert.deepEqual((await manifestOf(h, combined)).integrations, APPS);
  const codex = await cli(h.home, "codex", ["restore"]);
  assert.equal(codex.code, 0, codex.stderr);
  assert.equal(await fs.readFile(h.config, "utf8"), CONFIG);
  assert.ok(!existsSync(h.codexTheme));
  assert.equal(JSON.parse(await fs.readFile(h.settings, "utf8")).theme, "custom:j3w1", "the Claude half of the same backup stays");
  assert.ok(existsSync(h.claudeTheme));
  const claude = await cli(h.home, "claude-code", ["restore"]);
  assert.equal(claude.code, 0, claude.stderr);
  await assertPreKit(h);
});

test("restore, an owner change, apply, restore: the owner's value comes back", async (t) => {
  const h = await setupHome(t);
  assert.equal((await both(h.home, ["apply"])).code, 0);
  assert.equal((await both(h.home, ["restore"])).code, 0);
  const owners = SETTINGS.replace('"theme": "dark-ansi"', '"theme": "light"');
  await fs.writeFile(h.settings, owners);
  await fs.writeFile(h.config, CONFIG.replace('"ansi"', '"base16"'));
  assert.equal((await both(h.home, ["apply"])).code, 0);
  const again = await both(h.home, ["restore"]);
  assert.equal(again.code, 0, again.stderr);
  assert.equal(await fs.readFile(h.settings, "utf8"), owners, "not the value from before the first apply");
  assert.equal(await fs.readFile(h.config, "utf8"), CONFIG.replace('"ansi"', '"base16"'));
});

test("restore warns about a managed file edited after apply and keeps the edited copy", async (t) => {
  const h = await setupHome(t);
  assert.equal((await cli(h.home, "claude-code", ["apply"])).code, 0);
  const edited = `${await fs.readFile(h.claudeTheme, "utf8")}\n`;
  await fs.writeFile(h.claudeTheme, edited);
  await fs.writeFile(h.settings, SETTINGS.replace('"theme": "dark-ansi"', '"theme": "custom:mine"'));
  const dry = await cli(h.home, "claude-code", ["restore", "--dry-run"]);
  assert.equal(dry.code, 0, dry.stderr);
  assert.match(dry.stdout, /WARN .*j3w1\.json changed after the kit wrote it/);
  assert.match(dry.stdout, /WARN .*settings\.json theme is "custom:mine" now, not the kit's "custom:j3w1"/);
  const restored = await cli(h.home, "claude-code", ["restore"]);
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
  const applied = await cli(h.home, "codex", ["apply"]);
  assert.equal(applied.code, 0, applied.stderr);
  const text = await fs.readFile(h.config, "utf8");
  assert.equal(text, 'model = "gpt-6"\r\n\r\n[tui] # interface\r\ntheme = "j3w1"\r\nnotifications = true\r\n');
  assert.deepEqual(parseToml(text), { model: "gpt-6", tui: { theme: "j3w1", notifications: true } });
  assert.equal((await cli(h.home, "codex", ["test", "--no-specimen"])).code, 0);
  assert.equal((await cli(h.home, "codex", ["restore"])).code, 0);
  assert.equal(await fs.readFile(h.config, "utf8"), config);
});

test("test FAILs and restore refuses when config.toml does not parse", async (t) => {
  const h = await setupHome(t);
  assert.equal((await both(h.home, ["apply"])).code, 0);
  const broken = `${await fs.readFile(h.config, "utf8")}\n[tui]\nextra = 1\n`;
  await fs.writeFile(h.config, broken);
  const checked = await cli(h.home, "codex", ["test", "--no-specimen"]);
  assert.equal(checked.code, 1, checked.stdout);
  assert.match(checked.stdout, /FAIL .*config\.toml.*(is not valid TOML|repeats the \[tui\] header)/);
  const settingsBefore = await fs.readFile(h.settings, "utf8");
  const restored = await cli(h.home, "codex", ["restore"]);
  assert.equal(restored.code, 1, restored.stdout);
  assert.match(restored.stderr, /config\.toml.*nothing was written/);
  assert.equal(await fs.readFile(h.config, "utf8"), broken, "no duplicate table is written or left behind by restore");
  assert.equal(await fs.readFile(h.settings, "utf8"), settingsBefore, "restore planned everything before writing anything");
  assert.equal((await backups(h)).length, 2);
});

test("a guard failure writes nothing and makes no backup", async (t) => {
  for (const config of ['tui.theme = "ansi"\n', '["tui"]\ntheme = "ansi"\n', 'tui = { theme = "ansi" }\n', '[tui]\ntheme = "\\q"\n']) {
    const h = await setupHome(t, { config });
    for (const args of [["apply", "--dry-run"], ["apply"]]) {
      const result = await cli(h.home, "codex", args);
      assert.equal(result.code, 1, `${config} ${args}`);
      assert.match(result.stderr, /^j3w1-theme: .*config\.toml.*nothing was written\n$/s, result.stderr);
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
  const applied = await both(h.home, ["apply"]);
  assert.equal(applied.code, 0, applied.stderr);
  assert.equal(await fs.readFile(h.settings, "utf8"), settings.replace('"theme": "dark-ansi"', '"theme": "custom:j3w1"'));
  assert.equal(await fs.readFile(h.config, "utf8"), config.replace('theme = "ansi" #', 'theme = "j3w1" #'));
  assert.equal((await both(h.home, ["restore"])).code, 0);
  assert.equal(await fs.readFile(h.settings, "utf8"), settings);
  assert.equal(await fs.readFile(h.config, "utf8"), config);
});

test("a host that writes its settings when probed loses nothing, and only the named host is probed", async (t) => {
  const h = await setupHome(t);
  const bin = path.join(h.home, "bin");
  await fs.mkdir(bin);
  const hostWrites = '{"model":"opus","permissions":{"allow":["Read"]},"theme":"dark-ansi"}';
  await fs.writeFile(path.join(bin, "claude"), `#!/bin/sh\nprintf '%s\\n' '${hostWrites}' > "$HOME/.claude/settings.json"\necho "2.1.283 (Claude Code)"\n`, { mode: 0o755 });
  await fs.writeFile(path.join(bin, "codex"), "#!/bin/sh\ntouch \"$HOME/codex-was-probed\"\necho codex-cli 0.0.0\n", { mode: 0o755 });
  const applied = await cli(h.home, "claude-code", ["apply"], { PATH: `${bin}${path.delimiter}${process.env.PATH}` }, { probe: true });
  assert.equal(applied.code, 0, applied.stderr);
  assert.deepEqual(JSON.parse(await fs.readFile(h.settings, "utf8")), { model: "opus", permissions: { allow: ["Read"] }, theme: "custom:j3w1" });
  assert.deepEqual(JSON.parse(await fs.readFile(current(h, "manifest.json"), "utf8")).hosts, { "claude-code": "2.1.283" }, "the probe ran for Claude Code only");
  assert.ok(!existsSync(path.join(h.home, "codex-was-probed")), "the Claude Code installer never runs codex");
  assert.equal((await cli(h.home, "claude-code", ["restore"])).code, 0);
  assert.equal(await fs.readFile(h.settings, "utf8"), `${hostWrites}\n`);
});

/* The commands in this process, against a scratch HOME, with explicit
   paths. They take both hosts in one run, as the terminal kit's combined
   commands did; the library still supports that, and a backup of both is
   what the kit left on the devbox. */
const quiet = () => {};
const inProcess = async (t, files) => {
  const h = await setupHome(t, files);
  const paths = resolvePaths({ stateDir: h.state, claudeConfigDir: path.join(h.home, ".claude"), codexHome: path.join(h.home, ".codex"), orcaRuntimeHome: path.join(h.home, "orca-runtime") }, { HOME: h.home });
  const opts = (hooks, more = {}) => ({ integrations: [...APPS], sourceRoot: repoRoot, skipVersionProbe: true, hooks, ...more });
  return { h, paths, opts };
};

const manifestOf = async (h, name) => JSON.parse(await fs.readFile(path.join(h.state, "backups", name, "manifest.json"), "utf8"));

test("a file changed between plan and write is planned again once, then the run stops", async (t) => {
  const setup = () => inProcess(t);

  /* Once: the other program's write is kept and the installer's key still lands. */
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
  assert.equal(await fs.readFile(b.h.config, "utf8"), `${CONFIG}# edit 2\n`, "the installer never wrote config.toml");
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

/* The state after a finished restore of everything: pre-install files, no
   theme files and no state. */
const assertPreKit = async (h, { settings = SETTINGS, config = CONFIG } = {}) => {
  assert.equal(await fs.readFile(h.settings, "utf8"), settings);
  assert.equal(await fs.readFile(h.config, "utf8"), config);
  assert.ok(!existsSync(h.claudeTheme) && !existsSync(h.codexTheme), "no theme file is left");
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
  assert.deepEqual([done.complete, done.baseline, done.baselineFor], [true, true, APPS]);
  const third = [];
  assert.equal(await restore(opts(), paths, (l) => third.push(l)), 0);
  assert.match(third.join("\n"), /nothing was applied since the restore/);
});

test("a restore stopped by a write error is not a baseline; running it again finishes the job", { skip: process.getuid?.() === 0 && "root ignores the permission" }, async (t) => {
  const { h, paths, opts } = await inProcess(t);
  assert.equal(await apply(opts(), paths, quiet), 0);
  const codexHome = path.dirname(h.config);
  const lockDir = async (file) => {
    if (file === h.config) await fs.chmod(codexHome, 0o500);
  };
  try {
    await assert.rejects(restore(opts({ beforeWrite: lockDir }), paths, quiet), (e) => e instanceof KitError && /config\.toml: writing it failed \(EACCES.*stopped with nothing further written\. Already written: .*settings\.json.*run restore again; it finishes the job\./s.test(e.message));
  } finally {
    await fs.chmod(codexHome, 0o700);
  }
  assert.equal(await fs.readFile(h.settings, "utf8"), SETTINGS, "settings.json was restored before the failure");
  assert.match(await fs.readFile(h.config, "utf8"), /theme = "j3w1"/, "config.toml still holds the installer's value");
  const record = await manifestOf(h, (await backups(h)).at(-1));
  assert.equal(record.complete, false);
  assert.deepEqual(record.settings.map((e) => e.key), ["theme"], "the record lists only what was written");
  assert.equal(await restore(opts(), paths, quiet), 0);
  await assertPreKit(h);
});

test("a closed output pipe never interrupts restore", async (t) => {
  const h = await setupHome(t);
  assert.equal((await both(h.home, ["apply"])).code, 0);
  /* Both ends the reader holds are closed before the installer prints its
     first line, as with `restore | head -1` once head has exited. */
  const child = spawn(process.execPath, [CLI["claude-code"], "restore", "--source-root", repoRoot, "--skip-version-probe"], { env: { PATH: process.env.PATH, HOME: h.home }, stdio: ["ignore", "pipe", "pipe"] });
  child.stdout.destroy();
  child.stderr.destroy();
  const code = await new Promise((resolve) => child.on("close", resolve));
  assert.equal(code, 0, "restore finished although nobody read its output");
  assert.equal(await fs.readFile(h.settings, "utf8"), SETTINGS);
  assert.ok(!existsSync(h.claudeTheme));
  assert.equal((await manifestOf(h, (await backups(h)).at(-1))).complete, true);
  assert.equal((await cli(h.home, "codex", ["restore"])).code, 0);
  await assertPreKit(h);
  const again = await cli(h.home, "claude-code", ["restore"]);
  assert.equal(again.code, 0, again.stderr);
  assert.match(again.stdout, /nothing was applied since the restore/);
});

test("output that cannot be written for any reason but a closed reader fails the command", { skip: !existsSync("/dev/full") && "no /dev/full" }, async (t) => {
  const h = await setupHome(t);
  const full = await fs.open("/dev/full", "w");
  t.after(() => full.close());
  const child = spawn(process.execPath, [CLI["claude-code"], "specimen", "--source-root", repoRoot, "--skip-version-probe"], { env: { PATH: process.env.PATH, HOME: h.home }, stdio: ["ignore", full.fd, "pipe"] });
  let stderr = "";
  child.stderr.on("data", (d) => (stderr += d));
  const code = await new Promise((resolve) => child.on("close", resolve));
  assert.equal(code, 1, "a full disk is not a closed pipe");
  assert.match(stderr, /the output could not be written \(ENOSPC\)/);
});

test("a write that fails after its rename stays in the manifest, so restore undoes it", async (t) => {
  const { h, paths, opts } = await inProcess(t);
  /* The rename lands other bytes than the installer's (a host rewrote the
     file in between), so it does not read back as written. */
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

test("every restore that leaves nothing of a host applied is a baseline for it", async (t) => {
  const light = SETTINGS.replace('"theme": "dark-ansi"', '"theme": "light"');
  const base16 = CONFIG.replace('"ansi"', '"base16"');
  const ownerChange = async (h) => {
    await fs.writeFile(h.settings, light);
    await fs.writeFile(h.config, base16);
  };
  const reapplyAndRestore = async (h) => {
    assert.equal((await both(h.home, ["apply"])).code, 0);
    const again = await both(h.home, ["restore"]);
    assert.equal(again.code, 0, again.stderr);
    assert.doesNotMatch(again.stdout, /WARN/);
    await assertPreKit(h, { settings: light, config: base16 });
  };

  for (const how of [["--latest"], ["--backup"]]) {
    const h = await setupHome(t);
    assert.equal((await both(h.home, ["apply"])).code, 0);
    const own = await backups(h);
    for (const [i, app] of APPS.entries()) {
      const undone = await cli(h.home, app, ["restore", ...how, ...(how[0] === "--backup" ? [own[i]] : [])]);
      assert.equal(undone.code, 0, undone.stderr);
      assert.match(undone.stdout, /nothing of the kit is applied now/);
    }
    await ownerChange(h);
    await reapplyAndRestore(h);
  }

  /* The owner undid the theme by hand; the restore that finds nothing to do
     still records itself. */
  const h = await setupHome(t);
  assert.equal((await both(h.home, ["apply"])).code, 0);
  await fs.writeFile(h.settings, SETTINGS);
  await fs.writeFile(h.config, CONFIG);
  await fs.rm(h.claudeTheme);
  await fs.rm(h.codexTheme);
  const noop = await both(h.home, ["restore"]);
  assert.equal(noop.code, 0, noop.stderr);
  for (const r of noop.results) assert.match(r.stdout, /no changes\nnothing of the kit is applied now/);
  assert.equal((await backups(h)).length, 4);
  await ownerChange(h);
  await reapplyAndRestore(h);
});

/* A scratch clone with one more release tag, v97.0.0: HEAD's export with its
   version moved, committed on top of HEAD without a checkout. Its host maps
   are HEAD's, so it is a release this installer can read. */
const releaseClone = async (t) => {
  const dir = await scratchDir(t, "j3w1-host-install-clone-");
  execFileSync("git", ["clone", "--quiet", "--shared", "--no-checkout", repoRoot, dir], { stdio: "ignore" });
  const env = { ...process.env, GIT_AUTHOR_NAME: "installer test", GIT_AUTHOR_EMAIL: "installer@test.invalid", GIT_COMMITTER_NAME: "installer test", GIT_COMMITTER_EMAIL: "installer@test.invalid", GIT_INDEX_FILE: path.join(dir, ".git", "installer-test-index") };
  const g = (args, input) => gitAt(dir, args, { env, input }).toString().trim();
  const tokens = JSON.parse(atHead(TOKENS).toString("utf8"));
  tokens.version = "97.0.0";
  const tokenBytes = `${JSON.stringify(tokens, null, 2)}\n`;
  const digests = JSON.parse(atHead(DIGESTS).toString("utf8"));
  digests.files[TOKENS] = sha256Base64(Buffer.from(tokenBytes));
  g(["read-tree", HEAD.revision]);
  for (const [file, text] of [[TOKENS, tokenBytes], [DIGESTS, `${JSON.stringify(digests, null, 2)}\n`]]) {
    g(["update-index", "--add", "--cacheinfo", `100644,${g(["hash-object", "-w", "--stdin"], text)},${file}`]);
  }
  const commit = g(["commit-tree", g(["write-tree"]), "-p", HEAD.revision, "-m", "test release 97.0.0"]);
  g(["tag", "v97.0.0", commit]);
  return { dir, commit };
};

const pinOf = async (h, i) => JSON.parse(await fs.readFile(current(h, `pin.${i}.json`), "utf8"));
const codexVersion = async (h) => /j3w1 theme (\S+), /.exec(await fs.readFile(h.codexTheme, "utf8"))[1];

test("a restore that leaves the installer's values applied is not a baseline", async (t) => {
  const clone = await releaseClone(t);
  const h = await setupHome(t);
  const at = { sourceRoot: clone.dir };
  assert.equal((await cli(h.home, "codex", ["apply"], {}, at)).code, 0);
  assert.equal((await cli(h.home, "codex", ["update", "--version", "v97.0.0"], {}, at)).code, 0);
  const latest = await cli(h.home, "codex", ["restore", "--latest"], {}, at);
  assert.equal(latest.code, 0, latest.stderr);
  assert.doesNotMatch(latest.stdout, /nothing of the kit is applied now/);
  assert.equal(await codexVersion(h), HEAD_VERSION, "the update alone is undone");
  const all = await cli(h.home, "codex", ["restore"], {}, at);
  assert.equal(all.code, 0, all.stderr);
  assert.match(all.stdout, /undo every change since the first apply/);
  assert.equal(await fs.readFile(h.config, "utf8"), CONFIG);
  assert.ok(!existsSync(h.codexTheme));
});

test("a value changed by hand between two applies is reported, and restore says what it sets", async (t) => {
  const h = await setupHome(t);
  assert.equal((await cli(h.home, "claude-code", ["apply"])).code, 0);
  await fs.writeFile(h.settings, SETTINGS.replace('"theme": "custom:j3w1"', '"theme": "light"').replace('"theme": "dark-ansi"', '"theme": "light"'));
  assert.equal((await cli(h.home, "claude-code", ["apply"])).code, 0);
  const [first, second] = await backups(h);
  const dry = await cli(h.home, "claude-code", ["restore", "--dry-run"]);
  assert.equal(dry.code, 0, dry.stderr);
  const warning = new RegExp(`WARN .*settings\\.json theme was "light" when ${second} ran, not the "custom:j3w1" ${first} left: it changed between them, not by the kit; restore sets the value from before ${first}, "dark-ansi"`);
  assert.match(dry.stdout, warning);
  assert.doesNotMatch(dry.stdout, /config\.toml .*WARN|WARN .*config\.toml/, "only the changed key is reported");
  const restored = await cli(h.home, "claude-code", ["restore"]);
  assert.equal(restored.code, 0, restored.stderr);
  assert.match(restored.stdout, warning);
  assert.equal(await fs.readFile(h.settings, "utf8"), SETTINGS);
  assert.ok(!existsSync(h.claudeTheme));
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
  const applied = await cli(h.home, "codex", ["apply"]);
  assert.equal(applied.code, 0, applied.stderr);
  assert.equal(await fs.readFile(h.config, "utf8"), config.replace('theme = "ansi" #', 'theme = "j3w1" #'));
  assert.equal((await cli(h.home, "codex", ["test", "--no-specimen"])).code, 0);
  assert.equal((await cli(h.home, "codex", ["restore"])).code, 0);
  assert.equal(await fs.readFile(h.config, "utf8"), config);
});

test("an installed pin whose digest is not the export's is refused by test and specimen", async (t) => {
  const h = await setupHome(t);
  assert.equal((await cli(h.home, "claude-code", ["apply"])).code, 0);
  const wrong = `sha256-${Buffer.alloc(32, 7).toString("base64")}`;
  await fs.writeFile(current(h, "pin.claude-code.json"), JSON.stringify({ ...(await pinOf(h, "claude-code")), tokensDigest: wrong }));
  for (const args of [["test", "--no-specimen"], ["specimen"]]) {
    const result = await cli(h.home, "claude-code", args);
    assert.equal(result.code, 1, args.join(" "));
    assert.match(result.stderr, new RegExp(`at ${HEAD.revision} is sha256-\\S+, not the ${wrong.replace(/[+/]/g, "\\$&")} the installed pin records; refusing`));
  }
});

test("update moves only its own host; apply installs the checkout's commit and moves the pin", async (t) => {
  const clone = await releaseClone(t);
  const h = await setupHome(t);
  const at = { sourceRoot: clone.dir };
  assert.equal((await both(h.home, ["apply"], {}, at)).code, 0);
  for (const i of APPS) assert.equal((await pinOf(h, i)).revision, HEAD.revision);

  const moved = await cli(h.home, "claude-code", ["update", "--version", "v97.0.0"], {}, at);
  assert.equal(moved.code, 0, moved.stderr);
  assert.match(moved.stdout, /update to v97\.0\.0 = [0-9a-f]{40} \(resolved through the local tag/);
  assert.match(moved.stdout, /72 of 72 overrides unchanged/);
  assert.match(moved.stdout, /recorded the pin v97\.0\.0 .* and the locks for claude-code\n/);
  const pin = await pinOf(h, "claude-code");
  assert.deepEqual([pin.ref, pin.revision, pin.version], ["v97.0.0", clone.commit, "97.0.0"]);
  assert.equal(JSON.parse(await fs.readFile(current(h, "theme.lock.claude-code.json"), "utf8")).revision, clone.commit);
  assert.deepEqual([(await pinOf(h, "codex")).revision, JSON.parse(await fs.readFile(current(h, "theme.lock.codex.json"), "utf8")).revision], [HEAD.revision, HEAD.revision], "the Claude Code update never moves Codex");

  const codexTest = await cli(h.home, "codex", ["test", "--no-specimen"], {}, at);
  assert.equal(codexTest.code, 0, codexTest.stdout);
  const codexApply = await cli(h.home, "codex", ["apply"], {}, at);
  assert.equal(codexApply.code, 0, codexApply.stderr);
  assert.match(codexApply.stdout, /no changes/);
  assert.equal(await codexVersion(h), HEAD_VERSION, "Codex stays at this checkout's commit");

  assert.equal((await both(h.home, ["test", "--no-specimen"], {}, at)).code, 0, "each host is tested at its own pin");
  const noted = await cli(h.home, "claude-code", ["test", "--no-specimen"], {}, at);
  assert.ok(noted.stdout.includes("claude-code: installed from v97.0.0 ("), noted.stdout);
  assert.ok(noted.stdout.includes("Run node ports/claude-code/install.mjs apply to move to it."), noted.stdout);

  const back = await cli(h.home, "claude-code", ["apply"], {}, at);
  assert.equal(back.code, 0, back.stderr);
  assert.ok(back.stdout.includes(`claude-code: moving from v97.0.0 (${clone.commit}) to`), back.stdout);
  assert.match(back.stdout, /recorded the pin .* and the locks for claude-code\n/, "same bytes, but the pin follows the commit");
  assert.equal((await pinOf(h, "claude-code")).revision, HEAD.revision);

  const both97 = await both(h.home, ["update", "--version", "v97.0.0"], {}, at);
  assert.equal(both97.code, 0, both97.stderr);
  assert.equal(await codexVersion(h), "97.0.0");
  assert.equal((await pinOf(h, "codex")).ref, "v97.0.0");

  const elsewhere = await cli(h.home, "codex", ["test", "--no-specimen"]);
  assert.equal(elsewhere.code, 1, "a source without the installed commit cannot check it");
  assert.match(elsewhere.stderr, /codex: the installed pin v97\.0\.0 .*cannot be loaded: .*does not contain .*Run node ports\/codex\/install\.mjs apply/);
});

test("apply --revision installs an exact commit; short, unknown and pre-installer commits are refused", async (t) => {
  const clone = await releaseClone(t);
  const h = await setupHome(t);
  const at = { sourceRoot: clone.dir };
  const exact = await cli(h.home, "codex", ["apply", "--revision", clone.commit], {}, at);
  assert.equal(exact.code, 0, exact.stderr);
  assert.match(exact.stdout, /j3w1-theme 97\.0\.0 v97\.0\.0 \(/, "the tag that names the commit is found");
  assert.equal(await codexVersion(h), "97.0.0");
  assert.equal((await pinOf(h, "codex")).revision, clone.commit);
  for (const [revision, why] of [[clone.commit.slice(0, 12), /full 40-character lowercase commit SHA/], [clone.commit.toUpperCase(), /full 40-character lowercase commit SHA/], ["0".repeat(40), /does not contain 0{40}/]]) {
    const refused = await cli(h.home, "codex", ["apply", "--revision", revision], {}, at);
    assert.equal(refused.code, 1, revision);
    assert.match(refused.stderr, why, revision);
  }
  const root = gitAt(repoRoot, ["rev-list", "--max-parents=0", "HEAD"]).toString().trim().split("\n")[0];
  const old = await cli(h.home, "codex", ["apply", "--revision", root]);
  assert.equal(old.code, 1);
  assert.match(old.stderr, /has no ports\/claude-code\/host\.json: it predates this installer \(v3\.0\.0 and later\)/);
  assert.equal(await codexVersion(h), "97.0.0", "a refused apply writes nothing");
  const onUpdate = await cli(h.home, "codex", ["update", "--version", "v97.0.0", "--revision", clone.commit], {}, at);
  assert.equal(onUpdate.code, 1);
  assert.match(onUpdate.stderr, /--revision is an apply option/);
});

test("update plans before it writes: a broken config.toml stops it with nothing written and no backup", async (t) => {
  const clone = await releaseClone(t);
  const h = await setupHome(t);
  const at = { sourceRoot: clone.dir };
  assert.equal((await both(h.home, ["apply"], {}, at)).code, 0);
  const light = SETTINGS.replace('"theme": "custom:j3w1"', '"theme": "light"');
  await fs.writeFile(h.settings, light);
  const kits = await fs.readFile(h.config, "utf8");
  await fs.writeFile(h.config, `${kits}[[[\n`);
  const before = await backups(h);
  const refused = await cli(h.home, "codex", ["update", "--version", "v97.0.0"], {}, at);
  assert.equal(refused.code, 1, refused.stdout);
  assert.match(refused.stderr, /config\.toml is not valid TOML .*nothing was written/);
  assert.doesNotMatch(refused.stdout, /wrote/);
  assert.equal(await fs.readFile(h.settings, "utf8"), light, "the other host is never touched");
  assert.deepEqual(await backups(h), before);
  assert.equal((await pinOf(h, "codex")).revision, HEAD.revision, "the pin did not move");
  const help = await cli(h.home, "codex", ["help"]);
  assert.match(help.stdout.replace(/\s+/g, " "), /--latest undoes the newest backup that changed Codex\. Restore never touches the other installer's host\./);
});

test("an install from before per-integration pins reads each integration's lock", async (t) => {
  const clone = await releaseClone(t);
  const h = await setupHome(t);
  const at = { sourceRoot: clone.dir };
  assert.equal((await both(h.home, ["apply"], {}, at)).code, 0);
  assert.equal((await cli(h.home, "claude-code", ["update", "--version", "v97.0.0"], {}, at)).code, 0);
  /* The old layout: one pin.json, moved by the Claude update, and no pin files. */
  await fs.writeFile(current(h, "pin.json"), JSON.stringify({ ...(await pinOf(h, "claude-code")) }));
  for (const i of APPS) await fs.rm(current(h, `pin.${i}.json`));
  const checked = await both(h.home, ["test", "--no-specimen"], {}, at);
  assert.equal(checked.code, 0, checked.stdout);
  assert.match(checked.stdout, /claude-code: installed from v97\.0\.0/);
  assert.equal((await cli(h.home, "codex", ["apply"], {}, at)).code, 0);
  assert.equal(await codexVersion(h), HEAD_VERSION, "Codex stays at its lock's revision");
});

test("the Orca runtime home is checked read-only through Orca's themes link", async (t) => {
  const h = await setupHome(t);
  const rt = path.join(h.home, "orca-runtime");
  await fs.mkdir(rt, { recursive: true });
  await fs.writeFile(path.join(rt, "config.toml"), CONFIG);
  assert.equal((await cli(h.home, "codex", ["apply"])).code, 0);
  const pending = await cli(h.home, "codex", ["test", "--no-specimen"]);
  assert.equal(pending.code, 0, pending.stderr);
  assert.match(pending.stdout, /WARN .*orca-runtime\/themes is not there yet/);
  assert.match(pending.stdout, /WARN Orca runtime config tui.theme = "ansi"/);
  assert.ok(!existsSync(path.join(rt, "themes")), "the installer never writes into the runtime home");
  await fs.symlink(path.join(h.home, ".codex/themes"), path.join(rt, "themes"));
  await fs.writeFile(path.join(rt, "config.toml"), CONFIG.replace('"ansi"', '"j3w1"'));
  const linked = await cli(h.home, "codex", ["test", "--no-specimen"]);
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
    result = await both(h.home, ["apply"], { J3W1_THEME_STATE_DIR: state });
  } finally {
    await fs.chmod(locked, 0o700);
  }
  assert.equal(result.code, 1, result.stderr);
  assert.match(result.stderr, /is not writable .*nothing was changed\. Pass --state-dir <dir> or set J3W1_THEME_STATE_DIR\./);
  assert.ok(!existsSync(state) && !existsSync(h.claudeTheme) && !existsSync(h.codexTheme));
  assert.equal(await fs.readFile(h.settings, "utf8"), SETTINGS);
  assert.equal(await fs.readFile(h.config, "utf8"), CONFIG);
});

test("the state directory: $XDG_STATE_HOME/j3w1-theme, J3W1_THEME_STATE_DIR, and the deprecated J3W1_TERMINAL_KIT_STATE_DIR", async (t) => {
  const xdg = await setupHome(t);
  const custom = path.join(xdg.home, "xdg-state");
  assert.equal((await cli(xdg.home, "claude-code", ["apply"], { XDG_STATE_HOME: custom })).code, 0);
  assert.ok(existsSync(path.join(custom, "j3w1-theme", "current", "manifest.json")) && !existsSync(xdg.state));

  const h = await setupHome(t);
  const state = path.join(h.home, "elsewhere");
  const old = await cli(h.home, "claude-code", ["apply"], { J3W1_TERMINAL_KIT_STATE_DIR: state });
  assert.equal(old.code, 0, old.stderr);
  assert.ok(existsSync(path.join(state, "current", "manifest.json")) && !existsSync(h.state));
  assert.match(old.stderr, /J3W1_TERMINAL_KIT_STATE_DIR is deprecated; set J3W1_THEME_STATE_DIR to the same folder instead/);
  const renamed = await cli(h.home, "claude-code", ["restore"], { J3W1_THEME_STATE_DIR: state, J3W1_TERMINAL_KIT_STATE_DIR: path.join(h.home, "not-this") });
  assert.equal(renamed.code, 0, renamed.stderr);
  assert.doesNotMatch(renamed.stderr, /deprecated/);
  assert.equal(await fs.readFile(h.settings, "utf8"), SETTINGS, "the new variable wins and reads the same state");
});

test("update takes explicit release tags only, v3.0.0 or later", async (t) => {
  const h = await setupHome(t);
  for (const app of APPS) {
    for (const ref of ["main", "latest", "3.0.0", "0838171cb6907f21f91f45ac9f7a992d7164a4eb"]) {
      const result = await cli(h.home, app, ["update", "--version", ref]);
      assert.equal(result.code, 1, ref);
      assert.match(result.stderr, /explicit release tag/);
    }
    for (const ref of ["v2.0.0", "v1.2.0"]) {
      const result = await cli(h.home, app, ["update", "--version", ref]);
      assert.equal(result.code, 1, ref);
      assert.match(result.stderr, new RegExp(`${ref.replace(/\./g, "\\.")} predates this installer, which reads ports/<app>/host\\.json \\(v3\\.0\\.0 and later\\)`));
    }
    assert.equal((await cli(h.home, app, ["update"])).code, 1);
  }
  const other = await cli(h.home, "claude-code", ["apply", "--codex-home", h.home]);
  assert.equal(other.code, 1);
  assert.match(other.stderr, /--codex-home is an option of the other installer/);
  assert.ok(!existsSync(h.state));
});

test("the specimen command renders to stdout", async (t) => {
  const h = await setupHome(t);
  const result = await cli(h.home, "claude-code", ["specimen"]);
  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /Claude Code roles under the j3w1 custom theme/);
  assert.match(result.stdout, /\u001b\[48;2;/);
});
