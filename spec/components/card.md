---
id: card
name: Card
family: display
maturity: stable
priority: R1
since: 0.1.0
order: 10
summary: A bordered panel that groups a title, body and metadata; a link card makes the whole panel one link, a selectable card is an option with the selection fill.
native: true
aria:
  pattern: native article or section; link cards are a single anchor; selectable cards are options inside a listbox
  apg: https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
variants:
  - id: default
    name: Default
    description: A static article; no hover, no focus.
  - id: link-card
    name: Link card
    description: The whole card is one anchor; hover fill and the container ring.
  - id: selectable
    name: Selectable
    description: Options in a listbox with aria-selected; the selection fill when chosen.
sizes: [compact, comfortable]
states:
  - default
  - hover
  - focus-visible
  - selected
  - selected+focus-visible
tokens:
  root.bg: color.surface.default
  root.border: color.border.default
  root.bg-hover: color.interaction.hover.bg
  root.border-hover: color.border.control
  root.ring: color.interaction.focus.ring-container
  title.text: color.text.bright
  body.text: color.text.default
  meta.text: color.text.muted
  selected.bg: color.interaction.selection.bg
  selected.text: color.interaction.selection.text
  selected.ring: color.interaction.focus.ring
stateTokens:
  default: { fg: color.text.default, bg: color.surface.default }
  hover: { fg: color.text.default, bg: color.interaction.hover.bg, border: color.border.control }
  focus-visible: { fg: color.text.default, bg: color.surface.default, outline: color.interaction.focus.ring-container }
  selected: { fg: color.interaction.selection.text, bg: color.interaction.selection.bg }
  selected+focus-visible: { fg: color.interaction.selection.text, bg: color.interaction.selection.bg, outline: color.interaction.focus.ring }
contrast:
  - { fg: color.text.bright, bg: color.surface.default, label: "title on the card" }
  - { fg: color.text.muted, bg: color.surface.default, label: "metadata on the card" }
  - { fg: color.text.bright, bg: color.interaction.hover.bg, state: hover, label: "title on the hover fill" }
  - { fg: color.text.muted, bg: color.interaction.hover.bg, state: hover, label: "metadata on the hover fill" }
  - { fg: color.border.default, bg: color.surface.default, min: 1, kind: ui, label: "card edge (decorative; the card is not a control at rest)", waiver: "the default border groups content; interactive cards gain border.control on hover and a focus ring; selected cards use the ordinary ring" }
anatomy:
  - part: root
    description: The article, anchor or option; 1px border.default on surface.default; no shadow, no radius.
  - part: title
    description: A heading (or a span inside a link card) in text.bright.
  - part: body
    description: One or two lines of text.default.
  - part: meta
    description: A trailing line of text.muted such as a date or a count.
  - part: group
    description: For the selectable variant, the listbox that holds the option cards.
keyboard:
  - key: Tab
    action: Reaches a link card as one stop; reaches a selectable group at its selected card (roving tabindex).
  - key: Enter
    action: Follows a link card.
  - key: Up / Down / Left / Right
    action: Moves between selectable cards in the group and selects the focused one.
  - key: Space
    action: Toggles the focused card in a multi-select group.
responsive: Cards fill their column with min-width 0 and stack at 320px; the body wraps and nothing truncates; a grid of cards uses container queries to change its column count. RTL mirrors the text alignment only.
portability:
  web: A static card is an article (with a heading) or a section; a link card is one anchor wrapping block content; a selectable card is a div with role option inside a div with role listbox, aria-selected on the option and roving tabindex; the border is a border, the fill a background, the ring an outline.
  nativeFallbacks:
    - GTK4 Frame with a Box; a selectable card is a ListBoxRow.
    - Qt QFrame with a StyledPanel shape; selectable cards through QListView with a delegate.
    - "Terminal UI: a single-line box; the selected card inverted."
fixtures: [FX-LONG, FX-320, FX-ZOOM-200, FX-I18N, FX-RTL, FX-RM, FX-HC, FX-STATE-MATRIX]
related: [list, link, button, table]
specimens: [settings-panel, filterable-table]
keywords: [card, panel, tile, link card, selectable, option, article]
sources: [j3w1-web]
compact: false
---

## Purpose

Groups a title, a line or two and a metadata line so they read as one
thing. Static by default; a link when the whole unit leads somewhere, an
option when the user picks among units. Not a dialog, a form or a table row.

## Anatomy

Parts as listed in the anatomy. Padding 12px in `comfortable`, 8px in
`compact`.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | 1px {color.border.default} on {color.surface.default} | — |
| hover | link and selectable cards only: background → {color.interaction.hover.bg}; border → {color.border.control} | cursor: pointer; the border lightens from decorative to control |
| focus-visible | container ring 2px solid {color.interaction.focus.ring-container} at −3px | the ring |
| selected | fill {color.interaction.selection.bg}, {color.interaction.selection.text} on every line | `aria-selected="true"`; the on-fill text |
| selected+focus-visible | the fill and 1px dashed {color.interaction.focus.ring} at −2px | both visible at once |

A static card has no hover and no focus, and is not in the tab order.

## Keyboard

A link card may hold no controls (a link cannot contain a button). A static
card contributes only the controls it contains to the tab order.

## Accessibility

A static card is an `article` with a heading when it stands alone, or a
`section` inside a list. A link card names itself from its content, title
first. A selectable group's listbox carries `aria-label`. On the selection
fill every line takes the on-fill text, because muted text would fall below
4.5:1. Text meets 4.5:1; the ring 3:1 on the card and on the fill.

## Portability

A bordered box with a background and an outline. Toolkits that shadow their
frames remove it. A host without outlines draws a 2px inner border for the container ring,
1px for the selected card, and records it.

## Non-examples

A shadow or elevation. Rounded corners. A hover lift or scale. A hover fill
on a static card. An invisible overlay as the only clickable part. A link
card containing buttons. A selected card shown by border colour alone,
without the fill and `aria-selected`. Muted metadata left on the selection
fill.
