---
id: skeleton
name: Skeleton
family: feedback
maturity: stable
priority: R2
since: 1.0.0
order: 549
summary: Static layout placeholders with a named loading status.
native: true
aria:
  pattern: Native status text with aria-hidden decorative blocks
variants:
  - id: default
    name: Default
sizes:
  - compact
  - comfortable
states:
  - default
  - loading
  - reduced-motion
tokens:
  root.bg: color.surface.default
  root.text: color.text.default
  root.border: color.border.control
  heading.text: color.text.bright
  secondary.text: color.text.muted
  control.bg: color.surface.input
  control.focus: color.interaction.focus.ring
  dependency.role-border-width-default: border.width.default
  dependency.role-color-border-divider: color.border.divider
  dependency.role-color-surface-raised: color.surface.raised
  dependency.role-radius-none: radius.none
  dependency.role-space-12: space.12
  dependency.role-space-16: space.16
  dependency.role-space-2: space.2
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
  - part: status
    description: Text names what is loading.
  - part: blocks
    description: Decorative square placeholders retain approximate dimensions.
keyboard:
  - key: Tab
    action: No new tab stops or focus capture.
responsive: Wrap labels and actions without changing source order. Use logical
  spacing in RTL. Preserve native target sizes at both densities; only bounded
  data regions may scroll horizontally.
portability:
  web: Reserve approximate layout space while a named region loads. Decorative
    blocks are hidden from accessibility APIs. A separate status describes
    loading. The skeleton is static and never shimmers.
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
  - skeleton
sources: []
compact: false
---

## Purpose

Reserve approximate layout space while a named region loads. Decorative blocks are hidden from accessibility APIs. A separate status describes loading. The skeleton is static and never shimmers.

## Anatomy

- **status:** Text names what is loading.
- **blocks:** Decorative square placeholders retain approximate dimensions.

## States

| State | Presentation | Non-colour channel |
| --- | --- | --- |
| default | Static decorative blocks. | Named loading status. |
| loading | Raised surface blocks; no opacity fade. | aria-busy on the region. |
| reduced-motion | Same static presentation. | No information depends on movement. |

## Keyboard

- **Tab:** No new tab stops or focus capture.

## Accessibility

Apply aria-busy to the region being updated and provide a concise status. Decorative blocks are aria-hidden. Do not remove the focused control merely to show a skeleton. Replacement content must keep a sensible reading order.

## Portability

Wrap labels and actions without changing source order. Use logical spacing in RTL. Preserve native target sizes at both densities; only bounded data regions may scroll horizontally. Use equivalent native semantics and approved roles; record any unsupported behavior as a mapping deviation. The host owns application data, persistence, permissions and services.

## Non-examples

Unlabelled controls, color-only status, drag-only operations, hidden required instructions, stolen focus or an invented service success.
