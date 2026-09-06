---
id: toast
name: Toast
family: feedback
maturity: stable
priority: R1
since: 0.1.0
order: 20
summary: A brief notification in a fixed corner stack; canvas surface behind a 1px overlay border, status tints for the four polite statuses and the danger fill for critical ones.
native: true
aria:
  pattern: "native <div role=status> (role=alert for danger) inside a region named Notifications; native buttons for the action and dismiss"
  apg: https://www.w3.org/WAI/ARIA/apg/patterns/alert/
variants:
  - id: default
    name: Plain
  - id: status
    name: Five statuses stacked
  - id: with-action
    name: With action
sizes: [compact, comfortable]
states:
  - default
  - hover
  - focus-visible
  - stacked
  - reduced-motion
tokens:
  root.bg: color.surface.canvas
  root.border: color.border.overlay
  root.text: color.text.default
  glyph.text: color.status.info.text
  warning.bg: color.status.warning.tint
  warning.border: color.status.warning.border
  warning.text: color.status.warning.text
  success.bg: color.status.success.tint
  success.border: color.status.success.border
  success.text: color.status.success.text
  info.bg: color.status.info.tint
  info.border: color.status.info.border
  info.text: color.status.info.text
  neutral.bg: color.status.neutral.tint
  neutral.border: color.status.neutral.border
  neutral.text: color.status.neutral.text
  danger.bg: color.status.danger.fill
  danger.text: color.status.danger.on-fill
  danger.button-bg-hover: color.action.destructive.pressed-bg
  action.text: color.text.link
  action.bg-hover: color.interaction.hover.bg-strong
  action.text-hover: color.text.link-hover
  close.text: color.action.tertiary.text
  close.bg-hover: color.action.tertiary.hover-bg
  close.ring: color.interaction.focus.ring
  count.text: color.text.muted
  stack.z: z.toast
stateTokens:
  default: { fg: color.text.default, bg: color.surface.canvas, border: color.border.overlay }
  hover: { fg: color.text.link-hover, bg: color.interaction.hover.bg-strong }
  focus-visible: { fg: color.action.tertiary.text, bg: color.surface.canvas, outline: color.interaction.focus.ring }
  stacked: { fg: color.text.muted, bg: color.surface.canvas, border: color.border.overlay }
  reduced-motion: { fg: color.text.default, bg: color.surface.canvas, border: color.border.overlay }
contrast:
  - { fg: color.status.info.text, bg: color.surface.canvas, label: "glyph on the plain toast" }
  - { fg: color.text.link, bg: color.surface.canvas, label: "action text on the plain toast" }
  - { fg: color.status.warning.text, bg: color.status.warning.tint, label: "warning glyph on its tint" }
  - { fg: color.status.warning.border, bg: color.status.warning.tint, min: 3, kind: ui, label: "warning border on its tint" }
  - { fg: color.text.default, bg: color.status.warning.tint, label: "text on the warning tint" }
  - { fg: color.status.success.text, bg: color.status.success.tint, label: "success glyph on its tint" }
  - { fg: color.status.success.border, bg: color.status.success.tint, min: 3, kind: ui, label: "success border on its tint" }
  - { fg: color.text.default, bg: color.status.success.tint, label: "text on the success tint" }
  - { fg: color.status.info.text, bg: color.status.info.tint, label: "info glyph on its tint" }
  - { fg: color.status.info.border, bg: color.status.info.tint, min: 3, kind: ui, label: "info border on its tint" }
  - { fg: color.text.default, bg: color.status.info.tint, label: "text on the info tint" }
  - { fg: color.status.neutral.text, bg: color.status.neutral.tint, label: "neutral glyph on its tint" }
  - { fg: color.status.neutral.border, bg: color.status.neutral.tint, min: 3, kind: ui, label: "neutral border on its tint" }
  - { fg: color.text.default, bg: color.status.neutral.tint, label: "text on the neutral tint" }
  - { fg: color.status.danger.on-fill, bg: color.status.danger.fill, label: "text, glyph and buttons on the danger fill" }
  - { fg: color.status.danger.fill, bg: color.surface.canvas, min: 3, kind: ui, label: "the danger fill is its own boundary against the canvas" }
  - { fg: color.status.danger.border, bg: color.status.danger.fill, min: 1, kind: ui, label: "danger border on the danger fill (decorative)", waiver: "the fill is the boundary at 4.14:1 against the canvas; the border only keeps the box model identical across statuses" }
