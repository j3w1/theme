# Windows and application coverage

The Windows installer applies the adapters listed below. It does not make every
application inherit a global j3w1 palette. Windows personalization, Win32 theme
parts, Windows.UI.Xaml, WinUI 3 and embedded web renderers have different color
ownership. A black title bar is not evidence that an application's body is themed.

This is the current implementation inventory, not a visual acceptance record.
Exact shell compatibility and historical observations remain in
[COMPATIBILITY.md](COMPATIBILITY.md). All ports remain experimental until their
own import evidence meets the port contract.

Search result rows own their rest, hover and selected backgrounds. Their icon,
label and detail containers inherit the row fill, avoiding separate overlapping
rectangles. The selected row uses the approved dark-red selection role and the
native red current-item indicator. Keyboard focus stays distinct from selection;
the preview container retains native focusability. These CSS rules preserve
Search input and navigation and add no script. A browser fixture verifies state
transitions, focus geometry and forced-color behavior in
`tests/browser/windows-search.spec.js`. The owner confirmed the installed
single dark-red selected row and clean hover exit. Other native Search states
and accessibility acceptance remain open.

| Surface | Current treatment | Remaining evidence or implementation |
| --- | --- | --- |
| Desktop, accent, supported borders, wallpaper and standard cursors | Native personalization and generated assets | Accessibility overrides take priority; arbitrary app title bars are not covered |
| Start and Search | Pinned Start styler with separate layout selectors, Search XAML frame and WebView CSS palette | Owner confirmed one dark-red fill across selected result icons and labels and correct hover exit. Recent searches, categories, preview actions and runtime accessibility acceptance remain open |
| Taskbar | Pinned taskbar styler, including mapped top divider | Top-edge visual acceptance remains open |
| Notifications, calendar, Quick Settings and toast variants | Pinned notification styler | Notification sidebar and loading controls have owner feedback; not every toast or Quick Settings state has been observed |
| Windows Settings | Pinned Windows.UI.Xaml Settings styler | Bounded native observation only; not a universal application adapter |
| Explorer chrome, native caption buttons and modern context menus | Pinned Explorer XAML styler with a transparent caption composition layer; exact-host native DWM caption adapter | Owner confirmed a black header and all three visible native white button symbols and accepted those symbols. Additional windows, maximized/inactive states and menu interaction coverage remain open |
| Explorer native file list, navigation, Home, selection and scrollbars | Exact-version native theme/GDI adapter | Millisecond scrollbar flashes, DPI variants and runtime high-contrast switching remain open |
| Explorer folder defaults, pins and dividers | Generated original closed/open folder ICOs; journaled current-user generic registrations and shell icon refresh; XAML divider mappings; exact-host navigation pin/state-image and separator paint adapters | Specialized and customized folder icons retain native registrations; pin silhouette, alpha and separator DPI width are preserved; live icon-cache, view and divider acceptance remains open |
| Explorer drag-selection rectangle | Symbol-identified UIMarqueeSelector rooted at the actual Explorer UIItemsView; scoped cached-system-brush substitution, canonical red fill at 12% and themed border | Owner accepted the live red selection area with rose borders. Native solid border is a geometry deviation; other DPI and accessibility cases remain open |
| Explorer filename selection and selected-row outline | Scoped Edit selection and native ListView border color mappings | Border pixel regression passes; corrected live rename outline still needs acceptance |
| PowerToys plain-text/code preview and loading controls | Exact-version, hash-checked Monaco template adapter and native loading palette | Owner confirmed loaded preview and loading control; this does not cover Markdown |
| PowerToys Markdown preview | Digest-pinned WebView2 HTML-boundary adapter and token-derived reading CSS for normal and large-file routes | Synthetic native preservation/rejection/recovery tests and bounded live sample checks; owner accepted heading size, spacing, code, quotation and table formatting. Other DPI and runtime accessibility cases remain open |
| Explorer classic “Show more options” menu | Scoped exact-host Win32 popup palette | Confirmed owner/paint trace and native regressions; live normal, hot, disabled and submenu appearance still need verification |
| Notepad | Bundled exact-package WinUI chrome resource adapter plus the RichEdit-binary editor adapter | A fresh sample window showed black/rose, native gray/white on disable, and the same unmodified character count. Native regressions cover ordinary glyph paint, color emoji, background restoration, high contrast and worker shutdown. Fresh-window chrome checks showed black tabs/toolbar/status regions, rose labels, a dark-red popup and red/rose keyboard focus. Existing chrome is discovered through the exact-runtime diagnostics bridge; full hover, startup and accessibility acceptance remain open |
| Calculator | Bundled package-gated Windows.UI.Xaml brush adapter for the recorded 11.2607.0.0 package | Bounded Scientific-mode black/rose and disable/reapply were observed. Native worker shutdown and a deliberate post-apply restoration fault passed. Other modes, final installer startup and live accessibility acceptance remain open; graph-series brushes are excluded |
| Paint | Native dark-mode/accent treatment only | WinUI 3 toolbars and panels need an adapter; artwork canvas and color swatches must retain their colors |
| Terminal | Native generated scheme, font and opaque chrome | Owner confirmed appearance; command output can intentionally choose other colors |
| PowerToys utilities | Configurable FancyZones, Always On Top and Command Palette appearance | Command Palette exposes tint, not every text role |
| Obsidian | Separate j3w1 CSS/manifest port | Installed pair readback is separate from Windows installation; third-party plugin surfaces may override it |
| Orca, Warp, Ghostty, Codex CLI, Claude Code and ChatGPT Appearance | Separate repository ports | Import only through the corresponding port guide; the Windows installer does not claim these imports |
| Notepad++, browsers, Office, media and archive apps | No application-specific port installed by Windows setup | Use documented theme APIs where available; dark mode alone is not a complete j3w1 match |
| Secure desktop, authentication, protected system surfaces and arbitrary document/media colors | Host-owned | No binary patching, isolation changes, or whole-screen color filters |

