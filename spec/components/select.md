---
id: select
name: Select
family: forms-basic
maturity: stable
priority: R1
since: 0.1.0
order: 40
summary: A themed single-choice combobox or multiple-choice list backed by a native select for forms and the no-JavaScript fallback.
native: false
aria:
  pattern: Select-only combobox with listbox popup; multiple variant is a multiselectable listbox
  apg: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
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
  - { fg: color.text.default, bg: color.surface.raised, label: "option text in the themed list" }
  - { fg: color.text.muted, bg: color.surface.raised, label: "group label in the themed list" }
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
    description: The themed combobox trigger or multiple listbox. A hidden native select remains the successful form control; without JavaScript it is visible.
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
    action: Opens the themed popup without committing a choice.
  - key: Up / Down
    action: Opens the single list or moves its active option; Enter or Space commits. In the multiple list, moves the active option.
  - key: Typing
    action: Moves to an enabled option starting with the typed characters.
  - key: Space / click; Shift+Up / Shift+Down; Ctrl+Command+A
    action: Toggles a multiple option; extends a range; selects or clears all enabled options.
  - key: Escape / Tab
    action: Closes the single popup without committing the active option.
responsive: Fills its field container with min-width 0; the chevron keeps its 16px slot; long option text truncates inside the box with the native ellipsis. RTL moves the chevron to the inline end.
portability:
  web: Native select and label markup progressively enhanced into a theme-owned combobox/listbox. The package owns popup colors; native submission, validation and reset remain intact. The no-JavaScript fallback retains the native control.
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

Choosing one option, or several, from a fixed list. D-025 requires theme-owned
choice surfaces in web applications. The native select remains the form-value
and constraint source. A searchable or asynchronous list is the separate
combobox component.

## Anatomy

Label above; a theme-owned trigger and listbox for single choices, or an
always-visible multiselectable listbox. Each selected option has a check mark
and the canonical selection fill. The hidden native `<select>` retains its
name, options, current values and defaults. Help and validation are linked
to the visible control. Without JavaScript the original native control is visible.

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

Inside the theme-owned list, a selected option is
{color.interaction.selection.bg} with {color.interaction.selection.text} and
group labels are {color.text.muted} on {color.surface.raised}. Precedence:
disabled > invalid > hover; focus-visible is always drawn.

## Keyboard

The single control follows the select-only combobox pattern: arrows open and
move the active option, Home/End reach the ends, typing finds an option, and
Enter/Space commits. Escape and Tab close without committing. Multiple choices
use arrows, Space or click to toggle, Shift with arrows for a range, and
Ctrl/Command+A to select or clear all enabled choices. No modifier is required
for ordinary multiple selection. The native fallback uses host keyboard behavior.

## Accessibility

A programmatic label is required; the first option is a real choice or a
placeholder option that is `disabled` and `selected` with text such as
"Choose a workspace", never an empty string. `aria-invalid="true"` only after
interaction or submit. Help and message through `aria-describedby`. The
themed popup uses the declared contrast roles. The visible control receives
the label, required/invalid state and descriptions. A failed native constraint
focuses that visible control and exposes a theme-owned error. Disabled options,
optgroups and fieldsets remain unavailable. Current values and defaults survive
reconnection, programmatic updates and form reset. Automated evidence records
its actual environments; it does not imply a manual screen-reader pass.

## Portability

Use the packaged behavior and complete copy closure for web implementations.
The supported enhancement can apply the same renderer to existing selects
without moving them or duplicating form values. Native platforms keep the
mappings listed above; no-JavaScript pages expose the native fallback.

## Non-examples

An unthemed browser popup presented as a fully themed implementation. A background-image chevron in
a literal colour. Rounded corners. A select whose first option is blank. A
select that triggers navigation on change. Invalid shown by colour alone.
A glow instead of the ring. Disabling by opacity.
