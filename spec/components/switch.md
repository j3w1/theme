---
id: switch
name: Switch
family: forms-basic
maturity: stable
priority: R1
since: 0.1.0
order: 70
summary: An on/off control that takes effect immediately; a button with role switch and aria-checked, drawn as a square-cornered track with a square thumb that fills with the primary colour when on.
native: false
aria:
  pattern: <button type="button" role="switch" aria-checked>
  apg: https://www.w3.org/WAI/ARIA/apg/patterns/switch/
  role: switch
variants:
  - id: default
    name: Default
    description: The track alone, named by aria-label.
  - id: with-labels
    name: With labels
    description: A visible name before the track and an Off / On word after it.
sizes: [compact, comfortable]
states:
  - default
  - hover
  - focus-visible
  - checked
  - checked+focus-visible
  - disabled
  - checked+disabled
tokens:
  track.bg: color.surface.input
  track.border: color.border.control
  track.bg-hover: color.interaction.hover.bg
  track.ring: color.interaction.focus.ring
  track.bg-checked: color.action.primary.bg
  track.bg-checked-hover: color.action.primary.hover-bg
  track.ring-checked: color.interaction.focus.ring-container
  track.bg-disabled: color.interaction.disabled.bg
  track.border-disabled: color.border.disabled
  thumb.bg: color.text.default
  thumb.bg-checked: color.action.primary.text
  thumb.bg-disabled: color.text.disabled
  name.text: color.text.default
  state.text: color.text.muted
  name.text-disabled: color.text.disabled
stateTokens:
  default: { bg: color.surface.input, border: color.border.control }
  hover: { bg: color.interaction.hover.bg, border: color.border.control }
  focus-visible: { bg: color.surface.input, border: color.border.control, outline: color.interaction.focus.ring }
  checked: { fg: color.action.primary.text, bg: color.action.primary.bg }
  checked+focus-visible: { fg: color.action.primary.text, bg: color.action.primary.bg, outline: color.interaction.focus.ring-container }
contrast:
  - { fg: color.text.default, bg: color.surface.input, min: 3, kind: ui, label: "thumb on the off track" }
  - { fg: color.text.default, bg: color.interaction.hover.bg, min: 3, kind: ui, state: hover, label: "thumb on the hovered off track" }
  - { fg: color.action.primary.text, bg: color.action.primary.hover-bg, min: 3, kind: ui, state: hover, label: "thumb on the hovered on track" }
  - { fg: color.border.control, bg: color.surface.default, min: 3, kind: ui, state: checked, label: "on track edge against the panel (the border stays border.control)" }
  - { fg: color.text.default, bg: color.surface.default, label: "visible name on the panel surface" }
  - { fg: color.text.muted, bg: color.surface.default, label: "Off / On word on the panel surface" }
  - { fg: color.text.disabled, bg: color.interaction.disabled.bg, min: 3, kind: ui, state: disabled, label: "disabled thumb (exempt; house floor 3:1)" }
  - { fg: color.text.disabled, bg: color.surface.default, min: 3, kind: ui, state: disabled, label: "disabled name (exempt; house floor 3:1)" }
  - { fg: color.border.disabled, bg: color.interaction.disabled.bg, min: 1, kind: ui, state: disabled, label: "disabled border (exempt)", waiver: "disabled controls are exempt from 1.4.11" }
anatomy:
  - part: root
    description: The <button role="switch">; transparent, no border, at least 24px tall so the whole row is the target.
  - part: track
    description: A 32×16px box, 1px border.control on surface.input, radius 0; holds the thumb at its start or end.
  - part: thumb
    description: A 10px square in text.default; text (prose) white on the on fill.
  - part: name
    description: Optional visible name before the track, linked with aria-labelledby.
  - part: state
    description: Optional "Off" / "On" word after the track in text.muted; aria-hidden because aria-checked already carries it.
