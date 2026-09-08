---
id: editor-search
name: Editor search
family: developer
maturity: stable
priority: R2
since: 1.0.0
order: 557
summary: Literal search and match navigation over escaped read-only source text.
native: true
aria:
  pattern: Native search input, buttons, pre and mark
variants:
  - id: default
    name: Default
sizes:
  - compact
  - comfortable
states:
  - default
  - filled
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
  dependency.role-color-code-search-current-bg: color.code.search-current-bg
  dependency.role-color-code-search-current-text: color.code.search-current-text
  dependency.role-color-code-search-match-bg: color.code.search-match-bg
  dependency.role-color-interaction-focus-ring-container: color.interaction.focus.ring-container
  dependency.role-color-surface-code: color.surface.code
  dependency.role-density-comfortable-control-height: density.comfortable.control-height
  dependency.role-density-compact-control-height: density.compact.control-height
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
  - part: query
    description: Labelled search input.
  - part: navigation
    description: Previous and next actions, disabled without matches.
  - part: source
    description: Escaped text with native mark elements.
  - part: status
    description: Current and total match counts.
keyboard:
  - key: Tab / Shift+Tab
    action: Reach query and match navigation.
  - key: Enter / Shift+Enter
    action: Move to next or previous match.
  - key: Escape
    action: Clear the query and retain focus.
responsive: Wrap labels and actions without changing source order. Use logical
  spacing in RTL. Preserve native target sizes at both densities; only bounded
  data regions may scroll horizontally.
portability:
  web: Find literal text in a read-only code sample. Search, previous and next
    expose exact match counts and the current match. The component does not
    execute regexes, mutate source text or provide a code editor backend.
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
  - editor
  - search
sources: []
compact: false
---

## Purpose

Find literal text in a read-only code sample. Search, previous and next expose exact match counts and the current match. The component does not execute regexes, mutate source text or provide a code editor backend.

## Anatomy

- **query:** Labelled search input.
- **navigation:** Previous and next actions, disabled without matches.
- **source:** Escaped text with native mark elements.
- **status:** Current and total match counts.

## States

| State | Presentation | Non-colour channel |
| --- | --- | --- |
| default | Plain escaped source. | Readable preformatted text. |
| filled | Match fill; current match has its own marker. | Exact current and total counts. |
| no-results | No highlighted matches. | Explicit zero-results status. |
| focus-visible | Dashed control ring. | Native keyboard focus. |

## Keyboard

- **Tab / Shift+Tab:** Reach query and match navigation.
- **Enter / Shift+Enter:** Move to next or previous match.
- **Escape:** Clear the query and retain focus.

## Accessibility

Render source as text, never as trusted HTML from the consumer. Highlighted matches must retain the exact source text for copying. Announce counts without moving input focus. Match navigation scrolls the current mark into view, and reduced motion requires no animation.

## Portability

Wrap labels and actions without changing source order. Use logical spacing in RTL. Preserve native target sizes at both densities; only bounded data regions may scroll horizontally. Use equivalent native semantics and approved roles; record any unsupported behavior as a mapping deviation. The host owns application data, persistence, permissions and services.

## Non-examples

Unlabelled controls, color-only status, drag-only operations, hidden required instructions, stolen focus or an invented service success.
