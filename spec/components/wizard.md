---
id: wizard
name: Wizard
family: forms-advanced
maturity: stable
priority: R1
since: 0.1.0
order: 50
summary: A multi-step form with a stepper header, the current panel and back/next actions; native buttons with aria-current="step".
native: true
aria:
  pattern: "native <button>s in an <ol>; the current step carries aria-current=step; the panel is a section named by its heading"
  apg: https://www.w3.org/WAI/ARIA/apg/practices/forms/
variants:
  - id: numbered
    name: Numbered steps
  - id: icons
    name: Glyph markers
sizes: [compact, comfortable]
states:
  - default
  - hover
  - focus-visible
  - current
  - disabled
  - invalid
  - busy
tokens:
  steps.divider: color.border.divider
  step.text: color.text.default
  step.bg-hover: color.interaction.hover.bg
  step.ring: color.interaction.focus.ring
  step.text-current: color.text.bright
  step.indicator-current: color.border.selected-indicator
  step.text-disabled: color.text.disabled
  step.marker-complete: color.status.success.text
  step.marker-invalid: color.status.danger.text
  step.indicator-invalid: color.status.danger.border
  panel.bg: color.surface.default
  panel.border: color.border.default
  title.text: color.text.bright
  text.text: color.text.default
  message.text: color.status.danger.text
  next.bg: color.action.primary.bg
  next.text: color.action.primary.text
  next.bg-hover: color.action.primary.hover-bg
  next.bg-pressed: color.action.primary.pressed-bg
  next.border: color.action.primary.border
  next.ring: color.interaction.focus.ring-container
  back.text: color.action.secondary.text
  back.border: color.action.secondary.border
  back.bg-hover: color.action.secondary.hover-bg
  busy.glyph: color.action.primary.text
stateTokens:
  default: { fg: color.text.default, bg: color.surface.canvas }
  hover: { fg: color.text.default, bg: color.interaction.hover.bg }
  focus-visible: { fg: color.text.bright, bg: color.surface.canvas, outline: color.interaction.focus.ring }
  current: { fg: color.text.bright, bg: color.surface.canvas, border: color.border.selected-indicator }
  invalid: { fg: color.status.danger.text, bg: color.surface.canvas, border: color.status.danger.border }
  busy: { fg: color.action.primary.text, bg: color.action.primary.bg }
contrast:
  - { fg: color.status.success.text, bg: color.surface.canvas, label: "complete marker on the canvas" }
  - { fg: color.text.bright, bg: color.surface.default, label: "panel title on the panel surface" }
  - { fg: color.text.default, bg: color.surface.default, label: "panel text on the panel surface" }
  - { fg: color.status.danger.text, bg: color.surface.default, label: "step message on the panel surface" }
  - { fg: color.border.default, bg: color.surface.canvas, min: 1, kind: ui, label: "panel edge (decorative)", waiver: "the panel is identified by its heading and position, not by this edge" }
  - { fg: color.action.secondary.text, bg: color.surface.canvas, label: "back button text" }
  - { fg: color.action.secondary.border, bg: color.surface.canvas, min: 3, kind: ui, label: "back button boundary" }
  - { fg: color.action.primary.border, bg: color.surface.canvas, min: 3, kind: ui, label: "next button boundary", waiver: "the primary button is identified by its text at 9.28:1 on its fill and by its position; the fill measures 1.86:1 and its border 2.56:1 against the canvas, a documented property of the actions family, not of the wizard" }
  - { fg: color.interaction.focus.ring-container, bg: color.action.primary.bg, min: 3, kind: ui, state: focus-visible, label: "ring on the next button's fill" }
  - { fg: color.text.disabled, bg: color.surface.canvas, min: 3, kind: ui, state: disabled, label: "future step text (exempt; house floor 3:1)" }
anatomy:
  - part: steps
    description: An ordered list of step buttons under a 1px divider; the wizard's table of contents.
  - part: step
    description: One button per step; its marker (a number or a glyph) and its name; the current one carries aria-current=step and the 2px indicator.
  - part: marker
    description: The number, or in the glyph variant the ✓ for complete steps in status.success.text; ✕ in status.danger.text for a step with errors.
  - part: panel
    description: The current step's content on surface.default, named by its heading ("Step n of m").
  - part: actions
    description: Back (secondary) and Next or Finish (primary) at the end of the panel; Next shows the ⋯ glyph while busy.
keyboard:
  - key: Tab / Shift+Tab
    action: Reaches each enabled step button, the panel's fields, then Back and Next; future steps are disabled and skipped.
  - key: Enter / Space
    action: On a step button, goes to that step if it is reachable; on Next, validates the panel and advances; on Back, returns without validating.
  - key: Escape
    action: Nothing; leaving a wizard is an explicit Cancel or the host's navigation.
