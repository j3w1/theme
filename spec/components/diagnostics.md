---
id: diagnostics
name: Diagnostics
family: developer
maturity: stable
priority: R1
since: 0.1.0
order: 20
summary: Inline problem markers in code (underline patterns, an error line and an overview stripe) and the problems panel that lists them as a listbox, each severity carrying its glyph.
native: false
aria:
  pattern: "inline: decorated spans inside a read-only textbox presentation; panel: APG listbox with aria-activedescendant"
  apg: https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
  role: listbox
variants:
  - id: inline
    name: Inline markers
    description: Error, warning, info, hint, unused and deprecated ranges in a code sample with the overview stripe.
  - id: panel
    name: Problems panel
    description: The listbox of problems with glyphs, counts, locations and rule codes.
sizes: [compact, comfortable]
states:
  - default
  - hover
  - focus-visible
  - selected
  - selected+focus-visible
  - error
  - empty
tokens:
  root.bg: color.surface.default
  root.border: color.border.control
  code.bg: color.code.bg
  code.text: color.text.default
  code.line-number: color.code.line-number
  code.gutter-rule: color.code.gutter-rule
  code.selection-bg: color.code.selection-bg
  error.underline: color.diagnostic.error.underline
  error.text: color.diagnostic.error.text
  error.stripe: color.diagnostic.error.stripe
  error.line-bg: color.diagnostic.error.bg
  warning.underline: color.diagnostic.warning.underline
  warning.text: color.diagnostic.warning.text
  warning.stripe: color.diagnostic.warning.stripe
  info.underline: color.diagnostic.info.underline
  info.text: color.diagnostic.info.text
  hint.underline: color.diagnostic.hint.underline
  hint.text: color.text.subtle
  unused.text: color.diagnostic.unused.text
  deprecated.text: color.code.syntax.deprecated
  row.text: color.text.default
  row.location: color.text.muted
  row.divider: color.border.divider
  row.bg-hover: color.interaction.hover.bg
  row.ring: color.interaction.focus.ring
  row.bg-selected: color.interaction.selection.bg
  row.text-selected: color.interaction.selection.text
  row.ring-selected: color.interaction.focus.ring
  header.text: color.text.bright
  status.text: color.status.danger.text
  empty.text: color.text.muted
  empty.glyph: color.status.success.text
stateTokens:
  default: { fg: color.text.default, bg: color.surface.default, border: color.border.control }
  hover: { fg: color.text.default, bg: color.interaction.hover.bg }
  focus-visible: { fg: color.text.default, bg: color.surface.default, outline: color.interaction.focus.ring }
  selected: { fg: color.interaction.selection.text, bg: color.interaction.selection.bg }
  selected+focus-visible: { fg: color.interaction.selection.text, bg: color.interaction.selection.bg, outline: color.interaction.focus.ring }
  error: { fg: color.status.danger.text, bg: color.surface.default }
  empty: { fg: color.text.muted, bg: color.surface.default }
