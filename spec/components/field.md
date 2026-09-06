---
id: field
name: Field
family: forms-basic
maturity: stable
priority: R1
since: 0.1.0
order: 10
summary: The label, control, help and message wrapper that every form control sits in; it fixes the stacking order, the required mark, the description links and the invalid message.
native: true
aria:
  pattern: native <label for> with aria-describedby on the control
  apg: https://www.w3.org/WAI/ARIA/apg/practices/forms/
variants:
  - id: default
    name: Default
    description: Label above, one control, help below, message when invalid.
sizes: [compact, comfortable]
states: [default, required, invalid, disabled]
tokens:
  root.text: color.text.default
  label.text: color.text.bright
  label.required-mark: color.status.danger.text
  control.bg: color.surface.input
  control.border: color.border.control
  control.border-invalid: color.status.danger.border
  control.text-disabled: color.text.disabled
  control.bg-disabled: color.interaction.disabled.bg
  control.border-disabled: color.border.disabled
  help.text: color.text.muted
  message.text: color.status.danger.text
stateTokens:
  default: { fg: color.text.bright, bg: color.surface.default }
  required: { fg: color.status.danger.text, bg: color.surface.default }
  invalid: { fg: color.status.danger.text, bg: color.surface.default }
contrast:
  - { fg: color.text.muted, bg: color.surface.default, label: "help text on the panel surface" }
  - { fg: color.text.muted, bg: color.surface.canvas, label: "help text on the canvas" }
  - { fg: color.text.disabled, bg: color.surface.default, min: 3, kind: ui, state: disabled, label: "disabled label (exempt; house floor 3:1)" }
  - { fg: color.text.disabled, bg: color.interaction.disabled.bg, min: 3, kind: ui, state: disabled, label: "disabled control text (exempt; house floor 3:1)" }
  - { fg: color.border.disabled, bg: color.interaction.disabled.bg, min: 1, kind: ui, state: disabled, label: "disabled border (exempt)", waiver: "disabled controls are exempt from 1.4.11" }
anatomy:
  - part: root
    description: A block that stacks its children with a 4px gap; max-width 28rem; no border, no background.
  - part: label
    description: The <label for> in text.bright, ui-sm; always above the control; carries the required mark.
  - part: required
    description: The `*` in status.danger.text plus a visually hidden "required"; shown when the control is required.
  - part: control
    description: The slot holding exactly one control (text-field, textarea, select, number-field, search-field, a checkbox group, a radio group).
  - part: help
    description: Persistent description below the control in text.muted; stays in the DOM when a message replaces it visually.
  - part: message
    description: The validation message with the ✕ glyph in status.danger.text; linked by aria-describedby after the help.
keyboard:
  - key: Tab / Shift+Tab
    action: Reaches the control; the label is not a tab stop.
responsive: Fills its container with min-width 0; at 320px label, control, help and message stack without clipping; long labels wrap. RTL keeps the stack and mirrors the required mark to the label's end.
portability:
  web: <div> wrapper with <label for>, the control, <p> help and <p> message; aria-describedby lists help then message; aria-invalid on the control only after interaction or submit; groups use fieldset and legend instead of label.
  nativeFallbacks:
    - GTK4 Box with a Label, the control and a caption-style Label.
    - Qt QFormLayout row with a QLabel buddy.
    - "Terminal UI: label line, control line, dim help line."
fixtures: [FX-LONG, FX-320, FX-ZOOM-200, FX-I18N, FX-RTL, FX-RM, FX-HC, FX-DENSITY, FX-STATE-MATRIX]
related: [text-field, textarea, select, checkbox, radio-group, fieldset, number-field, search-field]
specimens: [admin-form, settings-panel]
keywords: [field, label, help, message, validation, required, describedby]
sources: [j3w1-web]
compact: false
---

## Purpose

The wrapper that gives every control the same label, description and error
treatment. Controls specify their box; the field specifies what sits above
and below it and how they are linked. Every form control in this theme is
rendered inside a field or a fieldset.

## Anatomy

Label above the control, always stacked; the control slot; help text
below in {color.text.muted}; the validation message, which takes the help
slot visually while help stays in the DOM and `aria-describedby` lists both.
The required mark is present in the markup and shown only when the control
is required.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | label {color.text.bright}; help {color.text.muted}; control as its own component | — |
| required | `*` after the label in {color.status.danger.text} plus visually hidden "required" | `required` attribute; the mark |
| invalid | the control's 2px {color.status.danger.border}; message with the ✕ glyph in {color.status.danger.text}; help visually hidden | border width 1 → 2px; glyph; `aria-invalid` |
| disabled | label and control text {color.text.disabled}; control {color.interaction.disabled.bg} with 1px {color.border.disabled}; help unchanged | `disabled`; cursor: not-allowed |

Precedence: disabled > invalid; required is shown in every state.

## Keyboard

The field adds no behaviour. Clicking the label focuses the control
(native `for`). Focus order inside the field is the control's own.

## Accessibility

Every control has a programmatic label; placeholder text is never the
label. Help and message are linked with `aria-describedby` in that order so
the description is read before the error. `aria-invalid="true"` is set only
after interaction or submit. The message keeps its glyph so the state is not
colour-only. Contrast: label 10.10:1, help 5.66:1, message 5.26:1 on the
panel surface; disabled label 3.24:1 (exempt).

## Portability

Plain block layout; the only pseudo-element is nothing, the mark is real
markup. Hosts without `aria-describedby` put help and message in the
control's tooltip or accessible description and record it.

## Non-examples

A floating label inside the control. A label to the left of the control.
Placeholder text as the only label. An error shown by a red border alone. A
message that replaces the help text in the DOM. A required mark that is only
a colour change. An asterisk with no text alternative. Two controls in one
field.
