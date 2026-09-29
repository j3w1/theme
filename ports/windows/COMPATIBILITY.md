# Windows compatibility, verification and recovery

## Compatibility boundary

The current candidate is Windows 11 x64 build 26200.9550 with the redesigned
Start layout. `host.json` records exact Explorer, StartDocked, SystemSettings,
ShellExperienceHost and SearchHost versions, plus Start, shell and Client.CBS
package versions. A changed, absent or unreadable input refuses Full mode.

Start detection reads the same three feature-state inputs as pinned Start Menu
Styler 1.7. It does not modify feature flags. Default/unknown/query failure is
unknown; no marketing version or guessed layout grants compatibility. This
read-only native query is coupled to the reviewed adapter pin, not a stable
Windows API guarantee. The active layout was also observed on the candidate
host through Computer Use. This is not a generic XAML-tree inspection claim.

Classic and redesigned Start selectors are separate. Only the detected list is
combined with common semantic resources. The styler is explicitly kept on
Windows' default layout. Classic selectors have no verified host entry yet.
No visibility, navigation, sizing or feature-removal rules are applied.

Apply and Update check before mutation and again before enabling mods. Test
rechecks the fingerprint. The current-user sign-in guard disables managed mods
before deciding whether to enable them. Unknown compatibility leaves them
disabled. Missing-cache or corrupted-cache failures require recovery; do not
assume a failed guard successfully disabled anything.

## What the checks establish

Fixture tests cover transaction rollback, idempotency, JSONC preservation,
profile/layout identity, conflicts, reparse paths, corrupt caches, missing refs,
partial dependency installation and incompatible shell inputs. Native Windows
CI runs the PowerShell wrapper and generated-port tests against isolated state.
They do not change the CI runner's live theme.

The 2026-09-29 development session imported all five pinned mods disabled and
read their generated settings back through the actual Windhawk CLI. It restored
the original disabled Taskbar Styler and removed the other temporary mods.
Lock-screen black-image apply and original-image restore both passed exact byte
readback through the supported WinRT API after correcting the PowerShell await
bridge. The original image remains private in local recovery storage.

Obsidian 1.13.7 displayed the candidate pair in a disposable vault in Reading
View and CM6 Live Preview: prose and bold body text were rose, H1-H6 were
near-white, and nested bold inherited heading/link/quotation colors. Its actual
installed theme pair was backed up and replaced; pair hashes matched and the
appearance preferences were preserved. This observation does not certify all
Obsidian states or the separate Windows shell stylers.

The native Full lifecycle subsequently passed: Apply made 97 managed changes,
repeated Apply returned unchanged, and an explicit Update applied the compact
cursor revision. Test passed before and after that update. Restore Latest
returned to the prior revision and passed Test. Original Restore returned all
eight tracked Terminal/PowerToys settings files to their byte-exact baselines;
reapply of the compact cursor revision then passed Test. Unrelated JSON
properties, existing layouts and assignments were preserved. A transient
Windows file-sharing error on journal replacement interrupted one Restore;
rerunning Restore completed recovery without changing cache digests or backups.
Do not hold the journal open without delete sharing while a lifecycle writes it.

The guard was invoked with the ordinary user/machine PATH through the installed
PowerShell Store alias. It enabled the managed mods with no failures, using the
retained digest- and publisher-verified Node executable. This is an invocation
test of the sign-in command, not evidence from a new Windows sign-in.

Computer Use observed black Settings surfaces and rose labels, the mode menu's
selected state, and visible keyboard focus without changing the selections.
The visible part of Start also had rose labels. This is bounded observation:
full Start/taskbar/Explorer/notification/Quick Settings/PowerToys interaction-state
coverage, native Terminal visual inspection, an actual sign-in, and released
artifact reconciliation remain unverified. The port remains experimental.
Windows owns unsupported Win32 foregrounds, native focus treatments, arbitrary
application title bars and accessibility cursor overrides. Command Palette
offers a tint rather than independent control of every foreground.

