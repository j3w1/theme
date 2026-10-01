# Windows and application coverage

The Windows installer applies the adapters listed below. It does not make every
application inherit a global j3w1 palette. Windows personalization, Win32 theme
parts, Windows.UI.Xaml, WinUI 3 and embedded web renderers have different color
ownership. A black title bar is not evidence that an application's body is themed.

This is the current implementation inventory, not a visual acceptance record.
Exact shell compatibility and historical observations remain in
[COMPATIBILITY.md](COMPATIBILITY.md). All ports remain experimental until their
own import evidence meets the port contract.

| Surface | Current treatment | Remaining evidence or implementation |
| --- | --- | --- |
| Desktop, accent, supported borders, wallpaper and standard cursors | Native personalization and generated assets | Accessibility overrides take priority; arbitrary app title bars are not covered |
| Start and Search | Pinned Start styler with separate layout selectors | Full interaction and layout acceptance remains open |
| Taskbar | Pinned taskbar styler, including mapped top divider | Top-edge visual acceptance remains open |
| Notifications, calendar, Quick Settings and toast variants | Pinned notification styler | Notification sidebar and loading controls have owner feedback; not every toast or Quick Settings state has been observed |
| Windows Settings | Pinned Windows.UI.Xaml Settings styler | Bounded native observation only; not a universal application adapter |
| Explorer chrome, native caption buttons and modern context menus | Pinned Explorer XAML styler with a transparent caption composition layer; exact-host native DWM caption adapter | Owner confirmed a black header and all three visible native white button symbols and accepted those symbols. Additional windows, maximized/inactive states and menu interaction coverage remain open |
| Explorer native file list, navigation, Home, selection and scrollbars | Exact-version native theme/GDI adapter | Millisecond scrollbar flashes, DPI variants and runtime high-contrast switching remain open |
| Explorer drag-selection rectangle | Symbol-identified UIMarqueeSelector rooted at the actual Explorer UIItemsView; scoped cached-system-brush substitution, canonical red fill at 12% and themed border | Owner accepted the live red selection area with rose borders. Native solid border is a geometry deviation; other DPI and accessibility cases remain open |
| Explorer filename selection and selected-row outline | Scoped Edit selection and native ListView border color mappings | Border pixel regression passes; corrected live rename outline still needs acceptance |
| PowerToys plain-text/code preview and loading controls | Exact-version, hash-checked Monaco template adapter and native loading palette | Owner confirmed loaded preview and loading control; this does not cover Markdown |
| PowerToys Markdown preview | Digest-pinned WebView2 HTML-boundary adapter and token-derived reading CSS for normal and large-file routes | Synthetic native preservation/rejection/recovery tests and bounded live sample checks; visual quality acceptance, other DPI and runtime accessibility cases remain open |
| Explorer classic “Show more options” menu | Scoped exact-host Win32 popup palette | Confirmed owner/paint trace and native regressions; live normal, hot, disabled and submenu appearance still need verification |
| Notepad | Native dark-mode/accent treatment only | Modern WinUI 3 chrome and editor need a dedicated adapter; not the legacy Notepad dark-mode mod |
| Calculator | Bundled package-gated Windows.UI.Xaml brush adapter for the recorded 11.2607.0.0 package | Live body/buttons, startup, restore and accessibility acceptance remain open; graph-series brushes are excluded |
| Paint | Native dark-mode/accent treatment only | WinUI 3 toolbars and panels need an adapter; artwork canvas and color swatches must retain their colors |
| Terminal | Native generated scheme, font and opaque chrome | Owner confirmed appearance; command output can intentionally choose other colors |
| PowerToys utilities | Configurable FancyZones, Always On Top and Command Palette appearance | Command Palette exposes tint, not every text role |
| Obsidian | Separate j3w1 CSS/manifest port | Installed pair readback is separate from Windows installation; third-party plugin surfaces may override it |
| Orca, Warp, Ghostty, Codex CLI, Claude Code and ChatGPT Appearance | Separate repository ports | Import only through the corresponding port guide; the Windows installer does not claim these imports |
| Notepad++, browsers, Office, media and archive apps | No application-specific port installed by Windows setup | Use documented theme APIs where available; dark mode alone is not a complete j3w1 match |
| Secure desktop, authentication, protected system surfaces and arbitrary document/media colors | Host-owned | No binary patching, isolation changes, or whole-screen color filters |

## Shared adapters and their boundaries

Reuse token mappings across renderers, not executable include lists. The pinned
Settings styler initializes through Windows.UI.Xaml CoreWindow and its resource
dictionary. The inspected modern Notepad and Paint packages depend on the
Windows App Runtime; Notepad was also observed loading Microsoft.UI.Xaml.dll.
Calculator's inspected package depends on Microsoft.UI.Xaml 2.8 and .NET Native.
Adding all three executables to the Settings styler would not establish coverage.

The next app adapter must identify its exact package/runtime and validate its
resource tree, preserve application content and accessibility, journal every
change, and reverse it through the same installer. Rendered data colors, images,
status meanings, Paint artwork and color choices are not palette candidates.
These are implementation requirements, not implemented capabilities.

### Calculator resources

