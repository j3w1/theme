# Obsidian port implementation and audit

This is the maintainer-facing contract for the [installation guide](README.md).
The port remains **experimental**, dark-only, and unverified by the repository's
real-import protocol. A Windows Obsidian 1.13.7 import and visible rendering were
reported by the user; that report does not establish the exact artifact digests,
manual keyboard, zoom, screen-reader or full protocol observations. The recorded
`testedVersions` and `evidence` arrays therefore remain empty. No Android import
is recorded; the mobile, tablet and phone root rules are source-audited only.
Structural source checks against 1.13.4 and 1.13.7 are not real imports.

## Scope and semantic mapping

`npm run generate` emits the manifest from `theme.json` and emits CSS from
`mapping.json` and the resolved default profile. Never edit `dist/` by hand.
`mapping.json` partitions every resolved token, including inspection-only
primitives; `capabilities.json` records mapped, inherited, unsupported and
out-of-scope distinctions. Its `themeRevision` identifies the canonical token
basis and proves no host execution. Pending uses remain use-and-report under
D-007 (control boundary) and D-008 (divider); this port does not approve them.

Native surface variables keep the Markdown canvas true black, sidebars and
settings panels on the default surface, menus/popovers/command surfaces raised,
dialogs on the overlay, fields on the input surface and bars on chrome. The
Obsidian-only mapping intentionally assigns `color.text.default` (`#e99499`)
to Reading View and CM6 note bodies as well as interface text, and reserves
`color.text.prose` (`#f4eeee`) for note headings `--h1-color` through
`--h6-color`, `--inline-title-color` and `--bold-color`. This reverses the
canonical prose/heading emphasis semantics **only in this port**; no token or
specification value changes. Italic and setting-group headings retain
`color.text.bright`; links, syntax and controls retain their own mappings.
Secondary chrome remains muted and metadata subtle. Settings descriptions,
command results and other rendered UI keep rose text.

Obsidian redeclares several variables on mobile dark roots with higher
specificity. Generated CSS repeats the mapped values at matching specificity
for mobile, tablet and phone roots. This keeps standard and tapped buttons,
warning confirmations and ordinary text fields readable on mobile. Four
audited Search, drawer, metadata and Bases contexts clear the native field
fill; scoped input rules restore `color.surface.input` behind the approved
`color.text.placeholder`, including in mobile layouts.

File Explorer, Search and Backlinks inherit native variables. Navigation,
tabs and prompt results have recessed selections with a two-pixel indicator;
window-inactive tabs use separate inactive fill/text/indicator. Native
core-plugin panels that consume semantic variables inherit them, but this is
no claim about every core-plugin view. PDF/print, Canvas/Graph data colors and
non-status callout colors are outside scope.

Text selection, CM6 selection and keyboard focus have separate assignments.
The CM6 scroller scopes the editor fill over `.cm-content` and its sibling
`.cm-selectionLayer`; native `::selection` and drawn selection inherit it.
Which layer a mode draws, table-widget exceptions and selected syntax
foregrounds remain native; uniform selection rendering is not claimed.
Status/error/warning/success text and error/warning/success/info callouts use
matching status roles; host glyphs remain. Monochrome `--code-*` variables
cover editor and Reading View code highlighting. The host shares values/tags/
regex categories: distinct constant/type/attribute categories are unsupported
rather than falsely mapped. Opt-in hued syntax remains out of scope.

All three theme family variables carry the canonical mono fallback stack.
Obsidian's explicit user font overrides take precedence. No font binary is
bundled; font sizes, relative headings, line heights and zoom stay native.
Compact prompt rows use a minimum height, not a clipping height; the native
search input grows with text and uses a comfortable minimum. Only its start
padding is compact; native clear-button end space stays. Selected prompt notes,
flair, faint text and actions use on-selection text. Tree rows and main/sidebar
tabs reserve transparent indicator borders at rest.

## Compatibility and deviations

The public `minAppVersion` is **1.13.4**, the earliest public 1.13.x source
audited here, not a claim that earlier releases fail. Every emitted native
variable has a definition and consumer in 1.13.4 and 1.13.7 `app.css`;
selector hooks and cascade facts are audited in both sources. Definitions
alone do not count as mapping coverage. Inert warning tint,
heading-formatting, modal-shadow and touch-radius-l keys are omitted. Official
developer documentation is pinned to revision
`c56c7e770ba25dd0ea392aacf4588f9425970d36`.

