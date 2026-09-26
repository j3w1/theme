/* The command line both devbox installers share. ports/claude-code/install.mjs
   and ports/codex/install.mjs each call main() with their own host; every
   rule lives in this library, so the two installers behave the same way.
   It never runs claude or codex except to read `--version`, which it does
   before reading their files. */

import path from "node:path";
import { apply, resolvePaths, restore, specimen, stateRootOf, test, update } from "./commands.mjs";
import { EditError } from "./edit.mjs";
import { FIRST_INSTALLER_TAG, KitError } from "./source.mjs";

export const HOSTS = {
  "claude-code": { name: "Claude Code", installer: "node ports/claude-code/install.mjs", options: ["--claude-config-dir"] },
  codex: { name: "Codex", installer: "node ports/codex/install.mjs", options: ["--codex-home", "--orca-runtime-home"] },
};

const OPTION_HELP = {
  "--claude-config-dir": "  --claude-config-dir <dir>   default $CLAUDE_CONFIG_DIR, else ~/.claude",
  "--codex-home": "  --codex-home <dir>          default ~/.codex ($CODEX_HOME is ignored: in Orca it is the runtime copy)",
  "--orca-runtime-home": "  --orca-runtime-home <dir>   default ${XDG_CONFIG_HOME:-~/.config}/orca/codex-runtime-home/home (read only)",
};

export const helpFor = (integration) => {
  const host = HOSTS[integration];
  return `${host.installer} <command> [options]

Installs the j3w1 theme for ${host.name} from one commit of this repository.

commands
  apply     [--revision <commit>] [--dry-run]   install this checkout's HEAD, or the exact
                                                 commit given (it must be fetched, or on GitHub)
  update    --version <tag> [--dry-run]          install a release tag, ${FIRST_INSTALLER_TAG} or later
  test      [--no-specimen]                      render the specimen, then check the install
  restore   [--backup <yyyyMMddTHHmmssZ>] [--latest] [--dry-run]
                                                 default: undo every apply and update of
                                                 ${host.name} since its last restore
  specimen                                       render the specimen only

where the values come from
  Every value comes from git objects at one commit, never from files you have
  edited: the export, its digest in exports/digests.json, and the host map.
  test checks the commit that is installed, even after this checkout moves on.

restore
  The default restore puts every managed file and key back to what it was
  before the first apply or update since the last restore, where "the last
  restore" is the last completed restore that left nothing of ${host.name}
  applied: a default, --backup or --latest restore, including one that had
  nothing to change. A value changed by hand between two applies is reported
  with WARN and the value restore sets instead; it is replaced. A value
  changed by hand after the last apply is reported, replaced, and kept in the
  restore's own backup.
  --backup <name> undoes that one backup; --latest undoes the newest backup
  that changed ${host.name}. Restore never touches the other installer's host.
  A restore that stopped partway (another program's write, a write error)
  says so and names the command that finishes it: restore for a default
  restore, restore --backup <name> for a --backup or --latest one (restore
  --latest again would undo the stopped restore instead).

options
  --source-root <checkout>    read from this checkout only (no network)
  --state-dir <dir>           default $J3W1_THEME_STATE_DIR, else \${XDG_STATE_HOME:-~/.local/state}/j3w1-theme
${host.options.map((o) => OPTION_HELP[o]).join("\n")}
  --skip-version-probe        do not run ${integration === "codex" ? "codex" : "claude"} --version
`;
};

const FLAGS = { "--dry-run": "dryRun", "--no-specimen": "noSpecimen", "--latest": "latest", "--skip-version-probe": "skipVersionProbe" };
const VALUES = { "--version": "version", "--revision": "revision", "--backup": "backup", "--source-root": "sourceRoot", "--state-dir": "stateDir", "--claude-config-dir": "claudeConfigDir", "--codex-home": "codexHome", "--orca-runtime-home": "orcaRuntimeHome" };
const PATHS = ["sourceRoot", "stateDir", "claudeConfigDir", "codexHome", "orcaRuntimeHome"];
const HOST_OPTIONS = new Set(Object.values(HOSTS).flatMap((h) => h.options));
const COMMANDS = { apply, update, test, restore, specimen };

