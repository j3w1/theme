---
id: kbd
name: Keyboard key
family: display
maturity: stable
priority: R2
since: 1.0.0
order: 544
summary: A literal key or short keyboard sequence rendered as native kbd text.
native: true
aria:
  pattern: Native kbd
variants:
  - id: default
    name: Default
sizes:
  - compact
  - comfortable
states:
  - default
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
  dependency.role-radius-none: radius.none
  dependency.role-space-12: space.12
  dependency.role-space-2: space.2
  dependency.role-space-4: space.4
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
  - part: key
    description: Native kbd containing a readable key name.
  - part: sequence
    description: Separate keys joined by text in activation order.
keyboard:
  - key: None
    action: The keycap is documentation, not a button.
responsive: Wrap labels and actions without changing source order. Use logical
  spacing in RTL. Preserve native target sizes at both densities; only bounded
  data regions may scroll horizontally.
portability:
  web: Show readable key names using native kbd text. This documents a shortcut;
    it does not bind one. State the platform when shortcuts differ.
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
  - kbd
sources: []
compact: false
---

## Purpose

Show readable key names using native kbd text. This documents a shortcut; it does not bind one. State the platform when shortcuts differ.

## Anatomy

- **key:** Native kbd containing a readable key name.
- **sequence:** Separate keys joined by text in activation order.

## States

| State | Presentation | Non-colour channel |
| --- | --- | --- |
| default | Named content on the default surface. | Native text and structure. |

## Keyboard

- **None:** The keycap is documentation, not a button.

## Accessibility

Write readable names such as Ctrl, Shift and Escape. Keep sequence punctuation as text. A shortcut hint does not replace an action's accessible name.

## Portability

Wrap labels and actions without changing source order. Use logical spacing in RTL. Preserve native target sizes at both densities; only bounded data regions may scroll horizontally. Use equivalent native semantics and approved roles; record any unsupported behavior as a mapping deviation. The host owns application data, persistence, permissions and services.

## Non-examples

Unlabelled controls, color-only status, drag-only operations, hidden required instructions, stolen focus or an invented service success.
