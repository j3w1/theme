---
id: accessibility
title: Accessibility
order: 30
summary: Contrast targets, focus and keyboard contracts, reduced motion, forced colours, and what an automated pass does and does not prove.
---

## What is claimed

WCAG 2.2 criteria are measurable **design targets** for the theme's roles. A
green contrast report and a clean automated scan show that the specified
colours and the reference markup meet them; they are not a conformance claim
for any adopting application. Keyboard operation, focus management, labels,
reflow and manual review stay the consumer's job. The theme's own limits are
under Limitations.

## Contrast

- Ordinary text: at least 4.5:1 against the actual background of its state,
  measured on resolved sRGB values after compositing translucent colours.
- Large text (18.66px bold or 24px regular and above): at least 3:1.
- Control boundaries, focus rings, meaningful icons and chart marks: at least
  3:1 (WCAG 1.4.11).
- Disabled text is exempt under WCAG 1.4.3; house policy still needs 3:1
  (`text.disabled`), below the ordinary-text floor by design.
- Never round a value into a pass. The report keeps the unrounded ratio and
  shows two decimals: `4.4996` reads 4.50 and fails.
- Heritage values that fail (`#a3676b` as text, `#7d1310` anywhere as text)
  are flagged `$deprecated` in the `heritage-ansi` profile, never shown as
  ordinary passes.

`exports/contrast.md` lists every declared pair (the global pairs in
`spec/contrast.json` and every component's `stateTokens` and `contrast[]`
entries) with its computed ratio. Waived pairs carry their reason; a waiver is
valid only for decorative graphics that are never the only boundary of a
control.

## Text hierarchy

The colour roles are in `spec/foundations.md`, Typography semantics (D-033);
near-white is not a readability or boldness requirement. Selection and
contrast-critical on-fill roles are checked against their actual
backgrounds. Heading level is conveyed through structure, size and weight,
never colour alone.

## Focus

Focus is never lost and never invisible. The ring is defined once, in
`spec/foundations.md`, Interaction states, rule 2 (D-006, D-015).

- `:focus` without `:focus-visible` draws nothing: pointer clicks stay quiet,
  keyboard focus stays visible.
- A component that removes a host's default indicator must draw this one.
- The state matrices render every declared combination, including
  `selected+focus-visible` and `invalid+focus-visible`, where rings disappear
  in practice.

## Keyboard

Native controls keep native keyboard behaviour. Custom widgets follow the
WAI-ARIA Authoring Practices pattern in their `aria.apg`:

- roving tabindex in toolbars, tabs, trees and listboxes;
- `aria-activedescendant` in comboboxes;
- focus trapping and `Escape` in dialogs and drawers;
- arrow keys in radio groups and menus.

Positive `tabindex` is banned. Every icon-only control has an accessible name.
The site's own controls (search, filters, inspector, copy) work with the
keyboard, and the no-JS build keeps every normative section readable.

## Motion

Motion follows `spec/foundations.md`, Interaction states, rule 7. Under
`prefers-reduced-motion: reduce`:

- toasts, dialogs and drawers appear in place;
- indeterminate progress shows static stripes;
- loading glyphs do not spin;
- skeletons do not shimmer;
- tab indicators do not slide.

## Forced colours and high contrast

Under `forced-colors: active`, rings use `Highlight` and selections
`Highlight` / `HighlightText`. Borders survive because they are real borders,
not box-shadows; pattern fills keep charts and diffs readable.

## Reflow, zoom and text

Components reflow at 320 CSS pixels without horizontal page scrolling, at 200%
browser zoom and at 200% text-only zoom. Rings and borders stay 1px / 2px CSS.
Targets are at least 24×24 CSS pixels, with 4px spacing in `compact` density.
Long labels wrap, or truncate with a visible affordance; the stress fixtures
(English, Spanish, Chinese, Arabic with `dir="rtl"`) exercise this.

