# j3w1 for Windows 11

Black surfaces, rose text, red accents and small black/red cursors, generated
from the canonical j3w1 tokens. The Windows port is experimental; the exact
supported host and remaining visual limits are in [Compatibility](COMPATIBILITY.md).
[Application coverage](COVERAGE.md) distinguishes implemented shell styling from
Markdown and classic-menu adapters from applications that still need their own styling integration.

## Install

Download **install.ps1** and run it. The same file installs, updates, tests,
restores and uninstalls the port. There is no separate setup script.

1. Open **Windows PowerShell** as your normal desktop user on Windows 11 x64.
2. Paste the command below. Setup obtains required runtimes, checks compatibility,
   installs the theme, runs Test, and prints the exact recovery commands.
3. Reopen affected apps and check their appearance.

<!-- install:start -->
Install commands appear here once v4.0.0 is released.
<!-- install:end -->

No Git, manual Node install or preinstalled PowerShell 7 is needed. Setup reuses
an unpackaged PowerShell 7.4+ installation under Program Files when available; otherwise it retains a pinned, hash-checked and
Microsoft-signed runtime for this user. It does not change system execution
policy or require you to elevate the whole installation.

Use **Windows PowerShell** or an ordinary standalone PowerShell. A process
launched from Microsoft Store PowerShell can retain its package context even
when it starts a standalone executable. Setup and recovery detect that context
and refuse before downloads or settings changes; run the same command in
Windows PowerShell already included with Windows. This preserves the real
desktop registry view.

Managed-device policy
can still prevent execution; use your administrator's approved process.

**Full mode** adds five pinned Windhawk shell stylers and the bundled Explorer native-color, PowerToys text/Markdown-preview, Calculator resource and Notepad native editor adapters. It requires the exact
reviewed Windows/shell fingerprint and uses Windhawk 2.0 alpha 6. On other
builds, setup explains the limit and asks whether to install **Native mode**:
personalization, wallpaper, cursors and supported existing app settings, without
the shell stylers. Nothing silently falls back. Cancel leaves theme settings
unchanged, though downloaded setup dependencies are retained.

Windows Terminal and PowerToys are **optional**. Existing supported installations
are themed; setup does not install those apps. The canonical font, Node and
Full-mode Windhawk dependencies are obtained automatically when needed.

