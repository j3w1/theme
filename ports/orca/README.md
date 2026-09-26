# j3w1 theme for Orca

Gives Orca's terminal the j3w1 colours: the sixteen terminal colours,
background, text, cursor, selection, the pane divider and the terminal font.
Everything for Orca is in this folder. Status: experimental (no recorded
import evidence yet).

You need Windows, [PowerShell 7.4 or later](https://learn.microsoft.com/powershell/scripting/install/installing-powershell-on-windows)
(`winget install Microsoft.PowerShell`), Orca started at least once, and the
`SauceCodePro NFM` font from the [Nerd Fonts](https://github.com/ryanoasis/nerd-fonts/releases)
`SourceCodePro` download. Without the font the installer stops and says how to
get it; `-SkipFontCheck` goes on without it.

## Install

<!-- install:start -->
Install commands appear here once v3.0.0 is released.
<!-- install:end -->

If Orca is still open, the installer does not touch Orca's settings (Orca
would overwrite them). It writes only the Ghostty file and prints three steps
to finish in Orca:

1. Settings > Terminal > Import from Ghostty > Apply Changes
2. Settings > Terminal > Color Contrast > Off
3. Settings > Appearance > Left Sidebar Appearance > Match Terminal

Or quit Orca and paste the command again.

**Without the installer:** download `config.ghostty` from the Downloads table
in the repository README, save it as `%APPDATA%\ghostty\config.ghostty` (back
up any `config.ghostty` or `config` already there: Orca merges every Ghostty
config it finds), then in Orca choose Settings > Terminal > Import from
Ghostty > Apply Changes. On macOS or Linux use `~/.config/ghostty/config.ghostty`.
This route has no backup or restore.

## Update

<!-- update:start -->
Commands appear here once v3.0.0 is released.
<!-- update:end -->

The Install command of a newer release applies it over this one and keeps the
backups. To move to a specific release tag, or back to an older one, run
`Update-J3w1OrcaTheme.ps1 -Version` with that tag from the release folder: it
shows what changes, key by key, before it writes. Tags before v3.0.0 have no
installer and are refused.

## Restore

<!-- restore:start -->
Commands appear here once v3.0.0 is released.
<!-- restore:end -->

Restore puts back every setting the installer changed since your last
restore, key by key, and takes its block out of `config.ghostty`. It leaves
everything else alone, including settings the installer never wrote.

- `-Latest` undoes only the newest apply or update; `-Backup <folder name>`
  goes back to the state before that backup. `-WhatIf` shows the plan.
- If a value changed after the installer set it, restore warns and still puts
  back the earlier value.
- If a value was already the theme's before any record (for example after its
  state folder was deleted and Orca had imported the block), restore cannot
  know what it was before. It says so, leaves that key, and exits 3.
- With Orca open it restores only the Ghostty file and exits 2; quit Orca and
  run it again.
- If a restore stops partway, it says which command finishes it. Run exactly
  that one.

Exit codes: 0 done, 1 error, 2 Orca was open, 3 some keys left because their
earlier value is unknown.

## What it changes

- **Orca settings** (only while Orca is closed):
  - `terminalColorOverrides`: the sixteen colours, text, background, cursor
    and selection.
  - `terminalMinimumContrastRatio` = 1, which is Color Contrast Off. Any other
    value lets Orca change the colours.
  - `terminalDividerColorDark` and `terminalDividerColorLight`: the pane divider
    (`color.border.divider`, use-and-report under D-008; every run says so).
  - `terminalFontFamily`: `SauceCodePro NFM`.
  - `leftSidebarAppearanceMode` = Match Terminal, because the owner asked for
    it. It is the only part of Orca's window that can follow the terminal.
- **`%APPDATA%\ghostty\config.ghostty`**: one marked block. Every line outside
  it is kept, byte for byte. A symbolic link is written through and stays a
  link. A file with two marked blocks is refused until you delete one.
- **Never changed**: the font size (the block carries the size you already
  use, or none), your interface theme, IDE and editor fonts, zoom, line
  height, cursor, shell and every other Orca preference. They are recorded and
  reported, and Test warns if they change.
- **Its own files**, in `%LOCALAPPDATA%\j3w1-theme\orca\`:
  - `releases\`: one folder per downloaded release, named by its commit (the
    scripts, `host.json`, the specimen and the export).
  - `current\`: the last record, the Ghostty block and `theme.lock.orca.json`.
  - `backups\<time>\`: one record per run, plus a copy of `config.ghostty`
    when the run changed it. Records name only the installer's keys.
  - `pre-kit\orca-data.json`: one full copy of Orca's settings from before the
    first run that wrote anything. It holds your whole private Orca store. It
    is never overwritten and restore never uses it; delete it when you no
    longer want it.

Every value comes from the commit in the install command. The export must
match `exports/digests.json` from the same commit when it is downloaded and
again on every run. Test also checks it against the digest the last apply
recorded. Before writing anything the installer plans every change and makes a
backup; a problem found while planning stops the run with nothing written.
`-WhatIf` prints the plan and writes nothing.

## Limits

These are Orca's limits; Apply and Test print them every time.

- Bold text in the first eight colours is drawn in the bright eight. Orca
  1.4.209 always turns this on and has no setting for it.
- Light mode gets the same dark colours: Orca stores one set of colour
  overrides for both modes.
- Tabs, the right sidebar, the status bar and the settings pages follow Orca's
  own theme. Only the left sidebar can match the terminal.
- The terminal has no current-line highlight.
- Programs choose which colour means what; the theme only sets the sixteen.
- The Warp-format file in `../warp/` also imports through Orca's Import from
  YAML, but it carries colours only, and Orca gives it one second to parse.

## Files

- `install/`: the scripts. `Get-J3w1Orca.ps1` downloads a release and, with
  `-Apply`, installs it; `Apply-`, `Test-`, `Update-` and
  `Restore-J3w1OrcaTheme.ps1` run from the release folder; `J3w1Orca.psm1`
  holds every rule.
- `install/specimen.json`: the Test specimen, generated from
  `src/specimen.json` with the Claude Code and Codex previews resolved to
  tokens. Do not edit it.
- `host.json`: which Orca setting takes which role, and the limits above.
- `dist/config.ghostty`: generated from `mapping.json`; do not edit it.
- `port.json`, `mapping.json`, `capabilities.json`: the port's scope, every
  native key, and the reason for each role that is not mapped.

## For maintainers

`tests/orca-install.test.js` drives the scripts through `pwsh` (from `PATH` or
`$J3W1_PWSH`) in a fake Windows profile. The test seam (`J3W1_KIT_TEST_ROOT`,
`J3W1_KIT_TEST_ORCA_RUNNING`, `J3W1_KIT_TEST_FONTS`) maps APPDATA and
LOCALAPPDATA under that root and turns the network off; it refuses a root
that maps onto the real folders and is never active otherwise. Inside the seam
only, `J3W1_KIT_TEST_SOURCE=worktree` lets a plain folder be the source; such
a run is marked not verified and writes no lock. Run from a clone, the scripts
read git objects at HEAD, so commit before you run the tests.

To mark this port `verified`, import it into a recorded Orca version, record
the version, OS, font, scaling and artifact digest as a real-import protocol
under `evidence/` (validated by `schemas/json/port-import-evidence.schema.json`
and bound to the current `portSubject`), and add the version to
`testedVersions`. A parse check is not an import.

To change what Orca shows, change the specification through a `proposed`
entry in `spec/decisions.md`. Pointing `host.json` at a different role is a
specification change too.
