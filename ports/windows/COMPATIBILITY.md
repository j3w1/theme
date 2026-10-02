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
4. A stale `setup.lock`, `bootstrap.lock` or `lifecycle.lock` blocks mutation. Read its recorded
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
Setup uses an ordinary unpackaged PowerShell installation or its own pinned
private runtime. The sign-in guard uses that same runtime. Microsoft Store
PowerShell is excluded because its registry view differed during native checks.
The installer queries actual process package identity before setup, recovery or
lifecycle work. Checking the executable path alone is insufficient: a standalone
child launched from Store PowerShell can inherit that package context.
Packaged or unknown context refuses before dependency acquisition or settings
changes. Use Windows PowerShell included with Windows to run the same script.
A failed child lifecycle prints its diagnostic result before the wrapper error;
Test reports verification and never claims to have restored the appearance.
Managed adapter receipts record the pinned source digest, exact compiled DLL
digest and full configuration. Update reuses a compiled DLL only while all
identities, settings and compatibility checks match. Test and Guard reject
compiled DLL drift. Restore uses saved settings without compilation only for
a reused DLL with the same configuration and exact settings-key set; unknown,
changed, absent or older receipts use the existing offline import path. No
precompiled download or private Windhawk storage write is introduced.
Saved exports carry exact digests. A managed offline restore verifies the saved
source, version, settings and configuration, then appends a receipt for its
newly compiled DLL; original compilation receipts remain historical. Test and
Guard use the latest verified restoration receipt and still reject binary drift.
Windows file-sharing refusals receive a bounded atomic-replacement retry; the
destination is never deleted or truncated to bypass a lock.

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
backdrop with the earlier rose XAML chrome mapping. That failed attempt remains historical evidence.

A separate source-owned native Explorer adapter now maps neutral canvas paints
to black and ordinary neutral text to rose. Buffered painting is tracked per
Explorer paint thread, because memory DCs have no window owner. Column headers, native tree/list selection and hover paints, scrollbar parts
and separators use the black/red/rose palette. The native theme draws its
geometry into an isolated bitmap; only neutral theme pixels receive the
semantic palette. Colored icons and application content are not recolored.
XAML command bars and tabs have separate token mappings. Unknown transforms
and unsupported drawing flags retain native rendering and remain a limit. The adapter does not change system colors,
window geometry, font sizes, input handling or other applications. Rich-edit preview controls, colored text and high-contrast rendering pass through. Third-party preview
handlers and all native interaction states are not claimed as visually verified.

The generated C++ source and settings are hashed in the immutable installation
manifest. Full mode compiles it with the pinned Windhawk tool, stages it disabled,
checks settings, and journals backup/enable/restore through the same lifecycle
as the upstream stylers. Restore removes an owned adapter or restores its prior
backup. The temporary diagnostic probe is not a dependency. No extra download
is needed. Both the lifecycle and the adapter gate Explorer on its fixed file
version; descriptive FileVersion alone can differ from the binary version.

On 2026-09-30, the temporary probe visibly produced black file-list, navigation,
column-header and preview-placeholder surfaces with rose text. Disabling it
visibly restored gray panes and native text. Computer Use captures succeeded,
but clicks were refused because its target geometry landed on the chat window,
even after activation. Selection/rename/high-contrast visual checks remain open;
the generated adapter must not be described as full native visual acceptance.

Task Manager, third-party application bodies and arbitrary classic dialogs
have no dedicated adapter in this port. Native dark mode and accent are only
partial treatment there. No universal Windows-wide visual match is claimed.

## Automated setup

`install.ps1` runs under native Windows PowerShell 5.1 or PowerShell 7. It requires
Windows 11 x64, TLS HTTPS access to GitHub and the pinned dependency publishers,
and an explicit release tag or full commit. Tags resolve once to an immutable
commit. Setup verifies the install script and dependency metadata against that
commit's manifest before running them. It reuses compatible unpackaged PowerShell under Program Files or
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

From an immutable checkout, with unpackaged PowerShell 7.4+ and Node 24+ available:

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

The same downloaded `install.ps1` handles setup and recovery from Windows
PowerShell 5.1. No revision or runtime path is required:

