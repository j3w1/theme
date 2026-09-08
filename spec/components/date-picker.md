---
id: date-picker
name: Date picker
family: forms-advanced
maturity: stable
priority: R1
since: 0.1.0
order: 20
summary: A themed date editor and calendar, alone or as a from/to pair, backed by native form values and constraints.
native: false
aria:
  pattern: Labeled textbox with calendar dialog and roving date grid; native backing input
  apg: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/
variants:
  - id: default
    name: Single date
  - id: range
    name: From / to
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
  calendar.bg: color.surface.raised
  calendar.border: color.border.overlay
  calendar.text: color.text.default
  calendar.selected-bg: color.interaction.selection.bg
  calendar.selected-text: color.interaction.selection.text
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
  read-only:
    fg: color.text.default
    bg: color.surface.canvas
contrast:
  - fg: color.status.danger.text
    bg: color.surface.canvas
    label: validation message on the canvas
  - fg: color.text.muted
    bg: color.surface.canvas
    label: help text and the range separator on the canvas
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
  - fg: color.border.divider
    bg: color.surface.canvas
    min: 1
    kind: ui
    state: read-only
    label: read-only bottom edge (decorative; the field has no box)
    waiver: read-only fields are identified by the readonly attribute and the absence of a box, not by this edge
  - fg: color.text.default
    bg: color.surface.raised
    label: calendar text
  - fg: color.interaction.selection.text
    bg: color.interaction.selection.bg
    label: selected date
anatomy:
  - part: label
    description: Above the control; for the range, a legend names the pair and each input keeps its own label.
  - part: root
    description: The control box, 1px border.control on surface.input, height from the density mode.
  - part: input
    description: Themed text editor with YYYY-MM-DD format hint; a calendar button opens theme-owned dates. The original native date input owns form values.
  - part: separator
    description: The en dash between from and to in text.muted, hidden from assistive technology.
  - part: help
    description: Below the control in text.muted; states the expected format when the host shows a text field.
  - part: message
    description: The validation message with the ✕ glyph in status.danger.text; linked by aria-describedby.
keyboard:
  - key: Tab / Shift+Tab
    action: Moves through the editor, calendar trigger and other controls.
  - key: Alt+Down
    action: Opens the calendar from the editor.
  - key: Arrows / Home / End
    action: Moves among dates; Home and End reach the beginning and end of the week.
  - key: PageUp / PageDown
    action: Moves to the previous or next month.
  - key: Enter / Space
    action: Chooses a focused calendar date or activates a month button.
  - key: Escape
    action: Closes the calendar and returns focus to the editor.
responsive: The box fills its field container with min-width 0; the range pair sits side by side and wraps to two rows below 320px; the label is always stacked above. RTL keeps the from/to order of reading and mirrors the separator.
portability:
  web: Theme-owned editor and calendar backed by a native date input. Keep native min/max/step, labels, form ownership and reset. Without JavaScript the original native control is visible.
  nativeFallbacks:
    - GTK4 Calendar in a Popover opened from an Entry; the entry carries the field styling.
    - Qt QDateEdit with calendarPopup; the popup frame through the QCalendarWidget stylesheet.
    - "Terminal UI: a masked line editor (YYYY-MM-DD); no popup."
fixtures:
  - FX-LONG
  - FX-320
  - FX-ZOOM-200
  - FX-I18N
  - FX-RTL
  - FX-RM
  - FX-HC
  - FX-STATE-MATRIX
related:
  - text-field
  - time-picker
  - field
  - fieldset
specimens:
  - admin-form
  - filterable-table
keywords:
  - date
  - calendar
  - range
  - from
  - to
  - input
  - form
sources:
  - j3w1-web
compact: false
---

## Purpose

Choose a date by explicit text entry or a themed calendar. A range is two separately labeled date controls. D-025 requires theme-owned web controls rather than browser popup styling.

## Anatomy

A label, editor, calendar trigger, format hint and validation message. The native date input remains the successful form control and owns its value, defaults and constraints. It is hidden only after enhancement.

## States

| State | Treatment |
| --- | --- |
| default | Input surface, default text and control border. |
| hover | The declared hover fill. |
| focus-visible | Active border and the canonical focus ring. |
| invalid | Danger border and a linked message. |
| invalid+focus-visible | Danger border plus the container focus ring. |
| disabled | Disabled colors; editor and calendar actions unavailable. |
| read-only | Readable canvas text and bottom edge; calendar action unavailable. |

Use the declared state tokens: default input surface and control border; hover fill; the canonical focus ring; danger border and message for invalid input; disabled colors and unavailable actions. Read-only values remain readable and cannot open a picker or change through step buttons. The date read-only treatment retains the canvas surface and unobtrusive bottom edge.

## Keyboard

Alt+Down opens the calendar. Arrows move by a day or week, Home/End reach week boundaries, and PageUp/PageDown change months. Enter/Space chooses a focused date. Escape closes and restores editor focus. Tab leaves normally; the calendar is a nonmodal popup.

## Accessibility

The visible editor receives the original label, descriptions, required state and error state. Format hints are always available. Native min, max, step and required constraints remain authoritative. Invalid entry focuses the visible editor and exposes a theme-owned message. Calendar selection is a fill; keyboard focus is a separate ring. Disabled dates cannot be selected. The range validates that its end is not before its start. Form reset restores the native defaults.

Automated evidence records its actual browser, states and limitations; it is not a manual screen-reader acceptance.

## Portability

The package and complete copy distribution include the renderer. The public control enhancement applies the same behavior to existing native markup. The no-JavaScript fallback and non-web platform mappings remain native.

## Non-examples

An unthemed host popup presented as fully themed. A second named input that duplicates form values. Discarding native constraints, labels or reset behavior. Literal colors, rounded corners, or a selected fill with no distinguishable focus boundary.
