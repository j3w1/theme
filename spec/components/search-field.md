---
id: search-field
name: Search field
family: forms-basic
maturity: stable
priority: R1
since: 0.1.0
order: 100
summary: The text-field box around a native search input with a magnifier, a clear button that appears with a value, an optional shortcut hint, a loading glyph and a no-results status line.
native: true
aria:
  pattern: native <input type="search"> with <label> inside a role="search" landmark; status through role="status"
  apg: https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/search.html
variants:
  - id: default
    name: Default
  - id: with-shortcut
    name: With shortcut hint
    description: A kbd hint at the inline end showing the key that focuses the field.
sizes: [compact, comfortable]
states:
  - default
  - hover
  - focus-visible
  - placeholder-shown
  - filled
  - loading
  - disabled
  - no-results
tokens:
  root.bg: color.surface.input
  root.border: color.border.control
  root.bg-hover: color.interaction.hover.bg
  root.border-focus: color.border.active
  root.ring: color.interaction.focus.ring
  root.border-disabled: color.border.disabled
  root.bg-disabled: color.interaction.disabled.bg
  input.text: color.text.default
  input.text-disabled: color.text.disabled
  input.placeholder: color.text.placeholder
  input.caret: color.code.caret
  icon.stroke: color.icon.default
  loading.glyph: color.text.muted
  clear.text: color.action.tertiary.text
  clear.bg-hover: color.action.tertiary.hover-bg
  kbd.text: color.text.muted
  kbd.border: color.border.default
  label.text: color.text.bright
  help.text: color.text.muted
  status.text: color.text.muted
stateTokens:
  default: { fg: color.text.default, bg: color.surface.input, border: color.border.control }
  hover: { fg: color.text.default, bg: color.interaction.hover.bg, border: color.border.control }
  focus-visible: { fg: color.text.default, bg: color.surface.input, border: color.border.active, outline: color.interaction.focus.ring }
  placeholder-shown: { fg: color.text.placeholder, bg: color.surface.input, border: color.border.control }
  loading: { fg: color.text.default, bg: color.surface.input, border: color.border.control }
  no-results: { fg: color.text.default, bg: color.surface.input, border: color.border.control }
contrast:
  - { fg: color.icon.default, bg: color.surface.input, min: 3, kind: ui, label: "magnifier on the input surface" }
  - { fg: color.text.muted, bg: color.surface.input, label: "loading glyph and kbd hint on the input surface" }
  - { fg: color.action.tertiary.text, bg: color.surface.input, label: "clear glyph on the input surface" }
  - { fg: color.action.tertiary.text, bg: color.action.tertiary.hover-bg, state: hover, label: "clear glyph on its hover fill" }
  - { fg: color.text.muted, bg: color.surface.default, label: "help and no-results status on the panel surface" }
  - { fg: color.border.default, bg: color.surface.input, min: 1, kind: ui, label: "kbd hint edge (decorative)", waiver: "the hint is not a control; its text at 5.81:1 carries the meaning" }
  - { fg: color.text.disabled, bg: color.interaction.disabled.bg, min: 3, kind: ui, state: disabled, label: "disabled text (exempt; house floor 3:1)" }
  - { fg: color.border.disabled, bg: color.interaction.disabled.bg, min: 1, kind: ui, state: disabled, label: "disabled border (exempt)", waiver: "disabled controls are exempt from 1.4.11" }
anatomy:
  - part: label
    description: Above the control, or visually hidden when the magnifier and placeholder make the purpose obvious in a toolbar.
  - part: root
    description: The control box, 1px border.control on surface.input, height from the density mode; a role="search" landmark wraps the component.
  - part: icon
    description: A 16px magnifier line icon in icon.default at the inline start; aria-hidden.
  - part: loading
    description: The static ⋯ glyph in text.muted that replaces the magnifier while aria-busy is true.
  - part: input
    description: The native search input with the host cancel button removed; text.default, caret code.caret.
  - part: clear
    description: A square tertiary button with a 16px ✕ line icon, shown only when the field has a value; a separate tab stop.
  - part: kbd
    description: Optional shortcut hint in a 1px border.default box with text.muted; aria-hidden; hidden while focused.
  - part: help
    description: Below the control in text.muted.
  - part: status
    description: A role="status" line in text.muted for "No results for …"; hidden when empty.
