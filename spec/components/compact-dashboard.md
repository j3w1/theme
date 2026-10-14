---
id: compact-dashboard
name: Compact dashboard
family: composed
maturity: stable
priority: R2
since: 1.0.0
order: 566
summary: Named operational metrics, a complete chart and an actionable native
  records table.
native: true
aria:
  pattern: Native sections, description lists, chart and table composition
variants:
  - id: default
    name: Default
sizes:
  - compact
  - comfortable
states:
  - default
  - loading
  - empty
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
  dependency.role-color-border-divider: color.border.divider
  dependency.role-color-surface-chrome: color.surface.chrome
  dependency.role-density-comfortable-control-height: density.comfortable.control-height
  dependency.role-density-compact-control-height: density.compact.control-height
  dependency.role-font-size-h2: font.size.h2
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
  - part: metrics
    description: Terms and values pair each metric name with its number.
  - part: activity
    description: Chart retains its full textual data table.
  - part: records
    description: Native rows include named actions and explicit status words.
keyboard:
  - key: Tab / Shift+Tab
    action: Visit record actions and any scrollable data region.
  - key: Enter / Space
    action: Request the chosen record through an event.
responsive: Wrap labels and actions without changing source order. Use logical
  spacing in RTL. Preserve native target sizes at both densities; only bounded
  data regions may scroll horizontally.
portability:
  web: Compose a small operational overview from named metrics, a complete chart
    and a records table. All figures are caller data. Synthetic fixtures are
    labelled; the component does not fetch data or infer business health.
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
related:
  - chart
  - description-list
  - table
specimens: []
keywords:
  - compact
  - dashboard
sources: []
compact: false
---

## Purpose

A small operational overview of caller data; it fetches nothing and infers no
business health.

## Anatomy

Parts as listed in the anatomy.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | Square metric panels, readable tables. Its buttons are the secondary button (button.md). | Metric names, exact values, status text. |
| loading | Busy boundary; existing content kept. | `aria-busy` and host-provided loading status. |
| empty | Explicit absence of records. | Empty message; a zero metric differs from an unknown one. |
| focus-visible | Dashed action outline. | Native keyboard focus. |

## Keyboard

As in the key table; nothing else is bound.

## Accessibility

Metrics stay term/value pairs, tables are labelled and all chart data stays
visible. No colour-only health score. Busy status never implies a completed
refresh. The host words unknown metrics; never show them silently as zero.

## Portability

Follows the shared component defaults in `spec/portability.md` (section
"Shared component defaults").

## Non-examples

Unlabelled controls, color-only status, drag-only operations, hidden required instructions, stolen focus or an invented service success.
