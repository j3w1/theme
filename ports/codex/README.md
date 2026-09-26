# j3w1 theme for Codex

A syntax theme for the Codex CLI, `j3w1`, built only from approved roles. It
uses the opt-in coloured code roles (D-030): green strings; amber numbers,
constants, functions, attributes and escapes; blue types and properties;
bright-rose operators. Keywords, tags, comments, variables and punctuation
keep the rose code roles. Everything for Codex is in this folder. Status:
experimental (no recorded import evidence yet).

You need Node 24, Git and a clone of this repository (with `npm ci` done),
and Codex CLI 0.156.1 or later. Codex also uses the terminal's colours (see
Limits), so install the terminal theme too, for example
[`../orca/`](../orca/README.md).

## Install

<!-- install:start -->
Install commands appear here once v3.0.0 is released.
<!-- install:end -->

The installer writes the theme file and one setting, and prints what it did.
Add `--dry-run` to see the plan first.

**Without the installer:** save `dist/j3w1.tmTheme` as
`~/.codex/themes/j3w1.tmTheme` and set `theme = "j3w1"` under `[tui]` in
`~/.codex/config.toml`. This route has no backup or restore.

## Update

After `git pull`, `node ports/codex/install.mjs apply` installs the commit
your clone is on. To install a release by its tag instead, run
`node ports/codex/install.mjs update --version` with the tag, for example
`v3.0.0`; it prints what changes, value by value. Tags before v3.0.0 are
refused. Values always come from git objects at that commit, never from files
you have edited.

## Restore

```sh
node ports/codex/install.mjs restore
```

It puts `theme` under `[tui]` back to what it was (or removes it, and the
`[tui]` table if the installer added it) and deletes the theme file if the
installer created it. It restores Codex only; Claude Code has its own
installer.

- `--latest` undoes only the newest change; `--backup <name>` undoes that one
  backup. `--dry-run` shows the plan.
- If a value changed after the installer set it, restore warns, puts back the
  earlier value and keeps the replaced one in its own backup.
- If a restore stops partway, it says which command finishes it.

## What it changes

- `~/.codex/themes/j3w1.tmTheme`: created or replaced.
- `theme = "j3w1"` under `[tui]` in `~/.codex/config.toml`. Only that line
  changes; comments, other keys, tables and line endings are kept. Forms the
  line editor could get wrong (dotted keys, inline tables, a repeated `[tui]`)
  are refused, and every edit is checked with a TOML parser before it is
  written.
- It always uses `~/.codex`, never `$CODEX_HOME`: inside an Orca pane that
  variable names Orca's runtime copy. `--codex-home` picks another folder.
- **Codex in Orca.** Orca links `~/.codex/themes` into its Codex runtime home
  and copies `tui.theme` at each Codex pane launch, so the installer never
  writes anything Orca owns. `test` checks that runtime home read-only.
- Backups and records go to `${XDG_STATE_HOME:-~/.local/state}/j3w1-theme`,
  shared with the Claude Code installer. Set `J3W1_THEME_STATE_DIR` or pass
  `--state-dir` where that folder is not writable (on the CE devbox,
  `~/.local/state` takes only registered tool folders). The older
  `J3W1_TERMINAL_KIT_STATE_DIR` still works, with a warning. If the state
  folder is not writable, nothing is changed.

Before writing anything it plans every change and checks each edited file
with a real parse. Each file is read again just before its write; if another
program changed it, that file is planned again once, and if it changes again
the run stops. The export must match `exports/digests.json` from the same
commit. `test` checks the commit that is installed, even after your clone
moves on.

**New sessions only.** A running Codex keeps the theme it started with.

## Limits

These are Codex's limits; `test` prints them.

- Status, diff signs, the brand and the status line use terminal colours 1 to
  6 that Codex names; no theme reaches them.
- The prompt and composer backgrounds are computed from the terminal
  background.
- Codex draws only bold from a theme: comments are not italic, and links and
  invalid code are not underlined.
- Codex paints no code background, current line, selection, gutter or find
  highlight, and no tint for modified lines. The file still carries them.
- Inside diff lines Codex keeps the code colours on the line tint. Headings,
  invalid code and the Codex accent measure about 4.2:1 there, below 4.5:1.

## Files

- `install.mjs`: the installer. Its code is shared with the Claude Code
  installer in `scripts/lib/host-install/`.
- `host.json`: which theme setting takes which role, and the limits above.
- `dist/j3w1.tmTheme`: the theme file, generated from `host.json` by
  `npm run generate`; do not edit it.
- `port.json`, `mapping.json`, `capabilities.json`: the port's scope, every
  native key, and the reason for each role that is not mapped.

Tests: `tests/host-install.test.js`. To change what Codex shows, change the
specification through a `proposed` entry in `spec/decisions.md`; pointing
`host.json` at a different role is a specification change too.