contrast:
  - { fg: color.text.default, bg: color.code.bg, label: "code text" }
  - { fg: color.text.default, bg: color.diagnostic.error.bg, label: "code text on the error line" }
  - { fg: color.diagnostic.error.text, bg: color.diagnostic.error.bg, label: "error glyph on the error line" }
  - { fg: color.diagnostic.error.underline, bg: color.code.bg, min: 3, kind: ui, label: "error underline" }
  - { fg: color.diagnostic.error.underline, bg: color.diagnostic.error.bg, min: 3, kind: ui, label: "error underline on the error line" }
  - { fg: color.diagnostic.warning.underline, bg: color.code.selection-bg, min: 3, kind: ui, state: selected, label: "warning underline inside the selected range" }
  - { fg: color.diagnostic.warning.underline, bg: color.code.bg, min: 3, kind: ui, label: "warning underline" }
  - { fg: color.diagnostic.info.underline, bg: color.code.bg, min: 3, kind: ui, label: "info underline" }
  - { fg: color.diagnostic.hint.underline, bg: color.code.bg, min: 3, kind: ui, label: "hint underline" }
  - { fg: color.diagnostic.unused.text, bg: color.code.bg, label: "unused text" }
  - { fg: color.code.syntax.deprecated, bg: color.code.bg, label: "deprecated text" }
  - { fg: color.diagnostic.error.stripe, bg: color.code.bg, min: 3, kind: ui, label: "error stripe mark" }
  - { fg: color.diagnostic.warning.stripe, bg: color.code.bg, min: 3, kind: ui, label: "warning stripe mark" }
  - { fg: color.diagnostic.info.text, bg: color.code.bg, min: 3, kind: ui, label: "info stripe mark" }
  - { fg: color.diagnostic.error.text, bg: color.surface.default, label: "error glyph and count in the panel" }
  - { fg: color.diagnostic.warning.text, bg: color.surface.default, label: "warning glyph and count in the panel" }
  - { fg: color.diagnostic.info.text, bg: color.surface.default, label: "info glyph and count in the panel" }
  - { fg: color.text.subtle, bg: color.surface.default, label: "hint glyph in the panel" }
  - { fg: color.text.muted, bg: color.surface.default, label: "location and rule code" }
  - { fg: color.text.default, bg: color.interaction.hover.bg, state: hover, label: "row text on hover" }
  - { fg: color.diagnostic.error.text, bg: color.interaction.hover.bg, state: hover, label: "error glyph on hover" }
  - { fg: color.status.success.text, bg: color.surface.default, state: empty, label: "the ✓ of the empty message" }
anatomy:
  - part: root
    description: The panel or the inline code box; 1px border.control on surface.default (panel) or code.bg (inline).
  - part: range
    description: A decorated span in the code; the underline pattern, not the colour, names the severity.
  - part: line
    description: A code row; the row holding an error takes error.bg across gutter and text.
  - part: stripe
    description: The overview column on the inline edge, one mark per problem row carrying the severity glyph in the stripe colour.
  - part: header
    description: The panel title in text.bright and the counts, each count prefixed by its glyph.
  - part: list
    description: The listbox; one Tab stop; aria-activedescendant names the active row.
  - part: row
    description: One option; glyph, message, location and rule code; hover, focus and selection are drawn on the row.
  - part: status
    description: A role=status line shown when the provider fails; ✕ in status.danger.text; the stale rows stay.
  - part: empty
    description: The message shown when there are no problems, ✓ in status.success.text with text.muted text.
keyboard:
  - key: Tab / Shift+Tab
    action: Moves focus to and from the list as one stop; the active row is restored.
  - key: Down / Up
    action: Moves the active row; selection follows focus in this single-select listbox.
  - key: Home / End
    action: First or last row.
  - key: Enter
    action: Opens the location in the editor and moves focus there.
  - key: Type-ahead
    action: Jumps to the next row whose message starts with the typed characters.
  - key: (host)
    action: Inline markers have no keyboard of their own; navigation between problems (F8-style) is the host's binding.
responsive: The panel fills its container; message text wraps, location and rule code stay on the row's end and never truncate the glyph; at 320px the columns stack under the message. The inline sample scrolls horizontally inside its box; the stripe stays on the inline-end edge. RTL mirrors the stripe and the location column while code stays left-to-right.
portability:
  web: "inline: spans with text-decoration inside the code-editor presentation; panel: <ul role=listbox> with <li role=option>, aria-activedescendant, aria-selected; every severity keeps its glyph in the accessible name."
  nativeFallbacks:
    - "GTK: GtkSourceView marks and underlines (PANGO_UNDERLINE_ERROR is wavy); the panel is a GtkListView with a single-selection model."
    - "Qt: QTextCharFormat underline styles (WaveUnderline, DotLine); the panel is a QListView."
    - "JetBrains: ERRORS_ATTRIBUTES, WARNING_ATTRIBUTES, INFO_ATTRIBUTES, NOT_USED_ELEMENT_ATTRIBUTES and DEPRECATED_ATTRIBUTES in the .icls; stripe marks through the error-stripe keys."
    - "Terminal UI: underline attributes (curly where supported, else plain underline) with the glyph in the gutter; the panel is a list with the selected row inverted."
