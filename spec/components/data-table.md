---
id: data-table
name: Data table
family: display
maturity: stable
priority: R1
since: 0.1.0
order: 60
summary: "A native table with controls: a selection column with a mixed select-all, sortable headers, row focus with the ring on the fill, and static resize handles."
native: true
aria:
  pattern: native table with aria-selected rows, a select-all checkbox in the mixed state, aria-sort headers and aria-busy while loading
  apg: https://www.w3.org/WAI/ARIA/apg/patterns/grid/
variants:
  - id: default
    name: Default
    description: Sortable headers and focusable rows.
  - id: selectable
    name: Selectable
    description: A leading checkbox column; the header select-all shown in the mixed state.
  - id: resizable
    name: Resizable
    description: A static resize handle at the end of every header cell.
sizes: [compact, comfortable]
states:
  - default
  - hover
  - focus-visible
  - selected
  - selected+focus-visible
  - sorted
  - mixed
  - empty
  - loading
tokens:
  root.bg: color.surface.default
  header.text: color.text.bright
  header.rule: color.border.strong
  sort.glyph: color.text.bright
  row.text: color.text.default
  row.divider: color.border.divider
  row.bg-hover: color.interaction.hover.bg
  row.ring: color.interaction.focus.ring
  selected.bg: color.interaction.selection.bg
  selected.text: color.interaction.selection.text
  selected.ring: color.interaction.focus.ring-container
  checkbox.bg: color.surface.input
  checkbox.border: color.border.control
  checkbox.checked-bg: color.action.primary.bg
  checkbox.glyph: color.action.primary.text
  resize.handle: color.border.default
  resize.handle-hover: color.border.active
  empty.text: color.text.muted
  loading.glyph: color.text.muted
stateTokens:
  default: { fg: color.text.default, bg: color.surface.default }
  hover: { fg: color.text.default, bg: color.interaction.hover.bg }
  focus-visible: { fg: color.text.default, bg: color.surface.default, outline: color.interaction.focus.ring }
  selected: { fg: color.interaction.selection.text, bg: color.interaction.selection.bg }
  selected+focus-visible: { fg: color.interaction.selection.text, bg: color.interaction.selection.bg, outline: color.interaction.focus.ring-container }
  sorted: { fg: color.text.bright, bg: color.surface.default }
  mixed: { fg: color.action.primary.text, bg: color.action.primary.bg }
  empty: { fg: color.text.muted, bg: color.surface.default }
  loading: { fg: color.text.muted, bg: color.surface.default }
contrast:
  - { fg: color.text.bright, bg: color.surface.default, label: "header text" }
  - { fg: color.border.control, bg: color.surface.input, min: 3, kind: ui, label: "checkbox boundary" }
  - { fg: color.action.primary.bg, bg: color.surface.default, min: 1, kind: ui, state: mixed, label: "checked fill against the row (the glyph and the boundary carry the state)", waiver: "the mixed and checked states are the – and ✓ glyphs on the fill plus aria-checked; the fill's own edge is not the boundary" }
  - { fg: color.border.strong, bg: color.surface.default, min: 1, kind: ui, label: "header rule (decorative)", waiver: "the rule separates header from body; the header cells and their bright text are the structure" }
  - { fg: color.border.divider, bg: color.surface.default, min: 1, kind: ui, label: "row divider (decorative)", waiver: "rows are separated by their height; the divider is a reading aid" }
  - { fg: color.border.default, bg: color.surface.default, min: 1, kind: ui, label: "resize handle at rest (decorative; keyboard resizing is a header action)", waiver: "the handle is a pointer affordance; it turns border.active on hover and the column width is also settable from the header's menu" }
anatomy:
  - part: root
    description: The table; collapsed, full width, surface.default; rows carry tabindex so the keyboard can reach them.
  - part: header
    description: th cells in text.bright above a 1px border.strong rule; sortable ones wrap a button; aria-sort on the th.
  - part: select-all
    description: A checkbox-role button in the header of the selection column; aria-checked true, false or mixed with the ✓ or – glyph on the primary fill.
  - part: checkbox
    description: A native checkbox in the first cell of every row, labelled by the row; checking it selects the row.
  - part: row
    description: A tbody tr with aria-selected and tabindex; row height; divider above.
  - part: resize
    description: An aria-hidden 1px handle at the inline end of each header cell; border.default at rest, border.active on hover; a pointer affordance only.
  - part: empty / loading
    description: Full-width single-cell rows, hidden unless the body is empty or the table is aria-busy.
keyboard:
  - key: Tab / Shift+Tab
    action: Moves through the select-all, the sort buttons, then the rows (one row is the tab stop; roving tabindex) and any control inside the focused row.
  - key: Down / Up
    action: Moves row focus; in a single-select table the selection follows focus.
  - key: Space
    action: Toggles the focused row's selection (the same as its checkbox).
  - key: Shift+Down / Shift+Up
    action: Extends the selection by one row.
  - key: Ctrl+A
    action: Selects every row; the select-all reflects it.
  - key: Enter / Space
    action: On a sort button, cycles the sort; on the select-all, toggles between all and none.
  - key: Left / Right
    action: Reserved for cell navigation in hosts that promote the table to a grid; not used here.
