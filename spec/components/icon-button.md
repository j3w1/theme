---
id: icon-button
name: Icon button
family: actions
maturity: stable
priority: R1
since: 0.1.0
order: 20
summary: A square ghost button whose only content is a 16px line icon; it always carries an accessible name and, as a toggle, aria-pressed.
native: true
aria:
  pattern: native <button> with aria-label; aria-pressed for the toggle
  apg: https://www.w3.org/WAI/ARIA/apg/patterns/button/
variants:
  - id: default
    name: Action
    description: Fires an action; no pressed state.
  - id: toggle
    name: Toggle
    description: Holds a boolean through aria-pressed.
sizes: [compact, comfortable]
states: [default, hover, focus-visible, active, disabled, toggled, toggled+focus-visible]
tokens:
  root.bg: color.action.secondary.bg
  root.text: color.action.tertiary.text
  root.bg-hover: color.action.tertiary.hover-bg
  root.bg-active: color.interaction.pressed.bg
  root.border-active: color.border.active
  root.ring: color.interaction.focus.ring
  root.bg-toggled: color.interaction.selection.bg
  root.text-toggled: color.interaction.selection.text
  root.border-toggled: color.border.selected-indicator
  root.ring-toggled: color.interaction.focus.ring-container
  root.text-disabled: color.text.disabled
  root.bg-disabled: color.interaction.disabled.bg
  root.border-disabled: color.border.disabled
  icon.stroke: color.icon.default
stateTokens:
  default: { fg: color.action.tertiary.text, bg: color.action.secondary.bg }
  hover: { fg: color.action.tertiary.text, bg: color.action.tertiary.hover-bg }
  focus-visible: { fg: color.action.tertiary.text, bg: color.action.secondary.bg, outline: color.interaction.focus.ring }
  active: { fg: color.action.tertiary.text, bg: color.interaction.pressed.bg, border: color.border.active }
  toggled: { fg: color.interaction.selection.text, bg: color.interaction.selection.bg }
  toggled+focus-visible: { fg: color.interaction.selection.text, bg: color.interaction.selection.bg, outline: color.interaction.focus.ring-container }
contrast:
  - { fg: color.border.selected-indicator, bg: color.surface.default, min: 3, kind: ui, state: toggled, label: "toggled border against the panel" }
  - { fg: color.interaction.selection.bg, bg: color.surface.default, min: 3, kind: ui, state: toggled, label: "toggled fill against the panel (decorative)", waiver: "aria-pressed, the filled icon form and the 1px selected-indicator border carry the state; the fill is not the boundary" }
  - { fg: color.text.disabled, bg: color.interaction.disabled.bg, min: 3, kind: ui, state: disabled, label: "disabled icon (exempt; house floor 3:1)" }
  - { fg: color.border.disabled, bg: color.interaction.disabled.bg, min: 1, kind: ui, state: disabled, label: "disabled border (exempt)", waiver: "disabled controls are exempt from 1.4.11" }
anatomy:
  - part: root
    description: The native <button>, square at the density control height, no padding, transparent 1px border at rest so the box never shifts.
  - part: icon
    description: One inline SVG on the 16px grid, 1.5px stroke, currentColor, fill none; aria-hidden.
keyboard:
  - key: Tab / Shift+Tab
    action: Moves focus to and from the button.
  - key: Enter / Space
    action: Activates; the toggle variant flips aria-pressed.
responsive: Fixed square; never shrinks below the density control height, which keeps the 24×24 CSS-pixel target at 320px and in compact density. Direction-neutral; mirrored icons (back, forward) flip in RTL through the host.
portability:
  web: native <button type="button" aria-label="…"> containing one SVG; toggles use aria-pressed, never aria-checked or a class; a tooltip repeats the name on hover and focus.
  nativeFallbacks:
    - GTK4 Button with an icon child and the flat style class; ToggleButton for the toggle.
    - Qt QToolButton with autoRaise; checkable for the toggle.
    - "Terminal UI: a single glyph in brackets; toggled inverted."
fixtures: [FX-320, FX-ZOOM-200, FX-RM, FX-HC, FX-TOUCH, FX-DENSITY, FX-STATE-MATRIX]
related: [button, toolbar, tooltip, segmented-control]
specimens: [filterable-table, i3-window-frame]
keywords: [icon, button, toggle, toolbar, aria-pressed, ghost]
sources: [j3w1-web]
compact: false
---

## Purpose

The tertiary tone in a square, for toolbar actions, close and clear
affordances and boolean toggles such as pin, mute or wrap. If the label must
be visible, use `button`.

## Anatomy

Parts as listed in the anatomy.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | {color.action.tertiary.text} icon, no fill; transparent 1px border | — |
| hover | background → {color.action.tertiary.hover-bg} | cursor: pointer; hover-capable pointers only |
| focus-visible | 1px dashed ring {color.interaction.focus.ring} at −2px | the ring |
| active | background → {color.interaction.pressed.bg}; border → {color.border.active} | border change; no translation |
| disabled | {color.text.disabled} on {color.interaction.disabled.bg}, 1px {color.border.disabled}; no hover | `disabled`; cursor: not-allowed |
| toggled | {color.interaction.selection.bg} fill, {color.interaction.selection.text}, border {color.border.selected-indicator}; filled icon form | `aria-pressed="true"`; the filled icon shape; the border |
| toggled+focus-visible | the selection fill and a ring in {color.interaction.focus.ring-container} | both visible at once |

Precedence: disabled > toggled > active > hover; focus-visible is always
drawn.

## Keyboard

Native; the toggle does not move focus. In a toolbar the host applies roving
tabindex; the button binds nothing.

## Accessibility

Every icon button has an accessible name (`aria-label` or `aria-labelledby`)
and a tooltip that repeats it but is not the name. The SVG is
`aria-hidden="true"` and `focusable="false"`. The name never changes with
the state ("Mute", not "Mute" / "Unmute"). The icon meets 4.5:1 and rings
3:1 on every fill. Target at least 24×24 CSS pixels in `compact`, with 4px
between neighbours.

## Portability

Square, fill, border and outline; the `currentColor` icon follows every
state. A host without inline SVG uses its icon theme at 16px and records the
substitution; one without dashed outlines draws a solid 1px ring.

## Non-examples

A circle. No accessible name. A toggle that changes its label instead of
`aria-pressed`. A hover that recolours only the icon. An emoji or icon-font
glyph instead of the SVG. A toggled state shown by colour alone with a line
icon. A shadow or scale on press.