Before v4.0.0 is published, download `ports/windows/install.ps1` from the full
immutable commit supplied with the reviewed PR and run it with `-Revision` and
that same commit. Do not use a branch URL. Developer/offline instructions are
in [Compatibility](COMPATIBILITY.md#developer-and-offline-installation).

## Update and test

<!-- update:start -->
Install commands appear here once v4.0.0 is released.
<!-- update:end -->

Prepared immutable releases are reused from the verified local cache, avoiding
repeat bootstrap downloads. A managed compiled adapter is reused only when
its pinned source, version, full configuration and saved DLL digest match.
Settings-only rollback reuses that same verified DLL when the saved key set
also matches; other restores use the retained offline source. Older installs
without a compilation receipt compile once before becoming reusable. Changed
cache files are refused. Every setup ends with Test. To check again, run the printed Test command from
`%LOCALAPPDATA%\j3w1-theme\windows\recovery-commands.txt`.
Test verifies artifacts, managed settings and compatibility; it is not a visual
inspection. Close app settings windows before updating to avoid concurrent edits.

## Undo

Run **one** command with the same **install.ps1** file you downloaded:

```powershell
& ./install.ps1 -Action Restore -Latest  # undo the last update
& ./install.ps1 -Action Restore         # restore the original appearance
& ./install.ps1 -Action Uninstall       # restore and remove theme integration
```

Recovery is offline and finds the installed version and runtime automatically.
Setup reports the adapter being compiled or restored. Original-state restore
walks saved updates in reverse and can take several minutes after many updates.
Leave the command running until it prints its final result; progress messages
are not completion. Reported conflicts retain the recovery data for retry.
Use your downloaded script's actual filename, or use the exact saved commands below.

Copy the appropriate command from `recovery-commands.txt`: **Restore -Latest**
undoes the last transaction, **Restore** returns the original baseline, and
**Uninstall** restores it and removes owned theme integration. Later user edits
are preserved as reported conflicts. Shared tools, fonts and recovery data are
retained. See [recovery](COMPATIBILITY.md#recovery) if an operation was interrupted.
The saved commands refresh for every update route, including a source checkout,
and follow the remaining installed version after **Restore -Latest**. They are
retained before settings change so a failed installation can still be undone.

<!-- restore:start -->
Install commands appear here once v4.0.0 is released.
<!-- restore:end -->

## What changes

Start uses opaque canonical surfaces, square panel/search/category corners,
thin red outer frames and token-based hover/pressed fills on section controls.
Category groups have one subtle outer outline; their icon tiles and captions
retain native border/fill treatments without added rose boxes. Named text
labels use SauceCodePro NFM at the existing size; symbol icons retain their font.
Pinned apps, Recent, category view, phone integration, scrolling and native
keyboard-focus/selection behavior are preserved. The phone panel receives the
same frame/surface rules where its XAML controls expose them. See
[compatibility and verification limits](COMPATIBILITY.md#start-menu-styling).

- Dark mode, transparency off, red accent/borders, a generated black wallpaper,
  recoverable lock-screen image and 17 standard cursor roles in four DPI sizes.
  Cursor artwork is 35% smaller within those images, with a slim black pointer
  and canonical red outline. The arrow has no projecting tail; the hand has a
  distinct index finger, thumb and rounded palm. Windows pointer-size preferences
  are preserved.
- Windows Terminal scheme, font, opaque surfaces and dark chrome, including
  explicit per-profile overrides. Commands, sizes and shortcuts are preserved.
- Existing PowerToys FancyZones overlays, Always On Top border and Command
  Palette appearance. Four optional layouts are added without assigning them.
- Full mode: five pinned Windhawk shell stylers, a bundled native Explorer
  canvas/text adapter, PowerToys text and Markdown preview adapters, a package-gated Calculator
  resource adapter, the Notepad editor adapter and a current-user sign-in
  compatibility guard. The guard never downloads updates.

Desktop icons, shortcuts, utility enabled states, window placement and assigned
layouts are preserved. Generic folder defaults use original red folder artwork
in ten native icon sizes, including a separate open-folder silhouette. The same
transaction saves the earlier folder registrations and restores them on rollback.
Explicit per-folder and shortcut icons retain their own registrations. Icon-cache
refresh is requested through the shell; no cache files are deleted and Explorer
is never force-restarted. Live coverage of every Explorer view remains pending.
Navigation pins retain their native silhouette with a red accent. The native
sidebar separator retains its DPI width and uses the canonical divider color;
the XAML command-bar divider lines use that same role. These adapters change
paint output without replacing image lists, altering folder contents or hiding
controls. Their exact-version and high-contrast boundaries remain in force.
Explorer native file-list, navigation, resting column
headers and preview-placeholder surfaces use black/rose on the exact supported
host. Native selection, hover and scrollbar paint geometry is retained with token
colors. Input behavior and third-party preview content remain host-controlled. Other unsupported Win32 foregrounds remain host-controlled.
No binary theme patching or shell replacement is used. Reopen affected apps
gracefully when required; the installer never force-kills terminals or reboots.
All distribution files are generated. Edit semantic mappings and regenerate.

Search is a separate interface from the pinned-app Start page. Its XAML frame and
WebView recent/results/category/preview panels now use the same token palette.
The existing pinned styler applies CSS through its supported `webContentStyles`
field; there is no custom JavaScript, behavior replacement or remote-debugging
configuration. Search icons retain their fonts and images, and forced colors
retain native priority. Live interaction acceptance remains open.

### PowerToys text-preview palette

Full mode includes a rendering adapter for PowerToys Monaco preview build
0.101.2362.0. It checks the exact executable version and installed HTML template
digest before supplying a token-colored temporary template in Windows' existing
low-integrity data folder. No folder permissions or preview isolation are changed. The installed
PowerToys assets and previewed files are unchanged. Document content is inserted
later by PowerToys; the adapter never handles it. Unknown versions/templates and
high-contrast initialization pass through without theme modification.

The preview canvas/gutter are black, ordinary foregrounds rose, selection dark
red and scrollbars red. Language tokenization and custom syntax tokens are retained; common code-token
colors use canonical code roles. Font size, wrapping,
minimap, keyboard behavior and preview registration remain controlled by PowerToys.
Reselect the file after changing or restoring this adapter; an already rendered
preview keeps its current document until the host reloads it. PowerToys updates
require a new reviewed template/version pair. No PowerToys install is required
on machines that do not use this optional application.

The taskbar's separate background-stroke rectangle maps to the dark-red divider
role, including its top edge. Thickness, layout and taskbar behavior are preserved.

Explorer Home has its own black root background and token-based list/grid hover,
pressed and selected fills. These mappings preserve layout, icons and focus behavior.

The pinned PowerToys native loading panel is separate from its HTML preview.
Its WinForms background and label text are mapped to the same canvas and text
roles during painting; shared brushes, progress values/extent, images and WebView
content are not modified. High contrast and unrelated control classes pass through.
Explorer nonclient scrollbar painting also retains its originating window during
default window processing and SetScrollInfo redraws, including nested calls.
The latter is used when scrolling and when a new folder updates the scroll range.
Only ScrollBar theme draws
use that additional scope; unrelated application windows are excluded.

The native filename editor uses canonical text-selection background and on-fill
text roles. Only the observed Edit/CtrlNotifySink path under an Explorer window
is covered; arbitrary editors, unknown colors and high contrast pass through.
Text, selection ranges, IME behavior and drawing-context state are preserved.
Modern context-menu primary/overflow surfaces and submenu surfaces use black,
with canonical divider colors; native action order, icons and menu behavior remain.

Native offscreen regressions live in `tests/windows-preview-paint-native.cpp`
`tests/windows-scroll-paint-native.cpp`, and
`tests/windows-explorer-interaction-native.cpp`, `tests/windows-marquee-paint-native.cpp`
and `tests/windows-caption-native.cpp`. Compile them on Windows with the
pinned Windhawk x64 compiler, `--target=x86_64-w64-mingw32 -std=c++20 -static`,
and libraries `-lbcrypt -lversion -luser32 -lgdi32 -lshell32 -lole32 -luuid -luxtheme -lmsimg32 -ldwmapi`.
Run each executable with high contrast off. They exercise native GDI pixels,
paint ownership, nested scopes and passthrough without desktop input or capture.
They do not establish visual acceptance of the real host's loading transition or caption buttons.

The owner has confirmed the real Explorer header is black, all three native
white window-button symbols are visible and acceptable, and the drag-selection
area is red with rose borders. This observation does not cover every window,
DPI setting, inactive state or accessibility configuration.

The loading label matcher follows Windows class-name case insensitivity, including
the observed .NET 10 `WindowsForms10.Static` spelling. The determinate progress
bar uses the existing progress track, primary fill and control-border roles.
Only the observed normal fill and transparent track theme parts are recolored,
keeping the native pixel mask, clipping, position, value and accessibility.
Other progress states and unsupported drawing transforms pass through. The
host still controls progress timing/animation; this is not a replacement control.

## Named Windows theme and active engine

Setup installs a complete `j3w1-managed.theme` in the current user's Windows
theme directory alongside existing themes. Its required desktop and master
selector sections, black wallpaper and all generated cursors come from the
source generator. A custom StateRoot resolves its own asset paths. The managed
file is journaled; Restore removes it or restores its previous bytes. An
owner-created `j3w1.theme` is a separate file and is preserved.

Native personalization applies during setup. To select the saved gallery name,
open `%LOCALAPPDATA%\Microsoft\Windows\Themes\j3w1-managed.theme` through
Windows, then select it in Personalization if Windows opens the gallery. Theme
file registration and selection use the documented Windows file association;
the installer does not write a fake CurrentTheme registry value. Gallery
selection is currently a separate action from setup and its journaled recovery.

Full Apply and the sign-in guard start the retained Windhawk engine and wait up
to 15 seconds for its running process. Test reports a stopped engine as a
failure, even when every stored mod is enabled. Repeating Apply on an unchanged
release validates managed state and restarts a stopped engine without compiling
the adapters again. It does not repair user setting conflicts. If first-start
fails during installation, the existing transaction rolls back. Running-engine
readback is separate from actual adapter loading and visual acceptance.

The documented Windows theme format is described in
[Microsoft's theme file reference](https://learn.microsoft.com/en-us/windows/win32/controls/themesfileformat-overview).


### Markdown previews

Full setup also installs the PowerToys Markdown adapter automatically. Reading
text is rose on black with compact semantic headings, consistent spacing,
padded code/quotation blocks and aligned tables. It uses the canonical reading
and code scales, SauceCodePro font stack and bounded reading width. Windows
DPI scaling remains native. Bold inherits its surrounding color.

This preserves PowerToys as the renderer. It does not add Obsidian plugins,
wiki-link resolution, callouts, math or syntax highlighting that PowerToys does
not provide. Both normal and large generated-HTML routes keep document content
and WebView restrictions. Exact host, assembly, native-runtime and generated
header identities are required; a PowerToys/WebView update can refuse styling.
High contrast takes priority. Reselect a file after updating, disabling or
restoring the adapter. The normal setup/Test/Restore/Uninstall commands manage
this adapter too; no manual mod installation is needed.
