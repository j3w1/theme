---
id: tree
name: Tree
family: navigation
maturity: stable
priority: R2
since: 1.0.0
order: 531
summary: Hierarchical navigation with explicit expansion and one roving tab stop.
native: false
aria:
  pattern: treeview
  apg: https://www.w3.org/WAI/ARIA/apg/patterns/treeview/
variants:
  - id: default
    name: Default
sizes:
  - compact
  - comfortable
states:
  - default
  - selected
  - expanded
  - collapsed
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
  dependency.role-border-width-emphasis: border.width.emphasis
  dependency.role-color-border-selected-indicator: color.border.selected-indicator
  dependency.role-color-interaction-selection-bg: color.interaction.selection.bg
  dependency.role-color-interaction-selection-text: color.interaction.selection.text
  dependency.role-color-text-disabled: color.text.disabled
  dependency.role-density-comfortable-control-height: density.comfortable.control-height
  dependency.role-density-compact-control-height: density.compact.control-height
  dependency.role-radius-none: radius.none
  dependency.role-space-12: space.12
  dependency.role-space-16: space.16
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
  - part: tree
    description: Labelled tree with nested groups.
  - part: item
    description: Named treeitems expose selection; parents also expose expansion.
  - part: children
    description: A nested group hidden when the parent collapses.
keyboard:
  - key: Up / Down / Home / End
    action: Move through visible items in source order.
  - key: Right / Left
    action: Expand or enter a parent, collapse it or return to its parent. Mirror
      these keys in RTL.
  - key: Enter / Space
    action: Select the focused enabled item.
  - key: Typing
    action: Move to the next visible label starting with the character.
responsive: Wrap labels and actions without changing source order. Use logical
  spacing in RTL. Preserve native target sizes at both densities; only bounded
  data regions may scroll horizontally.
portability:
  web: Navigate hierarchical items with explicit expansion and a single roving tab
    stop. Selection differs from expansion. Caller-supplied nodes represent
    identities; activation emits an event and never invents file access.
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
  - tree
sources: []
compact: false
---

## Purpose

Navigate hierarchical items with explicit expansion and a single roving tab stop. Selection differs from expansion. Caller-supplied nodes represent identities; activation emits an event and never invents file access.

## Anatomy

- **tree:** Labelled tree with nested groups.
- **item:** Named treeitems expose selection; parents also expose expansion.
- **children:** A nested group hidden when the parent collapses.

## States

| State | Presentation | Non-colour channel |
| --- | --- | --- |
| default | Visible named tree items. | Tree and group hierarchy. |
| selected | Selected fill, text and start indicator. | aria-selected. |
| expanded | Downward marker and visible children. | aria-expanded=true. |
| collapsed | Side marker and hidden children. | aria-expanded=false; children leave focus order. |
| focus-visible | Dashed ring on the item's own label. | Roving native focus. |
| disabled | Disabled text at full opacity. | aria-disabled blocks selection. |

## Keyboard

- **Up / Down / Home / End:** Move through visible items in source order.
- **Right / Left:** Expand or enter a parent, collapse it or return to its parent. Mirror these keys in RTL.
- **Enter / Space:** Select the focused enabled item.
- **Typing:** Move to the next visible label starting with the character.

## Accessibility

Implement the linked tree pattern. Only one visible item has tabindex=0. Labels exclude descendant text. Collapsing a parent of the focused item moves focus to that parent. Selection has a programmatic state and border indicator; disabled items do not activate.

## Portability

Wrap labels and actions without changing source order. Use logical spacing in RTL. Preserve native target sizes at both densities; only bounded data regions may scroll horizontally. Use equivalent native semantics and approved roles; record any unsupported behavior as a mapping deviation. The host owns application data, persistence, permissions and services.

## Non-examples

Unlabelled controls, color-only status, drag-only operations, hidden required instructions, stolen focus or an invented service success.
