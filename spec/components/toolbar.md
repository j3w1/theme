---
id: toolbar
name: Toolbar
family: navigation
maturity: stable
priority: R1
since: 0.1.0
order: 50
summary: A row of related controls under one tab stop with arrow-key movement; ghost buttons, a vertical separator, and a "more" button when the row overflows.
native: false
aria:
  pattern: APG toolbar with roving tabindex; buttons, toggle buttons with aria-pressed, and a separator
  apg: https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/
  role: toolbar
variants:
  - id: default
    name: Default
  - id: overflow
    name: Overflow
    description: The trailing controls collapse behind a "More" menu button when the row is narrower than its contents.
sizes: [compact, comfortable]
states:
  - default
  - hover
  - focus-visible
  - disabled
  - toggled
tokens:
  root.bg: color.surface.chrome
  root.border: color.border.divider
  button.text: color.text.default
  button.bg-hover: color.interaction.hover.bg
  button.bg-pressed: color.interaction.pressed.bg
  button.ring: color.interaction.focus.ring
  button.text-disabled: color.text.disabled
  toggled.bg: color.interaction.pressed.bg
  toggled.border: color.border.active
  toggled.text: color.text.bright
  separator.color: color.border.default
  more.chevron: color.icon.decorative
stateTokens:
  default: { fg: color.text.default, bg: color.surface.chrome }
  hover: { fg: color.text.default, bg: color.interaction.hover.bg }
  focus-visible: { fg: color.text.default, bg: color.surface.chrome, outline: color.interaction.focus.ring }
  toggled: { fg: color.text.bright, bg: color.interaction.pressed.bg, border: color.border.active }
contrast:
  - { fg: color.text.disabled, bg: color.surface.chrome, min: 3, kind: ui, state: disabled, label: "disabled button text (exempt; house floor 3:1)" }
  - { fg: color.border.default, bg: color.surface.chrome, min: 1, kind: ui, label: "separator (decorative; role separator carries the grouping)", waiver: "the separator groups controls that are already distinct targets; it is not a control boundary" }
  - { fg: color.border.divider, bg: color.surface.chrome, min: 1, kind: ui, label: "toolbar bottom edge (decorative)", waiver: "the edge separates chrome from content; the controls are the boundaries" }
anatomy:
  - part: root
    description: The div with role toolbar, aria-label and aria-orientation; surface.chrome with a 1px border.divider bottom edge.
  - part: button
    description: A ghost button, text.default on no fill with a transparent 1px border so the toggled border does not move anything.
  - part: separator
    description: A 1px border.default vertical rule with role separator and aria-orientation vertical; never focusable.
  - part: more
    description: In the overflow variant, a button with aria-haspopup="menu" and aria-expanded that opens a menu holding the hidden controls.
keyboard:
  - key: Tab / Shift+Tab
    action: Enters or leaves the toolbar; one control has tabindex 0 (roving tabindex).
  - key: Left / Right
    action: Moves focus to the previous or next enabled control; wraps at the ends; Up and Down when aria-orientation is vertical.
  - key: Home / End
    action: Moves focus to the first or last control.
  - key: Enter / Space
    action: Activates the focused button or toggles a toggle button.
  - key: Escape
    action: Restores the previous value in a toolbar that edits, otherwise nothing.
responsive: "The row never wraps: below its intrinsic width the trailing controls move into the More menu (the overflow variant); at 320px only the leading controls and the more button remain visible. RTL mirrors the order and the arrow keys follow the reading direction."
portability:
  web: A div with role toolbar and aria-label; native buttons inside, toggles with aria-pressed; a div with role separator and aria-orientation vertical; roving tabindex maintained by script; without script every button stays in the tab order, which is the acceptable no-JS fallback.
  nativeFallbacks:
    - GTK4 Box in the toolbar style class with flat Buttons and ToggleButtons; a Separator between groups.
    - Qt QToolBar with QActions; checkable actions draw the pressed fill and active border.
    - "Terminal UI: a one-line row of bracketed labels; the toggled one inverted."
fixtures: [FX-320, FX-ZOOM-200, FX-I18N, FX-RTL, FX-RM, FX-HC, FX-OVERFLOW, FX-STATE-MATRIX]
related: [button, icon-button, menu, tabs, button-group]
specimens: [filterable-table, i3-window-frame]
keywords: [toolbar, actions, controls, toggle, separator, roving tabindex, overflow, more]
sources: [j3w1-web]
compact: false
---

## Purpose

Groups the frequent actions of a view into one row that costs one tab stop.
A toolbar is for actions on the content beneath it; navigation between views
belongs in tabs or the sidebar, and a set of mutually exclusive choices in a
segmented control or radio group.

## Anatomy

A `div` with `role="toolbar"` on {color.surface.chrome} with a 1px
{color.border.divider} bottom edge. Inside, ghost buttons in
{color.text.default} with a transparent 1px border, vertical separators in
{color.border.default} between groups, and in the overflow variant a trailing
"More" button that opens a menu with the controls that do not fit. Toggle
buttons carry `aria-pressed`.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | text {color.text.default}; no fill; transparent border | — |
| hover | background → {color.interaction.hover.bg} | cursor: pointer |
| focus-visible | ring 1px dashed {color.interaction.focus.ring} at −2px | the ring |
| disabled | text {color.text.disabled}; no fill; no hover | `disabled`; cursor: not-allowed; skipped by the arrow keys |
| toggled | fill {color.interaction.pressed.bg}; 1px {color.border.active} border; text {color.text.bright} | `aria-pressed="true"`; the border |

Pressing a button uses {color.interaction.pressed.bg} for the duration of
the press only; a toggled button keeps it.

## Keyboard

The toolbar is one tab stop: the last focused control (initially the first
enabled one) has `tabindex="0"`, every other control `tabindex="-1"`. Left
and Right move between controls and wrap; Home and End jump to the ends;
Enter and Space activate. Disabled controls are skipped. Vertical toolbars
declare `aria-orientation="vertical"` and use Up and Down. Without script
every button is a tab stop, which is acceptable, not ideal.

## Accessibility

`aria-label` names the toolbar; a page with several toolbars gives each a
distinct name. Toggle buttons expose `aria-pressed`; their label does not
change with the state. Separators are `role="separator"` with
`aria-orientation="vertical"` and are never focusable. Icon-only buttons
carry `aria-label` and a tooltip. Contrast: text 8.60:1 on the chrome
surface, toggled text 8.41:1 on the pressed fill, the toggled border 3.81:1,
ring 4.66:1. Every control is at least 24×24 CSS pixels with 4px between
neighbours in `compact` density.

## Portability

Ghost buttons with a background and a border; the separator is a 1px rule.
Toolkits with a native toolbar keep their own keyboard model and take the
colours. The overflow menu is a menu component; hosts without one wrap the
row instead and record the deviation.

## Non-examples

Buttons with a visible border at rest. A filled primary button inside the
toolbar. Rounded buttons or a pill-shaped toolbar. Every button in the tab
order when script is available. A toggled state shown by colour alone without
`aria-pressed`. A toolbar that wraps to two lines. A separator that receives
focus. Disabling by opacity.