anatomy:
  - part: stack
    description: The region that holds the toasts, fixed in the end corner of the viewport at z.toast; in flow in the demonstration.
  - part: root
    description: One toast, surface.canvas behind a 1px border.overlay, or a status tint and border; danger uses the danger fill.
  - part: glyph
    description: The status glyph (✕ ! ✓ i ·) in the status text colour; the plain toast uses i.
  - part: text
    description: One or two lines in text.default (on-fill on danger); no heading.
  - part: action
    description: An optional single link-styled button (Undo, View); never a destructive action.
  - part: close
    description: A tertiary button labelled "Dismiss"; always present because the timeout is not the only way out.
  - part: count
    description: The "+n" overflow count on the last visible toast when more are queued.
keyboard:
  - key: F6 / a host shortcut
    action: Moves focus into the notification region; toasts never steal focus when they appear.
  - key: Tab / Shift+Tab
    action: Within the region, reaches the action and then Dismiss of each toast in order.
  - key: Enter / Space
    action: Activates the action or dismisses.
  - key: Escape
    action: Dismisses the focused toast and returns focus to the region, then to the page.
responsive: The stack is at most 24rem wide and fills the viewport width minus the 8px gutter below 360px; text wraps, buttons keep their size; at 320px nothing is clipped. RTL mirrors the corner and the button order.
portability:
  web: "a <div role=region aria-label=Notifications> fixed in the end corner at z.toast holding <div role=status> toasts (role=alert for danger); the timeout pauses on hover and focus and is at least 8 s; appearance is an opacity change within the motion budget, never a slide."
  nativeFallbacks:
    - GTK4 Toast in a ToastOverlay; the danger fill is not available and is recorded.
    - "Desktop notifications through the host daemon (the historical dunst configuration is the origin of the danger fill); urgency critical maps to danger."
    - "Terminal UI: a message line at the bottom edge; no stacking."
fixtures: [FX-LONG, FX-320, FX-ZOOM-200, FX-I18N, FX-RTL, FX-RM, FX-HC, FX-OVERFLOW, FX-STATE-MATRIX]
related: [alert, dialog, progress, badge]
specimens: [i3-window-frame, settings-panel]
keywords: [toast, notification, snackbar, transient, dunst, status, stack]
sources: [j3w1-web, legacy-i3]
compact: false
---

## Purpose

A short confirmation or notice that does not belong to any one element on
the page: "Saved", "Copied", "Connection lost". It appears in a fixed corner
stack, is announced politely, and leaves on its own after a pause or when
dismissed. Anything that needs a decision is a dialog; anything tied to a
form is an alert.

## Anatomy

The stack region; each toast on {color.surface.canvas} behind a 1px
{color.border.overlay}, or on a status tint with its status border; the glyph
and the text; an optional action; the Dismiss button; the "+n" count. The
danger toast is the historical critical notification: {color.status.danger.fill}
with {color.status.danger.on-fill} for the text, the glyph and both buttons.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | canvas surface, 1px overlay border, glyph in the status text colour | the glyph; the worded text |
| hover | action → {color.interaction.hover.bg-strong} with {color.text.link-hover}; Dismiss → {color.action.tertiary.hover-bg}; the timeout pauses | cursor: pointer; underline thickens on the action |
| focus-visible | ring 1px dashed {color.interaction.focus.ring} at −2px on the focused button; on the danger fill the ring takes {color.status.danger.on-fill}; the timeout pauses | the ring |
| stacked | toasts sit in one column with a 4px gap, newest at the end; the last visible toast shows "+n" in {color.text.muted} for queued ones | the count text; at most three visible |
| reduced-motion | no transition; the toast is simply present or absent | `prefers-reduced-motion`; nothing moves |

The toast has no disabled, selected or busy state.

## Keyboard

Toasts never take focus when they appear. A host shortcut (F6 on the web
reference) moves focus into the region; Tab then walks each toast's action
and Dismiss; Escape dismisses the focused toast. While any toast has focus or
the pointer, its timeout is paused.

## Accessibility

The region is named "Notifications"; each toast is `role="status"` so it is
announced politely, and danger toasts are `role="alert"`. The text states the
outcome in words and the glyph is `aria-hidden`. Every toast has Dismiss and
the timeout is at least 8 seconds, extended for toasts with an action; an
action is never the only way to reach what it does. Contrast: text 8.65:1 on
the canvas, the overlay border 4.69:1, status text on its tint from 5.31:1
(neutral) to 6.59:1, on-fill text 4.58:1 on the danger fill, which is itself
4.14:1 against the canvas.

## Portability

A fixed region, tints, 1px borders and text glyphs. Hosts with a notification
daemon send the text and urgency instead of drawing a toast; the danger fill
maps to the critical urgency. Toolkits with a native toast overlay use it and
record that the danger fill is not available.

## Non-examples

A toast that slides in from an edge. A rounded, shadowed pill. A toast with
no Dismiss that vanishes after two seconds. A toast that takes focus on
appearance. Stacking more than three with no count. A form error shown as a
toast. Colour-only status without the glyph and worded text.
