---
id: range
name: Range
family: forms-basic
maturity: stable
priority: R2
since: 1.0.0
order: 512
summary: A bounded native numeric slider with visible output.
native: true
aria:
  pattern: Native labelled range input and output
variants:
  - id: default
    name: Default
sizes:
  - compact
  - comfortable
states:
  - default
  - focus-visible
  - disabled
tokens:
  root.bg: color.surface.default
  root.text: color.text.default
  root.border: color.border.control
  heading.text: color.text.bright
  secondary.text: color.text.muted
  control.bg: color.surface.input
  control.focus: color.interaction.focus.ring
  dependency.role-border-width-default: border.width.default
  dependency.role-color-action-primary-bg: color.action.primary.bg
  dependency.role-color-border-disabled: color.border.disabled
  dependency.role-color-interaction-disabled-bg: color.interaction.disabled.bg
  dependency.role-color-text-disabled: color.text.disabled
  dependency.role-density-comfortable-control-height: density.comfortable.control-height
  dependency.role-density-compact-control-height: density.compact.control-height
  dependency.role-focus-offset: focus.offset
  dependency.role-radius-none: radius.none
  dependency.role-space-12: space.12
  dependency.role-space-2: space.2
  dependency.role-space-8: space.8
stateTokens:
  default:
    fg: color.text.default
    bg: color.surface.default
    border: color.border.control
contrast:
  - fg: color.text.default
    bg: color.surface.default
    label: Primary content
  - fg: color.text.muted
    bg: color.surface.default
    label: Supporting content
  - fg: color.border.control
    bg: color.surface.default
    min: 3
    kind: ui
    label: Control boundary
anatomy:
  - part: label
    description: Visible label linked to the input.
  - part: input
    description: Native range control with caller-specified bounds.
  - part: output
    description: Current numeric value linked using for.
keyboard:
  - key: Tab / Shift+Tab
    action: Reach and leave the slider.
  - key: Arrow keys / Home / End
    action: Use native stepping, minimum and maximum behavior.
responsive: Wrap labels and actions without changing source order. Use logical
  spacing in RTL. Preserve native target sizes at both densities; only bounded
  data regions may scroll horizontally.
portability:
  web: Set a numeric value with a native range input and a visible output. The
    input retains min, max, step, disabled, name/value submission and form
    reset. Platform track geometry is a native rendering boundary; the semantic
    accent and focus roles remain explicit.
  nativeFallbacks:
    - Use equivalent native semantics and approved roles; record any unsupported
      behavior as a mapping deviation.
fixtures:
  - FX-320
  - FX-360
  - FX-ZOOM-200
  - FX-I18N
  - FX-RTL
  - FX-RM
  - FX-HC
  - FX-TOUCH
  - FX-DENSITY
  - FX-STATE-MATRIX
related: []
specimens: []
keywords:
  - range
sources: []
compact: false
---

## Purpose

A bounded numeric value on a native slider with a visible output.

## Anatomy

Parts as listed in the anatomy.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | named content on the default surface | native text and structure |
| focus-visible | dashed focus ring | native focus position |
| disabled | disabled foreground, background and border at full opacity | native disabled state blocks activation |

## Keyboard

Native, as in the key table.

## Accessibility

The input keeps its accessible name and native value semantics; the output
never replaces the label. Units go in the label or help text. Focus alone
never changes the value.

## Portability

Follows the shared component defaults in `spec/portability.md` (section
"Shared component defaults").

## Non-examples

Unlabelled controls. Colour-only status. Drag-only operations. Hidden
required instructions. Stolen focus. An invented service success.
