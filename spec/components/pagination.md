---
id: pagination
name: Pagination
family: navigation
maturity: stable
priority: R1
since: 0.1.0
order: 30
summary: Page links for a long result set; the current page takes the selection fill and aria-current, and the compact form reads "3 of 12" between previous and next.
native: true
aria:
  pattern: native nav > ul of links with aria-current="page"
variants:
  - id: default
    name: Default
    description: Previous, numbered pages with a gap, next.
  - id: compact
    name: Compact
    description: Previous and next around a "3 of 12" status; for toolbars and narrow layouts.
sizes: [compact, comfortable]
states:
  - default
  - hover
  - focus-visible
  - current
  - disabled
tokens:
  root.bg: color.surface.default
  link.text: color.text.default
  link.bg-hover: color.interaction.hover.bg
  link.bg-pressed: color.interaction.pressed.bg
  link.ring: color.interaction.focus.ring
  link.text-disabled: color.text.disabled
  current.bg: color.interaction.selection.bg
  current.text: color.text.on-selection
  current.ring: color.interaction.focus.ring-container
  gap.text: color.text.muted
  status.text: color.text.default
  status.emphasis: color.text.bright
stateTokens:
  default: { fg: color.text.default, bg: color.surface.default }
  hover: { fg: color.text.default, bg: color.interaction.hover.bg }
  focus-visible: { fg: color.text.default, bg: color.surface.default, outline: color.interaction.focus.ring }
  current: { fg: color.text.on-selection, bg: color.interaction.selection.bg }
contrast:
  - { fg: color.interaction.focus.ring-container, bg: color.interaction.selection.bg, min: 3, kind: ui, state: current, label: "ring on the current page when focused" }
  - { fg: color.text.disabled, bg: color.surface.default, min: 3, kind: ui, state: disabled, label: "disabled previous/next (exempt; house floor 3:1)" }
  - { fg: color.text.muted, bg: color.surface.default, label: "gap ellipsis on the panel surface" }
anatomy:
  - part: list
    description: The ul inside nav[aria-label="Pagination"]; items sit inline with a density gap.
  - part: link
    description: A page link; square, at least the control height on each side, text.default on no fill.
  - part: current
    description: The current page link with aria-current="page"; selection fill and on-selection text.
  - part: prev / next
    description: Links to the neighbouring pages with a visible label; aria-disabled and no href at the ends.
  - part: gap
    description: An aria-hidden ellipsis in text.muted where pages are skipped.
  - part: status
    description: In the compact variant, "3 of 12" with the current number in text.bright and aria-current on the span.
keyboard:
  - key: Tab / Shift+Tab
    action: Moves through previous, each page link and next in order; a disabled end has no href and is not a stop.
  - key: Enter
    action: Follows the focused link.
responsive: The list wraps at 320px; the compact variant never wraps and is the choice below 600px or in a toolbar. RTL mirrors the order and swaps the previous and next glyphs through logical properties.
portability:
  web: nav with aria-label="Pagination" wrapping a ul of anchors; the current page is an anchor with aria-current="page"; a disabled end is an anchor without href carrying aria-disabled="true"; the fill is a background, the ring an outline.
  nativeFallbacks:
    - GTK4 a Box of Buttons with the current one using the selected style class.
    - Qt a row of QToolButtons; the current one checked and styled with the selection fill.
    - "Terminal UI: page numbers on one line; the current number inverted."
fixtures: [FX-320, FX-ZOOM-200, FX-I18N, FX-RTL, FX-RM, FX-HC, FX-STATE-MATRIX]
related: [table, data-table, link, button]
specimens: [filterable-table]
keywords: [pagination, pages, paging, previous, next, current page, results]
sources: [j3w1-web]
compact: false
---

## Purpose

Moves through a result set that is split into pages. Pagination is for sets
whose size is known; use a "load more" button or infinite scroll for feeds,
and a range field for jumping to an arbitrary offset.

## Anatomy

A `nav` labelled "Pagination" holding a `ul`: previous, the page links with
an aria-hidden `…` gap where pages are skipped, next. Every page link is a
square target in {color.text.default} with no border; the current page is
filled with {color.interaction.selection.bg} and {color.text.on-selection}.
The compact variant keeps previous and next and replaces the numbers with
"3 of 12", the current number in {color.text.bright}.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | text {color.text.default}; no fill; no border | — |
| hover | background → {color.interaction.hover.bg} | cursor: pointer |
| focus-visible | ring 1px dashed {color.interaction.focus.ring} at −2px; on the current page the ring is {color.interaction.focus.ring-container} | the ring |
| current | fill {color.interaction.selection.bg}; text {color.text.on-selection}; no hover | `aria-current="page"` |
| disabled | text {color.text.disabled}; no fill; no hover | `aria-disabled="true"`; no `href`; cursor: not-allowed |

Pressing a link uses {color.interaction.pressed.bg} for the duration of the
press only.

## Keyboard

Plain links in document order: previous, the pages, next. A disabled end has
no `href`, so it is not a tab stop and cannot be activated. The current page
remains a link to itself so a keyboard user can reload it.

## Accessibility

`aria-label="Pagination"` on the `nav`; a second pagination on the same page
gets a distinct label. Previous and next carry a visible word, not just a
glyph, and `aria-label` gives the target page number when it is known
("Previous page, 2"). The gap is `aria-hidden`; the list count tells a screen
reader how many links follow. Contrast: link text 8.43:1, current text 12.47:1
on the selection fill, ring-container 7.48:1 on the fill, disabled 3.24:1
(exempt). Targets are at least 24×24 CSS pixels in `compact` density.

## Portability

Links with a background and an outline; nothing else. Hosts that cannot
remove `href` from a disabled link use a disabled button for the ends and
record it. The compact variant is plain text and two links and ports
anywhere.

## Non-examples

Rounded or circular page buttons. A border around every page link. The
current page marked by colour or bold alone without `aria-current`. Previous
and next as glyph-only links without a label. A disabled end that still has
an `href`. Pagination that hides the last page number. A row that scrolls
horizontally.
