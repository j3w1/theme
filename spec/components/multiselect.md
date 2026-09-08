---
id: multiselect
name: Multiple selection
family: forms-advanced
maturity: stable
priority: R2
since: 1.0.0
order: 517
summary: A searchable native checkbox group that preserves all selected form values.
native: true
aria:
  pattern: Fieldset, legend, search input and native checkboxes
variants:
  - id: default
    name: Default
sizes:
  - compact
  - comfortable
states:
  - default
  - checked
  - focus-visible
  - disabled
  - no-results
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
  dependency.role-color-action-primary-bg: color.action.primary.bg
  dependency.role-color-action-primary-hover-bg: color.action.primary.hover-bg
  dependency.role-color-action-primary-text: color.action.primary.text
  dependency.role-color-border-active: color.border.active
  dependency.role-color-border-disabled: color.border.disabled
  dependency.role-color-interaction-disabled-bg: color.interaction.disabled.bg
  dependency.role-color-interaction-focus-ring-container: color.interaction.focus.ring-container
  dependency.role-color-interaction-hover-bg: color.interaction.hover.bg
  dependency.role-color-status-danger-border: color.status.danger.border
  dependency.role-color-status-danger-text: color.status.danger.text
  dependency.role-color-text-disabled: color.text.disabled
  dependency.role-density-comfortable-control-height: density.comfortable.control-height
  dependency.role-density-compact-control-height: density.compact.control-height
  dependency.role-focus-offset: focus.offset
  dependency.role-focus-ring: focus.ring
  dependency.role-font-line-height-ui-md: font.line-height.ui-md
  dependency.role-font-line-height-ui-sm: font.line-height.ui-sm
  dependency.role-font-size-ui-md: font.size.ui-md
  dependency.role-font-size-ui-sm: font.size.ui-sm
  dependency.role-icon-size-md: icon.size.md
  dependency.role-radius-none: radius.none
  dependency.role-space-12: space.12
  dependency.role-space-2: space.2
  dependency.role-space-24: space.24
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
  - part: group
    description: Fieldset and legend name the choice.
  - part: filter
    description: Labelled search input filters option labels.
  - part: options
    description: Native checkboxes remain selected when filtered out.
  - part: status
    description: Visible count distinguishes matching options from selected values.
keyboard:
  - key: Tab / Shift+Tab
    action: Visit search, clear and each visible enabled checkbox.
  - key: Space
    action: Toggle the focused checkbox.
  - key: Escape
    action: Clear a non-empty query without clearing selection.
responsive: Wrap labels and actions without changing source order. Use logical
  spacing in RTL. Preserve native target sizes at both densities; only bounded
  data regions may scroll horizontally.
portability:
  web: Select zero or more named values using a labelled native checkbox list.
    Local search filters visible choices without clearing selections. Successful
    checkboxes retain repeated native form keys. Clear selection is an explicit
    action.
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
  - multiselect
sources: []
compact: false
---

## Purpose

Select zero or more named values using a labelled native checkbox list. Local search filters visible choices without clearing selections. Successful checkboxes retain repeated native form keys. Clear selection is an explicit action.

## Anatomy

- **group:** Fieldset and legend name the choice.
- **filter:** Labelled search input filters option labels.
- **options:** Native checkboxes remain selected when filtered out.
- **status:** Visible count distinguishes matching options from selected values.

## States

| State | Presentation | Non-colour channel |
| --- | --- | --- |
| default | Named content on the default surface. | Native text and structure. |
| checked | Selected fill and a check indicator. | Native checked state. |
| focus-visible | Dashed focus ring. | Native keyboard focus position. |
| disabled | Disabled semantic foreground, background and border at full opacity. | Native disabled state blocks activation. |
| no-results | Muted result count. | Zero-results text; existing selected values remain selected. |

## Keyboard

- **Tab / Shift+Tab:** Visit search, clear and each visible enabled checkbox.
- **Space:** Toggle the focused checkbox.
- **Escape:** Clear a non-empty query without clearing selection.

## Accessibility

Keep labels and native checkbox semantics. Hidden choices leave the focus order but retain checked form values. Announce matching and selected counts, including zero. Required selection policy belongs to the host; marking every checkbox required would require every option.

## Portability

Wrap labels and actions without changing source order. Use logical spacing in RTL. Preserve native target sizes at both densities; only bounded data regions may scroll horizontally. Use equivalent native semantics and approved roles; record any unsupported behavior as a mapping deviation. The host owns application data, persistence, permissions and services.

## Non-examples

Unlabelled controls, color-only status, drag-only operations, hidden required instructions, stolen focus or an invented service success.
