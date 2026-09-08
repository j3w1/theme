---
id: timeline
name: Timeline
family: display
maturity: stable
priority: R2
since: 1.0.0
order: 542
summary: Chronological events with explicit dates, descriptions and current state.
native: true
aria:
  pattern: Ordered list with time elements
variants:
  - id: default
    name: Default
sizes:
  - compact
  - comfortable
states:
  - default
  - current
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
  dependency.role-color-border-active: color.border.active
  dependency.role-color-border-divider: color.border.divider
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
  - part: list
    description: Ordered events in reading order.
  - part: time
    description: Native time element with machine-readable datetime.
  - part: event
    description: Heading and status-bearing description.
keyboard:
  - key: Tab / Shift+Tab
    action: Reach event links and actions. The sequence is not focusable.
responsive: Wrap labels and actions without changing source order. Use logical
  spacing in RTL. Preserve native target sizes at both densities; only bounded
  data regions may scroll horizontally.
portability:
  web: Read events as an ordered list with explicit time and status text. The
    caller supplies order; the component does not reorder unknown dates. Lines
    support the sequence without becoming the only status channel.
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
  - timeline
sources: []
compact: false
---

## Purpose

Read events as an ordered list with explicit time and status text. The caller supplies order; the component does not reorder unknown dates. Lines support the sequence without becoming the only status channel.

## Anatomy

- **list:** Ordered events in reading order.
- **time:** Native time element with machine-readable datetime.
- **event:** Heading and status-bearing description.

## States

| State | Presentation | Non-colour channel |
| --- | --- | --- |
| default | Divider along the event sequence. | Ordered list and visible time. |
| current | Emphasized start border. | aria-current and explicit Current text. |

## Keyboard

- **Tab / Shift+Tab:** Reach event links and actions. The sequence is not focusable.

## Accessibility

Use real time values and visible dates. Identify the current event with aria-current and text. Avoid a color-only dot or an order that changes between visual presentation and reading order.

## Portability

Wrap labels and actions without changing source order. Use logical spacing in RTL. Preserve native target sizes at both densities; only bounded data regions may scroll horizontally. Use equivalent native semantics and approved roles; record any unsupported behavior as a mapping deviation. The host owns application data, persistence, permissions and services.

## Non-examples

Unlabelled controls, color-only status, drag-only operations, hidden required instructions, stolen focus or an invented service success.