keyboard:
  - key: Tab / Shift+Tab
    action: Input, then the clear button when it is visible.
  - key: Escape
    action: Clears a non-empty value and keeps focus; with an empty value, nothing.
  - key: Enter
    action: Runs the search when the host does not search as you type.
  - key: "/ or Ctrl+K"
    action: Focuses the field from anywhere on the page when the host binds the shortcut shown in the hint.
responsive: Fills its container with min-width 0; icon, clear and hint keep their slots and the text shrinks first; in a toolbar it may collapse to an icon button below 600px. RTL mirrors the icon to the inline start and the clear and hint to the inline end.
portability:
  web: native <input type="search"> with <label>, inside <form role="search"> or a role="search" landmark; results announced through the status line, never a live region on every keystroke; the hint is a <kbd> that is aria-hidden; the host cancel button is hidden and replaced by the clear button.
  nativeFallbacks:
    - GTK4 SearchEntry; the clear icon is its secondary icon.
    - Qt QLineEdit with a clearButtonEnabled and a leading QAction icon.
    - "Terminal UI: a / prompt line; the status in dim text under it."
fixtures: [FX-LONG, FX-320, FX-ZOOM-200, FX-I18N, FX-RTL, FX-RM, FX-HC, FX-TOUCH, FX-DENSITY, FX-STATE-MATRIX]
related: [text-field, combobox, command-palette, toolbar, empty-state, kbd]
specimens: [filterable-table, settings-panel]
keywords: [search, filter, query, find, clear, shortcut, status]
sources: [j3w1-web]
compact: false
---

## Purpose

Filtering a list or table or searching a site. It is the text field's box
with the parts a search needs: an icon that says what the box is for, a
clear button, a place for the shortcut that reaches it, a loading glyph
while results arrive and a status line when nothing matches. A search that
offers suggestions as you type is the combobox component.

## Anatomy

Label above (or visually hidden); the box with the magnifier, the input,
the clear button and the optional hint; help; the status line. The loading
glyph takes the magnifier's slot so the box never changes size.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | 1px {color.border.control} on {color.surface.input}; magnifier {color.icon.default}; text {color.text.default} | the magnifier |
| hover | background → {color.interaction.hover.bg}; the clear button → {color.action.tertiary.hover-bg} when hovered | cursor: text |
| focus-visible | border → {color.border.active}; ring 1px dashed {color.interaction.focus.ring} at −2px; the hint hides | the ring |
| placeholder-shown | placeholder in {color.text.placeholder}, italic; no clear button | italic; the clear button is absent |
| filled | as default with a value; the clear button is present | the clear button |
| loading | the static `⋯` glyph in {color.text.muted} replaces the magnifier; the input stays editable | glyph; `aria-busy` |
| disabled | text and icon {color.text.disabled}; border {color.border.disabled}; background {color.interaction.disabled.bg}; no clear button | `disabled`; cursor: not-allowed |
| no-results | the status line "No results for …" in {color.text.muted} below the help; the box unchanged | the status text; `role="status"` |

Precedence: disabled > loading > hover; focus-visible is always drawn.
A search field is never invalid; an empty result is a status, not an error.

## Keyboard

Escape clears a non-empty value and keeps focus, which is native for
`type="search"` in most engines and scripted where it is not. The clear
button is a separate tab stop only while it is visible. The shortcut in the
hint is bound by the host and never captured while another field has focus.

## Accessibility

A programmatic label is required even when hidden. The landmark
`role="search"` lets users jump to it. The status line is `role="status"`
so "No results" is announced once, after the query settles, and the result
count is announced there too ("12 results"). The magnifier and hint are
`aria-hidden`; the clear button is named "Clear <label>". Contrast: text
8.65:1, placeholder 5.81:1, magnifier 8.65:1, glyph 5.81:1, hint 5.81:1,
control border 4.45:1.

## Portability

The text field plus icons and a status line. Hosts hide their own cancel
button; hosts that cannot draw the hint omit it and keep the shortcut in the
tooltip.

## Non-examples

Rounded or pill-shaped search boxes. A magnifier button that submits
instead of an icon. A spinner while loading. Results announced on every
keystroke. "No results" in red or with the ✕ glyph. A clear button that is
always visible. A search field without a label. Disabling by opacity.
