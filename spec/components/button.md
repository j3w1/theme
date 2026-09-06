---
id: button
name: Button
family: actions
maturity: stable
priority: R1
since: 0.1.0
order: 10
summary: The native push button in the four action tones; primary is the only filled button at rest, destructive fills on hover and always needs a confirmation or an undo.
native: true
aria:
  pattern: native <button type="button">
  apg: https://www.w3.org/WAI/ARIA/apg/patterns/button/
variants:
  - id: default
    name: Primary
    description: The one filled button in a view.
  - id: secondary
    name: Secondary
    description: Outline in border.control with text.bright.
  - id: tertiary
    name: Tertiary
    description: Ghost button; text only until hovered.
  - id: destructive
    name: Destructive
    description: Outline in the danger tone that fills on hover.
sizes: [compact, comfortable]
states: [default, hover, focus-visible, active, disabled, loading]
tokens:
  root.bg: color.action.primary.bg
  root.text: color.action.primary.text
  root.border: color.action.primary.border
  root.bg-hover: color.action.primary.hover-bg
  root.bg-active: color.action.primary.pressed-bg
  root.ring: color.interaction.focus.ring-container
  secondary.bg: color.action.secondary.bg
  secondary.text: color.action.secondary.text
  secondary.border: color.action.secondary.border
  secondary.bg-hover: color.action.secondary.hover-bg
  secondary.bg-active: color.action.secondary.pressed-bg
  secondary.ring: color.interaction.focus.ring
  tertiary.text: color.action.tertiary.text
  tertiary.bg-hover: color.action.tertiary.hover-bg
  tertiary.bg-active: color.interaction.pressed.bg
  destructive.text: color.action.destructive.text
  destructive.border: color.action.destructive.border
  destructive.bg-hover: color.action.destructive.hover-bg
  destructive.text-hover: color.action.destructive.hover-text
  destructive.bg-active: color.action.destructive.pressed-bg
  destructive.bg-filled: color.action.destructive.filled-bg
  destructive.text-filled: color.action.destructive.filled-text
  root.border-active: color.border.active
  root.text-disabled: color.text.disabled
  root.bg-disabled: color.interaction.disabled.bg
  root.border-disabled: color.border.disabled
  loading.glyph: color.action.primary.text
stateTokens:
  default: { fg: color.action.primary.text, bg: color.action.primary.bg }
  hover: { fg: color.action.primary.text, bg: color.action.primary.hover-bg }
  focus-visible: { fg: color.action.primary.text, bg: color.action.primary.bg, outline: color.interaction.focus.ring-container }
  active: { fg: color.action.primary.text, bg: color.action.primary.pressed-bg, border: color.border.active }
  loading: { fg: color.action.primary.text, bg: color.action.primary.bg }
contrast:
  - { fg: color.action.primary.bg, bg: color.surface.default, min: 3, kind: ui, label: "primary fill against the panel (decorative; the label identifies the button)", waiver: "the fill is not the boundary of the control; the label text at 8.17:1 identifies it, and hover, active and focus each add a second channel" }
  - { fg: color.action.secondary.text, bg: color.action.secondary.bg, label: "secondary text at rest" }
  - { fg: color.action.secondary.border, bg: color.action.secondary.bg, min: 3, kind: ui, label: "secondary border at rest" }
  - { fg: color.action.secondary.text, bg: color.action.secondary.hover-bg, state: hover, label: "secondary text on the hover fill" }
  - { fg: color.action.secondary.border, bg: color.surface.default, min: 3, kind: ui, state: hover, label: "secondary border against the panel while hovered (the fill inside it measures 2.94:1)" }
  - { fg: color.interaction.focus.ring, bg: color.action.secondary.hover-bg, min: 3, kind: ui, state: hover, label: "ring on the secondary hover fill" }
  - { fg: color.action.secondary.text, bg: color.action.secondary.pressed-bg, state: active, label: "secondary text while pressed" }
  - { fg: color.action.tertiary.text, bg: color.action.secondary.bg, label: "tertiary text at rest" }
  - { fg: color.action.tertiary.text, bg: color.action.tertiary.hover-bg, state: hover, label: "tertiary text on the hover fill" }
  - { fg: color.action.tertiary.text, bg: color.interaction.pressed.bg, state: active, label: "tertiary text while pressed" }
  - { fg: color.border.active, bg: color.interaction.pressed.bg, min: 3, kind: ui, state: active, label: "active border on the pressed fill" }
  - { fg: color.action.destructive.text, bg: color.action.secondary.bg, label: "destructive text at rest" }
  - { fg: color.action.destructive.border, bg: color.action.secondary.bg, min: 3, kind: ui, label: "destructive border at rest" }
  - { fg: color.action.destructive.hover-text, bg: color.action.destructive.hover-bg, state: hover, label: "destructive text on the hover fill" }
  - { fg: color.action.destructive.hover-text, bg: color.action.destructive.hover-bg, min: 3, kind: ui, state: hover, label: "ring on the destructive hover fill (the ring takes the on-fill colour)" }
  - { fg: color.action.destructive.hover-text, bg: color.action.destructive.pressed-bg, state: active, label: "destructive text while pressed" }
  - { fg: color.action.destructive.filled-text, bg: color.action.destructive.filled-bg, label: "confirm-dialog filled destructive" }
  - { fg: color.text.disabled, bg: color.interaction.disabled.bg, min: 3, kind: ui, state: disabled, label: "disabled text (exempt; house floor 3:1)" }
  - { fg: color.border.disabled, bg: color.interaction.disabled.bg, min: 1, kind: ui, state: disabled, label: "disabled border (exempt)", waiver: "disabled controls are exempt from 1.4.11" }