The bundled Calculator adapter admits only the recorded x64 package identity
and its app-specific resource anchors. It maps the named UI brushes in
`host.json` on the owning CoreWindow thread and retains the original brush
colors, opacity and acrylic fallback settings for restore. Shared brush aliases
that demand conflicting semantic colors refuse the palette, as does an alias
to any of Calculator's fourteen equation-series brushes. Equation and graph
data colors, calculations, labels, commands, dimensions and keyboard handling
remain host-owned. Missing optional keys are left native. This inventory does
not claim that every Calculator mode has been observed.

The Windows CI job builds complete bundled adapter DLLs using the pinned
Windhawk compiler and engine import library, then runs the offscreen caption,
scrollbar, popup, selection and preview-paint regressions. A complete link
checks Windows library dependencies that object compilation cannot check.
These gates do not establish live resource admission or visual acceptance.

To run the same native gate on an installed Windows development machine, set
`J3W1_WINDHAWK_ROOT` to the portable Windhawk 2.0.0-alpha.6 folder and run
`node --test tests/windows-native.test.js` in the repository. Without that
explicit toolchain, the native cases report skips; they never report a pass.
CI obtains the pinned and publisher-checked compiler in its temporary folder.
The generated DLLs are linked but not loaded into apps; the paint regressions
use hidden synthetic windows and offscreen buffers without desktop input.

High contrast takes precedence; native theme/settings messages restore the
ordinary-theme brushes before reevaluating admission. Unload dispatches restore
to the UI thread and removes the bounded startup timer. No XAML dictionary is
replaced, no application preference is written, and no pending asynchronous
callback can outlive the adapter. Actual startup, runtime contrast switching,
rendering and unload still require native acceptance.

The resource ownership was inspected in the pinned
[Calculator application resources](https://github.com/microsoft/calculator/blob/d125246a4e19842ce1332e6c7839cf0e110027d8/src/Calculator/App.xaml).

## Markdown preview boundary

The inspected PowerToys 0.101.2362.0 renderer constructs its own inline CSS in
`MarkdownHelper` and supplies the result to WebView2. It does not read the Monaco
template. The normal route uses `NavigateToString`; HTML above its UTF-8 size
threshold uses a generated local HTML file. Any adapter must handle both routes,
match the reviewed generated header, and leave the appended document unchanged.

Keep the host CSP, resource filter, local-image path validation, disabled
scripts/host objects/web messages and navigation restrictions. Do not enable
scripts or developer tools to inject a theme. Do not modify installed PowerToys
assemblies or redirect Markdown files to another preview provider. The bundled WebView2 adapter matches complete executable/control/helper/native
module digests and the four reviewed generated headers. It uses public COM
method addresses observed from an isolated SDK controller and pinned to that
native module digest. Normal HTML is passed synchronously with only the CSS
extent replaced. Large HTML keeps its original URI and file length: only the
same CSS extent of a newly host-created GUID temporary HTML file is changed.
Numeric file identity, resolved path, non-reparse parents and a single hard
link are required; unknown files and headers are left alone. A failed partial
write is restored; if restoration fails, navigation is refused. No document
content, filename or URI is logged. Disabling/removal stops future styling;
refresh an existing preview. PowerToys retains cleanup ownership of its files.

Reading typography and spacing use canonical tokens, including 15/24 prose,
20/28 H1, 16/24 H2, 13/18 lower headings, 13/19 code and a 72ch/680px maximum.
This changes presentation, not the Markdown parser or its feature set. Native
regressions use synthetic HTML instead of redistributing upstream templates.
Live sample checks are bounded observations, not approval of every document.

Pinned upstream source:

- [Markdown helper](https://github.com/microsoft/PowerToys/blob/v0.101.2362.0/src/common/FilePreviewCommon/MarkdownHelper.cs)
- [Markdown preview control](https://github.com/microsoft/PowerToys/blob/v0.101.2362.0/src/modules/previewpane/MarkdownPreviewHandler/MarkdownPreviewHandlerControl.cs)

## Other applications

Prefer first-class import formats and preserve unrelated preferences. For
example, Notepad++ distinguishes editor theme XML from dark-mode chrome;
Firefox distinguishes browser theme colors from website appearance; Office
offers application themes but document themes change document formatting.
None of these interfaces makes the existing Windows port an installed app theme.

- [Notepad++ configuration files](https://npp-user-manual.org/docs/config-files/)
- [Firefox themes](https://support.mozilla.org/en-US/kb/use-themes-change-look-of-firefox)
- [Office application appearance](https://support.microsoft.com/en-us/office/foundations-experiences/change-the-look-and-feel-of-microsoft-365)
- [Microsoft XAML theme resources](https://learn.microsoft.com/en-us/windows/apps/design/style/xaml-theme-resources)

## Acceptance still required

The owner accepted the observed black Explorer caption with native white button
symbols and the red drag-selection area with rose borders. These are bounded
live observations, not whole-ecosystem or accessibility acceptance.

Keep the Windows candidate draft while the owner-reported rename outline,
scrollbar transient, classic menu, Markdown, Notepad, Calculator and Paint
requirements remain unresolved or unverified. Installer Test checks managed
state, hashes and compatibility; it cannot accept visual behavior. A Computer
Use cancellation message does not prove that the owner pressed a physical key.
