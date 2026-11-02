# Application ports

One folder per app, holding its theme files, its installer if it has one, and
one guide.

## One-click setup from a checkout

Use a reviewed Git checkout with Node 24 and Git on your PATH. Check out the
release tag or reviewed candidate you want before setup: the common entry point
uses that checkout's committed HEAD, rather than edited theme files or an
unpinned download. The setup below is available in this checkout; the published
release commands farther down still refer to the recorded release.

On Windows, double-click [setup.cmd](../setup.cmd) in the repository root and
choose the ports to install. From any supported platform, run the same menu
from the repository root:

```sh
node setup.mjs
```

To select ports directly, or preview the plan:

```sh
node setup.mjs --ports orca,claude-code,codex
node setup.mjs --ports orca,claude-code,codex --dry-run
```

`--ports all` selects the ports supported on the current platform. Obsidian is
included only when `--vault` is supplied; explicitly selecting Obsidian without
a vault is an error. Add `--non-interactive` for an unattended run with an
explicit port selection. The common setup does not install the target apps.
It installs repository dependencies when the Codex TOML parser is missing;
`--skip-dependencies` keeps dependency installation under your control.

| Port | What setup prepares or installs | Remaining app step |
| --- | --- | --- |
| Orca | Copies and registers the app/editor/terminal data plugin in a retained local folder | Select j3w1 for app, editor and terminal in Appearance; remove conflicting terminal overrides |
| Claude Code | Runs its existing theme installer and installed-file check | Restart sessions that do not reload the changed theme |
| Codex | Runs its existing theme installer and installed-file check | Open a new Codex session |
| Windows | Runs the existing compatibility-aware installer and its checks | Reopen affected apps; inspect appearance |
| Obsidian on Windows | Runs the existing helper with the committed theme pair and an explicit vault | Keep Obsidian closed during setup, then select the dark j3w1 theme |
| Ghostty | Installs the theme file and preserves a replaced file in a backup | Select `theme = j3w1` in Ghostty's config and reload |
| Warp | Installs the custom theme file and preserves a replaced file in a backup | Select j3w1 under Appearance |
| ChatGPT | Stages the preset file and prints its import instructions | Import the chosen preset in the app |
| Telegram | Stages the Android and Desktop files and prints their import instructions | Open the matching file and confirm Apply/Keep changes |

For example, after closing Obsidian:

```powershell
node setup.mjs --ports obsidian --vault 'C:\Users\you\Documents\MyVault'
```

The optional `--shell-prompt` flag on Linux and macOS installs the generated
Agnoster/Zsh prompt and rose file-list colors for GNU `ls`. Stock macOS BSD
`ls` keeps its native colors; use GNU `ls` to consume `LS_COLORS` there.
It adds a managed source line to
the final user shell configuration and preserves replaced content in backups.
It is not included automatically by `--ports all`. For example:

```sh
node setup.mjs --ports claude-code,codex --shell-prompt
```

