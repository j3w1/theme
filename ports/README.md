# Application ports

One folder per app. Each folder holds everything for that app: the theme
file, its installer if it has one, and one guide.

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
| Warp theme YAML (also Orca's Import from YAML) | [warp](warp/README.md) | `j3w1.yaml` |
| Windows 11 native and Windhawk theme | [windows](windows/README.md) | `windows-settings.json`, `terminal-fragment.json`, `terminal-theme.json`, `fancyzones-layouts.json`, `windows-11-taskbar-styler.json`, `windows-11-start-menu-styler.json`, `windows-11-file-explorer-styler.json`, `windows-11-notification-center-styler.json`, `windows-11-settings-styler.json`, `j3w1-wallpaper.bmp`, `j3w1.theme`, `j3w1-arrow.cur`, `j3w1-help.cur`, `j3w1-appstarting.cur`, `j3w1-wait.cur`, `j3w1-crosshair.cur`, `j3w1-ibeam.cur`, `j3w1-nwpen.cur`, `j3w1-no.cur`, `j3w1-sizens.cur`, `j3w1-sizewe.cur`, `j3w1-sizenwse.cur`, `j3w1-sizenesw.cur`, `j3w1-sizeall.cur`, `j3w1-uparrow.cur`, `j3w1-hand.cur`, `j3w1-pin.cur`, `j3w1-person.cur`, `runtime.cjs`, `install-manifest.json`, `j3w1-explorer-native.wh.cpp`, `j3w1-explorer-native.json`, `j3w1-powertoys-preview.wh.cpp`, `j3w1-powertoys-preview.json`, `j3w1-calculator.wh.cpp`, `j3w1-calculator.json`, `j3w1-powertoys-markdown.wh.cpp`, `j3w1-powertoys-markdown.json`, `markdown-theme.css` |
<!-- guides:end -->

Claude Code and Codex run inside a terminal and use its sixteen colours for
code, links and status. Install a terminal theme too.

All ports are experimental: they are generated and checked, but no real import
has been recorded yet. Each file is also in the Downloads table of the
repository README and on the site's Ports page, pinned to a release.

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
and browser-extension colours) are catalogued in `references/catalogue.json`;
they are evidence of origin, not supported downloads.

## For maintainers

A port is created under `ports/<slug>/` only when implementation work begins,
from `templates/port/`. Each port carries `port.json` (validated by
`schemas/port.mjs`; its `format` is one of `PORT_FORMATS` there),
`mapping.json` (spec role → native key, with every unmapped role listed),
`dist/` (committed importable files, written by `npm run generate` when the
port's `format` has an emitter in `scripts/lib/port-artifacts.mjs`). Add `src/`
only for real generator inputs and `evidence/` only for actual records with
application version, OS and date; neither needs a placeholder. Generation
rebuilds absent emitted files, while validation and drift checks require them.
Every emitter returns its complete declared text-artifact set; unsafe, duplicate,
missing or extra paths fail before any port artifact is written.
A port with an installer also carries `host.json` (which native key takes
which role, the host versions it was observed on, and its deviations) and the
installer itself: `install/` for Orca, `install.mjs` for Claude Code and Codex,
whose shared code is `scripts/lib/host-install/`. Their emitters call the
installers' generators, and `mapping.json` must agree with `host.json` key for
key. An installer takes every value from the commit its files came from.

Statuses: `experimental` (artifacts exist, checks pass, real-target verification
incomplete), `verified` (imported into the recorded target with matching
evidence and a current token digest), `deprecated` (with a reason). A parse
success is a structural pass, not verification. The README support table is
generated from these manifests and says so when the directory is empty.

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
actually passed. A parse or synthetic fixture
cannot supply a real-import protocol.

The generator writes `exports/port-capabilities.json`; summaries, detail rows
and task kits consume it. Consumers fetch it at their own pinned revision.
Do not place private parity reports here automatically. Any public integration
evidence still requires explicit content/license review.
