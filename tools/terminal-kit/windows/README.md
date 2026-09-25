# j3w1 terminal kit: Orca on Windows

PowerShell 7.4+ scripts that apply the j3w1 approved default terminal palette
to the Orca desktop client (targets: see `host.targetVersions` in
`../roles/terminal.json`). Every value comes from the export pinned in
`../kit.json`. The scripts check that the tag resolves to the pinned commit and
that `exports/tokens.resolved.json` matches `exports/digests.json`.
No colour values live in these scripts.

## Get the kit

Pick a kit commit (a full 40-character SHA; branches, tags and "latest" are
refused) and run:

```powershell
& ([scriptblock]::Create((Invoke-RestMethod https://raw.githubusercontent.com/j3w1/theme/<commit>/tools/terminal-kit/windows/Get-J3w1Kit.ps1))) -Revision <commit>
```

The kit lands in `%LOCALAPPDATA%\j3w1-theme\kit\<commit>\`, and the script
prints the next commands.

## Use it

| Script | What it does |
| --- | --- |
| `Apply-J3w1OrcaTheme.ps1 [-WhatIf] [-SkipFontCheck] [-SourceRoot <checkout>]` | Backs up, writes the managed block in `%APPDATA%\ghostty\config.ghostty` and, only while Orca is not running, the managed keys of Orca's settings. If nothing changes, it reports "no changes" and makes no backup. |
| `Test-J3w1OrcaTheme.ps1 [-NoSpecimen]` | Renders the specimen with the expected hex and contrast values, then prints PASS/FAIL/WARN/SKIP for each check. Exits 0 only when no check FAILs. |
| `Update-J3w1OrcaTheme.ps1 -Version vX.Y.Z [-WhatIf]` | Resolves the tag to its commit, verifies that commit's export, shows a before/after diff, applies and checks. Branches are never followed. |
| `Restore-J3w1OrcaTheme.ps1 [-Backup <yyyyMMddTHHmmssZ> \| -Latest] [-WhatIf]` | Restores key by key: each managed setting gets its earlier value back, or is removed if it was absent. `config.ghostty` is restored byte for byte, or deleted if the kit created it. The default target is the state before the kit's first change. |

Orca keeps its settings in memory and rewrites the whole store whenever
something changes, so the scripts never write the store while any Orca process
runs (including the tray). In that case Apply writes only the Ghostty block and
prints the steps to finish in Orca:

1. Settings > Terminal > Import from Ghostty > Apply Changes
2. Settings > Terminal > Color Contrast > Off
3. Settings > Appearance > Left Sidebar Appearance > Match Terminal

Or quit Orca (tray too) and run the script again. Restore follows the same
rule: while Orca runs it restores the Ghostty file only and exits with code 2.

## What it changes and what it never changes

Keys it sets: `terminalColorOverrides`, `terminalMinimumContrastRatio` (1,
"Color Contrast: Off"), `leftSidebarAppearanceMode` (`match-terminal`),
`terminalDividerColorDark`, `terminalDividerColorLight`, `terminalFontFamily`
and `terminalFontSize`. The font size is only set when the machine has none.
The keys listed in `orca.preserve` (theme, IDE font, editor font, zoom and
more) are recorded and reported but never changed. A mismatch with
`orca.expectedPreferences` produces a warning and nothing else.

The kit's own state is in `%LOCALAPPDATA%\j3w1-theme\orca\`:

- `current\` holds the last manifest, the generated Ghostty block and
  `theme.lock.orca.json`.
- `backups\<timestamp>\` holds byte copies of every file changed, plus a
  manifest. A manifest names only the kit's keys and files, never other Orca
  state.

Orca 1.4.209 has no app-chrome appearance setting (only the left sidebar can
follow the terminal), and it always draws bold text in the bright colours.
Both scripts print these deviations, along with the use-and-report decision
ids that must be disclosed.

## Tests

`node --test tests/terminal-kit-windows.test.js` drives the scripts through
`pwsh` (from PATH or `$J3W1_PWSH`) in a fake tree. The test seam
(`J3W1_KIT_TEST_ROOT`, `J3W1_KIT_TEST_ORCA_RUNNING`, `J3W1_KIT_TEST_FONTS`)
maps APPDATA and LOCALAPPDATA under that root and disables the network. It is
never active otherwise.
