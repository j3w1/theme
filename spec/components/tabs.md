---
id: tabs
name: Tabs
family: navigation
maturity: stable
priority: R1
since: 0.1.0
order: 10
summary: A tablist of buttons that switches between panels in place; the selected tab carries a 2px indicator bar and bright text, never a fill.
native: false
aria:
  pattern: APG tabs (tablist, tab, tabpanel) with roving tabindex
  apg: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
  role: tablist
variants:
  - id: default
    name: Default
  - id: overflow
    name: Overflow
    description: Many tabs in a horizontally scrolling strip; the strip scrolls, the page never does.
sizes: [compact, comfortable]
states:
  - default
  - hover
  - focus-visible
  - selected
  - selected+focus-visible
  - selected+container-inactive
  - disabled
tokens:
  list.bg: color.surface.default
  list.border: color.border.divider
  tab.text: color.text.default
  tab.text-selected: color.text.bright
  tab.text-disabled: color.text.disabled
  tab.bg-hover: color.interaction.hover.bg
  tab.bg-pressed: color.interaction.pressed.bg
  tab.indicator: color.border.selected-indicator
  tab.indicator-inactive: color.border.selected-indicator-inactive
  tab.ring: color.interaction.focus.ring
  panel.bg: color.surface.default
  panel.text: color.text.default
stateTokens:
  default: { fg: color.text.default, bg: color.surface.default }
  hover: { fg: color.text.default, bg: color.interaction.hover.bg }
  focus-visible: { fg: color.text.default, bg: color.surface.default, outline: color.interaction.focus.ring }
  selected: { fg: color.text.bright, bg: color.surface.default, border: color.border.selected-indicator }
  selected+focus-visible: { fg: color.text.bright, bg: color.surface.default, border: color.border.selected-indicator, outline: color.interaction.focus.ring }
  selected+container-inactive: { fg: color.text.bright, bg: color.surface.default }
contrast:
  - { fg: color.border.selected-indicator-inactive, bg: color.surface.default, min: 1, kind: ui, state: selected+container-inactive, label: "inactive indicator (decorative; the selected tab keeps aria-selected and bright text)", waiver: "the inactive container is the state; the dimmed bar is a lightness drop, not the only channel" }
  - { fg: color.text.disabled, bg: color.surface.default, min: 3, kind: ui, state: disabled, label: "disabled tab text (exempt; house floor 3:1)" }
  - { fg: color.border.divider, bg: color.surface.default, min: 1, kind: ui, label: "tablist bottom rule (decorative)", waiver: "the rule separates the strip from the panel; the tabs are the boundary" }
anatomy:
  - part: list
    description: The tablist strip; a 1px border.divider rule beneath it; scrolls horizontally in the overflow variant.
  - part: tab
    description: A button with role tab; text.default at rest, a transparent 2px bottom edge that becomes the indicator when selected.
  - part: indicator
    description: The 2px border.selected-indicator bottom bar of the selected tab; selected-indicator-inactive when the container is not the active one.
  - part: panel
    description: The tabpanel, labelled by its tab, focusable with tabindex 0 when it contains no focusable content.
keyboard:
  - key: Tab
    action: Moves focus to the selected tab (roving tabindex); a second Tab leaves the tablist for the panel.
  - key: Left / Right
    action: Moves focus to the previous or next tab and wraps; with automatic activation the panel follows.
  - key: Home / End
    action: Moves focus to the first or last tab.
  - key: Enter / Space
    action: Activates the focused tab when activation is manual.
  - key: Delete
    action: Closes the focused tab where tabs are closable (not in this reference).
responsive: The strip takes the full width and scrolls horizontally with overflow-x auto below the sum of its tabs; tabs never wrap or shrink their label; at 320px the overflow variant scrolls and the page does not. RTL reverses the strip and the arrow keys follow the reading direction.
portability:
  web: A div with role tablist holding buttons with role tab, aria-selected and aria-controls; panels with role tabpanel and aria-labelledby; one tab has tabindex 0, the rest -1; the indicator is a border-bottom, the ring an outline.
  nativeFallbacks:
    - GTK4 Notebook with a css-name mapping; the indicator through the tab's bottom border.
    - Qt QTabBar stylesheet; QTabBar::tab:selected draws the 2px bottom border.
    - "Terminal UI: the selected tab underlined with a 2-cell heavy line; other tabs plain."
fixtures: [FX-LONG, FX-320, FX-ZOOM-200, FX-I18N, FX-RTL, FX-RM, FX-HC, FX-OVERFLOW, FX-STATE-MATRIX]
related: [sidebar-nav, toolbar, segmented-control, disclosure]
specimens: [settings-panel, i3-window-frame]
keywords: [tabs, tablist, tabpanel, navigation, indicator, roving tabindex, sections]
sources: [j3w1-web]
compact: true
---

## Purpose

Navigation between peer panels within one view. Between views use
sidebar-nav; for exclusive options in a form use radio-group or
segmented-control.

## Anatomy

Parts as listed in the anatomy. The indicator sits on the rule; tabs carry no
fill and no box, and the bar is the only ornament.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | text {color.text.default}; transparent 2px bottom edge | — |
| hover | background → {color.interaction.hover.bg}; text unchanged | cursor: pointer |
| focus-visible | 1px dashed {color.interaction.focus.ring} ring at −2px | the ring |
| selected | text {color.text.bright}; 2px {color.border.selected-indicator} bar | `aria-selected="true"`; the bar; tabindex 0 |
| selected+focus-visible | bar and ring together | both visible |
| selected+container-inactive | bar → {color.border.selected-indicator-inactive}; text stays bright | lightness drop of the bar; the container's own inactive state |
| disabled | text {color.text.disabled}; no hover; bar hidden unless selected | `disabled` or `aria-disabled`; cursor: not-allowed |

Precedence: disabled > selected > hover; focus-visible is always drawn.
{color.interaction.pressed.bg} shows only for the duration of a press.

## Keyboard

As in the key table. Automatic activation is the default because panels are
cheap; use manual activation when a panel is expensive to render. The panel is
a tab stop only when it has no focusable content.

## Accessibility

The tablist carries `aria-label` or `aria-labelledby`. A vertical tablist
sets `aria-orientation="vertical"` and swaps the arrow keys. Text meets
4.5:1; the indicator and ring 3:1. Each tab is at least 24×24 CSS pixels in
`compact`, with 4px between neighbours. The indicator is never the only
signal: `aria-selected` and the bright text travel with it.

## Portability

A toolkit that cannot draw a partial bottom border draws a 2px rule across
the full tab width. Hosts with their own tab strip (browsers, editors) keep
their keyboard model and take only the colours and the 2px bar.

## Non-examples

Pill or filled tabs. A selected tab in the selection fill. Rounded tabs or
bar. A strip that wraps to two lines. A selected tab that changes only its
text colour. A glow instead of the dashed ring. Every tab in the tab order.
Disabling by opacity.