- Native focus geometry remains: buttons use a three-pixel solid shadow ring;
  fields/selects/radio/checkbox/slider/toggle retain host rings and timing.
  Filled primary/checked controls recolor the same indicator to container
  color, destructive fills to on-danger text. The prompt suppresses its ring,
  so only it receives a canonical inset dashed replacement on `:focus-visible`.
  Fields also focus on pointer input; container/invalid offsets are inherited
  or unsupported.
- Geometry variables are square. Host-only tab joins, platform widgets,
  plugin geometry and mobile layout can diverge; native target sizes remain
  except bounded compact prompt rows. User/system dialogs stay native. No
  universal geometry or accessibility conformance is claimed.
- Plain destructive buttons retain danger text/borders at rest and use the
  canonical destructive hover pair on hover and mobile tap, with the native
  focus shadow recolored. Warning confirmations keep desktop error fills and
  mobile transparent fills over the host surface (4.94:1 on the modal
  overlay). Disabled/aria-disabled overrides win over all variants.
- Native action variables conflate pressed/hover states. Unmapped action,
  inactive-navigation, diagnostic stripe/underline and editor search/current-
  line roles have precise capability reasons; equal hex values do not add
  coverage.
- Phone raised Search, mobile drawer Search, metadata multi-select and side-
  dock Bases Search receive scoped black input fills where native transparency
  would put placeholder text below the contrast floor. Surrounding rows and
  panels keep native geometry and surfaces. A core input inside a mobile menu
  is not established by the audit; plugin-inserted controls are out of scope.
- Shadows and raised blur are disabled through native variables, retaining
  focus shadows and toggle outline. Animation stays native; complete reduced-
  motion and forced-colors behavior still needs a real import. Forced-colors
  focus uses `Highlight`; host selection handling is inherited.
- User CSS snippets and font overrides may alter the result. Third-party
  plugins can inherit semantic variables but get no plugin-specific selectors.
  Non-status callouts and data colors are not reassigned as status hues.
- Global UI selection preserves its foreground. Rose `--text-normal` on the
  global `--text-selection` fill measures **3.96:1**, below the 4.5:1 text
  floor; muted/faint UI foregrounds are lower. Search `:hover` and
  `.mobile-tap` use this fill with rose text; secondary replacement actions
  keep their native foregrounds. Reading View ordinary rose text also has
  this low global selection pairing; CM6's scoped selection fill passes for
  ordinary rose text in synthetic cascade tests, but selected syntax remains
  host-owned. This limitation is explicit, not a contrast waiver or a
  conformance claim. The canonical near-white selection pair still passes.
- Known canonical syntax-selection limitations remain in
  `spec/accessibility.md`. Automated mapping and contrast checks are
  structural, not Windows, keyboard or screen-reader evidence.

No RGB/HSL compatibility helpers, `!important`, `:has()`, network calls,
remote assets, telemetry, JavaScript or foreign-theme dependencies are emitted
in the CSS. Semantic variables take priority over Obsidian's generic Accent
setting for mapped roles without changing that setting. Builds never fetch
Obsidian or its sources. Vendor CSS is neither committed nor emitted.