```powershell
& ./install.ps1 -Action Restore -Latest
& ./install.ps1 -Action Restore
& ./install.ps1 -Action Uninstall
& ./install.ps1 -Action Test
```

Choose one command: undo the last update, restore the original appearance,
uninstall theme integration, or verify. Recovery uses the existing lifecycle
and validates the retained entry point before invoking it. A pending first
installation can be recovered even before `current.json` exists. Missing or
changed recovery files fail without a network download. If rollback selects a
release from before setup existed, recovery obtains the retained PowerShell pin
from the newest verified release in installation history, including restored
transactions. It verifies that release manifest and dependency bytes before
verifying the runtime against its archive; it never substitutes the Store alias
or downloads a recovery runtime. Keep the release cache with the journal. The underlying journal
preserves later edits and returns a nonzero result for unresolved conflicts;
the wrapper must not print completion for those results.


### Setup runtime verification

Native Windows PowerShell 5.1 fixtures exercised identity, explicit mode
selection, digest rejection, pending-first-install recovery, lifecycle ordering
and child failure propagation. A real isolated test downloaded pinned PowerShell
7.6.6, verified its archive and Microsoft signature, executed it and verified the
retained runtime offline. These are bounded checks, not a clean-PC full install.

Progress rendering is suppressed only during bootstrap downloads, with the
caller preference restored afterward. PowerShell 7.4+ downloads set both
connection and stream-idle timeouts: `TimeoutSec` alone only bounds connection
waiting on those engines. A native raw-GitHub response stalled during Prepare;
it was stopped before theme mutation. Connection success is not a complete
download. Hash validation must succeed before a release is marked verified.
The documented immutable source-checkout route remains available when release
downloads cannot complete; no cache digest or safety check is bypassed.


### Runtime registry boundary

A native bootstrap attempt using the PowerShell Store alias stopped on the
managed startup-guard conflict before mutation. Read-only comparison found the
existing guard through standalone PowerShell but not through the Store runtime.
Setup therefore selects the ordinary Program Files installation or retains its
pinned private runtime; installation and sign-in Guard use the same runtime.
Direct lifecycle execution from a packaged WindowsApps runtime is refused with
instructions to use setup. Earlier Store-alias guard invocation evidence remains
historical and does not establish a correct registry view or actual sign-in.


### Native bootstrap and legacy rollback check

The bootstrap applied the standalone-runtime candidate and Test passed on the
owner's Windows host. Setup then completed offline Restore Latest without
conflicts. Its next Test exposed a missing PowerShell dependency field in the
older restored release. Recovery now verifies the retained runtime pin through
installation history; the corrected setup completed offline Test on that older
release. Both native PowerShell engines passed the legacy recovery fixture,
including altered dependency rejection and a forbidden-network stub.

These checks used an immutable source-prepared release cache and an already
verified PowerShell archive. They establish native bootstrap/recovery behavior,
not a clean-PC online installation or visual acceptance. At that checkpoint Explorer's native panes
remained dark gray; the later native-adapter investigation is recorded above.
Standalone popup rendering still needs direct observation.

The no-gray Explorer request adds explicit command-bar/tab surfaces and native
interaction/scrollbar palette mappings. It does not claim every Explorer
dialog, third-party preview handler or unobserved state is covered. Selection,
rename and high-contrast visual acceptance remain separate from CLI readback.

### Native readback on 2026-09-30

On the candidate host, the generated native adapter compiled in pinned Windhawk.
A selected sample row visibly used dark red on the black file list; navigation
and normal headers were black. The rename edit retained readable selected text
and canceled without changing the filename. A live standalone notification was
also observed with a black background, rose text and a thin red frame. No
notification was opened or dismissed by this check; its content was not saved.

