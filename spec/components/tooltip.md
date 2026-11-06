---
id: tooltip
name: Tooltip
family: feedback
maturity: stable
priority: R1
since: 0.1.0
order: 50
summary: A short control description on hover and focus that follows the pointer; role tooltip via aria-describedby, 1px overlay border on raised, no arrow; a long one scrolls and pins.
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
  - id: long
    name: Long description
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
  close.text: color.action.tertiary.text
  close.border: color.border.control
  close.bg-hover: color.action.tertiary.hover-bg
  popup.z: z.popover
stateTokens:
  default: { fg: color.text.default, bg: color.surface.raised, border: color.border.overlay }
  hover: { fg: color.action.tertiary.text, bg: color.action.tertiary.hover-bg }
  focus-visible: { fg: color.action.tertiary.text, bg: color.surface.canvas, outline: color.interaction.focus.ring }
  open: { fg: color.text.default, bg: color.surface.raised, border: color.border.overlay }
contrast:
  - { fg: color.text.bright, bg: color.surface.raised, label: "shortcut on the tooltip" }
  - { fg: color.border.control, bg: color.surface.raised, min: 3, kind: ui, label: "shortcut key and close button borders on the tooltip" }
  - { fg: color.action.tertiary.text, bg: color.surface.raised, label: "close button on a pinned tooltip" }
  - { fg: color.action.tertiary.text, bg: color.surface.canvas, label: "trigger text on the canvas" }
anatomy:
  - part: trigger
    description: The control the tooltip describes; any focusable element with an accessible name of its own.
  - part: popup
    description: The tooltip, role tooltip, surface.raised behind a 1px border.overlay, text.default, one or two lines, no arrow; rendered below the trigger in the demonstration, live it follows the pointer. At most 24rem by 40vh; longer text scrolls.
  - part: close
    description: Only while pinned, a 24px square close button (×) at the popup's inline end, named Close, that stays in view while the popup scrolls.
  - part: shortcut
    description: An optional keyboard shortcut in a kbd, text.bright inside a 1px border.control.
keyboard:
  - key: Tab
    action: Focusing the trigger shows the tooltip anchored to it; leaving it hides the tooltip. In a pinned tooltip, Tab moves through its close button and content in ordinary order, without a trap.
  - key: Escape
    action: Hides the tooltip without moving focus; a pinned tooltip closes and focus returns to the trigger. The trigger's own Escape behaviour is not triggered.
  - key: Enter / Space
    action: On a trigger whose tooltip overflows, the first Enter or Space pins it as a popover and moves focus into it, in place of the trigger's own action. Otherwise act on the trigger as usual; the tooltip hides on activation.
responsive: The popup sits 12px right of and below the pointer and follows it; it flips to the side with room, keeps an 8px gutter and is never clipped by the viewport. It is at most 24rem wide and 40vh tall, wraps, and scrolls beyond that; at 320px it is as wide as the viewport minus the gutter. Without a pointer it anchors below the trigger, or above. RTL mirrors the placement (left of the pointer) and keeps the shortcut at the end.
portability:
  web: "the trigger carries aria-describedby to a <div role=tooltip>; visibility toggles the hidden attribute after a 300 ms open delay and hides as soon as the pointer leaves the trigger; positioned fixed at z.popover by the shared hover-helper algorithm (@j3w1/ui/enhance/hover-helper, D-042): 12px right of and below the pointer, following it each animation frame, flipping at the viewport edges inside an 8px gutter, anchored to the trigger for keyboard focus and touch; capped at 40vh with overflow auto, the wheel over the trigger scrolling it while it can scroll; a click, tap or Enter on a trigger whose tooltip overflows pins it as a non-modal popover (role dialog, a close button, focus inside, Escape returns focus); the tooltip is never the only place a control's name lives."
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
| hover | trigger background → {color.action.tertiary.hover-bg}; popup after 300 ms, 12px right of and below the pointer, following it; it hides as soon as the pointer leaves the trigger | cursor: pointer; the popup |
| focus-visible | 1px dashed {color.interaction.focus.ring} at −2px on the trigger; popup at once, anchored below the trigger | the ring; the popup |
| open | popup visible, 1px {color.border.overlay} on {color.surface.raised}; past 40vh it scrolls, with the wheel while the pointer is on the trigger | popup in the accessibility tree |
| pinned (open, as a popover) | an overflowing popup after a click, tap or Enter: it stays where it is, takes pointer events and text selection, and shows the close button | role dialog named by the trigger; `aria-expanded=true` on the trigger; focus inside |
| closed | popup absent; trigger unchanged | `hidden`; the description is still read from the DOM |

Unpinned, the popup has no hover, pressed or focus state and takes no
pointer events. A tooltip that has to be pinned to be read has become a
popover: pinned, it follows `popover.md` (non-modal, named, a visible close
action, Escape and an outside press dismiss, no focus trap) until it closes,
when it is a plain tooltip again. A tooltip that fits never pins.

## Keyboard

As in the key table. Escape does nothing else, so a dialog behind the
trigger stays open. Unpinned, the popup never receives focus and contains
nothing focusable; hovering never moves focus. Pinning moves focus into the
popup, and closing it returns focus to the trigger.

## Accessibility

The popup stays open while the pointer is on the trigger or keyboard focus
is on it, and Escape dismisses it (WCAG 1.4.13: dismissible, persistent). It
follows the pointer instead of being hoverable, so it never covers what the
pointer points at; content that does not fit is reached with the wheel over
the trigger or by pinning (D-042, a recorded limitation in
`spec/accessibility.md`). The trigger keeps `aria-describedby` and its own
accessible name; the tooltip never supplies it. Touch has no hover: a long
press shows the description anchored to the trigger, and a tap pins one that
overflows. Text meets 4.5:1; the popup border, the close button border and the
shortcut border 3:1.

## Portability

A bordered box of text. A toolkit with a native tooltip uses it with the
border and background tokens and records any radius it cannot remove, and
whether its tooltip follows the pointer. A web host uses
`@j3w1/ui/enhance/hover-helper` or reproduces its algorithm exactly
(foundations, Elevation and layering): follow at 12px, flip inside an 8px
gutter, anchor without a pointer, cap at 40vh, wheel-scroll and pin.

## Non-examples

A rounded bubble with an arrow. A shadow, or a fade longer than 150 ms. The
tooltip as an icon button's only accessible name. A link or button inside
(that is a popover). Opening on focus but not hover, or on hover with no delay.
A `title` attribute. A pointer-opened tooltip pinned to its trigger instead of
following the pointer, or one that eases after it. A close delay. A long
tooltip cut off, or one that closes before it can be scrolled. Moving focus on
hover.
