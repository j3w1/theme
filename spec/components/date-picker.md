---
id: date-picker
name: Date picker
family: forms-advanced
maturity: stable
priority: R1
since: 0.1.0
order: 20
summary: A native date input, alone or as a from/to pair; the calendar popup belongs to the host and is styled only through color-scheme.
native: true
aria:
  pattern: "native <input type=date> with <label>; a from/to pair inside a <fieldset>"
  apg: https://www.w3.org/WAI/ARIA/apg/practices/forms/
variants:
  - id: default
    name: Single date
  - id: range
    name: From / to
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
  label.text: color.text.bright
  legend.text: color.text.bright
  separator.text: color.text.muted
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
  - { fg: color.status.danger.text, bg: color.surface.canvas, label: "validation message on the canvas" }
  - { fg: color.text.muted, bg: color.surface.canvas, label: "help text and the range separator on the canvas" }
  - { fg: color.text.disabled, bg: color.interaction.disabled.bg, min: 3, kind: ui, state: disabled, label: "disabled text (exempt; house floor 3:1)" }
  - { fg: color.border.disabled, bg: color.interaction.disabled.bg, min: 1, kind: ui, state: disabled, label: "disabled border (exempt)", waiver: "disabled controls are exempt from 1.4.11" }
  - { fg: color.border.divider, bg: color.surface.canvas, min: 1, kind: ui, state: read-only, label: "read-only bottom edge (decorative; the field has no box)", waiver: "read-only fields are identified by the readonly attribute and the absence of a box, not by this edge" }
anatomy:
  - part: label
    description: Above the control; for the range, a legend names the pair and each input keeps its own label.
  - part: root
    description: The control box, 1px border.control on surface.input, height from the density mode.
  - part: input
    description: The native date input; text.default with tabular figures; the host draws the calendar.
  - part: separator
    description: The en dash between from and to in text.muted, hidden from assistive technology.
  - part: help
    description: Below the control in text.muted; states the expected format when the host shows a text field.
  - part: message
    description: The validation message with the ✕ glyph in status.danger.text; linked by aria-describedby.
keyboard:
  - key: Tab / Shift+Tab
    action: Moves between the date segments and then out of the control (host behaviour); the range pair is two tab stops.
  - key: Up / Down
    action: Steps the focused segment (host behaviour).
  - key: Space / Alt+Down
    action: Opens the host calendar where one exists; Escape closes it.
  - key: Enter
    action: Submits the owning form (native).
responsive: The box fills its field container with min-width 0; the range pair sits side by side and wraps to two rows below 320px; the label is always stacked above. RTL keeps the from/to order of reading and mirrors the separator.
portability:
  web: "native <input type=date>; hosts without a date type fall back to a text field with a pattern and a format hint in the help text; color-scheme dark keeps the host popup on a dark surface."
  nativeFallbacks:
    - GTK4 Calendar in a Popover opened from an Entry; the entry carries the field styling.
    - Qt QDateEdit with calendarPopup; the popup frame through the QCalendarWidget stylesheet.
    - "Terminal UI: a masked line editor (YYYY-MM-DD); no popup."
fixtures: [FX-LONG, FX-320, FX-ZOOM-200, FX-I18N, FX-RTL, FX-RM, FX-HC, FX-STATE-MATRIX]
related: [text-field, time-picker, field, fieldset]
specimens: [admin-form, filterable-table]
keywords: [date, calendar, range, from, to, input, form]
sources: [j3w1-web]
compact: false
---

## Purpose

Entry of a calendar date, alone or as a from/to pair. The control is the
native date input so the host contributes the calendar, locale, format and
segment editing; the theme styles the box exactly like the text field and
never draws its own grid in the default profile.

## Anatomy

Label above the box; the box; the native input; for the range, a fieldset
whose legend names the pair, two labelled inputs and an en dash separator in
{color.text.muted}; help below; the validation message, which takes the help
slot while help stays in the DOM.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | 1px {color.border.control} on {color.surface.input}; text {color.text.default}, tabular figures | — |
| hover | background → {color.interaction.hover.bg}; border unchanged | cursor: text |
| focus-visible | border → {color.border.active}; ring 1px dashed {color.interaction.focus.ring} at −2px | the ring |
| invalid | border 2px {color.status.danger.border}; message with the ✕ glyph | border width 1 → 2px; glyph; `aria-invalid` |
| invalid+focus-visible | the 2px danger border and the ring in {color.interaction.focus.ring-container} at −4px | double boundary |
| disabled | text {color.text.disabled}; border {color.border.disabled}; background {color.interaction.disabled.bg}; no hover | `disabled`; cursor: not-allowed |
| read-only | no box: 1px dotted {color.border.divider} bottom edge on {color.surface.canvas}; focusable and selectable | `readonly`; dotted edge |

Precedence when several apply: disabled > invalid > hover; focus-visible is
always drawn. In the range pair each input carries its own state; an invalid
range (to before from) marks both inputs and shows one message.

## Keyboard

The host owns segment navigation: Tab or the arrow keys move between year,
month and day, Up and Down step a segment, and Space or Alt+Down opens the
calendar where the host has one. Escape closes the calendar and returns focus
to the segment. The range pair is two ordinary tab stops in reading order.

## Accessibility

A programmatic label is required for every input; the range pair is a
`<fieldset>` with a `<legend>` so the from/to relationship is announced.
Help and message are linked through `aria-describedby`; `aria-invalid` is set
only after interaction or submit. `min` and `max` are stated in the help text
as well as in the attributes. The host calendar is a host surface: the theme
sets `color-scheme: dark` on the input and does not claim its contrast.
Contrast: text 8.65:1 on the input surface, control border 4.45:1, invalid
border 4.69:1, danger message 5.40:1, separator 5.81:1.

## Portability

Everything is expressible with border, background and outline. A custom
calendar grid, where a host must draw one, follows the APG date picker dialog:
a `dialog` with a `grid` of `gridcell` buttons, the selected day in the
selection fill, today with a 1px {color.border.active} ring, the ring for
focus, and Escape to close; it is documented here so ports agree, and it is
not demonstrated in the default profile.

## Non-examples

A custom calendar drawn where the host has one. Rounded corners. An icon-only
calendar button with no text input. Placeholder text pretending to be a
format hint. A floating label. Disabling by opacity. A hover that changes the
text colour. A red border with no message.
