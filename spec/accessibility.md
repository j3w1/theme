---
id: accessibility
title: Accessibility
order: 30
summary: Contrast targets, focus and keyboard contracts, reduced motion, forced colours, and what an automated pass does and does not prove.
---

## What is claimed

WCAG 2.2 criteria are used as measurable **design targets** for the roles this
theme defines. A green contrast report and a clean automated scan of the site
are evidence that the specified colours and the reference markup meet those
targets. They are not a conformance claim for any application that adopts the
theme: keyboard operation, focus management, labels, reflow and manual review
remain the consumer's responsibility, and the theme's own limitations are
listed at the end of this document.

## Contrast

- Ordinary text: at least 4.5:1 against the actual background of the state it
  is in, measured on resolved sRGB values after compositing translucent colours.
- Large text (18.66px bold or 24px regular and above): at least 3:1.
- Control boundaries, focus rings, meaningful icons and chart marks: at least
  3:1 (WCAG 1.4.11).
- Disabled text is exempt under WCAG 1.4.3 but must still reach 3:1 by house
  policy (`text.disabled` `#8a5559`, 3.33:1).
- Never round a value into a pass. The report keeps the unrounded ratio and
  displays two decimals; `4.4996` reads 4.50 and fails.
- Heritage values that fail (`#a3676b` as text, `#7d1310` anywhere as text)
  are flagged `$deprecated` in the `heritage-ansi` profile and are never
  presented as ordinary passes.

`exports/contrast.md` lists every declared pair: the global pairs in
`spec/contrast.json` and every `stateTokens` and `contrast[]` entry of every
component. Waived pairs carry their reason; a waiver is only valid for
decorative graphics that are never the sole boundary of a control.

## Focus

Focus is never lost and never invisible. Controls and rows show
`focus.ring` (1px dashed `#e53935`, offset −2px); focusable containers show
`focus.ring-container` (2px solid `#ffa2a7`, offset −3px); on fills the ring
takes the on-fill text colour. `:focus` without `:focus-visible` draws nothing,
which keeps pointer clicks quiet without hiding keyboard focus. A component
that removes a host's default indicator must draw this one. State matrices on
the site render every declared combination including `selected+focus-visible`
and `invalid+focus-visible`, because those are where rings disappear in
practice.

## Keyboard

Native controls keep native keyboard behaviour. Custom widgets follow the WAI
ARIA Authoring Practices pattern cited in their frontmatter (`aria.apg`):
roving tabindex in toolbars, tabs, trees and listboxes; `aria-activedescendant`
in comboboxes; focus trapping and `Escape` in dialogs and drawers; arrow keys
in radio groups and menus. Positive `tabindex` is banned. Every icon-only
control has an accessible name. The site's own controls (search, filters,
inspector, copy) are reachable and operable with the keyboard, and the no-JS
build keeps every normative section readable.

## Motion

Durations are at most 150ms and apply to opacity, transform and background
only. Under `prefers-reduced-motion: reduce` every duration is 0.01ms: toasts,
dialogs and drawers appear in place, indeterminate progress shows static
stripes, loading glyphs do not spin, skeletons do not shimmer, tab indicators
do not slide. No behaviour is sequenced on `transitionend`.

## Forced colours and high contrast

Under `forced-colors: active` rings use `Highlight`, selections use
`Highlight` / `HighlightText`, borders survive (they are real borders, not
box-shadows), and pattern fills keep charts and diffs legible.

## Reflow, zoom and text

Components reflow at 320 CSS pixels without horizontal page scrolling, at 200%
browser zoom and at 200% text-only zoom. Rings and borders stay 1px / 2px CSS.
Targets are at least 24×24 CSS pixels with 4px spacing in `compact` density.
Long labels wrap or truncate with a visible affordance; the site's stress
fixtures (English, Spanish, Chinese, Arabic with `dir="rtl"`) exercise this.

## Colour is never the only channel

Every status has a glyph; every state has a border, pattern or ARIA change;
diffs keep `+ − ~` markers; charts carry pattern fills and a table fallback.
The `heritage-ansi` terminal palette has reduced hue differentiation by
design, and the specification documents it as a limitation rather than fixing
it silently.

## Limitations (recorded, not hidden)

- The theme specifies colours, states and reference markup. It cannot make a
  host application's own focus management, labels or reading order correct.
- The automated scan on the site uses axe-core with the WCAG 2.x A and AA
  rule sets. It does not evaluate every success criterion, and manual checks
  (keyboard walks, screen-reader reading, zoom) are recorded separately in the
  test suite, not implied by the scan.
- `text.disabled` at 3.33:1 is below the ordinary-text floor by design and
  relies on the WCAG exemption for inactive controls.
- Heritage ANSI slots 1, 4, 6, 8, 9, 10, 12, 13 and 14 fail 4.5:1 on the
  terminal background. Programs that render errors or directories in those
  slots inherit that failure; the `extended` overlay proposes a corrected set.
