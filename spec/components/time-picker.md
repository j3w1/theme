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

Enter a time explicitly or adjust it using themed step buttons. D-025 requires theme-owned web controls rather than browser popup styling.

## Anatomy

A label, editor, increase/decrease buttons, format hint and validation message. The native time input remains the successful form control and owns its value, defaults and constraints. It is hidden only after enhancement.

## States

| State | Treatment |
| --- | --- |
| default | Input surface, default text and control border. |
| hover | The declared hover fill. |
| focus-visible | Active border and the canonical focus ring. |
| invalid | Danger border and a linked message. |
| disabled | Disabled colors; editor and step actions unavailable. |

Use the declared state tokens: default input surface and control border; hover fill; the canonical focus ring; danger border and message for invalid input; disabled colors and unavailable actions. Read-only values remain readable and cannot open a picker or change through step buttons. The date read-only treatment retains the canvas surface and unobtrusive bottom edge.

## Keyboard

Type HH:MM or HH:MM:SS in the editor. Tab reaches the named step buttons; Enter/Space activates them. Each step uses the native input step attribute. With step="any", use direct entry and the step buttons remain unavailable.

## Accessibility

The visible editor receives the original label, descriptions, required state and error state. Format hints are always available. Native min, max, step and required constraints remain authoritative. Invalid entry focuses the visible editor and exposes a theme-owned message. No host clock popup or browser segment selection is used in the enhanced control. Form reset restores the native defaults.

Automated evidence records its actual browser, states and limitations; it is not a manual screen-reader acceptance.

## Portability

The package and complete copy distribution include the renderer. The public control enhancement applies the same behavior to existing native markup. The no-JavaScript fallback and non-web platform mappings remain native.

## Non-examples

An unthemed host popup presented as fully themed. A second named input that duplicates form values. Discarding native constraints, labels or reset behavior. Literal colors, rounded corners, or a selected fill with no distinguishable focus boundary.
