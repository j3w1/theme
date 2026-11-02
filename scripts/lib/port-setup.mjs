/* One checkout, one revision, existing per-host installers. No app settings
   are guessed: hosts without an activation API retain their import step. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { spawnSync, execFileSync } from "node:child_process";
import { createInterface } from "node:readline/promises";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const PORTS = ["orca", "claude-code", "codex", "windows", "obsidian", "ghostty", "warp", "chatgpt", "telegram"];
const PLATFORMS = { win32: "windows", darwin: "macos", linux: "linux" };
export const HELP = `j3w1 setup — run from a reviewed Git checkout with Node 24+ and Git

  node setup.mjs                              choose ports interactively
  node setup.mjs --ports orca,claude-code,codex
  node setup.mjs --ports windows --windows-mode Full
  node setup.mjs --ports obsidian --vault "path to vault"
  node setup.mjs --ports all --dry-run
  node setup.mjs --ports claude-code,codex --shell-prompt

Options:
  --ports <comma-list>     ${PORTS.join(", ")}, or all
  --vault <path>          existing Obsidian vault (Windows helper)
  --windows-mode <mode>   Full (default) or Native; no silent fallback
  --shell-prompt          opt in to the generated Agnoster override on macOS/Linux
  --dry-run               show the plan; no downloads, app calls or writes
  --skip-dependencies     refuse missing Codex parser instead of running npm ci
  --non-interactive       require --ports; never prompt for a selection
  --help                 show this help

all selects ports supporting this OS; Obsidian is included only with --vault.
Orca must be running with its CLI on PATH. Its first Appearance selection is
manual. ChatGPT/Telegram stage import files; they do not publish or activate.
Each completed port stays installed if a later port fails. Per-port restore
commands and copied-file backup paths are printed. Existing sessions stay open.
`;

export function parseOptions(argv) {
  const options = { windowsMode: "Full" };
  const flags = { "--dry-run": "dryRun", "--skip-dependencies": "skipDependencies", "--non-interactive": "nonInteractive", "--shell-prompt": "shellPrompt", "--help": "help" };
  const values = { "--ports": "ports", "--vault": "vault", "--windows-mode": "windowsMode" };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (flags[arg]) options[flags[arg]] = true;
    else if (values[arg]) {
      const value = argv[++i];
      if (!value || value.startsWith("--")) throw new Error(`${arg} needs a value`);
      options[values[arg]] = value;
    } else throw new Error(`Unknown option: ${arg}. Use --help.`);
  }
  if (!["Full", "Native"].includes(options.windowsMode)) throw new Error("--windows-mode must be Full or Native");
  if (options.ports) {
    options.ports = [...new Set(options.ports.split(",").map(p => p.trim()).filter(Boolean))];
    if (!options.ports.length || options.ports.some(p => p !== "all" && !PORTS.includes(p))) throw new Error("Unknown or empty port selection. Use --help.");
    if (options.ports.includes("all") && options.ports.length !== 1) throw new Error("Use all by itself, or list individual ports");
  }
  return options;
}

const git = (root, args) => execFileSync("git", ["-C", root, ...args], { maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
const sourceFile = (root, revision, file) => git(root, ["show", `${revision}:${file}`]);
const sourceJson = (root, revision, file) => JSON.parse(sourceFile(root, revision, file));
const digest = bytes => "sha256-" + createHash("sha256").update(bytes.toString("utf8").replaceAll("\r\n", "\n")).digest("base64");
const same = (file, bytes) => fs.existsSync(file) && fs.readFileSync(file).equals(bytes);

export function setupState(env = process.env, platform = process.platform, home = os.homedir()) {
  if (env.J3W1_THEME_STATE_DIR) return path.resolve(env.J3W1_THEME_STATE_DIR);
  return platform === "win32" ? path.join(env.LOCALAPPDATA || path.join(home, "AppData/Local"), "j3w1-theme") : path.join(env.XDG_STATE_HOME || path.join(home, ".local/state"), "j3w1-theme");
}

export function buildPlan(options, { root = ROOT, platform = process.platform, home = os.homedir(), env = process.env } = {}) {
  if (!PLATFORMS[platform]) throw new Error(`Unsupported operating system: ${platform}`);
  const revision = git(root, ["rev-parse", "HEAD"]).toString().trim();
  if (!/^[0-9a-f]{40}$/.test(revision)) throw new Error("Setup requires a Git checkout with a committed HEAD");
  const exported = sourceFile(root, revision, "exports/tokens.resolved.json");
  const declared = sourceJson(root, revision, "exports/digests.json").files["exports/tokens.resolved.json"];
  if (digest(exported) !== declared) throw new Error("Token export does not match this revision's digest");
  const manifests = Object.fromEntries(PORTS.map(id => [id, sourceJson(root, revision, `ports/${id}/port.json`)]));
  const supported = id => (manifests[id].os.includes(PLATFORMS[platform]) || manifests[id].os.includes("any")) && (id !== "obsidian" || platform === "win32");
  const selected = options.ports?.includes("all") ? PORTS.filter(id => supported(id) && (id !== "obsidian" || options.vault)) : options.ports;
  if (!selected?.length) throw new Error("Choose at least one port with --ports");
  if (options.shellPrompt && platform === "win32") throw new Error("--shell-prompt needs a macOS/Linux Zsh host; run it on the SSH host directly");
  if (selected.includes("obsidian")) {
    if (!options.vault || !fs.existsSync(path.join(options.vault, ".obsidian"))) throw new Error("Obsidian needs --vault pointing at an existing vault containing .obsidian");
  }
  const state = setupState(env, platform, home);
  const targets = selected.map(id => {
    if (!supported(id)) throw new Error(`${id} setup is not supported on ${PLATFORMS[platform]}; see ports/${id}/README.md`);
    const port = manifests[id];
    if (port.tokenDigest !== declared) throw new Error(`${id} token digest is stale`);
    const staged = !["windows", "claude-code", "codex"].includes(id);
    const files = (staged ? port.files : []).map(({ path: file }) => {
      if (!/^dist\/[a-zA-Z0-9._-]+$/.test(file)) throw new Error(`Unsafe or unsupported artifact path: ${file}`);
      return { name: path.posix.basename(file), bytes: sourceFile(root, revision, `ports/${id}/${file}`) };
    });
    return { id, files, directory: path.join(state, "setup", revision, id) };
  });
  const prompt = options.shellPrompt ? sourceFile(root, revision, "ports/orca/dist/agnoster.zsh") : null;
  return { root, revision, platform, home, env, state, targets, prompt, options };
}

export function runCommand(command, args, { root, env }, capture = false) {
  const result = spawnSync(command, args, { cwd: root, env, encoding: "utf8", stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit", windowsHide: true });
  if (result.error || result.status !== 0) throw new Error(`${path.basename(command)} failed${result.status === null ? "" : ` (exit ${result.status})`}${capture ? `: ${result.stderr || result.stdout || result.error?.message || ""}` : `: ${result.error?.message || "see output above"}`}`);
  return result.stdout;
}

export function stageFiles(target) {
  // Revision directories are immutable; a partial previous staging is resumable.
  for (const { name, bytes } of target.files) {
    const file = path.join(target.directory, name);
    if (fs.existsSync(file) && !same(file, bytes)) throw new Error(`Staged file differs from its pinned revision: ${file}`);
  }
  fs.mkdirSync(target.directory, { recursive: true });
  for (const { name, bytes } of target.files) if (!same(path.join(target.directory, name), bytes)) fs.writeFileSync(path.join(target.directory, name), bytes, { flag: "wx" });
}

export function replaceFile(file, bytes, log = console.log) {
  // User shell/config files can be links into a dotfiles checkout. Keep the
  // link and the existing target's permissions when replacing its contents.
  let present = false;
  try { fs.lstatSync(file); present = true; } catch (error) { if (error.code !== "ENOENT") throw error; }
  if (present) file = fs.realpathSync(file); // Dangling links fail before a write.
  if (same(file, bytes)) return;
  const mode = fs.existsSync(file) ? fs.statSync(file).mode & 0o777 : 0o600;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (fs.existsSync(file)) {
    const backup = `${file}.j3w1-backup-${Date.now()}-${process.pid}`;
    fs.copyFileSync(file, backup, fs.constants.COPYFILE_EXCL);
    log(`Backup: ${backup}`);
  }
  const pending = `${file}.j3w1-pending-${process.pid}`;
  let created = false;
  try {
    fs.writeFileSync(pending, bytes, { flag: "wx", mode });
    created = true;
    fs.chmodSync(pending, mode);
    fs.renameSync(pending, file);
  } finally {
    if (created && fs.existsSync(pending)) fs.unlinkSync(pending);
  }
}

const quoteZsh = value => "'" + value.replaceAll("'", "'\\''") + "'";
export function managedBlock(text, id, content) {
  const start = `# j3w1 setup: ${id} begin`, end = `# j3w1 setup: ${id} end`;
  const first = text.indexOf(start), last = text.indexOf(end);
  if ((first < 0) !== (last < 0) || (first >= 0 && (last < first || text.indexOf(start, first + start.length) >= 0 || text.indexOf(end, last + end.length) >= 0))) throw new Error(`Broken or repeated j3w1 ${id} block; resolve it before setup`);
  const newline = text.includes("\r\n") ? "\r\n" : "\n";
  const block = [start, content, end].join(newline);
  return first < 0 ? text + (text && !text.endsWith("\n") ? newline : "") + block + newline : text.slice(0, first) + block + text.slice(last + end.length);
}

function installPrompt(plan, log) {
  const config = plan.env.XDG_CONFIG_HOME || path.join(plan.home, ".config");
  const file = path.join(config, "j3w1-theme", "agnoster.zsh");
  const hook = fs.existsSync(path.join(config, "ce-devbox")) ? path.join(config, "ce-devbox/zshrc.local") : path.join(plan.env.ZDOTDIR || plan.home, ".zshrc");
  const text = fs.existsSync(hook) ? fs.readFileSync(hook, "utf8") : "";
  const line = `source ${quoteZsh(file)}`;
  let updated = managedBlock(text, "prompt", line);
  const existingLines = text.split(/\r?\n/);
  const legacy = config === path.join(plan.home, ".config") && existingLines.includes('source "$HOME/.config/j3w1-theme/agnoster.zsh"');
  if (!text.includes("# j3w1 setup: prompt begin") && (existingLines.includes(line) || legacy)) updated = text;
  const zshenv = path.join(plan.env.ZDOTDIR || plan.home, ".zshenv");
  const oldEnv = fs.existsSync(zshenv) ? fs.readFileSync(zshenv, "utf8") : "";
  let updatedEnv = fs.existsSync("/etc/profile.d/ce-theme.sh") ? managedBlock(oldEnv, "legacy-palette", "export CE_THEME=off") : null;
  if (!oldEnv.includes("# j3w1 setup: legacy-palette begin") && oldEnv.split(/\r?\n/).includes("export CE_THEME=off")) updatedEnv = oldEnv;
  replaceFile(file, plan.prompt, log);
  replaceFile(hook, Buffer.from(updated), log);
  if (updatedEnv !== null) replaceFile(zshenv, Buffer.from(updatedEnv), log);
  log(`Prompt installed. Open a new Zsh shell, or run: source ${quoteZsh(hook)}`);
}

function dependencies(plan, run, log) {
  if (!plan.targets.some(t => t.id === "codex")) return;
  try { createRequire(path.join(plan.root, "package.json")).resolve("smol-toml"); return; } catch { /* npm ci below */ }
  if (plan.options.skipDependencies) throw new Error("Codex needs the repository dependencies. Run npm ci, or omit --skip-dependencies");
  log("Installing this checkout's locked dependencies with npm ci...");
  if (plan.platform === "win32") run(plan.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", "npm.cmd ci"], plan);
  else run("npm", ["ci"], plan);
}

