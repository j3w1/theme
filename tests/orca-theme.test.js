import assert from "node:assert/strict";
import test from "node:test";
import { readJson, readText } from "../scripts/lib/fs.mjs";

const mapping = await readJson("ports/orca/mapping.json");
const source = await readJson("ports/orca/src/theme.json");
const tokens = (await readJson("exports/tokens.resolved.json")).profiles.default.tokens;
const app = await readJson("ports/orca/dist/app-theme.json");
const terminal = await readJson("ports/orca/dist/terminal-theme.json");

test("Orca app, syntax, terminal and legacy palette carry every mapped role exactly once", async () => {
  const actual = new Map();
  for (const [key, value] of Object.entries(app.tokens)) actual.set(`app.tokens.${key}`, value);
  for (const rule of app.tokenColors) actual.set(`app.tokenColors.${rule.name}.foreground`, rule.settings.foreground);
  for (const [key, value] of Object.entries(terminal.terminal)) actual.set(`terminal.${key}`, value);
  for (const line of (await readText("ports/orca/dist/agnoster.zsh")).split("\n")) {
    if (!line.startsWith("AGNOSTER_")) continue;
    const match = /^(AGNOSTER_[A-Z_]+)='(#[a-f0-9]{6})'$/.exec(line);
    assert.ok(match, `prompt line is a literal colour assignment: ${line}`);
    actual.set(`prompt.${match[1]}`, match[2]);
  }
  for (const match of (await readText("ports/orca/dist/agnoster.zsh")).matchAll(/\b([a-z]{2})=38;2;(\d+);(\d+);(\d+)/g)) {
    actual.set(`shell.LS_COLORS.${match[1]}`, `#${match.slice(2).map(value => Number(value).toString(16).padStart(2, "0")).join("")}`);
  }
  for (const line of (await readText("ports/orca/dist/config.ghostty")).split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const [, key, value] = /^([^=]+?)\s*=\s*(.+)$/.exec(line);
    const palette = key.trim() === "palette" ? /^(\d+)=(.+)$/.exec(value) : null;
    actual.set(palette ? `palette[${palette[1]}]` : key.trim(), palette ? palette[2] : value);
  }
  const expected = new Map();
  for (const [role, keys] of Object.entries(mapping.mappings)) for (const key of keys) {
    assert.ok(!expected.has(key), `${key} is mapped once`);
    const css = tokens[role].css;
    expected.set(key, key === "font-family" ? css.split(",")[0].trim().replace(/^"|"$/g, "") : key === "font-size" ? css.replace(/px$/, "") : css);
  }
  assert.deepEqual([...actual].sort(), [...expected].sort());
});

test("Agnoster branch branding uses prompt roles without replacing semantic ANSI green", async () => {
  const prompt = await readText("ports/orca/dist/agnoster.zsh");
  for (const state of ["CLEAN", "DIRTY"]) {
    assert.ok(prompt.includes(`AGNOSTER_GIT_${state}_BG='${tokens["color.surface.raised"].css}'`));
    assert.ok(prompt.includes(`AGNOSTER_GIT_${state}_FG='${tokens["color.terminal.prompt-text"].css}'`));
  }
  assert.ok(prompt.includes(`AGNOSTER_DIR_BG='${tokens["color.interaction.text-selection.bg"].css}'`));
  assert.notEqual(tokens["color.interaction.text-selection.bg"].css, tokens["color.surface.raised"].css, "path and branch remain visually distinct");
  assert.notEqual(tokens["color.terminal.ansi.2"].css, tokens["color.terminal.prompt-text"].css);
  assert.doesNotMatch(prompt, /\\033|\\x1b|\\e\]|\u001b/, "prompt assignments emit no terminal palette changes");
});

test("GNU ls directory branding uses rose independently of semantic ANSI blue", async () => {
  assert.deepEqual(source.lsColorTypes, ["no", "fi", "di", "ln", "or", "mi"]);
  assert.ok(mapping.mappings["color.text.bright"].includes("shell.LS_COLORS.di"));
  assert.notEqual(tokens["color.text.bright"].css, tokens["color.terminal.ansi.4"].css);
  const shell = await readText("ports/orca/dist/agnoster.zsh");
  assert.ok(shell.includes('retained+=("$entry")'), "unowned executable and extension rules are preserved");
  assert.ok(shell.includes('no=*|fi=*|di=*|ln=*|or=*|mi=*'), "only declared type keys are replaced on repeated source");
});

test("Orca plugin uses only content contributions and preserves scope selectors and styles", async () => {
  const plugin = await readJson("ports/orca/dist/orca-plugin.json");
  assert.equal(plugin.execution, "data");
  assert.equal(plugin.engines.orca, ">=1.4.246");
  assert.equal(plugin.main, undefined);
  assert.equal(plugin.capabilities, undefined);
  assert.deepEqual(Object.keys(plugin.contributes).sort(), ["terminalThemes", "themes"]);
  assert.equal(app.base, "dark");
  assert.equal(terminal.mode, "dark");
  assert.deepEqual(Object.keys(app.tokens), source.appTokens);
  assert.deepEqual(Object.keys(terminal.terminal), source.terminalKeys);
  for (const expected of source.scopes) {
    const rule = app.tokenColors.find(rule => rule.name === expected.name);
    assert.deepEqual(rule.scope, expected.scope);
    assert.equal(rule.settings.fontStyle, expected.fontStyle);
  }
});


test("Orca maps the complete installed public app token contract without fallback colors", async () => {
  const contract = await readJson("tests/fixtures/orca-app-theme-tokens.json");
  assert.equal(contract.hostVersion, "1.4.246");
  assert.deepEqual(source.appTokens, contract.tokens);
  assert.deepEqual(Object.keys(app.tokens), contract.tokens);
  for (const key of ["--primary-foreground", "--sidebar-primary-foreground", "--accent-foreground", "--sidebar-accent-foreground", "--worktree-sidebar-accent-foreground", "--host-badge-foreground", "--tab-active-foreground", "--tab-inactive-foreground"]) {
    assert.ok([tokens["color.text.default"].css, tokens["color.text.bright"].css].includes(app.tokens[key]), key + " uses ordinary rose text");
  }
  for (const key of ["--sidebar-primary", "--tab-active", "--host-badge", "--chat-user-message"]) assert.equal(app.tokens[key], tokens["color.surface.raised"].css, key + " uses a dark control surface");
  assert.equal(app.tokens["--primary"], tokens["color.interaction.text-selection.bg"].css);
  assert.equal(app.tokens["--worktree-sidebar-active"], tokens["color.surface.default"].css);
  assert.equal(app.tokens["--card"], tokens["color.surface.canvas"].css);
  assert.equal(app.tokens["--border"], tokens["color.border.strong"].css);
  assert.equal(app.tokens["--diff-added"], tokens["color.diff.added.gutter"].css);
  assert.equal(app.tokens["--git-decoration-added"], tokens["color.diff.added.gutter"].css);
  assert.equal(app.tokens["--split-divider"], tokens["color.border.control"].css);
});
