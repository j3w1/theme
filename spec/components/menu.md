---
id: menu
name: Menu
family: navigation
maturity: stable
priority: R1
since: 0.1.0
order: 60
summary: A menu button that opens a list of actions on the raised surface inside a 1px overlay border; the active item is the selection fill and check items show a glyph.
native: false
aria:
  pattern: APG menu button (button with aria-haspopup="menu") opening a menu of menuitem, menuitemcheckbox and separator
  apg: https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/
  role: menu
variants:
  - id: default
    name: Default
    description: Actions with shortcuts and a separator.
  - id: with-submenu
    name: With submenu
    description: An item that opens a nested menu; aria-haspopup and a chevron.
  - id: with-checks
    name: With checks
    description: menuitemcheckbox items that toggle settings and show the ✓ glyph.
sizes: [compact, comfortable]
states:
  - default
  - hover
  - focus-visible
  - open
  - closed
  - disabled
  - checked
  - selected
tokens:
  button.text: color.text.default
  button.bg: color.surface.default
  button.border: color.border.control
  button.bg-hover: color.interaction.hover.bg
  button.bg-open: color.interaction.pressed.bg
  button.border-open: color.border.active
  button.ring: color.interaction.focus.ring
  surface.bg: color.surface.raised
  surface.border: color.border.overlay
  item.text: color.text.default
  item.bg-hover: color.interaction.hover.bg-strong
  item.text-hover: color.text.link-hover
  item.text-disabled: color.text.disabled
  active.bg: color.interaction.selection.bg
  active.text: color.interaction.selection.text
  active.ring: color.interaction.focus.ring-container
  check.glyph: color.text.bright
  shortcut.text: color.text.muted
  separator.color: color.border.divider
  chevron.color: color.icon.decorative
stateTokens:
  default: { fg: color.text.default, bg: color.surface.raised, border: color.border.overlay }
  hover: { fg: color.text.link-hover, bg: color.interaction.hover.bg-strong }
  focus-visible: { fg: color.text.default, bg: color.surface.default, border: color.border.control, outline: color.interaction.focus.ring }
  open: { fg: color.text.default, bg: color.interaction.pressed.bg, border: color.border.active }
  closed: { fg: color.text.default, bg: color.surface.default, border: color.border.control }
  checked: { fg: color.text.bright, bg: color.surface.raised }
  selected: { fg: color.interaction.selection.text, bg: color.interaction.selection.bg, outline: color.interaction.focus.ring-container }
contrast:
  - { fg: color.text.muted, bg: color.surface.raised, label: "shortcut hint on the raised surface" }
  - { fg: color.text.disabled, bg: color.surface.raised, min: 3, kind: ui, state: disabled, label: "disabled item text (exempt; house floor 3:1)" }
  - { fg: color.border.divider, bg: color.surface.raised, min: 1, kind: ui, label: "item separator (decorative; role separator carries the grouping)", waiver: "the separator groups items that are already distinct rows; it is not a control boundary" }
  - { fg: color.icon.decorative, bg: color.surface.raised, min: 1, kind: ui, label: "submenu chevron (decorative; aria-haspopup carries the meaning)", waiver: "the chevron duplicates aria-haspopup on the item" }
anatomy:
  - part: button
    description: The menu button; a secondary-style control with aria-haspopup="menu", aria-expanded and aria-controls; pressed fill and active border while open.
  - part: list
    description: The ul with role menu on surface.raised inside a 1px border.overlay; positioned below the button at z.popover.
  - part: item
    description: A button with role menuitem or menuitemcheckbox; a check gutter, the label, an optional shortcut hint in text.muted.
  - part: check
    description: The ✓ glyph gutter, visible when aria-checked="true".
  - part: separator
    description: A 1px border.divider rule with role separator.
  - part: submenu
    description: An item with aria-haspopup="menu" and a chevron; opens a nested menu to the inline-end side.
keyboard:
  - key: Enter / Space / Down
    action: On the button, opens the menu and focuses the first item; Up opens it and focuses the last.
  - key: Down / Up
    action: Moves to the next or previous item and wraps.
  - key: Home / End
    action: Moves to the first or last item.
  - key: Right / Left
    action: Opens a submenu and focuses its first item; Left closes the submenu and returns to the parent item.
  - key: Enter / Space
    action: Activates the focused item; a check item toggles and the menu stays open.
  - key: Escape
    action: Closes the menu and returns focus to the button.
  - key: Tab
    action: Closes the menu and moves focus to the next tab stop after the button.
  - key: A-Z
    action: Moves focus to the next item starting with the typed character.
