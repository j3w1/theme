---
id: textarea
name: Textarea
family: forms-basic
maturity: stable
priority: R1
since: 0.1.0
order: 30
summary: Multi-line free-text entry in the same box as the text field; resizes vertically only and can show a character count.
native: true
aria:
  pattern: native <textarea> with <label>
  apg: https://www.w3.org/WAI/ARIA/apg/practices/forms/
variants:
  - id: default
    name: Default
  - id: with-count
    name: With character count
    description: A live count under the box in text.muted.
sizes: [compact, comfortable]
states:
  - default
  - hover
  - focus-visible
  - placeholder-shown
  - filled
  - required
  - invalid
  - invalid+focus-visible
  - disabled
  - read-only
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
  root.border-readonly: color.border.divider
  root.bg-readonly: color.surface.canvas
  input.text: color.text.default
  input.text-disabled: color.text.disabled
  input.placeholder: color.text.placeholder
  input.caret: color.code.caret
  input.selection-bg: color.interaction.text-selection.bg
  input.selection-text: color.interaction.text-selection.text
  label.text: color.text.bright
  label.required-mark: color.status.danger.text
  help.text: color.text.muted
  count.text: color.text.muted
  count.text-over: color.status.danger.text
  message.text: color.status.danger.text
stateTokens:
  default: { fg: color.text.default, bg: color.surface.input, border: color.border.control }
  hover: { fg: color.text.default, bg: color.interaction.hover.bg, border: color.border.control }
  focus-visible: { fg: color.text.default, bg: color.surface.input, border: color.border.active, outline: color.interaction.focus.ring }
  placeholder-shown: { fg: color.text.placeholder, bg: color.surface.input, border: color.border.control }
  invalid: { fg: color.text.default, bg: color.surface.input, border: color.status.danger.border }
  invalid+focus-visible: { fg: color.text.default, bg: color.surface.input, border: color.status.danger.border, outline: color.interaction.focus.ring-container }
  read-only: { fg: color.text.default, bg: color.surface.canvas }
contrast:
  - { fg: color.status.danger.text, bg: color.surface.default, label: "validation message on the panel surface" }
  - { fg: color.text.muted, bg: color.surface.default, label: "help and count on the panel surface" }
  - { fg: color.text.disabled, bg: color.interaction.disabled.bg, min: 3, kind: ui, state: disabled, label: "disabled text (exempt; house floor 3:1)" }
  - { fg: color.border.disabled, bg: color.interaction.disabled.bg, min: 1, kind: ui, state: disabled, label: "disabled border (exempt)", waiver: "disabled controls are exempt from 1.4.11" }
  - { fg: color.border.divider, bg: color.surface.canvas, min: 1, kind: ui, state: read-only, label: "read-only bottom edge (decorative; the field has no box)", waiver: "read-only fields are identified by the readonly attribute and the absence of a box, not by this edge" }
anatomy:
  - part: label
    description: Always above the control; carries the required mark.
  - part: root
    description: The control box, 1px border.control on surface.input; grows with its content from three rows.
  - part: input
    description: The native textarea; vertical resize only; text.default, caret code.caret.
  - part: count
    description: Optional "n / max" in text.muted under the box, aligned to the end; turns status.danger.text past the limit with the ✕ glyph.
  - part: help
    description: Below the control in text.muted; stays in the DOM when a message replaces it visually.
  - part: message
    description: The validation message with the ✕ glyph; linked by aria-describedby.
keyboard:
  - key: Tab / Shift+Tab
    action: Moves focus in and out; Tab never inserts a tab character.
  - key: Enter
    action: Inserts a line break; never submits.
  - key: Ctrl+Enter / Cmd+Enter
    action: May submit the owning form when the host binds it; announced in the help text.
responsive: Fills its field container with min-width 0 and width 100%; the resize handle is vertical only so the box can never widen past its container at 320px. RTL keeps the handle on the inline-end corner.
portability:
  web: native <textarea> plus <label>; rows="3" minimum; resize vertical; the count is a live region with aria-live="polite" updated at most once per second; the dashed ring through outline, never box-shadow.
  nativeFallbacks:
    - GTK4 TextView inside a ScrolledWindow with a frame.
    - Qt QPlainTextEdit stylesheet; invalid through a dynamic property selector.
    - "Terminal UI: bordered multi-line box; the count in the bottom border."
fixtures: [FX-LONG, FX-320, FX-ZOOM-200, FX-I18N, FX-RTL, FX-RM, FX-HC, FX-TOUCH, FX-DENSITY, FX-OVERFLOW, FX-STATE-MATRIX]
related: [text-field, field, code-editor]
specimens: [admin-form, settings-panel]
keywords: [textarea, multiline, text, entry, count, resize, form]
sources: [j3w1-web]
compact: false
---

## Purpose

Free text longer than a line: descriptions, messages, notes. It shares the
text field's box, states and message so a form reads as one system. Code
goes in the code-editor component, not a textarea.

## Anatomy

Label above; the box with the native `<textarea>` inside, at least three
rows tall, resizable downwards only; the optional count; help; the
validation message that takes the help slot visually while help stays in the
DOM.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | 1px {color.border.control} on {color.surface.input}; text {color.text.default} | — |
| hover | background → {color.interaction.hover.bg}; border unchanged | cursor: text |
| focus-visible | border → {color.border.active}; ring 1px dashed {color.interaction.focus.ring} at −2px | the ring |
| placeholder-shown | placeholder in {color.text.placeholder}, italic | italic |
| filled | as default with a value | — |
| required | `*` after the label in {color.status.danger.text} plus visually hidden "required" | `required`; the mark |
| invalid | border 2px {color.status.danger.border}; message with the ✕ glyph; a count past its limit turns {color.status.danger.text} with the glyph | border width 1 → 2px; glyph; `aria-invalid` |
| invalid+focus-visible | the 2px danger border and the ring in {color.interaction.focus.ring-container} at −4px | double boundary |
| disabled | text {color.text.disabled}; border {color.border.disabled}; background {color.interaction.disabled.bg}; no resize handle | `disabled`; cursor: not-allowed |
| read-only | no box: 1px dotted {color.border.divider} bottom edge on {color.surface.canvas}; no resize handle; selectable | `readonly`; dotted edge |

Precedence: disabled > invalid > hover; focus-visible is always drawn.

## Keyboard

Native editing. Enter inserts a line break and never submits. Tab leaves
the control; a host that needs literal tabs provides a separate command and
documents it. The count is not focusable.

## Accessibility

A programmatic label is required. Help, count and message are linked
through `aria-describedby` in that order. The count is `aria-live="polite"`
and throttled so it does not announce every keystroke; the limit is stated
in the help text so it is known before typing. `aria-invalid="true"` only
after interaction or submit. Contrast as the text field: text 8.65:1,
placeholder 5.81:1, control border 4.45:1, invalid border 4.69:1, message
5.40:1.

## Portability

Border, background, outline and `resize: vertical`. Hosts without a resize
handle grow the box with content up to a maximum and record it. Hosts
without dashed outlines draw a solid 1px ring.

## Non-examples

Horizontal or free resizing. A box narrower than its label column. A count
that only changes colour past the limit. A glow instead of the dashed ring.
Rounded corners. An auto-growing box with no maximum. Tab inserting a
character. Placeholder text as the label. Disabling by opacity.