The full hosted matrix, including browser shards, consumers, native installer
fixtures, combined evidence and release gate, passed for implementation commit
`4e02fc11dab26cf2cfbe0a0b1b19db8220510a75` in
[the recorded workflow](https://github.com/j3w1/theme/actions/runs/36551129686).
That does not certify the remaining native visual states.

## Recovery

State is under `%LOCALAPPDATA%/j3w1-theme/windows`: immutable `releases`,
`journal.json`, `current.json`, `backups`, `recovery`, `downloads`, and `tools`.
Journals and backups may contain private settings or image bytes. Never attach
them to public issues or commit them. Only redacted outcomes belong in evidence.

1. On failure, retain the state directory. The runtime reverses completed
   changes and reports any unresolved conflicts.
2. Run the installed script with `-Action Restore`. It can find a pending
   transaction even when the first installation did not write `current.json`.
3. If a later managed value differs, Restore preserves it and lists the target.
   Inspect its original, installed and current values locally. To finish the
   rollback, deliberately return that value to the recorded installed value,
   then rerun Restore. Do not replace whole settings files to resolve one key.
4. A stale `bootstrap.lock` or `lifecycle.lock` blocks mutation. Read its recorded
   PID and verify that process is no longer running before removing only that
   stale lock. Never remove a live process's lock.
5. Cache digest failure blocks execution. Restore the exact retained release
   bytes from the same immutable revision; do not edit the digest manifest or
   `verified.json` to bless changed bytes. Recovery performs no network fetch. If a defect in an older adapter prevents
   its refresh or restore, a reviewed fixed revision can read the existing
   journal through an explicit offline source:

   ```powershell
   & ./ports/windows/install.ps1 -Action Restore -SourceRoot . -Revision (git rev-parse HEAD)
   ```

   This validates the fixed release from immutable Git objects, retains the old
   cache and journal history, and applies only the recorded restoration.

Font receipts record pending ownership before files are installed. An interrupted
installation resumes only when already written files still match its receipt.
Unowned or changed destination fonts are conflicts. A compatible Node installation on the ordinary user/machine PATH is reused.
Otherwise Apply downloads the pinned official executable, verifies its digest
and publisher, and retains it under `tools/node` for sign-in and recovery.
The existing PowerShell Store alias is preferred for startup when available,
so an agent runtime cache or a version-specific Store package path is not needed.
Theme restore retains installed shared tools and fonts; automatic dependency removal is unsupported.

## Start-menu styling

The generated mapping covers opaque raised/black surfaces, red 1px outer
frames, zero corner radii, rectangular search/category/folder containers and
token-based normal/hover/pressed/disabled fills on section-expansion controls.
A generic Button border selector initially framed nested category icons and
captions; owner feedback removed it. Category containers keep one subtle outer
outline, while named inner icon/folder/header targets receive square corners
only and retain their native fill, border and focus behavior. The companion phone
panel uses its existing AcrylicBorder/AcrylicOverlay controls. Classic and
redesigned selectors remain separate; the current host uses redesigned Start.
Target names are grounded in the pinned Start Menu Styler 1.7 source examples.

The generator serializes pixel dimensions as unitless XAML values and the
canonical font family's first installed face as a native family name. Font
rules target named textual labels only; FontIcon/SymbolIcon glyphs, images,
font sizes, app placement, section visibility and navigation are not changed.
Native focus and selection remain host treatments. Setting readback proves
imported rules, not that every selector matched a rendered element: actual
surface/state observation is required before claiming visual verification.

The expanded Start mapping was imported on the documented host through the
immutable Update action, and native Test passed with no failed checks. Computer
Use then observed square main/phone-panel frames, thin red outer borders, a
rectangular search field, dark surfaces, monospace app labels and rectangular
category containers. Pinned apps, Recent, category view and the phone companion
remained visible. The observed Recent-item hover and tooltip still used native
host treatment. This bounded observation does not certify every hover, pressed,
disabled, selection or keyboard-focus state, nor every companion-panel label.

The owner separately confirmed that Terminal looks fine. That records general
appearance feedback, not an exhaustive keyboard/interaction-state protocol.

## Cursor treatment

The owner revised the native cursor treatment on 2026-09-29 after trying the
first live install: compact black fill with a red outline replaces the larger
rose fill. The generator uses the existing canvas and active-border roles,
shrinks artwork to 65% within each DPI image, and transforms hotspots with it.
The arrow, help and working pointers use a small notched arrowhead without a
projecting tail. The hand has an extended index finger, curled fingers, a bent
thumb and a rounded palm. All 17 standard roles retain recognizable shapes; no pointer accessibility
setting is changed.

## Required real-machine protocol before promotion

Record the immutable source revision, generated artifact digests, exact host and
app/mod versions, and observed limits. Use nonprivate specimens. Exercise Full
Apply, repeated Apply, explicit Update, Restore Latest, original Restore and
Reapply; check preservation of unrelated Terminal/PowerToys state. Observe each
shell surface in normal, hover, selected, disabled and keyboard-focus states.
Check supported cursor shapes and sizes without changing accessibility settings.
Record the sign-in guard and final installed release reconciliation separately.
Configuration readback alone must never promote the port to verified.

## Notification sidebar mapping

The notification/calendar/Quick Settings outer grids use black surfaces,
square corners and one token-based 1px red frame. Named notification plating
use near-black panels without added inner borders. Standalone toast background
variants instead use a pure-black canvas and one red 1px outer frame; their
named action buttons have square corners.
Calendar chrome and the Focus section use the chrome surface; day geometry
and named action corners are squared without changing sizes or visibility.
CalendarView brushes map ordinary/muted/disabled text and current-day
normal/hover/pressed colors separately. Selection and keyboard focus remain
host-owned. Monospace rules target named text labels, never icon fonts.

Selectors are drawn from the pinned Notification Center Styler source;
CalendarView brush properties use the Windows XAML API. Import/readback and
native visual checks are separate gates. No notification dismissal, expansion,
Focus activation or setting change is required to inspect this treatment.

## Explorer and application limits

The attempted Explorer `none` backdrop with an entire-window effect produced
bright red native panes on the candidate host instead of black. The owner
rejected the result, and the native transaction was rolled back. That option
and its speculative coverage claim are removed. Explorer retains its native
backdrop with the earlier rose XAML chrome mapping. Native file-list/tree text
and backgrounds are unresolved; successful settings readback did not establish
correct visual rendering. The failed attempt remains historical evidence.

Task Manager, third-party application bodies and arbitrary classic dialogs
have no dedicated adapter in this port. Native dark mode and accent are only
partial treatment there. No universal Windows-wide visual match is claimed.

## Automated setup

`setup.ps1` runs under native Windows PowerShell 5.1 or PowerShell 7. It requires
Windows 11 x64, TLS HTTPS access to GitHub and the pinned dependency publishers,
and an explicit release tag or full commit. Tags resolve once to an immutable
commit. Setup verifies the install script and dependency metadata against that
commit's manifest before running them. It reuses compatible PowerShell or
retains the official pinned ZIP after digest and Microsoft publisher checks.
Retained PowerShell files are verified against the pinned archive on reuse.
ZIP entries are bounded and reject traversal, duplicate paths and symlinks.
Existing reparse targets and concurrent setup are refused.

The lifecycle's `Prepare` action retains the complete validated release and
Node dependency, then returns the existing Plan result. It changes no theme
settings and installs neither fonts nor Windhawk. Unlike read-only `Plan`, it
does write release/dependency caches. Setup uses it to offer Native mode when
Full compatibility is unavailable. `-Mode Full` fails closed; `-Mode Native`
is explicit. `-NonInteractive` with the default Auto mode refuses an unsupported
host rather than prompting or silently applying Native mode. After selection,
the existing Apply and Test actions remain the only theme mutation/verification
path. Recovery commands are printed and saved before Apply so failures retain
an actionable recovery route. No failure is reported as a successful setup.

PowerShell, Node and the font are required dependencies; Full mode also needs
Windhawk. Terminal and PowerToys are optional existing-app integrations. ZIP
PowerShell stays alongside existing installations without PATH or machine-wide
changes. Shared dependencies remain on Restore/Uninstall. Setup does not restart
working apps, reboot, downgrade dependencies or bypass managed security policy.
Preparation failure may retain verified downloads; retry the same immutable
revision. A live `setup.lock` must never be removed. A stale one can be removed
only after checking its recorded process has ended, like the lifecycle locks.

## Developer and offline installation

From an immutable checkout, with PowerShell 7.4+ and Node 24+ available:

```powershell
$revision = git rev-parse HEAD
& ./ports/windows/install.ps1 -Action Plan -SourceRoot . -Revision $revision -Mode Full
& ./ports/windows/install.ps1 -Action Apply -SourceRoot . -Revision $revision -Mode Full
& ./ports/windows/install.ps1 -Action Test
```

Uncommitted files are excluded. The source route reads Git objects; ordinary
setup uses pinned HTTPS downloads and needs no Git. Offline use also requires
the previously verified dependency downloads. `Update` requires an explicit
`-Version` or `-Revision`; recovery actions use the installed cache without
network access. Full-mode support always remains tied to the exact fingerprint.

The owner confirmed the notification sidebar looks good after the notification
and calendar update. Native Update and Test passed for that candidate. This is
general appearance feedback, not exhaustive verification of all interaction
states. The pending Start category border correction was installed with it.

### One-command recovery

The same downloaded `setup.ps1` handles setup and recovery from Windows
PowerShell 5.1. No revision or runtime path is required:

```powershell
& ./setup.ps1 -Action Restore -Latest
& ./setup.ps1 -Action Restore
& ./setup.ps1 -Action Uninstall
& ./setup.ps1 -Action Test
```

Choose one command: undo the last update, restore the original appearance,
uninstall theme integration, or verify. Recovery uses the existing lifecycle
and validates the retained entry point before invoking it. A pending first
installation can be recovered even before `current.json` exists. Missing or
changed recovery files fail without a network download. The underlying journal
preserves later edits and returns a nonzero result for unresolved conflicts;
the wrapper must not print completion for those results.
