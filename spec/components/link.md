---
id: link
name: Link
family: actions
maturity: stable
priority: R1
since: 0.1.0
order: 30
summary: The native anchor for navigation; always underlined in the link-underline role, hover fills with the hover surface, the current page carries a 2px indicator bar.
native: true
aria:
  pattern: native <a href>
variants:
  - id: default
    name: Inline
    description: Inside a sentence; the underline is what distinguishes it from prose.
  - id: standalone
    name: Standalone
    description: On its own line with a trailing arrow icon.
  - id: current
    name: Current
    description: Navigation link to the page being shown; aria-current="page".
sizes: [compact, comfortable]
states: [default, hover, focus-visible, visited, current]
tokens:
  root.text: color.text.link
  root.underline: color.text.link-underline
  root.text-hover: color.text.link-hover
  root.bg-hover: color.interaction.hover.bg
  root.ring: color.interaction.focus.ring
  root.text-visited: color.text.link
  root.text-current: color.text.bright
  root.indicator: color.border.selected-indicator
  icon.stroke: color.icon.default
stateTokens:
  default: { fg: color.text.link, bg: color.surface.canvas }
  hover: { fg: color.text.link-hover, bg: color.interaction.hover.bg }
  focus-visible: { fg: color.text.link, bg: color.surface.canvas, outline: color.interaction.focus.ring }
  visited: { fg: color.text.link, bg: color.surface.canvas }
  current: { fg: color.text.bright, bg: color.surface.canvas, border: color.border.selected-indicator }
contrast:
  - { fg: color.text.link-underline, bg: color.surface.canvas, min: 3, kind: ui, label: "underline on the canvas" }
  - { fg: color.text.link-underline, bg: color.surface.default, min: 3, kind: ui, label: "underline on the panel" }
  - { fg: color.text.link, bg: color.surface.default, label: "link text on the panel" }
  - { fg: color.text.link, bg: color.surface.raised, label: "link text on raised surfaces" }
  - { fg: color.interaction.focus.ring, bg: color.interaction.hover.bg, min: 3, kind: ui, state: hover, label: "ring on the hover fill" }
anatomy:
  - part: root
    description: The native <a href>; 1px underline in text.link-underline offset 2px; no padding inline, 0 4px standalone.
  - part: icon
    description: Optional trailing 16px arrow in currentColor on the standalone variant; hidden from assistive technology.
keyboard:
  - key: Tab / Shift+Tab
    action: Moves focus to and from the link.
  - key: Enter
    action: Follows the link (native); Space scrolls the page, never activates.
responsive: Inline links wrap with their sentence and may break across lines; the underline and hover fill follow each fragment. Standalone links keep the icon on the same line as the last word. RTL flips the arrow through the host's icon mirroring.
portability:
  web: native <a href>; never a button styled as a link nor a link with role="button"; aria-current="page" on the link to the current document; external links are marked in text, not by colour.
  nativeFallbacks:
    - GTK4 LinkButton; visited through the visited style class.
    - Qt QLabel with rich text and the link stylesheet roles.
    - "Terminal UI: OSC 8 hyperlink; underlined in slot 7."
fixtures: [FX-LONG, FX-320, FX-ZOOM-200, FX-I18N, FX-RTL, FX-RM, FX-HC, FX-STATE-MATRIX]
related: [button, breadcrumbs, sidebar-nav, skip-link, pagination]
specimens: [settings-panel, i3-window-frame]
keywords: [link, anchor, hyperlink, navigation, underline, current]
sources: [j3w1-web]
compact: true
---

## Purpose

Navigation to another document, section or resource; an action on the
current page is a button. A link is recognised by its persistent underline as
well as strong red {color.text.link}, distinct from rose body text and
headings (D-024).

## Anatomy

Parts as listed in the anatomy; the current link has no underline, only its
2px bar.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | {color.text.link}; 1px {color.text.link-underline} underline, offset 2px | the underline |
| hover | fill {color.interaction.hover.bg} (D-027); text {color.text.link-hover}; underline 2px in the text colour | underline 1px → 2px; cursor: pointer |
| focus-visible | 1px dashed {color.interaction.focus.ring} at −2px; underline unchanged | the ring |
| visited | as default | the underline still marks navigation |
| current | {color.text.bright}; a 2px {color.border.selected-indicator} bottom border replaces the underline; no hover fill | `aria-current="page"`; the 2px bar |

Precedence: current > hover; focus-visible is always drawn.

## Keyboard

As in the key table. An in-page or skip-link target that is not focusable
takes `tabindex="-1"` so focus moves to it.

## Accessibility

Link text names the destination on its own ("Release notes", never "here");
same destination, same text. `aria-current="page"` marks the current document
in navigation and nothing else. A link that opens a new window says so in
text. Text meets 4.5:1 on canvas, panel and raised surfaces; the underline
3:1. Inline links are exempt from the 24×24 target minimum; standalone links
reach it through their line box.

## Portability

The arrow is an inline SVG in currentColor. A host that cannot thicken an
underline inverts the link on hover instead and records it. A host without `aria-current` exposes the current link as
selected.

## Non-examples

A link without an underline at rest. Blue or purple links. A hover that only
recolours the text. A link that opens a dialog or submits a form. An
underline drawn with a border on an inline link. A visited colour that fails
4.5:1. A button styled to look like a link. Text such as "click here".
