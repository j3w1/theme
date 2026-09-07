---
id: dialog
name: Dialog
family: feedback
maturity: stable
priority: R1
since: 0.1.0
order: 60
summary: A native dialog on the overlay surface behind a 1px overlay border and the backdrop; modal when shown, with trapped focus and Escape to close.
native: true
aria:
  pattern: "native <dialog> opened with showModal; role=alertdialog for confirmations; named by its heading, described by its first paragraph"
  apg: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
variants:
  - id: default
    name: Confirm
  - id: alert-dialog
    name: Alert dialog
  - id: form
    name: Form
sizes: [compact, comfortable]
states:
  - default
  - open
  - closed
  - focus-trapped
  - hover
  - focus-visible
  - reduced-motion
tokens:
  backdrop.bg: color.surface.backdrop
  root.bg: color.surface.overlay
  root.border: color.border.overlay
  root.ring: color.interaction.focus.ring-container
  root.z: z.dialog
  title.text: color.text.bright
  text.text: color.text.default
  close.text: color.action.tertiary.text
  close.bg-hover: color.action.tertiary.hover-bg
  close.ring: color.interaction.focus.ring
  button.text: color.action.secondary.text
  button.border: color.action.secondary.border
  button.bg-hover: color.action.secondary.hover-bg
  primary.bg: color.action.primary.bg
  primary.text: color.action.primary.text
  primary.bg-hover: color.action.primary.hover-bg
  destructive.bg: color.action.destructive.filled-bg
  destructive.text: color.action.destructive.filled-text
  destructive.bg-hover: color.action.destructive.hover-bg
  field.bg: color.surface.input
  field.border: color.border.control
  field.label: color.text.bright
  note.text: color.text.muted
stateTokens:
  default: { fg: color.text.default, bg: color.surface.overlay, border: color.border.overlay }
  open: { fg: color.text.default, bg: color.surface.overlay, border: color.border.overlay }
  focus-trapped: { fg: color.text.default, bg: color.surface.overlay, border: color.border.overlay, outline: color.interaction.focus.ring-container }
  hover: { fg: color.action.tertiary.text, bg: color.action.tertiary.hover-bg }
  focus-visible: { fg: color.action.tertiary.text, bg: color.surface.overlay, outline: color.interaction.focus.ring }
  reduced-motion: { fg: color.text.default, bg: color.surface.overlay, border: color.border.overlay }
contrast:
  - { fg: color.text.bright, bg: color.surface.overlay, label: "title on the overlay surface" }
  - { fg: color.text.muted, bg: color.surface.overlay, label: "note on the overlay surface" }
  - { fg: color.action.secondary.text, bg: color.surface.overlay, label: "secondary button text on the overlay surface" }
  - { fg: color.action.secondary.border, bg: color.surface.overlay, min: 3, kind: ui, label: "secondary button boundary on the overlay surface" }
  - { fg: color.action.primary.text, bg: color.action.primary.bg, label: "primary button text" }
  - { fg: color.action.destructive.filled-text, bg: color.action.destructive.filled-bg, label: "destructive confirm text on its fill" }
  - { fg: color.action.destructive.filled-bg, bg: color.surface.overlay, min: 3, kind: ui, label: "destructive fill against the overlay surface" }
  - { fg: color.interaction.focus.ring-container, bg: color.action.primary.bg, min: 3, kind: ui, state: focus-visible, label: "ring on the primary fill" }
  - { fg: color.action.destructive.filled-text, bg: color.action.destructive.filled-bg, min: 3, kind: ui, state: focus-visible, label: "ring on the destructive fill" }
  - { fg: color.text.default, bg: color.surface.input, label: "form field text" }
  - { fg: color.border.control, bg: color.surface.overlay, min: 3, kind: ui, label: "form field boundary on the overlay surface" }
anatomy:
  - part: backdrop
    description: The page dimmed by surface.backdrop behind the dialog; simulated by a wrapper in the demonstration.
  - part: root
    description: The native dialog, surface.overlay behind a 1px border.overlay, at most 28rem wide, at z.dialog; named by its title.
  - part: header
    description: The title in text.bright (h2) and the Close button.
  - part: body
    description: One or two paragraphs in text.default, or a short form; the first paragraph describes the dialog.
  - part: actions
    description: The buttons, end-aligned; the confirming action last; a destructive confirm uses the filled destructive tone.
  - part: close
    description: A tertiary button labelled "Close"; present in every dialog that can be dismissed without a choice.
keyboard:
  - key: Tab / Shift+Tab
    action: Cycles through the dialog's focusable elements and never leaves it while open.
  - key: Escape
    action: Closes the dialog (cancel) and returns focus to the element that opened it.
  - key: Enter
    action: In a form dialog, submits; otherwise activates the focused button only.
  - key: Space
    action: Activates the focused button.
