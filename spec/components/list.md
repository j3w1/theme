---
id: list
name: List
family: display
maturity: stable
priority: R1
since: 0.1.0
order: 20
summary: A selectable list of rows (an APG listbox) in single or multiple selection; the selected row is the selection fill with a check glyph and an optional metadata column.
native: false
aria:
  pattern: APG listbox with roving tabindex; options carry aria-selected, the list aria-multiselectable when several may be chosen
  apg: https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
  role: listbox
variants:
  - id: single
    name: Single
    description: One option selected at a time.
  - id: multi
    name: Multi
    description: aria-multiselectable; several options selected, each with the check glyph.
  - id: with-meta
    name: With metadata
    description: A trailing metadata column in text.muted that switches to the on-fill text when selected.
sizes: [compact, comfortable]
states:
  - default
  - hover
  - focus-visible
  - selected
  - selected+focus-visible
  - selected+container-inactive
  - disabled
tokens:
  root.bg: color.surface.default
  root.border: color.border.control
  row.text: color.text.default
  row.bg-hover: color.interaction.hover.bg
  row.divider: color.border.divider
  row.ring: color.interaction.focus.ring
  row.text-disabled: color.text.disabled
  selected.bg: color.interaction.selection.bg
  selected.text: color.interaction.selection.text
  selected.ring: color.interaction.focus.ring-container
  selected.inactive-bg: color.interaction.selection.inactive-bg
  selected.inactive-text: color.interaction.selection.inactive-text
  check.glyph: color.interaction.selection.text
  meta.text: color.text.muted
stateTokens:
  default: { fg: color.text.default, bg: color.surface.default, border: color.border.control }
  hover: { fg: color.text.default, bg: color.interaction.hover.bg }
  focus-visible: { fg: color.text.default, bg: color.surface.default, outline: color.interaction.focus.ring }
  selected: { fg: color.interaction.selection.text, bg: color.interaction.selection.bg }
  selected+focus-visible: { fg: color.interaction.selection.text, bg: color.interaction.selection.bg, outline: color.interaction.focus.ring-container }
  selected+container-inactive: { fg: color.interaction.selection.inactive-text, bg: color.interaction.selection.inactive-bg }
contrast:
  - { fg: color.text.muted, bg: color.surface.default, label: "metadata column on the list surface" }
  - { fg: color.text.muted, bg: color.interaction.hover.bg, state: hover, label: "metadata column on the hover fill" }
  - { fg: color.text.disabled, bg: color.surface.default, min: 3, kind: ui, state: disabled, label: "disabled option text (exempt; house floor 3:1)" }
  - { fg: color.border.divider, bg: color.surface.default, min: 1, kind: ui, label: "row divider (decorative)", waiver: "rows are separated by their height and the fill; the divider is a reading aid" }
anatomy:
  - part: root
    description: The ul with role listbox and aria-label; 1px border.control on surface.default.
  - part: option
    description: A row-height li with role option, aria-selected and a roving tabindex; a 1px border.divider between rows.
  - part: check
    description: The ✓ glyph gutter at the inline start, visible when the option is selected.
  - part: label
    description: The option text in text.default; on-fill text when selected.
  - part: meta
    description: An optional trailing column in text.muted, tabular numbers, that takes the on-fill text when selected.
keyboard:
  - key: Tab
    action: Enters the list at the selected option, or the first option when nothing is selected; a second Tab leaves the list.
  - key: Down / Up
    action: Moves focus to the next or previous option; in single selection the selection follows focus.
  - key: Home / End
    action: Moves focus to the first or last option.
  - key: Space
    action: Toggles the focused option in a multi-select list.
  - key: Shift+Down / Shift+Up
    action: Extends the selection by one in a multi-select list.
  - key: Ctrl+A
    action: Selects every option in a multi-select list.
  - key: A-Z
    action: Moves focus to the next option starting with the typed character.
