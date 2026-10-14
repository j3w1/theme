# j3w1 theme for Codex

A syntax theme for the Codex CLI, `j3w1`, built only from approved roles. It
uses the opt-in coloured code roles (D-030): green strings; amber numbers,
constants, functions, attributes and escapes; blue types and properties;
bright-rose operators. Keywords, tags, comments, variables and punctuation
keep the rose code roles. Status: experimental (no recorded import evidence).

Needs Node 24, Git, a clone of this repository (with `npm ci` done) and Codex
CLI 0.156.1 or later. Codex also uses the terminal's colours (see Limits), so
install a terminal theme too, for example [`../orca/`](../orca/README.md).

## Install

<!-- install:start -->
Release v3.0.0 (commit `f0e9e25a00357c0b47ae3d1392b87e5bc0aa91e6`).

1. In your clone of this repository (`~/dev/theme` on the CE devbox; if you have none, run `git clone https://github.com/j3w1/theme.git ~/dev/theme` and `cd` into it), paste:

   ```sh
   git pull --ff-only --tags && npm ci
   node ports/codex/install.mjs apply --revision f0e9e25a00357c0b47ae3d1392b87e5bc0aa91e6
   ```

   `npm ci` installs the TOML parser the installer uses to check `config.toml` before it writes anything.
2. Start a new Codex session. A running session keeps the theme it started with.
3. Check it:

   ```sh
   node ports/codex/install.mjs test
   ```
<!-- install:end -->

The installer behaves as described in
[Claude Code and Codex installers](../README.md#claude-code-and-codex-installers):
`--dry-run`, `update --version`, `restore`, backups and state folder.

**Without the installer:** save `dist/j3w1.tmTheme` as
`~/.codex/themes/j3w1.tmTheme` and set `theme = "j3w1"` under `[tui]` in
`~/.codex/config.toml`.

## Update

`node ports/codex/install.mjs apply` after `git pull`, or
`node ports/codex/install.mjs update --version v3.0.0` for a release tag; it
prints what changes, value by value.

## Restore

```sh
node ports/codex/install.mjs restore
```

Puts `theme` under `[tui]` back to what it was (or removes it, and the `[tui]`
table if the installer added it) and deletes the theme file if the installer
created it. Codex only.

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

**New sessions only.** A running Codex keeps the theme it started with.

## Limits

Codex's own; `test` prints them.

- Status, diff signs, the brand and the status line use terminal colours 1 to
  6 that Codex names; no theme reaches them.
- The prompt and composer backgrounds are computed from the terminal
  background.
- Codex draws only bold from a theme: comments are not italic, and links and
  invalid code are not underlined.
- Codex paints no code background, current line, selection, gutter or find
  highlight, and no tint for modified lines. The file still carries them.
- Inside diff lines Codex keeps the code colours on the line tint; headings,
  invalid code and the Codex accent fall below 4.5:1 there.

## Files

- `install.mjs`: the installer (shared code in `scripts/lib/host-install/`).
- `host.json`: which theme setting takes which role, and the limits above.
- `dist/j3w1.tmTheme`: the theme file, generated from `host.json` by
  `npm run generate`; do not edit it.
- `port.json`, `mapping.json`, `capabilities.json`: the port's scope, every
  native key, and the reason for each role that is not mapped.
