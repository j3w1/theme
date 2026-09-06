---
id: table
name: Table
family: display
maturity: stable
priority: R1
since: 0.1.0
order: 50
summary: A native data table with a header rule, row dividers, hover and selection fills, sortable headers with a glyph, and static empty and loading rows.
native: true
aria:
  pattern: native table with caption, thead, th scope, aria-sort on sorted headers and aria-busy while loading
variants:
  - id: default
    name: Default
    description: A 1px border.strong header rule on the panel surface.
  - id: sticky-header
    name: Sticky header
    description: The header stays at the top of the scroll container with a 2px border.strong rule.
  - id: numeric
    name: Numeric
    description: Right-aligned tabular numbers in numeric columns.
  - id: with-caption
    name: With caption
    description: A visible caption above the table that names it.
sizes: [compact, comfortable]
states:
  - default
  - hover
  - selected
  - selected+focus-visible
  - selected+container-inactive
  - sorted
  - empty
  - loading
tokens:
  root.bg: color.surface.default
  header.text: color.text.bright
  header.bg: color.surface.default
  header.rule: color.border.strong
  header.bg-sticky: color.surface.raised
  sort.glyph: color.text.bright
  sort.ring: color.interaction.focus.ring
  row.text: color.text.default
  row.divider: color.border.divider
  row.bg-hover: color.interaction.hover.bg
  selected.bg: color.interaction.selection.bg
  selected.text: color.interaction.selection.text
  selected.ring: color.interaction.focus.ring-container
  selected.inactive-bg: color.interaction.selection.inactive-bg
  selected.inactive-text: color.interaction.selection.inactive-text
  caption.text: color.text.muted
  empty.text: color.text.muted
  loading.glyph: color.text.muted
stateTokens:
  default: { fg: color.text.default, bg: color.surface.default }
  hover: { fg: color.text.default, bg: color.interaction.hover.bg }
  selected: { fg: color.interaction.selection.text, bg: color.interaction.selection.bg }
  selected+focus-visible: { fg: color.interaction.selection.text, bg: color.interaction.selection.bg, outline: color.interaction.focus.ring-container }
  selected+container-inactive: { fg: color.interaction.selection.inactive-text, bg: color.interaction.selection.inactive-bg }
  sorted: { fg: color.text.bright, bg: color.surface.default }
  empty: { fg: color.text.muted, bg: color.surface.default }
  loading: { fg: color.text.muted, bg: color.surface.default }
contrast:
  - { fg: color.text.bright, bg: color.surface.default, label: "header text" }
  - { fg: color.text.bright, bg: color.surface.raised, label: "sticky header text on the raised surface" }
  - { fg: color.text.muted, bg: color.surface.default, label: "caption" }
  - { fg: color.interaction.focus.ring, bg: color.surface.default, min: 3, kind: ui, label: "ring on a sort button" }
  - { fg: color.border.strong, bg: color.surface.default, min: 1, kind: ui, label: "header rule (decorative; thead carries the structure)", waiver: "the rule separates header from body; the header cells and their bright text are the structure" }
  - { fg: color.border.divider, bg: color.surface.default, min: 1, kind: ui, label: "row divider (decorative)", waiver: "rows are separated by their height; the divider is a reading aid" }
anatomy:
  - part: root
    description: The table; border-collapse, full width, surface.default, no outer border.
  - part: caption
    description: An optional visible caption in text.muted above the table, aligned to the start.
  - part: header
    description: th cells with scope, text.bright, a 1px border.strong bottom rule (2px when sticky).
  - part: sort
    description: A button inside a sortable header carrying the label and the ▲ or ▼ glyph; aria-sort lives on the th.
  - part: row
    description: A tbody tr of row height with a 1px border.divider between rows.
  - part: cell
    description: td in text.default; numeric cells end-aligned with tabular numbers.
  - part: empty
    description: A single full-width cell in text.muted saying that there are no rows; hidden unless empty.
  - part: loading
    description: A single full-width cell with the static ⋯ glyph; hidden unless loading; aria-busy on the table.
keyboard:
  - key: Tab / Shift+Tab
    action: Moves between the sort buttons and any controls inside cells; rows themselves are not tab stops in a plain table.
  - key: Enter / Space
    action: Toggles the sort of the focused header between ascending and descending.
