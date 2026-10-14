---
id: combobox
name: Combobox
family: forms-advanced
maturity: stable
priority: R1
since: 0.1.0
order: 10
summary: A text input that filters a listbox of suggestions; the APG combobox with list autocomplete, rendered with the list open.
native: false
aria:
  pattern: "APG combobox with list autocomplete: input role combobox owning a listbox of options"
  apg: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
  role: combobox
variants:
  - id: default
    name: Flat list
  - id: with-groups
    name: Grouped options
  - id: no-results
    name: No results
sizes: [compact, comfortable]
states:
  - default
  - hover
  - focus-visible
  - open
  - closed
  - selected
  - invalid
  - invalid+focus-visible
  - disabled
  - no-results
tokens:
  root.bg: color.surface.input
  root.border: color.border.control
  root.bg-hover: color.interaction.hover.bg
  root.border-focus: color.border.active
  root.ring: color.interaction.focus.ring
  root.ring-invalid: color.interaction.focus.ring-container
  root.border-invalid: color.status.danger.border
  root.border-disabled: color.border.disabled
  root.bg-disabled: color.interaction.disabled.bg
  input.text: color.text.default
  input.text-disabled: color.text.disabled
  input.placeholder: color.text.placeholder
  input.caret: color.code.caret
  toggle.text: color.action.tertiary.text
  toggle.bg-hover: color.action.tertiary.hover-bg
  label.text: color.text.bright
  listbox.bg: color.surface.raised
  listbox.border: color.border.overlay
  option.text: color.text.default
  option.bg-hover: color.interaction.hover.bg-strong
  option.text-hover: color.text.link-hover
  option.bg-selected: color.interaction.selection.bg
  option.text-selected: color.interaction.selection.text
  option.ring-selected: color.interaction.focus.ring-container
  group.text: color.text.subtle
  group.border: color.border.divider
  empty.text: color.text.muted
  help.text: color.text.muted
  message.text: color.status.danger.text
stateTokens:
  default: { fg: color.text.default, bg: color.surface.input, border: color.border.control }
  hover: { fg: color.text.link-hover, bg: color.interaction.hover.bg-strong }
  focus-visible: { fg: color.text.default, bg: color.surface.input, border: color.border.active, outline: color.interaction.focus.ring }
  open: { fg: color.text.default, bg: color.surface.raised, border: color.border.overlay }
  selected: { fg: color.interaction.selection.text, bg: color.interaction.selection.bg, outline: color.interaction.focus.ring-container }
  invalid: { fg: color.text.default, bg: color.surface.input, border: color.status.danger.border }
  invalid+focus-visible: { fg: color.text.default, bg: color.surface.input, border: color.status.danger.border, outline: color.interaction.focus.ring-container }
  no-results: { fg: color.text.muted, bg: color.surface.raised, border: color.border.overlay }
contrast:
  - { fg: color.text.subtle, bg: color.surface.raised, label: "group heading on the listbox" }
  - { fg: color.status.danger.text, bg: color.surface.canvas, label: "validation message on the canvas" }
  - { fg: color.text.muted, bg: color.surface.canvas, label: "help text on the canvas" }
  - { fg: color.text.disabled, bg: color.interaction.disabled.bg, min: 3, kind: ui, state: disabled, label: "disabled text (exempt; house floor 3:1)" }
  - { fg: color.border.disabled, bg: color.interaction.disabled.bg, min: 1, kind: ui, state: disabled, label: "disabled border (exempt)", waiver: "disabled controls are exempt from 1.4.11" }
  - { fg: color.border.divider, bg: color.surface.raised, min: 1, kind: ui, label: "group separator (decorative)", waiver: "groups are announced through role=group and their heading; the rule is decorative" }
anatomy:
  - part: label
    description: Above the control; the accessible name of the input.
  - part: root
    description: The control box holding the input and the toggle; 1px border.control on surface.input.
  - part: input
    description: The native text input with role combobox, aria-autocomplete list, aria-expanded and aria-controls.
  - part: toggle
    description: An optional button that opens the list without typing; tabindex -1, labelled.
  - part: listbox
    description: The suggestion list, surface.raised behind a 1px border.overlay, rendered directly below the box.
  - part: option
    description: One suggestion; the active descendant carries aria-selected and the selection fill.
  - part: group
    description: Optional role group with a heading in text.subtle, separated by a divider rule.
  - part: empty
    description: The no-results row, a disabled option in text.muted shown when nothing matches; the match count is announced through a polite live region.
  - part: help / message
    description: Help below the box in text.muted; the validation message with the ✕ glyph replaces it visually.
