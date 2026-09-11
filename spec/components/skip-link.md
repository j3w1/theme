---
id: skip-link
name: Skip link
family: navigation
maturity: stable
priority: R1
since: 0.1.0
order: 70
summary: The first tab stop of a page, hidden until it receives keyboard focus, that jumps past the chrome to the main content.
native: true
aria:
  pattern: native <a href="#main"> as the first focusable element in the body
variants:
  - id: default
    name: Default
sizes: [compact, comfortable]
states:
  - default
  - focus-visible
tokens:
  root.bg: color.surface.raised
  root.text: color.text.bright
  root.border: color.border.overlay
  root.ring: color.interaction.focus.ring
stateTokens:
  default: { fg: color.text.bright, bg: color.surface.raised, border: color.border.overlay }
  focus-visible: { fg: color.text.bright, bg: color.surface.raised, border: color.border.overlay, outline: color.interaction.focus.ring }
contrast:
  - { fg: color.interaction.focus.ring, bg: color.surface.raised, min: 3, kind: ui, state: focus-visible, label: "ring on the raised surface" }
anatomy:
  - part: root
    description: The anchor itself; absolutely positioned at the top inline-start corner, moved off-screen until focused, at z.skip-link.
keyboard:
  - key: Tab
    action: From the address bar or the top of the document, focuses the skip link and reveals it.
  - key: Enter
    action: Moves focus to the main landmark (which carries tabindex="-1") and scrolls it into view.
  - key: Tab (again)
    action: Leaves the link without activating it; it hides again.
responsive: Fixed size in every layout; it never overlaps the main content because it is only visible while focused, and it never causes horizontal scroll while off-screen because it is moved on the block axis, not the inline axis. RTL positions it at the inline-start corner.
portability:
  web: An anchor with href pointing at the id of the main landmark, first in the body; main carries tabindex="-1" so focus lands on it; the link is moved off-screen with a negative top, never display none or visibility hidden, so it stays focusable.
  nativeFallbacks:
    - GTK4 and Qt have no page chrome to skip; the pattern does not apply and hosts record it.
    - "Terminal UI: does not apply; keyboard focus starts in the content."
fixtures: [FX-320, FX-ZOOM-200, FX-I18N, FX-RTL, FX-RM, FX-HC, FX-STATE-MATRIX]
related: [link, sidebar-nav, toolbar]
specimens: [settings-panel, admin-form]
keywords: [skip link, skip to content, bypass blocks, keyboard, landmark, main]
sources: [j3w1-web]
compact: false
---

## Purpose

Lets a keyboard user bypass the header, navigation and toolbars in one
press. It satisfies WCAG 2.4.1 for pages that have repeated blocks before
the content; a page with nothing before `main` does not need one.

## Anatomy

One anchor, first in the body, with `href` pointing at the `main` landmark.
It is a small raised card: {color.surface.raised}, 1px {color.border.overlay},
text {color.text.bright}, at the top inline-start corner at `z.skip-link`.
Off-screen at rest (a negative top), on-screen while focused.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | off-screen; nothing is painted | the link is still in the tab order and the accessibility tree |
| focus-visible | appears in the top corner; ring 1px dashed {color.interaction.focus.ring} at −2px | the link appears; the ring |

There is no hover state: a pointer cannot reach it while it is hidden, and
once visible it behaves as a link.

## Keyboard

Tab from the top of the document reaches it first. Enter moves focus to
`main`, which carries `tabindex="-1"` so the browser's focus actually lands
there and the next Tab continues inside the content. Tab away hides it again.

## Accessibility

The link text names the destination ("Skip to content"), translated. Hiding
uses position only, so the link remains in the accessibility tree; `display:
none`, `visibility: hidden` and `aria-hidden` all defeat it. The reveal is an
instant position change: nothing slides, so reduced motion needs no special
case. Contrast: text 10.10:1 on the raised surface, frame 4.57:1,
ring 4.57:1. The visible target is at least 24 CSS pixels tall.

## Portability

Web-only. Frameworks that render their own header keep this exact markup
first in the body; a host stylesheet that removes outlines must restore the
ring here. The reference site uses this component for its own skip link.

## Non-examples

A skip link that is always visible. One hidden with `display: none` or
`visibility: hidden`. One that is not the first tab stop. One that points at
an element without `tabindex="-1"`, so focus does not move. A skip link
that slides in from the side and causes horizontal scroll while hidden. A
rounded pill. One rendered without the frame on the canvas.
