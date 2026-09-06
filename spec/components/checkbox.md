---
id: checkbox
name: Checkbox
family: forms-basic
maturity: stable
priority: R1
since: 0.1.0
order: 50
summary: The native checkbox drawn as a 16px square that fills with the primary action colour and a ✓ or – glyph; single, or a fieldset group of independent choices.
native: true
aria:
  pattern: native <input type="checkbox"> with <label>; fieldset and legend for a group
  apg: https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/
variants:
  - id: default
    name: Single
  - id: group
    name: Group
    description: A fieldset of three independent options under one legend.
sizes: [compact, comfortable]
states:
  - default
  - hover
  - focus-visible
  - checked
  - mixed
  - checked+focus-visible
  - checked+disabled
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
  box.glyph: color.action.primary.text
  box.ring-checked: color.interaction.focus.ring-container
  box.border-invalid: color.status.danger.border
  box.bg-disabled: color.interaction.disabled.bg
  box.border-disabled: color.border.disabled
  box.glyph-disabled: color.text.disabled
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
  mixed: { fg: color.action.primary.text, bg: color.action.primary.bg }
  checked+focus-visible: { fg: color.action.primary.text, bg: color.action.primary.bg, outline: color.interaction.focus.ring-container }
  invalid: { bg: color.surface.input, border: color.status.danger.border }
  required: { bg: color.surface.input, border: color.border.control }
contrast:
  - { fg: color.text.default, bg: color.surface.default, label: "option text on the panel surface" }
  - { fg: color.text.bright, bg: color.surface.default, label: "legend on the panel surface" }
  - { fg: color.border.control, bg: color.surface.default, min: 3, kind: ui, state: checked, label: "checked box edge against the panel (the border stays border.control)" }
  - { fg: color.action.primary.text, bg: color.action.primary.hover-bg, state: hover, label: "glyph on the hovered checked fill" }
  - { fg: color.status.danger.text, bg: color.surface.default, label: "validation message on the panel surface" }
  - { fg: color.text.disabled, bg: color.surface.default, min: 3, kind: ui, state: disabled, label: "disabled option text (exempt; house floor 3:1)" }
  - { fg: color.text.disabled, bg: color.interaction.disabled.bg, min: 3, kind: ui, state: checked+disabled, label: "disabled glyph (exempt; house floor 3:1)" }
  - { fg: color.border.disabled, bg: color.interaction.disabled.bg, min: 1, kind: ui, state: disabled, label: "disabled border (exempt)", waiver: "disabled controls are exempt from 1.4.11" }
anatomy:
  - part: root
    description: The wrapper (a div for one option, a fieldset for a group); stacks options with a 4px gap.
  - part: legend
    description: Group heading in text.bright; carries the required mark for the group.
  - part: option
    description: A <label> row of at least 24px containing the control and its text; the whole row is the target.
  - part: control
    description: A 16px square grid stacking the native input and the two glyph SVGs.
  - part: input
    description: The native input with appearance none, drawn as the box; 1px border.control on surface.input, radius 0.
  - part: check / dash
    description: Inline SVG ✓ and – glyphs in action.primary.text, 1.5px stroke; shown for checked and indeterminate.
  - part: text
    description: The option text in text.default; wraps under itself, never under the box.
  - part: message
    description: The validation message with the ✕ glyph; linked by aria-describedby on the input or fieldset.
keyboard:
  - key: Tab / Shift+Tab
    action: Moves through every checkbox; each is its own tab stop.
  - key: Space
    action: Toggles; a mixed box becomes checked.
responsive: The row wraps its text under itself with the box staying top-aligned; groups stack vertically at every width. RTL mirrors the box to the inline start of the text.
portability:
  web: native <input type="checkbox"> inside <label>; indeterminate through the DOM property with the host reflecting it as data-state-mixed for styling; groups in <fieldset> with <legend>; never role="checkbox" on a div.
  nativeFallbacks:
    - GTK4 CheckButton; inconsistent for mixed.
    - Qt QCheckBox with tristate; indicator subcontrol styled square.
    - "Terminal UI: [x], [ ] and [-] glyphs; the box inverted when focused."