## Shared adapters and their boundaries

Search WebView rows and action buttons use the tertiary action palette with no
individual frame. Selected rows share one fill across their text and icon
containers, category selection keeps an accent underline, and keyboard focus
uses the canonical dashed control ring. Color and geometry values resolve from
roles. Non-token presentation declarations are limited to removing borders,
shadows and background images, inheriting a row's fill, and choosing the
specified ring/underline style;
the generator refuses other properties and values. Custom Search JavaScript
remains empty. This describes the generated mapping, not a live acceptance.

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

The exact recorded assembly-qualified CalculatorButton style keeps the native
template, commands, dimensions and state groups. A derived style supplies the
normal and custom hover/press/disabled brush properties. The reviewed
CommonStates color storyboards also retain native brush-valued keyframes;
these must be exchanged for the mapped state brushes. The adapter retains
their WinRT peers and original keyframe objects until restoration, stops
Active/Filling clocks before every keyframe change, verifies Stopped, and
restarts the same native state. Unknown storyboard shapes and failed clock
operations refuse the change. Restoration preserves subsequent app changes.
Layout and Closed handlers are removed before cleanup on unload.

The NavigationView parent and category headers receive local resource
overrides as well as the rows. The native SplitView pane and content-grid
ThemeResources resolve at that parent; refreshing row resources alone leaves
the pane gray. The parent uses the same identity-preserving resource and
RequestedTheme restoration path, without replacing the template or changing
mode, layout or keyboard behavior. The pane, header, divider and current-item
indicator mappings come from the pinned WinUI 2 template. The installed Scientific navigation pane was observed black with rose labels, a dark-red selected row and dark-red dividers. Remaining result-focus and mode coverage require live verification.

