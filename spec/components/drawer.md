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

A panel that opens from the side to hold navigation or a task on narrow
screens, or a secondary form on wide ones. It is a modal dialog with a
different shape: full height, anchored to the start or end edge, with a
single visible border on the edge that faces the page. Below 900px the
sidebar collapses into a drawer; above it, a drawer holds tasks that need
more room than a dialog.

## Anatomy

The backdrop, {color.surface.backdrop} over the page; the panel on
{color.surface.overlay} with a 1px {color.border.overlay} on its inner edge;
the header with the title in {color.text.bright} and Close; the body, rows
divided by {color.border.divider}. The demonstration renders the panel inside
a stage of fixed height standing in for the viewport.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | the panel open at its edge on the backdrop | `open`; the page behind is inert |
| open | as default; opacity 0 → 1 within 150 ms on capable hosts; never a slide | `open`; focus inside the panel |
| closed | nothing: the panel and the backdrop are absent | no `open`; focus back on the opener |
| focus-trapped | the panel carries the container ring, 2px solid {color.interaction.focus.ring-container} at −3px, when it holds focus; the note says Tab cycles | Tab never leaves; the note text |
| reduced-motion | no opacity transition; the panel is simply present or absent | `prefers-reduced-motion` |

Items inside the drawer take the states of the list or navigation they
belong to; Close takes the tertiary button's hover and ring.

## Keyboard

Tab and Shift+Tab cycle inside the panel; the page behind is inert. Escape
closes and returns focus to the opener. Enter or Space on a navigation item
navigates and closes. On open, focus goes to the first focusable element,
which is the first item or Close.

## Accessibility

The panel is named by its title through `aria-labelledby`. `showModal()`
supplies the top layer and inertness; the theme never re-implements the trap
on a non-modal element or on a plain aside. The backdrop is decorative; a
click on it may close the drawer only because Close is also present. Both
edges use logical properties, so the panel and its border mirror in RTL with
no extra rules. Contrast: text 7.92:1 and title 9.49:1 on the overlay
surface, the border 4.30:1, the ring 4.30:1, hovered items 11.41:1 on the
strong hover fill.

## Portability

A full-height box with one border and a dimmed backdrop. Toolkits without a
top layer draw the backdrop as a full-window overlay under the panel;
toolkits with a native sidebar keep it non-modal and record that it is a
sidebar, not a drawer.

## Non-examples

A panel that slides in from the edge. A drawer with a shadow or a rounded
inner corner. A drawer that is a plain aside with a hand-written focus trap.
A bottom sheet with a drag handle. A drawer with no Close button. A drawer
that stays open under a dialog. A translucent panel over page content.
