---
id: chart
name: Chart
family: display
maturity: stable
priority: R2
since: 1.0.0
order: 543
summary: A one-series numeric chart with an always-visible complete data table.
native: true
aria:
  pattern: Native figure, accessible SVG and table
variants:
  - id: default
    name: Default
sizes:
  - compact
  - comfortable
states:
  - default
  - empty
  - loading
tokens:
  root.bg: color.surface.default
  root.text: color.text.default
  root.border: color.border.control
  heading.text: color.text.bright
  secondary.text: color.text.muted
  control.bg: color.surface.input
  control.focus: color.interaction.focus.ring
  dependency.role-border-width-default: border.width.default
  dependency.role-color-chart-axis: color.chart.axis
  dependency.role-color-chart-grid: color.chart.grid
  dependency.role-color-chart-label: color.chart.label
  series.primary: color.chart.series-2
  header.text: color.text.bright
  row.text: color.text.default
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
  - part: figure
    description: Caption identifies the measure and units.
  - part: plot
    description: Responsive SVG with an accessible name.
  - part: table
    description: Always-visible labels and exact values.
  - part: empty
    description: Explicit message when the supplied series is empty.
keyboard:
  - key: Tab
    action: Visit any scrollable data region. Points do not add unnecessary tab stops.
responsive: Wrap labels and actions without changing source order. Use logical
  spacing in RTL. Preserve native target sizes at both densities; only bounded
  data regions may scroll horizontally.
portability:
  web: Show one bounded numeric series with its complete textual data table.
    Labels and exact values carry the meaning without color. The API accepts
    finite non-negative values; it rejects invalid data rather than silently
    inventing missing numbers.
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
  - chart
sources: []
compact: false
---

## Purpose

Show one bounded numeric series with its complete textual data table. Labels and exact values carry the meaning without color. The API accepts finite non-negative values; it rejects invalid data rather than silently inventing missing numbers.

## Anatomy

- **figure:** Caption identifies the measure and units.
- **plot:** Responsive SVG with an accessible name.
- **table:** Always-visible labels and exact values.
- **empty:** Explicit message when the supplied series is empty.

## States

| State | Presentation | Non-colour channel |
| --- | --- | --- |
| default | Red primary series (`color.chart.series-2`), with canonical axis and label roles. | Complete labelled data table. |
| empty | Plot and rows are absent. | Explicit No data available text. |
| loading | Existing data remains readable under a busy indicator. | aria-busy with named loading text from the host. |

## Keyboard

- **Tab:** Visit any scrollable data region. Points do not add unnecessary tab stops.

## Accessibility

Keep the table visible without JavaScript. Do not replace it with tooltips or color-only legends. The single series uses the approved red chart role `color.chart.series-2`, as requested by the owner for graphs; foreground typography retains its rose roles. Each SVG bar has a text label. A loading status must distinguish old data from a completed refresh.

Column headers use `color.text.bright`; body row labels and numeric values use
`color.text.default`. Row-header semantics remain native `th scope="row"` even
though their typography matches body values. Do not apply the column-header color
to every `th` indiscriminately.

## Portability

Wrap labels and actions without changing source order. Use logical spacing in RTL. Preserve native target sizes at both densities; only bounded data regions may scroll horizontally. Use equivalent native semantics and approved roles; record any unsupported behavior as a mapping deviation. The host owns application data, persistence, permissions and services.

## Non-examples

Unlabelled controls, color-only status, drag-only operations, hidden required instructions, stolen focus or an invented service success.
