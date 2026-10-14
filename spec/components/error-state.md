---
id: error-state
name: Error state
family: feedback
maturity: stable
priority: R2
since: 1.0.0
order: 555
summary: A specific failure explanation with an explicit recovery request.
native: true
aria:
  pattern: Named section and native retry button
variants:
  - id: default
    name: Default
sizes:
  - compact
  - comfortable
states:
  - default
  - error
  - loading
  - disabled
  - focus-visible
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
  dependency.role-border-width-emphasis: border.width.emphasis
  dependency.role-color-border-disabled: color.border.disabled
  dependency.role-color-interaction-disabled-bg: color.interaction.disabled.bg
  dependency.role-color-status-danger-border: color.status.danger.border
  dependency.role-color-status-danger-text: color.status.danger.text
  dependency.role-color-text-disabled: color.text.disabled
  dependency.role-density-comfortable-control-height: density.comfortable.control-height
  dependency.role-density-compact-control-height: density.compact.control-height
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
  - fg: color.action.secondary.text
    bg: color.surface.default
    label: Button label
  - fg: color.action.secondary.text
    bg: color.action.secondary.hover-bg
    label: Button label on hover
anatomy:
  - part: message
    description: Heading, explanation and text error glyph.
  - part: recovery
    description: Native retry action, disabled while the host request is pending.
keyboard:
  - key: Tab / Shift+Tab
    action: Reach the recovery action.
  - key: Enter / Space
    action: Request a retry without moving focus.
responsive: Wrap labels and actions without changing source order. Use logical
  spacing in RTL. Preserve native target sizes at both densities; only bounded
  data regions may scroll horizontally.
portability:
  web: Explain a failed operation and offer a bounded recovery action. Retrying
    emits a request; the component does not claim that a service recovered. The
    host updates content when the actual operation completes.
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
  - error
  - state
sources: []
compact: false
---

## Purpose

Explains a failed operation and asks for an explicit recovery; it never
claims the service recovered.

## Anatomy

Parts as listed in the anatomy.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | Danger border and text heading. Its buttons are the secondary button (button.md). | Specific written explanation and error glyph. |
| error | Same explicit failure treatment. | Failure text remains available. |
| loading | Busy status accompanies the existing explanation. | aria-busy and host-provided pending text. |
| disabled | Disabled roles at full opacity. | Native retry button is disabled. |
| focus-visible | Dashed ring. | Native keyboard focus. |

## Keyboard

As in the key table.

## Accessibility

Never rely on colour or the glyph alone. Give the retry action a specific
name. Announce a new error in a host status region without repeatedly
interrupting reading. Keep focus unless recovery needs an explicit next step.

## Portability

Follows the shared component defaults in `spec/portability.md` (section "Shared component defaults").

## Non-examples

Unlabelled controls, colour-only status, drag-only operations, hidden required
instructions, stolen focus or an invented service success.
