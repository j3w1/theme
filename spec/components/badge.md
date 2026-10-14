---
id: badge
name: Badge
family: display
maturity: stable
priority: R1
since: 0.1.0
order: 30
summary: A small square label for a status or a count; every status carries its glyph and its fill, the outline form uses the status border, and an empty badge is a dot with a name.
native: true
aria:
  pattern: native span; an empty badge is role="img" with aria-label
variants:
  - id: status
    name: Status
    description: The five statuses danger, warning, success, info and neutral, each filled and carrying its glyph.
  - id: count
    name: Count
    description: A number on the primary action fill with a visually hidden unit.
  - id: outline
    name: Outline
    description: No fill; the status text colour and a 1px status border.
sizes: [compact, comfortable]
states:
  - default
  - empty
tokens:
  danger.bg: color.status.danger.fill
  danger.text: color.status.danger.on-fill
  danger.border: color.status.danger.border
  danger.outline-text: color.status.danger.text
  warning.bg: color.status.warning.fill
  warning.text: color.status.warning.on-fill
  warning.border: color.status.warning.border
  warning.outline-text: color.status.warning.text
  success.bg: color.status.success.fill
  success.text: color.status.success.on-fill
  success.border: color.status.success.border
  success.outline-text: color.status.success.text
  info.bg: color.status.info.fill
  info.text: color.status.info.on-fill
  info.border: color.status.info.border
  info.outline-text: color.status.info.text
  neutral.bg: color.status.neutral.fill
  neutral.text: color.status.neutral.on-fill
  neutral.border: color.status.neutral.border
  neutral.outline-text: color.status.neutral.text
  count.bg: color.action.primary.bg
  count.text: color.action.primary.text
stateTokens:
  default: { fg: color.status.danger.on-fill, bg: color.status.danger.fill }
  empty: { fg: color.status.danger.on-fill, bg: color.status.danger.fill }
contrast:
  - { fg: color.status.warning.on-fill, bg: color.status.warning.fill, label: "warning badge" }
  - { fg: color.status.success.on-fill, bg: color.status.success.fill, label: "success badge" }
  - { fg: color.status.info.on-fill, bg: color.status.info.fill, label: "info badge" }
  - { fg: color.status.neutral.on-fill, bg: color.status.neutral.fill, label: "neutral badge" }
  - { fg: color.action.primary.text, bg: color.action.primary.bg, label: "count badge" }
  - { fg: color.status.danger.text, bg: color.surface.default, label: "danger outline text" }
  - { fg: color.status.warning.text, bg: color.surface.default, label: "warning outline text" }
  - { fg: color.status.success.text, bg: color.surface.default, label: "success outline text" }
  - { fg: color.status.info.text, bg: color.surface.default, label: "info outline text" }
  - { fg: color.status.neutral.text, bg: color.surface.default, label: "neutral outline text" }
  - { fg: color.status.danger.border, bg: color.surface.default, min: 3, kind: ui, label: "danger outline border" }
  - { fg: color.status.warning.border, bg: color.surface.default, min: 3, kind: ui, label: "warning outline border" }
  - { fg: color.status.success.border, bg: color.surface.default, min: 3, kind: ui, label: "success outline border" }
  - { fg: color.status.info.border, bg: color.surface.default, min: 3, kind: ui, label: "info outline border" }
  - { fg: color.status.neutral.border, bg: color.surface.default, min: 3, kind: ui, label: "neutral outline border" }
  - { fg: color.status.danger.fill, bg: color.surface.default, min: 3, kind: ui, state: empty, label: "danger dot on the panel surface" }
  - { fg: color.status.warning.fill, bg: color.surface.default, min: 3, kind: ui, state: empty, label: "warning dot on the panel surface" }
  - { fg: color.status.success.fill, bg: color.surface.default, min: 3, kind: ui, state: empty, label: "success dot on the panel surface" }
  - { fg: color.status.info.fill, bg: color.surface.default, min: 3, kind: ui, state: empty, label: "info dot on the panel surface" }
  - { fg: color.status.neutral.fill, bg: color.surface.default, min: 3, kind: ui, state: empty, label: "neutral dot on the panel surface" }
anatomy:
  - part: root
    description: An inline-flex span, caption type, 2px by 8px padding, square corners; a status modifier class picks the roles.
  - part: glyph
    description: The mandatory status glyph ✕ ! ✓ i · before the text, aria-hidden because the text carries the meaning.
  - part: text
    description: The label or the number; in the count variant a visually hidden unit follows the number.
keyboard: []
responsive: A badge never wraps; the surrounding line wraps around it. Long labels are a design error, not a truncation case. RTL keeps the glyph at the inline start.
portability:
  web: A span with a modifier class; a count badge adds a visually hidden unit; an empty badge is a span with role="img" and aria-label; a badge never receives focus and never carries a click handler.
  nativeFallbacks:
    - GTK4 Label with a status style class and the fill through the css-name.
    - Qt QLabel with a dynamic status property selected in the stylesheet.
    - "Terminal UI: the glyph and the label in the status colour; fills only where the emulator supports background colours."
fixtures: [FX-I18N, FX-RTL, FX-ZOOM-200, FX-320, FX-RM, FX-HC, FX-STATE-MATRIX]
related: [chip, alert, table, list]
specimens: [filterable-table, settings-panel]
keywords: [badge, status, count, tag, label, dot, glyph, outline]
sources: [j3w1-web]
compact: false
---

## Purpose

Names a status or shows a count next to the thing it describes. A badge is
read-only: it never opens, toggles or removes anything. An interactive label
is a chip; a message with a status is an alert.

## Anatomy

Parts as listed in the anatomy. The glyphs are ✕ danger, ! warning, ✓
success, i info and · neutral.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | fill, glyph and text for the status; or the outline form | the glyph; the text |
| empty | an 8px square dot in the status fill; glyph and text visually hidden | `role="img"` with `aria-label`, or the hidden text; the dot's position beside its subject |

No hover, focus, pressed or disabled state: a badge is not a control.

## Keyboard

None. When a badge summarises something the user can act on, the action lives
in the neighbouring control and the badge is part of that control's name or
description.

## Accessibility

The text carries the meaning, so a reader hears "Failed", not "cross Failed".
The count's hidden unit reads as "12 unread". An empty badge may wrap hidden
text instead of `aria-label`; a dot with no name is decoration and must be
`aria-hidden`. Text meets 4.5:1; outline borders and dots 3:1 on the panel
surface. Badges are not targets, so no size minimum applies beyond legibility
at 11px caption type.

## Portability

Toolkits without background colours on labels use the outline form. Hosts
without the glyph characters use the nearest available (x, !, check mark, i,
bullet) and record it.

## Non-examples

Rounded or pill badges. A clickable badge. A status by colour without its
glyph. A count unit hidden from assistive technology. Purple, cyan or magenta
statuses. A badge in body type. Wrapping text. A dot without a name.
