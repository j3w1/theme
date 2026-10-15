---
id: fieldset
name: Fieldset
family: forms-basic
maturity: stable
priority: R1
since: 0.1.0
order: 80
summary: The native fieldset that groups related fields under a legend inside a 1px divider border; disabling it disables everything inside.
native: true
aria:
  pattern: native <fieldset> with <legend>
  apg: https://www.w3.org/WAI/ARIA/apg/practices/forms/
variants:
  - id: default
    name: Default
sizes: [compact, comfortable]
states: [default, disabled]
tokens:
  root.border: color.border.divider
  root.bg: color.surface.default
  legend.text: color.text.bright
  body.text: color.text.default
  legend.text-disabled: color.text.disabled
  field.bg: color.surface.input
  field.border: color.border.control
  field.bg-disabled: color.interaction.disabled.bg
  field.border-disabled: color.border.disabled
  field.text-disabled: color.text.disabled
  help.text: color.text.muted
stateTokens:
  default: { fg: color.text.bright, bg: color.surface.default }
contrast:
  - { fg: color.border.divider, bg: color.surface.default, min: 1, kind: ui, label: "group border (decorative; the legend and spacing carry the grouping)", waiver: "the divider border is a decorative section rule, never the boundary of a control" }
  - { fg: color.text.default, bg: color.surface.default, label: "field labels inside the group" }
  - { fg: color.text.muted, bg: color.surface.default, label: "help text inside the group" }
  - { fg: color.text.disabled, bg: color.surface.default, min: 3, kind: ui, state: disabled, label: "disabled legend and labels (exempt; house floor 3:1)" }
  - { fg: color.text.disabled, bg: color.interaction.disabled.bg, min: 3, kind: ui, state: disabled, label: "disabled field text (exempt; house floor 3:1)" }
  - { fg: color.border.disabled, bg: color.interaction.disabled.bg, min: 1, kind: ui, state: disabled, label: "disabled field border (exempt)", waiver: "disabled controls are exempt from 1.4.11" }
anatomy:
  - part: root
    description: The native <fieldset>; 1px border.divider, 16px padding, radius 0, no background of its own.
  - part: legend
    description: The group name in text.bright, ui-md bold, set into the top border with 4px horizontal padding.
  - part: body
    description: The stacked fields, 12px apart; each is a field component (shown here with a minimal label and input).
keyboard:
  - key: Tab / Shift+Tab
    action: Moves through the fields inside in document order; the legend is not a tab stop.
responsive: Fills its container; fields inside stack at every width; the legend wraps rather than truncating at 320px. RTL keeps the legend at the inline start of the top border.
portability:
  web: native <fieldset> and <legend>; disabled on the fieldset disables every descendant control and is the only way a group is disabled; never a div with role="group" when the group holds form controls.
  nativeFallbacks:
    - GTK4 Frame with a label child; sensitivity propagates.
    - Qt QGroupBox; the title styled as the legend, checkable off.
    - "Terminal UI: a box-drawing border with the legend in the top edge."
fixtures: [FX-LONG, FX-320, FX-ZOOM-200, FX-I18N, FX-RTL, FX-RM, FX-HC, FX-DENSITY, FX-STATE-MATRIX]
related: [field, checkbox, radio-group, text-field, card]
specimens: [admin-form, settings-panel]
keywords: [fieldset, legend, group, section, form, disabled]
sources: [j3w1-web]
compact: false
---

## Purpose

Groups fields that belong together: an address, a set of credentials, the
options of one feature. Checkbox and radio groups use their own components,
which are fieldsets too.

## Anatomy

Parts as listed in the anatomy. The border is a decorative section rule; the
legend and the spacing carry the grouping.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | 1px {color.border.divider} border; legend {color.text.bright}; fields as their own components | the border and the legend |
| disabled | legend and labels {color.text.disabled}; each control takes its own disabled treatment ({color.interaction.disabled.bg}, {color.border.disabled}); border unchanged | `disabled` on the fieldset; cursor: not-allowed on the controls |

## Keyboard

None of its own; a disabled group's controls leave the tab order natively.

## Accessibility

The legend names the group and is announced before its first field; it says
what the group is, not what to do. Groups nest at most two levels. Because
disabling hides controls from keyboard users, a disabled group states why in
text before it or keeps its controls enabled. Legend, labels and help meet
4.5:1.

## Portability

Hosts without a legend-in-border draw the heading above the box and record
it. Disabled propagation is native on the web, GTK and Qt; a host without it
disables each control.

## Non-examples

No legend, or a visually hidden one. A card instead of a fieldset for form
controls. Rounded corners. A 2px or `border.control` border, which reads as a
control. A legend in accent red. Disabling only the legend. Three levels of
nesting.