anatomy:
  - part: root
    description: The native <button>; 1px border, radius 0, height and horizontal padding from the density mode.
  - part: icon
    description: Optional leading 16px line icon in currentColor; hidden while loading.
  - part: loading
    description: The static ⋯ glyph that takes the icon slot while aria-busy is true.
  - part: label
    description: The text; never wraps inside the button, the button wraps in its container instead.
keyboard:
  - key: Tab / Shift+Tab
    action: Moves focus to and from the button in document order.
  - key: Enter / Space
    action: Activates (native); Space activates on key up.
responsive: Width follows the label; a full-width modifier is a layout decision outside the theme. Groups of buttons wrap at 320px rather than shrinking below the density height. RTL mirrors the icon side.
portability:
  web: native <button type="button">, or type="submit" in forms; never a div or a link with role="button"; the four tones are class modifiers on the same element; loading through aria-busy and a static glyph, not a spinner.
  nativeFallbacks:
    - GTK4 Button with the suggested-action and destructive-action style classes.
    - Qt QPushButton stylesheet with a dynamic tone property.
    - "Terminal UI: bracketed label; primary inverted; destructive in slot 5."
fixtures: [FX-LONG, FX-320, FX-ZOOM-200, FX-I18N, FX-RTL, FX-RM, FX-HC, FX-TOUCH, FX-DENSITY, FX-STATE-MATRIX]
related: [icon-button, link, button-group, segmented-control, dialog]
specimens: [admin-form, settings-panel, filterable-table]
keywords: [button, action, primary, secondary, destructive, submit, cta]
sources: [j3w1-web]
compact: true
---

## Purpose

The push button that triggers an action. Four tones and no more: `primary`
is the single filled button in a view, `secondary` is the outline for every
other action, `tertiary` is the ghost for low-emphasis and toolbar actions,
`destructive` is an outline in the danger tone that fills on hover. A
destructive button also requires a confirmation step or an undo affordance;
the colour is not the safeguard. Navigation is a link, not a button.

## Anatomy

A native `<button>`; optional leading icon; the label. The loading glyph
occupies the icon slot so the size never changes. A filled destructive
modifier (`.button-destructive-filled`, {color.action.destructive.filled-bg}
with {color.action.destructive.filled-text}) exists only inside confirm
dialogs.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | primary: {color.action.primary.bg} fill, {color.action.primary.text}, 1px {color.action.primary.border}; secondary: 1px {color.action.secondary.border}, {color.action.secondary.text}; tertiary: {color.action.tertiary.text}, no border; destructive: 1px {color.action.destructive.border}, {color.action.destructive.text} | — |
| hover | primary → {color.action.primary.hover-bg}; secondary → {color.action.secondary.hover-bg}; tertiary → {color.action.tertiary.hover-bg}; destructive fills {color.action.destructive.hover-bg} with {color.action.destructive.hover-text} | cursor: pointer; hover-capable pointers only |
| focus-visible | ring 1px dashed at −2px: {color.interaction.focus.ring-container} on the primary fill, {color.interaction.focus.ring} on the outline tones, {color.action.destructive.hover-text} on the destructive hover fill | the ring |
| active | primary → {color.action.primary.pressed-bg}; secondary → {color.action.secondary.pressed-bg}; tertiary → {color.interaction.pressed.bg}; destructive → {color.action.destructive.pressed-bg}; border → {color.border.active} on the outline tones | border change; no translation or scale |
| disabled | {color.text.disabled} on {color.interaction.disabled.bg} with 1px {color.border.disabled}, every tone alike; no hover or active styling | `disabled`; cursor: not-allowed; never opacity |
| loading | size unchanged; the static `⋯` glyph replaces the icon; the button keeps its tone and stays focusable but ignores activation | glyph; `aria-busy` |

Precedence: disabled > loading > active > hover; focus-visible is always
drawn.

## Keyboard

Native. Enter and Space activate; nothing else is bound. A loading button
stays in the tab order so focus is not lost mid-action, and the host ignores
activation until `aria-busy` clears.

## Accessibility

The accessible name is the label text; an icon-only button is the
icon-button component. Never `aria-disabled` on a button that should be
skipped, and never `disabled` on a button whose reason a user needs to
discover: prefer keeping it enabled and explaining on activation. Contrast:
primary 8.17:1, secondary 10.37:1, tertiary 8.65:1, destructive 5.40:1 at
rest and 4.58:1 on the hover fill; every outline border ≥ 4.45:1; rings ≥
3:1 on every fill they sit on. The target is at least 24×24 CSS pixels in
`compact` density with 4px between neighbours.

## Portability

Fill, border and outline express every state; no gradient, shadow or
transform is used. Hosts without dashed outlines draw a solid 1px ring in the
same colour and record the deviation. Hosts that cannot recolour the ring on
a fill draw it outside the fill at +1px.

## Non-examples

Rounded corners or pill shapes. Two filled buttons in one view. A red
filled destructive button at rest. A hover that only changes text colour.
Translating or scaling the button on press. A spinner inside the button.
Disabling with opacity. A `<div>` or `<a>` styled as a button. A gradient or
shadow to suggest depth.
