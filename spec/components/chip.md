---
id: chip
name: Chip
family: display
maturity: stable
priority: R1
since: 0.1.0
order: 40
summary: A square bordered token for a filter, a removable value or a static tag; a pressed filter chip takes the selection fill and a check glyph.
native: true
aria:
  pattern: native button with aria-pressed for filters; a span with a labelled remove button for values; a plain span for tags
variants:
  - id: filter
    name: Filter
    description: A toggle button with aria-pressed; selected chips filter the view.
  - id: removable
    name: Removable
    description: A value with a labelled × button that removes it.
  - id: static
    name: Static
    description: A read-only tag; no hover, no focus.
sizes: [compact, comfortable]
states:
  - default
  - hover
  - focus-visible
  - selected
  - selected+focus-visible
  - disabled
tokens:
  root.bg: color.surface.default
  root.border: color.border.control
  root.text: color.text.default
  root.bg-hover: color.interaction.hover.bg
  root.bg-pressed: color.interaction.pressed.bg
  root.ring: color.interaction.focus.ring
  root.text-disabled: color.text.disabled
  root.border-disabled: color.border.disabled
  root.bg-disabled: color.interaction.disabled.bg
  selected.bg: color.interaction.selection.bg
  selected.text: color.interaction.selection.text
  selected.ring: color.interaction.focus.ring-container
  remove.text: color.text.muted
  remove.text-hover: color.text.bright
  remove.bg-hover: color.interaction.hover.bg-strong
stateTokens:
  default: { fg: color.text.default, bg: color.surface.default, border: color.border.control }
  hover: { fg: color.text.default, bg: color.interaction.hover.bg, border: color.border.control }
  focus-visible: { fg: color.text.default, bg: color.surface.default, border: color.border.control, outline: color.interaction.focus.ring }
  selected: { fg: color.interaction.selection.text, bg: color.interaction.selection.bg }
  selected+focus-visible: { fg: color.interaction.selection.text, bg: color.interaction.selection.bg, outline: color.interaction.focus.ring-container }
contrast:
  - { fg: color.text.muted, bg: color.surface.default, label: "remove glyph at rest" }
  - { fg: color.text.disabled, bg: color.interaction.disabled.bg, min: 3, kind: ui, state: disabled, label: "disabled chip text (exempt; house floor 3:1)" }
  - { fg: color.border.disabled, bg: color.interaction.disabled.bg, min: 1, kind: ui, state: disabled, label: "disabled chip border (exempt)", waiver: "disabled controls are exempt from 1.4.11" }
anatomy:
  - part: root
    description: The button or span; 1px border.control on surface.default, control height, square.
  - part: check
    description: The ✓ glyph gutter of a filter chip, visible while pressed.
  - part: label
    description: The chip text in text.default; on-fill text when selected.
  - part: remove
    description: In the removable variant, a × button labelled "Remove <value>" with its own tab stop and ring.
keyboard:
  - key: Tab / Shift+Tab
    action: Reaches a filter chip, or the remove button of a removable chip; static chips are skipped.
  - key: Space / Enter
    action: Toggles a filter chip; activates the remove button.
  - key: Backspace / Delete
    action: In a token field, removes the chip before the caret (the field's contract, not the chip's).
responsive: A chip never wraps its label; a row of chips wraps at 320px with the density gap between rows. Long values are shortened by the host with a full-value tooltip, never by clipping the border. RTL mirrors the check gutter and the remove button to the inline end.
portability:
  web: A filter chip is a button with aria-pressed; a removable chip is a span holding the label and a button with aria-label "Remove <value>"; a static chip is a span; the fill is a background, the ring an outline, the check a glyph.
  nativeFallbacks:
    - GTK4 ToggleButton for filters; a Box of Label and Button for removable values.
    - Qt QPushButton with checkable for filters; a QFrame with a QToolButton for removable values.
    - "Terminal UI: bracketed labels; the pressed chip inverted; removable values followed by an x."
fixtures: [FX-LONG, FX-320, FX-ZOOM-200, FX-I18N, FX-RTL, FX-RM, FX-HC, FX-TOUCH, FX-STATE-MATRIX]
related: [badge, button, multiselect, combobox, toolbar]
specimens: [filterable-table, admin-form]
keywords: [chip, tag, token, filter, removable, toggle, pressed, value]
sources: [j3w1-web]
compact: false
---

## Purpose

Represents one value the user can toggle or remove: a filter in a
filterable table, a chosen item in a multiselect, a tag on a record. A chip
that only informs is a badge; a chip that runs an action is a button.

## Anatomy

A square control-height box with 1px {color.border.control} on
{color.surface.default} and text in {color.text.default}. A filter chip is a
button with a check gutter that shows ✓ while pressed. A removable chip is a
span holding the label and a × button in {color.text.muted}. A static chip is
a span with nothing else. When selected, the chip fills with
{color.interaction.selection.bg} and its text becomes
{color.interaction.selection.text}.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | 1px {color.border.control} on {color.surface.default}; text {color.text.default} | — |
| hover | background → {color.interaction.hover.bg}; the remove button → {color.interaction.hover.bg-strong} with {color.text.bright} | cursor: pointer |
| focus-visible | ring 1px dashed {color.interaction.focus.ring} at −2px on the chip or on the remove button | the ring |
| selected | fill {color.interaction.selection.bg}; text and glyph {color.interaction.selection.text}; the border takes the fill colour | `aria-pressed="true"`; the ✓ glyph |
| selected+focus-visible | the fill and the ring in {color.interaction.focus.ring-container} | both visible at once |
| disabled | text {color.text.disabled}; border {color.border.disabled}; background {color.interaction.disabled.bg}; no hover | `disabled`; cursor: not-allowed |

Pressing a filter chip uses {color.interaction.pressed.bg} for the duration
of the press only. Precedence: disabled > selected > hover; focus-visible is
always drawn.

## Keyboard

A filter chip is one tab stop that toggles on Space or Enter. A removable
chip contributes only its remove button to the tab order; the label is not
focusable. A static chip is never focusable. Inside a token field the field
owns Backspace and the arrow keys.

## Accessibility

Filter chips expose `aria-pressed` and keep the same label in both states;
the ✓ glyph is `aria-hidden`. The remove button is named "Remove <value>" so
it is unambiguous out of context, and removing a chip moves focus to the
next chip or the field. Contrast: text 8.43:1, border 4.33:1, selected text
12.47:1 on the fill, ring 4.57:1 on the surface and 7.48:1 on the fill,
remove glyph 5.66:1. Chips and remove buttons are at least 24×24 CSS pixels
in `compact` density with 4px between neighbours.

## Portability

A bordered box with a background and an outline; the remove control is an
ordinary small button. Toolkits with a native toggle button take the fill
for the checked state. Hosts without a glyph draw the check as a 2px inset
rule at the inline start and record it.

## Non-examples

Pill or rounded chips. A selected chip shown by a border colour alone
without the fill and `aria-pressed`. A removable chip whose × has no name.
A chip that is a link. A static tag that reacts to hover. Disabling by
opacity. A chip whose label clips inside the border. A chip in caption
type (that is a badge).
