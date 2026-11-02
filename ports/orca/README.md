# j3w1 theme for Orca

Gives Orca 1.4.246 and later the j3w1 app, editor and terminal colours.
The data-only plugin themes supported application surfaces through public
colour tokens, including sidebars, tabs, settings and structured agent views.
TextMate scopes colour code, including green inserted text and red deletions.
Status: experimental; structural validation is separate from live import evidence.

## App, editor and terminal plugin (recommended)

From a checkout, generate the files and load the plugin folder:

```powershell
npm run generate
orca plugin validate ./ports/orca/dist --json
orca plugin dev load ./ports/orca/dist --json
```

Keep `orca-plugin.json`, `app-theme.json` and `terminal-theme.json` together.
The plugin contains data only: no executable entry point or capabilities.
It requires Orca 1.4.246 or newer. Enable plugins in Settings if Orca reports
that the plugin system is disabled.

In Settings > Appearance:

1. Select **Dark** mode and **j3w1** as the Dark theme.
2. Select **Same as app theme** for the Dark editor theme.
3. Select **j3w1** as the terminal Dark Theme. Remove old custom colour
   overrides, or import the current `config.ghostty` to update them; overrides
   take precedence over a selected terminal palette.
4. Use the app theme for sidebar appearance. A separately configured sidebar
   tint or Match Terminal mode can override the app theme's sidebar colours.

The app and editor theme applies to Orca-rendered Claude and Codex chats.
CLI agent tabs additionally need the terminal palette and their respective
[Claude Code](../claude-code/README.md) and [Codex](../codex/README.md) ports.
The plugin preserves font size, zoom and layout. Orca retains its own trust
and approval dialog colours, geometry, focus behavior and unsupported syntax
selectors. It owns diff backgrounds; the theme supplies supported syntax
foregrounds and terminal ANSI slots without injecting CSS.

To restore, select the previous app, editor and terminal themes and run
`orca plugin dev unload ./ports/orca/dist --json`. Keep the loaded folder at a
stable path: development loading watches it for updates. This is a local
installation, not a public plugin-catalog release.

## Host limits in Orca 1.4.246

Application panels, menus, resource manager and browser chrome use black fills;
rose carries ordinary text and red carries boundaries. Input backgrounds are
black, including the address field. Orca shares its input token with idle input
borders, so those borders also become black; focus rings and the browser address
field's separate outer red border remain.

Orca shares primary color between active links, buttons and input selections.
The port uses readable red with black text on primary fills, so links such as
Settings → Agents remain visible. A dark-red selection with rose text cannot
be configured independently of those links in this host version. Terminal and
editor selections keep their separately supported palette.

Some surfaces are not exposed by the public theme contract:

- The browser loading line uses the private callout-note color, and tab loading spinners and fallback
  icons use a fixed blue utility. A data theme cannot replace these colors.
- Tooltips invert the ordinary foreground and background, producing rose fills.
  There is no independent tooltip token.
- Plain prose selection and explicitly system-colored selections can retain
  Chromium blue; only shared input selection uses the primary colors above.
- Sleeping/disconnected workspaces and some navigation labels apply host-owned
  opacity. Theme colors do not remove those opacity reductions.
- Websites inside browser tabs own their document colors. The app theme styles
  browser chrome, not external page content.

These limits require host theme hooks; the plugin does not patch Orca binaries
or inject unsupported CSS.

## Legacy Ghostty installer

The following PowerShell lifecycle remains available for terminal settings
and font import. It does not install or select the full app plugin above.

