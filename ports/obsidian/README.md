# j3w1 for Obsidian

Experimental, dark only, default profile. Structural contracts and inspection of
Obsidian 1.13.4 and 1.13.7 sources are not a real import: `testedVersions` and
`evidence` are empty. Windows import, visual inspection, manual keyboard,
screen-reader and zoom checks are **NOT_RUN**.

## Install, update and roll back

1. Obtain **both** `manifest.json` and `theme.css` from the repository's generated
   Downloads table, at the same immutable revision. Source version 3.1.0 prepares
   the next `v3.1.0` tag; its public downloads become available only after the
   owner publishes that release. Until then, use the generated files from a
   reviewed checkout at one full commit.
2. Create `<vault>/.obsidian/themes/j3w1/` (or the equivalent theme directory
   under your vault's configured Obsidian configuration folder). Copy the two
   files there with exactly these names:

   ```text
   <vault>/.obsidian/themes/j3w1/
     manifest.json
     theme.css
   ```

3. In Settings → Appearance, set **Base color scheme → Dark**, then
   **Themes → j3w1**. Adapt to system works only while the system resolves to dark.
   Restart Obsidian after installing or changing the manifest.

For an update, save both previous files outside the active theme directory,
then replace both from one new pinned revision and restart Obsidian. Select the
previous theme or Default under Appearance to undo installation. To roll back a
j3w1 update, restore both saved files together and restart; do not mix versions.
This local theme is not submitted to the Community directory and has no updater
or installer. It changes no vault data, settings, keybindings or plugins.

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
dialogs on the overlay, fields on the input surface and bars on chrome. UI text
stays rose, headings/emphasis bright rose, secondary chrome muted and metadata
subtle. Near-white prose is limited to Reading View and CM6 content roots, so
settings descriptions, command results and other rendered UI keep rose text.

File Explorer, Search and Backlinks inherit these native variables. Navigation,
tabs and prompt results have recessed selections with a two-pixel indicator;
window-inactive tabs use their separate inactive fill/text/indicator. Native
core-plugin panels that consume semantic variables inherit them, but this is no
claim about every core-plugin view. In particular, PDF/print presentation,
Canvas/Graph data colors and non-status callout colors are outside scope.

Text selection, CM6 selection and keyboard focus have separate assignments.
The CM6 scroller scopes the editor fill over both `.cm-content` and its sibling
`.cm-selectionLayer`; native `::selection` and drawn selection inherit it.
Which layer a mode draws, table-widget exceptions and selected syntax foregrounds
remain native; this does not claim uniform selection rendering in every mode.
Native status/error/warning/success text and error/warning/success/info callouts
use only the matching status roles; host glyphs remain. Monochrome `--code-*`
variables cover both editor and Reading View code highlighting. The host shares
values/tags/regex categories: distinct constant/type/attribute categories are
unsupported rather than falsely mapped. Opt-in hued syntax remains out of scope.

All three documented theme family variables carry the full canonical mono
fallback stack. Obsidian's explicit user font overrides take precedence. No font
binary is bundled, and font sizes, relative headings, line heights and zoom stay
native. Compact prompt rows use a minimum height, not a clipping height; the
full-width native search input grows with text and uses a comfortable minimum.
Only its start padding is compact; native end space for the clear button stays.
Selected prompt notes, flair, faint text and actions use on-selection text.
Tree rows and main/sidebar tabs reserve transparent indicator borders at rest.

## Compatibility and deviations

The public `minAppVersion` is **1.13.4**, the earliest public 1.13.x source audited
here, not a claim that earlier releases fail. Every emitted native variable has
a definition and a consumer in both
1.13.4 and 1.13.7 `app.css`; selector hooks and cascade facts are audited in
both sources. Definitions alone do not count as mapping coverage. Inert warning
tint, heading-formatting, modal-shadow and touch-radius-l keys are omitted.
Documentation is pinned to official developer-docs revision
`c56c7e770ba25dd0ea392aacf4588f9425970d36`.

- Native focus geometry remains: buttons use a three-pixel solid shadow ring,
  fields/selects/radio/checkbox/slider/toggle use their host rings and timing.
  Their color uses the focus role; filled primary/checked controls recolor the
  same indicator to the container color, destructive fills to on-danger text.
  The prompt suppresses its native ring, so it alone receives the canonical
  inset dashed replacement on `:focus-visible`. No second ring is added.
  Native fields also focus on pointer input; that behavior is inherited rather
  than globally rewritten. Container/invalid offsets are unsupported/inherited.
- Geometry variables are square; host-only tab join curves, platform widgets,
  plugin-specific geometry and mobile layout can still diverge. Native target
  sizes remain except bounded compact prompt rows. User/system dialogs remain
  native. No universal geometry or accessibility conformance is claimed.
- Plain destructive buttons keep danger text/borders at rest and use the
  canonical destructive hover pair on hover and mobile tap, with the same native
  focus shadow recolored. Warning confirmations keep native desktop error fills
  and mobile neutral fills. Disabled/aria-disabled overrides win over every
  variant, including the mobile warning button's direct foreground.
- Native action variables conflate some pressed/hover states. Unmapped action,
  inactive-navigation, diagnostic stripe/underline and editor search/current-line
  roles have precise capability reasons; equal hex values do not add coverage.
- Shadows and raised blur are disabled through native variables, retaining the
  native focus shadows and toggle outline. Native animation behavior is retained;
  complete reduced-motion or forced-colors behavior still needs a real import.
  Forced-colors focus uses `Highlight`; host selection handling is inherited.
- User-supplied CSS snippets and font overrides can alter the result. Third-party
  plugins may inherit semantic variables but receive no plugin-specific selectors.
  Native non-status callouts and data colors are not reassigned as status hues.
- UI text selection preserves the foreground. Rose `--text-normal` on the
  global `--text-selection` fill measures **3.96:1**, below the 4.5:1 text
  floor; muted/faint UI foregrounds are lower still. Native Search result
  `:hover` and `.mobile-tap` also use this fill with rose text, and secondary
  replacement actions keep their native foregrounds. This host limitation is
  explicit, not a contrast waiver or a conformance claim. The canonical
  near-white selection pair passes; Reading View prose retains it.
- Known canonical syntax-selection contrast limits remain as documented in
  `spec/accessibility.md`. Automated mapping/contrast checks are structural,
  not Windows, keyboard or screen-reader evidence.

No RGB/HSL compatibility helpers, `!important`, `:has()`, network calls,
remote assets, telemetry, JavaScript or foreign-theme dependencies are emitted.
The semantic variables take priority over Obsidian's generic Accent setting for
these mapped roles; this does not change that setting. Builds never fetch
Obsidian or its sources. Vendor CSS is neither committed nor included in artifacts.

Sources: [official theme tutorial](https://github.com/obsidianmd/obsidian-developer-docs/blob/c56c7e770ba25dd0ea392aacf4588f9425970d36/en/Themes/App%20themes/Build%20a%20theme.md),
[theme guidelines](https://github.com/obsidianmd/obsidian-developer-docs/blob/c56c7e770ba25dd0ea392aacf4588f9425970d36/en/Themes/App%20themes/Theme%20guidelines.md),
[colors](https://github.com/obsidianmd/obsidian-developer-docs/blob/c56c7e770ba25dd0ea392aacf4588f9425970d36/en/Reference/CSS%20variables/Foundations/Colors.md),
[typography](https://github.com/obsidianmd/obsidian-developer-docs/blob/c56c7e770ba25dd0ea392aacf4588f9425970d36/en/Reference/CSS%20variables/Foundations/Typography.md),
[1.13.4 application source](https://github.com/obsidianmd/obsidian-releases/releases/tag/v1.13.4),
[1.13.7 application source](https://github.com/obsidianmd/obsidian-releases/releases/tag/v1.13.7).

## Selector ledger

Keys containing ` | ` in `mapping.json` name an exact selector/property pair.
Every other mapped key is a native variable on `.theme-dark`; that root and its
variable-only resets are the documented theme extension point. The following
bounded gaps have no adequate global variable. These selectors are source-audited,
not validated in a running app; regression contracts pin their scope.

| Selector | Why a variable alone is insufficient |
| --- | --- |
| `.theme-dark .markdown-preview-view` | Reading View root uses --text-normal, also used by UI; set only note content color. |
| `.theme-dark .markdown-source-view.mod-cm6 .cm-content` | CM6 content root separates prose from interface widgets. |
| `.theme-dark .markdown-source-view.mod-cm6 .cm-scroller` | CM6 scroller contains both content and the sibling drawn-selection layer; scope editor selection above both. |
| `.theme-dark .popover` | File preview popovers use the canvas variable locally; raised content requires a scoped value. |
| `.theme-dark .tooltip` | Native tooltip hardcodes white text and has no border variables. |
| `.theme-dark .tooltip.mod-error` | Native error tooltip fills with --background-modifier-error and needs its own on-fill text. |
| `.theme-dark .prompt input.prompt-input` | Native prompt field needs a fill and border; compact start padding preserves the native clear-button end reservation. |
| `.theme-dark .prompt input.prompt-input:focus-visible` | Native prompt suppresses input focus shadows; add exactly one inset dashed ring. |
| `.theme-dark .prompt .suggestion-item` | Native suggestions have fixed padding but no density or selection indicator variable. |
| `.theme-dark .prompt .suggestion-item.is-selected` | Separate selection and its indicator; local text variables keep notes, flair, faint text and actions readable on the selected fill. |
| `.theme-dark .menu` | Menus consume general hover fill; local strong hover keeps other surfaces restrained. |
| `.theme-dark .tree-item-self` | Reserve the selected tree indicator in every state so labels do not move. |
| `.theme-dark .tree-item-self.is-active` | Native navigation active fill has no selected-indicator variable. |
| `.theme-dark .tree-item-self.is-selected` | Native navigation selected fill has no selected-indicator variable. |
| `.theme-dark .workspace-tab-header-container .workspace-tab-header` | Reserve the tab indicator in every state so main and sidebar tab labels do not move. |
| `.theme-dark .workspace-tab-header-container .workspace-tab-header.is-active` | Sidebar tabs use hover fill and main tabs lack an indicator; one named-state override covers both. |
| `.theme-dark button:not(.clickable-icon)` | Native standard buttons use shadow as their boundary; supply a real outline edge after removing decorative shadows. |
| `.theme-dark button.mod-cta` | Recolor the existing native button focus shadow on primary fills; do not add another indicator. |
| `.theme-dark .checkbox-container.is-enabled` | Recolor the existing toggle outline on primary fill. |
| `.theme-dark input[type="checkbox"]:checked` | Recolor the native checkbox focus shadow when checked. |
| `.theme-dark input[type="radio"]:checked` | Recolor the native radio focus shadow when checked. |
| `.theme-dark button.mod-destructive` | Restore plain destructive text and border after the standard-button rule; confirmation variants override the text below. |
| `.theme-dark button.mod-destructive:hover` | Destructive hover uses its canonical fill and on-fill text; recolor the single native focus shadow on that fill. Applied only under `(hover: hover)`. |
| `.theme-dark button.mod-destructive.mobile-tap` | Native mobile-tap otherwise borrows the secondary hover fill with unsafe danger text; retain destructive meaning with its hover pair. |
| `.theme-dark button.mod-warning` | Native warning buttons keep desktop error fills and the mobile neutral fill; recolor desktop text and the existing focus shadow. |
| `.theme-dark button.mod-destructive.mod-cta` | Native destructive confirmation fill requires on-danger text and native focus shadow color. |
| `.theme-dark select` | Native select uses decorative input shadow as its edge; replace with a real control border. |
| `.theme-dark .dropdown` | Native dropdown uses input shadow as its edge; replace with a real control border. |
| `.theme-dark .combobox-button` | Native combobox button uses input shadow as its edge; replace with a real control border. |
| `.theme-dark button:not(.clickable-icon)[disabled]` | Native disabled button uses opacity; explicit disabled roles retain contrast accounting. |
| `.theme-dark button:not(.clickable-icon)[aria-disabled="true"]` | Native disabled button uses opacity; explicit disabled roles retain contrast accounting. |
| `.theme-dark .prompt input.prompt-input:hover` | Native prompt hover forces transparency and its bottom border; retain field fill and visible boundary. Applied only under `(hover: hover)`. |
| `.theme-dark .workspace-tab-header-container .workspace-tab-header.is-active:hover` | Native sidebar active hover borrows hover fill; selection takes precedence. Applied only under `(hover: hover)`. |
| `.theme-dark:not(.is-focused) .workspace-tab-header-container .workspace-tab-header.is-active` | Native tabs have inactive text but no inactive fill or indicator variables. |
| `.theme-dark .prompt .suggestion-action` | Native actions use the primary fill as text; use the text accent, whose selected-row scope supplies readable on-selection text. |

The forced-colors block repeats `.theme-dark`, the same primary/destructive/
checked-control selectors and the prompt `:focus-visible` selector above solely
to use the system `Highlight` focus color. It introduces no extra host hook.

## Verification before claiming a real import

Use a disposable vault on the intended host and record the application version,
OS, font, zoom and exact two artifact digests. Inspect settings, File Explorer,
Search, Backlinks, CM6/Live Preview, Reading View, split panes and tabs, both
command prompts, menus, popovers, tooltips, dialogs, controls, status messages,
focus, selection and caret. Record actual observations and NOT_RUN checks in
the repository real-import protocol before changing `testedVersions` or status.
