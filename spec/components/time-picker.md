---
id: time-picker
name: Time picker
family: forms-advanced
maturity: stable
priority: R1
since: 0.1.0
order: 30
summary: A native time input in the text-field box; segment editing and any clock popup belong to the host.
native: true
aria:
  pattern: "native <input type=time> with <label>"
  apg: https://www.w3.org/WAI/ARIA/apg/practices/forms/
variants:
  - id: default
    name: Time
sizes: [compact, comfortable]
states:
  - default
  - hover
  - focus-visible
  - invalid
  - disabled
tokens:
  root.bg: color.surface.input
  root.border: color.border.control
  root.bg-hover: color.interaction.hover.bg
  root.border-focus: color.border.active
  root.ring: color.interaction.focus.ring
  root.border-invalid: color.status.danger.border
  root.border-disabled: color.border.disabled
  root.bg-disabled: color.interaction.disabled.bg
  input.text: color.text.default
  input.text-disabled: color.text.disabled
  input.caret: color.code.caret
  label.text: color.text.bright
  help.text: color.text.muted
  message.text: color.status.danger.text
stateTokens:
  default: { fg: color.text.default, bg: color.surface.input, border: color.border.control }
  hover: { fg: color.text.default, bg: color.interaction.hover.bg, border: color.border.control }
  focus-visible: { fg: color.text.default, bg: color.surface.input, border: color.border.active, outline: color.interaction.focus.ring }
  invalid: { fg: color.text.default, bg: color.surface.input, border: color.status.danger.border }
contrast:
  - { fg: color.status.danger.text, bg: color.surface.canvas, label: "validation message on the canvas" }
  - { fg: color.text.muted, bg: color.surface.canvas, label: "help text on the canvas" }
  - { fg: color.text.disabled, bg: color.interaction.disabled.bg, min: 3, kind: ui, state: disabled, label: "disabled text (exempt; house floor 3:1)" }
  - { fg: color.border.disabled, bg: color.interaction.disabled.bg, min: 1, kind: ui, state: disabled, label: "disabled border (exempt)", waiver: "disabled controls are exempt from 1.4.11" }
anatomy:
  - part: label
    description: Above the control; the accessible name.
  - part: root
    description: The control box, 1px border.control on surface.input, height from the density mode.
  - part: input
    description: The native time input; text.default with tabular figures; the host draws any clock.
  - part: help
    description: Below the control in text.muted; states the step and the 24-hour convention.
  - part: message
    description: The validation message with the ✕ glyph in status.danger.text; linked by aria-describedby.
keyboard:
  - key: Tab / Shift+Tab
    action: Moves between hour, minute and any meridiem segment, then out of the control (host behaviour).
  - key: Up / Down
    action: Steps the focused segment by one, minutes by the step attribute (host behaviour).
  - key: Space / Alt+Down
    action: Opens the host clock where one exists; Escape closes it.
  - key: Enter
    action: Submits the owning form (native).
responsive: Fits its content (about 8ch) and never grows to fill the container; at 320px the box, help and message stack without clipping. RTL keeps the segments in the locale order the host chooses.
portability:
  web: "native <input type=time> with step; hosts without a time type fall back to a text field with a pattern and a format hint; color-scheme dark keeps any host popup on a dark surface."
  nativeFallbacks:
    - GTK4 SpinButton pair for hours and minutes inside one box.
    - Qt QTimeEdit; section navigation is native.
    - "Terminal UI: a masked line editor (HH:MM); no popup."
fixtures: [FX-320, FX-ZOOM-200, FX-I18N, FX-RTL, FX-RM, FX-HC, FX-STATE-MATRIX]
related: [text-field, date-picker, number-field, field]
specimens: [admin-form, settings-panel]
keywords: [time, clock, hour, minute, input, form]
sources: [j3w1-web]
compact: false
---

## Purpose

Entry of a time of day. The native time input gives segment editing and,
where the host has one, a clock popup; the theme styles the box exactly like
the text field and draws no clock of its own.

## Anatomy

Label above the box; the box; the native input sized to its content; help
below in {color.text.muted}; the validation message, which takes the help
slot while help stays in the DOM.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | 1px {color.border.control} on {color.surface.input}; text {color.text.default}, tabular figures | — |
| hover | background → {color.interaction.hover.bg}; border unchanged | cursor: text |
| focus-visible | border → {color.border.active}; ring 1px dashed {color.interaction.focus.ring} at −2px | the ring |
| invalid | border 2px {color.status.danger.border}; message with the ✕ glyph | border width 1 → 2px; glyph; `aria-invalid` |
| disabled | text {color.text.disabled}; border {color.border.disabled}; background {color.interaction.disabled.bg}; no hover | `disabled`; cursor: not-allowed |

Precedence when several apply: disabled > invalid > hover; focus-visible is
always drawn.

## Keyboard

The host owns segment navigation: Tab or the arrow keys move between hour,
minute and meridiem, Up and Down step a segment, Space or Alt+Down opens the
clock where the host has one, and Escape closes it and returns focus to the
segment.

## Accessibility

A programmatic label is required. Help and message are linked through
`aria-describedby`; `aria-invalid` is set only after interaction or submit.
`min`, `max` and `step` are stated in the help text as well as in the
attributes; the 24-hour convention follows the locale, never a hard-coded
format. The host clock is a host surface: the theme sets `color-scheme: dark`
and does not claim its contrast. Contrast: text 8.65:1 on the input surface,
control border 4.45:1, invalid border 4.69:1, danger message 5.40:1.

## Portability

Everything is expressible with border, background and outline. Toolkits with
a spin-button pair render the pair inside one box with the field border;
toolkits without a time type use a masked text field and record the
deviation.

## Non-examples

A custom clock face or a scrolling drum. A select for hours and a select for
minutes. Rounded corners. A placeholder in place of a format hint. Disabling
by opacity. Colour alone for the invalid state. A box that stretches to the
full container width.
