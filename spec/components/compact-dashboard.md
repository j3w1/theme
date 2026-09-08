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
  control.bg: color.surface.input
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

Compose a small operational overview from named metrics, a complete chart and a records table. All figures are caller data. Synthetic fixtures are labelled; the component does not fetch data or infer business health.

## Anatomy

- **metrics:** Terms and values pair each metric name with its number.
- **activity:** Chart retains its full textual data table.
- **records:** Native rows include named actions and explicit status words.

## States

| State | Presentation | Non-colour channel |
| --- | --- | --- |
| default | Square metric panels and readable tables. | Metric names, exact values and status text. |
| loading | Busy boundary with existing content retained. | aria-busy and host-provided loading status. |
| empty | Explicit absence of records. | Empty message; metric zero differs from unknown. |
| focus-visible | Dashed action outline. | Native keyboard focus. |

## Keyboard

- **Tab / Shift+Tab:** Visit record actions and any scrollable data region.
- **Enter / Space:** Request the chosen record through an event.

## Accessibility

Keep metrics as term/value pairs, tables labelled and all chart data visible. Do not use a color-only health score. Busy status does not manufacture a completed refresh. The host decides how unknown metrics are described, rather than silently displaying zero.

## Portability

Wrap labels and actions without changing source order. Use logical spacing in RTL. Preserve native target sizes at both densities; only bounded data regions may scroll horizontally. Use equivalent native semantics and approved roles; record any unsupported behavior as a mapping deviation. The host owns application data, persistence, permissions and services.

## Non-examples

Unlabelled controls, color-only status, drag-only operations, hidden required instructions, stolen focus or an invented service success.
