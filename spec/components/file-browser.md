---
id: file-browser
name: File browser
family: composed
maturity: stable
priority: R2
since: 1.0.0
order: 565
summary: Location navigation and a filterable native file table with bounded
  host actions.
native: true
aria:
  pattern: Tree composition, native search input and table
variants:
  - id: default
    name: Default
sizes:
  - compact
  - comfortable
states:
  - default
  - selected
  - empty
  - no-results
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
  dependency.role-color-border-divider: color.border.divider
  dependency.role-color-border-selected-indicator: color.border.selected-indicator
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
  - part: locations
    description: Tree navigation selects a location filter.
  - part: query
    description: Labelled native search filters visible rows.
  - part: table
    description: Native rows show names, kinds and sizes with explicit Open actions.
keyboard:
  - key: Tab / Shift+Tab
    action: Move among tree navigation, search and row actions.
  - key: Arrow keys
    action: Use the tree contract inside navigation.
  - key: Enter / Space
    action: Request opening the chosen file through an event.
responsive: Wrap labels and actions without changing source order. Use logical
  spacing in RTL. Preserve native target sizes at both densities; only bounded
  data regions may scroll horizontally.
portability:
  web: Compose hierarchical location navigation with a filterable file table.
    Opening an entry emits its stable identity. The caller owns file access,
    upload, deletion and permissions. The supplied names and sizes are synthetic
    local examples.
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
  - tree
  - table
  - search-field
specimens: []
keywords:
  - file
  - browser
sources: []
compact: false
---

## Purpose

Compose hierarchical location navigation with a filterable file table. Opening an entry emits its stable identity. The caller owns file access, upload, deletion and permissions. The supplied names and sizes are synthetic local examples.

## Anatomy

- **locations:** Tree navigation selects a location filter.
- **query:** Labelled native search filters visible rows.
- **table:** Native rows show names, kinds and sizes with explicit Open actions.

## States

| State | Presentation | Non-colour channel |
| --- | --- | --- |
| default | Locations and native file rows. | Explicit names, kinds and sizes. |
| selected | Selected location follows the tree contract. | aria-selected plus location filter. |
| empty | No file rows. | Explicit zero-files text. |
| no-results | Filtered rows are hidden. | Matching count and retained search query. |
| focus-visible | Dashed control outline. | Native focus and tree roving focus. |

## Keyboard

- **Tab / Shift+Tab:** Move among tree navigation, search and row actions.
- **Arrow keys:** Use the tree contract inside navigation.
- **Enter / Space:** Request opening the chosen file through an event.

## Accessibility

Keep the complete nested tree behavior and semantic table headers. Filtering does not move focus. Announce counts, and keep the search field available after zero results. File actions must not imply access beyond the host's actual permissions.

## Portability

Wrap labels and actions without changing source order. Use logical spacing in RTL. Preserve native target sizes at both densities; only bounded data regions may scroll horizontally. Use equivalent native semantics and approved roles; record any unsupported behavior as a mapping deviation. The host owns application data, persistence, permissions and services.

## Non-examples

Unlabelled controls, color-only status, drag-only operations, hidden required instructions, stolen focus or an invented service success.