fixtures: [FX-STATE-MATRIX, FX-320, FX-ZOOM-200, FX-RM, FX-HC, FX-LONG, FX-I18N]
related: [code-editor, diff-view, terminal]
specimens: [i3-window-frame]
keywords: [problems, error, warning, lint, underline, squiggle, listbox, stripe]
sources: [j3w1-web, legacy-i3]
compact: false
---

## Purpose

How problems appear on code and in the list that indexes them. Six kinds,
each told apart by pattern and glyph as well as colour. The panel is the
keyboard route to every marker.

## Anatomy

Root `.diagnostics` with `.diagnostics-inline` or `.diagnostics-panel`.
Inline: `.diagnostics-code` (the `<pre>`), `-line`, `-ln`, `-text`, `-mark`
(the stripe cell) and the ranges `.diagnostics-error`, `-warning`, `-info`,
`-hint`, `-unused`, `-deprecated`; `.diagnostics-line-error` is the filled
row; `.diagnostics-target` is the range of the selected row. Panel:
`-header`, `-title`, `-count`, `-status`, `-list`, `-row`, `-glyph` (with
`-glyph-error` and so on), `-message`, `-loc`, `-rule`, `-empty`.
Patterns: error and warning wavy, info and hint dotted, unused dotted in
{color.diagnostic.unused.text}, deprecated line-through in
{color.code.syntax.deprecated}. Glyphs: `✕` error in
{color.diagnostic.error.text}, `!` warning in {color.diagnostic.warning.text},
`i` info in {color.diagnostic.info.text}, `·` hint in {color.text.subtle}.
The stripe mark repeats the glyph in the stripe colour
({color.diagnostic.error.stripe}, {color.diagnostic.warning.stripe}).

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | ranges decorated on {color.code.bg}; the error row filled {color.diagnostic.error.bg}; panel rows on {color.surface.default}, 1px {color.border.divider} between | underline pattern; glyph |
| hover | panel row → {color.interaction.hover.bg}; inline ranges unchanged (the hover tooltip is a host surface) | cursor: default on rows |
| focus-visible | active row: 1px dashed {color.interaction.focus.ring} at −2px; inline box: 2px {color.interaction.focus.ring-container} at −3px | the ring |
| selected | row filled {color.interaction.selection.bg}, text and glyph {color.interaction.selection.text}; the matching inline range filled {color.code.selection-bg} under its underline | `aria-selected`; the glyph stays; the fill spans the row |
| selected+focus-visible | the selection fill and 1px dashed {color.interaction.focus.ring} at −2px | both at once |
| error | provider failed: a `role=status` line with `✕` in {color.status.danger.text} above the stale rows; the stripe shows the same `✕` at its top | glyph; live announcement |
| empty | rows, stripe marks and inline decorations removed; `✓ No problems` in {color.text.muted}, glyph in {color.status.success.text} | glyph; the absence of decoration |

Precedence: selected > hover; focus-visible is drawn on top. A selected row
recolours its glyph to the on-selection text, so the shape, not the hue,
carries the severity.

## Keyboard

As in the key table; next and previous problem and the hover card belong to
the host.

## Accessibility

Never colour-only: the underline pattern in code, the glyph in the panel, and
the glyph is part of the option's accessible name ("Error: frmae is not
defined, title.js line 6"). The error row fill adds to the wavy underline,
never replaces it. Text, including unused code, meets 4.5:1; every underline
meets 3:1 on its actual background, the selected range included. The status
line is announced once. In forced-colours mode the patterns persist because
they are `text-decoration`, not backgrounds.

## Portability

Where wavy is unavailable the port uses a plain underline plus the glyph and
records the deviation. Hosts with their own overview ruler map the stripe
colours; hosts without one omit the stripe and keep the glyphs.

## Non-examples

Red-only errors without `✕` or the wavy pattern. Wavy for every severity.
Purple or cyan for info and hint. A row hover that changes only text colour.
A selected row whose glyph keeps its severity colour on the fill. A rounded
highlight or left accent bar instead of the row fill. Removing the error line
fill to "calm" the editor.
