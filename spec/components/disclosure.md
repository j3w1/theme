---
id: disclosure
name: Disclosure
family: navigation
maturity: stable
priority: R2
since: 1.0.0
order: 532
summary: Native details and summary for supporting content.
native: true
aria:
  pattern: Native details and summary
variants:
  - id: default
    name: Default
sizes:
  - compact
  - comfortable
states:
  - default
  - expanded
  - collapsed
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
  dependency.role-color-border-active: color.border.active
  dependency.role-color-border-disabled: color.border.disabled
  dependency.role-color-interaction-disabled-bg: color.interaction.disabled.bg
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
  - part: details
    description: Native expanded state and content container.
  - part: summary
    description: Visible name and native disclosure marker.
keyboard:
  - key: Tab / Shift+Tab
    action: Reach the summary and expanded interactive content.
  - key: Enter / Space
    action: Toggle native details.
responsive: Wrap labels and actions without changing source order. Use logical
  spacing in RTL. Preserve native target sizes at both densities; only bounded
  data regions may scroll horizontally.
portability:
  web: Reveal supporting content with native details and summary. Essential
    instructions stay outside a collapsed disclosure. The summary supplies a
    complete accessible name; content remains in normal reading order.
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
  - disclosure
sources: []
compact: false
---

## Purpose

Reveal supporting content with native details and summary. Essential instructions stay outside a collapsed disclosure. The summary supplies a complete accessible name; content remains in normal reading order.

## Anatomy

- **details:** Native expanded state and content container.
- **summary:** Visible name and native disclosure marker.

## States

| State | Presentation | Non-colour channel |
| --- | --- | --- |
| default | Named content on the default surface. | Native text and structure. |
| expanded | Expanded content and native marker. | Native open state exposes the content. |
| collapsed | Only the summary remains visible. | Native closed content leaves the focus order. |
| focus-visible | Dashed focus ring. | Native keyboard focus position. |

## Keyboard

- **Tab / Shift+Tab:** Reach the summary and expanded interactive content.
- **Enter / Space:** Toggle native details.

## Accessibility

Keep the native marker and summary semantics. Do not add a competing aria-expanded value. Required instructions and the portal's normative content are never placed only inside a disclosure.

## Portability

Wrap labels and actions without changing source order. Use logical spacing in RTL. Preserve native target sizes at both densities; only bounded data regions may scroll horizontally. Use equivalent native semantics and approved roles; record any unsupported behavior as a mapping deviation. The host owns application data, persistence, permissions and services.

## Non-examples

Unlabelled controls, color-only status, drag-only operations, hidden required instructions, stolen focus or an invented service success.
