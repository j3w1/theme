---
id: accessibility
title: Accessibility
order: 30
summary: Contrast targets, focus and keyboard contracts, reduced motion, forced colours, and what an automated pass does and does not prove.
---

## What is claimed

WCAG 2.2 criteria are used as measurable **design targets** for the roles this
theme defines. A green contrast report and a clean automated scan of the site
show that the specified colours and the reference markup meet those targets.
They are not a conformance claim for any application that adopts the theme.
Keyboard operation, focus management, labels, reflow and manual review stay
the consumer's job. The theme's own limits are listed at the end of this
document.

## Contrast

- Ordinary text: at least 4.5:1 against the actual background of its state,
  measured on resolved sRGB values after compositing translucent colours.
- Large text (18.66px bold or 24px regular and above): at least 3:1.
- Control boundaries, focus rings, meaningful icons and chart marks: at least
  3:1 (WCAG 1.4.11).
- Disabled text is exempt under WCAG 1.4.3, but house policy still needs 3:1
  (`text.disabled` `#8a5559`, 3.52:1 on the true-black canvas). It sits below
  the ordinary-text floor by design.
- Never round a value into a pass. The report keeps the unrounded ratio and
  shows two decimals: `4.4996` reads 4.50 and fails.
- Heritage values that fail (`#a3676b` as text, `#7d1310` anywhere as text)
  are flagged `$deprecated` in the `heritage-ansi` profile. They are never
  shown as ordinary passes.

`exports/contrast.md` lists every declared pair: the global pairs in
`spec/contrast.json` and every `stateTokens` and `contrast[]` entry of every
component. Waived pairs carry their reason. A waiver is only valid for
decorative graphics that are never the only boundary of a control.

## Focus

Focus is never lost and never invisible. The ring is defined once, in
[Interaction states](#d-foundations--interaction-states) rule 2 (D-006,
D-015). In short: controls and rows show `focus.ring` (1px dashed `#e53935`,
offset −2px); focusable containers show `focus.ring-container` (2px solid
`#ffa2a7`, offset −3px); on fills, use the component's declared ring role.

- `:focus` without `:focus-visible` draws nothing. Pointer clicks stay quiet,
  and keyboard focus stays visible.
- A component that removes a host's default indicator must draw this one.
- The site's state matrices render every declared combination, including
  `selected+focus-visible` and `invalid+focus-visible`, because that is where
  rings disappear in practice.

## Keyboard

Native controls keep native keyboard behaviour. Custom widgets follow the WAI
ARIA Authoring Practices pattern cited in their frontmatter (`aria.apg`):

- roving tabindex in toolbars, tabs, trees and listboxes;
- `aria-activedescendant` in comboboxes;
- focus trapping and `Escape` in dialogs and drawers;
- arrow keys in radio groups and menus.

Positive `tabindex` is banned. Every icon-only control has an accessible name.
The site's own controls (search, filters, inspector, copy) work with the
keyboard, and the no-JS build keeps every normative section readable.

## Motion

Durations are at most 150ms and apply to opacity, transform and background
only. Under `prefers-reduced-motion: reduce` every duration is 0.01ms:

- toasts, dialogs and drawers appear in place;
- indeterminate progress shows static stripes;
- loading glyphs do not spin;
- skeletons do not shimmer;
- tab indicators do not slide.

No behaviour waits on `transitionend`.

## Forced colours and high contrast

Under `forced-colors: active`, rings use `Highlight` and selections use
`Highlight` / `HighlightText`. Borders survive, because they are real borders,
not box-shadows. Pattern fills keep charts and diffs readable.

## Reflow, zoom and text

Components reflow at 320 CSS pixels without horizontal page scrolling, at 200%
browser zoom and at 200% text-only zoom. Rings and borders stay 1px / 2px CSS.
Targets are at least 24×24 CSS pixels, with 4px spacing in `compact` density.
Long labels wrap, or truncate with a visible affordance. The site's stress
fixtures (English, Spanish, Chinese, Arabic with `dir="rtl"`) test this.

