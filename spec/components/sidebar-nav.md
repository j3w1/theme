---
id: sidebar-nav
name: Sidebar navigation
family: navigation
maturity: stable
priority: R1
since: 0.1.0
order: 40
summary: A vertical list of section links with optional nested groups; the current section carries a 2px inline-start indicator and bright text, and the rail collapses to icons.
native: true
aria:
  pattern: native nav with nested ul lists; groups are buttons with aria-expanded
  apg: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
variants:
  - id: default
    name: Default
    description: Flat links plus one closed group.
  - id: collapsed
    name: Collapsed
    description: Icons only; labels stay in the DOM for assistive technology and as tooltips.
  - id: nested
    name: Nested
    description: A group expanded with its children indented.
sizes: [compact, comfortable]
states:
  - default
  - hover
  - focus-visible
  - current
  - selected
  - selected+container-inactive
  - expanded
  - collapsed
tokens:
  root.bg: color.surface.default
  root.border: color.border.divider
  link.text: color.text.default
  link.bg-hover: color.interaction.hover.bg
  link.bg-pressed: color.interaction.pressed.bg
  link.ring: color.interaction.focus.ring
  link.indicator: color.border.selected-indicator
  link.indicator-inactive: color.border.selected-indicator-inactive
  current.text: color.text.bright
  selected.bg: color.interaction.selection.bg
  selected.text: color.interaction.selection.text
  selected.ring: color.interaction.focus.ring
  selected.inactive-bg: color.interaction.selection.inactive-bg
  selected.inactive-text: color.interaction.selection.inactive-text
  icon.stroke: color.icon.default
  group.chevron: color.icon.decorative
stateTokens:
  default: { fg: color.text.default, bg: color.surface.default }
  hover: { fg: color.text.default, bg: color.interaction.hover.bg }
  focus-visible: { fg: color.text.default, bg: color.surface.default, outline: color.interaction.focus.ring }
  current: { fg: color.text.bright, bg: color.surface.default, border: color.border.selected-indicator }
  selected: { fg: color.interaction.selection.text, bg: color.interaction.selection.bg }
  selected+container-inactive: { fg: color.interaction.selection.inactive-text, bg: color.interaction.selection.inactive-bg }
  expanded: { fg: color.text.default, bg: color.surface.default }
  collapsed: { fg: color.text.default, bg: color.surface.default }
contrast:
  - { fg: color.interaction.focus.ring, bg: color.interaction.selection.bg, min: 3, kind: ui, state: selected, label: "ring on a selected item when focused" }
  - { fg: color.icon.decorative, bg: color.surface.default, min: 1, kind: ui, label: "group chevron (decorative; aria-expanded carries the state)", waiver: "the chevron duplicates aria-expanded and the visible children; it is not the only channel" }
  - { fg: color.border.divider, bg: color.surface.default, min: 1, kind: ui, label: "rail edge (decorative)", waiver: "the edge separates the rail from the canvas; the links are the targets" }
anatomy:
  - part: list
    description: The top-level ul inside nav; nested groups hold a sublist ul indented by one icon width.
  - part: link
    description: A row-height anchor with an icon slot and a label; a transparent 2px inline-start edge that becomes the indicator.
  - part: icon
    description: A 16px line icon with stroke currentColor; the only visible part when collapsed.
  - part: label
    description: The link text; visually hidden (not removed) when the rail is collapsed.
  - part: group
    description: A button with aria-expanded and aria-controls that discloses its sublist; carries a chevron rotated 0 / 90°.
  - part: indicator
    description: The 2px border.selected-indicator inline-start bar of the current link.
keyboard:
  - key: Tab / Shift+Tab
    action: Moves through links and group buttons in document order; hidden children are skipped.
  - key: Enter
    action: Follows a link or toggles a group.
  - key: Space
    action: Toggles a group.
responsive: The rail is 240px wide in the application layout and collapses to an icon rail (the collapsed variant) between 900px and 1280px; below 900px it becomes a drawer. Labels never truncate; long labels wrap onto a second line. RTL mirrors the indicator to the inline-start edge and the chevron direction.
portability:
  web: nav with aria-label wrapping a ul; each item an anchor with aria-current="page" for the current section; groups are buttons with aria-expanded and aria-controls followed by a ul that is hidden until expanded; the indicator is a border-inline-start, the selection a background, the ring an outline.
  nativeFallbacks:
    - GTK4 ListBox with rows; the current row's indicator through a 2px start border style class.
    - Qt QTreeView with the branch indicator hidden; the current row painted with the indicator by a delegate.
    - "Terminal UI: the current section prefixed by a 2-cell heavy bar; children indented by two cells."
fixtures: [FX-LONG, FX-320, FX-ZOOM-200, FX-I18N, FX-RTL, FX-RM, FX-HC, FX-STATE-MATRIX]
related: [tabs, breadcrumbs, tree, disclosure, drawer]
specimens: [settings-panel, i3-window-frame]
keywords: [sidebar, navigation, rail, sections, nested, collapsed, current, indicator]
sources: [j3w1-web]
compact: false
---

## Purpose

Moves between the sections of an application: the primary navigation of a
settings panel, admin area or documentation site. Tabs switch views inside
one section; a tree browses data, not sections.

## Anatomy

A `nav` on {color.surface.default} with a 1px {color.border.divider}
inline-end edge; otherwise parts as listed in the anatomy.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | text {color.text.default}; no fill; transparent inline-start edge | — |
| hover | → {color.interaction.hover.bg} | cursor: pointer |
| focus-visible | 1px dashed {color.interaction.focus.ring} at −2px | the ring |
| current | 2px {color.border.selected-indicator} inline-start bar; text {color.text.bright} | `aria-current="page"`; the bar |
| selected | {color.interaction.selection.bg} with {color.interaction.selection.text}; 1px dashed {color.interaction.focus.ring} at −2px when focused | `aria-selected` on a listbox-style rail; the on-fill text |
| selected+container-inactive | {color.interaction.selection.inactive-bg} with {color.interaction.selection.inactive-text}; no ring | lightness drop between the two fills |
| expanded | chevron rotated 90°; sublist shown | `aria-expanded="true"`; the children are present |
| collapsed | labels visually hidden; icons centred; current bar and fills unchanged | labels remain for assistive technology and as tooltips |

`current` is where the user is; `selected` is what the user chose in a rail
that drives a detail pane. A rail is one or the other, never both.

## Keyboard

As in the key table; toggling a group leaves focus on its button. No arrow
keys: the rail is a list of links, not a tree.

## Accessibility

`aria-label` on the `nav` distinguishes the landmark. A rail that drives a
detail pane is a listbox with `aria-selected`, not links. A closed sublist is
`hidden`, so its links leave the tab order. Collapsed labels are clipped, not
`display: none`, so names survive; icon-only links also get a `title`. Text
meets 4.5:1; the indicator 3:1. Rows are at least 24 CSS pixels tall in
`compact`.

## Portability

The chevron is an SVG. Toolkits without logical borders draw the bar on the
left in LTR and on the right in RTL explicitly. Hosts that cannot hide labels while keeping their
names show the full rail.

## Non-examples

A filled or rounded current item. The indicator on the inline-end edge. A
current item marked by bold alone. Labels removed from the DOM when
collapsed. Hidden children left in the tab order. A rail that scrolls
horizontally. Icon-only links without an accessible name. Hover that changes
the text colour.