responsive: At most 28rem wide and 100% minus the 16px gutter below that; the body scrolls inside the dialog when taller than the viewport, header and actions stay visible; at 320px buttons stack. RTL mirrors the header and the action order.
portability:
  web: "native <dialog> opened with showModal() so the host provides the top layer, inertness of the page and Escape; ::backdrop takes surface.backdrop; focus moves to the first focusable element (or the dialog itself) on open and back to the opener on close; role=alertdialog with aria-describedby for confirmations."
  nativeFallbacks:
    - GTK4 Window with modal and transient-for; the css node gets the overlay border.
    - Qt QDialog modal; stylesheet border and background; QMessageBox for the alert dialog.
    - "Terminal UI: a centred box drawn with a single-line border over a dimmed screen."
fixtures: [FX-LONG, FX-320, FX-ZOOM-200, FX-I18N, FX-RTL, FX-RM, FX-HC, FX-OVERFLOW, FX-STATE-MATRIX]
related: [drawer, alert, toast, button, text-field, popover]
specimens: [admin-form, settings-panel]
keywords: [dialog, modal, confirm, alert dialog, backdrop, focus trap, escape]
sources: [j3w1-web]
compact: true
---

## Purpose

A question or a small task that must be answered before the page continues:
confirm a destructive action, name a new profile, sign in again. It takes
the whole screen's attention, so it is short, has a clear title, and always
offers a way out. The demonstration renders the dialog open in flow, with a
wrapper standing in for the backdrop; a host always uses `showModal()`.

## Anatomy

The backdrop, {color.surface.backdrop} over the page; the dialog on
{color.surface.overlay} behind a 1px {color.border.overlay}; the header with
the title in {color.text.bright} and Close; the body in {color.text.default};
the actions row. Confirmation semantics do not prescribe action tone (D-015):
ordinary confirmations use primary. A destructive confirmation uses the filled destructive button,
{color.action.destructive.filled-bg} with {color.action.destructive.filled-text};
the form dialog holds a labelled text field on {color.surface.input}.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | the dialog open on its backdrop | `open`; the page behind is inert |
| open | as default; opacity 0 → 1 within 150 ms on capable hosts | `open`; focus inside the dialog |
| closed | nothing: the dialog and its backdrop are absent | no `open`; focus back on the opener |
| focus-trapped | the dialog itself carries the container ring, 2px solid {color.interaction.focus.ring-container} at −3px, when it holds focus; the note says Tab cycles | Tab never leaves; the note text |
| hover | Close background → {color.action.tertiary.hover-bg}; other buttons take their tone's hover | cursor: pointer |
| focus-visible | ring 1px dashed {color.interaction.focus.ring} at −2px on the focused control; primary uses {color.interaction.focus.ring-container}, destructive uses {color.action.destructive.filled-text} (D-015) | the ring |
| reduced-motion | no opacity transition; the dialog is simply present or absent | `prefers-reduced-motion` |

A dialog is never disabled; a busy dialog disables its confirm button and
shows the ⋯ glyph on it.

## Keyboard

Tab and Shift+Tab cycle inside the dialog; nothing behind it is reachable.
Escape closes and cancels, and focus returns to the opener. Enter submits a
form dialog; elsewhere it only activates the focused button, so a
destructive confirm is never triggered by Enter on the dialog itself. On
open, focus goes to the first focusable element, or to the dialog when the
first element is destructive; on close, back to the opener.

## Accessibility

The dialog is named by its title through `aria-labelledby` and described by
its first paragraph through `aria-describedby`. Confirmations use
`role="alertdialog"`. `showModal()` makes the rest of the page inert and
supplies the top layer; the theme never re-implements the trap on a
non-modal dialog. The backdrop is decorative and not a click target for
cancel unless Close is also present. Contrast: text 7.92:1 and title 9.49:1
on the overlay surface, the overlay border 4.30:1, secondary buttons 6.84:1
on hover, destructive confirm text 4.58:1 on its fill, the container ring
9.49:1.

## Portability

A box, a border, a dimmed backdrop and the button tones. Toolkits with a
native modal window use it with the overlay border on the frame and record
that the backdrop is the host's. Toolkits without a top layer draw the
backdrop as a full-window overlay under the dialog.

## Non-examples

A glowing or shadowed card. Rounded corners. A dialog that slides or scales
in. `<dialog>` shown with `show()` and a hand-written focus trap. A dialog
with no title, or with the title only in the accessible name. A destructive
confirm as the default Enter action. A backdrop that closes the dialog with
no Close button. A dialog stacked on a dialog.