export function executePlan(plan, { run = runCommand, log = console.log } = {}) {
  log(`j3w1 setup revision ${plan.revision}`);
  for (const target of plan.targets) log(["windows", "claude-code", "codex"].includes(target.id) ? `${target.id}: apply and test with the existing installer` : `${target.id}: ${target.directory}`);
  if (plan.prompt) log("Shell prompt: install generated Agnoster override and a managed user source block");
  if (plan.options.dryRun) { log("Dry run complete. Nothing was downloaded, written or activated."); return; }
  const orca = plan.env.ORCA_CLI_COMMAND || (plan.env.ORCA_DEV_REPO_ROOT ? "orca-dev" : plan.platform === "linux" ? "orca-ide" : "orca");
  if (plan.targets.some(t => t.id === "orca")) run(orca, ["status", "--json"], plan, true);
  dependencies(plan, run, log);
  for (const target of plan.targets) {
    const { id } = target;
    log(`Setting up ${id}...`);
    if (["claude-code", "codex"].includes(id)) {
      const installer = path.join(plan.root, "ports", id, "install.mjs");
      run(process.execPath, [installer, "apply", "--revision", plan.revision, "--source-root", plan.root], plan);
      run(process.execPath, [installer, "test", "--no-specimen", "--source-root", plan.root], plan);
      log(`Restore ${id}: node ports/${id}/install.mjs restore`);
    } else if (id === "windows") {
      // SourceRoot selects the internal 7.4+ lifecycle. Let the existing
      // bootstrap obtain its verified runtime and this exact published SHA.
      run("powershell.exe", ["-NoProfile", "-File", path.join(plan.root, "ports/windows/install.ps1"), "-Action", "Apply", "-Revision", plan.revision, "-Mode", plan.options.windowsMode, "-NonInteractive"], plan);
      log("Windows setup ran Test. Recovery commands are saved under LOCALAPPDATA/j3w1-theme/windows/recovery-commands.txt.");
    } else {
      stageFiles(target);
      if (id === "orca") {
        run(orca, ["plugin", "validate", target.directory, "--json"], plan);
        run(orca, ["plugin", "dev", "load", target.directory, "--json"], plan);
        log("Orca registered. In Appearance select j3w1 for Dark app and terminal; editor Same as app. Remove old terminal color overrides. Keep the staged folder for future restarts.");
        log(`Unregister Orca: ${orca} plugin dev unload "${target.directory}" --json (select the previous themes first).`);
      } else if (id === "obsidian") {
        run("powershell.exe", ["-NoProfile", "-File", path.join(plan.root, "ports/obsidian/install.ps1"), "-VaultPath", path.resolve(plan.options.vault), "-SourcePath", target.directory], plan);
        log("Obsidian pair installed. Select Dark base scheme and j3w1 in Appearance. See the port guide for rollback.");
      } else if (id === "ghostty" || id === "warp") {
        const config = plan.env.XDG_CONFIG_HOME || path.join(plan.home, ".config");
        const destination = id === "ghostty" ? path.join(config, "ghostty/themes/j3w1") : plan.platform === "win32" ? path.join(plan.env.APPDATA, "warp/Warp/data/themes/j3w1.yaml") : plan.platform === "darwin" ? path.join(plan.home, ".warp/themes/j3w1.yaml") : path.join(plan.env.XDG_DATA_HOME || path.join(plan.home, ".local/share"), "warp-terminal/themes/j3w1.yaml");
        replaceFile(destination, target.files[0].bytes, log);
        log(id === "ghostty" ? "Ghostty file installed. Set theme = j3w1 in your config and reload." : "Warp file installed. Select j3w1 theme in Settings > Appearance > Themes.");
        log(`Rollback: select the previous theme, then restore the printed backup or remove ${destination} if it was newly created.`);
      } else if (id === "chatgpt") log(`ChatGPT import file: ${path.join(target.directory, "presets.json")}. Paste the chosen import string in Appearance; set the remaining options from ports/chatgpt/README.md.`);
      else if (id === "telegram") log(`Telegram files staged in ${target.directory}. Open the matching file in Telegram, Apply, then Keep changes. Cloud publication is separate.`);
    }
    log(`${id}: setup step completed${["orca", "obsidian", "ghostty", "warp", "chatgpt", "telegram"].includes(id) ? "; complete the printed app selection/import" : ""}.`);
  }
  if (plan.prompt) installPrompt(plan, log);
  log("Setup finished. Running agent sessions keep their startup theme; reopen them when convenient.");
}