You need Windows, [PowerShell 7.4 or later](https://learn.microsoft.com/powershell/scripting/install/installing-powershell-on-windows)
(`winget install Microsoft.PowerShell`), Orca started at least once, and the
`SauceCodePro NFM` font from the [Nerd Fonts](https://github.com/ryanoasis/nerd-fonts/releases)
`SourceCodePro` download. Without the font the installer stops and says how to
get it; `-SkipFontCheck` goes on without it.

## Legacy install

<!-- install:start -->
Release v3.0.0 (commit `f0e9e25a00357c0b47ae3d1392b87e5bc0aa91e6`).

1. Quit Orca, including its tray icon. Then paste this into PowerShell 7 (`pwsh`):

   ```powershell
   & ([scriptblock]::Create((Invoke-RestMethod https://raw.githubusercontent.com/j3w1/theme/f0e9e25a00357c0b47ae3d1392b87e5bc0aa91e6/ports/orca/install/Get-J3w1Orca.ps1))) -Revision f0e9e25a00357c0b47ae3d1392b87e5bc0aa91e6 -Apply
   ```

   It downloads this release, checks it, applies it and runs the checks.
2. Start Orca.
3. Open a terminal in Orca and run the test. It draws the colours and prints PASS or FAIL for each setting:

   ```powershell
   pwsh -NoProfile -File "$env:LOCALAPPDATA\j3w1-theme\orca\releases\f0e9e25a00357c0b47ae3d1392b87e5bc0aa91e6\ports\orca\install\Test-J3w1OrcaTheme.ps1"
   ```
<!-- install:end -->

If Orca is still open, the installer leaves Orca's settings alone (Orca would
overwrite them), writes only the Ghostty file and prints three steps to finish
in Orca:

1. Settings > Terminal > Import from Ghostty > Apply Changes
2. Settings > Terminal > Color Contrast > Off
3. Settings > Appearance > Left Sidebar Appearance > Match Terminal

Or quit Orca and paste the command again.

**Without the installer:** download `config.ghostty` from the Downloads table
in the repository README, save it as `%APPDATA%\ghostty\config.ghostty` (back
up any `config.ghostty` or `config` already there: Orca merges every Ghostty
config it finds), then in Orca choose Settings > Terminal > Import from
Ghostty > Apply Changes. On macOS or Linux use `~/.config/ghostty/config.ghostty`.
No backup or restore on this route.

## Update

<!-- update:start -->
When a newer release is out, open this page on the site's Ports page or on the repository's main branch: its Install command names the newest release. Quit Orca and paste it. It downloads that release, applies it and runs the checks.
<!-- update:end -->

A newer release's Install command applies over this one and keeps the
backups. To move to a specific release tag, or back to an older one, run
`Update-J3w1OrcaTheme.ps1 -Version` with that tag from the release folder; it
shows what changes, key by key, before it writes. Tags before v3.0.0 have no
installer and are refused.

## Restore

<!-- restore:start -->
Quit Orca (tray icon too), then run:

```powershell
pwsh -NoProfile -File "$env:LOCALAPPDATA\j3w1-theme\orca\releases\f0e9e25a00357c0b47ae3d1392b87e5bc0aa91e6\ports\orca\install\Restore-J3w1OrcaTheme.ps1"
```
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
  - `leftSidebarAppearanceMode` = Match Terminal, at the owner's request; it
    affects the legacy terminal-derived sidebar. The app plugin above themes
    the full app independently.
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
  - `pre-kit\orca-data.json`: one full copy of Orca's settings (your whole
    private Orca store) from before the first run that wrote anything; never
    overwritten and never used by restore. Delete it when you no longer want
    it.

Every value comes from the commit in the install command. The export must
match `exports/digests.json` from the same commit when it is downloaded and
again on every run. Test also checks it against the digest the last apply
recorded. Before writing anything the installer plans every change and makes a
backup; a problem found while planning stops the run with nothing written.
`-WhatIf` prints the plan and writes nothing.

## Agnoster shell prompt

`dist/agnoster.zsh` assigns the canonical prompt roles to Agnoster's configurable
segments: rose text, a dark-red path, a warm near-black Git branch and black
context/environment fills. The path and branch remain visually distinct. Dirty
Git state keeps its existing `±` / `✚` markers; errors and root warnings retain
semantic foregrounds. This changes prompt branding without changing green ANSI
diffs or status text. Load it **after** oh-my-zsh/Agnoster; it does not replace
prompt functions or change other themes. Agnoster's hard-coded Conda and
Terraform segments are outside these configurable variables.