responsive: The stepper wraps to a vertical list below 600px, the panel and actions stack, and Next stays last in reading order; nothing scrolls horizontally at 320px. RTL mirrors the progression, the markers and the action order.
portability:
  web: "an <ol> of <button type=button> with aria-current=step on the current one and disabled on unreachable ones; the panel is a <section aria-labelledby>; focus moves to the panel heading after each step change; no role=tablist, because steps are sequential and validated."
  nativeFallbacks:
    - GTK4 Assistant; the page list maps to the stepper, the current page to the indicator.
    - Qt QWizard; the side widget lists steps, the current one bold with the indicator.
    - "Terminal UI: a breadcrumb line of steps above the form, the current one underlined."
fixtures: [FX-LONG, FX-320, FX-ZOOM-200, FX-I18N, FX-RTL, FX-RM, FX-HC, FX-STATE-MATRIX]
related: [button, fieldset, tabs, breadcrumbs, progress, admin-form]
specimens: [admin-form, settings-panel]
keywords: [wizard, stepper, steps, multi-step, assistant, onboarding, form]
sources: [j3w1-web]
compact: false
---

## Purpose

A form too long for one screen, split into ordered steps that are validated
one at a time. The stepper shows where the person is and which steps are
complete; the panel holds the current step; Back and Next move through the
sequence. Steps are not tabs: a future step is unreachable until the steps
before it pass.

## Anatomy

The stepper, an ordered list of step buttons over a {color.border.divider}
rule; each step's marker and name; the panel on {color.surface.default} with
its "Step n of m" heading in {color.text.bright}; the actions row with Back
(secondary) and Next (primary, {color.action.primary.bg} with
{color.action.primary.text}).

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | steps in {color.text.default}; complete steps carry the ✓ in {color.status.success.text} | the ✓ glyph; the numbers |
| hover | step background → {color.interaction.hover.bg}; Next → {color.action.primary.hover-bg}; Back → {color.action.secondary.hover-bg} | cursor: pointer |
| focus-visible | ring 1px dashed {color.interaction.focus.ring} at −2px; on Next's fill the ring takes {color.interaction.focus.ring-container} | the ring |
| current | 2px {color.border.selected-indicator} under the step; name in {color.text.bright} | `aria-current="step"`; the indicator bar; the heading reads "Step n of m" |
| disabled | a future step in {color.text.disabled}; no hover | `disabled`; cursor: not-allowed; skipped by Tab |
| invalid | the step's marker becomes ✕ in {color.status.danger.text}; its indicator takes {color.status.danger.border}; the panel shows the message | glyph; message text; `aria-invalid` on the failing fields |
| busy | Next shows the static ⋯ glyph before its label and does not respond; size unchanged | `aria-busy` on the wizard; the glyph; cursor: progress |

Precedence when several apply: disabled > busy > invalid > current > hover;
focus-visible is always drawn.

## Keyboard

Tab walks the enabled step buttons in order, then the panel's fields, then
Back and Next. Enter or Space on a reachable step goes to it; on Next it
validates the panel, and on failure moves focus to the first invalid field,
on success advances and moves focus to the new panel heading. Back never
validates. There is no arrow-key navigation between steps, because the
stepper is a list of buttons, not a tablist.

## Accessibility

The wizard is a region named by `aria-label`; the stepper is an `<ol>` so
count and position are announced; the current step carries
`aria-current="step"`; complete steps append visually hidden ", complete";
unreachable steps are `disabled`, not `aria-disabled`, because they cannot be
activated. The panel is a `<section>` named by its heading, which receives
focus after each step change. Validation failures are announced through the
form's live region and the ✕ marker; `aria-busy` marks the wizard while Next
is in progress. Contrast: step text 8.65:1, current name 10.37:1, complete
marker 7.13:1, indicator 4.69:1, Next text 9.28:1 on its fill, ring 5.57:1 on
the primary fill, future step text 3.33:1 (exempt).

## Portability

Everything is text, a 2px bottom border and the button tones; no icon font
(the markers are text glyphs). Toolkits with a native assistant use its page
list and map the indicator to the current page; toolkits with none draw the
stepper as a row of buttons and record any deviation in the indicator width.

## Non-examples

Tabs restyled as steps. A progress bar in place of the stepper. Circles with
connecting lines that need a rounded radius. Future steps that look enabled
and reject the click. A spinner on Next. Colour-only completion marks.
Validation that blocks Back. Animated slides between panels.
