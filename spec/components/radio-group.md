---
id: radio-group
name: Radio group
family: forms-basic
maturity: stable
priority: R1
since: 0.1.0
order: 60
summary: A fieldset of native radios for one exclusive choice; each radio is a 16px square that fills with the primary action colour and an inner square when checked.
native: true
aria:
  pattern: native <input type="radio"> inside <fieldset> with <legend>
  apg: https://www.w3.org/WAI/ARIA/apg/patterns/radio/
variants:
  - id: default
    name: Vertical
  - id: horizontal
    name: Horizontal
    description: Options in a row that wraps; for two or three short labels.
sizes: [compact, comfortable]
states:
  - default
  - hover
  - focus-visible
  - checked
  - checked+focus-visible
  - disabled
  - invalid
  - required
tokens:
  box.bg: color.surface.input
  box.border: color.border.control
  box.bg-hover: color.interaction.hover.bg
  box.ring: color.interaction.focus.ring
  box.bg-checked: color.action.primary.bg
  box.bg-checked-hover: color.action.primary.hover-bg
  box.dot: color.action.primary.text
  box.ring-checked: color.interaction.focus.ring-container
  box.border-invalid: color.status.danger.border
  box.bg-disabled: color.interaction.disabled.bg
  box.border-disabled: color.border.disabled
  box.dot-disabled: color.text.disabled
  text.default: color.text.default
  text.disabled: color.text.disabled
  legend.text: color.text.bright
  legend.required-mark: color.status.danger.text
  message.text: color.status.danger.text
stateTokens:
  default: { bg: color.surface.input, border: color.border.control }
  hover: { bg: color.interaction.hover.bg, border: color.border.control }
  focus-visible: { bg: color.surface.input, border: color.border.control, outline: color.interaction.focus.ring }
  checked: { fg: color.action.primary.text, bg: color.action.primary.bg }
  checked+focus-visible: { fg: color.action.primary.text, bg: color.action.primary.bg, outline: color.interaction.focus.ring-container }
  invalid: { bg: color.surface.input, border: color.status.danger.border }
  required: { bg: color.surface.input, border: color.border.control }
contrast:
  - { fg: color.text.default, bg: color.surface.default, label: "option text on the panel surface" }
  - { fg: color.text.bright, bg: color.surface.default, label: "legend on the panel surface" }
  - { fg: color.border.control, bg: color.surface.default, min: 3, kind: ui, state: checked, label: "checked radio edge against the panel (the border stays border.control)" }
  - { fg: color.action.primary.text, bg: color.action.primary.hover-bg, min: 3, kind: ui, state: hover, label: "inner square on the hovered checked fill" }
  - { fg: color.status.danger.text, bg: color.surface.default, label: "validation message on the panel surface" }
  - { fg: color.text.disabled, bg: color.surface.default, min: 3, kind: ui, state: disabled, label: "disabled option text (exempt; house floor 3:1)" }
  - { fg: color.text.disabled, bg: color.interaction.disabled.bg, min: 3, kind: ui, state: disabled, label: "disabled inner square (exempt; house floor 3:1)" }
  - { fg: color.border.disabled, bg: color.interaction.disabled.bg, min: 1, kind: ui, state: disabled, label: "disabled border (exempt)", waiver: "disabled controls are exempt from 1.4.11" }
anatomy:
  - part: root
    description: The <fieldset>; no border, no padding; stacks legend, options and message with a 4px gap.
  - part: legend
    description: The question in text.bright; carries the required mark.
  - part: options
    description: The option list; a column by default, a wrapping row in the horizontal variant with a 16px gap.
  - part: option
    description: A <label> row of at least 24px containing the control and its text.
  - part: control
    description: A 16px square grid stacking the native input and the inner square.
  - part: input
    description: The native radio with appearance none, drawn as a square box; 1px border.control on surface.input, radius 0.
  - part: dot
    description: An 8px square in action.primary.text centred in the box; shown when checked.
  - part: text
    description: The option text in text.default.
  - part: message
    description: The validation message with the ✕ glyph; linked by aria-describedby on the fieldset.