Sources: [official theme tutorial](https://github.com/obsidianmd/obsidian-developer-docs/blob/c56c7e770ba25dd0ea392aacf4588f9425970d36/en/Themes/App%20themes/Build%20a%20theme.md),
[theme guidelines](https://github.com/obsidianmd/obsidian-developer-docs/blob/c56c7e770ba25dd0ea392aacf4588f9425970d36/en/Themes/App%20themes/Theme%20guidelines.md),
[colors](https://github.com/obsidianmd/obsidian-developer-docs/blob/c56c7e770ba25dd0ea392aacf4588f9425970d36/en/Reference/CSS%20variables/Foundations/Colors.md),
[typography](https://github.com/obsidianmd/obsidian-developer-docs/blob/c56c7e770ba25dd0ea392aacf4588f9425970d36/en/Reference/CSS%20variables/Foundations/Typography.md),
[1.13.4 application source](https://github.com/obsidianmd/obsidian-releases/releases/tag/v1.13.4),
[1.13.7 application source](https://github.com/obsidianmd/obsidian-releases/releases/tag/v1.13.7).

## Selector ledger

Keys containing ` | ` in `mapping.json` name an exact selector/property pair.
Every other mapped key is a native variable on `.theme-dark`; that root and
variable-only resets are documented extension points. Obsidian redeclares
mapped keys on four compound dark roots. Generated CSS repeats only the
existing mappings after the base root, at native specificity:

| Generated root | Native declaration it counters |
| --- | --- |
| `.theme-dark.is-mobile` | 11 mapped mobile variables, including standard button and form-field fills. |
| `.theme-dark.is-mobile.is-tablet` | Tablet settings background. |
| `.theme-dark.is-tablet` | Tablet titlebar backgrounds. |
| `.theme-dark.is-phone` | Phone modal sidebar background. |

These bounded gaps have no adequate global variable. Selectors are
source-audited, not validated in a running app; regression contracts pin scope.

| Selector | Why a variable alone is insufficient |
| --- | --- |
| `.theme-dark .markdown-preview-view` | Reading View shares `--text-normal` with UI; explicitly scope rose note text. |
| `.theme-dark.is-phone .search-input-container.mod-raised input` | Phone raised Search clears field fill; restore approved input surface behind placeholder. |
| `.theme-dark .workspace-drawer .search-input-container input` | Mobile drawer Search clears field fill; restore input surface behind placeholder. |
| `.theme-dark .metadata-property-value .multi-select-container input` | Metadata multi-select inputs are transparent; restore input surface behind placeholder. |
| `.theme-dark .bases-search-row .search-input-container input` | Side-dock Bases Search clears field fill; restore input surface. |
| `.theme-dark .markdown-source-view.mod-cm6 .cm-content` | CM6 content root explicitly scopes rose note text, separate from interface widgets. |
| `.theme-dark .markdown-source-view.mod-cm6 .cm-scroller` | CM6 scroller contains content and sibling drawn-selection layer; scope editor selection above both. |
| `.theme-dark .popover` | File preview popovers use canvas variable locally; raised content requires scoped value. |
| `.theme-dark .tooltip` | Native tooltip hardcodes white text and has no border variables. |
| `.theme-dark .tooltip.mod-error` | Error tooltip fills with `--background-modifier-error` and needs its own on-fill text. |
| `.theme-dark .prompt input.prompt-input` | Prompt field needs fill/border; compact start padding preserves clear-button end reservation. |
| `.theme-dark .prompt input.prompt-input:focus-visible` | Prompt suppresses focus shadows; add one inset dashed ring. |
| `.theme-dark .prompt .suggestion-item` | Suggestions have fixed padding but no density or selection-indicator variable. |
| `.theme-dark .prompt .suggestion-item.is-selected` | Separate selection and indicator; scoped text keeps notes, flair, faint text and actions readable. |
| `.theme-dark .menu` | Menus consume general hover fill; local strong hover keeps other surfaces restrained. |
| `.theme-dark .tree-item-self` | Reserve selected tree indicator in every state to prevent label movement. |
| `.theme-dark .tree-item-self.is-active` | Navigation active fill lacks selected-indicator variable. |
| `.theme-dark .tree-item-self.is-selected` | Navigation selected fill lacks selected-indicator variable. |
| `.theme-dark .workspace-tab-header-container .workspace-tab-header` | Reserve tab indicator in every state for main/sidebar tabs. |
| `.theme-dark .workspace-tab-header-container .workspace-tab-header.is-active` | Sidebar uses hover fill, main lacks indicator; named-state override covers both. |
| `.theme-dark button:not(.clickable-icon)` | Standard buttons use shadow as boundary; supply real outline edge. |
| `.theme-dark button.mod-cta` | Recolor native button focus shadow on primary fill. |
| `.theme-dark .checkbox-container.is-enabled` | Recolor native toggle outline on primary fill. |
| `.theme-dark input[type="checkbox"]:checked` | Recolor native checkbox focus shadow when checked. |
| `.theme-dark input[type="radio"]:checked` | Recolor native radio focus shadow when checked. |
| `.theme-dark button.mod-destructive` | Restore plain destructive text/border after standard-button rule. |
| `.theme-dark button.mod-destructive:hover` | Destructive hover pair recolors native focus shadow; only under `(hover: hover)`. |
| `.theme-dark button.mod-destructive.mobile-tap` | Mobile tap otherwise borrows unsafe secondary hover fill; retain destructive pair. |
| `.theme-dark button.mod-warning` | Native warning keeps desktop error and mobile neutral fills; recolor text/focus. |
| `.theme-dark button.mod-destructive.mod-cta` | Destructive confirmation requires on-danger text/focus color. |
| `.theme-dark select` | Select uses decorative input shadow as edge; add real border. |
| `.theme-dark .dropdown` | Dropdown uses decorative input shadow as edge; add real border. |
| `.theme-dark .combobox-button` | Combobox uses decorative input shadow as edge; add real border. |
| `.theme-dark button:not(.clickable-icon)[disabled]` | Native disabled opacity replaced by explicit contrast-accounted roles. |
| `.theme-dark button:not(.clickable-icon)[aria-disabled="true"]` | Native aria-disabled opacity replaced by explicit roles. |
| `.theme-dark .prompt input.prompt-input:hover` | Native hover forces transparency; retain fill/border under `(hover: hover)`. |
| `.theme-dark .workspace-tab-header-container .workspace-tab-header.is-active:hover` | Active sidebar hover borrows hover fill; selection wins under `(hover: hover)`. |
| `.theme-dark:not(.is-focused) .workspace-tab-header-container .workspace-tab-header.is-active` | Inactive tabs have text but no inactive fill/indicator variables. |
| `.theme-dark .prompt .suggestion-action` | Actions use primary fill as text; use accent with selected-row on-selection text. |

The forced-colors block repeats `.theme-dark`, the same primary/destructive/
checked-control selectors and prompt `:focus-visible` selector solely to use
system `Highlight` focus color. It adds no host hook.

## Installers

Both platforms install the same two artifacts; there is no Android variant of
the theme. `OBSIDIAN_INSTALLERS` in `scripts/lib/obsidian-port.mjs` names the
two reviewed helpers the site serves byte-identically beside the artifacts:
`install.ps1` (Windows PowerShell) and `install-android.sh` (POSIX `sh`, for
Termux and device-storage vaults, see [ANDROID.md](ANDROID.md)). Neither is a
native artifact, and neither is listed in `port.json`.

They share one contract. Resolve an existing vault and require `.obsidian`.
Download both live files to a temporary folder. Require the `j3w1` name and
dotted versions in the manifest, and a non-empty CSS whose first line names
the same version. Stage the complete pair inside `themes/`, keep the previous
pair until replacement succeeds, restore it on failure, report retained
recovery copies when restoration fails, and remove temporary files. Their
user-facing messages match. They differ in the replacement step: the Windows
helper copies two files over the old pair, while the Android helper renames
the whole `j3w1` folder aside and renames the staged folder into place, so it
refuses a `j3w1` folder that holds anything but the pair, or holds only one
of the two files, or is a link. `mv` into an existing folder nests instead of
replacing, so the Android helper claims success only when the pair is
directly in `j3w1` and the staged folder is gone. It rechecks that `.obsidian`
and `themes` are still real folders before each change. It keeps both hidden
folders, and removes nothing under `themes`, when a swap fails, is stopped by
a signal it can catch, or finds a folder changed. Shell code cannot confine
writes against an app that changes the vault concurrently, or run cleanup
after an uncatchable stop; ANDROID.md states both limits and the manual
recovery.

`tests/obsidian-android-install.test.js` runs the real Android script against
scratch vaults under `sh` and, when installed, dash and busybox, with stub
`curl`, `mv` and `rm` and a PATH that holds only the declared tools. The stubs
also act as a concurrent app: they recreate `j3w1` or turn `themes` into a
link mid-swap. It proves the shell contract, not an Android import. `tests/obsidian-port.test.js` holds the
PowerShell text contract; no PowerShell run of `install.ps1` is recorded.

## Verification before claiming a real import

Use a disposable vault on the intended host. Record app version, OS, font,
zoom and the exact two artifact digests. Inspect settings, File Explorer,
Search, Backlinks, CM6/Live Preview, Reading View, split panes and tabs, both
command prompts, menus, popovers, tooltips, dialogs, controls, status messages,
focus, selection and caret. Record actual observations and `NOT_RUN` checks in
the repository real-import protocol before changing `testedVersions` or status.

On Android, also record the device, Android version, Obsidian version, that the
vault is in device storage, and whether the phone or tablet layout ran (both
when available). Inspect the left and right drawers, the mobile toolbar, the
phone raised Search and drawer Search fields, tapped buttons (`.mobile-tap`),
warning and destructive confirmations, both prompts and settings. Touch input
does not normally show keyboard focus rings; record a hardware-keyboard focus
check separately or as `NOT_RUN`.

Record each platform in its own evidence file with its own `platform`
(`windows` or `android`); mobile CSS that passes a source audit is not an
Android import. `port.json` `evidence[]` may list both records, but
`capabilities.verificationPath` binds one protocol to the catalogue at a time.

`targetVersions` lists exactly the audited host versions, 1.13.4 and 1.13.7,
because verification requires the recorded application version to be both a
target and tested. A new Obsidian version becomes a target only after its hook
audit is added to `tests/fixtures/obsidian-hooks.json`.
