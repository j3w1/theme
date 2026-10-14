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
  control.bg: color.action.secondary.bg
  control.text: color.action.secondary.text
  control.border: color.action.secondary.border
  control.bg-hover: color.action.secondary.hover-bg
  control.bg-active: color.action.secondary.pressed-bg
  control.border-active: color.border.active
  control.focus: color.interaction.focus.ring
  dependency.role-border-width-default: border.width.default
  dependency.role-color-border-overlay: color.border.overlay
  dependency.role-color-surface-overlay: color.surface.overlay
  dependency.role-density-comfortable-control-height: density.comfortable.control-height
  dependency.role-density-compact-control-height: density.compact.control-height
  dependency.role-focus-offset: focus.offset
  dependency.role-radius-none: radius.none
  dependency.role-space-12: space.12
  dependency.role-space-16: space.16
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

Supporting content beside its trigger that never blocks the page.

## Anatomy

Parts as listed in the anatomy.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | Named trigger. Its buttons are the secondary button (button.md). | Button semantics and accessible name. |
| open | Square overlay surface and border. | aria-expanded=true; panel is reachable. |
| closed | Panel hidden. | aria-expanded=false; hidden controls leave focus order. |
| focus-visible | Dashed focus ring. | Native keyboard focus. |

## Keyboard

As in the key table.

## Accessibility

Keep essential instructions outside collapsed panels. Name the panel with a
visible label or `aria-label`. No `aria-modal` and no focus trap. Native
automatic dismissal and the fallback both synchronise the expanded state.

## Portability

Follows the shared component defaults in `spec/portability.md` (section
"Shared component defaults").

## Non-examples

Unlabelled controls, color-only status, drag-only operations, hidden required instructions, stolen focus or an invented service success.
