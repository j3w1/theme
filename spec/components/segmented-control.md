---
id: segmented-control
name: Segmented control
family: actions
maturity: stable
priority: R2
since: 1.0.0
order: 504
summary: A short exclusive choice implemented with labelled native radios.
native: true
aria:
  pattern: Native fieldset, legend and radio inputs
variants:
  - id: default
    name: Default
sizes:
  - compact
  - comfortable
states:
  - default
  - checked
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
  dependency.role-border-width-emphasis: border.width.emphasis
  dependency.role-color-action-primary-bg: color.action.primary.bg
  dependency.role-color-action-primary-hover-bg: color.action.primary.hover-bg
  dependency.role-color-action-primary-text: color.action.primary.text
  dependency.role-color-border-disabled: color.border.disabled
  dependency.role-color-interaction-disabled-bg: color.interaction.disabled.bg
  dependency.role-color-interaction-focus-ring-container: color.interaction.focus.ring-container
  dependency.role-color-interaction-hover-bg: color.interaction.hover.bg
  dependency.role-color-interaction-selection-bg: color.interaction.selection.bg
  dependency.role-color-interaction-selection-text: color.interaction.selection.text
  dependency.role-color-status-danger-border: color.status.danger.border
  dependency.role-color-status-danger-text: color.status.danger.text
  dependency.role-color-text-disabled: color.text.disabled
  dependency.role-density-comfortable-control-height: density.comfortable.control-height
  dependency.role-density-compact-control-height: density.compact.control-height
  dependency.role-focus-offset: focus.offset
  dependency.role-focus-ring: focus.ring
  dependency.role-font-line-height-ui-md: font.line-height.ui-md
  dependency.role-font-line-height-ui-sm: font.line-height.ui-sm
  dependency.role-font-size-ui-md: font.size.ui-md
  dependency.role-font-size-ui-sm: font.size.ui-sm
  dependency.role-icon-size-md: icon.size.md
  dependency.role-radius-none: radius.none
  dependency.role-space-12: space.12
  dependency.role-space-16: space.16
  dependency.role-space-2: space.2
  dependency.role-space-24: space.24
  dependency.role-space-4: space.4
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
  - part: fieldset
    description: Legend names the choice.
  - part: options
    description: Native radios sharing one name, each with a visible label.
keyboard:
  - key: Tab / Shift+Tab
    action: Enter the native radio group once and leave it.
  - key: Arrow keys / Space
    action: Use native radio selection and wrapping.
responsive: Wrap labels and actions without changing source order. Use logical
  spacing in RTL. Preserve native target sizes at both densities; only bounded
  data regions may scroll horizontally.
portability:
  web: Choose one value from a short labelled set using native radios. This
    changes a value; use tabs for associated content panels. Native names,
    required checks, disabled fieldsets and form reset are preserved.
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
  - segmented
  - control
sources: []
compact: false
---

## Purpose

Choose one value from a short labelled set using native radios. This changes a value; use tabs for associated content panels. Native names, required checks, disabled fieldsets and form reset are preserved.

## Anatomy

- **fieldset:** Legend names the choice.
- **options:** Native radios sharing one name, each with a visible label.

## States

| State | Presentation | Non-colour channel |
| --- | --- | --- |
| default | Named content on the default surface. | Native text and structure. |
| checked | Selected fill and a check indicator. | Native checked state. |
| focus-visible | Dashed focus ring. | Native keyboard focus position. |
| disabled | Disabled semantic foreground, background and border at full opacity. | Native disabled state blocks activation. |

## Keyboard

- **Tab / Shift+Tab:** Enter the native radio group once and leave it.
- **Arrow keys / Space:** Use native radio selection and wrapping.

## Accessibility

Keep native radios and labels. A checked value has both a visible native indicator and its programmatic checked state. Do not hide all radios from assistive technology or put role=tab on the labels.

## Portability

Wrap labels and actions without changing source order. Use logical spacing in RTL. Preserve native target sizes at both densities; only bounded data regions may scroll horizontally. Use equivalent native semantics and approved roles; record any unsupported behavior as a mapping deviation. The host owns application data, persistence, permissions and services.

## Non-examples

Unlabelled controls, color-only status, drag-only operations, hidden required instructions, stolen focus or an invented service success.
