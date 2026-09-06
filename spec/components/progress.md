---
id: progress
name: Progress
family: feedback
maturity: stable
priority: R1
since: 0.1.0
order: 30
summary: A native progress element with a label and value; determinate fills with the primary colour, indeterminate shows static 45° stripes, never an animation.
native: true
aria:
  pattern: "native <progress> labelled by <label for>; aria-valuetext for indeterminate work"
  apg: https://www.w3.org/WAI/ARIA/apg/patterns/meter/
variants:
  - id: determinate
    name: Determinate
  - id: indeterminate
    name: Indeterminate
  - id: with-label
    name: With detail line
sizes: [compact, comfortable]
states:
  - default
  - busy
  - error
  - reduced-motion
tokens:
  track.bg: color.interaction.pressed.bg
  track.border: color.border.control
  value.bg: color.action.primary.bg
  value.bg-error: color.status.danger.fill
  stripe.a: color.action.primary.bg
  stripe.b: color.interaction.pressed.bg
  label.text: color.text.bright
  value.text: color.text.default
  detail.text: color.text.muted
  error.text: color.status.danger.text
stateTokens:
  default: { fg: color.text.default, bg: color.surface.canvas, border: color.border.control }
  error: { fg: color.status.danger.text, bg: color.surface.canvas, border: color.status.danger.border }
contrast:
  - { fg: color.text.bright, bg: color.surface.canvas, label: "label on the canvas" }
  - { fg: color.text.muted, bg: color.surface.canvas, label: "detail line on the canvas" }
  - { fg: color.action.primary.bg, bg: color.interaction.pressed.bg, min: 3, kind: ui, label: "value fill against the track", waiver: "the fill measures 1.72:1 against the track; the value is carried by the visible percentage text and the native value, and the track boundary (border.control, 4.45:1) marks the full extent" }
  - { fg: color.action.primary.bg, bg: color.interaction.pressed.bg, min: 1, kind: ui, state: busy, label: "stripes (decorative pattern)", waiver: "the stripes are a pattern, not a boundary; busy is carried by aria-busy and aria-valuetext" }
  - { fg: color.status.danger.fill, bg: color.interaction.pressed.bg, min: 3, kind: ui, state: error, label: "error fill against the track" }
anatomy:
  - part: header
    description: The label in text.bright and the value text in text.default, on one row above the bar.
  - part: label
    description: A <label for> the progress element; carries the ✕ glyph in the error state.
  - part: value
    description: The percentage or "n of m" in tabular figures; omitted while indeterminate.
  - part: bar
    description: The native progress element, 8px tall, track interaction.pressed.bg behind a 1px border.control, value fill action.primary.bg.
  - part: detail
    description: An optional line below in text.muted saying what is happening or what failed.
keyboard:
  - key: Tab
    action: Nothing; progress is not focusable and never traps a person.
  - key: Escape
    action: Nothing; cancelling is a separate button next to the bar.
responsive: Fills its container; the header wraps the value under the label below 320px; the bar never shrinks below 8px. RTL fills from the end edge, which the native element does on its own.
portability:
  web: "native <progress max value> with a <label for>; indeterminate by omitting value and setting aria-valuetext; the fill through ::-webkit-progress-value and ::-moz-progress-bar; stripes through a repeating-linear-gradient with no animation."
  nativeFallbacks:
    - GTK4 ProgressBar; pulse mode draws the stripes statically (no pulse animation).
    - Qt QProgressBar; the chunk is the fill, minimum = maximum = 0 for indeterminate with a static hatched brush.
    - "Terminal UI: a bar of block characters; indeterminate as alternating half blocks."
fixtures: [FX-LONG, FX-320, FX-ZOOM-200, FX-I18N, FX-RTL, FX-RM, FX-HC, FX-STATE-MATRIX]
related: [loading-indicator, file-input, wizard, toast]
specimens: [admin-form, i3-window-frame]
keywords: [progress, bar, indeterminate, upload, percentage, busy, stripes]
sources: [j3w1-web]
compact: false
---

## Purpose

Shows how far a known task has gone, or that an unbounded one is running.
It reports; it never blocks. A task that can be cancelled has a button beside
the bar. A short wait with no bar is the loading indicator.

## Anatomy

The header row with the label in {color.text.bright} and the value in
{color.text.default}; the bar, a native progress element whose track is
{color.interaction.pressed.bg} behind a 1px {color.border.control} and whose
fill is {color.action.primary.bg}; an optional detail line in
{color.text.muted}.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | fill {color.action.primary.bg} on the track; the value text | the native value; the percentage text |
| busy | the whole track shows static 45° stripes of {color.action.primary.bg} on {color.interaction.pressed.bg}; no value text | `aria-busy`; `aria-valuetext`; the stripe pattern; no animation |
| error | fill → {color.status.danger.fill}; the label gains the ✕ glyph in {color.status.danger.text}; the detail line says what failed | glyph; worded detail |
| reduced-motion | identical to default and busy: nothing animates in any state | `prefers-reduced-motion` |

Indeterminate work is the busy state; the determinate variant enters it while
the total is unknown and leaves it once known.

## Keyboard

None. The progress element is not focusable and receives no key. A cancel
button next to the bar is an ordinary button with its own tab stop.

## Accessibility

The label is a real `<label for>` on the progress element, so its name is
programmatic; the value is in the native `value` and repeated in text.
Indeterminate bars set `aria-valuetext` ("Preparing"), and the container sets
`aria-busy` for the duration. Completion and failure are announced through a
polite live region, not by the bar. Contrast: label 10.37:1, value 8.65:1,
detail 5.81:1, track boundary 4.45:1, error fill 3.36:1 against the track.
The primary fill against the track measures 1.72:1 and is waived because the
value is stated in text; a host that must meet 3:1 graphically raises the
track to {color.surface.canvas}.

## Portability

A track, a fill and a hatched pattern. Toolkits with a native bar map the
fill to the primary colour and disable pulse animation; toolkits without
gradients draw the stripes with a hatched brush or alternating characters.

## Non-examples

A spinner. Animated or "barber-pole" stripes. A shimmering skeleton in place
of a bar. A circular ring. A rounded pill-shaped bar. Colour-only failure
without the glyph and text. A bar with no label. A bar that blocks input.
