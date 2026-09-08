---
id: button-group
name: Button group
family: actions
maturity: stable
priority: R2
since: 1.0.0
order: 503
summary: Related independent native actions with individual tab stops.
native: true
aria:
  pattern: Labelled native button group
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
  dependency.role-color-border-disabled: color.border.disabled
  dependency.role-color-interaction-disabled-bg: color.interaction.disabled.bg
  dependency.role-color-text-disabled: color.text.disabled
  dependency.role-density-comfortable-control-height: density.comfortable.control-height
  dependency.role-density-compact-control-height: density.compact.control-height
  dependency.role-radius-none: radius.none
  dependency.role-space-12: space.12
  dependency.role-space-2: space.2
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
  - part: group
    description: Labelled group that wraps its buttons.
  - part: actions
    description: Independent buttons in source order.
keyboard:
  - key: Tab / Shift+Tab
    action: Visit each enabled button.
  - key: Enter / Space
    action: Activate the focused native button.
responsive: Wrap labels and actions without changing source order. Use logical
  spacing in RTL. Preserve native target sizes at both densities; only bounded
  data regions may scroll horizontally.
portability:
  web: Group related independent actions without turning them into an exclusive
    choice. Each button keeps its native type, accessible name and tab stop.
    Application effects belong to the host.
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
  - button
  - group
sources: []
compact: false
---

## Purpose

Group related independent actions without turning them into an exclusive choice. Each button keeps its native type, accessible name and tab stop. Application effects belong to the host.

## Anatomy

- **group:** Labelled group that wraps its buttons.
- **actions:** Independent buttons in source order.

## States

| State | Presentation | Non-colour channel |
| --- | --- | --- |
| default | Named content on the default surface. | Native text and structure. |
| focus-visible | Dashed focus ring. | Native keyboard focus position. |
| disabled | Disabled semantic foreground, background and border at full opacity. | Native disabled state blocks activation. |

## Keyboard

- **Tab / Shift+Tab:** Visit each enabled button.
- **Enter / Space:** Activate the focused native button.

## Accessibility

Use role=group with a visible or accessible label. Buttons retain distinct names and native disabled behavior. A button group does not add arrow-key navigation or selection semantics.

## Portability

Wrap labels and actions without changing source order. Use logical spacing in RTL. Preserve native target sizes at both densities; only bounded data regions may scroll horizontally. Use equivalent native semantics and approved roles; record any unsupported behavior as a mapping deviation. The host owns application data, persistence, permissions and services.

## Non-examples

Unlabelled controls, color-only status, drag-only operations, hidden required instructions, stolen focus or an invented service success.
