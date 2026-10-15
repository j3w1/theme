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
  button.bg: color.action.secondary.bg
  button.text: color.action.secondary.text
  button.border: color.action.secondary.border
  button.bg-hover: color.action.secondary.hover-bg
  button.bg-active: color.action.secondary.pressed-bg
  button.border-active: color.border.active
  button.focus: color.interaction.focus.ring
  dependency.role-border-width-default: border.width.default
  dependency.role-color-border-disabled: color.border.disabled
  dependency.role-color-interaction-disabled-bg: color.interaction.disabled.bg
  dependency.role-color-text-disabled: color.text.disabled
  dependency.role-density-comfortable-control-height: density.comfortable.control-height
  dependency.role-density-compact-control-height: density.compact.control-height
  dependency.role-focus-offset: focus.offset
  dependency.role-radius-none: radius.none
  dependency.role-space-12: space.12
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
  - fg: color.action.secondary.text
    bg: color.surface.default
    label: Button label
  - fg: color.action.secondary.text
    bg: color.action.secondary.hover-bg
    label: Button label on hover
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

A variable number of the same native field row in one form; the host owns
the fields, submission and persistence.

## Anatomy

Parts as listed in the anatomy.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | named content on the default surface. Button controls are the secondary button (button.md); inputs keep the input look. | native text and structure |
| empty | a muted empty message | explicit text; Add stays |
| focus-visible | dashed focus ring | native focus position |
| disabled | disabled foreground, background and border at full opacity | native disabled state blocks activation |

## Keyboard

As in the key table; nothing else is bound.

## Accessibility

IDs and label and ARIA references are namespaced per row. Actions are named
and keep their boundary when disabled. Removing a focused row moves focus to
a surviving row or to Add; each explicit operation is announced.

## Portability

Follows the shared component defaults in `spec/portability.md` (section
"Shared component defaults").

## Non-examples

Unlabelled controls. Colour-only status. Drag-only operations. Hidden
required instructions. Stolen focus. An invented service success.