responsive: The menu is as wide as its longest item, at least 12rem, at most the viewport minus 16px; it flips above the button when there is no room below and never causes page scroll; at 320px submenus open below their parent instead of beside it. RTL mirrors the check gutter and the submenu side.
portability:
  web: A native button with aria-haspopup="menu", aria-expanded and aria-controls; a ul with role menu and li with role none wrapping buttons with role menuitem or menuitemcheckbox; aria-checked for checks; the menu is hidden until open and positioned by script; the reference renders it statically open in flow.
  nativeFallbacks:
    - GTK4 MenuButton with a PopoverMenu; the popover border and background through css-name selectors.
    - Qt QMenu stylesheet; QMenu::item:selected draws the selection fill; QMenu::indicator draws the check.
    - "Terminal UI: a boxed list; the active row inverted; checks as a leading glyph column."
fixtures: [FX-LONG, FX-320, FX-ZOOM-200, FX-I18N, FX-RTL, FX-RM, FX-HC, FX-STATE-MATRIX]
related: [button, toolbar, command-palette, popover, select]
specimens: [filterable-table, i3-window-frame]
keywords: [menu, menu button, dropdown, actions, menuitem, checkbox item, submenu, popup]
sources: [j3w1-web]
compact: true
---

## Purpose

Offers a short list of actions behind one button. A menu is for commands;
choosing a value belongs in select or combobox, and moving between views in
tabs or the sidebar. Menus close as soon as an action runs.

## Anatomy

A menu button, styled as a secondary button, that opens a list on
{color.surface.raised} inside a 1px {color.border.overlay} frame. Items are
buttons in {color.text.default} with a check gutter at the inline start, the
label, and an optional shortcut hint in {color.text.muted}. Separators are
1px {color.border.divider} rules. The active item, whether reached by pointer
or by arrow key, is the selection fill {color.interaction.selection.bg} with
{color.interaction.selection.text}. The reference renders the menu open in
flow beneath the button; a host positions it at `z.popover`.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | the button at rest; the list on {color.surface.raised} with the {color.border.overlay} frame | — |
| hover | item background → {color.interaction.hover.bg-strong}; text → {color.text.link-hover} | cursor: pointer |
| focus-visible | ring 1px dashed {color.interaction.focus.ring} at −2px on the button; on the active item the ring is {color.interaction.focus.ring-container} | the ring |
| open | button fill {color.interaction.pressed.bg} with 1px {color.border.active}; the list shown | `aria-expanded="true"`; the list is present |
| closed | the button at rest; the list hidden | `aria-expanded="false"`; the list is absent from the tree |
| disabled | item text {color.text.disabled}; no hover; still focusable by arrow keys when `aria-disabled` | `aria-disabled="true"`; cursor: not-allowed |
| checked | the ✓ glyph in {color.text.bright} in the gutter | `aria-checked="true"`; the glyph |
| selected | the active item: fill {color.interaction.selection.bg} with {color.interaction.selection.text} | focus is on the item; `aria-activedescendant` where used |

Precedence: disabled > selected > hover; focus-visible is always drawn.

## Keyboard

The button opens on Enter, Space or Down (focus on the first item) and on Up
(focus on the last). Inside, Up and Down move and wrap, Home and End jump,
Right opens a submenu and Left closes it, typing a letter jumps to the next
matching item. Enter or Space activates; a check item toggles without closing.
Escape closes and returns focus to the button; Tab closes and continues the
tab order. Focus never rests on a separator.

## Accessibility

The button carries `aria-haspopup="menu"`, `aria-expanded` and
`aria-controls`; the list `role="menu"` and `aria-labelledby` pointing at the
button. Items are `role="menuitem"` or `role="menuitemcheckbox"` with
`aria-checked`; disabled items use `aria-disabled` so they remain reachable
and announced. Shortcut hints are text, not `aria-keyshortcuts` alone.
Contrast: item text 8.43:1 and shortcut 5.66:1 on the raised surface, active
text 12.47:1 on the fill, the frame 4.57:1, ring-container 7.48:1 on the fill.
Items are the row height, at least 24 CSS pixels in `compact` density.

## Portability

A framed box with rows; the active row is a fill, the frame a border, the
ring an outline. Toolkits with native menus keep their keyboard model and
take the surface, frame and fill colours. Hosts that cannot draw the frame
in the overlay colour draw it in the strong border colour and record the
deviation.

## Non-examples

A shadow under the menu. Rounded corners on the menu or the items. An active
item marked by text colour alone. A hover fill that differs from every other
menu in the product. Icons in the check gutter of a plain menuitem. A menu
that stays open after an action. Items that are links styled as menu items
without `role="menuitem"`. Disabling by opacity.
