---
id: popover
name: Popover
family: feedback
maturity: stable
priority: R2
since: 1.0.0
order: 551
summary: A non-modal supporting panel with light dismissal and ordinary tab order.
native: true
aria:
  pattern: Native button and named supporting section
variants:
  - id: default
    name: Default
sizes:
  - compact
  - comfortable
states:
  - default
  - open
  - closed
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
  dependency.role-color-border-overlay: color.border.overlay
  dependency.role-color-surface-overlay: color.surface.overlay
  dependency.role-density-comfortable-control-height: density.comfortable.control-height
  dependency.role-density-compact-control-height: density.compact.control-height
  dependency.role-radius-none: radius.none
  dependency.role-space-12: space.12
  dependency.role-space-16: space.16
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
  - part: trigger
    description: Native button with expanded state and panel relationship.
  - part: panel
    description: Named supporting content and optional visible close action.
keyboard:
  - key: Enter / Space
    action: Toggle from the trigger.
  - key: Tab / Shift+Tab
    action: Move through ordinary controls without trapping focus.
  - key: Escape
    action: Close and restore the trigger.
responsive: Wrap labels and actions without changing source order. Use logical
  spacing in RTL. Preserve native target sizes at both densities; only bounded
  data regions may scroll horizontally.
portability:
  web: Disclose a non-modal supporting panel near its trigger. Interactive content
    follows ordinary tab order. Escape and outside activation dismiss; focus is
    not trapped. Use the native Popover API when available with an equivalent
    documented fallback.
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
  - popover
sources: []
compact: false
---

## Purpose

Disclose a non-modal supporting panel near its trigger. Interactive content follows ordinary tab order. Escape and outside activation dismiss; focus is not trapped. Use the native Popover API when available with an equivalent documented fallback.

## Anatomy

- **trigger:** Native button with expanded state and panel relationship.
- **panel:** Named supporting content and optional visible close action.

## States

| State | Presentation | Non-colour channel |
| --- | --- | --- |
| default | Named trigger. | Button semantics and accessible name. |
| open | Square overlay surface and border. | aria-expanded=true; panel is reachable. |
| closed | Panel hidden. | aria-expanded=false; hidden controls leave focus order. |
| focus-visible | Dashed focus ring. | Native keyboard focus. |

## Keyboard

- **Enter / Space:** Toggle from the trigger.
- **Tab / Shift+Tab:** Move through ordinary controls without trapping focus.
- **Escape:** Close and restore the trigger.

## Accessibility

Keep essential instructions outside collapsed panels. Use a visible label or aria-label for the panel. Do not add aria-modal or a focus trap. Native automatic dismissal and the fallback both synchronize expanded state.

## Portability

Wrap labels and actions without changing source order. Use logical spacing in RTL. Preserve native target sizes at both densities; only bounded data regions may scroll horizontally. Use equivalent native semantics and approved roles; record any unsupported behavior as a mapping deviation. The host owns application data, persistence, permissions and services.

## Non-examples

Unlabelled controls, color-only status, drag-only operations, hidden required instructions, stolen focus or an invented service success.