keyboard:
  - key: Tab / Shift+Tab
    action: Moves focus to and from the switch.
  - key: Space / Enter
    action: Toggles aria-checked and applies the change at once.
responsive: Fixed track; the visible name wraps before it at 320px and the Off / On word never wraps. RTL mirrors the thumb position (start is the inline start) and the row order.
portability:
  web: <button type="button" role="switch" aria-checked="true|false"> with aria-label or aria-labelledby; the host toggles aria-checked and mirrors it to data-state-checked; never an input type=checkbox with role switch when the change is not immediate, and never a checkbox styled as a switch inside a form that submits.
  nativeFallbacks:
    - GTK4 Switch; square corners through CSS.
    - Qt has no switch; a QCheckBox with a custom indicator, documented.
    - "Terminal UI: [ |  ] and [  |#] glyph pairs with the on state inverted."
fixtures: [FX-LONG, FX-320, FX-ZOOM-200, FX-I18N, FX-RTL, FX-RM, FX-HC, FX-TOUCH, FX-DENSITY, FX-STATE-MATRIX]
related: [checkbox, radio-group, icon-button, field]
specimens: [settings-panel]
keywords: [switch, toggle, on, off, aria-checked, setting, immediate]
sources: [j3w1-web]
compact: false
---

## Purpose

A setting that turns on or off the moment it is toggled: notifications,
wrap lines, follow system theme. A choice that is only applied on submit is
a checkbox. The switch is a button because it acts; it is not a form field.

## Anatomy

A `<button role="switch">`; inside it the track, a 32×16px box with square
corners, and the thumb, a 10px square that sits at the start when off and
at the end when on. The with-labels variant adds a visible name before the
button and an "Off" / "On" word after the track.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | track 1px {color.border.control} on {color.surface.input}; thumb {color.text.default} at the start | thumb position |
| hover | track background → {color.interaction.hover.bg}; on track → {color.action.primary.hover-bg} | cursor: pointer; hover-capable pointers only |
| focus-visible | ring 1px dashed {color.interaction.focus.ring} at −2px on the track | the ring |
| checked | track fills {color.action.primary.bg}; thumb {color.action.primary.text} moves to the end; border stays {color.border.control}; the word reads "On" | `aria-checked="true"`; thumb position; the word |
| checked+focus-visible | the fill and a ring in {color.interaction.focus.ring-container} on the track | position and ring |
| disabled | track {color.interaction.disabled.bg} with 1px {color.border.disabled}; thumb and name {color.text.disabled} | `disabled`; cursor: not-allowed |
| checked+disabled | as disabled with the thumb at the end | `disabled`; `aria-checked="true"`; thumb position |

The thumb moves without animation by default; a host may transition
`transform` for at most 120ms under `prefers-reduced-motion:
no-preference`. Precedence: disabled > checked > hover; focus-visible is
always drawn.

## Keyboard

Space and Enter toggle. Nothing else is bound; there is no arrow-key
movement between switches. Focus never moves as a result of toggling.

## Accessibility

`role="switch"` on a native button gives the correct name, role and value
with the button's own keyboard handling; only `aria-checked` is scripted.
The name states what is on ("Wrap long lines"), never the current value;
the "Off" / "On" word is `aria-hidden` because assistive technology reads
`aria-checked`. The state is also carried by thumb position and, in the
with-labels variant, the word. Contrast: thumb 8.65:1 on the off track,
8.17:1 on the on track; track edge 4.45:1; ring 4.69:1 off, 4.90:1 on.

## Portability

Two nested rectangles, a border and a fill; the thumb position is layout,
not a transform, so it survives hosts with no animation. Hosts with a native
switch use it, square it, and map the two fills.

## Non-examples

A pill-shaped track or a round thumb. A switch that only takes effect on
submit. A checkbox input styled as a switch. Colour as the only difference
between on and off. A green on colour. A label that reads "On" as the name.
Disabling by opacity. A sliding animation longer than 120ms or one that
runs under reduced motion.
