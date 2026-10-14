---
id: command-palette
name: Command palette
family: navigation
maturity: stable
priority: R2
since: 1.0.0
order: 530
summary: A compact square modal command prompt with local results and category labels.
native: false
aria:
  pattern: combobox
  apg: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
variants:
  - id: default
    name: Default
sizes:
  - compact
  - comfortable
states:
  - default
  - open
  - closed
  - focus-visible
  - no-results
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
  dependency.role-border-width-emphasis: border.width.emphasis
  dependency.role-color-border-overlay: color.border.overlay
  dependency.role-color-border-selected-indicator: color.border.selected-indicator
  dependency.role-color-interaction-selection-bg: color.interaction.selection.bg
  dependency.role-color-interaction-selection-text: color.interaction.selection.text
  dependency.role-color-surface-backdrop: color.surface.backdrop
  dependency.role-color-surface-overlay: color.surface.overlay
  dependency.role-density-comfortable-control-height: density.comfortable.control-height
  dependency.role-density-compact-control-height: density.compact.control-height
  dependency.role-focus-offset: focus.offset
  dependency.role-radius-none: radius.none
  dependency.role-space-12: space.12
  dependency.role-space-16: space.16
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
  - part: trigger
    description: Named native button opens the utility panel.
  - part: prompt
    description: Labelled combobox input retains focus while navigating results.
  - part: results
    description: Listbox results include category and command text.
  - part: dialog
    description: Native modal dialog provides containment and return.
keyboard:
  - key: Ctrl+K / Cmd+K
    action: Open when the host explicitly enables the shortcut.
  - key: Up / Down
    action: Move the active result while retaining input focus.
  - key: Enter
    action: Invoke the active enabled result and close.
  - key: Escape
    action: Close and restore the opener.
  - key: Tab / Shift+Tab
    action: Cycle through native modal controls.
responsive: Wrap labels and actions without changing source order. Use logical
  spacing in RTL. Preserve native target sizes at both densities; only bounded
  data regions may scroll horizontally.
portability:
  web: Find and invoke local commands from a compact square floating utility
    panel. One prompt filters dense rows with category labels. Results are
    caller-supplied links or bounded actions; no remote search occurs. The host
    may opt into Ctrl+K or Cmd+K.
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
  - command
  - palette
sources: []
compact: false
---

## Purpose

Finds and invokes local commands; navigation the site requires stays
available outside the palette, without JavaScript.

## Anatomy

Parts as listed in the anatomy.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | One prompt, dense command rows. Button controls are the secondary button (button.md); inputs keep the input look. | Visible names and categories. |
| open | Square overlay surface and border. | Native modal dialog; active-descendant relationship. |
| closed | Panel absent. | Opener stays focusable. |
| focus-visible | Dashed input ring. | Input keeps DOM focus while results change. |
| no-results | Muted zero-results status. | Explicit result count; no active descendant. |

## Keyboard

As in the key table. Shortcuts are never intercepted globally unless the host
opts in, and one Escape closes the palette.

## Accessibility

Each result's name includes its category and command text. Selection uses the
approved selected roles.

## Portability

Follows the shared component defaults in `spec/portability.md` (section
"Shared component defaults").

## Non-examples

Unlabelled controls, color-only status, drag-only operations, hidden required instructions, stolen focus or an invented service success.
