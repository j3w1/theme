#!/usr/bin/env node
/* j3w1 terminal kit, devbox half: installs, checks, updates and restores the
   j3w1 themes for Claude Code and Codex from the pinned export.

   Usage: node tools/terminal-kit/devbox/j3w1-terminal.mjs <command> [options]
   See `help` for the commands and options. It never runs claude or codex
   except to read `--version`, which it does before reading their files. */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { apply, resolvePaths, restore, specimen, test, update } from "./lib/commands.mjs";
import { EditError } from "./lib/edit.mjs";
import { INTEGRATIONS } from "./lib/generators.mjs";
import { KitError } from "./lib/source.mjs";

const HELP = `j3w1-terminal <command> [options]

commands
  apply     [--claude] [--codex] [--dry-run]   install the pinned themes (default both);
                                               once installed, the installed pin
  update    --version vX.Y.Z [--claude] [--codex] [--dry-run]
                                               move the pin to an explicit release tag
  test      [--no-specimen] [--claude] [--codex]
                                               render the specimen, then check the install
  restore   [--backup <yyyyMMddTHHmmssZ>] [--latest] [--dry-run]
                                               default: undo every apply and update
                                               since the last restore
  specimen                                     render the specimen only

pins
  Each integration keeps its own pin. apply uses it once the integration is
  installed (kit.json's pin before that); update moves only the integrations
  it names (default both), so update --claude never moves Codex.

restore
  The default restore puts every managed file and key back to what it was
  before the first apply or update since the last restore, where "the last
  restore" is the last one that finished and left nothing of the kit applied:
  a default, --backup or --latest restore, including one that had nothing to
  change. A value changed by hand between two applies is reported with WARN
  and the value restore sets instead; it is replaced. A value changed by hand
  after the last apply is reported, replaced, and kept in the restore's own
  backup.
  --backup <name> undoes that one backup; --latest the newest one.
  A restore that stopped partway (another program's write, a write error)
  says so; run the same restore again and it finishes the job.

options
  --source-root <checkout>    read the export from this checkout only (no network)
  --state-dir <dir>           default $J3W1_TERMINAL_KIT_STATE_DIR, else \${XDG_STATE_HOME:-~/.local/state}/j3w1-theme/devbox
  --claude-config-dir <dir>   default $CLAUDE_CONFIG_DIR, else ~/.claude
  --codex-home <dir>          default ~/.codex ($CODEX_HOME is ignored: in Orca it is the runtime copy)
  --orca-runtime-home <dir>   default \${XDG_CONFIG_HOME:-~/.config}/orca/codex-runtime-home/home (read only)
  --skip-version-probe        do not run claude/codex --version
`;

const FLAGS = { "--claude": "claude", "--codex": "codex", "--dry-run": "dryRun", "--no-specimen": "noSpecimen", "--latest": "latest", "--skip-version-probe": "skipVersionProbe" };
const VALUES = { "--version": "version", "--backup": "backup", "--source-root": "sourceRoot", "--state-dir": "stateDir", "--claude-config-dir": "claudeConfigDir", "--codex-home": "codexHome", "--orca-runtime-home": "orcaRuntimeHome" };
const COMMANDS = { apply, update, test, restore, specimen };

export const parseArgs = (argv) => {
  const [command, ...rest] = argv;
  const opts = {};
  for (let i = 0; i < rest.length; i += 1) {
    const [flag, inline] = rest[i].split(/=(.*)/s);
    if (FLAGS[flag]) opts[FLAGS[flag]] = true;
    else if (VALUES[flag]) {
      const value = inline ?? rest[++i];
      if (value === undefined || value.startsWith("--")) throw new KitError(`${flag} needs a value`);
      opts[VALUES[flag]] = ["sourceRoot", "stateDir", "claudeConfigDir", "codexHome", "orcaRuntimeHome"].includes(VALUES[flag]) ? path.resolve(value) : value;
    } else throw new KitError(`unknown option ${rest[i]}`);
  }
  const chosen = [opts.claude && "claude-code", opts.codex && "codex"].filter(Boolean);
  opts.integrations = chosen.length ? chosen : [...INTEGRATIONS];
  if (command === "update" && !opts.version) throw new KitError("update needs --version vX.Y.Z");
  if (opts.backup && opts.latest) throw new KitError("pass --backup or --latest, not both");
  return { command, opts };
};

/* Output that cannot be written (a closed pipe: EPIPE) is dropped, so a
   reader that goes away never aborts a sequence of writes to the hosts'
   files halfway through. */
const quietWhenClosed = (stream) => {
  let closed = false;
  stream.on?.("error", () => {
    closed = true;
  });
  return (text) => {
    if (closed) return;
    try {
      stream.write(text);
    } catch {
      closed = true;
    }
  };
};

export const main = async (argv, { env = process.env, stdout = process.stdout, stderr = process.stderr } = {}) => {
  const toStdout = quietWhenClosed(stdout);
  const toStderr = quietWhenClosed(stderr);
  const log = (line) => toStderr(`${line}\n`);
  const out = (text) => toStdout(text);
  try {
    if (!argv.length || ["help", "--help", "-h"].includes(argv[0])) {
      out(HELP);
      return argv.length ? 0 : 2;
    }
    const { command, opts } = parseArgs(argv);
    const handler = COMMANDS[command];
    if (!handler) throw new KitError(`unknown command ${command}; try help`);
    const paths = resolvePaths(opts, env);
    return await handler(opts, paths, (line) => out(`${line}\n`), out);
  } catch (error) {
    if (error instanceof KitError || error instanceof EditError) {
      log(`j3w1-terminal: ${error.message}`);
      return 1;
    }
    throw error;
  }
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2));
}