keyboard:
  - key: Tab / Shift+Tab
    action: Enters the group on the checked radio, or the first when none is checked; leaves it entirely.
  - key: Up / Down / Left / Right
    action: Moves the check to the previous or next radio and selects it (native); wraps at the ends.
  - key: Space
    action: Checks the focused radio when none is checked.
responsive: Vertical groups stack at every width. The horizontal variant wraps into rows at 320px and keeps a 16px gap between options. RTL mirrors the box to the inline start and reverses the row.
portability:
  web: native <input type="radio"> sharing a name, each inside a <label>, all inside <fieldset> with <legend>; never role="radiogroup" on a div when the native group is available; the message is linked from the fieldset.
  nativeFallbacks:
    - GTK4 CheckButton with a group; square indicator through CSS.
    - Qt QRadioButton in a QButtonGroup; indicator subcontrol styled square.
    - "Terminal UI: (o) and ( ) glyphs; arrow keys move the mark."
fixtures: [FX-LONG, FX-320, FX-ZOOM-200, FX-I18N, FX-RTL, FX-RM, FX-HC, FX-TOUCH, FX-DENSITY, FX-STATE-MATRIX]
related: [checkbox, switch, segmented-control, fieldset, field, select]
specimens: [settings-panel, admin-form]
keywords: [radio, group, exclusive, choice, fieldset, legend, option]
sources: [j3w1-web]
compact: true
---

## Purpose

One choice out of a few visible options. Below two options a checkbox or
switch is used; above roughly six, a select. The radios are square, as every
control in this theme is, and are told apart from checkboxes by the inner
square instead of the ✓ glyph and by arrow-key movement instead of separate
tab stops.

## Anatomy

A `<fieldset>` whose `<legend>` asks the question; a list of `<label>` rows
each holding the native input, drawn as a 16px square with `appearance:
none`, and its text; the validation message at the end. The inner square is
a real element stacked over the input in the same cell.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | 16px square, 1px {color.border.control} on {color.surface.input}; text {color.text.default} | — |
| hover | box background → {color.interaction.hover.bg}; a checked box → {color.action.primary.hover-bg} | cursor: pointer; hover-capable pointers only |
| focus-visible | ring 1px dashed {color.interaction.focus.ring} at −2px around the box | the ring |
| checked | box fills {color.action.primary.bg}; an 8px inner square in {color.action.primary.text}; border stays {color.border.control} | the inner square; `checked` |
| checked+focus-visible | the fill and a ring in {color.interaction.focus.ring-container} | inner square and ring |
| disabled | boxes {color.interaction.disabled.bg} with 1px {color.border.disabled}; inner square and text {color.text.disabled} | `disabled`; cursor: not-allowed |
| invalid | every box border 2px {color.status.danger.border}; message with the ✕ glyph | border width 1 → 2px; glyph; `aria-invalid` |
| required | `*` after the legend in {color.status.danger.text} plus visually hidden "required" | `required`; the mark |

Precedence: disabled > invalid > checked > hover; focus-visible is always
drawn.

## Keyboard

Native. The group is one tab stop; the arrow keys move both focus and the
check, so moving through a group changes the value. That is why a radio
group never triggers navigation or a request on change; the value is read on
submit or through an explicit action.

## Accessibility

The legend is read before each option and is the group's name. Options
share a `name`. The message is linked with `aria-describedby` on the
fieldset and `aria-invalid` is set on the inputs after submit. A group with
no default checked radio must have a required mark or a "none" option, so
the empty state is intentional. Contrast: text 8.43:1, inner square 8.17:1
on the fill, box edge 4.45:1 on the input surface and 4.33:1 against the
panel when checked, ring 4.69:1, container ring 4.90:1.

## Portability

Square, border, fill and one inner square; no pseudo-element is needed.
Hosts that insist on a circular radio indicator record the deviation rather
than replacing the control with a custom widget.

## Non-examples

Circular radios. A checked state shown by border colour alone with no inner
square. Radios that submit or navigate on change. A group with no legend or
with the legend rendered as a label on one option. Separate tab stops per
radio. One radio on its own. Disabling by opacity. A div with
`role="radiogroup"` built from spans.