responsive: The list fills its container with min-width 0; labels wrap onto a second line rather than truncate; the metadata column keeps its width and the label shrinks. The list scrolls vertically inside a fixed-height container, never the page. RTL mirrors the check gutter and the metadata column.
portability:
  web: A ul with role listbox, aria-label and, when several may be chosen, aria-multiselectable; li with role option, aria-selected and a roving tabindex; the fill is a background, the ring an outline, the check a glyph in a fixed gutter.
  nativeFallbacks:
    - GTK4 ListBox with selection-mode single or multiple; the selected row through the :selected style class.
    - Qt QListView stylesheet; ::item:selected draws the fill, ::item:selected:!active the inactive fill.
    - "Terminal UI: the selected row inverted; a leading check column; the inactive pane dims the fill."
fixtures: [FX-LONG, FX-320, FX-ZOOM-200, FX-I18N, FX-RTL, FX-RM, FX-HC, FX-DENSITY, FX-STATE-MATRIX]
related: [card, select, combobox, tree, table]
specimens: [settings-panel, filterable-table]
keywords: [list, listbox, option, selection, multi-select, rows, check]
sources: [j3w1-web]
compact: false
---

## Purpose

Lets the user choose one or several rows from a short, visible set. A list
is a listbox: it holds a selection, it does not navigate. Rows that lead
somewhere are sidebar-nav; rows with columns are a table; a long set that
needs filtering is a combobox.

## Anatomy

A `ul` with `role="listbox"` framed by 1px {color.border.control} on
{color.surface.default}. Each option is one row: a check gutter, the label in
{color.text.default}, and in the metadata variant a trailing column in
{color.text.muted}. Rows are separated by 1px {color.border.divider}. A
selected row is filled with {color.interaction.selection.bg}; every part of
it, including the metadata and the ✓ glyph, takes
{color.interaction.selection.text}.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | text {color.text.default}; no fill; the check gutter empty | — |
| hover | background → {color.interaction.hover.bg} | cursor: pointer |
| focus-visible | ring 1px dashed {color.interaction.focus.ring} at −2px on the option | the ring |
| selected | fill {color.interaction.selection.bg}; text and glyph {color.interaction.selection.text} | `aria-selected="true"`; the ✓ glyph |
| selected+focus-visible | the fill and the ring in {color.interaction.focus.ring-container} | both visible at once |
| selected+container-inactive | fill {color.interaction.selection.inactive-bg} with {color.interaction.selection.inactive-text}; no ring | lightness drop between the two fills; the glyph stays |
| disabled | text {color.text.disabled}; no fill; no hover; still reachable by arrow keys | `aria-disabled="true"`; cursor: not-allowed |

Precedence: disabled > selected > hover; focus-visible is always drawn.

## Keyboard

Roving tabindex: the selected option (or the first) has `tabindex="0"`, the
rest `-1`, so the list costs one tab stop. Up and Down move; in single
selection the selection follows focus, in multiple selection Space toggles
and Shift with the arrows extends. Home and End jump; Ctrl+A selects all in a
multi-select list; typing jumps to the next matching label. Disabled options
are reachable and announced, never skipped silently.

## Accessibility

`aria-label` or `aria-labelledby` on the listbox; `aria-multiselectable`
when several may be chosen; `aria-selected` on every option, including
`"false"`. The ✓ glyph is `aria-hidden`; `aria-selected` is the state.
Metadata is inside the option so it is read with the label. Contrast: text
8.43:1, metadata 5.66:1, selected text 12.47:1 on the fill, inactive selection
7.02:1, ring 4.57:1 on the surface and 7.48:1 on the fill, frame 4.33:1. Rows
are at least 24 CSS pixels tall with the check gutter as the leading target
area.

## Portability

Rows with a background, a glyph gutter and an outline; nothing else. Hosts
with a native list view take the fill, the inactive fill and the divider
colour and keep their keyboard model. The inactive fill applies when the
list's window or pane loses focus, which a web page detects through
`:focus-within` on the pane.

## Non-examples

A selected row marked by a border or a check alone without the fill. Rounded
row highlights. Muted metadata left on the selection fill. A list where every
row is a tab stop. A list that navigates on selection. Disabled rows removed
from the arrow-key order. Hover that changes the text colour. A list without
a frame on the canvas.
