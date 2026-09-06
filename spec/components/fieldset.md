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

Grouping fields that belong together: an address, a set of credentials,
the options of one feature. The legend names the group for sighted users
and assistive technology alike, and disabling the fieldset disables every
control inside it in one step. Checkbox and radio groups use their own
components, which are fieldsets too.

## Anatomy

The native `<fieldset>` with a 1px {color.border.divider} border and 16px
padding; the `<legend>` in {color.text.bright} sitting in the top border;
the fields stacked inside. The border is a section rule, decorative by
design; the legend and the spacing carry the grouping.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | 1px {color.border.divider} border; legend {color.text.bright}; fields as their own components | the border and the legend |
| disabled | legend and labels {color.text.disabled}; every control inside takes its own disabled treatment ({color.interaction.disabled.bg}, {color.border.disabled}); the border unchanged | `disabled` on the fieldset; cursor: not-allowed on the controls |

## Keyboard

None of its own. Disabled fieldsets remove their controls from the tab
order natively, so a disabled group is skipped rather than walked.

## Accessibility

The legend is the accessible name of the group and is announced before the
first field inside; it says what the group is, not what to do. A group
never nests deeper than two levels. Disabling a group hides its controls
from keyboard users, so a disabled group states why in text before it or
keeps its controls enabled. Contrast: legend 10.10:1, labels 8.43:1, help
5.66:1 on the panel surface.

## Portability

A border and a heading. Hosts without a legend-in-border draw the heading
above the box and record it. Disabled propagation is native on the web and
in GTK and Qt; a host without it disables each control.

## Non-examples

A fieldset with no legend or with a legend hidden visually. A card used
instead of a fieldset for form controls. Rounded corners. A 2px or
`border.control` border on the group, which would read as a control. A
legend in accent red. Disabling only the legend. Nesting three levels deep.
