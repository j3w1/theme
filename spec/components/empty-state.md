---
id: empty-state
name: Empty state
family: feedback
maturity: stable
priority: R1
since: 0.1.0
order: 80
summary: What a container shows when it has nothing to list; a glyph, a heading in the bright text colour, one sentence in the muted colour and an optional secondary action.
native: true
aria:
  pattern: "native block; a heading and a paragraph inside the region the content would fill; the action is a native <button> or <a>"
  apg: https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/
variants:
  - id: with-action
    name: With action
  - id: without-action
    name: Without action
sizes: [compact, comfortable]
states:
  - default
tokens:
  root.bg: color.surface.default
  root.border: color.border.divider
  glyph.text: color.icon.decorative
  heading.text: color.text.bright
  text.text: color.text.muted
  action.text: color.action.secondary.text
  action.border: color.action.secondary.border
  action.bg-hover: color.action.secondary.hover-bg
  action.ring: color.interaction.focus.ring
stateTokens:
  default: { fg: color.text.muted, bg: color.surface.default }
contrast:
  - { fg: color.text.bright, bg: color.surface.default, label: "heading on the panel surface" }
  - { fg: color.action.secondary.text, bg: color.surface.default, label: "action text on the panel surface" }
  - { fg: color.action.secondary.border, bg: color.surface.default, min: 3, kind: ui, label: "action boundary on the panel surface" }
  - { fg: color.icon.decorative, bg: color.surface.default, min: 1, kind: ui, label: "glyph (decorative)", waiver: "the glyph is aria-hidden and conveys nothing the heading does not" }
  - { fg: color.border.divider, bg: color.surface.canvas, min: 1, kind: ui, label: "container edge (decorative)", waiver: "the empty state fills the region its content would; the edge is the region's" }
anatomy:
  - part: root
    description: The block filling the region the content would fill; surface.default inside a 1px border.divider; content centred.
  - part: glyph
    description: A single text glyph (·, ∅, ⋯) in icon.decorative, hidden from assistive technology.
  - part: heading
    description: One short line in text.bright stating what is empty ("No components match").
  - part: text
    description: One sentence in text.muted saying why or what to do next.
  - part: action
    description: An optional secondary button or link that performs the next step (clear filters, create); never a primary button.
keyboard:
  - key: Tab
    action: Reaches the action when present; the block itself is never focusable.
  - key: Enter / Space
    action: Activates the action.
responsive: Centred at any width; the heading and sentence wrap; at 320px the padding shrinks to 16px and the action takes the full width. RTL needs no change; the glyph has no direction.
portability:
  web: "a <div> with an <h3> (or the heading level of the region) and a <p>, placed where the list, table body or pane content would be; the action is a native <button> or <a>; a live region announces the change when a filter empties the list."
  nativeFallbacks:
    - GTK4 StatusPage; the icon slot holds the glyph as text.
    - Qt a QLabel stack in the empty view; QListView placeholder text is not enough because it has no action.
    - "Terminal UI: the heading and sentence centred in the pane."
fixtures: [FX-LONG, FX-320, FX-ZOOM-200, FX-I18N, FX-RTL, FX-RM, FX-HC, FX-STATE-MATRIX]
related: [error-state, loading-indicator, list, table, data-table, button]
specimens: [filterable-table, settings-panel]
keywords: [empty, no results, placeholder, zero state, nothing here, first run]
sources: [j3w1-web]
compact: false
---

## Purpose

Replaces a blank pane, an empty table body or a filtered-out list: it says
what is empty and offers the one action that changes it, when there is one. A
failure is the error state; a wait is the loading indicator.

## Anatomy

Parts as listed in the anatomy.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | glyph, heading and sentence centred; the action, when present, below them | the worded heading; the action is a real button |

No states of its own; the action takes the secondary button's hover and ring.

## Keyboard

As in the key table. When a filter empties a list that had focus inside it,
focus moves to the region's heading, not into the empty state, so the person
hears where they are.

## Accessibility

The heading is a real heading at the region's level, so the empty state
appears in the outline; the sentence follows it in reading order. When
content becomes empty after an action (filter, delete), a polite live region
announces the heading text. The action is never the only route: filters can
also be cleared where they were set. Text meets 4.5:1; the action border 3:1.

## Portability

A toolkit with only a placeholder string adds the action as a separate button
below the view.

## Non-examples

An illustration or mascot. A primary (filled) call to action. A blank pane. A
greyed-out table header with no message. Only "No data". A heading in the
accent red. An empty state shown while loading. Centred text in a rounded,
shadowed card.