keyboard:
  - key: Down / Up
    action: Opens the list if closed; moves the active option, wrapping at either end; the input keeps DOM focus.
  - key: Enter
    action: Accepts the active option into the input and closes the list.
  - key: Escape
    action: Closes the list; a second Escape clears the input.
  - key: Alt+Down / Alt+Up
    action: Opens or closes the list without moving the active option.
  - key: Home / End
    action: Moves the caret inside the input, never the active option.
  - key: Tab
    action: Leaves the control; an open list closes and the typed text stays.
responsive: The box fills its field container with min-width 0; the list is as wide as the box and scrolls after eight rows; at 320px nothing overflows horizontally. RTL mirrors the toggle and the group indentation.
portability:
  web: "<input role=combobox aria-autocomplete=list aria-expanded aria-controls> owning a <ul role=listbox>; the active option through aria-activedescendant, never by moving DOM focus; the list is a sibling in flow or a popover, never an iframe."
  nativeFallbacks:
    - GTK4 Entry with an EntryCompletion; the selection fill through the .selected style class.
    - Qt QComboBox editable with a QCompleter; popup frame through QAbstractItemView stylesheet.
    - "Terminal UI: a line editor with a list of suggestions drawn below it; the active row inverted."
fixtures: [FX-LONG, FX-320, FX-ZOOM-200, FX-I18N, FX-RTL, FX-RM, FX-HC, FX-OVERFLOW, FX-STATE-MATRIX]
related: [text-field, select, multiselect, search-field, menu, command-palette]
specimens: [admin-form, filterable-table]
keywords: [combobox, autocomplete, typeahead, suggestions, listbox, filter]
sources: [j3w1-web]
compact: false
---

## Purpose

A text input completed from a list of suggestions, for large or open-ended
sets (fonts, hosts, tags); a closed set of a dozen values is `select`. The
demonstration renders the list open so every option state shows without a
script.

## Anatomy

Parts as listed in the anatomy; help and validation message behave as in
`text-field`.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | 1px {color.border.control} on {color.surface.input}; list on {color.surface.raised}, 1px {color.border.overlay} | — |
| hover | box → {color.interaction.hover.bg}; hovered option → {color.interaction.hover.bg-strong} with {color.text.link-hover} | cursor: text on the box, default on the list |
| focus-visible | box border → {color.border.active}; 1px dashed {color.interaction.focus.ring} at −2px | the ring |
| open | list below the box; toggle glyph rotated 180° | `aria-expanded="true"`; toggle glyph |
| closed | no list; box unchanged | `aria-expanded="false"`; nothing below the box |
| selected | active option filled {color.interaction.selection.bg} with {color.interaction.selection.text}, 1px dashed {color.interaction.focus.ring-container} ring | `aria-selected="true"`; `aria-activedescendant`; the ring |
| invalid | 2px {color.status.danger.border}; message with ✕ | border 1 → 2px; glyph; `aria-invalid` |
| invalid+focus-visible | 2px danger border and {color.interaction.focus.ring-container} ring at −4px | double boundary |
| disabled | {color.text.disabled}, {color.border.disabled}, {color.interaction.disabled.bg}; list never opens | `disabled`; cursor: not-allowed |
| no-results | only the empty row, {color.text.muted} italic | `aria-disabled` row; italic; polite zero-match announcement |

Precedence when several apply: disabled > invalid > selected > hover;
focus-visible is always drawn on the box, and the selection ring on the
option.

## Keyboard

As in the key table. Typing filters on every keystroke; the match count is
announced through a polite live region, not by re-reading the list.

## Accessibility

The listbox is named (`aria-label`, or `aria-labelledby` the field label);
options are `role="option"`, `aria-selected` on the active one only; groups
are `role="group"` labelled by their heading. The empty row is a disabled
option so the list is never empty. Text meets 4.5:1; list border and
selection ring 3:1.

## Portability

Background, border and outline express everything; the toggle rotation is a
transform inside the motion budget. A toolkit with a native completion popup
uses it, mapping the option fill to the selection roles and the list border
to the popover frame. Without `aria-activedescendant`, real focus moves to the
option and the deviation is recorded.

## Non-examples

A select restyled as a combobox. DOM focus moving into the list on Down. A
list floating with a shadow or rounded frame. The active option marked by text
colour alone. A no-results state that silently shows the full list. Opening
on hover. A list that slides or fades in for longer than 150 ms.