The sample's embedded source-code preview is PowerToys.MonacoPreviewHandler,
which uses its own Monaco vs-dark editor theme. Its gray content background is
not Explorer's native canvas. The installed provider exposes light/dark theme
selection, not a supported custom j3w1 palette. Modifying its installed assets,
disabling the provider or hiding the pane is not part of this adapter. Therefore
the owner's no-gray visual target is still not fully satisfied in this provider.
See [PowerToys preview implementation](https://github.com/microsoft/PowerToys/tree/main/src/common/FilePreviewCommon).

Actual high-contrast mode switching, DPI variants and full state coverage remain
unverified. Tests and compilation do not certify those visual cases.

Setup also reuses an already prepared immutable release: its recorded manifest,
installer and dependency hashes are checked before invocation, then Prepare
checks the full release. A missing or changed existing cache is refused without
network replacement. A fresh revision still follows pinned online bootstrap.
This removes a repeat manifest download that stalled on the development host.


### Preview and taskbar follow-up (candidate, visual verification pending)

The earlier gray-preview limitation motivated a source-owned Windhawk rendering
adapter for the exact PowerToys.MonacoPreviewHandler executable version
0.101.2362.0 and SHA-256-pinned `Assets/Monaco/index.html`. The reviewed
[PowerToys loader](https://github.com/microsoft/PowerToys/blob/v0.101.2362.0/src/common/FilePreviewCommon/MonacoHelper.cs)
opens that template read-only before
[document substitution](https://github.com/microsoft/PowerToys/blob/v0.101.2362.0/src/modules/previewpane/MonacoPreviewHandler/MonacoPreviewHandlerControl.cs).
Only that resolved file is redirected to a private-lifetime, read-only template
handle. Its temporary file is exclusively created with a random name and deleted
on close. The original asset, preview-provider registration and user files remain
untouched. Mismatch, write/async opens, unavailable temporary storage and
high-contrast initialization pass through. On unload, future reads are native;
reselect the file to refresh an existing preview. The normal install journal
stages, enables, backs up and removes the adapter alongside the other stylers.

Taskbar `Rectangle#BackgroundStroke`, present in the pinned upstream styler,
now maps Fill to `color.border.divider`. It is independent of BackgroundFill.
This adds no line, changes no geometry and avoids leaving the host gray stroke.

These source changes alone are not native visual acceptance. The earlier
observations remain historical; new installed/rendered evidence is required.


The initial preview installation passed settings checks but still rendered gray.
A numeric-only probe in the real preview host confirmed that default-temp creation
failed with Windows error 5 (access denied); the same exclusive/delete-on-close
creation succeeded in FOLDERID_LocalAppDataLow. The adapter now uses that existing
Windows folder without changing ACLs or process integrity. No diagnostic probe is
part of the distribution. Refreshed rendering still needs visual confirmation.

Owner screenshots also exposed Home's separate gray root and item hover fills,
and a briefly gray native scrollbar during folder navigation. Home now has
explicit root and item-presenter mappings. The scrollbar transition remains
unresolved until its transient paint path is diagnosed and verified.


### Loading and navigation transition correction

The owner confirmed the loaded Monaco preview now has a black background and
rose text, but its loading screen remained gray. The pinned PowerToys
[Settings](https://github.com/microsoft/PowerToys/blob/v0.101.2362.0/src/modules/previewpane/MonacoPreviewHandler/Settings.cs)
and loading-control sources establish a separate opaque WinForms background and
label. The adapter now maps those native paint calls only for the pinned host's
WinForms panel/label classes. It preserves brushes, geometry, progress and text.
This correction still requires observation of the refreshed loading screen.

A numeric-only scrollbar trace observed drawing inside DefWindowProcW with no
BeginPaint scope or DC owner. The native adapter now uses that actual window
origin for ScrollBar theme calls. Nested scopes restore their previous owner.
The transient folder-navigation result, Home and taskbar edge still require
visual confirmation; source tests and native compilation are not substitutes.


The owner rejected the first loading correction: gray labels and green progress
remained. A live drawing trace established `WindowsForms10.Static` (mixed case),
while the adapter matched uppercase `STATIC` case-sensitively. The matcher now
uses Windows' case-insensitive class convention. The same trace identified
`Progress` PP_TRANSPARENTBAR/state 0 and PP_FILL/PBFS_NORMAL in the native
progress control. Those draws now map to canonical progress tokens while
retaining their native mask and clipping. The regression fixture uses the real
observed class spelling and checks the progress paint path. Visual verification
of this correction is distinct from the earlier failed candidate's test passes.


### Explorer interaction correction

The owner accepted the corrected loading control, then reported that scrolling
still restored a gray scrollbar, filename renaming selected text in blue, and
the modern context menu retained a gray background. The retained numeric trace
shows ScrollBar theme draws inside SetScrollInfo with no DC owner, BeginPaint or
DefWindowProcW scope. The adapter now preserves the real originating window for
both synchronous scrollbar entry points; nested calls restore the previous scope.
It does not change scroll ranges, positions, redraw flags or return values.

A separate live color/class trace identifies the rename path as Edit under
CtrlNotifySink. ExtTextOutW receives the system highlight background internally,
without calling the exported SetBkColor hook. Only this selected-run paint is
mapped to text-selection roles, with the original text, flags and DC state kept.
Other editors and high-contrast mode are excluded.

The context-menu targets follow the pinned upstream File Explorer styler's
primary and overflow flyout roots and the official WinUI AppBarSeparator and
MenuFlyoutSeparator templates. Paint colors change; menu actions, order, icons,
keyboard behavior and separator geometry remain native. These changes require
fresh host readback and are not accepted based on generation or compilation.

## Native drag-selection rectangle

The candidate's ExplorerFrame.dll and dui70.dll both have fixed version
10.0.26100.9549. The adapter checks these module versions independently of the
Explorer executable and resolves exact public symbols. Missing modules,
different versions or unresolved symbols refuse initialization; no offsets are
hard-coded. The observed control is UIMarqueeSelector (control ID 0), rooted
at UIItemsView's HWNDElement vtable with an actual CabinetWClass HWND.

Only that control's background COLOR_HOTLIGHT query maps to
`color.interaction.marquee`, and its border COLOR_HIGHLIGHT query maps to
`color.interaction.drop-target`. Its observed GdiAlphaBlend background path uses
constant opacity 85/255; the rendering scope substitutes the canonical 12%
encoded as 31/255. Per-pixel alpha and other blend operations pass through.
The native solid border remains a documented deviation from dashed geometry.

The live paint trace also identifies a cached COLOR_HOTLIGHT system brush at
the background's PATCOPY operation. A color query cannot recolor that cached
brush. Within the same admitted background scope, the adapter replaces only
that exact brush for the synchronous draw and restores the original selected
brush afterward. A separately allocated brush of the same color, other raster
operations, and border paints retain their brushes. System brushes are never
changed or deleted. See Microsoft's [cached system-brush contract](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getsyscolorbrush).

Nested background and border scopes restore their previous state, including
unrelated controls. High contrast, disabled/unloading adapters, recursion,
different roots and non-Explorer windows pass through. No persistent control
property or global system color is changed. Only the admitted native fill draw
uses canonical source pixels before native composition. Unloading restores
future native paints through the same lifecycle. Hidden-window/offscreen native
regressions cover ownership, canonical pixels/opacity, nested scopes, unknown
blend formats and API arguments/return values. Live acceptance is separate.

## Explorer native caption composition

The recorded Explorer host composes its native Minimize, Maximize/Restore and
Close buttons over the XAML title strip. An opaque `Grid#TabContainerGrid`
background hid their glyphs while accessibility still exposed the commands.
The owner confirmed that excluding this background restored all three buttons.
Broad root/layout backgrounds are also excluded; the address-bar background
uses its specific `AddressBarControl` ancestor and tab-item fills keep their
existing state mappings. No button, hit-test region, window style or command is
removed or replaced.

The native adapter applies `color.surface.canvas` and `color.text.default`
through DWM caption/text attributes, with a nonmaterial backdrop. Its scope is
top-level `CabinetWClass` windows owned by the injected Explorer process. New
windows and theme/settings refreshes use the same path; unrelated application
windows and Explorer children are excluded. The XAML styler's whole-window
background-effect setting remains unset because it caused red accent fills.

DWM caption/text colors are write-only attributes on this host. The supported
baseline is the native Windows default, without a competing caption-color
adapter. Unload restores the documented native default; application requests
made after admission are captured and restored verbatim instead. The backdrop
attribute can be read and its original value is restored. No global
personalization value changes, no polling service is added, and high contrast
takes priority. This is an Explorer-specific adapter, not an arbitrary-app
caption-color guarantee. The native regression covers admission, window-style
preservation, new-window cleanup, request restoration and failure/high-contrast
passthrough; live appearance remains a separate acceptance gate.

See Microsoft's [DWM window-attribute contract](https://learn.microsoft.com/en-us/windows/win32/api/dwmapi/ne-dwmapi-dwmwindowattribute).

The pinned stylers terminate indexed target, style and resource arrays at an
empty string. Updating a shorter list through the CLI otherwise leaves old
indexed settings behind. Installation writes an explicit end marker after
each complete replacement list, including every control's nested styles.
Empty targets are never inserted between active rules. Backup and restoration
retain the original settings, and Test verifies the new markers with the other
managed values. The regression exercises shortening targets, nested styles
and resources while excluding obsolete entries from the effective list.

## Native selected-row focus

The recorded Explorer host draws the rename row outline through ListView part 1,
selected state 3, and the navigation outline through TreeView part 1/state 3. Its three observed blue perimeter colors now map to
`color.interaction.focus.ring`, retaining native geometry and antialiasing.
The two-pixel perimeter restriction leaves the same colors inside the row
untouched. Other states, colors, unrelated windows, unsupported transforms,
drawing flags and high contrast pass through. This is a color adapter, not a
replacement for native focus behavior; dashed geometry remains unsupported.

The hidden-window native regression checks the border and corner pixels,
interior color preservation, other states, clipping, disabled passthrough and
DC restoration. Live rename acceptance is recorded separately.

## Classic Explorer popup palette

The recorded host's “Show more options” menu uses `TrackPopupMenu` with a
`SHELLDLL_DefView` owner rooted at `CabinetWClass`, class `#32768` and the
`Menu` theme. The trace identifies item part 27, states 1 and 3, background
part 9, border part 10 and separator part 15. Part 27 is an exact-host fact,
not a portable SDK constant. Both popup entry points carry a nested owner
scope; unrelated owners and unknown parts/states pass through.

The early popup-background color query can precede the popup entry point.
Only `Menu` part 9/state 0's fill property may use the calling thread's active
Explorer window as context. It cannot select a window on another thread or
extend the fallback to text, borders or glyphs. See Microsoft's
[active-window contract](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getactivewindow).

The owner-requested black canvas uses `color.surface.canvas`. Normal labels
use `color.text.default`; disabled labels use `color.text.disabled`; hot
items use `color.interaction.hover.bg-strong` and `color.text.link-hover`.
Frames use `color.border.overlay` and separators use `color.border.divider`.
The native API does not distinguish pointer hover from keyboard hot state;
both retain that host state, rather than inventing separate input behavior.
Native geometry, ordering, icons, commands and return values are preserved.
High contrast takes precedence; no replacement menu or owner-draw conversion
is installed. Pixel/argument regressions are distinct from visual acceptance.

### Classic popup frame color

On the recorded host, the classic Explorer popup frame queries Menu part 10,
state 0, `TMT_FILLCOLORHINT` (3821). The scoped adapter maps this observed hint
to `color.border.overlay`; its ordinary fill/text palette does not otherwise
admit color-hint properties. Unknown hints and parts, unrelated popup owners,
disabled adapters and high-contrast mode retain the host value. The native
offscreen regression covers these boundaries. This query trace explains the
previous gray frame; it is separate from live visual acceptance.

### Modern submenu-open state

The owner recording shows a modern flyout parent switching from the hover
palette to gray when its child flyout opens. The Microsoft
[MenuFlyoutSubItem template](https://github.com/microsoft/microsoft-ui-xaml/blob/main/controls/dev/CommonStyles/MenuFlyout_themeresources.xaml)
defines `SubMenuOpened` in `Grid#LayoutRoot`'s `CommonStates`. The Explorer
mapping now keeps that state on `color.interaction.hover.bg`; Normal, Pressed
and Disabled keep their separate mappings. This matches the already styled
hover surface without replacing the flyout or changing its commands. Generated
palette regression is distinct from live verification on the recorded host.

### Notification action buttons

Toast action buttons (`Button#VerbButton`) use the canonical secondary-button
palette. The native `ContentPresenter` owns `CommonStates`, as documented by the
Microsoft [Button template](https://github.com/microsoft/microsoft-ui-xaml/blob/main/controls/dev/CommonStyles/Button_themeresources.xaml).
Normal, PointerOver, Pressed and Disabled receive their approved fill, label
and border roles. Native focus visuals retain their host behavior; no focus
visual property is overridden. Button text, actions, enabled state, dimensions, padding, order and border
thickness remain native. This covers the action button separately from the
already themed toast body; actual popup matching still needs live verification.

### Native XAML color serialization

Windhawk passes generated setter values to the Windows XAML parser. Color
properties and resource variables therefore use native `#RRGGBB` or
`#AARRGGBB`, including transparent secondary-button backgrounds. CSS `rgb()`
is not a native color and can cause the parser to reject a control's setters.
The generator preserves RGB and rounds alpha to the nearest native 8-bit
channel. This is output-format conversion, not a token-value change. The
regression checks alpha order, transparent fills and every generated shell
color against the native grammar. See Microsoft's
[Color syntax](https://learn.microsoft.com/en-us/uwp/api/windows.ui.color).


## PowerToys Markdown adapter

`host.json` records PowerToys 0.101.2362.0 executable/control/helper digests,
WebView native build 154.0.4258.37 and digest, observed NavigateToString/Navigate
method offsets, and four generated-header identities (dark/light, with/without
local images). A different identity passes through. The public SDK vtable was
observed with an isolated synthetic controller, then the normal route was
confirmed in the real preview process. The adapter never hooks a managed
callback thunk or retains a WebView interface.

CSS fits all four admitted extents and is padded to preserve length. The
normal route preserves the complete Unicode suffix. The route above the
PowerToys 1,500,000 UTF-8 byte threshold edits only that CSS extent in a fresh
host-created GUID HTML file under PowerToys' LocalLow MarkdownPreview-Temp
directory, with numeric file identity, final path, reparse and hard-link checks.
Partial writes restore original CSS, or refuse navigation if restoration
fails. CSP, original URI, suffix, local-image checks, resource/navigation
filters and disabled scripts/host objects/web messages remain host-owned.
The installed assemblies and original Markdown files are never changed.

The native regression covers synthetic Unicode/content preservation, header
refusal, bounded file edits, ownership/path/hard-link rejection, BOM handling,
partial-write recovery and unload state. Both live normal and large sample
routes were observed on the recorded host. Typography was revised after the
owner rejected the initial layout; final visual quality acceptance is still
open. Windows startup/loading surfaces before HTML navigation, other DPI,
high-contrast switching and additional document features are not certified.
Setup Test checks managed artifacts/settings; it does not prove native admission
or appearance. Reselect a file after update, disable, Restore or Uninstall.


### Markdown reading layout acceptance and hosted fixture correction

The owner accepted the improved heading sizes, spacing, code block, quotation
and table formatting after refreshing the live Markdown specimen. This is
bounded appearance acceptance; other DPI and runtime high-contrast cases remain
open. The installed managed adapter remains enabled and PowerToys remains the
parser and renderer.

The first hosted run after integration failed in two test fixtures. The native
Markdown test used the temporary directory spelling returned by Windows, which
can be an 8.3 alias. Its specimen now obtains the canonical path through a
directory handle, asserts non-reparse parents and separately tests alias
rejection. The production identity and path checks are unchanged.

The narrow composed-consumption trace showed Escape closing normally and the
later Confirm leaving the dialog open. Native dialog close queues an event;
opening the next confirmation before the sealed fixture's close handler ran
allowed the previous handler to clear its new pending state. The browser test
now observes the complete close event before the next open. The historical
candidate bytes, focus assertions, accessibility scan and all four closing
actions are retained. This corrects test scheduling, not the sealed candidate.

### Recompiled rollback and retained recovery verification

A real Latest Restore returned to the previous managed revision after changing
the Calculator adapter. Nine unchanged compiled adapters kept their identities.
The restored Calculator export was verified and recompiled, and the retained
previous Test runtime accepted its new effective compilation receipt. Reapply
of the corrected candidate then passed the installer's automatic Test. This is
lifecycle evidence; it does not accept the remaining visual states.
