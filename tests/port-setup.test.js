import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { repoRoot } from "../scripts/lib/fs.mjs";
import { PORTS, parseOptions, buildPlan, executePlan, stageFiles, replaceFile, managedBlock } from "../scripts/lib/port-setup.mjs";

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "j3w1 setup & fixture-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (file, text) => { const full = path.join(root, file); fs.mkdirSync(path.dirname(full), { recursive: true }); fs.writeFileSync(full, text); };
  const bytes = '{"fixture":"pinned"}\n';
  const digest = "sha256-" + createHash("sha256").update(bytes).digest("base64");
  write("exports/tokens.resolved.json", bytes);
  write("exports/digests.json", JSON.stringify({ files: { "exports/tokens.resolved.json": digest } }));
  write("package.json", '{"type":"module"}');
  for (const id of PORTS) {
    const port = JSON.parse(fs.readFileSync(path.join(repoRoot, `ports/${id}/port.json`)));
    port.tokenDigest = digest;
    write(`ports/${id}/port.json`, JSON.stringify(port));
    for (const file of port.files) write(`ports/${id}/${file.path}`, `pinned ${id}/${file.path}\n`);
  }
  const git = args => execFileSync("git", ["-C", root, ...args], { stdio: "pipe" }).toString().trim();
  git(["init", "--quiet"]); git(["add", "."]);
  git(["-c", "user.name=Setup fixture", "-c", "user.email=fixture@example.invalid", "-c", "commit.gpgsign=false", "commit", "--quiet", "-m", "fixture"]);
  // The installer only needs resolution here; real TOML parsing has its own suite.
  write("node_modules/smol-toml/package.json", '{"main":"index.js"}');
  write("node_modules/smol-toml/index.js", "");
  const home = path.join(root, "user's home");
  const env = { ...process.env, J3W1_THEME_STATE_DIR: path.join(root, "state"), XDG_CONFIG_HOME: path.join(home, ".config"), XDG_DATA_HOME: path.join(home, ".local/share"), APPDATA: path.join(home, "AppData/Roaming") };
  delete env.ORCA_CLI_COMMAND; delete env.ORCA_DEV_REPO_ROOT; delete env.ZDOTDIR;
  const context = { root, home, env, platform: "win32" };
  return { root, home, env, write, context, plan: (args, platform = "win32") => buildPlan(parseOptions(args), { ...context, platform }) };
}

test("selection rejects mistakes and respects declared platforms, including any", t => {
  for (const args of [["--ports", ""], ["--ports", "orca,unknown"], ["--ports", "all,orca"], ["--vault"], ["--windows-mode", "Auto"]]) assert.throws(() => parseOptions(args));
  const f = fixture(t);
  const ids = f.plan(["--ports", "all", "--dry-run"]).targets.map(p => p.id);
  assert.ok(ids.includes("codex"), "native Windows Codex is included");
  assert.ok(!ids.includes("ghostty"), "Ghostty has no native Windows port");
  assert.ok(!ids.includes("obsidian"), "all does not guess a vault");
  const vault = path.join(f.root, "vault & notes"); fs.mkdirSync(path.join(vault, ".obsidian"), { recursive: true });
  assert.equal(f.plan(["--ports", "obsidian", "--vault", vault]).targets[0].id, "obsidian", "any-platform manifest permits the Windows helper");
  assert.throws(() => f.plan(["--ports", "obsidian"]), /--vault/);
  assert.throws(() => f.plan(["--ports", "windows"], "linux"), /not supported/);
  assert.throws(() => f.plan(["--ports", "orca", "--shell-prompt"]), /Zsh host/);
});

test("dry run reads committed artifacts and never calls apps, installs dependencies or writes", t => {
  const f = fixture(t);
  f.write("ports/orca/dist/app-theme.json", "edited file ignored");
  const plan = f.plan(["--ports", "all", "--dry-run"]);
  assert.equal(plan.targets.find(t => t.id === "orca").files.find(f => f.name === "app-theme.json").bytes.toString(), "pinned orca/dist/app-theme.json\n");
  executePlan(plan, { run: () => assert.fail("dry run invoked an app"), log() {} });
  assert.equal(fs.existsSync(plan.state), false);
});

test("core setup uses one revision, validates Orca, preserves the Windows bootstrap and checks agents", t => {
  const f = fixture(t), calls = [];
  const plan = f.plan(["--ports", "orca,claude-code,codex,windows"]);
  executePlan(plan, { run: (command, args) => calls.push({ command, args }), log() {} });
  assert.deepEqual(calls[0].args, ["status", "--json"]);
  const load = calls.find(c => c.args.includes("load"));
  assert.ok(calls.some(c => c.args.includes("validate")), "theme is validated before registration");
  assert.ok(load.args.includes(plan.targets[0].directory));
  for (const id of ["claude-code", "codex"]) {
    const applies = calls.filter(c => c.args[0].endsWith(`${id}${path.sep}install.mjs`));
    assert.equal(applies.length, 2);
    assert.ok(applies[0].args.includes(plan.revision));
    assert.ok(applies[1].args.includes("--no-specimen"));
  }
  const windows = calls.find(c => c.command === "powershell.exe");
  assert.ok(windows.args.includes(plan.revision));
  assert.equal(windows.args.includes("-SourceRoot"), false, "5.1 entry must reach the verified runtime bootstrap");
  assert.equal(windows.args.includes("-ExecutionPolicy"), false);
  assert.equal(windows.args.at(windows.args.indexOf("-Mode") + 1), "Full");
});

