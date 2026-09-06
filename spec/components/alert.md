---
id: alert
name: Alert
family: feedback
maturity: stable
priority: R1
since: 0.1.0
order: 10
summary: An inline status message with a mandatory glyph on the status tint behind a 1px status border; role alert for danger, status otherwise.
native: true
aria:
  pattern: "native landmark-free block; role=alert for danger, role=status for every other status; an optional native close button"
  apg: https://www.w3.org/WAI/ARIA/apg/patterns/alert/
variants:
  - id: danger
    name: Danger
  - id: warning
    name: Warning
  - id: success
    name: Success
  - id: info
    name: Info
  - id: neutral
    name: Neutral
  - id: dismissible
    name: Dismissible
sizes: [compact, comfortable]
states:
  - default
  - hover
  - focus-visible
tokens:
  danger.bg: color.status.danger.tint
  danger.border: color.status.danger.border
  danger.text: color.status.danger.text
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
  body.text: color.text.default
  close.text: color.action.tertiary.text
  close.bg-hover: color.action.tertiary.hover-bg
  close.ring: color.interaction.focus.ring
stateTokens:
  default: { fg: color.status.danger.text, bg: color.status.danger.tint, border: color.status.danger.border }
  hover: { fg: color.action.tertiary.text, bg: color.action.tertiary.hover-bg }
  focus-visible: { fg: color.action.tertiary.text, bg: color.status.info.tint, outline: color.interaction.focus.ring }
contrast:
  - { fg: color.text.default, bg: color.status.danger.tint, label: "body text on the danger tint" }
  - { fg: color.status.warning.text, bg: color.status.warning.tint, label: "warning glyph and title on the warning tint" }
  - { fg: color.status.warning.border, bg: color.status.warning.tint, min: 3, kind: ui, label: "warning border on the warning tint" }
  - { fg: color.text.default, bg: color.status.warning.tint, label: "body text on the warning tint" }
  - { fg: color.status.success.text, bg: color.status.success.tint, label: "success glyph and title on the success tint" }
  - { fg: color.status.success.border, bg: color.status.success.tint, min: 3, kind: ui, label: "success border on the success tint" }
  - { fg: color.text.default, bg: color.status.success.tint, label: "body text on the success tint" }
  - { fg: color.status.info.text, bg: color.status.info.tint, label: "info glyph and title on the info tint" }
  - { fg: color.status.info.border, bg: color.status.info.tint, min: 3, kind: ui, label: "info border on the info tint" }
  - { fg: color.text.default, bg: color.status.info.tint, label: "body text on the info tint" }
  - { fg: color.status.neutral.text, bg: color.status.neutral.tint, label: "neutral glyph and title on the neutral tint" }
  - { fg: color.status.neutral.border, bg: color.status.neutral.tint, min: 3, kind: ui, label: "neutral border on the neutral tint" }
  - { fg: color.text.default, bg: color.status.neutral.tint, label: "body text on the neutral tint" }
  - { fg: color.action.tertiary.text, bg: color.status.info.tint, label: "close button on the info tint" }
  - { fg: color.interaction.focus.ring, bg: color.status.info.tint, min: 3, kind: ui, state: focus-visible, label: "ring on the info tint" }
anatomy:
  - part: root
    description: The block, status tint behind a 1px status border; role alert or status.
  - part: glyph
    description: The mandatory status glyph (✕ ! ✓ i ·) in the status text colour, hidden from assistive technology because the title carries the meaning.
  - part: body
    description: The title in the status text colour and the message in text.default.
  - part: close
    description: An optional tertiary button labelled "Dismiss"; the only interactive part.
keyboard:
  - key: Tab
    action: Reaches the close button when present; the alert itself is never focusable.
  - key: Enter / Space
    action: Dismisses; focus returns to the element that had it, or to the next focusable element after the alert.
  - key: Escape
    action: Nothing; alerts are not dialogs.
responsive: Fills its container; glyph, body and close button stay on one row with the body wrapping; at 320px long titles wrap under the glyph. RTL mirrors the glyph and close positions.
portability:
  web: "a <div role=alert> for danger and <div role=status> otherwise, present in the DOM before its text is filled so the announcement fires; the close button is a native <button type=button aria-label=Dismiss>."
  nativeFallbacks:
    - GTK4 InfoBar with the message-type mapped to the status roles.
    - Qt QFrame with a dynamic status property; QMessageBox only for modal cases.
    - "Terminal UI: a one-line banner with the glyph and a single-line border in the status colour."
fixtures: [FX-LONG, FX-320, FX-ZOOM-200, FX-I18N, FX-RTL, FX-RM, FX-HC, FX-STATE-MATRIX]
related: [toast, badge, dialog, empty-state, error-state]
specimens: [admin-form, settings-panel]
keywords: [alert, banner, message, status, notice, inline, dismiss]
sources: [j3w1-web]
compact: false
---

## Purpose

A status message that belongs to the page or form around it: a failed
submit, a saved draft, a deprecation notice. It stays in flow, is never
timed, and is announced once when it appears. Transient confirmations are
toasts; blocking questions are dialogs.

## Anatomy

The block on the status tint behind a 1px status border; the glyph in the
status text colour; the title in the same colour and the message in
{color.text.default}; an optional close button at the end. The five statuses
use their own `tint`, `border` and `text` roles: {color.status.danger.tint},
{color.status.warning.tint}, {color.status.success.tint},
{color.status.info.tint} and {color.status.neutral.tint} behind
{color.status.danger.border}, {color.status.warning.border},
{color.status.success.border}, {color.status.info.border} and
{color.status.neutral.border}.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | status tint, 1px status border, glyph and title in the status text colour | the glyph ✕ ! ✓ i · |
| hover | close button background → {color.action.tertiary.hover-bg}; the alert itself does not react | cursor: pointer on the button only |
| focus-visible | ring 1px dashed {color.interaction.focus.ring} at −2px on the close button | the ring |

The alert has no disabled, selected or loading state; a message that is no
longer true is removed, not greyed.

## Keyboard

Only the close button is in the tab order. Enter or Space dismisses and
returns focus to where it was, or to the next focusable element after the
alert when that element is gone. Escape does nothing, so a page-level Escape
handler is never swallowed.

## Accessibility

Danger uses `role="alert"` (assertive) because it needs attention now; the
other four use `role="status"` (polite). The container exists before its
text is set, so the live region fires; text is never injected together with
the container. The glyph is `aria-hidden` and the title states the status in
words ("Build failed", "Saved"), so nothing depends on colour or on the glyph
alone. The close button is `aria-label="Dismiss"` and at least 24×24 CSS
pixels. Contrast: status text on its tint from 4.88:1 (danger) to 6.59:1
(warning, info); body text at least 7.56:1 on every tint; borders from 4.07:1
(neutral) to 6.59:1.

## Portability

Everything is a tint, a 1px border and text; the glyph is a text character,
not an icon font. Toolkits with a native info bar map its type to the five
statuses and keep the glyph in the text; toolkits without a tint draw the
border only and record the deviation.

## Non-examples

A coloured left stripe with no border. A rounded, shadowed card. A banner
that slides in or auto-dismisses. Colour-only status without the glyph and a
worded title. Using `role="alert"` for success messages. A close button that
is an icon with no accessible name. Fixed-position alerts covering content.
