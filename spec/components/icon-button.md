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

A button whose whole content is one icon: toolbar actions, close and clear
affordances, and boolean toggles such as pin, mute or wrap. It is the
tertiary tone constrained to a square. Any icon button needs an accessible
name and a tooltip; if the label must be visible it is a button.

## Anatomy

A native `<button>` sized to the density control height in both axes with a
single 16px inline SVG inside. The border is 1px and transparent at rest so
the active and toggled borders do not shift the layout.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | {color.action.tertiary.text} icon on nothing; transparent 1px border | — |
| hover | background → {color.action.tertiary.hover-bg} | cursor: pointer; hover-capable pointers only |
| focus-visible | ring 1px dashed {color.interaction.focus.ring} at −2px | the ring |
| active | background → {color.interaction.pressed.bg}; border → {color.border.active} | border change; no translation |
| disabled | {color.text.disabled} on {color.interaction.disabled.bg} with 1px {color.border.disabled}; no hover | `disabled`; cursor: not-allowed |
| toggled | fill {color.interaction.selection.bg} with {color.interaction.selection.text}; border {color.border.selected-indicator}; the icon draws in its filled form | `aria-pressed="true"`; the filled icon shape; the border |
| toggled+focus-visible | the selection fill and a ring in {color.interaction.focus.ring-container} | both visible at once |

Precedence: disabled > toggled > active > hover; focus-visible is always
drawn.

## Keyboard

Native. The toggle variant flips `aria-pressed` on Enter and Space and does
not move focus. Inside a toolbar the host applies roving tabindex; the
button itself binds nothing.

## Accessibility

`aria-label` (or `aria-labelledby`) names the button; the tooltip repeats
the same text and is not the name. The SVG is `aria-hidden="true"` and
`focusable="false"`. A toggle uses `aria-pressed`, whose value is announced;
the name never changes with the state ("Mute", not "Mute" / "Unmute").
Contrast: icon 8.65:1 at rest, 7.92:1 on the selection fill; ring 4.69:1,
container ring 7.92:1 on the selection fill. Target ≥ 24×24 CSS pixels with
4px between neighbours in `compact` density.

## Portability

Square, fill, border, outline; the icon is currentColor so it follows every
state without its own colour. Hosts without inline SVG use their icon theme at
16px and record the substitution. Hosts without dashed outlines draw a solid
1px ring.

## Non-examples

A circle. An icon button without an accessible name. A toggle that changes
its label instead of `aria-pressed`. A hover that recolours the icon alone.
An emoji or icon-font glyph in place of the SVG. A toggled state shown by
colour alone with a line icon. A shadow or scale on press.