export const parseArgs = (integration, argv) => {
  const [command, ...rest] = argv;
  const opts = {};
  for (let i = 0; i < rest.length; i += 1) {
    const [flag, inline] = rest[i].split(/=(.*)/s);
    if (HOST_OPTIONS.has(flag) && !HOSTS[integration].options.includes(flag)) throw new KitError(`${flag} is an option of the other installer, not of ${HOSTS[integration].installer}`);
    if (FLAGS[flag]) opts[FLAGS[flag]] = true;
    else if (VALUES[flag]) {
      const value = inline ?? rest[++i];
      if (value === undefined || value.startsWith("--")) throw new KitError(`${flag} needs a value`);
      opts[VALUES[flag]] = PATHS.includes(VALUES[flag]) ? path.resolve(value) : value;
    } else throw new KitError(`unknown option ${rest[i]}`);
  }
  opts.integrations = [integration];
  if (command === "update" && !opts.version) throw new KitError(`update needs --version <tag>, such as ${FIRST_INSTALLER_TAG}`);
  if (opts.revision && command !== "apply") throw new KitError("--revision is an apply option; update takes --version <tag>");
  if (opts.version && command !== "update") throw new KitError("--version is an update option; apply takes --revision <commit>");
  if (opts.backup && opts.latest) throw new KitError("pass --backup or --latest, not both");
  return { command, opts };
};

/* Output nobody reads any more (a closed pipe: EPIPE, or a destroyed
   stream) is dropped, so a reader that goes away never aborts a sequence of
   writes to the hosts' files halfway through. Any other output error (a full
   disk, an I/O error) stops the output too, and the command exits 1. */
const DROPPED = new Set(["EPIPE", "ERR_STREAM_DESTROYED"]);
const quietWhenClosed = (stream, failed) => {
  let closed = false;
  const fail = (error) => {
    closed = true;
    if (!DROPPED.has(error?.code)) failed(error);
  };
  stream.on?.("error", fail);
  return (text) => {
    if (closed) return;
    try {
      stream.write(text);
    } catch (error) {
      fail(error);
    }
  };
};

export const main = async (integration, argv, options = {}) => {
  let outputError = null;
  const code = await commandMain(integration, argv, options, (error) => {
    outputError ??= error;
  });
  /* Stream errors are emitted after the write that caused them. */
  await new Promise((resolve) => setImmediate(resolve));
  if (!outputError) return code;
  const stderr = options.stderr ?? process.stderr;
  if (!stderr.destroyed) stderr.write(`j3w1-theme: the output could not be written (${outputError.code ?? outputError.message})\n`);
  return code || 1;
};

const commandMain = async (integration, argv, { env = process.env, stdout = process.stdout, stderr = process.stderr } = {}, failed) => {
  const toStdout = quietWhenClosed(stdout, failed);
  const toStderr = quietWhenClosed(stderr, failed);
  const log = (line) => toStderr(`${line}\n`);
  const out = (text) => toStdout(text);
  try {
    if (!argv.length || ["help", "--help", "-h"].includes(argv[0])) {
      out(helpFor(integration));
      return argv.length ? 0 : 2;
    }
    const { command, opts } = parseArgs(integration, argv);
    const handler = COMMANDS[command];
    if (!handler) throw new KitError(`unknown command ${command}; try help`);
    const state = stateRootOf(opts, env);
    if (state.deprecated) log("j3w1-theme: J3W1_TERMINAL_KIT_STATE_DIR is deprecated; set J3W1_THEME_STATE_DIR to the same folder instead");
    if (state.legacy) log(`j3w1-theme: using the terminal kit's state folder ${state.root}, which holds your backups`);
    const paths = resolvePaths(opts, env);
    return await handler(opts, paths, (line) => out(`${line}\n`), out);
  } catch (error) {
    if (error instanceof KitError || error instanceof EditError) {
      log(`j3w1-theme: ${error.message}`);
      return 1;
    }
    throw error;
  }
};
