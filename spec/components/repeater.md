---
id: repeater
name: Repeater
family: forms-advanced
maturity: stable
priority: R2
since: 1.0.0
order: 521
summary: Repeat native field rows with stable identities and keyboard ordering.
native: true
aria:
  pattern: Ordered list, inert template and native controls
variants:
  - id: default
    name: Default
sizes:
  - compact
  - comfortable
states:
  - default
  - empty
  - focus-visible
  - disabled
tokens:
  root.bg: color.surface.default
  root.text: color.text.default
  root.border: color.border.control
  heading.text: color.text.bright
  secondary.text: color.text.muted
  control.bg: color.surface.input
  control.focus: color.interaction.focus.ring
  dependency.role-border-width-default: border.width.default
  dependency.role-color-border-disabled: color.border.disabled
  dependency.role-color-interaction-disabled-bg: color.interaction.disabled.bg
  dependency.role-color-text-disabled: color.text.disabled
  dependency.role-density-comfortable-control-height: density.comfortable.control-height
  dependency.role-density-compact-control-height: density.compact.control-height
  dependency.role-radius-none: radius.none
  dependency.role-space-12: space.12
  dependency.role-space-2: space.2
  dependency.role-space-24: space.24
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
  - part: rows
    description: Ordered list of independently named field rows.
  - part: template
    description: Trusted native markup cloned on explicit Add.
  - part: actions
    description: Add, remove, move up and move down; no drag-only behavior.
keyboard:
  - key: Tab / Shift+Tab
    action: Visit fields and row actions in source order.
  - key: Enter / Space
    action: Add, remove or move a row. Focus follows the affected row or nearest
      survivor.
responsive: Wrap labels and actions without changing source order. Use logical
  spacing in RTL. Preserve native target sizes at both densities; only bounded
  data regions may scroll horizontally.
portability:
  web: Repeat native fields from trusted inert HTML. Add, remove and reorder
    preserve row identities. The host supplies fields and handles submission;
    the component does not execute a schema or provide persistence. A max
    attribute bounds the number of rows; the supplied example is limited to ten.
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
  - repeater
sources: []
compact: false
---

## Purpose

Repeat native fields from trusted inert HTML. Add, remove and reorder preserve row identities. The host supplies fields and handles submission; the component does not execute a schema or provide persistence. A max attribute bounds the number of rows; the supplied example is limited to ten.

## Anatomy

- **rows:** Ordered list of independently named field rows.
- **template:** Trusted native markup cloned on explicit Add.
- **actions:** Add, remove, move up and move down; no drag-only behavior.

## States

| State | Presentation | Non-colour channel |
| --- | --- | --- |
| default | Named content on the default surface. | Native text and structure. |
| empty | A muted empty message. | Explicit text and retained Add action. |
| focus-visible | Dashed focus ring. | Native keyboard focus position. |
| disabled | Disabled semantic foreground, background and border at full opacity. | Native disabled state blocks activation. |

## Keyboard

- **Tab / Shift+Tab:** Visit fields and row actions in source order.
- **Enter / Space:** Add, remove or move a row. Focus follows the affected row or nearest survivor.

## Accessibility

Namespace IDs and label/ARIA references for each row. Row identities do not change during reordering. Actions have names and disabled boundary states. Removing a focused row restores focus to a surviving row or Add; announce each explicit operation.

## Portability

Wrap labels and actions without changing source order. Use logical spacing in RTL. Preserve native target sizes at both densities; only bounded data regions may scroll horizontally. Use equivalent native semantics and approved roles; record any unsupported behavior as a mapping deviation. The host owns application data, persistence, permissions and services.

## Non-examples

Unlabelled controls, color-only status, drag-only operations, hidden required instructions, stolen focus or an invented service success.
