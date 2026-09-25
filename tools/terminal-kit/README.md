# j3w1 terminal kit

Installs the j3w1 **approved default profile** into the three places a
terminal session on this workstation takes colour from, verifies it, and
takes it out again.

| Layer | Runs on | What the kit writes | Where every value comes from |
| --- | --- | --- | --- |
| Orca terminal | the Orca desktop client (Windows) | Orca terminal settings; a managed block in `%APPDATA%\ghostty\config.ghostty` | `roles/terminal.json`: `color.terminal.*`, `color.border.divider`, `font.family.mono` |
| Claude Code | the devbox | `themes/j3w1.json` (base `dark-ansi`); `"theme": "custom:j3w1"` | `roles/claude-code.json`: text, surface, border, interaction, status, diff and chart roles |
| Codex | the devbox | `themes/j3w1.tmTheme`; `[tui] theme = "j3w1"` | `roles/codex.json`: the code-editor syntax roles, diff and text roles |

The kit is a consumer of this repository and follows `agents/consume.md`:

- It reads `exports/tokens.resolved.json` at the revision pinned in
  `kit.json` (`v1.2.0`, commit `0838171…`), after checking that the tag still
  resolves to that commit and that the file matches `exports/digests.json`.
- It maps roles, never primitives, and only roles whose eligibility is `use` or
  `use-and-report`. The `use-and-report` roles, `color.border.divider` (the
  Orca pane divider) and `color.border.overlay` (Claude Code's dialog border),
  both pending under D-008, are disclosed on every run.
- It writes a `theme.lock.<integration>.json` and prints its deviations.
- It has no colour values of its own; `tests/terminal-kit.test.js` fails on
  any hex literal under this directory.

## Why the terminal keeps the heritage slots

The terminal specification carries the sixteen `Xresources` slots exactly and
forbids changing them to suit a program (`spec/components/terminal.md`,
`spec/foundations.md` § Code and terminal). The kit therefore installs the
same palette as `ports/orca/dist/config.ghostty`, except the font size, which
stays the size you already use. Orca's Color Contrast is turned off so xterm
cannot recolour the slots.

Differentiation for Claude Code and Codex comes from their own theme layers,
built only from approved roles:

- green, amber and blue appear only in status and diff roles (D-001);
- your messages sit on `surface.raised` instead of the slot-8 red block;
- picker selection, borders and the accent use the red focus roles;
- `/usage` uses the single-series chart roles.

Programs that name ANSI slots directly still draw in the heritage slots,
because the spec leaves slot meaning to the program.

## Devbox: Claude Code and Codex

```sh
cd ~/dev/theme    # or any checkout that contains this kit
node tools/terminal-kit/devbox/j3w1-terminal.mjs apply --dry-run
node tools/terminal-kit/devbox/j3w1-terminal.mjs apply
node tools/terminal-kit/devbox/j3w1-terminal.mjs test
```

| Command | What it does |
| --- | --- |
| `apply [--claude] [--codex] [--dry-run]` | Plans every change, backs up, then writes both theme files and sets the two keys. Uses the installed pin once there is one. Makes no backup when nothing changes. |
| `test [--no-specimen]` | Renders the specimen, then prints PASS/FAIL/WARN for every managed file and key. |
| `update --version vX.Y.Z` | Moves to an explicit release tag and records the new pin; never follows a branch. |
| `restore [--backup <ts> \| --latest] [--dry-run]` | Undoes every apply and update since the last restore: each key returns to its earlier value (or is removed), and theme files the kit created are deleted. It warns before touching a file changed since the kit wrote it. |
| `specimen` | Renders the specimen only. |

`--help` lists every option.

- **State directory.** The kit keeps backups and manifests in
  `${XDG_STATE_HOME:-~/.local/state}/j3w1-theme/devbox`. Where that location is
  not writable (on the CE devbox, `~/.local/state` admits only registered tool
  folders), set `J3W1_TERMINAL_KIT_STATE_DIR` or pass `--state-dir`; the kit
  stops before changing anything if it cannot write its state.
- **Run it against the right account.** The CLI follows `CLAUDE_CONFIG_DIR`
  and `HOME`, so inside an agent session it acts on that session's
  configuration.
- **Restart once.** Running Claude Code sessions need one restart the first
  time, because `themes/` did not exist when they started. After that, edits
  reload live.
- **Codex in Orca.** Codex picks up the theme in new sessions. Orca links
  `~/.codex/themes` into its Codex runtime home and syncs `tui.theme` at each
  Codex pane launch, so nothing Orca owns is written.

## Windows: Orca

Follow [`windows/README.md`](windows/README.md). In short:

1. Install PowerShell 7 (`winget install Microsoft.PowerShell`).
2. Install the `SauceCodePro NFM` font (Nerd Fonts `SourceCodePro` release).
3. Fetch the kit by commit SHA with `Get-J3w1Kit.ps1`.
4. Quit Orca, including the tray icon, then run `Apply-J3w1OrcaTheme.ps1`.
   Start Orca and run `Test-J3w1OrcaTheme.ps1` in an Orca terminal.

If Orca is running, Apply writes only the Ghostty block and prints the three
Settings steps that finish the job (Import from Ghostty, Color Contrast Off,
Left Sidebar Appearance Match Terminal). `Restore-J3w1OrcaTheme.ps1` undoes
every apply and update since the last restore, key by key; when the kit never
saw a key's earlier value (because Orca wrote it during a Ghostty import), it
says so instead of guessing.

Besides the terminal colours, contrast, divider and terminal font, the kit sets
Left Sidebar Appearance to Match Terminal, because you asked for it. It keeps the
terminal font size you already use (it sets one only when Orca has none) and
never changes your interface theme, IDE font, zoom, line height, cursor, shell
or any other Orca preference; it records those values in the
manifest and warns if they differ from `orca.expectedPreferences`.

## What stays manual

- **Windows.** Running the scripts, and quitting Orca first when you want the
  store written directly.
- **Claude Code.** Restarting sessions that were already running when
  `themes/` was first created.

## Limitations

Each one is recorded as a deviation in the role maps and printed by `test`:

- **Orca 1.4.209:**
  - No app-chrome appearance setting: tabs, the right sidebar, the status bar
    and the settings pages follow Orca's own theme. Only the left sidebar can
    match the terminal.
  - Bold is always drawn in the bright slots.
  - The overrides apply in light mode too.
- **Claude Code:**
  - Highlighted code, links (slot 12), diff +/− markers and file previews use
    fixed ANSI slots that no theme reaches.
  - Word-level diff changes can only be a background, so they keep the line
    tint.
- **Codex:**
  - Status, diff signs, brand and status line use slots 1–6.
  - The prompt and composer fills are computed from the terminal background.
  - Only bold is rendered from a tmTheme.

## Changing colours

The kit applies the theme; it does not decide it. To change what any layer
shows, change the specification through a `proposed` entry in
`spec/decisions.md`, then move the kit's pin with `update --version`. Editing
a role map to point at a different role is a spec-scope change and needs the
same review.

## Files

- `kit.json`: the pin, export paths and eligibility rule.
- `roles/*.json`: one map per integration, with the deviations.
- `specimen.json`: the verification specimen.
- `windows/`: the PowerShell 7 scripts.
- `devbox/`: the Node CLI.
- Tests: `tests/terminal-kit.test.js` and `tests/terminal-kit-windows.test.js`.
