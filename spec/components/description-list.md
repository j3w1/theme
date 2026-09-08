---
id: description-list
name: Description list
family: display
maturity: stable
priority: R2
since: 1.0.0
order: 536
summary: Semantic terms and values that wrap into a readable single column.
native: true
aria:
  pattern: Native dl, dt and dd
variants:
  - id: default
    name: Default
sizes:
  - compact
  - comfortable
states:
  - default
  - stacked
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
  dependency.role-radius-none: radius.none
  dependency.role-space-12: space.12
  dependency.role-space-2: space.2
  dependency.role-space-4: space.4
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
  - part: list
    description: Native description list.
  - part: term
    description: Concise name for a fact.
  - part: value
    description: Text, links or semantic inline content.
keyboard:
  - key: Tab / Shift+Tab
    action: Visit links in values. Plain facts are not tab stops.
responsive: Wrap labels and actions without changing source order. Use logical
  spacing in RTL. Preserve native target sizes at both densities; only bounded
  data regions may scroll horizontally.
portability:
  web: Present named facts as semantic terms and descriptions. Terms remain
    adjacent to their values in source order. A narrow view stacks the term
    above its value.
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
  - description
  - list
sources: []
compact: false
---

## Purpose

Present named facts as semantic terms and descriptions. Terms remain adjacent to their values in source order. A narrow view stacks the term above its value.

## Anatomy

- **list:** Native description list.
- **term:** Concise name for a fact.
- **value:** Text, links or semantic inline content.

## States

| State | Presentation | Non-colour channel |
| --- | --- | --- |
| default | Two aligned columns. | Native term and description relationships. |
| stacked | One column at narrow widths. | Each term immediately precedes its value. |

## Keyboard

- **Tab / Shift+Tab:** Visit links in values. Plain facts are not tab stops.

## Accessibility

Use dt and dd rather than a grid of unrelated paragraphs. Long values wrap without clipping. Preserve meaningful link text and do not make every value keyboard focusable.

## Portability

Wrap labels and actions without changing source order. Use logical spacing in RTL. Preserve native target sizes at both densities; only bounded data regions may scroll horizontally. Use equivalent native semantics and approved roles; record any unsupported behavior as a mapping deviation. The host owns application data, persistence, permissions and services.

## Non-examples

Unlabelled controls, color-only status, drag-only operations, hidden required instructions, stolen focus or an invented service success.
