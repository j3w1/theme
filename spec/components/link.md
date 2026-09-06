---
id: link
name: Link
family: actions
maturity: stable
priority: R1
since: 0.1.0
order: 30
summary: The native anchor for navigation; always underlined in the link-underline role, hover fills with the strong hover surface, the current page carries a 2px indicator bar.
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
  root.bg-hover: color.interaction.hover.bg-strong
  root.ring: color.interaction.focus.ring
  root.text-visited: color.text.default
  root.text-current: color.text.bright
  root.indicator: color.border.selected-indicator
  icon.stroke: color.icon.default
stateTokens:
  default: { fg: color.text.link, bg: color.surface.canvas }
  hover: { fg: color.text.link-hover, bg: color.interaction.hover.bg-strong }
  focus-visible: { fg: color.text.link, bg: color.surface.canvas, outline: color.interaction.focus.ring }
  visited: { fg: color.text.default, bg: color.surface.canvas }
  current: { fg: color.text.bright, bg: color.surface.canvas, border: color.border.selected-indicator }
contrast:
  - { fg: color.text.link-underline, bg: color.surface.canvas, min: 3, kind: ui, label: "underline on the canvas" }
  - { fg: color.text.link-underline, bg: color.surface.default, min: 3, kind: ui, label: "underline on the panel" }
  - { fg: color.text.link, bg: color.surface.default, label: "link text on the panel" }
  - { fg: color.interaction.focus.ring, bg: color.interaction.hover.bg-strong, min: 3, kind: ui, state: hover, label: "ring on the hover fill" }
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

Navigation to another document, section or resource. A link never performs
an action on the current page; that is a button. Links are recognisable by
the underline, not by colour alone, because {color.text.link} is also the
heading colour.

## Anatomy

A native `<a href>`. Inline: text plus the 1px underline. Standalone: the
same with a trailing arrow icon and a little horizontal padding so the hover
fill has room. Current: `aria-current="page"`, brighter text and a 2px bar
replacing the underline.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | {color.text.link}; underline 1px {color.text.link-underline} offset 2px | the underline |
| hover | background → {color.interaction.hover.bg-strong}; text → {color.text.link-hover}; underline 2px in the text colour | underline thickens 1px → 2px; cursor: pointer |
| focus-visible | ring 1px dashed {color.interaction.focus.ring} at −2px; no change to the underline | the ring |
| visited | text → {color.text.default}; underline unchanged | — (browsers restrict `:visited` to colour; visited is informational and the underline still marks the link) |
| current | text → {color.text.bright}; the underline becomes a 2px {color.border.selected-indicator} bottom border; no hover fill | `aria-current="page"`; the bar's 2px weight |

Precedence: current > hover; focus-visible is always drawn.

## Keyboard

Native. Enter follows the link; Space never does. Skip links and in-page
links move focus to their target, which needs `tabindex="-1"` when it is not
focusable.

## Accessibility

The link text describes the destination on its own ("Release notes", never
"here"). Same destination, same text. `aria-current="page"` marks the
current document in navigation and nothing else. Links that open a new
window say so in text. Contrast: text 10.37:1 on the canvas, 10.10:1 on the
panel; underline 4.14:1 (≥ 3:1); hover 11.41:1 on the strong hover fill;
ring 4.69:1 at rest and 3.10:1 on the hover fill. Inline targets are exempt
from the 24×24 minimum; standalone links reach it through their line box.

## Portability

Colour, underline thickness, background and outline; the arrow is an inline
SVG in currentColor. Hosts that cannot thicken an underline invert the link on
hover instead and record it. Hosts without `aria-current` expose the current
link as selected.

## Non-examples

A link without an underline at rest. Blue or purple links. A hover that only
recolours the text. A link that opens a dialog or submits a form. An
underline drawn with a border on an inline link. A visited colour that fails
4.5:1. A button styled to look like a link. Text such as "click here".
