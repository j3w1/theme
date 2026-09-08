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
  control.bg: color.surface.input
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

Explain a failed operation and offer a bounded recovery action. Retrying emits a request; the component does not claim that a service recovered. The host updates content when the actual operation completes.

## Anatomy

- **message:** Heading, explanation and text error glyph.
- **recovery:** Native retry action, disabled while the host request is pending.

## States

| State | Presentation | Non-colour channel |
| --- | --- | --- |
| default | Danger border and text heading. | Specific written explanation and error glyph. |
| error | Same explicit failure treatment. | Failure text remains available. |
| loading | Busy status accompanies the existing explanation. | aria-busy and host-provided pending text. |
| disabled | Disabled roles at full opacity. | Native retry button is disabled. |
| focus-visible | Dashed ring. | Native keyboard focus. |

## Keyboard

- **Tab / Shift+Tab:** Reach the recovery action.
- **Enter / Space:** Request a retry without moving focus.

## Accessibility

Do not rely only on color or a glyph. Give the retry action a specific name. Announce a newly occurring error in an appropriate host status region, without repeatedly interrupting reading. Keep focus unless recovery requires an explicit next step.

## Portability

Wrap labels and actions without changing source order. Use logical spacing in RTL. Preserve native target sizes at both densities; only bounded data regions may scroll horizontally. Use equivalent native semantics and approved roles; record any unsupported behavior as a mapping deviation. The host owns application data, persistence, permissions and services.

## Non-examples

Unlabelled controls, color-only status, drag-only operations, hidden required instructions, stolen focus or an invented service success.
