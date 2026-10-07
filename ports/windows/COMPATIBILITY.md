# Windows compatibility, verification and recovery

## Compatibility boundary

The recorded candidates are Windows 11 x64 builds 26200.9550 and
26300.9550 with the redesigned Start layout. `host.json` records exact Explorer, StartDocked, SystemSettings,
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
Native navigation, top-level sizing and feature visibility are retained. Search
results reserve a square 1px frame and 2px leading edge; only their decorative
left-side pill is removed in favor of that continuous selection frame. No
control or label is hidden. ARIA selection takes priority over a stale pill
class, and nested result layers inherit the outer surface.

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

Explorer command-bar flyouts also use AppBarButton overflow parents. The Microsoft
[CommandBarFlyout template](https://github.com/microsoft/microsoft-ui-xaml/blob/main/src/controls/dev/CommandBarFlyout/CommandBarFlyout_themeresources.xaml)
sets `AppBarButtonInnerBorder.Background` in `OverflowSubMenuOpened`. That state
now maps to the same hover role; OverflowNormal, OverflowPressed and
OverflowDisabled retain their existing roles. A bounded live comparison on the
recorded host showed Open with and Compress to parents staying dark red while
their child menus were open, and Open with returning to black when Compress to
was opened. No command was executed. This verifies those two parent transitions,
not every extension menu or keyboard/DPI/accessibility variant.

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
reviewed WebView native builds 154.0.4258.37 and 154.0.4258.48, each with its
own complete-module digest and independently observed NavigateToString/Navigate
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


### Notepad production installation and existing-window discovery

The single installer updated the real Full installation with the production
chrome adapter and passed automatic Test; ten existing adapters were reused.
A fresh empty window displayed black toolbar/status/caption surfaces, rose
labels and a dark-red selected tab. Its File menu was dark red and native
keyboard focus used the red/rose brushes. Returning focus to the editor restored
the File control's normal background. Latest Restore restored native chrome
in that same unmodified window. Test through the retained previous runtime and
reapply with automatic Test then passed. These are bounded observations.

The existing-window discovery probe found the admitted Notepad chrome and
Paint ribbon classes on their UI threads in all open inspected processes,
then unregistered its callback successfully. The production adapter uses an
original shared discovery source and the WinUI bridge's exact binary digest;
it does not redistribute or copy a third-party shell styler. Live acceptance
of that production discovery path remains a separate gate.

### Shared Notepad and Paint chrome candidate

The shared WinUI chrome template generates separate adapters for the recorded
Notepad 11.2607.14.0 and Paint 11.2605.81.0 packages. Each admits its own named
chrome classes and the exact loaded runtime and diagnostics bridge digests.
Paint drawing controls, palettes and artwork are excluded. Both adapters are
included in the single public install.ps1 lifecycle and its restore journal.

A read-only development trace identified native TabbedWindow backdrop value 4
on the open Notepad windows and MainWindow value 2 on Paint. The backdrop API
returns their actual baseline; caption-color reads were rejected. The shared
adapter therefore restores the readable backdrop separately and never invents
an original caption color for existing windows. Live appearance, state exit
and lifecycle verification of this shared candidate remain required.


### Opaque Paint backing and native backdrop preservation

Live inspection of the initial shared candidate found that removing Paint's
native backdrop exposed windows behind its transparent AppChrome template.
Latest Restore returned its readable backdrop to value 2 and the opaque native
workspace. A bounded read-only trace identified the direct same-root Grid as
the app's backing layer. The corrected adapter retains and themes that Grid's
local background, while drawing and color controls remain excluded.

A new empty Notepad window at the previous revision demonstrated a black caption
with the native backdrop still enabled. Native backdrop mutation is therefore
removed; both its value and later application requests are preserved. Existing
unknown captions stay native until a captured request or a newly opened window
supplies a baseline. Live verification of the corrected Paint candidate remains
required.

The first opaque-backing candidate passed its installation checks and retained
the native backdrop, eliminating transparency. Its workspace remained gray:
the generic wrapper walk selected an outer ScrollViewer before the Paint Grid.
The backing selector now resolves Paint's direct Grid first; the earlier wrapper
logic remains available to the other admitted chrome roots. Live verification
of this selection correction remains required.


### Concurrent Markdown browser runtimes

A WebView2 update left both reviewed native versions loaded in the same live
PowerToys preview process. The old single-version adapter correctly refused the
new module, leaving the preview native gray. The adapter now admits only the
bounded identities recorded in `host.json`; each has independent hooks and
original-call storage. Initialization enumerates already loaded matching modules,
and later loads use the same complete-digest admission. Unknown versions remain
native. This does not freeze or weaken WebView2 updates.

The new runtime entry points were measured through an isolated empty public
WebView2 controller. Focused source checks and complete native DLL linking passed,
including independent runtime storage, unknown-module refusal and the existing
Unicode, header, file ownership, partial-write and unload regressions. Live
normal and large-file sample routes rendered black backgrounds, rose prose
and the accepted reading layout after installation. The large-file route
initially exposed an empty gray surface before its themed document loaded;
that startup surface is still unresolved. These observations do not establish
runtime accessibility or DPI coverage.


### Latest native appearance observations

The installed shared chrome candidate retains black Notepad editor, toolbar and
status regions and black Paint ribbon regions. The inspected fresh empty Notepad
caption remained native gray; a second window created after hook initialization
in that same process displayed a black caption. The creation trace captured an
actual caption request, confirming class admission while leaving first-window
startup timing unresolved. The existing Paint caption was red while active
and gray while inactive. Paint still draws a gray opaque workspace around its
unchanged white sample canvas. An earlier public metadata probe found no exposed
DesktopBackground, BackgroundColor, CanvasBorderColor or WorkspaceBackground
member on the exact Canvas and D2DSwapChainPanel classes. This excludes no future
documented customization path, but the current root background does not recolor
that opaque drawing surface. No artwork or palette color is substituted.

Explorer generic folders in the file list and navigation use the red glyphs.
Its generic tab icon remains yellow, and a native folder tooltip remains gray.
The previous DrawIconEx trace identified menu and preview-control icons rather
than the tab glyph; that rejected candidate is not integrated. The new bounded
acquisition and tooltip observers retain native API results and record only
numeric identity, caller, owner and paint metadata. Acquisition now proved a
24px generic closed-folder HICON from ExplorerFrame on two harmless folder
navigations. The source adapter covers that route through complete stock-glyph
identity and caller-owned replacement. The initial installed comparison failed
because extraction reentered the folder draw hook. With scoped native extraction
and inspection, a fresh numeric trace matched all stock pixels and created a
replacement. The visible XAML tab still stayed yellow, so its actual rendering
route remains unresolved. Remaining appearance gates
are open; this candidate is not ready for merge.

### Explorer tab bitmap conversion

The generic folder tab uses a XAML SoftwareBitmapSource populated through the
public IWICImagingFactory::CreateBitmapFromHICON method. Its stock image is
extracted at the tab's physical size and differs from the system image-list
image. The adapter now caches both complete stock identities and supplies a
separate themed icon only to the admitted ShellCommon caller. It preserves the
borrowed icon, native bitmap ownership, DPI dimensions, custom/overlay icons,
high contrast, error results and last-error state. Windowscodecs and ShellCommon
have pinned fixed versions and complete file digests. Unknown identities pass
through; neither system assets nor XAML image sources are rewritten.

An isolated installed comparison showed the generic tab turn red after a
harmless folder navigation. This does not establish every folder view, DPI,
accessibility or restored-state appearance.

The native folder harness compares converted bitmap pixels at eight sizes,
checks borrowed-icon preservation and native failure/last-error results, injects
replacement allocation failure, and checks stable cleanup in both COM apartment
modes. Its executable uses `tests/windows-explorer-native.manifest` as a sidecar
manifest so Windows reports the same module versions as the manifested Explorer
host. Identical native open/closed glyphs use the first complete stock identity;
no tolerance or shared image-list mutation is introduced. Hash-reader and factory
resources use exception-safe cleanup, and replacement failures retain native
conversion. These are native regression checks, not desktop appearance evidence.


### WebView2 154.0.4258.53 compatibility refresh

A later appearance check found both ordinary and large Markdown documents using
native gray rendering. The live preview had loaded WebView2 154.0.4258.53, whose
complete binary digest was absent from the adapter. The existing fail-closed
admission correctly retained its native behavior. An isolated empty controller
created through the public WebView2 APIs measured NavigateToString at RVA
0x8a290 and Navigate at RVA 0x8a1f0 in that exact module; these differ from the
two previously reviewed builds. Adapter 1.2.1 adds this complete identity with
independent original-call storage. The PowerToys host and template identities,
document handling, older reviewed runtimes and unknown-runtime refusal remain
unchanged. This refresh alone does not establish startup-surface appearance,
accessibility or DPI acceptance.


### Paint public caption colors

The recorded Paint package exposes readable nullable overrides through
[AppWindowTitleBar](https://learn.microsoft.com/en-us/windows/windows-app-sdk/api/winrt/microsoft.ui.windowing.appwindowtitlebar?view=windows-app-sdk-1.8).
A bounded live comparison changed its red active caption to black with rose
symbols; disabling it restored the native caption. The generated Paint adapter
uses those twelve public colors only when customization is supported and the
native MSPaintApp composition does not extend content into its title bar.
Its mapped active/inactive backgrounds are black; hover and pressed buttons use
the corresponding interaction roles. Native caption geometry remains intact.

Each UI thread captures the actual nullable values before writing. A stable
window-property token prevents restoration through a destroyed or reused HWND.
Later application replacements are preserved. Partial writes retain restoration
ownership; failures decline that caption and retry cleanup without discarding
the captured values. High contrast and unload use the same restoration path.
The single install.ps1 lifecycle installs and restores this production adapter.

This public mechanism is generated only for Paint. Notepad's custom tab caption
retains its separate captured native path. Paint's opaque gray drawing workspace
is still unresolved; artwork, swatches and drawing controls remain native.
Active/inactive, button-state and lifecycle checks of the integrated candidate
remain required. The earlier caption observations above are historical.

### App-menu discovery timing

An installed Paint File-menu comparison showed native gray on its first
capture and the token palette after the periodic refresh. The shared chrome
adapter now consumes the exact MenuFlyoutPresenter, MenuFlyoutItem and
MenuFlyoutSubItem additions on their owning dispatcher. It applies existing
resource overrides only when a loaded popup shares an already admitted,
prepared chrome XamlRoot. Unknown classes, other islands, unloaded controls,
high contrast and cleanup pass through. The periodic path remains the retry.
One control has one resource owner across the island's chrome roots, retaining
the native resource/state restoration path. No new local hover-paint override
or document/canvas access is introduced. Native admission and cleanup checks
are separate from live first-frame appearance acceptance, which remains open.

### Explorer navigation-pin hover draw

A bounded live trace on the recorded comctl32 runtime identified image 1 in
the three-entry navigation state list. Rest and hover use the same ILD_SCALE
and ILS_NORMAL draw; hover changes only the background request from CLR_NONE
to CLR_DEFAULT. The native adapter now admits these two background flags and
renders the glyph on a transparent owned DIB before compositing its original
coverage with the mapped red. The existing navigation-row fill is preserved.
Other background colors, image lists, states, transforms, unrelated owners
and high contrast still pass through. The native regression checks both flags,
transparent backdrop, argument preservation and refusal of unknown requests.
Live hover/exit acceptance remains separate from the executable regression.

### Retired app-control resources

The shared Notepad/Paint chrome adapter restores and removes resource receipts
for controls whose weak reference has expired, both during ordinary refresh and
before a full popup receipt list admits another control. The 1024-live-control
limit stays unchanged. A failed restoration retains its ownership receipt for
the existing cleanup retry; later application replacements and deletions remain
untouched. This prevents closed popups from permanently exhausting the bounded
list. Native synthetic regressions exercise repeated full-capacity retirement,
failed restoration and retry with a later application resource replacement.
These checks do not establish the cause of any particular desktop gray surface
or accept first-frame, startup, DPI or accessibility appearance.

### Markdown controller backing ownership

The recorded WebView2 154.0.4258.53 public Controller2 setter receives transparent
white from the pinned PowerToys Markdown host. Microsoft documents that this
exposes the hosting app behind content and during navigation. The generated
adapter maps only this observed request to the canonical opaque canvas, with
per-controller receipts restored on their owning UI thread. Full-module digest
and public getter/setter identities are checked independently; the other
reviewed WebView builds retain their existing HTML styling without this new
background mapping. Unknown modules remain native.

A process-local default is set before renderer creation only when the host has
no existing override. It is removed on disable/unload only while the same value
is still owned. No user or machine environment setting changes. Later host
colors, high contrast and close calls retain their behavior. Failed restoration
keeps its receipt and resident cleanup code rather than unloading live callbacks.
The native regression exercises restoration failure/retry and later host changes.
Real startup-transition acceptance remains separate from those checks.

Public contract: [Microsoft Controller2 background documentation](https://learn.microsoft.com/en-us/microsoft-edge/webview2/reference/win32/icorewebview2controller2?view=webview2-1.0.2849.39).

### Modern shell scrollbar resources

The recorded Explorer Home view uses the modern XAML scrollbar rather than the
native file-list scrollbar. A live comparison found its panning indicator gray
while the native file list remained red. The shell resource mapping now includes
the named panning/expanded thumb, hover/pressed/disabled fills, track/stroke and
arrow resources. Thumb states use the existing scrollbar roles, tracks use the
canvas and arrows use the text ladder. Geometry, scrolling, indicator animations
and focus remain native. These settings are installed and restored by the same
public lifecycle; unknown fingerprints still refuse Full mode. Native appearance
and transition acceptance remain separate from generated-resource checks.

Resource contract: [Microsoft ScrollBar template](https://github.com/microsoft/microsoft-ui-xaml/blob/main/controls/dev/CommonStyles/ScrollBar_themeresources.xaml).

### Readable Notepad caption ownership (superseded whole-title scope)

A fresh first Notepad window remained gray because it was created before the
native caption hook could capture a baseline. The saved exact-package public
probe reports customization support, no extended title content and nullable
background overrides. Notepad now shares Paint's public caption-color adapter,
using the same twelve token roles and owning-thread restoration receipts. The
legacy write-only caption hook forwards both applications' requests unchanged.
Custom title composition, unknown packages/runtime, high contrast, destroyed or
reused windows and later app replacements retain their existing refusal and
ownership checks. No drag geometry, tabs or document content is changed. Native
regressions cover nullable/explicit baselines, failures, retry and window reuse
for both adapters. Fresh-window appearance remains a separate live check.

### Notepad custom tab-caption preservation (superseded button-only scope)

The previous twelve-color caption contract could display a system title over
Notepad's tab strip. Its exact-package public getter reported no extended title
content, so that getter alone did not establish a native-title layout. Notepad
now admits only the eight `Button*Color` properties. Whole-title background,
foreground and inactive colors are host-owned and rejected before any COM
read or write. The existing XAML adapter continues to theme the tab strip.
The button contract applies to custom content without changing title mode,
drag regions, window styles, tabs or documents. Paint retains its twelve-color
native-title contract and declines extended title content.

Capture, application-replacement detection and restore iterate the same admitted
property list. Unload and high contrast retain the captured nullable baselines.
An affected window may retain the old system caption until it is reopened;
save documents before reopening. The installer never closes applications.
Native regressions verify the excluded setters cannot reach a COM object and
that Paint's composition refusal remains intact. Live appearance and lifecycle
checks remain separate from these synthetic checks.

### Notepad public caption refusal

A fresh-process comparison on the recorded Notepad package reproduced the
native title covering its custom tabs with the eight button-only caption
properties. Omitting the complete public caption path exposed the tabs again
and permitted normal close/reopen. The former whole-title and button-only
contracts remain historical observations above; neither preserves this layout.

Notepad now admits zero public caption slots and returns before enumeration,
AppWindow lookup, getters or setters. Its existing XAML resources continue to
theme the tabs, toolbar and editor; native caption symbols remain native. The
write-only legacy caption path remains excluded because an existing window's
previous override cannot be read safely. No title-mode, window-style or geometry
change compensates for that refusal. Paint retains its recorded public caption
contract and ownership/restoration checks.

At that candidate, the uncovered Notepad header remained gray. A separate
native-backdrop comparison exposed the system accent color and did not solve
that requirement; it was not distributed. The later captured native-header
correction below retains this complete public-caption refusal. Save documents before reopening an affected retained
process. The installer never closes applications. Native regression calls the
real generated refusal entry without a WinRT apartment and rejects every
unadmitted property before COM. Real app states remain separate acceptance.

### Explorer scrollbar template ownership

A bounded live trace on the recorded Explorer runtime found the application
scrollbar resources already red while the instantiated Home thumb still held
the original translucent white brush. Resource settings alone therefore do not
prove that the template uses them. Exact observed WinUI primitive types and
vertical/horizontal thumb and panning parts now receive scoped property rules
through the existing pinned Explorer styler. ConsciousStates covers collapsed,
expanded and the native no-animation variants; CommonStates covers disabled
parts. Rectangle Fill is overridden only while disabled, preserving its normal
template binding. No new observer is distributed. Indicator geometry, opacity,
scrolling, native timing and existing compatibility/rollback admission remain
unchanged. Live transition acceptance is separate from settings verification.

### Search intermediate paint layers

Selected Search results can retain black intermediate wrappers even when their
outer frame and text are themed. Descendant background colors now inherit their
result state, and selected fills follow nested inheritance rules in the cascade.
This applies to result subtrees only; image contents, background images, focus,
ARIA deselection, layout and forced-color handling are preserved. Synthetic
regressions include an additional host paint layer. Native Search appearance
remains a separate acceptance check.

### Closed XAML host lifetime

The recorded Notepad runtime can retain a closed DesktopWindowXamlSource whose
weak reference still resolves. Its public SystemBackdrop getter accesses the
island released by Close. Both shared app-chrome adapters now require an attached
public SiteBridge before reading or restoring an island backdrop; refresh also
requires a loaded root with a XamlRoot on its owning thread. A closed host receives
no backdrop access, and an already owned backdrop is not polled each timer tick.
Attached hosts retain their exact baseline and later application replacements.
The native regression exercises attached restore, later application colors and
a retained host after its bridge is gone. Stable first-process and close/reopen
behavior still require real application checks.

Public lifetime implementation: [Microsoft DesktopWindowXamlSource](https://github.com/microsoft/microsoft-ui-xaml/blob/main/dxaml/xcp/dxaml/lib/DesktopWindowXamlSource_Partial.cpp).

### Explorer renderer admission at startup

Windhawk can initialize before Explorer executes. The native adapter previously
required ExplorerFrame and DirectUI to have been loaded already, so an otherwise
compatible process could lose native styling at startup. It now acquires those
System32 rendering modules before symbol admission, checks their actual loaded
paths and retains its references until after hooks are removed. Exact fixed
versions, symbols, common-controls admission and high-contrast refusal remain
unchanged. Incomplete loads and failed admission balance their references.
The isolated startup diagnostic reproduced missing-module refusal and successful
admission after loading the modules; the native regression covers dependency
ordering, rejected paths/versions and reference ownership. This does not certify
a real Explorer restart or new Windows sign-in.

Lifecycle contract: [Windhawk callbacks](https://github.com/ramensoftware/windhawk/wiki/Creating-a-new-mod#callback-functions).


### Subtle and split-button resource states

The chrome palette now covers the public SubtleButton and SplitButton rest,
pointer-over, pressed and disabled brush families, SplitButton checked states,
its divider and secondary foreground, and the opposite-half app-bar hover
brush. DropDownButton secondary foreground uses its three public keys; its
background remains part of the inherited button template. This closes a
resource-coverage gap without replacing native state groups or permanently
assigning a control's hovered background.

A SplitButton owns state-controlled backgrounds above its two ButtonBase
children, so its exact framework class receives the same local resource
overrides as other admitted chrome controls. Application data controls and
lookalike classes are excluded. Existing ownership receipts restore missing,
null and populated local entries and preserve later application replacements.
High contrast and the package/runtime compatibility checks remain unchanged.

These resource names come from the upstream public templates, not a dump of
every installed application template. Contract/native checks prove palette,
scope and restoration behavior; they do not establish live hover/focus
acceptance in Notepad, Calculator or Paint. Retained application-specific
animations may need separate observed evidence.

Template references: [WinUI Button](https://github.com/microsoft/microsoft-ui-xaml/blob/main/controls/dev/CommonStyles/Button_themeresources.xaml),
[SplitButton](https://github.com/microsoft/microsoft-ui-xaml/blob/main/controls/dev/SplitButton/SplitButton_themeresources.xaml),
[DropDownButton](https://github.com/microsoft/microsoft-ui-xaml/blob/main/controls/dev/DropDownButton/DropDownButton_themeresources.xaml).


### Search result frame sizing

The reserved result frame now uses border-box sizing on suggestion/container
rows only. Under a content-box host width, padding and the frame previously
extended beyond an overflow-clipped result column. The synthetic reproduction
placed the trailing edge 27 pixels outside that column; right-to-left layout
reproduced the corresponding leading-edge overflow. Existing fixtures supplied
border-box themselves and did not expose that failure.

The correction fits padding and frame into the existing host width. It does not
assign a width, padding, position, overflow mode or global sizing rule. The
presentation allowlist admits this value only for the exact two row selectors.
Browser regressions cover both directions, narrow/zoom layouts, hover exit,
selection/deselection and focus, and verify unrelated controls keep host sizing.
This is a reproduced layout defect and a synthetic correction; the actual
Search compositor still needs an appearance check after installation.

### Native slider resource coverage

The exact Paint package's AccessibleSlider controls use native WinUI Slider
templates for size, opacity and zoom. A numeric brush trace identified the
unfilled rail and thumb resources missing from the shared chrome palette. The
palette now maps the thumb and filled rail to the approved primary-action
accent, with distinct hover, pressed and disabled roles; the unfilled rail
uses the control-boundary role. This follows the range component's native
accent semantics. Labels remain rose and outer thumb backing uses the input
surface. No value, range, orientation, dimensions, artwork or palette swatch
property is changed.

The resource names and brush types follow the pinned
[WinUI Slider template](https://github.com/microsoft/microsoft-ui-xaml/blob/8027ff4af619eb470fab63bf4609c6404ee73e17/dev/CommonStyles/Slider_themeresources.xaml).
Color-valued animation resources are excluded from this brush-only palette.
The existing per-control ownership path retains exact prior local entries,
restores only entries still owned by the adapter and preserves later app
changes. Native high contrast still declines the theme. A resource-only live
comparison showed themed rails while retaining size, opacity, zoom and blank
artwork; production installation and state-transition acceptance are separate
checks. Paint's gray slider containers and drawing workspace remain unresolved.

### Paint slider container ownership

A read-only trace including acrylic brush types identified the static direct
Grid backgrounds under PaintUI.BrushSizeSlider and PaintUI.PercentageSlider,
with opaque neutral tint 44/44/44. The chrome adapter admits only that observed
class, immediate parent, background property and tint together. It substitutes
the approved black canvas brush through the existing local-value receipt path;
disable restores the exact original acrylic value if it is still adapter-owned.
Other types, parents, properties and tints are refused. The acrylic object's
properties are never changed, and later application replacements are preserved.

This is separate from Slider's state resources and does not alter native size,
opacity or zoom values, artwork, swatches or drawing-renderer behavior. The gray
drawing workspace remains an unresolved boundary. Production appearance and
rollback are checked separately from the admission and ownership regressions.


### Notepad captured native header backing

After the public-caption refusal, a fresh empty production window retained a
gray strip outside its narrow tab island. A bounded comparison combined the
known native caption color with the readable DWM backdrop; the new empty window
showed black across that strip, visible custom tabs and all three native buttons.
Disabling the comparison restored the gray strip. This comparison is separate
from final production acceptance.

The Notepad adapter now colors only native windows created after its hooks are
installed, or windows whose own caption-color request supplies a restore value.
Existing unknown caption colors remain untouched. It reads and retains the exact
system-backdrop value only for these captured owners. Later application requests
update the restore baseline; an unexpected external backdrop change is preserved.
Failed reads or writes retain recovery ownership for retry. High contrast and
disable restore the captured values. Public AppWindow/title-bar APIs remain
entirely refused, and no window mode, style, geometry or document is changed.
Paint retains its existing native-backdrop passthrough. Save desired documents
before reopening an older Notepad window; setup does not close applications.

The production later-window check showed black in active, inactive, maximized
and restored states with visible custom tabs and native buttons. After closing
all verified-empty agent test windows and confirming the process exited, the
first window of a fresh production process still showed a gray native strip
outside its tab island. This is a failed first-startup appearance check, not a
complete startup correction. A separate readable-backdrop-only comparison
turned that strip accent red, not black, and was rejected. Unknown write-only
caption colors remain untouched; changing only the readable backdrop does not
meet the black-header requirement. The production adapters were restored.

### Cached native button states

Read-only traces on the recorded Notepad and Paint packages found neutral
brushes retained in CommonStates animation frames and setters. Resource
replacement alone did not replace these cached objects. The shared correction
exchanges only zero-time, one-brush color frames targeting ContentPresenter,
RootGrid or ChevronIcon, and public unsealed brush setters whose targets resolve
inside the admitted control. Unknown/mixed timelines, non-color properties,
unresolved targets and data subtrees remain native. Original objects are kept
for exact restoration; application replacements win and failures retain recovery
ownership. Calculator uses the same source against Windows.UI.Xaml for its
standard dropdown/button controls, preserving its calculation-button contract.

The shell maps also supply native button brush aliases for normal, hover,
pressed, disabled and supported checked states. Settings uses square Button and
SplitButton corners without naming the Update action. Existing pinned styler
restoration owns those resource changes. Compilation and ownership checks are
separate from rendered hover, focus and disabled acceptance. No input,
calculation, document or artwork changes are part of this correction.

### Owned Notepad composition backing

The new shared adapter captures the public composition system-backdrop brush
through the documented window handle interface. It retains the exact original
object, including a null baseline, and installs a black brush on the same UI
thread. A window property ties recovery to the original HWND owner; destroyed
or reused windows are refused. Later application brush replacements win, and
failed writes retain recovery state for retry. This path does not change
AppWindow.TitleBar, caption layout or tabs; Paint and Terminal decline it.
The previous first-window gray-strip failure remains historical evidence.
Rendered first-window and active/inactive acceptance is still required.

### Explorer clipped-name tooltip

The native adapter admits only a standard tooltips_class32 popup in Explorer's
own process, with an Explorer owner or current-tool window. It uses window and
owner metadata, not tooltip text or foreground inference. Standard tooltip
background, edge and text use canonical roles. The folder draw path also uses
this same owner admission for embedded generic folder glyphs. Complete stock
pixels must match at the requested size; tooltip ownership alone cannot replace
an icon. Custom glyphs, overlays and cropped requests remain native. This does
not broaden tab HICON acquisition or WIC conversion admission. Unrelated and unknown popups,
high contrast, clipping and native passthrough remain preserved. The offscreen
ownership/paint regression passed; the live clipped-name popup is not yet
accepted.

### Terminal native chrome

The bundled legacy-XAML adapter requires the recorded Terminal package and
exact Windows.UI.Xaml.dll and Microsoft.UI.Xaml.2.8 controls-library digests.
Only TerminalApp.TabRowControl and associated native menu chrome are admitted;
the terminal renderer, command palette and suggestions are excluded. It reuses
the shared resource, cached-color-state and owned-restoration paths, with the
legacy dispatcher and activation APIs. Native caption overrides are declined.
The existing single install.ps1 lifecycle journals installation and recovery.
The synthetic legacy boundary, ownership and worker-shutdown checks passed;
real menu and tab rendering remains unverified. An application/runtime update
outside these identities refuses the adapter rather than extending its scope.

### Deferred native state inspection

A live numeric trace on the recorded Notepad package found repeated E_FAIL
results while inspecting native CommonStates setters. The adapter then restored
the entire toolbar resource root, bringing back native gray menus and buttons.
The shared cached-state adapter now declines a setter or storyboard whose public
inspection cannot complete, before stopping a clock or acquiring write ownership.
It retains the native unresolved state and the otherwise owned theme root.
Target paths are captured once before admission rather than reread during a write.
Mutation and restoration failures still retain their existing recovery paths;
no denied write is converted into success. The same source is generated for
Calculator, Notepad, Paint and Terminal. Rendered hover and native header checks
remain distinct from this correction's ownership regressions.

The preview-backing boundary additionally requires the recorded native preview
surrogate and Explorer executable digests in host.json. An unknown or restarted
Explorer process outside the adapter's captured owner set retains native backing
until the adapter is reloaded. It does not alter preview registration or install
another application. The existing Markdown adapter owns this loading surface;
setup, Test and recovery still use the same install.ps1 entry point.


### Settings split-button parent brushes

A read-only live trace found the canonical Settings resource colors already
present while a native SplitButton and both inner Button backgrounds retained
their previous accent brush. Replacing resource entries alone did not update
that control's resting template bindings. The shared Settings SplitButton rule
now applies the mapped canvas, foreground and control-border roles to the parent
control alongside its existing square-corner rule. Its template owns the inner
parts and native interaction transitions; no action label, page, filename,
screen position or literal old color selects the correction.

A temporary parent-background comparison replaced both native resting fills
with black, then restored the original setting values exactly. The production
foreground, border, hover exit and recovery checks remain required. This does
not establish all Settings states, disabled controls, high-contrast switching
or fresh-process attachment. A separate adapter reload restored a previously
unstyled Settings window; that is a recovery observation, not a diagnosis of
the original attachment failure.

An update while Settings was open crashed in Windows.UI.Xaml.dll. Original
application-error records reported a different module version from the fresh
disk read. That discrepancy and the crash cause remain unresolved. Restore
Latest succeeded, and the restored baseline opened with readable rose text on
a dark-red resting split button. Reapply with Settings closed and standalone
Test passed; those readbacks do not establish safe live reload or visual
acceptance of the new rule.

### Unchanged adapter lifecycle

Update retains an already enabled adapter without disable, settings writes or
reenable only when its prior managed source digest, version, settings and
compiled-binary/configuration receipt match, and the requested values already
match its settings. The new journal entry records that no adapter mutation was
acquired. Its rollback and failure cleanup leave that adapter and later user
edits untouched. A later original-state restore still checks changes owned by
the older transaction. Missing receipts, changed binaries, configurations or
settings continue through the existing verified staging/recovery path.

On the preceding candidate, the existing and a new empty Notepad window in
the same process both showed native gray tab/menu chrome after the update.
Package, XAML runtime and diagnostics-bridge disk identities matched the
recorded contract. This is a failed attachment/appearance observation; it does
not prove why root discovery failed or solve the gray composition strip.
Paint retained themed toolbar/menu chrome with gray workspace and scrollbar.
The no-mutation lifecycle correction prevents unnecessary cycling, but does
not claim to repair any already lost attachment or resolve those boundaries.


### Settings calendar parent surface

An installed Settings date flyout retained its native gray calendar surface
after the surrounding page was themed. The standard CalendarView control now
uses the approved raised surface, default foreground, overlay border and zero
corner radius through the pinned Settings styler. The rule selects the control
class, not the Update page, an action label, a date or a screen position.

Background, Foreground and BorderBrush are public Control properties consumed
by CalendarView's template. Date values, blackout/selection rules, item states,
navigation and date formatting retain application ownership. The existing
styler and public installer own exact restoration. This structural correction
does not claim native flyout, keyboard, hover or high-contrast acceptance;
the live popup comparison and rollback remain separate checks.

Reference: [Microsoft CalendarView styling](https://learn.microsoft.com/en-us/windows/apps/develop/ui/controls/calendar-view).


### Exact post-restart host candidate

A subsequent host readback reported build 26300.9550. The remaining twelve
recorded shell/package/layout inputs matched the earlier 26200.9550 candidate.
Seven exact pinned binary digests and the four targeted application package
identities also matched. This adds only that complete fingerprint as a candidate;
it does not accept a build range, bypass a missing input or promote native
appearance coverage. Unknown hosts still refuse Full setup and activation.

The public Update refused this new host before theme mutation while it was
unrecorded. New test windows then showed native gray UI with no theme engine
running. Those captures are not evidence about the enabled adapter rendering.
Fresh-process, sign-in and live appearance checks remain separate from this
structural comparison. Older saved revisions retain their original host lists;
Test against an older restored revision can therefore report this new host as
unsupported. Original Restore remains the route to native appearance after
an incompatible Windows change. Reapply uses the explicitly pinned new
candidate and repeats its own exact preflight.


### Settings CoreWindow startup and recovery

A read-only startup trace found a Settings-owned top-level CoreWindow and no
XAML attachment attempt. The pinned upstream late-start lookup admitted only a
CoreWindow inside ApplicationFrameWindow, so it missed this host's window. A
controlled comparison correcting that lookup opened fresh Settings with black
surfaces and rose text; its Update calendar also used the mapped palette.

Setup verifies the original pinned upstream source, then substitutes the owned
window-discovery fragment before compilation. The original source, attribution
and license stay intact in the retained dependency; vendor source and binaries
are not committed. The derived source digest is journaled separately from its
upstream digest. Missing or ambiguous source anchors refuse preparation.

The fragment admits only the exact Settings executable and loaded XAML binary.
It accepts a unique own-process CoreWindow either directly or inside the native
frame. Initialization, settings changes and restoration use this same lookup;
when already attached it also requires the recorded UI thread. Other processes,
unknown classes, ambiguous roots and high-contrast initialization are declined.
No retry worker, input action, window-text selector or new executable include is
introduced. The same install.ps1 owns staging, Test and offline rollback.

This corrects the observed startup mismatch. It does not establish safe live
Settings reload, all hover/focus/disabled states, runtime accessibility switching
or sign-in acceptance. Close Settings before Update or Restore. The retained
Notepad gray composition strip and Paint workspace/scrollbar failures remained
unresolved at that candidate; the later scrollbar observation is recorded below.

### Native WinUI scrollbar resources

The live Paint viewport exposes a WinUI ScrollBar beside its excluded drawing
surface. The shared chrome adapter previously had only a locally constructed
thumb-brush fallback; it omitted ScrollBar from its owned control-resource path
and omitted the native thumb, track, arrow and state resource family. The new
mapping supplies canonical rest, pointer-over, pressed and disabled brushes and
admits only the exact modern or legacy ScrollBar class within an already admitted
chrome root. Templates, scroll values, dimensions and artwork remain native.
Color-valued animation resources are not replaced with brushes. The resource keys
come from the pinned [WinUI ScrollBar template](https://github.com/microsoft/microsoft-ui-xaml/blob/8027ff4af619eb470fab63bf4609c6404ee73e17/dev/CommonStyles/ScrollBar_themeresources.xaml).
Live appearance and full transition acceptance remain separate from the source
and native ownership regressions.


### Installed scrollbar and first-window comparison

After Update and standalone Test, Paint's native viewport scrollbar used dark,
red and rose colors at rest, after scrolling down and after returning to the
original viewport. Restore Latest recovered the prior adapter identities; its
baseline passed Test. Reapply and a separately recorded final Test recovered
the current identities. Ten unchanged adapters retained their compiled files
through that cycle, and no diagnostic stayed enabled. Repeated final scroll
checks retained the themed scrollbar and the blank artwork, dimensions and
zoom. These bounded captures do not accept every animation frame, disabled
state, DPI variation or accessibility switch. The gray drawing surround remains
unresolved and distinct from the mapped scrollbar.

A clean Notepad executable launch retained the gray first-window strip, while
a later empty window in that same process had a black header and visible custom
tabs. A temporary read-only observer found that the first native window already
existed when the observer initialized. It saw no caption-color request in that
bounded interval. This supports a startup-timing investigation; it does not
reconstruct an earlier caption override or prove production-hook ordering. The
observer was disabled afterward. Unknown caption baselines and the excluded
public title APIs remain untouched.


### Classic menu keyboard focus

A bounded native paint trace on the recorded host identified a separate Menu
part 26/state 1 when keyboard navigation selects a classic popup row. Ordinary
item paints still use part 27/states 1 and 3. The adapter previously admitted
only the ordinary item, leaving the independent focus background gray.

The native adapter now admits only the observed 26/1 combination under its
existing popup-owner and DC checks. Neutral low-light fill uses the strong menu
hover role; the bright outline and its antialiasing use the focus-ring role.
Black corners and nonneutral pixels survive. Other focus states, foreign owners,
unsupported transforms and high contrast retain native drawing. Clipping and
DC state remain in the existing offscreen rendering path. Setup and rollback
use the same bundled adapter and the single install.ps1 lifecycle.

This describes a bounded rendering correction. It does not resolve the Notepad
first-window strip, Paint workspace, or unavailable Settings appearance check.


### Transparent button transition endpoints

A bounded read-only trace on the recorded Notepad and Paint packages found
ordinary Button templates with a transparent white normal background and an
83 ms ContentPresenter background transition. Their hover brushes already
used the mapped dark red, and state exit returned to the native transparent
white base. Brush property readback reports the destination immediately;
it does not report the compositor's intermediate color. Microsoft documents
this distinction, and its public implementation uses RGB color interpolation.

The shared chrome adapter now normalizes only that observed transparent-white
base to the mapped ButtonBackground RGB, preserving the original zero alpha,
hit testing and native animation. Admission requires the direct named
ContentPresenter, the observed transition duration, the four standard
CommonStates, an empty Normal state, recognized color-only storyboards, and
background frames in PointerOver/Pressed. The recorded Disabled state can
omit a background frame. Additional native state setters are left untouched.
Unknown shapes and unreadable expressions remain native.
No state is forced, transition removed, command invoked, dimension changed,
or drawing/document property read by this normalization.

The original local brush or UnsetValue is retained by identity. Rollback
restores that exact brush or clears the added local override. A later
application write ends ownership permanently for that control; partial writes
retain their receipt for cleanup retry. Notepad, Paint, Calculator's generic
controls and Terminal consume the shared source through the same install.ps1
lifecycle. This correction does not resolve Notepad's unknown first-window
caption baseline or Paint's excluded drawing surround. Rendered acceptance
of each application and state remains separate from template and lifecycle
checks.

Reference: [Microsoft's background transition contract](https://learn.microsoft.com/windows/windows-app-sdk/api/winrt/microsoft.ui.xaml.controls.panel.backgroundtransition)
and [its RGB brush animation implementation](https://github.com/microsoft/microsoft-ui-xaml/blob/8463f45162149de0ec3ad7df752596893fe3e13e/dxaml/xcp/components/comptree/SharedTransitionAnimations.cpp).

### Immediate owned button background transitions

The recorded Paint and Calculator button templates retain an 83 ms
ContentPresenter background interpolation, independently of the destination
brush. Numeric presenter callbacks confirmed state changes that outer-button
callbacks missed. Settled themed brush values alone cannot establish the
absence of an intermediate neutral frame.

The shared adapter now replaces that cosmetic interpolation with a separate
immediate BrushTransition. Admission requires a loaded named ContentPresenter,
the same nearest owning Control, a readable transition and the exact observed
83 ms duration, within the existing admitted button/chrome traversal. It does
not modify the original transition object, native state definitions, geometry,
commands, document content, drawing surfaces or other animation properties.
Unknown/unreadable templates remain native.

Each presenter keeps its original transition by identity. Deactivation, high
contrast, update, Restore and Uninstall restore it only while the applied
object is still owned. Later application replacement/deletion ends ownership
permanently; partial writes and failed restoration retain the receipt for
retry. Calculator, Notepad, Paint and Terminal use the same generated helper
and existing single install.ps1 lifecycle. Synthetic admission/ownership tests
remain separate from live frame acceptance. This correction does not resolve
Paint's drawing surround, Notepad's first-window header or the remaining
startup, DPI, accessibility and clean-PC checks.

Microsoft documents the public [BackgroundTransition API](https://learn.microsoft.com/windows/windows-app-sdk/api/winrt/microsoft.ui.xaml.controls.contentpresenter.backgroundtransition)
and [BrushTransition duration](https://learn.microsoft.com/uwp/api/windows.ui.xaml.brushtransition.duration).


### Immediate admitted popup template refresh

An installed Paint View flyout was captured with a native gray first surface,
followed by its themed surface. A bounded read-only discovery trace found its
presenter and menu controls already loaded on their owning UI thread. The prior
discovery callback refreshed only each control's resources; the later bounded
bridge handled cached template children and color states.

Notepad, Paint and Terminal now run that same bridge synchronously for the exact
discovered popup subtree. Loaded state, UI-thread access, known popup class and
the admitted owner's XamlRoot identity remain required. Its styling traversal visits neither the
full root nor other popups; the existing protected-brush lookup still checks
the admitted owner before styling. The existing data exclusions,
4096-object bound, resource ownership, cached-state admission and restoration
paths are reused. A partial failure follows the ordinary root restoration and
cleanup-retry path. This does not broaden native setter inspection or artwork
access. Calculator retains its separate legacy adapter.

This is a timing correction, not acceptance of every intermediate frame. Fresh
popup, hover and pointer-exit rendering checks remain distinct from structural
and ownership checks. The separate Paint drawing surround and Notepad
first-window header requirements remain unresolved.

A separate read-only Paint probe found no owning XAML background on its exact
swap-chain panel. The documented SwapChainPanel background setter is unsupported
and was not called. The subsequent public ClearView probe observed only black
Direct2D clears, with no identified neutral surround clear. Those results do not
admit a drawing-resource recolor or establish that the surround is unthemeable.