export async function main(argv) {
  const options = parseOptions(argv);
  if (options.help) { console.log(HELP); return 0; }
  if (Number(process.versions.node.split(".")[0]) < 24) throw new Error("Node 24 or later is required");
  if (!options.ports) {
    if (options.nonInteractive || !process.stdin.isTTY) throw new Error("Choose ports with --ports; use --help for examples");
    const reader = createInterface({ input: process.stdin, output: process.stdout });
    try {
      console.log("Choose j3w1 ports (comma-separated names, or all). Obsidian needs --vault; optional prompts use --shell-prompt.");
      const available = buildPlan({ ...options, ports: ["all"] }).targets.map(t => t.id);
      if (process.platform === "win32" && !available.includes("obsidian")) available.push("obsidian");
      console.log(available.join(", "));
      const answer = (await reader.question("Ports [Enter cancels]: ")).trim();
      if (!answer) { console.log("Setup cancelled."); return 0; }
      options.ports = parseOptions(["--ports", answer]).ports;
      if (options.ports.includes("obsidian") && !options.vault) {
        options.vault = (await reader.question("Existing Obsidian vault folder [Enter cancels]: ")).trim();
        if (!options.vault) { console.log("Setup cancelled."); return 0; }
      }
    } finally { reader.close(); }
  }
  executePlan(buildPlan(options));
  return 0;
}
