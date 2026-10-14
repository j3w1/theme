---
id: time-picker
name: Time picker
family: forms-advanced
maturity: stable
priority: R1
since: 0.1.0
order: 30
summary: A themed time editor with explicit step buttons, backed by native time values and constraints.
native: false
aria:
  pattern: Labeled textbox with native time constraints and named step buttons
  apg: https://www.w3.org/WAI/ARIA/apg/practices/forms/
variants:
  - id: default
    name: Time
sizes:
  - compact
  - comfortable
states:
  - default
  - hover
  - focus-visible
  - invalid
  - invalid+focus-visible
  - disabled
tokens:
  root.bg: color.surface.input
  root.border: color.border.control
  root.bg-hover: color.interaction.hover.bg
  root.border-focus: color.border.active
  root.ring: color.interaction.focus.ring
  root.ring-invalid: color.interaction.focus.ring-container
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
  default:
    fg: color.text.default
    bg: color.surface.input
    border: color.border.control
  hover:
    fg: color.text.default
    bg: color.interaction.hover.bg
    border: color.border.control
  focus-visible:
    fg: color.text.default
    bg: color.surface.input
    border: color.border.active
    outline: color.interaction.focus.ring
  invalid:
    fg: color.text.default
    bg: color.surface.input
    border: color.status.danger.border
  invalid+focus-visible:
    fg: color.text.default
    bg: color.surface.input
    border: color.status.danger.border
    outline: color.interaction.focus.ring-container
contrast:
  - fg: color.status.danger.text
    bg: color.surface.canvas
    label: validation message on the canvas
  - fg: color.text.muted
    bg: color.surface.canvas
    label: help text on the canvas
  - fg: color.text.disabled
    bg: color.interaction.disabled.bg
    min: 3
    kind: ui
    state: disabled
    label: disabled text (exempt; house floor 3:1)
  - fg: color.border.disabled
    bg: color.interaction.disabled.bg
    min: 1
    kind: ui
    state: disabled
    label: disabled border (exempt)
    waiver: disabled controls are exempt from 1.4.11
anatomy:
  - part: label
    description: Above the control; the accessible name.
  - part: root
    description: The control box, 1px border.control on surface.input, height from the density mode.
  - part: input
    description: Themed text editor with HH:MM or HH:MM:SS hint and explicit increase/decrease buttons. The original native time input owns form values.
  - part: help
    description: Below the control in text.muted; states the step and the 24-hour convention.
  - part: message
    description: The validation message with the ✕ glyph in status.danger.text; linked by aria-describedby.
keyboard:
  - key: Tab / Shift+Tab
    action: Moves between the time editor, step buttons and other controls.
  - key: Typing
    action: Edits HH:MM or HH:MM:SS text; native min, max and step validate it.
  - key: Enter / Space on a step button
    action: Increases or decreases by the native step. With step=any, buttons are disabled.
responsive: Fits its content (about 8ch) and never grows to fill the container; at 320px the box, help and message stack without clipping. RTL keeps the segments in the locale order the host chooses.
portability:
  web: Theme-owned editor and step buttons backed by a native time input. Keep native min/max/step, labels, form ownership and reset. Without JavaScript the original native control is visible.
  nativeFallbacks:
    - GTK4 SpinButton pair for hours and minutes inside one box.
    - Qt QTimeEdit; section navigation is native.
    - "Terminal UI: a masked line editor (HH:MM); no popup."
fixtures:
  - FX-320
  - FX-ZOOM-200
  - FX-I18N
  - FX-RTL
  - FX-RM
  - FX-HC
  - FX-STATE-MATRIX
related:
  - text-field
  - date-picker
  - number-field
  - field
specimens:
  - admin-form
  - settings-panel
keywords:
  - time
  - clock
  - hour
  - minute
  - input
  - form
sources:
  - j3w1-web
compact: false
---

## Purpose

Enter a time by typing or with themed step buttons. D-025: theme-owned web
controls, not browser popup styling.

## Anatomy

A label, editor, increase and decrease buttons, format hint and validation
message. The native time input stays the successful form control, owns
value, defaults and constraints, and is hidden only after enhancement.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | {color.text.default} on {color.surface.input}, 1px {color.border.control} | — |
| hover | background → {color.interaction.hover.bg} | hover-capable pointers only |
| focus-visible | border → {color.border.active}; the canonical focus ring | the ring |
| invalid | 2px {color.status.danger.border}; a linked message | border 1 → 2px; ✕ glyph; `aria-invalid` |
| invalid+focus-visible | the danger border and the ring in {color.interaction.focus.ring-container} at −4px | double boundary |
| disabled | {color.text.disabled} on {color.interaction.disabled.bg}, border {color.border.disabled}; editor and step actions unavailable | `disabled`; cursor: not-allowed |

A read-only value stays readable and cannot change through the step
buttons.

## Keyboard

As in the key table; the step buttons are named.

## Accessibility

The visible editor receives the original label, descriptions, required and
error state. Format hints are always available. Native min, max, step and
required stay authoritative. Invalid entry focuses the visible editor and
shows a theme-owned message. The enhanced control uses no host clock popup
or browser segment selection. Form reset restores the native defaults.
Automated evidence records its browser, states and limits and is not a
manual screen-reader acceptance.

## Portability

The package and the complete copy distribution include the renderer; the
public control enhancement applies it to existing native markup. Without
JavaScript, and on non-web platforms, the control stays native.

## Non-examples

An unthemed host popup presented as themed. A second named input
duplicating form values. Dropping native constraints, labels or reset.
Literal colours or rounded corners.
