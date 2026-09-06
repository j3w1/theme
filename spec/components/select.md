---
id: select
name: Select
family: forms-basic
maturity: stable
priority: R1
since: 0.1.0
order: 40
summary: The native single or multiple select in the text-field box with a line-icon chevron; the popup list is host-rendered and outside the theme.
native: true
aria:
  pattern: native <select> with <label>
  apg: https://www.w3.org/WAI/ARIA/apg/practices/forms/
variants:
  - id: default
    name: Single
  - id: with-groups
    name: With option groups
    description: optgroup labels in text.muted.
  - id: multiple
    name: Multiple
    description: An always-open listbox; no chevron.
sizes: [compact, comfortable]
states:
  - default
  - hover
  - focus-visible
  - required
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
  control.text: color.text.default
  control.text-disabled: color.text.disabled
  chevron.stroke: color.icon.default
  option.bg: color.surface.raised
  option.text: color.text.default
  option.bg-selected: color.interaction.selection.bg
  option.text-selected: color.interaction.selection.text
  group.text: color.text.muted
  label.text: color.text.bright
  label.required-mark: color.status.danger.text
  help.text: color.text.muted
  message.text: color.status.danger.text
stateTokens:
  default: { fg: color.text.default, bg: color.surface.input, border: color.border.control }
  hover: { fg: color.text.default, bg: color.interaction.hover.bg, border: color.border.control }
  focus-visible: { fg: color.text.default, bg: color.surface.input, border: color.border.active, outline: color.interaction.focus.ring }
  required: { fg: color.text.default, bg: color.surface.input, border: color.border.control }
  invalid: { fg: color.text.default, bg: color.surface.input, border: color.status.danger.border }
  invalid+focus-visible: { fg: color.text.default, bg: color.surface.input, border: color.status.danger.border, outline: color.interaction.focus.ring-container }
contrast:
  - { fg: color.icon.default, bg: color.surface.input, min: 3, kind: ui, label: "chevron on the input surface" }
  - { fg: color.text.default, bg: color.surface.raised, label: "option text in the host list" }
  - { fg: color.text.muted, bg: color.surface.raised, label: "group label in the host list" }
  - { fg: color.interaction.selection.text, bg: color.interaction.selection.bg, label: "selected option" }
  - { fg: color.status.danger.text, bg: color.surface.default, label: "validation message on the panel surface" }
  - { fg: color.text.muted, bg: color.surface.default, label: "help text on the panel surface" }
  - { fg: color.text.disabled, bg: color.interaction.disabled.bg, min: 3, kind: ui, state: disabled, label: "disabled text (exempt; house floor 3:1)" }
  - { fg: color.border.disabled, bg: color.interaction.disabled.bg, min: 1, kind: ui, state: disabled, label: "disabled border (exempt)", waiver: "disabled controls are exempt from 1.4.11" }
anatomy:
  - part: label
    description: Always above the control; carries the required mark.
  - part: root
    description: The control box, 1px border.control on surface.input, height from the density mode; position relative for the chevron.
  - part: control
    description: The native <select> with appearance none, text.default, padding-inline-end for the chevron; multiple renders an open listbox.
  - part: chevron
    description: A 16px line-icon chevron in icon.default at the inline end; pointer-events none; absent on multiple.
  - part: help
    description: Below the control in text.muted.
  - part: message
    description: The validation message with the ✕ glyph; linked by aria-describedby.
keyboard:
  - key: Tab / Shift+Tab
    action: Moves focus in and out.
  - key: Space / Alt+Down
    action: Opens the host popup (native).
  - key: Up / Down
    action: Moves through options; in the closed single select this changes the value directly.
  - key: Typing
    action: Jumps to the first option starting with the typed characters (native).
  - key: Shift+Up / Shift+Down, Ctrl+click
    action: Extends or toggles the selection in the multiple variant (native).
responsive: Fills its field container with min-width 0; the chevron keeps its 16px slot; long option text truncates inside the box with the native ellipsis. RTL moves the chevron to the inline end.
portability:
  web: native <select> plus <label>; the closed box is styled with appearance none; the open popup is drawn by the host and receives only option and optgroup colours where the engine honours them; never replaced by a custom listbox (that is the combobox component).
  nativeFallbacks:
    - GTK4 DropDown; the popover follows border.overlay on surface.raised.
    - Qt QComboBox stylesheet with the drop-down subcontrol; QListView for multiple.
    - "Terminal UI: the value in a bordered box with a ▾ glyph; a bordered list for multiple."
fixtures: [FX-LONG, FX-320, FX-ZOOM-200, FX-I18N, FX-RTL, FX-RM, FX-HC, FX-TOUCH, FX-DENSITY, FX-STATE-MATRIX]
related: [combobox, multiselect, text-field, field, menu]
specimens: [settings-panel, admin-form, filterable-table]
keywords: [select, dropdown, option, optgroup, listbox, multiple, choice]
sources: [j3w1-web]
compact: true
---

## Purpose

Choosing one option, or several, from a short fixed list. The closed control
is the text-field box with a chevron; the open list is the host's popup and
is deliberately not restyled beyond option colours. A searchable or
asynchronous list is the combobox component.

## Anatomy

Label above; the box; the native `<select>` inside with the host chevron
removed and the theme's line-icon chevron drawn at the inline end; help and
message below. The multiple variant is the same box grown to `size` rows
with no chevron.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | 1px {color.border.control} on {color.surface.input}; value {color.text.default}; chevron {color.icon.default} | the chevron |
| hover | background → {color.interaction.hover.bg}; border unchanged | cursor: default; hover-capable pointers only |
| focus-visible | border → {color.border.active}; ring 1px dashed {color.interaction.focus.ring} at −2px | the ring |
| required | `*` after the label in {color.status.danger.text} plus visually hidden "required" | `required`; the mark |
| invalid | border 2px {color.status.danger.border}; message with the ✕ glyph | border width 1 → 2px; glyph; `aria-invalid` |
| invalid+focus-visible | the 2px danger border and the ring in {color.interaction.focus.ring-container} at −4px | double boundary |
| disabled | text and chevron {color.text.disabled}; border {color.border.disabled}; background {color.interaction.disabled.bg} | `disabled`; cursor: not-allowed |

Inside the open list, where the engine honours it, a selected option is
{color.interaction.selection.bg} with {color.interaction.selection.text} and
group labels are {color.text.muted} on {color.surface.raised}. Precedence:
disabled > invalid > hover; focus-visible is always drawn.

## Keyboard

Native throughout. The closed single select changes its value with the arrow
keys without opening, which is why a select is never used where changing the
value has an immediate side effect; a menu or a button is used there. The
multiple variant relies on Shift and Ctrl and needs its instructions in the
help text.

## Accessibility

A programmatic label is required; the first option is a real choice or a
placeholder option that is `disabled` and `selected` with text such as
"Choose a workspace", never an empty string. `aria-invalid="true"` only after
interaction or submit. Help and message through `aria-describedby`. The
popup keeps the host's own contrast; the theme claims nothing about it.
Contrast: value 8.65:1, chevron 8.65:1, control border 4.45:1, invalid
border 4.69:1, selected option 7.92:1.

## Portability

Border, background, outline and one SVG. Engines that ignore `appearance:
none` on a select keep their chevron; the theme's chevron is then hidden with
a feature query and the deviation recorded. Option colours are advisory.

## Non-examples

A custom-built dropdown with a styled popup. A background-image chevron in
a literal colour. Rounded corners. A select whose first option is blank. A
select that triggers navigation on change. Invalid shown by colour alone.
A glow instead of the ring. Disabling by opacity.
