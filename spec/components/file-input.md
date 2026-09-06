---
id: file-input
name: File input
family: forms-advanced
maturity: stable
priority: R1
since: 0.1.0
order: 40
summary: A native file input behind a label styled as a secondary button, optionally inside a drop zone, with a list of chosen files and per-file errors.
native: true
aria:
  pattern: "native <input type=file> named by two <label>s; the drop zone is a plain region, never a role"
  apg: https://www.w3.org/WAI/ARIA/apg/practices/forms/
variants:
  - id: default
    name: Button
  - id: drop-zone
    name: Drop zone
  - id: with-list
    name: With chosen files
sizes: [compact, comfortable]
states:
  - default
  - hover
  - focus-visible
  - drop-target
  - invalid
  - disabled
  - loading
tokens:
  button.bg: color.action.secondary.bg
  button.text: color.action.secondary.text
  button.border: color.action.secondary.border
  button.bg-hover: color.action.secondary.hover-bg
  button.bg-pressed: color.action.secondary.pressed-bg
  button.ring: color.interaction.focus.ring
  button.border-invalid: color.status.danger.border
  button.text-disabled: color.text.disabled
  button.border-disabled: color.border.disabled
  button.bg-disabled: color.interaction.disabled.bg
  zone.border: color.interaction.drop-target
  zone.bg-drop-target: color.interaction.marquee
  zone.hint: color.text.muted
  label.text: color.text.bright
  status.text: color.text.muted
  list.text: color.text.default
  list.divider: color.border.divider
  list.size: color.text.subtle
  list.error: color.status.danger.text
  remove.text: color.action.tertiary.text
  remove.bg-hover: color.action.tertiary.hover-bg
  progress.track: color.interaction.pressed.bg
  progress.stripe: color.action.primary.bg
  help.text: color.text.muted
  message.text: color.status.danger.text
stateTokens:
  default: { fg: color.action.secondary.text, bg: color.surface.canvas, border: color.action.secondary.border }
  hover: { fg: color.action.secondary.text, bg: color.action.secondary.hover-bg }
  focus-visible: { fg: color.action.secondary.text, bg: color.surface.canvas, border: color.action.secondary.border, outline: color.interaction.focus.ring }
  drop-target: { fg: color.text.default, bg: color.interaction.marquee, border: color.interaction.drop-target }
  invalid: { fg: color.action.secondary.text, bg: color.surface.canvas, border: color.status.danger.border }
contrast:
  - { fg: color.action.secondary.border, bg: color.surface.canvas, min: 3, kind: ui, state: hover, label: "hovered button boundary against the canvas outside it", waiver: "inside the hover fill the control border measures 2.94:1; the boundary is judged against the canvas on its outer side (4.45:1), and the fill change is itself the hover signal" }
  - { fg: color.interaction.drop-target, bg: color.surface.canvas, min: 3, kind: ui, label: "drop-zone dashed border at rest" }
  - { fg: color.text.muted, bg: color.surface.canvas, label: "status, hint and help text on the canvas" }
  - { fg: color.text.subtle, bg: color.surface.canvas, label: "file sizes on the canvas" }
  - { fg: color.status.danger.text, bg: color.surface.canvas, label: "per-file error and validation message on the canvas" }
  - { fg: color.text.disabled, bg: color.interaction.disabled.bg, min: 3, kind: ui, state: disabled, label: "disabled button text (exempt; house floor 3:1)" }
  - { fg: color.border.disabled, bg: color.interaction.disabled.bg, min: 1, kind: ui, state: disabled, label: "disabled border (exempt)", waiver: "disabled controls are exempt from 1.4.11" }
  - { fg: color.action.primary.bg, bg: color.interaction.pressed.bg, min: 1, kind: ui, state: loading, label: "progress stripes (decorative pattern)", waiver: "the stripes are a pattern, not a boundary; the loading state is carried by aria-busy and the visible status text" }
anatomy:
  - part: label
    description: The field name above the control; a real label for the input.
  - part: root
    description: The row holding the button and the status text; in the drop-zone variant it is the zone itself, padded, with a dashed drop-target border.
  - part: button
    description: A second label for the input, styled as a secondary button (outline in action.secondary.border, text action.secondary.text).
  - part: native
    description: The native file input, visually hidden but focusable; it carries the accessible name, focus and every attribute.
  - part: status
    description: The chosen-file summary in text.muted next to the button, or the drop hint inside the zone.
  - part: list
    description: The chosen files, one row each with name, size in text.subtle and a remove button; a failed file carries the ✕ glyph and its error in status.danger.text.
  - part: progress
    description: A static striped bar shown while files are uploading.
  - part: help / message
    description: Help in text.muted; the validation message with the ✕ glyph replaces it visually.
