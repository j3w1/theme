# j3w1 for Windows 11

True-black surfaces, rose text, red borders and small black/red cursors, generated
from the canonical j3w1 tokens. This port is **experimental**. Full styling
requires an exact supported Windows 11 x64 host; it does not theme every
application. [Coverage](COVERAGE.md) lists implemented surfaces, owner
acceptances and open checks; [Compatibility](COMPATIBILITY.md) holds exact host
boundaries, technical details, developer/offline instructions and history.

The included wallpaper centers the owner-supplied j3w1 logo on true black.
The original transparent logo lives in `src/j3w1-logo.png`; generation creates
the compact 16:10 BMP installed for the desktop and, when the current image is
recoverable, the lock screen. The installer retains its existing wallpaper
layout, verification and rollback workflow. No OneDrive path is needed.

## One-click setup from this checkout

For a reviewed Git checkout with Node 24 and Git available, double-click the
repository root's [setup.cmd](../../setup.cmd) and select Windows, or run from
the repository root:

```powershell
node setup.mjs --ports windows
```

The common setup delegates to this port's existing installer with the exact
committed checkout revision and runs its normal checks. Full mode remains the
default and requires an exact supported host. To choose reduced native styling
explicitly, use `--windows-mode Native`. Compatibility and runtime restrictions
still apply. Save work, close app settings windows and reopen affected apps
afterward. See [common setup options](../README.md#one-click-setup-from-a-checkout).

This checkout route needs Node and Git. The standalone published-release
installer below obtains its own dependencies and has different prerequisites.
An unpublished candidate remains a candidate until a release is published.

## Install

**One script, `install.ps1`, handles installation, updates, checks and rollback.**

1. Save your work and close Settings and any app settings windows.
2. Open **Windows PowerShell** included with Windows as your normal desktop
   user, then paste the release command below.
3. Wait for the final result. Setup obtains required dependencies, checks
   compatibility, applies the theme and runs Test. Reopen affected apps afterward.

<!-- install:start -->
Install commands appear here once v4.0.0 is released.
<!-- install:end -->

No Git, administrator shell, execution-policy change or manual runtime
installation is needed; managed-device policy may still prevent execution.
Setup reuses compatible standalone PowerShell, Node and verified cached
dependencies, and downloads pinned dependencies only when needed. Windows
Terminal and PowerToys are optional existing-app integrations; setup does not
install them.

Microsoft Store PowerShell is refused before any download or theme change,
because a process can keep its package context even when it starts another
executable. See [the runtime boundary](COMPATIBILITY.md#runtime-registry-boundary).

On a supported host, setup chooses **Full** styling. Otherwise it explains the
limit and offers **Native** mode: personalization, wallpaper, cursors and
supported existing app settings, without the shell styling adapters. Pressing
Enter cancels; nothing silently falls back. Verified downloads may remain after
cancellation, but theme settings are unchanged.

**Testing an unpublished PR:** use the full immutable commit of the reviewed
candidate, not a branch URL, through the
[developer instructions](COMPATIBILITY.md#developer-and-offline-installation).
A draft candidate is not a published release.

## Update and test

<!-- update:start -->
Install commands appear here once v4.0.0 is released.
<!-- update:end -->

Updates are explicit: run the Install command for the desired release, after
closing Settings and app settings windows as for installation. It applies the
changes and runs Test; repeating the same revision is safe. Setup does not close
applications or restart your computer.

The **Test** command printed by setup checks managed files, settings, the
running engine and compatibility. It does not check appearance: a passing Test
does not establish that every window or interaction state renders correctly.
The printed commands are saved in:

```text
%LOCALAPPDATA%\j3w1-theme\windows\recovery-commands.txt
```

## Undo

Run **one** of the recovery commands printed by setup or saved in
`recovery-commands.txt`. Each runs the same `install.ps1`; no separate rollback
script, revision selection or runtime path is needed.

| Action | Result |
| --- | --- |
| `Restore -Latest` | Undo the last theme transaction |
| `Restore` | Return to the original appearance across all theme transactions |
| `Uninstall` | Restore the original appearance and remove owned theme integration |

<!-- restore:start -->
Install commands appear here once v4.0.0 is released.
<!-- restore:end -->

Recovery works offline from the saved release and runtime, so keep the state
directory: its journal, backups and verified cache are needed. The commands are
saved before settings change, even if the first installation fails, and after
updates or `Restore -Latest` they follow the remaining installed version.

Original-state restoration can take several minutes after many updates; wait
for the final result. Later user edits are preserved as reported conflicts:
resolve them locally and rerun the same command. Shared tools, fonts and
recovery data are retained. Where Notepad's original caption color was
unreadable, rollback resets it to the Windows default, so a previous custom
caption override can be lost. See [interrupted recovery](COMPATIBILITY.md#recovery)
for missing-cache, lock or conflict handling.

### Keep an intentional lock-screen image

An ordinary Apply or Update refuses a later lock-screen image, like other
managed-setting conflicts. If you intentionally chose that picture, run the
reviewed installer's `Plan`: `lockScreenPreservation` reports its canonical
value digest and current journal digest, without an image or image path.
Review preservation with `Plan`, then use `Apply` or `Update` with both
`-KeepLockScreenValueSha256 <value digest>` and
`-ExpectedJournalSha256 <journal digest>`, an explicit reviewed `-SourceRoot`
and its full immutable `-Revision`. Both digests must still match exactly.
This requires an existing owned, recoverable lock screen; it is not a general
setting-adoption or first-install option.

Acceptance keeps the selected bytes without setting the image. Test, later
installs and recovery still reject unapproved image changes. Restore/Uninstall
preserve the accepted picture; only restoring its original owning installation
releases that image ownership. Undoing a supported Native acceptance Update
with Restore-Latest keeps the choice attached to the older active owner. Original
before/after images and acceptance history remain private in the journal.
The schema2 journal retains a capable verified installer for offline recovery.
Use saved recovery commands even after Restore-Latest selects older appearance
history; never edit old cached releases. A conflicting explicit recovery revision
is refused; omit it to select the verified capable cache.

Full Restore-Latest refuses before mutation if it would leave an older Full
guard across that capable boundary. Use a matching Update or complete capable
Restore/Uninstall. Failed or interrupted acceptance can retain a legacy guard;
this state is unstyled/unaccepted. Guard disables it and Test fails a Full
appearance/capable revision mismatch until supported recovery or Update.

## What changes

The current 26300.9974 core Full candidate excludes Notepad editor/chrome and
PowerToys preview/Markdown adapters because the installed component versions are
outside their reviewed pins. Their sources and earlier evidence remain intact;
the table is an implementation inventory, not a claim that those excluded surfaces
are installed or supported. See Compatibility for the exact exclusions and the
canonical tools-only Prepare action. Native PowerToys settings remain separate.

| Area | Treatment |
| --- | --- |
| Windows personalization | Dark mode, transparency off, red accents/borders, black wallpaper, recoverable lock-screen image and 17 compact cursor roles |
| Start, Search, taskbar and notifications | Full-mode shell adapters; black surfaces, neutral text, selection and red focus. Search uses a continuous selected row and visible frame |
| Explorer | Themed chrome, native lists and menus, selection, scrollbars, pins, dividers and generic red closed/open folder defaults |
| PowerToys previews | Exact-version text/code and Markdown adapters; black previews with neutral text and token-derived Markdown typography. Reselect the file after an update or rollback |
| Notepad, Calculator and Paint | Separate exact-package adapters for their supported chrome and controls; Notepad also has a native editor adapter. Document and artwork colors remain under the host's control |
| Windows Terminal | Existing supported settings plus Full-mode tab/menu chrome; commands, shortcuts and text sizes are preserved |
| Existing PowerToys utilities | Supported FancyZones, Always On Top and Command Palette settings; optional layouts are added without assigning them |

Desktop icons, shortcuts, window placement, existing layouts and unrelated
settings are preserved. Customized folder and shortcut icons keep their own
registrations. Explorer is not force-restarted to refresh icons.

## Named Windows theme and active engine

Setup applies native personalization and installs `j3w1-managed.theme` beside
your other Windows themes. To select it by name in the Personalization gallery,
open `%LOCALAPPDATA%\Microsoft\Windows\Themes\j3w1-managed.theme`, then select
it if Windows opens the gallery. That selection is outside the setup journal;
the managed file and applied personalization have journaled recovery.

Full setup starts the retained Windhawk engine; Test fails if it is stopped.
Reinstalling the same revision can restart it without recompiling unchanged
adapters and preserves reported settings conflicts.

Full mode also installs a current-user sign-in compatibility guard: one managed
shortcut in your Startup folder runs the same installer's guard with the
retained runtime and explicit state path. A changed or unreadable fingerprint
refuses styling; the guard does not download updates. The shortcut replaces the
previous registry startup command, which could exceed Windows' 260-character
Run-key limit, and both changes share the journaled Update, Restore and
Uninstall recovery. Setup creates no other public script, scheduled task or
background watcher. A manual guard run is not acceptance of an actual new sign-in.

## Remaining limits

Setup or Test success does not change these limits. Native behavior and
accessibility settings take priority. Owner confirmations cover only their
recorded states, not complete Windows-wide appearance; the current list is in
[Coverage](COVERAGE.md#current-owner-scope-and-historical-evidence). Other app
states, notification action buttons, fresh native preview startup and
DPI/accessibility variants still need acceptance, and no sign-in or clean-PC
Full installation is claimed. Paint's gray drawing surround is host-owned and
excluded from recoloring by the owner; an opaque viewport background would cover
the artwork.

The owner accepted the updated Settings hovers, Notepad chrome, Paint controls
and Paint's black/rose/red unsaved-work confirmation on the recorded exact host.
The dialog was dismissed with Cancel, preserving the artwork; Save and discard
were not exercised. This bounded approval does not cover every dialog or state.

Recent corrections and their own open checks are recorded in Coverage:
[Quick Settings and taskbar popup surfaces](COVERAGE.md#quick-settings-and-taskbar-popup-surfaces),
[deferred chrome island discovery](COVERAGE.md#deferred-chrome-island-discovery),
[Paint toolbar menus before opening](COVERAGE.md#paint-toolbar-menus-before-opening),
[popup discovery before Loaded](COVERAGE.md#popup-discovery-before-loaded) and
[Settings search frame geometry](COVERAGE.md#settings-search-frame-geometry).

### Shared shell context menus

Start and Search, notification center, Settings, Explorer and the taskbar share
one Windows XAML menu recipe, and all five pinned shell stylers share its
resource palette. It covers the presenter and its template border,
ordinary/check/submenu items, separators and shortcut hints in normal, hover,
pressed, disabled and submenu-open states. Rules match native control types,
not command text or where a menu opens; sizing, commands, icons and keyboard
focus stay native. Notepad, Paint and Terminal use the same roles through the
separate WinUI app adapter, and classic Explorer menus keep their native drawing
adapter, because these families need different host interfaces. This covers
the supported hosts only; no single Windows accent setting recolors every
third-party or custom-drawn menu.

Textbox command menus use a command-bar flyout, not the ordinary MenuFlyout
template. The five shell stylers share one recipe for it and its native overflow
presenter: raised background, overlay border, command foreground, shortcut
hints, separators, and normal, hover, pressed, disabled and checked colors.
Explorer's earlier local command-flyout rules are folded into it; its ordinary
toolbar background stays separate. Standard suggestion containers and
FlyoutPresenter backings use the same raised surface and overlay frame.
Settings' custom search wrapper keeps the selected dark-red fill across hover
and restores the raised fill on pointer exit. No mapping sets widths, offsets,
command labels, keyboard behavior or popup placement. See Microsoft's
[command-bar flyout template](https://github.com/microsoft/microsoft-ui-xaml/blob/v2.8.7/dev/CommandBarFlyout/CommandBarFlyout_themeresources.xaml)
and [suggestion template](https://github.com/microsoft/microsoft-ui-xaml/blob/v2.8.7/dev/AutoSuggestBox/AutoSuggestBox_themeresources.xaml)
for the distinct resource keys and native frame ownership.

Source checks establish the common rules and token mappings; screenshots of the
earlier gray menus establish the defect. Installed first-open, hover-exit,
high-contrast and DPI appearance still need their own assessment.

### Shared source generation

Calculator and the WinUI chrome adapters share the owned theme-refresh and
control-resource templates, substituted by one checked renderer; each generated
Windhawk source stays standalone for its pinned compiler. Refactors must
preserve the emitted adapter bytes when behavior is unchanged.

### Explorer initialization failure record

Explorer adapter 1.8.10 can emit one protocol-1 numeric failure record. This is
diagnostic evidence, not admission, a successful initialization or visual
acceptance. It preserves all existing fail-closed checks and COM policy.
The closed stages, in original initialization order, are:

| Number | Failed stage | Native code |
| --- | --- | --- |
| 1–2 | Accessibility admission; application colors | unavailable |
| 3–5 | Executable path; version size; version data | Win32 |
| 6–7 | Version query; exact fixed version | unavailable |
| 8 | Theme-class procedure | Win32 |
| 9–14 | Pin color; marquee settings; renderer load; marquee hooks; navigation hooks; folder colors | unavailable |
| 15–16 | Folder-glyph COM initialization; glyph build | HRESULT; unavailable |
| 17–18 | Bitmap COM initialization; factory/bitmap admission | HRESULT; factory HRESULT only when that call failed, otherwise unavailable |
| 19–20 | Background brush; remaining hooks | unavailable |

The record contains only `protocol`, `adapterVersion`, `pid`, exact decimal-string
`creationFiletime`, numeric `stage`, `nativeKind` (0 unavailable, 1 Win32,
2 HRESULT), `nativeAvailable`, unsigned 32-bit `nativeValue`, and `glyphCom` /
`bitmapCom` (unsigned HRESULT or null when not reached). A boolean guard does
not supply a stale last-error value. Later stages were not reached; earlier
admission passed. A missing record supplies no stage or initialization result.
A record whose PID or exact creation FILETIME differs from the independently
bound target is unavailable for that target.

The writer resolves the current user's LocalAppData through the known-folder
API, never an environment override. It requires the existing, non-reparse
`j3w1-theme/windows/diagnostics` directory. It holds the local drive root and
every validated ancestor without write/delete sharing through exclusive
`CREATE_NEW`, opened-file identity/containment validation, a bounded write
(less than 1024 bytes) and flush. Unavailable, aliased, non-directory, reparse,
ambiguous or replaced identities fail closed without a fallback. No directory
is created by the adapter. The sole name is
`j3w1-explorer-native-1.8.10-init-failure.json`; no overwrite, append, alternate
name, retry, repair or pruning occurs. Diagnostic errors preserve initialization
outcomes and the caller's last error. Partial or malformed output is unavailable
evidence and is never silently repaired. The flush outcome is not recorded and
cannot be inferred from the file. A complete, well-formed record evidences only
the bytes attributed to the independently identified process; it does not prove
successful flushing or durability, and no conclusion may depend on flush success.

This file is outside the recovery journal and survives failed initialization,
unload and Restore. A separately reviewed use task must prepare and own the
directory, bind source/DLL/transaction/process identities and collect the exact
file/hash. That producer retains cleanup ownership; the adapter never deletes
it or reads lifecycle journals. Source/harness checks alone authorize no desktop
activation, directory preparation or lifecycle operation.
