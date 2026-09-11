---
id: filterable-table
name: Filterable table
family: composed
maturity: stable
priority: R1
since: 0.1.0
order: 30
summary: A list screen composed from a toolbar with search and filter, removable chips, a selectable sortable data-table with status badges, a count and pagination; with empty and loading variants.
native: true
aria:
  pattern: "region landmark; a toolbar with roving tabindex holding a search landmark, a menu button, a toggle icon button and a button; a group of removable chips; a grid-less native table with aria-sort, aria-selected rows and a checkbox-role select-all; role=status for the count; a pagination nav"
  apg: https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/
variants:
  - id: default
    name: Eight of 43
  - id: empty
    name: Nothing matches
    description: A search term no component matches; the table body is its empty row, an empty-state block offers Clear filters, and the count reads zero.
  - id: loading
    name: Loading
    description: The table carries aria-busy; its body is the ⋯ row and the search field shows the loading glyph.
sizes: [compact, comfortable]
states:
  - default
  - hover
  - focus-visible
  - selected
  - no-results
tokens:
  root.bg: color.surface.default
  root.border: color.border.default
  toolbar.bg: color.surface.chrome
  toolbar.border: color.border.divider
  toolbar.separator: color.border.default
  search.bg: color.surface.input
  search.border: color.border.control
  search.text: color.text.default
  search.placeholder: color.text.placeholder
  search.icon: color.icon.default
  filter.text: color.text.default
  filter.border: color.border.control
  new.bg: color.action.primary.bg
  new.text: color.action.primary.text
  chip.bg: color.surface.default
  chip.border: color.border.control
  chip.text: color.text.default
  chip.remove: color.text.muted
  header.text: color.text.bright
  header.rule: color.border.strong
  row.text: color.text.default
  row.rule: color.border.divider
  row.bg-hover: color.interaction.hover.bg
  row.ring: color.interaction.focus.ring
  row.selected-bg: color.interaction.selection.bg
  row.selected-text: color.interaction.selection.text
  row.ring-on-selection: color.interaction.focus.ring-container
  check.bg: color.surface.input
  check.border: color.border.control
  check.checked-bg: color.action.primary.bg
  check.glyph: color.action.primary.text
  badge.tested-fill: color.status.success.fill
  badge.tested-text: color.status.success.on-fill
  badge.demonstrated-fill: color.status.info.fill
  badge.demonstrated-text: color.status.info.on-fill
  empty.text: color.text.muted
  empty.heading: color.text.bright
  empty.glyph: color.icon.decorative
  count.text: color.text.muted
  pagination.text: color.text.default
  pagination.current: color.text.bright
  pagination.disabled: color.text.disabled
stateTokens:
  default: { fg: color.text.default, bg: color.surface.default }
  hover: { fg: color.text.default, bg: color.interaction.hover.bg }
  focus-visible: { fg: color.text.default, bg: color.surface.default, outline: color.interaction.focus.ring }
  selected: { fg: color.interaction.selection.text, bg: color.interaction.selection.bg }
  no-results: { fg: color.text.muted, bg: color.surface.default }
contrast:
  - { fg: color.text.default, bg: color.surface.chrome, label: "toolbar controls on the chrome surface" }
  - { fg: color.border.control, bg: color.surface.chrome, min: 3, kind: ui, label: "search box and filter button boundaries on the chrome surface" }
  - { fg: color.text.bright, bg: color.surface.default, label: "column headers, empty-state heading and current page" }
  - { fg: color.text.muted, bg: color.surface.default, label: "count, chip remove glyph and empty-state text" }
  - { fg: color.status.success.on-fill, bg: color.status.success.fill, label: "Tested badge" }
  - { fg: color.status.info.on-fill, bg: color.status.info.fill, label: "Demonstrated badge" }
  - { fg: color.action.primary.text, bg: color.action.primary.bg, label: "New button and checked boxes" }
  - { fg: color.interaction.focus.ring-container, bg: color.interaction.selection.bg, min: 3, kind: ui, state: selected, label: "ring on a selected row" }
  - { fg: color.border.control, bg: color.surface.default, min: 3, kind: ui, label: "chip and checkbox boundaries" }
  - { fg: color.text.disabled, bg: color.surface.default, min: 3, kind: ui, label: "disabled Prev link (exempt; house floor 3:1)" }
  - { fg: color.border.strong, bg: color.surface.default, min: 1, kind: ui, label: "header rule (decorative)", waiver: "the header row is identified by th scope=col; the rule only separates it" }
  - { fg: color.border.default, bg: color.surface.default, min: 1, kind: ui, label: "panel edge and toolbar separator (decorative)", waiver: "the edge and the separator group controls that are already distinct targets" }
  - { fg: color.border.divider, bg: color.surface.default, min: 1, kind: ui, label: "row, toolbar and footer rules (decorative)", waiver: "rows are distinct by table structure; the rules only separate them" }
anatomy:
  - part: root
    description: The region landmark, surface.default behind a 1px border.default; the inline-size container the toolbar wrapping is measured on.
  - part: toolbar
    description: The toolbar on surface.chrome; a search-field (its label visually hidden, its status line announced), a Filter menu button with a hidden menu of checkable items, a Columns toggle icon-button, a separator and the primary New button at the end.
  - part: filters
    description: A group of removable chips, one per active filter, each with a named Remove button.
  - part: scroller
    description: A horizontally scrolling container around the data-table.
  - part: table
    description: The data-table with a checkbox-role select-all, sortable headers (Name carries aria-sort), eight focusable rows with aria-selected, a row checkbox, a states count and a status badge, plus the hidden empty and loading rows.
  - part: empty
    description: In the empty variant, an empty-state block under the table with a Clear filters action.
  - part: footer
    description: The result count as role=status ("1–8 of 43"; "0 of 43" when nothing matches) and the compact pagination with a disabled Prev and a Next link.
