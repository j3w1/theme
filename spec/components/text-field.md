---
id: text-field
name: Text field
family: forms-basic
maturity: stable
priority: R1
since: 0.1.0
order: 20
summary: Single-line free-text entry, covering every native input type that renders as a line box; search, number and password are variants, not separate components.
native: true
aria:
  pattern: native <input> with <label>
  apg: https://www.w3.org/WAI/ARIA/apg/practices/forms/
variants:
  - id: default
    name: Text
  - id: password
    name: Password with reveal
  - id: search
    name: Search with clear
  - id: number
    name: Number with stepper
  - id: affix
    name: With prefix and suffix
sizes: [compact, comfortable]
states:
  - default
  - hover
  - focus-visible
  - placeholder-shown
  - filled
  - required
  - invalid
  - invalid+focus-visible
  - invalid+hover
  - disabled
  - disabled+filled
  - read-only
  - read-only+focus-visible
  - loading
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
  input.text: color.text.default
  input.text-disabled: color.text.disabled
  input.placeholder: color.text.placeholder
  input.caret: color.code.caret
  input.selection-bg: color.interaction.text-selection.bg
  input.selection-text: color.interaction.text-selection.text
  label.text: color.text.bright
  label.required-mark: color.status.danger.text
  help.text: color.text.muted
  message.text: color.status.danger.text
  affix.text: color.text.muted
  affix.border: color.border.divider
  action.text: color.action.tertiary.text
  action.bg-hover: color.action.tertiary.hover-bg
  loading.glyph: color.text.muted
stateTokens:
  default: { fg: color.text.default, bg: color.surface.input, border: color.border.control }
  hover: { fg: color.text.default, bg: color.interaction.hover.bg, border: color.border.control }
  focus-visible: { fg: color.text.default, bg: color.surface.input, border: color.border.active, outline: color.interaction.focus.ring }
  placeholder-shown: { fg: color.text.placeholder, bg: color.surface.input, border: color.border.control }
  invalid: { fg: color.text.default, bg: color.surface.input, border: color.status.danger.border }
  invalid+focus-visible: { fg: color.text.default, bg: color.surface.input, border: color.status.danger.border, outline: color.interaction.focus.ring-container }
  read-only: { fg: color.text.default, bg: color.surface.canvas }
contrast:
  - { fg: color.status.danger.text, bg: color.surface.default, label: "validation message on the panel surface" }
  - { fg: color.text.muted, bg: color.surface.default, label: "help text on the panel surface" }
  - { fg: color.text.disabled, bg: color.interaction.disabled.bg, min: 3, kind: ui, state: disabled, label: "disabled text (exempt; house floor 3:1)" }
  - { fg: color.border.disabled, bg: color.interaction.disabled.bg, min: 1, kind: ui, state: disabled, label: "disabled border (exempt)", waiver: "disabled controls are exempt from 1.4.11" }
  - { fg: color.border.divider, bg: color.surface.canvas, min: 1, kind: ui, state: read-only, label: "read-only bottom edge (decorative; the field has no box)", waiver: "read-only fields are identified by the readonly attribute and the absence of a box, not by this edge" }
anatomy:
  - part: label
    description: Always above the control; carries the required mark.
  - part: root
    description: The control box, 1px border.control on surface.input, height from the density mode.
  - part: prefix / suffix
    description: Optional affixes inside the box, separated by a divider, in text.muted.
  - part: input
    description: The native input; text.default, caret code.caret, ::selection from the interaction roles.
  - part: clear / reveal / stepper
    description: Optional trailing actions; separate tab stops after the input.
  - part: help
    description: Below the control in text.muted; stays in the DOM when a message replaces it visually.
  - part: message
    description: The validation message with the ✕ glyph in status.danger.text; linked by aria-describedby.
keyboard:
  - key: Tab / Shift+Tab
    action: Moves focus in and out; affix actions (clear, reveal, stepper) are separate tab stops after the input.
  - key: Escape
    action: Clears the value in the search variant when it is non-empty; otherwise nothing.
  - key: Enter
    action: Submits the owning form (native).
  - key: Up / Down
    action: Number variant steps by the step attribute; Shift multiplies by ten.