keyboard:
  - key: Tab / Shift+Tab
    action: Reaches the native input (drawn as the button), then each remove button in the list.
  - key: Enter / Space
    action: Opens the host file chooser from the input.
  - key: Delete / Backspace
    action: On a focused remove button, same as activating it.
  - key: Escape
    action: Closes the host chooser (host behaviour).
responsive: The button and status wrap onto two rows below 320px; the list rows truncate file names with an ellipsis and keep the size and remove button visible; the drop zone keeps its padding. RTL mirrors the button and status order and the list columns.
portability:
  web: "native <input type=file> with the sr-only pattern (never display none, which removes it from the tab order); two <label for> elements name it; the drop zone listens for dragover and drop on the root and mirrors the drop-target attribute; progress through aria-busy on the root and a live status."
  nativeFallbacks:
    - GTK4 FileDialog opened from a Button; the chosen list is a ListBox.
    - Qt QFileDialog from a QPushButton; the list is a QListWidget.
    - "Terminal UI: a path line editor with completion; no drop zone."
fixtures: [FX-LONG, FX-320, FX-ZOOM-200, FX-I18N, FX-RTL, FX-RM, FX-HC, FX-OVERFLOW, FX-STATE-MATRIX]
related: [button, text-field, progress, list, field]
specimens: [admin-form]
keywords: [file, upload, attachment, drop zone, drag and drop, chooser]
sources: [j3w1-web]
compact: false
---

## Purpose

Choosing one or more files from the host. The native input keeps the host
chooser, its keyboard behaviour and its security model; the theme replaces
only the input's own rendering with a button-styled label, adds an optional
drop zone, and lists what was chosen with any per-file error.

## Anatomy

The field label; the root row (or the drop zone) holding the button-styled
label and the status text; the hidden-but-focusable native input; an optional
list of chosen files, each with name, size in {color.text.subtle} and a
remove button, one of which may carry the ✕ glyph and an error in
{color.status.danger.text}; a static striped progress bar while uploading;
help and validation message below.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | button: 1px {color.action.secondary.border} outline, text {color.action.secondary.text}; zone: 1px dashed {color.interaction.drop-target} | — |
| hover | button background → {color.action.secondary.hover-bg}; border unchanged | cursor: pointer |
| focus-visible | ring 1px dashed {color.interaction.focus.ring} at −2px on the button (the input has focus) | the ring |
| drop-target | root fill {color.interaction.marquee}; border 1px dashed {color.interaction.drop-target} | dashed pattern; the hint text changes to "Release to add" |
| invalid | button border 2px {color.status.danger.border}; message with the ✕ glyph; a failed row shows its own ✕ | border width 1 → 2px; glyphs; `aria-invalid` |
| disabled | button text {color.text.disabled}, border {color.border.disabled}, background {color.interaction.disabled.bg}; the zone's dashes take {color.border.disabled}; no hover | `disabled`; cursor: not-allowed |
| loading | a static bar of 45° stripes, {color.action.primary.bg} on {color.interaction.pressed.bg}, below the row; the button stays enabled | `aria-busy`; the status text reads "Uploading n files"; no animation |

Precedence when several apply: disabled > loading > invalid > drop-target >
hover; focus-visible is always drawn.

## Keyboard

Tab reaches the native input, which is drawn as the button; Enter or Space
opens the host chooser; Escape in the chooser returns to the input. Each
remove button in the list is its own tab stop after the input, and Delete or
Backspace on it acts like Enter. Dropping is a pointer gesture only and never
the sole way to add a file.

## Accessibility

The native input is hidden with the `sr-only` pattern, never `display: none`
or `visibility: hidden`, so it keeps focus and the host chooser. It is named
by both labels ("Attachments" and "Choose files"), and `aria-describedby`
lists help and message. The status text and the list are announced through a
polite live region after a choice; per-file errors are in the row text, not
only in colour. The drop zone has no role and no `tabindex`; `aria-busy` on
the root marks uploading. Contrast: button text 10.37:1 on the canvas and
6.84:1 on the hover fill, button border 4.45:1, drop-target border 4.69:1 on
the canvas and 4.52:1 on the marquee fill, status and help 5.81:1, sizes
5.10:1, danger text 5.40:1.

## Portability

The button is the secondary button of the actions family; the zone is a
dashed border and a translucent fill; the stripes are a repeating gradient
(or a hatched brush). Toolkits without drag-and-drop omit the zone and keep
the button; toolkits without a translucent fill composite the marquee over the
canvas and record the value.

## Non-examples

A hidden input with `display: none` and a button that clicks it by script. A
drop zone that is the only way to add files. A rounded, dotted, animated
"pulsing" zone. A spinner while uploading. A progress bar that animates its
stripes. Errors shown by a red file name alone. Disabling by opacity.
