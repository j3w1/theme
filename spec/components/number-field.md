---
id: number-field
name: Number field
family: forms-basic
maturity: stable
priority: R1
since: 0.1.0
order: 90
summary: The text-field box around a native number input with right-aligned tabular digits, an optional unit affix and two square stepper buttons that replace the host spinner.
native: true
aria:
  pattern: native <input type="number"> with <label>; stepper buttons are separate <button>s
  apg: https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/
variants:
  - id: default
    name: Default
  - id: with-unit
    name: With unit
    description: A unit affix (px, ms, %) between the digits and the stepper.
sizes: [compact, comfortable]
states:
  - default
  - hover
  - focus-visible
  - invalid
  - invalid+focus-visible
  - disabled
  - read-only
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
  root.border-readonly: color.border.divider
  root.bg-readonly: color.surface.canvas
  input.text: color.text.default
  input.text-disabled: color.text.disabled
  input.caret: color.code.caret
  unit.text: color.text.muted
  unit.border: color.border.divider
  action.text: color.action.tertiary.text
  action.bg-hover: color.action.tertiary.hover-bg
  action.border: color.border.divider
  label.text: color.text.bright
  help.text: color.text.muted
  message.text: color.status.danger.text
stateTokens:
  default: { fg: color.text.default, bg: color.surface.input, border: color.border.control }
  hover: { fg: color.text.default, bg: color.interaction.hover.bg, border: color.border.control }
  focus-visible: { fg: color.text.default, bg: color.surface.input, border: color.border.active, outline: color.interaction.focus.ring }
  invalid: { fg: color.text.default, bg: color.surface.input, border: color.status.danger.border }
  invalid+focus-visible: { fg: color.text.default, bg: color.surface.input, border: color.status.danger.border, outline: color.interaction.focus.ring-container }
  read-only: { fg: color.text.default, bg: color.surface.canvas }
contrast:
  - { fg: color.text.muted, bg: color.surface.input, label: "unit affix on the input surface" }
  - { fg: color.action.tertiary.text, bg: color.surface.input, label: "stepper glyphs on the input surface" }
  - { fg: color.action.tertiary.text, bg: color.action.tertiary.hover-bg, state: hover, label: "stepper glyphs on their hover fill" }
  - { fg: color.status.danger.text, bg: color.surface.default, label: "validation message on the panel surface" }
  - { fg: color.text.muted, bg: color.surface.default, label: "help text on the panel surface" }
  - { fg: color.text.disabled, bg: color.interaction.disabled.bg, min: 3, kind: ui, state: disabled, label: "disabled text (exempt; house floor 3:1)" }
  - { fg: color.border.disabled, bg: color.interaction.disabled.bg, min: 1, kind: ui, state: disabled, label: "disabled border (exempt)", waiver: "disabled controls are exempt from 1.4.11" }
  - { fg: color.border.divider, bg: color.surface.input, min: 1, kind: ui, label: "affix and stepper dividers (decorative)", waiver: "the dividers separate parts inside one control box; the control boundary is border.control" }
  - { fg: color.border.divider, bg: color.surface.canvas, min: 1, kind: ui, state: read-only, label: "read-only bottom edge (decorative; the field has no box)", waiver: "read-only fields are identified by the readonly attribute and the absence of a box, not by this edge" }
anatomy:
  - part: label
    description: Always above the control.
  - part: root
    description: The control box, 1px border.control on surface.input, height from the density mode.
  - part: input
    description: The native number input with the host spinner removed; digits right-aligned, tabular-nums, caret code.caret.
  - part: unit
    description: Optional unit text in text.muted after the digits, separated by a divider rule; aria-hidden, the unit is also in the label or help.
  - part: stepper
    description: Two square buttons, + above −, each half the control height, divided by 1px border.divider; separate tab stops after the input.
  - part: help
    description: Below the control in text.muted; states the range and step.
  - part: message
    description: The validation message with the ✕ glyph; linked by aria-describedby.