responsive: Below 600px the table scrolls horizontally inside its container with the selection column and the first data column sticky; the page never scrolls. Resize handles are hidden on touch pointers, where column widths come from the header menu. RTL mirrors the selection column and the handles to the inline start and end respectively.
portability:
  web: A native table; rows carry aria-selected and a roving tabindex; the selection column holds native checkboxes labelled by the row and a button with role checkbox and aria-checked mixed in the header; headers with aria-sort wrap a button; aria-busy on the table while loading; the APG grid pattern is cited for the keyboard model only, the markup stays a table.
  nativeFallbacks:
    - GTK4 ColumnView with a selection model; the select-all through a header CheckButton.
    - Qt QTableView with a selection model; a header checkbox drawn by a header delegate.
    - "Terminal UI: a check column of [x] and [ ] cells; the focused row in the ring colour; the selected rows inverted."
fixtures: [FX-LONG, FX-320, FX-ZOOM-200, FX-I18N, FX-RTL, FX-RM, FX-HC, FX-DENSITY, FX-OVERFLOW, FX-TOUCH, FX-STATE-MATRIX]
related: [table, checkbox, pagination, toolbar, filterable-table]
specimens: [filterable-table, admin-form]
keywords: [data table, grid, selection, select all, mixed, sort, resize, rows, checkbox]
sources: [j3w1-web]
compact: false
---

## Purpose

A table the user works in: selects rows, sorts, resizes columns. The
plain table is for reading; this component adds the controls and the
keyboard model. It stays a native table so its cells keep their header
associations; hosts that need cell-level navigation promote it to a grid
and record the change.

## Anatomy

The table component's structure with the same rule, dividers and fills,
plus: a selection column whose header holds a select-all with
`aria-checked` true, false or mixed, drawn on {color.action.primary.bg} with
the ✓ or – glyph in {color.action.primary.text}; native checkboxes in each
row on {color.surface.input} with a 1px {color.border.control} boundary;
rows that can take focus; and in the resizable variant a 1px handle in
{color.border.default} at the inline end of each header that turns
{color.border.active} under the pointer.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | rows on {color.surface.default}; header rule 1px {color.border.strong} | — |
| hover | row background → {color.interaction.hover.bg}; a resize handle → {color.border.active} | cursor: default on rows, col-resize on handles |
| focus-visible | ring 1px dashed {color.interaction.focus.ring} at −2px around the focused row or control | the ring |
| selected | row fill {color.interaction.selection.bg}; every cell {color.interaction.selection.text}; the row checkbox checked | `aria-selected="true"`; the checked box |
| selected+focus-visible | the fill and the ring in {color.interaction.focus.ring-container} | both visible at once |
| sorted | ▲ or ▼ in {color.text.bright} on the sorted header | `aria-sort`; the glyph |
| mixed | the select-all on {color.action.primary.bg} with the – glyph | `aria-checked="mixed"`; the glyph |
| empty | one full-width cell in {color.text.muted}: "No rows match."; the header and controls stay | the message text |
| loading | one full-width cell with the static `⋯` glyph; the header stays | `aria-busy="true"`; the glyph; no animation |

Precedence: loading > empty; selected > hover; focus-visible is always
drawn. Selection is a fill; focus is a ring; they never borrow each other's
form.

## Keyboard

Header controls first: the select-all, then each sort button. Rows use a
roving tabindex so the body costs one tab stop; Up and Down move, Space
toggles, Shift extends, Ctrl+A selects all. Controls inside the focused row
are reached with Tab and left with Shift+Tab. Column widths are set from a
header menu or by dragging the handle; the handle itself is never a tab
stop.

## Accessibility

Every row checkbox is labelled by the row's first data cell
(`aria-labelledby`); the select-all is named "Select all rows" and exposes
`aria-checked="mixed"` when only some are selected. `aria-selected` on the
row mirrors its checkbox. Sorted headers carry `aria-sort`; the table
carries `aria-busy` while loading; the count of selected rows is announced
through a live region owned by the surrounding toolbar. Contrast: text
8.43:1, header 10.10:1, selected text 12.47:1 on the fill, ring 4.57:1 on the
surface and 7.48:1 on the fill, checkbox boundary 4.33:1, check glyph 9.28:1
on the primary fill. Checkboxes and handles are at least 24 CSS pixels tall
in `compact` density.

## Portability

The table component's drawing plus a checkbox column and a header
checkbox; the handle is a 1px rule. Toolkits with native table views map
row selection to their selection model and the mixed state to their
tristate checkbox. Hosts without row focus fall back to the checkbox as the
only row control and record it.

## Non-examples

A grid role on a table that is not navigated cell by cell. Zebra stripes.
A select-all that is a native checkbox with a script-only indeterminate
state and no `aria-checked`. Rows selected by clicking anywhere with no
checkbox alternative. A selected row shown by a border alone. A resize
handle that is a tab stop. An animated loading skeleton. Rounded checkboxes.
Text truncated with no full-value affordance.
