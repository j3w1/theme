---
id: drawer
name: Drawer
family: feedback
maturity: stable
priority: R1
since: 0.1.0
order: 70
summary: A full-height modal panel anchored to the start or end edge; a native dialog on the overlay surface with a 1px overlay border on its inner edge.
native: true
aria:
  pattern: "native <dialog> opened with showModal, anchored to an inline edge; named by its heading; Escape closes"
  apg: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
variants:
  - id: start
    name: Start edge
  - id: end
    name: End edge
sizes: [compact, comfortable]
states:
  - default
  - open
  - closed
  - focus-trapped
  - reduced-motion
tokens:
  backdrop.bg: color.surface.backdrop
  root.bg: color.surface.overlay
  root.border: color.border.overlay
  root.ring: color.interaction.focus.ring-container
  root.z: z.drawer
  title.text: color.text.bright
  text.text: color.text.default
  body.divider: color.border.divider
  item.text: color.text.default
  item.bg-hover: color.interaction.hover.bg-strong
  item.text-hover: color.text.link-hover
  close.text: color.action.tertiary.text
  close.bg-hover: color.action.tertiary.hover-bg
  close.ring: color.interaction.focus.ring
  note.text: color.text.muted
stateTokens:
  default: { fg: color.text.default, bg: color.surface.overlay, border: color.border.overlay }
  open: { fg: color.text.default, bg: color.surface.overlay, border: color.border.overlay }
  focus-trapped: { fg: color.text.default, bg: color.surface.overlay, border: color.border.overlay, outline: color.interaction.focus.ring-container }
  reduced-motion: { fg: color.text.default, bg: color.surface.overlay, border: color.border.overlay }
contrast:
  - { fg: color.text.bright, bg: color.surface.overlay, label: "title on the overlay surface" }
  - { fg: color.text.muted, bg: color.surface.overlay, label: "note on the overlay surface" }
  - { fg: color.action.tertiary.text, bg: color.surface.overlay, label: "close button on the overlay surface" }
  - { fg: color.interaction.focus.ring, bg: color.surface.overlay, min: 3, kind: ui, label: "ring on the overlay surface" }
  - { fg: color.text.link-hover, bg: color.interaction.hover.bg-strong, label: "hovered item" }
  - { fg: color.border.divider, bg: color.surface.overlay, min: 1, kind: ui, label: "row dividers (decorative)", waiver: "rows are list items; the divider separates, it does not bound a control" }
anatomy:
  - part: backdrop
    description: The page dimmed by surface.backdrop; simulated by a stage wrapper of fixed height in the demonstration.
  - part: root
    description: The native dialog, full height, at most 20rem wide, surface.overlay with a 1px border.overlay on the edge facing the page, at z.drawer.
  - part: header
    description: The title in text.bright and the Close button.
  - part: body
    description: Navigation or a form; scrolls inside the panel; rows separated by border.divider.
  - part: close
    description: A tertiary button labelled "Close"; always present.
keyboard:
  - key: Tab / Shift+Tab
    action: Cycles inside the drawer and never leaves it while open.
  - key: Escape
    action: Closes the drawer and returns focus to the element that opened it.
  - key: Enter / Space
    action: Activates the focused item or button; a navigation item closes the drawer after navigating.
responsive: At most 20rem wide and 100% minus the 48px gutter below 360px; always the full height of the viewport; the body scrolls inside. RTL swaps the edges, which the logical properties do on their own.
portability:
  web: "native <dialog> opened with showModal() and positioned with inset-block 0 and inset-inline-start or -end 0, so the top layer, inertness and Escape come from the host; ::backdrop takes surface.backdrop; focus moves to the first focusable element on open and back to the opener on close."
  nativeFallbacks:
    - GTK4 a Window with modal set and the panel aligned to an edge; libadwaita sidebars are not drawers.
    - Qt QDockWidget floating and modal is not equivalent; a QDialog positioned at the edge with the overlay border.
    - "Terminal UI: a full-height column at the edge drawn with a single vertical line, the rest of the screen dimmed."
fixtures: [FX-LONG, FX-320, FX-ZOOM-200, FX-I18N, FX-RTL, FX-RM, FX-HC, FX-OVERFLOW, FX-STATE-MATRIX]
related: [dialog, sidebar-nav, menu, toolbar]
specimens: [settings-panel, i3-window-frame]
keywords: [drawer, side panel, sheet, off-canvas, navigation, modal, edge]
sources: [j3w1-web]
compact: false
---

## Purpose

A modal dialog shaped as a full-height side panel, for navigation or a task.
Below 900px the sidebar collapses into a drawer; above it, a drawer holds
tasks that need more room than a dialog.

## Anatomy

Parts as listed in the anatomy; the overlay border is the only visible edge.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | the panel open at its edge on the backdrop | `open`; the page behind is inert |
| open | as default; opacity 0 → 1 within 150 ms on capable hosts; never a slide | `open`; focus inside the panel |
| closed | panel and backdrop absent | no `open`; focus back on the opener |
| focus-trapped | while it holds focus, the panel carries the 2px solid {color.interaction.focus.ring-container} ring at −3px; the note says Tab cycles | Tab never leaves; the note text |
| reduced-motion | no opacity transition; present or absent | `prefers-reduced-motion` |

Items take the states of their list or navigation; Close takes the tertiary
button's hover and ring.

## Keyboard

As in the key table. On open, focus goes to the first focusable element, the
first item or Close.

## Accessibility

Named by its title through `aria-labelledby`. Never re-implement the trap on
a non-modal element or a plain aside. The backdrop is decorative; a click on
it may close the drawer only because Close is also present. Logical
properties mirror the panel and its border in RTL. Text meets 4.5:1; the
border and ring 3:1.

## Portability

Toolkits without a top layer draw the backdrop as a full-window overlay under
the panel; toolkits with a native sidebar keep it non-modal and record that it
is a sidebar, not a drawer.

## Non-examples

A panel that slides in. A shadow or a rounded inner corner. A plain aside
with a hand-written focus trap. A bottom sheet with a drag handle. No Close
button. A drawer that stays open under a dialog. A translucent panel over page
content.