responsive: Fills its field container with min-width 0; affixes never wrap; the label is always stacked above (no inline labels in this theme); at 320px the box, help and message stack without clipping. RTL swaps prefix and suffix.
portability:
  web: native <input> plus <label>, no wrapper role; help and message via aria-describedby in that order; aria-invalid only after interaction or submit; the dashed ring through outline, never box-shadow.
  nativeFallbacks:
    - GTK4 Entry with a css-name mapping; invalid through the .error style class.
    - Qt QLineEdit stylesheet; invalid through a dynamic property selector.
    - "Terminal UI: 1-cell border glyphs; focus as dashed box-drawing; invalid as a 2-cell double line."
fixtures: [FX-LONG, FX-320, FX-360, FX-ZOOM-200, FX-I18N, FX-RTL, FX-RM, FX-HC, FX-TOUCH, FX-DENSITY, FX-STATE-MATRIX]
related: [textarea, select, combobox, search-field, number-field, field]
specimens: [admin-form, settings-panel]
keywords: [input, textbox, form, entry, password, search, number, affix, validation]
sources: [j3w1-web]
compact: true
---

## Purpose

Single-line free-text entry. Every native `type` that renders as a line box
(`text`, `password`, `search`, `number`, `email`, `url`, `tel`) is this
component; date and time inputs are the date-picker and time-picker
components because their popups are host surfaces.

## Anatomy

Label above the control; the control box; optional prefix and suffix inside
the box separated by a {color.border.divider} rule; the input; optional
trailing actions (clear, reveal, stepper); help text below; the validation
message, which takes the help slot visually while help stays in the DOM and
`aria-describedby` lists both.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | 1px {color.border.control} on {color.surface.input}; text {color.text.default} | — |
| hover | background → {color.interaction.hover.bg}; border unchanged | cursor: text |
| focus-visible | border → {color.border.active}; ring 1px dashed {color.interaction.focus.ring} at −2px | the ring |
| placeholder-shown | placeholder in {color.text.placeholder}, italic | italic |
| filled | as default with a value | — |
| required | `*` after the label in {color.status.danger.text} plus visually hidden "required" | `required` attribute; the mark |
| invalid | border 2px {color.status.danger.border}; message with the ✕ glyph | border width 1 → 2px; glyph; `aria-invalid` |
| invalid+focus-visible | the 2px danger border and the ring in {color.interaction.focus.ring-container} at −4px | double boundary |
| invalid+hover | as invalid with the hover background | cursor |
| disabled | text {color.text.disabled}; border {color.border.disabled}; background {color.interaction.disabled.bg}; no hover | `disabled`; cursor: not-allowed |
| disabled+filled | as disabled with a value | `disabled` |
| read-only | no box: 1px dotted {color.border.divider} bottom edge on {color.surface.canvas}; text {color.text.default}; focusable and selectable | `readonly`; dotted edge |
| read-only+focus-visible | the dotted edge and the dashed ring | the ring |
| loading | size unchanged; trailing static `⋯` glyph in {color.text.muted}; input remains editable | glyph; `aria-busy` |

Precedence when several apply: disabled > loading > invalid > hover;
focus-visible is always drawn.

## Keyboard

Focus order is label (not focusable) → input → clear or reveal → stepper
buttons. The clear button is `type="button"` with `aria-label="Clear <label>"`;
the reveal button toggles `type` between `password` and `text` and its own
`aria-pressed`. Escape in the search variant clears a non-empty value.

## Accessibility

A programmatic label is required (`<label for>`). Help and message are linked
through `aria-describedby` in that order. `aria-invalid="true"` is set only
after the user interacted with the field or submitted the form, never on first
paint. The message is announced on submit through the form's live region, not
on every keystroke. Contrast: text 8.65:1 on the input surface, placeholder
5.81:1, disabled text 3.33:1 (exempt), control border 4.45:1 (≥ 3:1), invalid
border 4.69:1, danger message 5.40:1. The box is at least 24×24 CSS pixels in
`compact` density.

## Portability

Everything is expressible with border, background and outline; the only
pseudo-element is the required mark. Toolkits without dashed outlines draw a
solid 1px ring in the same colour and record the deviation. Toolkits without a
read-only style treat read-only as default text and record it.

## Non-examples

Rounded corners. A floating or animated label. An underline-only field with no
box. A glow instead of the dashed ring. Placeholder text in red. Disabling by
opacity. Using colour alone for the invalid state. A hover that changes the
text colour.