Source the printed prompt file once, or open a new shell. See the
[Orca prompt guide](orca/README.md#agnoster-shell-prompt) for the Agnoster
requirement and CE Devbox's older palette override.

Windows Full mode remains the default and requires an exact supported host.
Choose `--windows-mode Native` explicitly for the reduced native mode; the
common setup does not silently substitute it when Full is unavailable.
Android Obsidian keeps its separate Termux helper and storage requirements.

To update, review and check out the intended newer revision, then repeat the
same setup selection. Keep the retained Orca plugin directory. Existing
per-port installers remain the source of backup, test and restore behavior;
the individual guides below explain those operations and host limitations.
Staging an import file or passing a structural check is not live visual
verification.

## Which one do I need

<!-- guides:start -->
| Application | Guide | Importable files |
| --- | --- | --- |
| ChatGPT desktop app (Appearance) | [chatgpt](chatgpt/README.md) | `presets.json` |
| Claude Code (custom theme) | [claude-code](claude-code/README.md) | `j3w1.json` |
| Codex CLI (tmTheme) | [codex](codex/README.md) | `j3w1.tmTheme` |
| Ghostty theme | [ghostty](ghostty/README.md) | `j3w1` |
| Obsidian theme | [obsidian](obsidian/README.md) | `manifest.json`, `theme.css` |
| Orca (app, editor and terminal) | [orca](orca/README.md) | `config.ghostty`, `orca-plugin.json`, `app-theme.json`, `terminal-theme.json`, `agnoster.zsh` |
| Telegram Android and Desktop | [telegram](telegram/README.md) | `j3w1.attheme`, `j3w1.tdesktop-theme` |
| Warp theme YAML (also Orca's Import from YAML) | [warp](warp/README.md) | `j3w1.yaml` |
| Windows 11 native and Windhawk theme | [windows](windows/README.md) | `windows-settings.json`, `terminal-fragment.json`, `terminal-theme.json`, `fancyzones-layouts.json`, `windows-11-taskbar-styler.json`, `windows-11-start-menu-styler.json`, `windows-11-file-explorer-styler.json`, `windows-11-notification-center-styler.json`, `windows-11-settings-styler.json`, `j3w1-wallpaper.bmp`, `j3w1.theme`, `j3w1-arrow.cur`, `j3w1-help.cur`, `j3w1-appstarting.cur`, `j3w1-wait.cur`, `j3w1-crosshair.cur`, `j3w1-ibeam.cur`, `j3w1-nwpen.cur`, `j3w1-no.cur`, `j3w1-sizens.cur`, `j3w1-sizewe.cur`, `j3w1-sizenwse.cur`, `j3w1-sizenesw.cur`, `j3w1-sizeall.cur`, `j3w1-uparrow.cur`, `j3w1-hand.cur`, `j3w1-pin.cur`, `j3w1-person.cur`, `runtime.cjs`, `install-manifest.json`, `j3w1-explorer-native.wh.cpp`, `j3w1-explorer-native.json`, `j3w1-powertoys-preview.wh.cpp`, `j3w1-powertoys-preview.json`, `j3w1-calculator.wh.cpp`, `j3w1-calculator.json`, `j3w1-powertoys-markdown.wh.cpp`, `j3w1-powertoys-markdown.json`, `markdown-theme.css`, `j3w1-folder.ico`, `j3w1-folder-open.ico`, `j3w1-notepad-native.wh.cpp`, `j3w1-notepad-native.json`, `j3w1-notepad-chrome.wh.cpp`, `j3w1-notepad-chrome.json`, `j3w1-paint-chrome.wh.cpp`, `j3w1-paint-chrome.json`, `j3w1-terminal-chrome.wh.cpp`, `j3w1-terminal-chrome.json` |
<!-- guides:end -->

Claude Code and Codex use the terminal's sixteen colours for code, links and
status; install a terminal theme too.

All ports remain experimental: published import evidence is incomplete or
stale. Each file is also in the repository README's Downloads table and on
the site's Ports page, pinned to a release.

## Published release commands

<!-- install:start -->
Release v3.0.0 (commit `f0e9e25a00357c0b47ae3d1392b87e5bc0aa91e6`):

- **Orca** on Windows. Quit Orca first (tray icon too), then paste into PowerShell 7:

  ```powershell
  & ([scriptblock]::Create((Invoke-RestMethod https://raw.githubusercontent.com/j3w1/theme/f0e9e25a00357c0b47ae3d1392b87e5bc0aa91e6/ports/orca/install/Get-J3w1Orca.ps1))) -Revision f0e9e25a00357c0b47ae3d1392b87e5bc0aa91e6 -Apply
  ```

- **Claude Code**, in your clone of this repository:

  ```sh
  git pull --ff-only --tags
  node ports/claude-code/install.mjs apply --revision f0e9e25a00357c0b47ae3d1392b87e5bc0aa91e6
  ```

- **Codex**, in your clone of this repository:

  ```sh
  git pull --ff-only --tags && npm ci
  node ports/codex/install.mjs apply --revision f0e9e25a00357c0b47ae3d1392b87e5bc0aa91e6
  ```
<!-- install:end -->

Each app's guide has the full steps: install, update, restore, what it
changes and its limits.

Historical implementations (the owner's gedit scheme, IntelliJ scheme, tmux
and browser-extension colours) are catalogued in `references/catalogue.json`
as evidence of origin, not supported downloads.

## Claude Code and Codex installers

`ports/claude-code/install.mjs` and `ports/codex/install.mjs` share their code
(`scripts/lib/host-install/`) and this behaviour; each guide adds its own
files, settings and limits.

- `apply` writes the theme file and one setting and prints what it did; after
  `git pull` it installs the commit your clone is on. `--dry-run` shows the
  plan first.
- `update --version` with a release tag, for example `v3.0.0`, installs that
  release and prints what changes. Tags before v3.0.0 are refused. Values
  always come from git objects at that commit, never from files you have
  edited.
- `restore` undoes the installer's changes to its own app only. `--latest`
  undoes only the newest change; `--backup <name>` undoes that one backup;
  `--dry-run` shows the plan. If a value changed after the installer set it,
  restore warns, puts back the earlier value and keeps the replaced one in its
  own backup. If a restore stops partway, it says which command finishes it.
- Before writing it plans every change and checks each edited file with a
  real parse. Each file is read again just before its write; if another
  program changed it, that file is planned again once, and if it changes again
  the run stops. The export must match `exports/digests.json` from the same
  commit.
- `test` checks the installed commit, even after your clone moves on, says
  when the clone is ahead, and prints the host's limits.
- Backups and records go to `${XDG_STATE_HOME:-~/.local/state}/j3w1-theme`,
  shared by both. If only the terminal kit's old folder
  (`…/j3w1-theme/devbox`) holds backups, the installer keeps using it and says
  so, so restore still brings back your original settings. Set
  `J3W1_THEME_STATE_DIR` or pass `--state-dir` where that folder is not
  writable (on the CE devbox, `~/.local/state` takes only registered tool
  folders); the older `J3W1_TERMINAL_KIT_STATE_DIR` still works, with a
  warning. If the state folder is not writable, nothing is changed.
- Installing without the installer has no backup or restore.

Tests: `tests/host-install.test.js`. Changing what a host shows is a
specification change, made through a `proposed` entry in `spec/decisions.md`;
pointing `host.json` at a different role is one too.

## For maintainers

The port layout, statuses and emitter rules are in `spec/portability.md`,
Native ports. `port.json` is validated by `schemas/port.mjs` (its `format` is
one of `PORT_FORMATS` there); `evidence/` holds only actual records with
application version, OS and date. Generation rebuilds absent emitted files,
while validation and drift checks require them. A port with an installer also
carries `host.json` (which native key takes
which role, the host versions it was observed on, and its deviations) and the
installer itself: `install/` for Orca, `install.mjs` for Claude Code and Codex,
whose shared code is `scripts/lib/host-install/`. Their emitters call the
installers' generators, and `mapping.json` must agree with `host.json` key for
key. An installer takes every value from the commit its files came from.

`experimental` means artifacts exist and checks pass but real-target
verification is incomplete; `deprecated` carries a reason. The README support
table is generated from these manifests and says so when the directory is
empty.

`mapping.json` uses schema version 1 (`schemas/json/port-mapping.schema.json`):
`mappings` maps each theme role path to an array of native key strings;
`unmapped` maps each remaining role path to a reason. List every role in the
declared profile exactly once across those two objects. The generated usage
index reads only these declared mappings; it never infers private consumers
or treats a mapping as evidence of a successful application import.

## Capability details and import verification

Set `capabilitiesPath: "capabilities.json"` in a port manifest to publish
schema-version-1 detail through `schemas/json/port-capabilities.schema.json`.
Record integration kind, a full theme revision, explicit surface states and
reasons, every role's mapping state/surface/reason, and rollback instructions.
Each mapped classification must agree with `mapping.json` and belong to a
supported surface. Inherited, unsupported, out-of-scope and not-implemented
roles must remain unmapped. Without this file the old mapping contract stays
valid, but the explorer reports unclassified unmapped roles and missing pins.

An optional `verificationPath` identifies a real-import JSON protocol under
`evidence/`, validated by `schemas/json/port-import-evidence.schema.json`.
Record the application version, platform (`windows`, `linux`, `macos` or `android`),
actual OS version, checks, outcomes, protocol and
limits. Compute `subjectDigest` with `portSubject` in
`scripts/lib/port-capabilities.mjs` over the manifest (excluding its claimed
status and evidence list), mapping, capabilities (excluding the report path),
exact artifact hashes, current resolved profile tokens and the token-export
digest. Records can be marked verified only when that subject still matches,
the manifest declares verified, target/tested versions include the recorded
version, the recorded platform is a declared target, and all recorded checks
actually passed. A parse or synthetic fixture cannot supply a real-import
protocol.

The generator writes `exports/port-capabilities.json` for summaries, detail
rows and task kits; consumers fetch it at their own pinned revision. Never
place private parity reports here automatically; public integration evidence
still needs explicit content and licence review.