keyboard:
  - key: Tab / Shift+Tab
    action: Input, then the increase button, then the decrease button.
  - key: Up / Down
    action: Steps by the step attribute (native); Shift+Up / Shift+Down step by ten where the host binds it.
  - key: Page Up / Page Down
    action: Steps by ten times the step where the host binds it.
  - key: Home / End
    action: Jumps to min or max where the host binds it.
responsive: Fills its field container with min-width 0; the digits column shrinks first, the unit and stepper never wrap. RTL keeps digits left-to-right inside the input and mirrors the unit and stepper to the inline end.
portability:
  web: native <input type="number"> with min, max and step; the host spinner is hidden and replaced with two <button type="button"> steppers labelled "Increase <label>" and "Decrease <label>" that call stepUp and stepDown; inputmode="decimal" where fractions are allowed.
  nativeFallbacks:
    - GTK4 SpinButton with square buttons through CSS.
    - Qt QSpinBox or QDoubleSpinBox stylesheet with the up and down subcontrols.
    - "Terminal UI: digits in a box; + and − keys step; the unit in dim text."
fixtures: [FX-LONG, FX-320, FX-ZOOM-200, FX-I18N, FX-RTL, FX-RM, FX-HC, FX-TOUCH, FX-DENSITY, FX-STATE-MATRIX]
related: [text-field, field, range, search-field]
specimens: [settings-panel, admin-form]
keywords: [number, numeric, stepper, spinbutton, unit, increment, input]
sources: [j3w1-web]
compact: false
---

## Purpose

Entering a bounded number: a gap in pixels, a timeout in milliseconds, a
count. The theme replaces the host spinner, which is tiny and inconsistent,
with two square buttons that are real tab stops. Free-form numeric text such
as a version or an identifier is a text field with `inputmode`.

## Anatomy

Label above; the box; the input with digits aligned to the end; the
optional unit; the stepper with + over −, each button half the control
height and at least 24px wide; help stating the range; the validation
message.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | 1px {color.border.control} on {color.surface.input}; digits {color.text.default}; unit {color.text.muted}; stepper glyphs {color.action.tertiary.text} | — |
| hover | background → {color.interaction.hover.bg}; a hovered stepper button → {color.action.tertiary.hover-bg} | cursor: text on the input, pointer on the buttons |
| focus-visible | border → {color.border.active}; ring 1px dashed {color.interaction.focus.ring} at −2px on the box, or on the focused stepper button | the ring |
| invalid | border 2px {color.status.danger.border}; message with the ✕ glyph | border width 1 → 2px; glyph; `aria-invalid` |
| invalid+focus-visible | the 2px danger border and the ring in {color.interaction.focus.ring-container} at −4px | double boundary |
| disabled | text, unit and glyphs {color.text.disabled}; border {color.border.disabled}; background {color.interaction.disabled.bg}; buttons disabled | `disabled`; cursor: not-allowed |
| read-only | no box: 1px dotted {color.border.divider} bottom edge on {color.surface.canvas}; the stepper is hidden | `readonly`; dotted edge; no buttons |

Precedence: disabled > invalid > hover; focus-visible is always drawn.

## Keyboard

Native arrow stepping inside the input; the stepper buttons are ordinary
buttons after it in the tab order and call `stepUp()` / `stepDown()`.
Typing a value outside the range is allowed and reported as invalid on
blur or submit, never clamped silently.

## Accessibility

A programmatic label is required. The unit is `aria-hidden` and repeated in
the label or help ("Inner gap (px)"), so it is never lost. Stepper buttons
are named "Increase <label>" and "Decrease <label>". Help states min, max
and step before the user types. `aria-invalid` only after interaction or
submit. Contrast: digits 8.65:1, unit 5.81:1, glyphs 8.65:1, control border
4.45:1, invalid border 4.69:1.

## Portability

The text field's box plus two buttons; the host spinner is hidden with the
engine's pseudo-elements and `appearance: textfield`. Hosts whose spin
buttons cannot be replaced style them square in the same colours and record
it.

## Non-examples

The host's default spinner. Round or overlapping stepper buttons. A value
clamped silently on blur. Left-aligned digits. A unit typed into the value.
A number field for phone numbers, postcodes or identifiers. Invalid shown by
colour alone. Disabling by opacity.
