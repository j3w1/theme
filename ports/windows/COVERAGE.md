# Windows and application coverage

The Windows installer applies the adapters listed below. It does not make every
application inherit a global j3w1 palette. Windows personalization, Win32 theme
parts, Windows.UI.Xaml, WinUI 3 and embedded web renderers have different color
ownership. A black title bar is not evidence that an application's body is themed.

This is the current implementation inventory, not a visual acceptance record.
Fresh Settings startup was corrected after a trace proved its main CoreWindow
was missed by the pinned upstream lookup. A controlled comparison showed black
page surfaces, rose text and a themed calendar. Whole-app state acceptance is
still open. The owner accepted the corrected existing first Notepad header
after installation and rollback/reapply: black, with unobstructed tabs and all
three native window buttons visible. Paint's gray drawing workspace remains
unresolved. Paint's viewport scrollbar now has native
state mappings and a bounded installed scroll/recovery observation; full
transition and accessibility acceptance remain open.
Exact shell compatibility and historical observations remain in
[COMPATIBILITY.md](COMPATIBILITY.md). All ports remain experimental until their
own import evidence meets the port contract.

The owner confirmed the permanent Paint Selection and Brushes correction: their
main buttons and dropdown arrows stay black/red/rose on hover and pointer exit.
The installed input-language picker and hardware volume popup were also
accepted. These are bounded state confirmations; Paint's drawing surround,
brightness, other popup states and the remaining acceptance checks stay open.

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

The selected frame reserves its border inside the host width. The direct
`.suggContainer` child uses the approved zero spacing role for its logical
leading margin: the recorded host otherwise shifts this full-width opaque
layer by one pixel over the trailing frame. The regression checks paint
ownership at that edge as well as row bounds, in both text directions.
The earlier box-sizing-only candidate passed synthetic bounds checks but
failed the owner's live trailing-edge readback; it remains historical evidence.
The owner confirmed that the installed correction displays the entire right
rose border. Other Search states and accessibility acceptance remain open.

| Surface | Current treatment | Remaining evidence or implementation |
| --- | --- | --- |
| Desktop, accent, supported borders, wallpaper and standard cursors | Native personalization and generated assets | Accessibility overrides take priority; arbitrary app title bars are not covered |
| Start and Search | Pinned Start styler with separate layout selectors, Search XAML frame and WebView CSS palette | Owner confirmed one dark-red fill across selected result icons and labels and correct hover exit. Recent searches, categories, preview actions and runtime accessibility acceptance remain open |
| Taskbar | Pinned taskbar styler, including mapped top divider | Top-edge visual acceptance remains open |
| Notifications, calendar, Quick Settings and toast variants | Pinned notification styler | Notification sidebar and loading controls have owner feedback; not every toast or Quick Settings state has been observed |
| Hardware volume/brightness popup and input-language picker | Pinned taskbar styler with separate panel, frame, slider and item-state mappings | Owner accepted the installed volume popup and language picker. Brightness, additional item states and accessibility acceptance remain open |
| Windows Settings | Pinned Windows.UI.Xaml Settings styler | Bounded native observation only; not a universal application adapter |
| Explorer chrome, native caption buttons and modern context menus | Pinned Explorer XAML styler with a transparent caption composition layer; exact-host native DWM caption adapter | Owner confirmed a black header and all three visible native white button symbols and accepted those symbols. Additional windows, maximized/inactive states and menu interaction coverage remain open |
| Explorer native file list, navigation, Home, selection and scrollbars | Exact-version native theme/GDI adapter | Millisecond scrollbar flashes, DPI variants and runtime high-contrast switching remain open |
| Explorer folder defaults, pins and dividers | Generated original closed/open folder ICOs; journaled current-user generic registrations and shell icon refresh; XAML divider mappings; exact-host navigation pin/state-image and separator paint adapters | Specialized and customized folder icons retain native registrations; pin silhouette, alpha and separator DPI width are preserved; live icon-cache, view and divider acceptance remains open |
| Explorer drag-selection rectangle | Symbol-identified UIMarqueeSelector rooted at the actual Explorer UIItemsView; scoped cached-system-brush substitution, canonical red fill at 12% and themed border | Owner accepted the live red selection area with rose borders. Native solid border is a geometry deviation; other DPI and accessibility cases remain open |
| Explorer filename selection and selected-row outline | Scoped Edit selection and native ListView border color mappings | Border pixel regression passes; corrected live rename outline still needs acceptance |
| PowerToys plain-text/code preview and loading controls | Exact-version, hash-checked Monaco template adapter and native loading palette | Owner confirmed loaded preview and loading control; this does not cover Markdown |
| PowerToys Markdown preview | Digest-pinned WebView2 HTML-boundary adapter and token-derived reading CSS for normal and large-file routes | Owner accepted completed small and large previews after installer rollback/reapply, with black backgrounds and improved rose formatting; earlier typography acceptance covered headings, spacing, code, quotations and tables. Transient startup frames, other DPI and runtime accessibility cases remain open |
| Explorer classic “Show more options” menu | Scoped exact-host Win32 popup palette | Confirmed owner/paint trace and native regressions; live normal, hot, disabled and submenu appearance still need verification |
| Notepad | Bundled exact-package WinUI chrome resource adapter plus the RichEdit-binary editor adapter | A fresh sample window showed black/rose, native gray/white on disable, and the same unmodified character count. Native regressions cover ordinary glyph paint, color emoji, background restoration, high contrast and worker shutdown. Fresh-window chrome checks showed black tabs/toolbar/status regions, rose labels, a dark-red popup and red/rose keyboard focus. Existing chrome is discovered through the exact-runtime diagnostics bridge; full hover, startup and accessibility acceptance remain open |
| Calculator | Bundled package-gated Windows.UI.Xaml brush adapter for the recorded 11.2607.0.0 package | Bounded Scientific-mode black/rose and disable/reapply were observed. Native worker shutdown and a deliberate post-apply restoration fault passed. Other modes, final installer startup and live accessibility acceptance remain open; graph-series brushes are excluded |
| Paint | Exact-package WinUI chrome adapter sharing Notepad ownership and existing-root discovery | Owner accepted permanent Selection/Brushes main-button and dropdown-arrow hover and pointer-exit colors. The drawing surround remains gray; other controls, popup transitions and accessibility acceptance remain open. Drawing controls, artwork and swatches retain native ownership |
| Terminal | Native generated scheme, font and opaque chrome, plus an exact-package legacy-XAML tab/menu adapter | Owner confirmed the earlier general appearance; the new native-menu path needs rendered acceptance. Command output can intentionally choose other colors |
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

