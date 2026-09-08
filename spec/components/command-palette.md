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

Find and invoke local commands from a compact square floating utility panel. One prompt filters dense rows with category labels. Results are caller-supplied links or bounded actions; no remote search occurs. The host may opt into Ctrl+K or Cmd+K.

## Anatomy

- **trigger:** Named native button opens the utility panel.
- **prompt:** Labelled combobox input retains focus while navigating results.
- **results:** Listbox results include category and command text.
- **dialog:** Native modal dialog provides containment and return.

## States

| State | Presentation | Non-colour channel |
| --- | --- | --- |
| default | One prompt and dense command rows. | Visible names and categories. |
| open | Square overlay surface and border. | Native modal dialog and active-descendant relationship. |
| closed | Panel absent. | Opener remains focusable. |
| focus-visible | Dashed input ring. | Input retains DOM focus while results change. |
| no-results | Muted zero-results status. | Explicit result count and no active descendant. |

## Keyboard

- **Ctrl+K / Cmd+K:** Open when the host explicitly enables the shortcut.
- **Up / Down:** Move the active result while retaining input focus.
- **Enter:** Invoke the active enabled result and close.
- **Escape:** Close and restore the opener.
- **Tab / Shift+Tab:** Cycle through native modal controls.

## Accessibility

Combine native modal focus behavior with the editable combobox pattern. Result names include their category and command text; selection uses the approved selected roles. Escape closes once and restores focus. Required site navigation remains available outside the palette without JavaScript. Do not globally intercept shortcuts unless the host opts in.

## Portability

Wrap labels and actions without changing source order. Use logical spacing in RTL. Preserve native target sizes at both densities; only bounded data regions may scroll horizontally. Use equivalent native semantics and approved roles; record any unsupported behavior as a mapping deviation. The host owns application data, persistence, permissions and services.

## Non-examples

Unlabelled controls, color-only status, drag-only operations, hidden required instructions, stolen focus or an invented service success.
