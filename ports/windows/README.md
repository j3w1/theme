# j3w1 for Windows 11

Black surfaces, rose ordinary text and compact black cursors with red outlines, generated from
the canonical tokens. Content headings use near-white. Windhawk **2.0 alpha 6**
is an explicitly pinned prerelease dependency. The port remains experimental
while the remaining per-surface visual checks are in progress. The native
apply/update/restore/reapply lifecycle has passed on the documented host.

## Install

Use native Windows 11 x64 and PowerShell 7.4+. Plan also needs Node 24+. Open PowerShell as the
intended desktop user. Plan reports proposed targets and shell compatibility
without modifying settings or installing dependencies. Full mode requires the
exact fingerprint documented in [compatibility and recovery](COMPATIBILITY.md).
Native mode omits all Windhawk changes.

<!-- install:start -->
Install commands appear here once v4.0.0 is released.
<!-- install:end -->

Before the first release, use a reviewed immutable checkout:

```powershell
$revision = git rev-parse HEAD
& ./ports/windows/install.ps1 -Action Plan -SourceRoot . -Revision $revision -Mode Full
& ./ports/windows/install.ps1 -Action Apply -SourceRoot . -Revision $revision -Mode Full
```

Uncommitted edits are excluded. The offline route reads Git objects at that
revision and validates every artifact. Missing dependencies still require
network access unless their verified downloads already exist in the state
directory. PowerShell is a prerequisite. Apply retains an official pinned Node 24 runtime
when no compatible Node installation is available on the ordinary user/machine
PATH; it does not depend on an agent tool cache at sign-in. Standalone Plan
requires Node to inspect settings. Existing compatible applications and
fonts are reused. A missing font or Windhawk is fetched from its official pinned
source and digest-checked; Windhawk also requires a valid publisher signature.

## Notification sidebar

Full mode styles the notification/calendar outer frames with black surfaces,
square corners and one thin red border. Notification cards use the near-black
panel role; calendar chrome and the Focus section use the chrome role. Named
header labels use the canonical monospace family without changing font sizes.
The calendar's current day uses dark-red action colors with readable rose text.
Notification contents, actions, grouping, calendar layout and Focus behavior
remain native. Internal cards do not acquire additional rose frames.

## Update and test

Updates are explicit. Use an exact release tag or full revision, and close
application settings windows before applying. Never edit the immutable cache.

<!-- update:start -->
Install commands appear here once v4.0.0 is released.
<!-- update:end -->

The installed entry point is printed after Apply. Invoke that script with
`-Action Test` to check effective managed settings, shell compatibility and
Windhawk settings/version/enabled state. Check the actual visual surfaces after
reopening affected apps; configuration readback is not visual verification.

## Restore and uninstall

<!-- restore:start -->
Install commands appear here once v4.0.0 is released.
<!-- restore:end -->

`Restore -Latest` undoes one transaction. `Restore` returns all managed theme
settings to the original baseline. `Uninstall` also removes owned assets and
startup integration through that same journal. Shared applications, fonts and
recovery data remain. Later edits to managed values are reported as conflicts;
unrelated settings and documents are preserved. See [recovery](COMPATIBILITY.md)
before resolving a conflict or interrupted installation.

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
- Full mode: five pinned Windhawk shell stylers and a current-user sign-in
  compatibility guard. The guard never downloads updates.

Desktop icons, shortcuts, utility enabled states, window placement and assigned
layouts are preserved. Unsupported Win32 foregrounds remain host-controlled.
No binary theme patching or shell replacement is used. Reopen affected apps
gracefully when required; the installer never force-kills terminals or reboots.
All distribution files are generated. Edit semantic mappings and regenerate.