keyboard:
  - key: Tab / Shift+Tab
    action: Into the toolbar (the search input is its stop), then each chip's Remove button, then the table (the first row is its stop), then Next.
  - key: Arrow keys
    action: Inside the toolbar move between the search field, Filter, Columns and New; inside the table move between rows; Home and End reach the first and last row.
  - key: Enter / Space
    action: Open the Filter menu; toggle Columns; activate New or a chip's Remove; on a header sort by it; on a row's checkbox toggle its selection.
  - key: Escape
    action: Clears a non-empty search; closes the Filter menu and returns focus to its button.
responsive: The root is an inline-size container; below 600px the toolbar wraps with the search field on its own row and New at the end of the second, chips wrap, and the table scrolls inside its own container while the region never scrolls horizontally. The footer wraps the count above the pagination. RTL mirrors the toolbar order, the chip Remove side, the numeric column and the pagination glyphs.
portability:
  web: Native table semantics with aria-sort and aria-selected; the toolbar's roving tabindex and the menu need the host's script, everything else is static. The count is a status region so filtering announces its result once. Hosts without container queries wrap the toolbar at the 600px viewport breakpoint. The 56rem width and the 44rem table minimum are layout of this specimen, not rules.
  nativeFallbacks:
    - "GTK4: a SearchBar and a MenuButton above a ColumnView with a selection column; badges are styled labels; the empty state is a StatusPage."
    - "Qt: a QToolBar, a flow of tag widgets, a QTableView with a check column and QStyledItemDelegate badges; the count is a QLabel in the status bar."
    - "Terminal UI: a one-line prompt row, filters as bracketed tags, the table as aligned columns with the selection fill; no hover."
fixtures: [FX-STATE-MATRIX, FX-320, FX-360, FX-ZOOM-200, FX-RM, FX-HC, FX-I18N, FX-RTL, FX-OVERFLOW, FX-DENSITY]
related: [toolbar, search-field, menu, icon-button, button, chip, data-table, badge, empty-state, pagination]
specimens: []
keywords: [table, list, filter, search, chips, selection, pagination, composed]
sources: [j3w1-web]
compact: false
---

## Purpose

A list screen that proves the navigation, display and feedback components
compose around one data-table: find, filter, select, page. It exists to
show the states of a whole list screen, including nothing matching and
still loading, not to prescribe a product.

## Anatomy

The region landmark; the toolbar on {color.surface.chrome} with the
search-field, the Filter menu button, the Columns toggle, a separator and the
primary New button; a row of removable chips (priority: R1, maturity:
stable); the scroller around the data-table, whose Name header carries
`aria-sort`, whose rows carry `aria-selected` and a checkbox, and whose last
column is a status badge (✓ Tested on {color.status.success.fill}, i
Demonstrated on {color.status.info.fill}); the count in {color.text.muted}
and the compact pagination. The empty variant adds the empty-state block;
the loading variant marks the table `aria-busy`. Every part is the
component's own markup and classes.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | rest tokens of every component; Name sorted ascending with its ▲ glyph; Prev disabled | `aria-sort`; the glyph |
| hover | the pointed row takes {color.interaction.hover.bg}; the toolbar controls and chips keep their own hover on their own pointer events only | cursor |
| focus-visible | the dashed {color.interaction.focus.ring} on the row holding focus (shown on the third row); the toolbar and chips stay at rest | the ring |
| selected | two rows take {color.interaction.selection.bg} with {color.interaction.selection.text} and a checked box; the select-all reports mixed with the – glyph | `aria-selected`; ✓ and – glyphs; `aria-checked="mixed"` |
| no-results | the body is the "No components match" row, the count reads 0 of 43, the search field's status line announces it; the chips stay so the cause is visible | text; `role="status"` |

The composed components keep their own pressed, sorted, disabled, loading
and open treatments; this specimen declares only the states the whole
screen adds to them.

## Keyboard

Landmarks first: the region, the toolbar's search landmark and the
pagination navigation are offered by name. The toolbar is one stop with
arrow movement between the search field, Filter, Columns and New (the
toolbar contract); Escape clears the search. Each chip's Remove button is
its own stop. The table follows the data-table contract: the first row is
the stop, arrows move between rows, Space on a row's checkbox toggles it,
Enter on a header sorts. Next is the last stop; a disabled Prev is not
focusable.

## Accessibility

The search field's visible label is replaced by a visually hidden one so the
toolbar stays one row; its status line is visually hidden too and announces
"No components match" through `role="status"`. The count is a second status
region and changes once per filter. Rows are named by their Name cell
through `aria-labelledby` on the row checkbox; the select-all is a
checkbox-role button whose mixed state carries the – glyph. Badges carry
their glyphs so status survives without colour. Contrast: toolbar text
8.60:1 on the chrome surface, boundaries 4.42:1, headers 10.10:1, badges
7.08:1 and 7.13:1 on their fills, the ring 7.48:1 on the selection fill.

## Portability

Native table semantics, a toolbar, a menu button and a status region; the
roving tabindex and the menu need the host's script, every state renders
without one from the root hooks `data-state-selected` and
`data-state-no-results` and the table's own `aria-busy`. Hosts without
container queries wrap the toolbar at the 600px viewport breakpoint. The
56rem width and the 44rem table minimum are layout of this specimen and not
rules; the specimen proves composition, not a product.

## Non-examples

A rounded search pill with a magnifier inside a shadowed toolbar. Filter
chips drawn as pills with a coloured fill per category. Zebra-striped rows.
A selected row shown by a coloured left bar and no fill. A blue Material
checkbox. A skeleton shimmer while loading. An infinite scroll with no count
and no pages.