## Colour is never the only channel

Every status has a glyph; every state a border, pattern or ARIA change. Diffs
keep their `+ − ~` markers. Charts carry pattern fills and a table fallback.
The `heritage-ansi` terminal palette has less hue difference by design, a
recorded limit.

## Limitations (recorded, not hidden)

- The theme specifies colours, states and reference markup. It cannot make a
  host application's own focus management, labels or reading order correct.
- The automated scan uses axe-core with the WCAG 2.x A and AA rule sets and
  does not test every success criterion. Manual checks (keyboard walks,
  screen-reader reading, zoom) need their own execution evidence; a missing
  protocol stays not run.
- In `default`, terminal slot 8 is the dim tier, under 4.5:1 on the terminal
  background (D-029; slot 0 is the background); programs drawing text in it
  inherit that. In `heritage-ansi`, slots 1, 4, 6, 8, 9, 10, 12, 13, 14 and 15
  fail 4.5:1. The `extended` overlay proposes a semantic set.
- Inside an editor selection, type and comment syntax drop below 4.5:1 on
  `code.selection-bg`; keyword, tag, property and heading stay above it after
  D-029. A selection is short-lived; the code-editor specification records
  this limit.
- `interaction.text-selection.tint` (D-036) keeps text at 4.5:1 only where the
  host draws the tint under the text.
  - **Over the text:** where a host paints it over the text, as in Telegram's
    rich editor and rich translation preview, selected text falls below 4.5:1.
  - **Links and code:** inside a selection they drop below 4.5:1.

## Verification evidence and freshness

**Source coverage.** The coverage ledger records source facts: specified,
demonstrated and test implemented. `exports/coverage.json` schemaVersion 1
adds `testImplemented` and keeps `tested` as a compatibility alias meaning the
test file exists; component JSON and family totals use the same definitions.
No coverage Boolean proves an execution or WCAG conformance.

**Execution evidence.** The static verification report gives per-test
outcomes and per-component summaries. Evidence schemaVersion 1 records, for
each result:

- the method (automated or manual), category and component;
- the states and variants it explicitly covers (empty lists mean
  "unspecified", never "all");
- browser and version, OS, viewport, profile, density and JavaScript setting;
- a run or protocol reference.

The recorded profile and density are the starting configuration; tests that
switch them say so in their scope. One browser engine never stands for
another. Skipped, failed, not run and not applicable are separate outcomes,
and every non-pass has a reason. Manual screen-reader and keyboard claims need
protocol records. The automated suite targets Chromium; other engines stay not
run.

**Freshness.** A claim is current only while the tested artifact's digest and
a broad source fingerprint both match. The fingerprint covers tracked contract
sources, schemas, generators, site code, tests, agent guidance, CI
configuration and the package lockfile, so an unrelated change can stale more
evidence than strictly needed. A stale record keeps its real outcome and
reference but no longer shows a current pass.

**How the report is built.**

1. A build first publishes a static not-run report and a subject manifest.
2. The browser reporter checks that source and specimen assets still match
   that subject before it publishes execution evidence.
3. Report generation writes only under `dist/verification/` and checks that
   every specimen byte is unchanged.
4. The report's own presentation has a separate static and browser gate; it
   never certifies itself.

Run timestamps and revisions live only in this post-test evidence, outside the
committed exports and their digests, so no hash depends on itself.

**Run it locally.**

1. Build the site.
2. Run the browser suite.
3. Run `npm run verification:report`, then `npm run verification:check`, then
   `npm run test:verification`.

A local run names its local execution and digests and is never presented as
hosted CI evidence.

**Record a manual protocol.** Pass a schema-valid evidence document to
`node scripts/verification-report.mjs <repo-relative-evidence.json>`, carrying
the real tested digests, the browser and environment, and a `protocol:`
reference with the protocol identifier and recorded observations. Keep the
protocol with the evidence; never copy private artifacts into this public
repository.