The same optional Zsh file sets GNU `ls` ordinary files to rose, directories
to bright rose, links to muted rose and missing/broken links to danger red.
It preserves existing executable, permission and extension rules, and repeated
sourcing replaces only these owned type entries. This is independent of ANSI
blue used by code, links and status in other programs.

Copy `dist/agnoster.zsh` to `~/.config/j3w1-theme/agnoster.zsh`, preserving a
backup if it already exists, then source it from your final shell configuration:

```zsh
source "$HOME/.config/j3w1-theme/agnoster.zsh"
```

On CE Devbox, put that line in `~/.config/ce-devbox/zshrc.local`, the supported
user override sourced after its generated `.zshrc`. If its older generated
`/etc/profile.d/ce-theme.sh` resets the terminal palette, use its documented
opt-out, `export CE_THEME=off` in `~/.zshenv`, to keep Orca's selected terminal
theme authoritative. Preserve existing file contents; do not edit generated
system files. This opt-out requires the terminal itself to have the current
theme installed. It does not migrate CE Devbox's console, Hermes or browser
theme. Existing shells can load the prompt with the source command above;
new shells load the final override automatically. Active agents need no restart.

## Public app color coverage

The plugin explicitly maps all 66 public app tokens accepted by Orca 1.4.246,
including workspace selection, host badges, active/inactive tabs, split dividers,
chat user messages, links, diff fills and Git decorations. This prevents omitted
tokens from falling back to Orca's stock colors. Buttons and selected rows use
rose foregrounds on dark canonical surfaces. Semantic green remains for additions
and added/untracked files. Character diff emphasis uses the same dark semantic
fill as the line, preserving readable syntax instead of a saturated opaque fill.

App tokens color Orca-owned browser chrome and notifications where those surfaces
consume the public app roles. They do not style external web pages such as GitHub;
those pages own their content CSS. Browser profiles or explicit site theming are a
separate integration, not an effect claimed by this plugin.

Orca 1.4.246 hardcodes sleeping-workspace text to a 52% OKLab mix with the sidebar
background. Its sidebar navigation also uses 60% text and 30% icon opacity. These
factors have no public theme token. Bright rose sidebar text improves the base
color but cannot remove the host's dimming. The repository does not patch Orca's
private styles or configuration to override it.

Orca's standard tooltip component also inverts the global foreground/background
roles (`bg-foreground text-background`). Orca 1.4.246 exposes neither tooltip
color tokens nor a documented custom-CSS field in its strict app-theme schema.
A black tooltip with rose text therefore requires an Orca-side theme hook;
changing the global foreground to black would make the rest of the app unreadable.
The status bar uses the shared card surface and border tokens, not an independent
status-bar token. The plugin maps these to black and canonical red respectively;
other cards and separators share those colors.

Ordinary app-text selection has no public theme token or global selection override.
Orca leaves it to Chromium/system Highlight colors. Some workspace detail inputs
explicitly request Highlight/HighlightText; the shared input component instead
uses the primary/primary-foreground roles for selection. The plugin maps this
shared pair to a visible dark-red selection fill and bright rose text, which also
colors primary buttons. Terminal selection is
independently mapped by the terminal theme.

## Limits

These are Orca's limits; Apply and Test print them every time.

- Bold text in the first eight colours is drawn in the bright eight. Orca
  1.4.209 always turns this on and has no setting for it.
- Light mode gets the same dark colours: Orca stores one set of colour
  overrides for both modes.
- The legacy Ghostty route alone does not theme tabs, the right sidebar,
  status bar or settings. Use the app plugin above for those surfaces.
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
- `src/theme.json`: public Orca app tokens, TextMate scopes and terminal keys.
- `dist/`: generated Ghostty config and data plugin files; do not edit them.
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

To mark this port `verified`, record a real import into a recorded Orca
version (version, OS, font, scaling, artifact digest) as described in
[Capability details and import verification](../README.md#capability-details-and-import-verification),
and add the version to `testedVersions`.

To change what Orca shows, change the specification through a `proposed`
entry in `spec/decisions.md`; pointing `host.json` at a different role is a
specification change too.