test("a failed host stops subsequent ports and reports failure instead of a completed setup", t => {
  const f = fixture(t), logs = [];
  const plan = f.plan(["--ports", "windows,warp"]);
  assert.throws(() => executePlan(plan, { run() { throw new Error("unsupported exact host"); }, log: text => logs.push(text) }), /unsupported exact host/);
  assert.equal(fs.existsSync(plan.targets[1].directory), false);
  assert.equal(logs.some(l => l.includes("Setup finished")), false);
});

test("missing dependencies can be refused before any theme file is staged", t => {
  const f = fixture(t), plan = f.plan(["--ports", "codex,warp", "--skip-dependencies"]);
  fs.rmSync(path.join(f.root, "node_modules"), { recursive: true });
  assert.throws(() => executePlan(plan, { run() { assert.fail("dependency refusal ran a host"); }, log() {} }), /npm ci/);
  assert.equal(fs.existsSync(plan.state), false);
});

test("staging is resumable, immutable and does not overwrite a different file", t => {
  const f = fixture(t), target = f.plan(["--ports", "telegram"]).targets[0];
  stageFiles(target); stageFiles(target);
  const file = path.join(target.directory, target.files[0].name);
  fs.writeFileSync(file, "owner edit");
  assert.throws(() => stageFiles(target), /differs/);
  assert.equal(fs.readFileSync(file, "utf8"), "owner edit");
});

test("Warp replaces only its file, backs up existing content and is idempotent", t => {
  const f = fixture(t), plan = f.plan(["--ports", "warp"]);
  const directory = path.join(f.env.APPDATA, "warp/Warp/data/themes"); fs.mkdirSync(directory, { recursive: true });
  const file = path.join(directory, "j3w1.yaml"); fs.writeFileSync(file, "previous theme");
  fs.writeFileSync(path.join(directory, "other.yaml"), "unrelated");
  executePlan(plan, { log() {} }); executePlan(plan, { log() {} });
  const backups = fs.readdirSync(directory).filter(f => f.includes("backup"));
  assert.equal(backups.length, 1);
  assert.equal(fs.readFileSync(path.join(directory, backups[0]), "utf8"), "previous theme");
  assert.equal(fs.readFileSync(path.join(directory, "other.yaml"), "utf8"), "unrelated");
});

test("prompt setup preserves shell contents and writes one source block with quoted paths", t => {
  const f = fixture(t), hook = path.join(f.home, ".zshrc");
  fs.mkdirSync(f.home, { recursive: true }); fs.writeFileSync(hook, "source agnoster.zsh\nfunction owner() { echo keep; }\n");
  const plan = f.plan(["--ports", "claude-code", "--shell-prompt"], "linux");
  executePlan(plan, { run() {}, log() {} }); executePlan(plan, { run() {}, log() {} });
  const text = fs.readFileSync(hook, "utf8");
  assert.ok(text.startsWith("source agnoster.zsh\nfunction owner() { echo keep; }\n"));
  assert.equal(text.match(/# j3w1 setup: prompt begin/g).length, 1);
  assert.ok(text.includes("user'\\''s home"), "apostrophe in source path is shell-quoted");
  assert.equal(fs.readdirSync(f.home).filter(f => f.includes(".zshrc.j3w1-backup")).length, 1);
  assert.throws(() => managedBlock("# j3w1 setup: prompt begin\nowner", "prompt", "source new"), /Broken/);
});

test("prompt setup reuses the previously documented source line without duplicating it", t => {
  const f = fixture(t), hook = path.join(f.home, ".zshrc");
  const text = 'source agnoster.zsh\nsource "$HOME/.config/j3w1-theme/agnoster.zsh"\n';
  fs.mkdirSync(f.home, { recursive: true }); fs.writeFileSync(hook, text);
  executePlan(f.plan(["--ports", "claude-code", "--shell-prompt"], "linux"), { run() {}, log() {} });
  assert.equal(fs.readFileSync(hook, "utf8"), text);
});

test("replacing a linked private config keeps the link, mode and target backup", { skip: process.platform === "win32" && "POSIX mode/symlink semantics" }, t => {
  const f = fixture(t), target = path.join(f.root, "private-config"), link = path.join(f.root, "config-link");
  fs.writeFileSync(target, "private", { mode: 0o600 }); fs.symlinkSync(target, link);
  replaceFile(link, Buffer.from("updated"), () => {});
  assert.equal(fs.lstatSync(link).isSymbolicLink(), true);
  assert.equal(fs.readFileSync(target, "utf8"), "updated");
  assert.equal(fs.statSync(target).mode & 0o777, 0o600);
  const backup = fs.readdirSync(f.root).find(f => f.startsWith("private-config.j3w1-backup"));
  assert.equal(fs.readFileSync(path.join(f.root, backup), "utf8"), "private");
  const dangling = path.join(f.root, "dangling-link");
  fs.symlinkSync(path.join(f.root, "missing-target"), dangling);
  assert.throws(() => replaceFile(dangling, Buffer.from("replacement"), () => {}), /ENOENT/);
  assert.equal(fs.lstatSync(dangling).isSymbolicLink(), true);
});