## Colour is never the only channel

Every status has a glyph. Every state has a border, pattern or ARIA change.
Diffs keep their `+ − ~` markers. Charts carry pattern fills and a table
fallback. The `heritage-ansi` terminal palette has less hue difference by
design; the specification records this as a limit instead of fixing it
silently.

## Limitations (recorded, not hidden)

- The theme specifies colours, states and reference markup. It cannot make a
  host application's own focus management, labels or reading order correct.
- The site's automated scan uses axe-core with the WCAG 2.x A and AA rule
  sets. It does not test every success criterion. Manual checks (keyboard
  walks, screen-reader reading, zoom) need their own execution evidence. A
  missing protocol stays not run; the scan does not imply it.
- In the `default` profile, terminal slot 8 is the dim tier at 3.01:1 on the
  terminal background (D-029; slot 0 is the background). Programs that draw
  text in slot 8 inherit that. The `heritage-ansi` profile keeps the historical
  slots, where 1, 4, 6, 8, 9, 10, 12, 13, 14 and 15 fail 4.5:1. The `extended`
  overlay proposes a semantic set.
- Syntax roles inside an editor selection: type and comment drop below 4.5:1 on
  `code.selection-bg` (4.24 and 4.13:1). Keyword, tag, property and heading
  stay above it after D-029. A selection is short-lived; the code-editor
  specification records this limit.

## Verification evidence and freshness

**Source coverage.** The coverage ledger records source facts: specified,
demonstrated and test implemented. `exports/coverage.json` schemaVersion 1
adds `testImplemented` and keeps `tested` as a compatibility alias with its
original meaning (the test file exists). Component JSON coverage and family
totals use the same definitions. No source coverage Boolean proves an
execution or blanket WCAG conformance.

**Execution evidence.** The linked static verification report gives the real
per-test outcomes and per-component summaries. Evidence schemaVersion 1
records, for each result:

- the method (automated or manual), category and component;
- the states and variants it explicitly covers (empty lists mean
  "unspecified", never "all");
- browser and version, OS, viewport, profile, density and JavaScript setting;
- a run or protocol reference.

The recorded profile and density describe the starting configuration; tests
that switch them say so in their scope. Results from one browser engine never
stand for another. Skipped, failed, not run and not applicable are separate
outcomes, and every non-pass has a reason. Manual screen-reader and keyboard
claims need protocol records. The current automated suite targets Chromium;
other engines stay not run.

**Freshness.** A claim is current only while two things match: the digest of
the tested artifact, and a broad source fingerprint. The fingerprint covers
tracked contract sources, schemas, generators, site code, tests, agent
guidance, CI configuration and the package lockfile. Any change to these
makes the claim stale, so an unrelated change can make more evidence stale
than strictly needed. A stale record keeps its real outcome and reference, but
it no longer shows a current pass.

**How the report is built.**

1. A build first publishes a static not-run report and a subject manifest.
2. The browser reporter checks that source and specimen assets still match
   that subject before it publishes execution evidence.
3. Report generation writes only under `dist/verification/` and checks that
   every specimen byte is unchanged.
4. The report's own presentation has a separate static and browser gate; it
   never certifies itself.

Run timestamps and revisions live only in this post-test evidence, outside the
committed deterministic exports and their digests, so no hash depends on
itself.

**Run it locally.**

1. Build the site.
2. Run the browser suite.
3. Run `npm run verification:report`, then `npm run verification:check`, then
   `npm run test:verification`.

A local run names its local execution and digests. It is never presented as
hosted CI evidence.

**Record a manual protocol.** Pass a schema-valid evidence document to
`node scripts/verification-report.mjs <repo-relative-evidence.json>`. It must
carry the real tested digests, the browser and environment, and a `protocol:`
reference with the protocol identifier and the recorded observations. Keep the
protocol with the evidence. Do not copy private artifacts into this public
repository.