responsive: The table sits in a container with overflow-x auto below 600px, with the first column sticky; the page never scrolls horizontally. Columns never truncate text by default; hosts that must truncate provide the full value on focus or hover. RTL mirrors the numeric alignment (end) and the sticky column.
portability:
  web: A native table with caption, thead and th scope="col"; sortable headers wrap their label in a button and set aria-sort on the th; empty and loading rows are ordinary rows with one cell spanning every column; aria-busy="true" on the table while loading; row selection through aria-selected on tr is the data-table's contract.
  nativeFallbacks:
    - GTK4 ColumnView; the header rule and row dividers through css-name selectors.
    - Qt QTableView stylesheet; QHeaderView::section draws the rule; ::item:selected the fill.
    - "Terminal UI: a header line underlined with a heavy rule; the selected row inverted; the empty message centred."
fixtures: [FX-LONG, FX-320, FX-ZOOM-200, FX-I18N, FX-RTL, FX-RM, FX-HC, FX-DENSITY, FX-OVERFLOW, FX-STATE-MATRIX]
related: [data-table, list, pagination, badge, filterable-table]
specimens: [filterable-table, settings-panel]
keywords: [table, rows, columns, header, sort, sticky, numeric, caption, empty, loading]
sources: [j3w1-web]
compact: true
---

## Purpose

Shows records as rows and attributes as columns so they can be compared
down a column. The table is for reading; a table with selection
checkboxes, resizable columns and a toolbar is the data-table. A single
column of rows is a list.

## Anatomy

A collapsed native table on {color.surface.default} with no outer border.
The header row is {color.text.bright} above a 1px {color.border.strong} rule
(2px when the header is sticky, on {color.surface.raised}); sortable headers
wrap their label in a button and show ▲ or ▼ when sorted. Body rows are the
row height, separated by 1px {color.border.divider}, text in
{color.text.default}; numeric cells are end-aligned with tabular numbers.
An optional caption in {color.text.muted} sits above. Two special rows,
hidden unless needed, span every column: the empty message and the loading
glyph.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | rows on {color.surface.default}; header rule 1px {color.border.strong} | — |
| hover | row background → {color.interaction.hover.bg} | cursor: default; only on hover-capable pointers |
| selected | row fill {color.interaction.selection.bg}; every cell {color.interaction.selection.text} | `aria-selected="true"` on the row |
| selected+focus-visible | the fill and a ring in {color.interaction.focus.ring-container} around the row | both visible at once |
| selected+container-inactive | row fill {color.interaction.selection.inactive-bg} with {color.interaction.selection.inactive-text}; no ring | lightness drop between the two fills |
| sorted | the sorted header shows ▲ (ascending) or ▼ (descending) in {color.text.bright} | `aria-sort`; the glyph |
| empty | the body is one full-width cell in {color.text.muted}: "No rows match." | the message text |
| loading | the body is one full-width cell with the static `⋯` glyph in {color.text.muted}; the header stays | `aria-busy="true"`; the glyph; no animation |

Precedence: loading > empty; selected > hover; focus-visible is always
drawn.

## Keyboard

A plain table has no row focus: Tab reaches the sort buttons in the header
and any control inside a cell. Enter or Space on a sort button cycles
ascending, descending. Tables whose rows are targets (row links, row
selection) are the data-table and add row focus there.

## Accessibility

`caption` or `aria-labelledby` names the table; `th scope="col"` on every
header and `scope="row"` on a row header column. `aria-sort` on the sorted
`th`, `none` or absent elsewhere; the glyph is `aria-hidden`. The empty and
loading rows are real rows so the table stays a table; `aria-busy="true"`
on the table while loading and a live region for the outcome. Contrast:
body text 8.43:1, header 10.10:1, caption and empty message 5.66:1, selected
text 7.92:1 on the fill, inactive 7.02:1, ring 4.75:1 on the fill, sort ring
4.57:1. Rows are at least 24 CSS pixels tall; sort buttons fill the header
cell.

## Portability

Row backgrounds, one border under the header, one between rows, an outline
on a selected row. Toolkits with a native table view take the rule, the
divider and the two fills. Hosts that cannot draw an outline on a row draw
the ring as an inset 1px border and record it.

## Non-examples

Zebra striping. A rounded or bordered table frame. A selected row marked by
a left bar (that is navigation, not selection). Header text in caption size
or uppercase. Sorting shown by colour alone without `aria-sort` and a glyph.
An animated spinner while loading. An empty state that removes the header.
Text truncated with no way to read the full value. A hover fill on a
touch device.