NavigationViewItem and its presenter receive the reviewed WinUI 2 normal,
hover, pressed, checked, selected and disabled resource keys separately.
Selection remains a fill and keyboard focus keeps its native geometry with
the mapped brushes. Live prototype checks observed a dark-red selected row,
the warm-red hover fill, a return to black after hover, and restoration of the
native gray selection on disable without changing the current Calculator mode.
These are bounded checks of Scientific navigation, not all-mode acceptance.
The resource keys come from the pinned
[WinUI 2 NavigationView theme](https://github.com/microsoft/microsoft-ui-xaml/blob/v2.8.0/dev/NavigationView/NavigationView_rs1_themeresources.xaml).

Native synthetic regressions exercise stopped-clock admission, active/filling
refusal, partial writes, retry, original object identity, absent/null resources
and later app replacements/deletions. They use the generated production
adapter. Live checks of the development prototype observed black/rose
Scientific buttons, red equals hover, fresh-process startup and two successful
disable operations while equals was hovered. These observations do not accept
the final generated candidate. A white result-focus outline remains a native visual gap; all modes and
runtime accessibility switching still require acceptance.


The bundled Calculator adapter admits only the recorded x64 package identity
and its app-specific resource anchors. It maps the named UI brushes in
`host.json` on the owning CoreWindow thread and attaches a theme-owned resource layer to the observed root. Existing UI
visuals receive identity-matched local brushes while app dictionaries, shared
brushes, opacity and acrylic settings remain untouched. Visual aliases that
demand conflicting colors remain native; any alias to an equation-series brush
refuses admission. Equation and graph
data colors, calculations, labels, commands, dimensions and keyboard handling
remain host-owned. Missing optional keys are left native. This inventory does
not claim that every Calculator mode has been observed.

The Windows CI job builds complete bundled adapter DLLs using the pinned
Windhawk compiler and engine import library, then runs the offscreen caption,
scrollbar, popup, selection, preview-paint and Notepad editor regressions.
Synthetic app hosts separately exercise normal process exit with active and
completed discovery workers, controlled unload and repeated settings changes;
handle counts must return to their baseline. A complete link
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
to the UI thread, cancels bounded startup discovery and waits for its native
thread handle before releasing it. Process exit has no worker-object destructor;
Calculator's UI references skip teardown after their apartment disappears and
are fully released on controlled unload. No XAML dictionary is
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
scrollbar transient, classic menu, Notepad, Calculator and Paint
requirements remain unresolved or unverified. Installer Test checks managed
state, hashes and compatibility; it cannot accept visual behavior. A Computer
Use cancellation message does not prove that the owner pressed a physical key.

### Notepad editor boundary

The native editor adapter admits the recorded Notepad package and RichEdit
binary digest. It discovers the native control class without requiring an open
editor at injection. The documented background message saves the prior color;
later app requests update that baseline. Painting substitutes an owned rose
brush for ordinary opaque-white glyphs only during this editor's paint scope.
It retains glyph arguments, opacity and brush transform, and excludes color
fonts. It never changes character formats or reads document text. Disable and
unload restore saved backgrounds; high contrast bypasses the palette.

A fresh sample window displayed black with rose text. Disabling restored its
native gray editor and white text; both states reported the same unmodified
44-character document and the sample bytes were unchanged. This bounded check
is not fresh-process, color-emoji or runtime accessibility acceptance.

### Notepad chrome ownership

The chrome adapter admits only the recorded Notepad package, loaded WinUI 3
runtime digest and named application islands. It layers token-derived resources
at their UI-thread owner and refreshes native theme expressions while retaining
bindings, templates, commands, dimensions and document text. Exact static
template fills require their observed class, parent, property and neutral ARGB.
Native focus rendering receives the focus-role brushes without changing its
geometry. Unknown roots and document surfaces are refused.

Every local brush, resource key, theme refresh and backdrop retains its prior
value and is restored only while the adapter still owns it. Failed restoration
retains cleanup state; controlled unload removes handlers on the owning thread,
waits for discovery and retries incomplete cleanup. High contrast bypasses the
palette. The same installer journals this adapter, verifies its compiled
artifact and removes/restores it with the other owned adapters. Diagnostic
file logging is absent from the shipped source.


### Existing WinUI root discovery

The Notepad chrome adapter connects to its own admitted process using the
inspected WinUI diagnostics COM contracts. The bridge beside the loaded WinUI
runtime has its own exact SHA-256 gate. It registers no COM class or persistent
process setting and downloads no additional executable. Initial and subsequent
notifications admit only named chrome classes on their owning UI dispatcher;
the callback queues existing ownership-based styling and reads no document
text, application names or data colors. Constructor discovery remains available.

Subscription runs on a background worker because initial enumeration waits for
UI dispatchers. Unload stops admission, unregisters the exact callback and waits
for active callbacks before dropping COM references. A bounded shutdown failure
retains its worker, callback and module until cleanup succeeds or the process
exits. Reconfiguration asks the same worker to enumerate the existing roots.
Another tool already owning the diagnostics connection or an unknown bridge
leaves undiscovered roots native. No connection error grants generic admission.
