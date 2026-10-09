# j3w1 for Windows 11

Black surfaces, rose text, red accents and small black/red cursors, generated
from the canonical j3w1 tokens. This port is **experimental**. Full styling
requires an exact supported Windows 11 x64 host; it does not theme every
application. See [current coverage and remaining visual gaps](COVERAGE.md).

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

No Git, separate setup script or manual runtime installation is needed. Setup
reuses compatible standalone PowerShell, Node and verified cached dependencies
when available. It downloads required pinned dependencies only when needed.
The whole installation does not require an administrator shell or a change to
the system execution policy. Managed-device policy may still prevent execution.

Use the Windows PowerShell supplied with Windows. A Microsoft Store PowerShell
process can retain its package context even when it starts another executable;
the installer refuses that context before downloads or theme changes. See
[the runtime boundary](COMPATIBILITY.md#runtime-registry-boundary).

On a supported host, setup chooses **Full** styling. Otherwise it explains the
limit and offers **Native** mode: personalization, wallpaper, cursors and
supported existing app settings. Native mode omits the shell styling adapters.
Pressing Enter cancels; nothing silently falls back. Verified downloads may
remain after cancellation, but theme settings are unchanged.

Windows Terminal and PowerToys are optional existing-app integrations; setup
does not install those apps. Required dependencies are obtained automatically.

**Testing an unpublished PR:** use the full immutable commit supplied with the
reviewed candidate, rather than a branch URL. The
[developer instructions](COMPATIBILITY.md#developer-and-offline-installation)
cover that route. A draft candidate is not a published release.

## Update and test

<!-- update:start -->
Install commands appear here once v4.0.0 is released.
<!-- update:end -->

Run the Install command for the desired release. The same script applies the
changes and runs Test; repeating the same revision is safe. Updates are explicit.
Close Settings and other app settings windows first, and reopen affected apps
afterward. Setup does not close applications or restart your computer.

To check the installed theme again, run the **Test** command printed by setup.
The exact commands are saved in:

```text
%LOCALAPPDATA%\j3w1-theme\windows\recovery-commands.txt
```

Test checks managed files, settings, the running engine and compatibility.
Check the appearance separately; a passing Test does not establish that every
window or interaction state renders correctly.

## Undo

Choose **one** of the recovery commands printed by setup or saved in
`recovery-commands.txt`. Every command runs the same `install.ps1`; no separate
rollback script, revision selection or runtime path is needed.

| Action | Result |
| --- | --- |
| `Restore -Latest` | Undo the last theme transaction |
| `Restore` | Return to the original appearance across all theme transactions |
| `Uninstall` | Restore the original appearance and remove owned theme integration |

<!-- restore:start -->
Install commands appear here once v4.0.0 is released.
<!-- restore:end -->

Recovery works offline with the saved release and runtime. Keep the state
directory: its journal, backups and verified cache are needed for restoration.
Commands are saved before settings change, including when the first installation
fails. After updates or `Restore -Latest`, they follow the remaining installed
version automatically.

Original-state restoration can take several minutes after many updates. Wait
for the final result. Later user edits are preserved as reported conflicts;
resolve those locally and rerun the same command. Shared tools, fonts and
recovery data are retained. See [interrupted recovery](COMPATIBILITY.md#recovery)
for missing-cache, lock or conflict handling.

## What changes

| Area | Treatment |
| --- | --- |
| Windows personalization | Dark mode, transparency off, red accents/borders, black wallpaper, recoverable lock-screen image and 17 compact cursor roles |
| Start, Search, taskbar and notifications | Full-mode shell adapters; black/rose/red surfaces, selection and focus. Search uses a continuous dark-red selected row with a rose frame |
| Explorer | Themed chrome, native lists and menus, selection, scrollbars, pins, dividers and generic red closed/open folder defaults |
| PowerToys previews | Exact-version text/code and Markdown adapters; black/rose previews and token-derived Markdown typography. Reselect the file after an update or rollback |
| Notepad, Calculator and Paint | Separate exact-package adapters for their supported chrome and controls; Notepad also has a native editor adapter. Document and artwork colors remain under the host's control |
| Windows Terminal | Existing supported settings plus Full-mode tab/menu chrome; commands, shortcuts and text sizes are preserved |
| Existing PowerToys utilities | Supported FancyZones, Always On Top and Command Palette settings; optional layouts are added without assigning them |

Full mode also installs a current-user sign-in compatibility guard. A changed or
unreadable fingerprint refuses styling; the guard does not download updates.
Desktop icons, shortcuts, window placement, existing layouts and unrelated
settings are preserved. Customized folder and shortcut icons keep their own
registrations. Explorer is not force-restarted to refresh icons.

## Named Windows theme and active engine

Setup applies native personalization and installs `j3w1-managed.theme` beside
your other Windows themes. Selecting its name in the Personalization gallery
is currently a separate action: open
`%LOCALAPPDATA%\Microsoft\Windows\Themes\j3w1-managed.theme`, then select it
if Windows opens the gallery. That gallery selection is outside the setup
journal; the managed file and applied personalization have journaled recovery.

Full setup starts the retained Windhawk engine. Test fails if that engine is
stopped. Repeating installation of the same revision can restart it without
recompiling unchanged adapters; it preserves reported settings conflicts.

At sign-in, Full mode uses one managed shortcut in your Startup folder to invoke
the same installer's compatibility guard with the retained runtime and explicit
state path. Setup replaces its previous registry startup command, which could
exceed Windows' 260-character Run-key limit. The shortcut and removal of the old
entry share normal journaled Update, Restore and Uninstall recovery. Setup does
not create another public script, scheduled task or background watcher. A manual
guard invocation remains separate from acceptance after an actual new sign-in.

## Remaining limits

The owner confirmed that Paint's Selection and Brushes buttons, including their
dropdown arrows, keep black/red/rose hover and pointer-exit colors with the
permanent correction installed. The installed hardware volume popup and
input-language picker were also accepted. These confirmations cover those
recorded states; they do not establish complete Windows-wide appearance.

The owner also confirmed completed small and large Markdown previews after
rollback/reapply: both retain black backgrounds and the improved rose reading
formatting. Preview startup frames remain a separate acceptance check.

Notepad now admits an existing native header through its exact package/runtime
adapter. If its original caption color is unknown, rollback resets that caption
to Windows' default under the owner-approved Notepad-only policy; a previous
custom caption override could be lost. Captured originals still restore exactly.
The public caption API remains excluded because it covered the custom tabs on
the recorded host. After Update, Test, Latest Restore, baseline verification
and reapply, the owner confirmed the existing first header is black, with
unobstructed tabs and all three native window buttons visible. Paint's surrounding drawing workspace is still gray; an opaque viewport
background is not an acceptable fix because it can cover the artwork.

Other app states, notification action buttons, fresh native preview startup,
DPI/accessibility variants, sign-in and a clean-PC Full installation still need
acceptance. White native Explorer window-button symbols were accepted by the
owner. Native behavior and accessibility settings take priority.

[Coverage](COVERAGE.md) lists implemented surfaces and unresolved checks.
[Compatibility](COMPATIBILITY.md) retains exact host boundaries, technical
details, developer/offline instructions and historical observations. These
limits do not change when setup or Test succeeds.


### Quick Settings and taskbar popup surfaces

The owner's screenshot showed a gray media card, gray brightness/volume
tracks and thumbs, and orange checked quick-action tiles while the outer
Quick Settings frame and labels were already themed. The previous configuration
omitted those separate native controls. The existing pinned notification styler
now maps the media backing and L1 layers to the black canvas, the paginated
toggle presenters' normal/hover/pressed/checked/disabled states to the canonical
switch palette, and the named media and footer buttons to their state palette.
Slider resources are local to this styler; scoped track and thumb selectors
map the visible parts. Native slider values, media playback, connectivity,
rotation settings, labels, artwork, target sizes, navigation and focus remain
host-owned. No global accent setting, diagnostic adapter or second installer
is added. The same public install.ps1 transaction restores these settings.

The taskbar right-click menu and hidden-icons overflow panel now use the raised
surface, square edges and overlay border through the existing taskbar styler.
Menu rest, hover, pressed, disabled and submenu-open states and separators use
their canonical roles. Menu resource overrides stay local to that styler. Icons,
menu actions, popup placement, control dimensions and native focus are preserved.

These configuration and preservation checks do not establish installed rendering
acceptance. First-open, pointer-exit, disabled, focus, high-contrast and DPI
behavior still need bounded native checks. Slider thumb silhouettes remain
native; no replacement drawing or artwork overlay is used.


### Deferred chrome island discovery

The owner supplied gray Windows Terminal profile and tab-menu screenshots.
Source inspection found a startup defect: a pending named chrome control was
retried against the entire XamlRoot content, then removed from the pending list.
Terminal's generic document page is intentionally outside the chrome allowlist,
so that retry could discard the tab/menu root. Deferred discovery now uses the
same bounded root selection as immediate discovery. It retains the named chrome
control or its topmost admitted ancestor in the same XamlRoot. A generic page,
foreign root, terminal pane, drawing surface or document does not grant admission.
The exact package/runtime checks, existing restoration path and public installer
are retained. Synthetic native checks exercise generic content, admitted parents,
foreign roots and bounded cyclic ancestry. Installed menu rendering still needs
acceptance; this source defect does not by itself explain every gray menu frame.


### Paint toolbar menus before opening

The recorded Paint package creates its File/Edit/View `MenuBarItemFlyout` on
the loaded `ContentButton` before opening; its presenter style is initially
unset. The existing Paint adapter now prepares that exact owned toolbar endpoint
with the mapped raised surface, rose foreground, overlay border and a null
system backdrop. The native template, dimensions, items, actions and keyboard
behavior remain unchanged. It admits only the same-root AppChrome/MenuBarItem
chain on its UI thread, with normal accessibility state; custom styles,
bindings, unrelated controls and menus already open at first discovery are
left to the host. Rollback restores the unset local value while preserving later
application replacements. Failed writes retain their receipt for cleanup retry. Retired owners return their
style through the same bounded refresh path before receipts are released.
This source correction still requires installed first-open assessment; it does
not establish startup-frame timing, submenu or whole-application acceptance.
