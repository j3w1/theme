# Application ports

One folder per app, holding its theme files, its installer if it has one, and
one guide.

## Which one do I need

<!-- guides:start -->
| Application | Guide | Importable files |
| --- | --- | --- |
| ChatGPT desktop app (Appearance) | [chatgpt](chatgpt/README.md) | `presets.json` |
| Claude Code (custom theme) | [claude-code](claude-code/README.md) | `j3w1.json` |
| Codex CLI (tmTheme) | [codex](codex/README.md) | `j3w1.tmTheme` |
| Ghostty theme | [ghostty](ghostty/README.md) | `j3w1` |
| Obsidian theme | [obsidian](obsidian/README.md) | `manifest.json`, `theme.css` |
| Orca (Ghostty config import) | [orca](orca/README.md) | `config.ghostty` |
| Telegram Android and Desktop | [telegram](telegram/README.md) | `j3w1.attheme`, `j3w1.tdesktop-theme` |
| Warp theme YAML (also Orca's Import from YAML) | [warp](warp/README.md) | `j3w1.yaml` |
| Windows 11 native and Windhawk theme | [windows](windows/README.md) | `windows-settings.json`, `terminal-fragment.json`, `terminal-theme.json`, `fancyzones-layouts.json`, `windows-11-taskbar-styler.json`, `windows-11-start-menu-styler.json`, `windows-11-file-explorer-styler.json`, `windows-11-notification-center-styler.json`, `windows-11-settings-styler.json`, `j3w1-wallpaper.bmp`, `j3w1.theme`, `j3w1-arrow.cur`, `j3w1-help.cur`, `j3w1-appstarting.cur`, `j3w1-wait.cur`, `j3w1-crosshair.cur`, `j3w1-ibeam.cur`, `j3w1-nwpen.cur`, `j3w1-no.cur`, `j3w1-sizens.cur`, `j3w1-sizewe.cur`, `j3w1-sizenwse.cur`, `j3w1-sizenesw.cur`, `j3w1-sizeall.cur`, `j3w1-uparrow.cur`, `j3w1-hand.cur`, `j3w1-pin.cur`, `j3w1-person.cur`, `runtime.cjs`, `install-manifest.json`, `j3w1-explorer-native.wh.cpp`, `j3w1-explorer-native.json`, `j3w1-powertoys-preview.wh.cpp`, `j3w1-powertoys-preview.json`, `j3w1-calculator.wh.cpp`, `j3w1-calculator.json`, `j3w1-powertoys-markdown.wh.cpp`, `j3w1-powertoys-markdown.json`, `markdown-theme.css`, `j3w1-folder.ico`, `j3w1-folder-open.ico`, `j3w1-notepad-native.wh.cpp`, `j3w1-notepad-native.json`, `j3w1-notepad-chrome.wh.cpp`, `j3w1-notepad-chrome.json`, `j3w1-paint-chrome.wh.cpp`, `j3w1-paint-chrome.json`, `j3w1-terminal-chrome.wh.cpp`, `j3w1-terminal-chrome.json` |
<!-- guides:end -->

Claude Code and Codex use the terminal's sixteen colours for code, links and
status; install a terminal theme too.

All ports are experimental: generated and checked, with no real import
recorded. Each file is also in the repository README's Downloads table and on
the site's Ports page, pinned to a release.

## Install commands

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
