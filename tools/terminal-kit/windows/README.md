# j3w1 terminal kit: Orca on Windows

PowerShell 7.4+ scripts that apply the j3w1 approved default terminal palette
to the Orca desktop client (targets: see `host.targetVersions` in
`../roles/terminal.json`). Every value comes from the export pinned in
`../kit.json`. No colour values live in these scripts.

## Pinning

`../kit.json` pins a release tag, its commit, and the sha256 of
`exports/tokens.resolved.json` at that commit (`exports.tokensDigest`). The
export is read from one of three sources, and on every one of them it must
equal that pinned digest and its entry in `exports/digests.json`:

- **Network** (the default): the tag must resolve to the pinned commit
  through the GitHub API, then the files are fetched from
  `raw.githubusercontent.com` at the commit SHA. A copy that passed is cached
  in `%LOCALAPPDATA%\j3w1-theme\orca\cache\<commit>\`.
- **Cache**: later runs read that copy without the network. The tag is not
  resolved again, but the copy is re-verified against the pinned digest on
  every run; a copy that fails is deleted and the run stops.
- **`-SourceRoot <checkout>`**: a local git clone of `j3w1/theme`. Files are
  read from git objects at the pinned commit, never from the working tree.
  A folder that is not a git checkout, or a clone without the pinned commit,
  is refused; a local tag of the pinned name must resolve to the pinned
  commit.

`Update` pins a different tag: it resolves the tag (GitHub API, or git in
`-SourceRoot`), and verifies the export against the digest a `kit.json` pins
for that commit when one does, and always against its `digests.json`. When
`-Version` is the tag `../kit.json` pins, the tag must resolve to the commit
`kit.json` pins and the export must match its `tokensDigest`, on every
source; anything else is refused. Any other tag read from `-SourceRoot` is
taken as the local tag names it: the run says in its header and in a warning
that the local tag was trusted.

## Get the kit

Pick a kit commit (a full 40-character SHA; branches, tags and "latest" are
refused) and run:

```powershell
& ([scriptblock]::Create((Invoke-RestMethod https://raw.githubusercontent.com/j3w1/theme/<commit>/tools/terminal-kit/windows/Get-J3w1Kit.ps1))) -Revision <commit>
```

The kit lands in `%LOCALAPPDATA%\j3w1-theme\kit\<commit>\`, and the script
prints the next commands. `Get-J3w1Kit.ps1 -Revision <commit> -SourceRoot
<checkout>` copies the kit from git objects at that commit instead (offline);
a checkout without the commit is refused.

## Use it

| Script | What it does |
| --- | --- |
| `Apply-J3w1OrcaTheme.ps1 [-SourceRoot <checkout>] [-SkipFontCheck] [-WhatIf]` | Plans every change, backs up, writes the managed block in `%APPDATA%\ghostty\config.ghostty` and, only while Orca is not running, the managed keys of Orca's settings. If nothing changes, it reports "no changes" and makes no backup. |
| `Test-J3w1OrcaTheme.ps1 [-SourceRoot <checkout>] [-NoSpecimen]` | Renders the specimen with the expected hex and contrast values, then prints PASS/FAIL/WARN/SKIP for each check. Exits 0 only when no check FAILs. |
| `Update-J3w1OrcaTheme.ps1 -Version vX.Y.Z [-SourceRoot <checkout>] [-SkipFontCheck] [-WhatIf]` | Resolves the tag to its commit, verifies that commit's export, shows a before/after diff, applies and checks. Branches are never followed. |
| `Restore-J3w1OrcaTheme.ps1 [-Backup <yyyyMMddTHHmmssZ> \| -Latest] [-WhatIf]` | Undoes the kit key by key; see below. |

- `-SourceRoot`: read from a local git checkout at the pinned commit (see
  Pinning).
- `-SkipFontCheck`: continue when the terminal font (SauceCodePro NFM) is
  not installed; Orca falls back to another font until it is.
- `-WhatIf`: print the plan and write nothing (no backup, no cache).
- `-NoSpecimen`: run the checks only.

Orca keeps its settings in memory and rewrites the whole store whenever
something changes, so the scripts never write the store while any Orca process
runs (including the tray). In that case Apply writes only the Ghostty block and
prints the steps to finish in Orca:

1. Settings > Terminal > Import from Ghostty > Apply Changes
2. Settings > Terminal > Color Contrast > Off
3. Settings > Appearance > Left Sidebar Appearance > Match Terminal

Or quit Orca (tray too) and run the script again.

## Restore

Every Apply or Update that writes anything records, in its manifest, the value
(or absence) of every managed key as it found it, whether or not it wrote the
store, the value the kit sets for each key, and the keys its maps manage
(`managedKeys`). Restore works from those records.

Which records a restore undoes:

- **Default**: every record since the last *boundary*, or since the first
  apply when there is none.
- **`-Latest`**: the most recent apply or update, and anything after it.
- **`-Backup <name>`**: the named backup, and everything after it; the state
  before that backup.

A boundary is a restore that finished its last write and left no kit value
applied: any complete restore, of any mode, whose records reach back to a
state with no kit value (a default restore always does; `-Latest` or
`-Backup` does when no earlier apply or update lies between it and the
previous boundary), including one that found nothing left to change, which is
then recorded on its own. A restore refused while Orca runs is not a boundary.
A restore writes its manifest first, marked `complete: false`, and marks it
complete only after its last write; if it stops partway (a failed write,
Orca started meanwhile), it is not a boundary, and running Restore again
finishes the job.

Per key, the earliest value recorded in those records comes back (removed
again if it was absent), but only for a key a record in them wrote, or that a
run which could not write the store (Orca open) found at a value other than
the kit's. A key the kit never wrote and never asked Orca for is left as it
is, including a key that already held the kit's value. The earliest value
wins: if you changed a key between two applies, Restore returns the value
from before the first one. It warns, per key, when a value differs from what
the kit left or asked for, at a later record or now. Keys a record names
must be managed by this kit or listed in that record's `managedKeys` (a
newer tag's maps); anything else is refused.

If the earliest record for a key already found the kit's value while
`config.ghostty` already held the managed block (for example after the kit's
state folder was deleted and Orca had imported the block), the pre-kit value is
unknown. Restore says so for that key, leaves it as it is, and exits 3. It
never reports such a key as restored, and the next restore after a later
apply still treats it as unknown while it holds the kit's value.

`config.ghostty` returns to its state before the earliest record that wrote
it. When no record in the window wrote it, a default restore still takes the
managed block out, while `-Latest` and `-Backup` leave the file alone. Only
the managed block is removed and every byte outside it is kept. Its exact
earlier bytes come back (or the file is deleted, when the kit created it)
only when nothing outside the block changed since the kit wrote it; an
existing empty file comes back empty. The plan warns when a file changed
since the kit last wrote it. A symbolic link is written through to its target
and stays a link; a link whose target is missing stops the run. A file with
more than one managed block is refused by Apply and Restore until the extra
copies are deleted, and Test reports it as a FAIL.

While Orca runs, the store part is refused: Restore restores the Ghostty file
only and exits 2. Exit codes: 0 done, 1 error, 2 store refused while Orca
runs, 3 some keys left because their pre-kit value is unknown. `-WhatIf`
exits with the code the real run would.

## What it changes and what it never changes

Keys it sets: `terminalColorOverrides`, `terminalMinimumContrastRatio` (1,
"Color Contrast: Off"), `leftSidebarAppearanceMode` (`match-terminal`),
`terminalDividerColorDark`, `terminalDividerColorLight`, `terminalFontFamily`
and `terminalFontSize`.

- `leftSidebarAppearanceMode` is Orca chrome outside the terminal. The kit
  changes it because the owner asked for it; there is no option to leave it
  alone, and Restore returns it like every other managed key.
- The font size is only set when the machine has none. A size the owner
  changes after apply is a WARN in Test, never a FAIL, and the Ghostty block
  is compared without its `font-size` line. Restore takes the size out again
  only when the kit set it and nobody changed it since; otherwise the size
  stays as it is.
- The keys listed in `orca.preserve` (theme, IDE font, editor font, zoom and
  more) are recorded and reported but never changed. A mismatch with
  `orca.expectedPreferences` produces a warning and nothing else.

## The kit's own state

Everything is in `%LOCALAPPDATA%\j3w1-theme\orca\`:

- `current\` holds the last manifest, the generated Ghostty block and
  `theme.lock.orca.json`.
- `backups\<timestamp>\` holds a manifest per run and a copy of
  `config.ghostty` when the run changed it. A manifest names only the kit's
  keys (their observed, before and after values) and the preserved keys,
  never other Orca state.
- `pre-kit\orca-data.json` is **one full copy of Orca's settings store**,
  as read by the first Apply or Update that writes anything and finds no
  copy, whether or not that run writes the store (with Orca open it does
  not). It is never overwritten, and Restore never takes it. It is the
  pre-kit store only if that run was the kit's first on this machine: after
  the state folder was deleted, it holds whatever the store held then. It
  contains the whole private store (repositories, worktree paths, session
  state, account flags), protected only by the folder's normal permissions.
  Restore does not need it; it is a last-resort copy. Delete it yourself once
  you no longer want it.
- `cache\<commit>\` holds the verified export (see Pinning).

Orca 1.4.209 has no app-chrome appearance setting (only the left sidebar can
follow the terminal), and it always draws bold text in the bright colours.
Apply and Test print these deviations, along with the use-and-report decision
ids that must be disclosed.

## Tests

`node --test tests/terminal-kit-windows.test.js` drives the scripts through
`pwsh` (from PATH or `$J3W1_PWSH`) in a fake tree. The expected values and the
Ghostty reference are read through git at the pinned revision, so the clone
needs that commit (CI fetches full history). The test seam
(`J3W1_KIT_TEST_ROOT`, `J3W1_KIT_TEST_ORCA_RUNNING`, `J3W1_KIT_TEST_FONTS`)
maps APPDATA and LOCALAPPDATA under that root and disables the network.
Inside the seam only, `J3W1_KIT_TEST_SOURCE=worktree` lets `-SourceRoot` be a
plain folder; such a run marks the pin as not verified and writes no lock. The
seam refuses a root that maps onto the real `APPDATA` or `LOCALAPPDATA`, and
is never active otherwise.