### Notepad Settings backing

On the recorded Notepad package, Settings paints through its named direct
RootScrollViewer child. The adapter selects that same-root viewport before
the outer scrolling island wrapper and retains its exact local brush for
restoration. The observed noninteractive ExpanderExQuadratePanel backing and
its direct template Grid receive the input-surface role only under the exact
Settings ancestry and original neutral ARGB. Document controls and other roots
are excluded.

Native Expander controls receive the documented header, content, foreground
and chevron resource keys through the existing owned-resource layer. Native
templates retain expanded/collapsed, hover, pressed, disabled and focus behavior;
state-controlled header paint properties are not replaced. Resource keys were
checked against the [upstream WinUI Expander template](https://github.com/microsoft/microsoft-ui-xaml/blob/8027ff4af619eb470fab63bf4609c6404ee73e17/dev/Expander/Expander_themeresources.xaml).
ComboBox selectors use explicit normal, hover, pressed, disabled, focus and
popup resource keys. Selected popup rows keep the selection fill across hover
and press; inactive selection and disabled rows have their own approved roles.
RadioButton labels use the ordinary and disabled text roles. The existing
owned-resource path retains native templates and restores their previous
entries. The keys come from the same pinned upstream
[ComboBox](https://github.com/microsoft/microsoft-ui-xaml/blob/8027ff4af619eb470fab63bf4609c6404ee73e17/dev/ComboBox/ComboBox_themeresources.xaml) and
[RadioButton](https://github.com/microsoft/microsoft-ui-xaml/blob/8027ff4af619eb470fab63bf4609c6404ee73e17/dev/CommonStyles/RadioButton_themeresources.xaml) templates.
The implementation does not change Notepad's selected appearance preference.
Live appearance and restoration acceptance remain separate checks.

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

### Shared WinUI chrome and native backdrop

Notepad and Paint use one generator template and resource mapping, with separate
exact package gates and named chrome admission lists. Diagnostics below a generic
island root select only the topmost named chrome ancestor in that XamlRoot.
Drawing, swatch and document classes do not grant admission.

Paint's native DWM backdrop values and later app requests remain untouched.
Removing its native backdrop exposed other windows through its transparent
chrome, so the adapter themes the actual opaque backing instead. Notepad's
captured native header path is described below; its public title controller
remains refused. Existing unknown caption color remains native until an app
request provides a baseline or a new window provides a creation baseline.
No forced window restart is used.

Paint's admitted AppChrome renders through a single direct child Grid. Its
background is made opaque using the canvas role, with the exact prior local
value retained for restoration. The Grid must remain in the same XamlRoot;
canvas, drawing, swatch and image properties are not written.

### Calculator popup resource boundary

Tooltips and the result text's command bar use parent-level theme resources.
Refreshing only their child buttons leaves the host background native gray.
The adapter now admits the native ToolTip and CommandBar hosts through the same
local-resource ownership and refresh path as other chrome controls. It uses
ToolTipBackgroundBrush and ToolTipForegroundBrush, correcting two unused key
names, and the CommandBar's AcrylicInAppFillColorDefaultBrush and
SystemControlTransientBorderBrush. These keys are from the pinned
[WinUI 2.8.7 ToolTip template](https://github.com/microsoft/microsoft-ui-xaml/blob/v2.8.7/dev/CommonStyles/ToolTip_rs5_themeresources.xaml)
and [CommandBarFlyout template](https://github.com/microsoft/microsoft-ui-xaml/blob/v2.8.7/dev/CommandBarFlyout/CommandBarFlyoutOS_themeresources.xaml).
The result TextBlock receives the same restorable focus-brush mapping as native
controls; its selection, commands and text remain native. Installed popup,
hover exit and accessibility acceptance remain separate checks.

The first popup resource-host correction passed its structural/lifecycle checks
but the live result menu remained gray. A read-only control/brush trace found a
native Windows.UI.Xaml MenuFlyoutPresenter whose default-style acrylic tint was
neutral gray, outside the application resource aliases. The adapter now colors
only MenuFlyoutPresenter and ToolTip frame Background, Foreground and BorderBrush
through their public dependency properties. It retains each exact local value,
restores only its owned brush, and preserves later application replacements.
Row state backgrounds, templates, commands, selection and text are untouched.
The corrected installed Scientific result menu was observed with a dark themed
frame, rose Copy/Paste labels and a red border. Down-arrow focus remained themed;
no menu command was executed and the existing result and mode were preserved.
Latest Restore returned the popup to native gray, retained-version Test passed,
and reapplication plus automatic Test restored the correction. This bounded
popup lifecycle does not accept tooltips, other modes, startup or runtime
accessibility switching.

### Generic folder glyphs

The native Explorer adapter prewarms immutable stock-glyph references and owned
red folder image lists at initialization. Its original artwork shares the ICO
generator's geometry and semantic fill/edge roles, with no asset-path or shell
cache deletion dependency. Exact current-glyph comparison preserves custom icons,
folder thumbnails and overlays. Unsupported sizes, request layouts, unrelated
windows and high contrast retain native drawing. The recorded 96-byte shell
request keeps its opaque extension; other unknown layouts are refused. Paint
queries no shell content, reads no files and constructs no image lists. Temporary
source pixels are cleared before returning. Clipped-label tooltip draws reuse
the existing same-process Explorer tool/owner admission. Hidden native tooltip
fixtures cover popup-local slot-zero stock glyphs, same-slot custom replacement,
unrelated/detached owners, draw flags, accessibility and native fallback. Live
tooltip-glyph acceptance remains a separate installed check. Controlled unload releases the owned
cache and repaints Explorer through the existing adapter lifecycle.

ExplorerFrame's recorded tab-icon acquisition uses ImageList_GetIcon rather than
the draw path. The same adapter hooks only the exact reviewed comctl32 export,
requires an ExplorerFrame caller and an active owned Explorer window, and
compares unscaled current HICON pixels against independently prewarmed closed/open
stock references. Only normal, exact generic glyphs receive a caller-owned red
icon; the shared shell image list is unchanged. Unknown callers, sizes, flags,
custom glyphs and high contrast keep the original result. No image index grants
admission. Native tests cover retained source pixels, same-slot customization,
failed replacement, fallback and stable GDI/user-object cleanup. Native extraction and raster inspection use a nested guard so the draw hook
cannot recolor a source icon before its stock identity is compared. The guard
restores the previous state on every exit. A live numeric trace then matched
the entire closed-folder glyph and obtained an owned replacement; the visible
XAML tab still remained yellow. This acquisition route therefore does not prove
tab coverage. Live tab-icon and rollback acceptance remain separate checks.

The prototype rendered red generic folders in the sample Details view and in
repainted navigation rows. Existing special-folder glyphs and a populated folder's
large thumbnail stayed native. Final generated-candidate visual and lifecycle
acceptance remain open.


### Keyboard access-key badges

The exact-package Notepad and Paint adapters own only KeyTipBackground,
KeyTipBorderBrush and KeyTipForeground in Application.Resources. Microsoft
[documents this application-level customization](https://learn.microsoft.com/en-us/windows/apps/develop/input/access-keys#keytip-style);
the core KeyTip manager reads those keys directly, outside control resources.
A single admitted UI thread captures the existing entries and restores only
its own values. Font, padding, placement, access keys and hit testing stay native.
High contrast and adapter removal restore the entries; later app replacements
are preserved. Existing core-cached badges may require reopening the app. Live
badge appearance and rollback acceptance remain separate checks. The installed
1.2.3 Notepad and 1.0.3 Paint candidate showed dark badges, red borders and rose
letters. Public Restore -Latest returned the previous adapter versions; a fresh
empty Notepad then showed native gray badges. The already-open core cache is
not a claim of immediate visual restoration. Public Update and automatic Test
passed, and a newly launched empty Notepad process showed the dark/red/rose badges
again. Final complete-host lifecycle acceptance remains open.


### Native preview startup surface

A bounded installed Markdown trace measured a WinForms Window control painting
the exact dark-mode RGB(30,30,30) background with FillRect before WebView content
loaded. Markdown now reuses the text-preview adapter's single loading-surface
implementation. Only owned Window/Static paints and that exact native color are
mapped to canvas; white native labels use the prose role. Memory DCs retain their
originating paint owner, nested paints are isolated, and shared brushes remain
unchanged. Markdown keeps its executable/control/helper digest gates; text
preview keeps its host/template gates. WebView pixels, document content and
unrecognized controls or colors remain native. Installed startup and Restore
acceptance remain separate checks.

### Calculator Scientific flyout and toggles

The installed Scientific Trigonometry flyout used a native FlyoutPresenter
with a neutral acrylic background, separately from the result MenuFlyoutPresenter.
Its 2nd/hyp controls use the native ToggleButton resource ladder. The adapter
now admits FlyoutPresenter through the same owned frame/resource path and maps
normal, hover, pressed, checked, indeterminate and disabled toggle brushes to
the existing canonical roles. Native states, templates, geometry and calculation
commands remain intact. These public style contracts are shown in the pinned
[Calculator application styles](https://github.com/microsoft/calculator/blob/d125246a4e19842ce1332e6c7839cf0e110027d8/src/Calculator/App.xaml)
and [Scientific operators](https://github.com/microsoft/calculator/blob/d125246a4e19842ce1332e6c7839cf0e110027d8/src/Calculator/Views/CalculatorScientificOperators.xaml).
Installed appearance and restore checks remain separate from native ownership
and lifecycle regressions.

The installed 1.4.5 candidate showed black Trigonometry and Function flyout
frames, red frame edges and rose labels. Both 2nd and hyp toggles showed themed
active states and returned to their black resting fill after pointer exit.
No calculation command was invoked; mode and result were preserved. Disabling
the candidate restored native gray controls. This bounded check does not accept
all Calculator modes, startup, DPI changes or accessibility switching.

### Explorer generic tab bitmaps

The XAML tab's SoftwareBitmapSource takes a resource-sized stock folder through
the public WIC icon-conversion method. The Explorer adapter caches those complete
stock identities alongside system image-list identities. Only a matching stock
glyph from the pinned ShellCommon caller receives an independent themed icon.
The input icon remains borrowed; the bitmap result retains its native ownership,
dimensions and error behavior. Caller and WIC module versions and full file hashes
must match. Unknown/custom icons and accessibility overrides retain native
conversion. This uses the existing adapter and the same installation/rollback
journal. An isolated installed comparison showed a red generic tab; final
production-candidate desktop and restore appearance checks remain open.

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


### Notepad native header capture

The public title API remains refused to preserve custom tabs. The owner approved
a Notepad-only existing-window caption policy: exact package/runtime and native
root admission may apply black even without a readable original caption color.
The receipt explicitly resets that unknown caption to Windows' default on
disable, high contrast or rollback; a prior custom override could be lost. A
genuine captured original, including a later application request, restores
exactly. Its readable DWM system-backdrop value is captured separately and
restored with ownership checks. After Update, Test, Latest Restore, baseline
verification and reapply, the owner confirmed the existing first header is
black with unobstructed tabs and all three native window buttons visible. This
bounded acceptance does not cover every launch route or accessibility state. A separate empty-window
comparison showed black with visible tabs/buttons and restored gray on disable;
production later-window checks showed black in active, inactive, maximized and
restored states. Before the existing-caption correction, the fresh-process
first window showed gray outside its tab island; retain that failed startup
observation as history. A readable-backdrop-only
comparison made that strip accent red and was rejected; it supplies no caption
restore value for an unknown window. Accessibility acceptance remains separate.

### Cached app button states

Recorded Notepad templates retained neutral brushes in zero-time object
keyframes after local resource overrides. Paint also retained neutral brushes
in CommonStates setters on menu and toolbar controls. The shared correction
exchanges only admitted brush keyframes and public, unsealed brush setters with
a resolved target inside their owning control. Original objects and expressions
are retained. Color clocks are stopped before exchange and the current native
state is restored. Unknown timelines, sealed collections, unresolved targets,
non-color properties and document/artwork subtrees remain native.

Calculator generates the same implementation for standard dropdown, button and
repeat-button controls. Its calculation buttons keep their specialized adapter.
Disable, high contrast and cleanup restore still-owned objects, preserve later
app replacements and retain failed restoration for retry. Compiled ownership
regressions do not establish live hover, pointer-exit or keyboard-focus acceptance.

### Shared shell button resources

The shell stylers supply normal, hover, pressed, disabled and supported checked
Button, SubtleButton, SplitButton, DropDownButton and AccentButton brush aliases.
Settings also uses the square-corner role for its native button classes. These
mappings cover control families instead of naming the Windows Update command;
they retain commands, dimensions and disabled state. The existing styler
lifecycle owns restoration. Cached shell templates and the reported Update
split button still require a rendered check after installation.

### Composition backing, tooltip and Terminal candidates

Notepad's public composition-backing path retains the exact nullable original
brush and verifies UI-thread/HWND ownership before writing or restoring. Later
app changes are preserved and failed recovery stays retryable. It leaves native
caption layout and Paint's backdrop untouched. Synthetic restoration checks
passed; the first-window gray-strip requirement still needs a rendered check.

Explorer's standard clipped-name tooltip now has an owner-scoped native paint
path. Offscreen checks cover ownership refusal, black surface, canonical edge
and rose text, clipping, high contrast and passthrough. The actual sidebar popup
remains an open visual acceptance check.

Terminal's new exact-package legacy-XAML adapter uses the shared chrome
resources and cached-state restoration only for its tab row and associated
native menus. Terminal output, command palette and suggestions are excluded.
Synthetic boundary, ownership and worker-shutdown checks passed; real menus,
startup and focus acceptance remain unverified. All three additions share the
existing single-script installation and recovery journal. The candidate stays
draft while the owner requirements remain unresolved.

### Deferred native state boundary

Unreadable public visual-state targets or cached color-frame values are refused
before mutation. Their native state remains intact while supported chrome
resources keep their ownership. A live Notepad trace identified the prior
whole-toolbar restoration as a source of native gray paint. This correction
does not establish full hover-state or first-window native-header acceptance.

### Shell preview handoff backing

The pinned Windows preview surrogate owns an opaque native gray background
before PowerToys creates its content window. The existing Markdown adapter now
also admits that exact surrogate executable and an independently pinned Explorer
owner. It paints only WM_ERASEBKGND for the observed Shell Preview Extension Host
Previewer class, with the expected parent/root chain, a matching window DC and
its original solid RGB(30,30,30) class brush. It uses the canonical canvas role.
Shared brushes, child windows, documents and browser rendering remain untouched.
Unknown identities, colors, ownership, DCs and high contrast retain native erasure.
Disable/unload repaints the original backing without inventing a restore value.
The same bundled adapter participates in the existing single-script lifecycle.
A private comparison showed a black initial large Markdown frame; final
generated-candidate installation and recovery acceptance remain separate checks.


### Standard flyout frames

A read-only installed Notepad trace identified its formatting overflow as a
standard FlyoutPresenter with the native acrylic FlyoutPresenterBackground.
The shared chrome adapter now admits that class through the existing loaded,
same-XamlRoot popup path. Its local resource receipt maps
FlyoutPresenterBackground to the raised surface and FlyoutBorderThemeBrush to
the overlay border. Microsoft defines both keys in the pinned
[FlyoutPresenter template](https://github.com/microsoft/microsoft-ui-xaml/blob/8027ff4af619eb470fab63bf4609c6404ee73e17/dev/CommonStyles/FlyoutPresenter_themeresources.xaml).

This uses the existing per-control resource refresh and restoration path in
Notepad, Paint and Terminal. Commands, content, native visual states, geometry,
caption layout and document/artwork surfaces are preserved. Unsupported roots
and runtime identities are refused; high contrast restores native ownership.
The same single installer updates and rolls back the generated adapters.
Installed appearance and recovery remain separate from compiled admission and
ownership tests. The gray first-window Notepad strip and Paint drawing
workspace remain unresolved.


### Standard tooltip surfaces

A live Notepad button check showed a neutral tooltip after the formatting
flyout correction. The shared chrome palette omitted ToolTip's three native
brushes, and its popup admission omitted ToolTip. The adapter now maps
ToolTipBackgroundBrush to the overlay surface, ToolTipForegroundBrush to
ordinary interface text and ToolTipBorderBrush to the overlay border. These
are the public keys in Microsoft's pinned
[ToolTip template](https://github.com/microsoft/microsoft-ui-xaml/blob/8027ff4af619eb470fab63bf4609c6404ee73e17/dev/CommonStyles/ToolTip_rs5_themeresources.xaml).

Notepad, Paint and Terminal share the same loaded, owning-thread, same-XamlRoot
admission and per-control resource receipts. Native content, opening/dismissal,
placement, wrapping, dimensions and animation remain intact. Unknown classes,
foreign roots and high contrast retain native styling. Updates and recovery use
the existing single installer. Native admission/ownership tests and installed
appearance remain separate checks; this does not resolve native composition
strips or drawing-workspace colors.


### Factory discovery admission and worker cleanup

The shared Notepad, Paint and Terminal factory worker waits for the exact
reviewed XAML runtime before initializing COM. An unsupported process needs
neither activation factories nor COM's process-wide handle cache. Worker
shutdown still joins the threads, closes their events and restores owned
resources. Native lifecycle tests retain their exact handle-count assertion;
no handle tolerance or shutdown sleep is added.


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

### Settings button template states

A read-only exact-host trace found ordinary Settings Buttons whose local
ContentPresenter brushes retained the native accent independently of the
application resource aliases. Their direct ContentPresenter owns CommonStates
with Normal, PointerOver, Pressed and Disabled. The Settings adapter now maps
that observed Button family and those template states to the secondary-action
ladder. A native action tone that is not exposed by the selector uses this
secondary fallback; resource-based AccentButton controls retain their primary
mapping. Unknown template shapes remain native. No command, enabled state,
label, dimensions or layout is changed. The pinned styler retains/restores
the original local values through the existing single-script lifecycle.
A mapping and a numeric trace are not rendered hover/focus acceptance.


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

### Settings focus and tooltip resource boundary

A read-only exact-host trace found white focus brushes and a gray
ToolTipBackground in the Settings application dictionary. The Settings
styler now adds its own resource overrides after the shared resource set.
Native primary/outer focus uses the control-ring role and the inner
separator uses the black canvas. Tooltip background, foreground and border
use the raised surface, ordinary rose text and overlay-border roles.
The other four shell stylers retain their existing resource payloads.

Native focus visibility, geometry, keyboard behavior and tooltip timing
are preserved; the pinned styler retains and restores the resource values
through the same install.ps1 lifecycle. This resource mapping does not
establish acceptance of local-brush overrides, Settings Home islands,
toggle/progress details or every application state. Rendered checks and
rollback readbacks remain separate from generation tests.

Reference: [Microsoft focus brush contract](https://learn.microsoft.com/en-us/uwp/api/windows.ui.xaml.frameworkelement.focusvisualprimarybrush).

### Settings tooltip template ownership

A post-update native check showed red heading/button focus outlines, but
the heading ToolTip still rendered gray. Its numeric trace found the
reviewed ToolTipBackground resource already mapped to the raised surface,
while the template-specific ToolTipBackgroundBrush and
ToolTipForegroundBrush retained native values. The actual ToolTip owns
a direct ContentPresenter named LayoutRoot with native OpenStates.

Settings now maps both brush aliases and the ToolTip control itself to
the raised surface, rose text and overlay border. Its public CornerRadius
uses the square role. TemplateBinding carries those control properties
to LayoutRoot; the adapter does not replace the template, content, focus,
dimensions, pointer handling or open/close animation. The four other shell
styler payloads remain unchanged. The pinned styler retains/restores these
local values through the same single install.ps1 lifecycle.

The gray post-resource-only observation remains a failed rendering check.
Rendered tooltip acceptance and other Settings variants remain separate
from generated mappings and restoration tests.

Reference: [Microsoft ToolTip template and brush aliases](https://github.com/microsoft/microsoft-ui-xaml/blob/v2.8.7/dev/CommonStyles/ToolTip_rs5_themeresources.xaml).

### Settings switch and progress resources

The exact-host numeric trace found native ToggleSwitchFillOn and
ProgressBarForeground accent brushes, with a translucent-white
ProgressBarBackground. Live Settings showed that native switch tone and
a gray unfilled progress remainder. These resource families had not been
included in the Settings-specific payload.

Settings now maps the public on/off switch fill, edge, knob and label
resources for rest, pointer-over, pressed and disabled states. Roles come
from the existing switch specification: the on fill follows the primary
action ladder; off uses input/hover/pressed surfaces; edges and disabled
parts retain their separate semantic roles. Progress maps only its ordinary
track, fill and border. Paused/error resources retain the host status
meaning. Native values, toggles, commands, track/knob geometry, animation,
focus and accessibility are unchanged. No opaque ancestor background or
new renderer is added. The other shell payloads remain byte-identical.

The existing pinned styler retains/restores these resource overrides
through install.ps1. Resource readback and lifecycle tests remain separate
from rendered acceptance; local-brush replacements, custom Home progress
implementations and unobserved variants remain open until checked.

References: [Microsoft switch resource contract](https://github.com/microsoft/microsoft-ui-xaml/blob/v2.8.7/dev/CommonStyles/ToggleSwitch_themeresources.xaml),
[Microsoft progress resource contract](https://github.com/microsoft/microsoft-ui-xaml/blob/v2.8.7/dev/ProgressBar/ProgressBar_themeresources.xaml).


### Button subclass dispatch and cached checked colors

The owner-supplied Calculator recording establishes lingering neutral gray on
M+ and F-E after pointer movement. Earlier sampled endpoint checks did not
cover that behavior. The correction uses this failure evidence directly.

Calculator's exact keypad style retains its separate custom-property palette,
including the primary equals action. All other controls enter the shared
ButtonBase/MenuBarItem admission path instead of a list of exact runtime class
names. This includes caption styles on custom button subclasses and native
toggle controls. The shared adapter applies the same approved normal, hover,
pressed, disabled and checked palette to setters and cached color-only
storyboards, including checked hover, pressed and disabled endpoints. Unknown
states, mixed/non-color storyboards, data subtrees and unresolved setter targets
remain under native ownership. The existing nearest-control transition checks,
stopped-clock writes, exact original-object restore and replacement safeguards
are retained. No commands, values, templates or document/artwork surfaces change.

The immediate-transition correction also covers named RootGrid panels and
borders inside the same nearest owning button, with the same exact 83 ms
admission and original-object restoration. A presenter-only traversal left
those independently animated template fill surfaces native. Unknown names and
non-background animation properties remain excluded.

Native regressions exercise state-key resolution and ownership in the generated
Calculator, Notepad, Paint and Terminal adapters without desktop input. These
checks establish the corrected dispatch and state mapping. Subsequent owner
readback confirms Calculator and most Paint controls retain black/red/rose
through hover and pointer exit. Paint Selection and Brushes still have gray
regions in the supplied screenshots; complete live hover acceptance remains
open. The owner's recording
remains the failed rendering evidence, rather than being superseded by a source
test or an earlier sampled pass. This change uses the existing install.ps1
Update, Test and Restore actions; it adds no installer or rollback script.

Microsoft's [Scientific angle controls](https://github.com/microsoft/calculator/blob/main/src/Calculator/Views/CalculatorScientificAngleButtons.xaml)
declare F-E as a ToggleButton and caption controls with Button-targeted styles;
the [memory controls](https://github.com/microsoft/calculator/blob/main/src/Calculator/Views/Calculator.xaml)
use caption styles on custom CalculatorButtons. These public sources support
the dispatch correction, not a claim about an uninspected installed template.


### Split-button resting template bindings

Owner screenshots identify residual gray on Paint's Selection and Brushes
controls after the shared ordinary-button correction. Source review identifies
a separate parent-binding gap: the adapter overrides SplitButton resources but
does not replace the parent's already-resolved Background, Foreground or
BorderBrush. The native framework template uses those properties for its
resting main/dropdown parts, independently of their color-state endpoints.

The shared chrome adapter now admits those three stable public brush properties
only on exact framework SplitButton classes inside an already-admitted chrome
root. It uses the existing SplitButton role mappings, local-expression refusal,
protected data-brush check, original local-value receipt and later app-write
preservation. Disable, high contrast, update, Restore and Uninstall use the
existing property restoration path. No template, inner content, artwork, native
state, dimensions, event handling or command changes. Calculator's accepted
adapter bytes are unaffected by this correction.

Native tests verify the exact control/property boundary and palette availability.
The screenshots establish the remaining rendering failure; the parent-binding
mechanism is a source diagnosis, not a rendered acceptance result. Custom
split-button subclasses and unreadable expressions remain native. Post-update
Paint hover and pointer-exit acceptance remains required. Notepad's first-window
header and Paint's drawing surround remain separate unresolved surfaces.

Reference: [Microsoft SplitButton parent TemplateBindings and native states](https://github.com/microsoft/microsoft-ui-xaml/blob/v2.8.7/dev/SplitButton/SplitButton.xaml).

### Retained transition proof for transparent button bases

Owner readback failed after the SplitButton-parent candidate: Paint Selection
and Brushes still showed gray. A read-only exact-package toolbar trace found
standard DropDownButton controls with a direct named ContentPresenter, four
CommonStates, an empty Normal state and three zero-time brush animations in
each remaining state. Their inherited backgrounds retained transparent white
RGB, while their BackgroundTransition had already become the adapter's private
zero-duration replacement. No SplitButton was found in that toolbar trace.

The shared helper applied transition removal before base normalization, but
base admission still required the current transition to have its original
83ms duration. It therefore rejected the template after its own earlier write.
Base normalization now accepts the exact original 83ms transition retained in
an active ownership receipt for the same presenter and current applied object.
An arbitrary zero-duration transition, unreadable original, later replacement,
different presenter or modified applied duration grants no admission. The
existing template/state, local-expression and data boundaries are unchanged.

The original background/local value and native transition still use their
existing restoration receipts; no additional state or ownership mechanism is
created. Synthetic regressions exercise admission after replacement and refusal
for missing/stale receipts, target/object mismatches and changed durations in
all four generated app adapters. The trace establishes the helper interaction;
post-update Paint rendering remains an acceptance requirement.

### Null background-transition correction

Owner readback failed on the retained-transition candidate: Paint Selection
and Brushes still turn gray on hover. The subsequent read-only toolbar trace
shows canonical normal RGB and canonical hover/pressed brush keyframes on both
actual DropDownButton controls. The failed result remains failure evidence.

Microsoft's [ContentPresenter Background setter](https://github.com/microsoft/microsoft-ui-xaml/blob/7464454690d73d96ead7e1b075772fca632e5a52/dxaml/xcp/core/core/elements/ContentPresenter.cpp)
clears the element's stored compositor fill transition when Background changes
with a null BackgroundTransition. A zero-duration transition instead enters
the animation path: [SharedTransitionAnimations](https://github.com/microsoft/microsoft-ui-xaml/blob/7464454690d73d96ead7e1b075772fca632e5a52/dxaml/xcp/components/comptree/SharedTransitionAnimations.cpp)
clamps it to the compositor minimum, and
[WUCBrushManager](https://github.com/microsoft/microsoft-ui-xaml/blob/7464454690d73d96ead7e1b075772fca632e5a52/dxaml/xcp/components/brushes/WUCBrushManager.cpp)
can hand off the currently animated color. These upstream sources explain why
the earlier zero-duration replacement did not actually remove interpolation;
they do not establish the installed app's rendered result.

The shared helper now writes null only for the existing admitted native 83ms
transition on its exact control-owned template part. Normalization and native
state background changes then take the cleanup path. Nullable comparison is
limited to this transition receipt; other property ownership remains unchanged.
The captured native object is restored exactly. A later different transition,
failed getter, stale receipt or unrelated null transition grants no ownership.
The original state, brush, template, data and high-contrast boundaries remain.

Native regressions cover repeated application of owned null, exact restoration,
restore failure and retry, mutation-then-failure, later replacement and permanent
replacement refusal in all four generated app adapters. This corrects the
transition mechanism; Paint hover acceptance remains a separate runtime gate.
The existing single install.ps1 lifecycle distributes and restores the change.

### Paint Selection and Brushes custom split-button correction

The owner continued to observe gray after the prior native candidates. A fresh
exact-package trace identified Selection and Brushes as PaintUI.SelectableSplitButton
controls, with separate Button/Grid children for their main and arrow halves.
The earlier DropDownButton observations were other toolbar controls and did not
establish the rendering path of these two custom split buttons.

Each child has a direct SelectionBorderOuter Border with an 83ms background
transition and a two-stop native white edge gradient. Recoloring the gradient
alone failed owner acceptance. The combined temporary comparison removed these
four exact outer-border transitions and recolored both stops using the existing
ButtonBorderBrushPointerOver role. The owner confirmed black/red/rose hover and
pointer-exit colors for the main buttons and arrows. This comparison acceptance
does not certify a different installed production binary.

The permanent correction admits only that exact name and Button/Grid/custom-owner
chain, the existing exact 83ms transition contract, and the observed two-stop
gradient with offsets double(0.33f) and 1.0 and initial ARGB values 0x18FFFFFF
and 0x12FFFFFF. Both stops become the same mapped color; no geometry, state,
command, offset or collection changes. Data brushes and shared data stop
identities are excluded. At most 4096 stops are retained. Tracked colors are
read again on refresh, so later application writes end ownership and remain
preserved across theme deactivation. Failed mutations and restores retain their
receipts for the existing UI-thread cleanup retry. Exact original transition
objects and stop colors are restored through the single install.ps1 lifecycle.

Native regressions cover exact scope/offset/color admission, protected-data
refusal, paired writes, repeated refresh, later app writes, partial failures,
restore refusal and exact retry recovery. Post-install rendering acceptance
remains distinct from these structural and ownership checks. Notepad's first
window header, Paint's drawing surround and other unresolved shell surfaces
remain open. Owner screenshots also show gray volume-popup panels/tracks and
language-picker rows/borders; those are separate pending shell corrections.

### Hardware volume/brightness popup and input-language picker mappings

Owner screenshots establish native gray volume-popup panels/tracks and the
input-language picker's panel, selection fill and borders. The pinned taskbar
styler source already targets Grid#ConfirmatorMainGrid, VolumeConfirmator,
BrightnessConfirmator, their track/indicator rectangles and the exact
WindowsInternal.ComposableShell.Experiences.TextInput.Common.InputSwitcher
content wrapper. The previous j3w1 taskbar configuration supplied text colors
and the main taskbar background only; it omitted those separate flyout surfaces.

The taskbar mapping now assigns those known panels black, their outer frames
the overlay border role, the tracks the control-boundary role and the active
segments the active-border role. The existing native ListViewItemPresenter
state properties map neutral, hovered, pressed and selected rows to the same
canonical state ladder used by the other shell mappings. Inner picker backing
is black without another frame. Native slider values, input-language selection,
item layout, sizing and focus behavior are preserved. These settings use the
already-pinned taskbar adapter and the existing install.ps1 settings journal;
they add no dependency or separate installation action.

The upstream selector provenance and generated-role validation establish the
configuration, not the installed native hierarchy or visual acceptance. Volume,
brightness and language-picker rendering remain pending after installation.
Reference: [pinned taskbar styler source](https://github.com/ramensoftware/windhawk-mods/blob/651e01908512da9fa4935a9ef2859741c7e69240/mods/windows-11-taskbar-styler.wh.cpp).

### Paint menu acrylic backing

The recorded exact-package Paint View menu uses a DesktopAcrylicBackdrop behind
its already-themed presenter and template brushes. A bounded observer read this
public property before first layout and after layout; the native acrylic object
remained present in both samples. The opening gray strip is a transient failure,
not a steady-state width defect.

The Paint adapter now clears only this known MenuFlyoutPresenter backdrop in an
admitted, loaded, same-root chrome subtree on its UI thread. It retains the exact
original object and restores it on disable, high contrast or unload while its
null remains owned. Later application replacements win; unknown custom backdrops
are untouched. No popup HWND, drawing surface, layout or menu command is changed.
The single public installer journals this adapter update and its rollback.
Native tests cover null applied values, object restoration, later replacements,
partial writes, retry and refused control/root/thread boundaries. Installed
first-frame rendering remains a separate acceptance check.
Reference: [Microsoft MenuFlyoutPresenter.SystemBackdrop documentation](https://learn.microsoft.com/en-us/windows/windows-app-sdk/api/winrt/microsoft.ui.xaml.controls.menuflyoutpresenter.systembackdrop).

### Input-language picker outer layers

The picker has independent Control and popup-border surfaces outside the
previously mapped content Grids. The pinned taskbar adapter source includes
the exact InputSwitcher class, its direct content Border and the named
InputSwitcherPopupBorder. Those outer surfaces now receive the same canvas,
overlay border and square-corner roles through the existing settings journal.
The popup selector uses Windows.UI.Xaml.Controls.Primitives.Popup explicitly:
the upstream bare-class expansion defaults to Controls and cannot identify
a Popup through that alias. No dimensions, selection commands, input-language
settings or new diagnostics consumer are changed.

Upstream selectors establish the configuration defect; the currently installed
native hierarchy and rendered acceptance remain separate evidence. This change
does not establish a correction for the hardware volume popup.

### Notepad tab-island composition backing

A bounded exact-package comparison set the TabsBar ContentIsland's public
SystemBackdrop to a solid canvas brush. It made the backing behind the tab and
add-tab control black and restored the captured null on removal. The separate
gray native strip to the right remained; this is a tab-backing correction only.

The production adapter reuses its existing composition-brush ownership and
cleanup receipts. Admission requires the loaded exact TabsBar root, its UI
thread, a connected open ContentIsland, the matching native Notepad WindowId
and a readable null backing. An ordinary Windows composition brush satisfies
the public interface; no restricted composition-engine feature is enabled.
Detached or unreadable targets retain recovery for retry, closed targets are
discarded without backdrop access, and later app replacements remain native.
No title bar is materialized, no HWND geometry changes, and document/editor
content remains untouched. Native ownership tests and installer checks do not
replace production rendering acceptance.
Reference: [Microsoft ContentIsland documentation](https://learn.microsoft.com/en-us/windows/windows-app-sdk/api/winrt/microsoft.ui.content.contentisland).

### Notepad tab-island reference lifetime

The first production tab-backing candidate failed a fresh Notepad launch.
Its fault was in weak-reference construction: the observed ContentIsland does
not supply IWeakReferenceSource. The production adapter now retains the island
as an ordinary strong COM peer. It releases that peer after closure, native
window destruction or completed restoration, and keeps unreadable or detached
targets for the existing recovery retry. The closed-target guard still runs
before any backdrop getter. No AppWindow title bar or document API is accessed.

The native regression uses the production storage with an object that explicitly
refuses weak references and checks retention and final release. The earlier
startup failure remains rejected evidence; synthetic checks do not substitute
for a fresh installed Notepad startup and rendered acceptance.

### Notepad system-dispatcher dependency

An admitted Notepad tab island can have a WinUI DispatcherQueue without a
Windows.System.DispatcherQueue on the same UI thread. In that state the system
Compositor constructor refuses creation, before CreateColorBrush runs. The
adapter calls the documented EnsureSystemDispatcherQueue method on the
island's existing WinUI dispatcher after the exact package, runtime, loaded
island, native-root and null-backdrop checks. WinUI manages system-queue shutdown
with its own dispatcher. The adapter creates no controller, thread or message
loop and changes no security policy.

The existing ownership receipt restores the nullable original brush on removal
or compatibility suspension, preserving intervening application changes. This
corrects the tab-island backing only. The separately rendered native caption
strip still needs an admissible baseline; it is not covered by this correction.

References: [system dispatcher management](https://learn.microsoft.com/en-us/windows/apps/develop/dispatcherqueue#system-dispatcher-management)
and [EnsureSystemDispatcherQueue](https://learn.microsoft.com/en-us/windows/windows-app-sdk/api/winrt/microsoft.ui.dispatching.dispatcherqueue.ensuresystemdispatcherqueue).


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


### Explorer WinUI toolbar tooltip backing

A bounded numeric trace of the pinned Explorer styler identified an actual
WinUI ToolTip and its direct ContentPresenter#LayoutRoot child. Both retained
a native non-solid background and translucent black border, while the child
text was already rose. The trace does not identify the exact background brush
class. The Explorer configuration had no tooltip backing selectors.

The existing Explorer styler now maps these two observed layers to the raised
surface, default text, overlay border, zero radius and default border width.
These resolve from canonical roles; there is no additional resource dictionary,
diagnostic module or installer. Content, placement, timing, visibility, focus,
target sizes and accessibility remain host-owned. The same public install.ps1
transaction updates and restores the selectors.

Generated mapping and preservation checks are separate from installed rendering
acceptance. This correction covers the WinUI toolbar tooltip; the distinct
native file-details and clipped-name tooltip paint path remains unresolved.
First-open, DPI and high-contrast appearance require their own observations.
