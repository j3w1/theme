---
id: breadcrumbs
name: Breadcrumbs
family: navigation
maturity: stable
priority: R1
since: 0.1.0
order: 20
summary: The path from the root to the current page as an ordered list of links separated by slashes; the last item is the current page and not a link.
native: true
aria:
  pattern: native nav > ol with aria-current="page" on the last item
  apg: https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/
variants:
  - id: default
    name: Default
  - id: truncated
    name: Truncated
    description: Middle levels collapsed behind an ellipsis button that discloses them.
sizes: [compact, comfortable]
states:
  - default
  - hover
  - focus-visible
  - current
  - truncated
tokens:
  root.bg: color.surface.default
  link.text: color.text.link
  link.underline: color.text.link-underline
  link.text-hover: color.text.link-hover
  link.bg-hover: color.interaction.hover.bg-strong
  link.ring: color.interaction.focus.ring
  current.text: color.text.bright
  separator.text: color.text.muted
  ellipsis.text: color.text.default
  ellipsis.bg-hover: color.interaction.hover.bg
stateTokens:
  default: { fg: color.text.link, bg: color.surface.default }
  hover: { fg: color.text.link-hover, bg: color.interaction.hover.bg-strong }
  focus-visible: { fg: color.text.link, bg: color.surface.default, outline: color.interaction.focus.ring }
  current: { fg: color.text.bright, bg: color.surface.default }
  truncated: { fg: color.text.default, bg: color.surface.default }
contrast:
  - { fg: color.text.muted, bg: color.surface.default, label: "separator on the panel surface" }
  - { fg: color.text.link-underline, bg: color.surface.default, min: 3, kind: ui, label: "link underline" }
anatomy:
  - part: list
    description: The ol inside nav[aria-label="Breadcrumb"]; items flow inline and wrap at 320px.
  - part: item
    description: One level; an li holding a link or the current page text.
  - part: link
    description: An ancestor level; text.link with a 1px link-underline that thickens on hover.
  - part: separator
    description: The slash between items in text.muted, aria-hidden; mirrored by logical properties in RTL.
  - part: current
    description: The last item, aria-current="page", text.bright, no underline; it may be a link to itself or plain text.
  - part: ellipsis
    description: A button labelled with the number of hidden levels and aria-expanded; shown only when truncated.
keyboard:
  - key: Tab / Shift+Tab
    action: Moves through the links in order; the current page is skipped when it is not a link.
  - key: Enter
    action: Follows the focused link, or discloses the hidden levels from the ellipsis button.
responsive: Items wrap onto further lines at 320px with the separator staying attached to the item before it; nothing truncates by itself, the truncated variant is an explicit choice for deep trails. RTL mirrors the order and the separators through logical margins; the slash glyph is not mirrored.
portability:
  web: nav with aria-label="Breadcrumb" wrapping an ol; each level an li; ancestor levels are anchors; the last li carries aria-current="page"; separators are aria-hidden spans, never list bullets or generated content that screen readers might voice.
  nativeFallbacks:
    - GTK4 a Box of LinkButtons with Labels for the slashes; the current level a Label with the bright colour.
    - Qt a QHBoxLayout of QLabels with rich-text links; the current level plain.
    - "Terminal UI: the trail as one line; the current level in the bright colour; slashes in the muted colour."
fixtures: [FX-LONG, FX-320, FX-ZOOM-200, FX-I18N, FX-RTL, FX-RM, FX-HC, FX-STATE-MATRIX]
related: [link, sidebar-nav, pagination, tree]
specimens: [settings-panel, filterable-table]
keywords: [breadcrumb, trail, path, hierarchy, navigation, current page, ellipsis]
sources: [j3w1-web]
compact: false
---

## Purpose

Where the current page sits in a hierarchy, with a jump to any ancestor.
Secondary navigation: never a replacement for the sidebar or page title, and
omitted on the root page.

## Anatomy

Parts as listed in the anatomy; the separator follows every item but the last.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | links {color.text.link}, 1px underline; separators {color.text.muted}; current {color.text.bright} | underline on links; none on the current page |
| hover | link → {color.interaction.hover.bg-strong}, text {color.text.link-hover} | underline 1px → 2px; cursor |
| focus-visible | 1px dashed {color.interaction.focus.ring} at −2px around the link | the ring |
| current | {color.text.bright}; no underline; no hover | `aria-current="page"`; no underline |
| truncated | middle levels replaced by an `…` button in {color.text.default} | `aria-expanded="false"`; its label counts the hidden levels |

## Keyboard

As in the key table. The ellipsis button discloses the hidden levels in place
on Enter or Space; focus stays on it, so the revealed links are the next Tab
stops.

## Accessibility

The `nav` label "Breadcrumb" is translated. The `aria-hidden` separator keeps
"slash" unspoken; the list gives the count. `aria-current="page"` marks the
last item, link or not. Hidden levels stay in the DOM (`hidden` until
disclosed) so find-in-page reaches them. Text meets 4.5:1; underline and ring
3:1. Each link is at least 24 CSS pixels tall through line box and padding.

## Portability

Plain inline links and text; the separator needs only an inline-start margin
that flips in RTL. Without an underline, a toolkit draws the link in the link
colour and records the deviation. The ellipsis is optional; without it the
full trail shows and wraps.

## Non-examples

Chevrons, arrows or bullets as separators. A trail ending with the site name
instead of the current page. The current page as an underlined link.
`text-overflow` truncation that hides unreachable levels. A horizontally
scrolling trail. Uppercase or letter-spaced items. Separators read aloud.
