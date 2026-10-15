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
  control.bg: color.action.secondary.bg
  control.text: color.action.secondary.text
  control.border: color.action.secondary.border
  control.bg-hover: color.action.secondary.hover-bg
  control.bg-active: color.action.secondary.pressed-bg
  control.border-active: color.border.active
  control.focus: color.interaction.focus.ring
  dependency.role-border-width-default: border.width.default
  dependency.role-color-border-disabled: color.border.disabled
  dependency.role-color-interaction-disabled-bg: color.interaction.disabled.bg
  dependency.role-color-text-disabled: color.text.disabled
  dependency.role-density-comfortable-control-height: density.comfortable.control-height
  dependency.role-density-compact-control-height: density.compact.control-height
  dependency.role-focus-offset: focus.offset
  dependency.role-radius-none: radius.none
  dependency.role-space-12: space.12
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
  - fg: color.action.secondary.text
    bg: color.surface.default
    label: Button label
  - fg: color.action.secondary.text
    bg: color.action.secondary.hover-bg
    label: Button label on hover
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

Groups related, independent actions without making them an exclusive choice.

## Anatomy

Parts as listed in the anatomy.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | Named content on the default surface. Its buttons are the secondary button (button.md). | Native text and structure. |
| focus-visible | Dashed focus ring. | Native keyboard focus position. |
| disabled | Disabled semantic foreground, background and border at full opacity. | Native disabled state blocks activation. |

## Keyboard

As in the key table; no arrow-key navigation is added.

## Accessibility

`role=group` with a visible or accessible label. Buttons keep distinct names
and native disabled behaviour; the group adds no selection semantics.

## Portability

Follows the shared component defaults in `spec/portability.md` (section "Shared component defaults").

## Non-examples

Unlabelled controls, colour-only status, drag-only operations, hidden required
instructions, stolen focus or an invented service success.
