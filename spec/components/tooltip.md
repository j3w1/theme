---
id: tooltip
name: Tooltip
family: feedback
maturity: stable
priority: R1
since: 0.1.0
order: 50
summary: A short description of a control shown on hover and focus; role tooltip linked by aria-describedby, a 1px overlay border on the raised surface, no arrow.
native: false
aria:
  pattern: "APG tooltip: a trigger with aria-describedby pointing at an element with role=tooltip, shown on hover and focus, hidden on Escape"
  apg: https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
  role: tooltip
variants:
  - id: default
    name: Description
  - id: with-shortcut
    name: With shortcut
sizes: [compact, comfortable]
states:
  - default
  - hover
  - focus-visible
  - open
  - closed
tokens:
  popup.bg: color.surface.raised
  popup.border: color.border.overlay
  popup.text: color.text.default
  shortcut.text: color.text.bright
  shortcut.border: color.border.control
  trigger.text: color.action.tertiary.text
  trigger.bg-hover: color.action.tertiary.hover-bg
  trigger.ring: color.interaction.focus.ring
  popup.z: z.popover
stateTokens:
  default: { fg: color.text.default, bg: color.surface.raised, border: color.border.overlay }
  hover: { fg: color.action.tertiary.text, bg: color.action.tertiary.hover-bg }
  focus-visible: { fg: color.action.tertiary.text, bg: color.surface.canvas, outline: color.interaction.focus.ring }
  open: { fg: color.text.default, bg: color.surface.raised, border: color.border.overlay }
contrast:
  - { fg: color.text.bright, bg: color.surface.raised, label: "shortcut on the tooltip" }
  - { fg: color.border.control, bg: color.surface.raised, min: 3, kind: ui, label: "shortcut key border on the tooltip" }
  - { fg: color.action.tertiary.text, bg: color.surface.canvas, label: "trigger text on the canvas" }
anatomy:
  - part: trigger
    description: The control the tooltip describes; any focusable element with an accessible name of its own.
  - part: popup
    description: The tooltip, role tooltip, surface.raised behind a 1px border.overlay, text.default, one or two lines, no arrow; rendered below the trigger in the demonstration.
  - part: shortcut
    description: An optional keyboard shortcut in a kbd, text.bright inside a 1px border.control.
keyboard:
  - key: Tab
    action: Focusing the trigger shows the tooltip; leaving it hides the tooltip.
  - key: Escape
    action: Hides the tooltip without moving focus; the trigger's own Escape behaviour is not triggered.
  - key: Enter / Space
    action: Act on the trigger as usual; the tooltip hides on activation.
responsive: The popup is at most 24rem wide and wraps; it flips to the side with room and is never clipped by the viewport; at 320px it is as wide as the viewport minus the gutter. RTL mirrors the placement and keeps the shortcut at the end.
portability:
  web: "the trigger carries aria-describedby to a <div role=tooltip>; visibility toggles the hidden attribute after a 300 ms open delay, and hides 300 ms after the pointer leaves trigger and popup; positioned with anchor positioning or a popover at z.popover; the tooltip is never the only place a control's name lives."
  nativeFallbacks:
    - GTK4 tooltip-text; the host draws it with the overlay border through the tooltip css node.
    - Qt QToolTip stylesheet; border and background from the tokens; no rounded corners.
    - "Terminal UI: the description in the status line while the control is focused."
fixtures: [FX-LONG, FX-320, FX-ZOOM-200, FX-I18N, FX-RTL, FX-RM, FX-HC, FX-OVERFLOW, FX-STATE-MATRIX]
related: [icon-button, popover, kbd, toolbar, menu]
specimens: [i3-window-frame, filterable-table]
keywords: [tooltip, hint, description, shortcut, hover, popover]
sources: [j3w1-web]
compact: false
---

## Purpose

Describes a control without being its name: what an icon button does, its
shortcut, why it is disabled. Anything needed to use the control belongs in
the control or its label; anything interactive is a popover.

## Anatomy

Parts as listed in the anatomy; no arrow, shadow or radius.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | trigger at rest; popup shown for the demonstration | `aria-describedby` on the trigger |
| hover | trigger background → {color.action.tertiary.hover-bg}; popup after 300 ms; it hides 300 ms after the pointer leaves trigger and popup | cursor: pointer; the popup |
| focus-visible | 1px dashed {color.interaction.focus.ring} at −2px on the trigger; popup at once | the ring; the popup |
| open | popup visible, 1px {color.border.overlay} on {color.surface.raised} | popup in the accessibility tree |
| closed | popup absent; trigger unchanged | `hidden`; the description is still read from the DOM |

The popup has no hover, pressed or focus state; it is not interactive.

## Keyboard

As in the key table. Escape does nothing else, so a dialog behind the
trigger stays open. The popup never receives focus and contains nothing
focusable.

## Accessibility

The popup stays open while the pointer is over the trigger or the popup
(WCAG 1.4.13: hoverable, dismissible, persistent). The trigger has its own
accessible name; the tooltip never supplies it. Touch has no hover: offer the
description by long-press or inline. Text meets 4.5:1; the popup border and
the shortcut border 3:1.

## Portability

A bordered box of text; placement is the host's positioning primitive. A
toolkit with a native tooltip uses it with the border and background tokens
and records any radius it cannot remove.

## Non-examples

A rounded bubble with an arrow. A shadow, or a fade longer than 150 ms. The
tooltip as an icon button's only accessible name. A link or button inside.
Opening on focus but not hover, or on hover with no delay. A `title`
attribute. Following the pointer.