fixtures: [FX-LONG, FX-320, FX-ZOOM-200, FX-I18N, FX-RTL, FX-RM, FX-HC, FX-TOUCH, FX-DENSITY, FX-STATE-MATRIX]
related: [radio-group, switch, fieldset, field, list]
specimens: [settings-panel, admin-form, filterable-table]
keywords: [checkbox, check, toggle, mixed, indeterminate, group, choice]
sources: [j3w1-web]
compact: true
---

## Purpose

An independent yes/no choice, or several of them under one legend. A
setting that takes effect immediately is a switch; one of several exclusive
options is a radio group. A parent checkbox over a partly selected set shows
the mixed state.

## Anatomy

The box is the native input itself with `appearance: none`, so it keeps
native focus, form and keyboard behaviour. The ✓ and – glyphs are inline
SVGs stacked over it in the same 16px cell. The option row is a `<label>`,
at least 24px tall, which makes the text part of the target. A group is a
`<fieldset>` with a `<legend>`.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | 16px box, 1px {color.border.control} on {color.surface.input}; text {color.text.default} | — |
| hover | box background → {color.interaction.hover.bg}; checked box → {color.action.primary.hover-bg} | cursor: pointer; hover-capable pointers only |
| focus-visible | ring 1px dashed {color.interaction.focus.ring} at −2px around the box | the ring |
| checked | box fills {color.action.primary.bg}; ✓ in {color.action.primary.text}; border stays {color.border.control} | the ✓ glyph; `checked` |
| mixed | box fills {color.action.primary.bg}; – in {color.action.primary.text} | the – glyph; `indeterminate` / `aria-checked="mixed"` |
| checked+focus-visible | the fill and a ring in {color.interaction.focus.ring-container} | glyph and ring |
| checked+disabled | box {color.interaction.disabled.bg} with 1px {color.border.disabled}; ✓ and text in {color.text.disabled} | glyph; `disabled`; cursor: not-allowed |
| disabled | box {color.interaction.disabled.bg} with 1px {color.border.disabled}; text {color.text.disabled} | `disabled`; cursor: not-allowed |
| invalid | box border 2px {color.status.danger.border}; message with the ✕ glyph | border width 1 → 2px; glyph; `aria-invalid` |
| required | `*` after the text or legend in {color.status.danger.text} plus visually hidden "required" | `required`; the mark |

Precedence: disabled > invalid > checked > hover; focus-visible is always
drawn.

## Keyboard

Native. Space toggles; Enter does nothing. Every checkbox in a group is a
separate tab stop, unlike radios. A mixed parent becomes checked on the
first Space and unchecked on the second, never mixed again by keyboard.

## Accessibility

The text is the label through the wrapping `<label>`; a group has its
legend read before each option. `indeterminate` is a DOM property with no
attribute, so the host mirrors it to `data-state-mixed` for styling and the
state reads as "mixed" natively. A required group marks the legend, not
every option, and validates on submit. Contrast: text 8.43:1, glyph 8.17:1
on the fill, box edge 4.45:1 on the input surface and 4.33:1 against the
panel when checked, ring 4.69:1, container ring 4.90:1 on the fill.

## Portability

A square with a border and a fill plus two glyphs. Hosts that draw their own
indicator set it square, 16px, and use the same fill and glyph colours; a
host without a mixed indicator draws the dash itself or records the gap.

## Non-examples

Rounded or circular boxes. A tick drawn with a border trick or an icon
font. A checked state shown by border colour alone with no glyph. A box
smaller than 16px or a row shorter than 24px. The mixed state used as a
third value. A checkbox that saves on change. Disabling by opacity. A div
with `role="checkbox"`.
