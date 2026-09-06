---
id: loading-indicator
name: Loading indicator
family: feedback
maturity: stable
priority: R1
since: 0.1.0
order: 40
summary: A static ⋯ glyph with a worded label inside an aria-busy container; inline next to text or as a centred block. There is no spinner.
native: true
aria:
  pattern: "native container with aria-busy=true and role=status; the glyph is aria-hidden and the label carries the meaning"
  apg: https://www.w3.org/WAI/ARIA/apg/patterns/alert/
variants:
  - id: inline
    name: Inline
  - id: block
    name: Block
sizes: [compact, comfortable]
states:
  - default
  - reduced-motion
tokens:
  glyph.text: color.text.muted
  label.text: color.text.default
  block.bg: color.surface.default
  block.border: color.border.divider
stateTokens:
  default: { fg: color.text.default, bg: color.surface.canvas }
  reduced-motion: { fg: color.text.default, bg: color.surface.canvas }
contrast:
  - { fg: color.text.muted, bg: color.surface.canvas, label: "glyph on the canvas" }
  - { fg: color.text.default, bg: color.surface.default, label: "block label on the panel surface" }
  - { fg: color.text.muted, bg: color.surface.default, label: "block glyph on the panel surface" }
  - { fg: color.border.divider, bg: color.surface.canvas, min: 1, kind: ui, label: "block edge (decorative)", waiver: "the block is identified by its label and aria-busy, not by this edge" }
anatomy:
  - part: root
    description: The container that is busy; role status and aria-busy=true while loading; inline it is a span, as a block a div on surface.default.
  - part: glyph
    description: The static ⋯ in text.muted, hidden from assistive technology; never animated.
  - part: label
    description: The worded state in text.default ("Loading fonts", "Saving"); always present, visible in both variants.
keyboard:
  - key: Tab
    action: Nothing; the indicator is not focusable and never traps focus; the content it replaces keeps its tab stops when it returns.
responsive: Inline, it follows the text and wraps with it; the block centres in its container at any width and needs no minimum height beyond one row. RTL leaves the glyph in place, since ⋯ has no direction.
portability:
  web: "a <span role=status aria-busy=true> inline or a <div role=status aria-busy=true> block; the glyph is text; the label is the announcement; aria-busy is removed, and the label replaced by the result, when loading ends."
  nativeFallbacks:
    - GTK4 Label with the glyph; no Spinner widget.
    - Qt QLabel; QProgressBar busy mode only when a bar is wanted.
    - "Terminal UI: the glyph in the status line."
fixtures: [FX-320, FX-ZOOM-200, FX-I18N, FX-RTL, FX-RM, FX-HC, FX-STATE-MATRIX]
related: [progress, skeleton, empty-state, toast]
specimens: [filterable-table, settings-panel]
keywords: [loading, busy, waiting, pending, glyph, no spinner]
sources: [j3w1-web]
compact: false
---

## Purpose

Marks the moment between a request and its result when there is nothing to
measure: a list that is being fetched, a field that is being validated. The
theme has no spinner; the same static ⋯ glyph that a loading control shows
appears here beside a worded label, and the container says it is busy.

## Anatomy

The busy container; the glyph in {color.text.muted}; the label in
{color.text.default}. Inline, the two follow the text they qualify; as a
block, they sit centred on {color.surface.default} inside a
{color.border.divider} edge where the content will appear.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | the static ⋯ and the label | `aria-busy="true"`; the glyph; the worded label |
| reduced-motion | identical: there is nothing to reduce | `prefers-reduced-motion` |

The indicator has no hover, focus or disabled state; it is not a control.

## Keyboard

None. The indicator is never focusable. When loading replaces content that
had focus, focus moves to the container's heading or to the indicator's
parent region, never to the indicator itself, and returns to the result when
it arrives.

## Accessibility

The container is `role="status"` with `aria-busy="true"` while loading, so
assistive technology can wait for the subtree to settle and announce the
label once. The glyph is `aria-hidden`; the label is a real sentence with the
object named ("Loading fonts") and is visible in both variants; a host that
must hide it inline keeps it visually hidden, never absent. Because nothing moves, there is no
`prefers-reduced-motion` branch to get wrong. Contrast: label 8.65:1 on the
canvas and 8.43:1 on the panel surface; glyph 5.81:1 and 5.66:1.

## Portability

Text only. Toolkits with a spinner widget do not use it; the glyph and label
are a plain label. Hosts that insist on an activity indicator record the
deviation and keep it under the 150 ms motion budget with a reduced-motion
branch.

## Non-examples

A spinner or rotating ring. Animated dots. A shimmering skeleton. A full-page
overlay that blocks input for a fetch. A glyph with no label. An indicator
that takes focus. A dimmed container at reduced opacity.
