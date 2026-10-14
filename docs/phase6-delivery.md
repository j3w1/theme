# Phase 6 delivery record

Phase 6 made the theme installable: an agent building another application can
discover, select, install or copy, use and verify j3w1 elements, components and
compositions from pinned artifacts, without scraping page DOM, reading values
from screenshots, rebuilding missing behavior or guessing which CSS and
dependencies make a snippet work. Design meaning stays in `tokens/` and
`spec/`; the package implements it, and copy bundles, the portal and the Vue
application consume that implementation (`docs/ui-architecture.md`). This
record does not accept a release by itself; acceptance comes from the separate
execution records for the exact artifact and protocol.

## Decided

- **6A, foundation selection.** Current plus exactly three local candidates
  ([visual review](phase6-visual-review.md), D-022). The owner selected
  True Black / Rose, candidate I (D-023); approval is never inferred from a
  recommendation or green checks.
- **Preview corrections.** Red graphs (`color.chart.series-2`), bright rose
  column headers over regular rose values, near-white page titles, bright
  section and group headings and muted supporting text use existing approved
  roles and add no colors. Links became strong red (D-024).
- **6B–6E.** Make the foundation canonical; productize all 67 inventory
  entries, including R2/L; build the portal and the Vue showcase; verify
  external consumers, publish evidence and deploy the tested artifacts. npm
  publication stays an owner release action.
- **Integration routes.** Every component or pattern has three: *package*
  (install, import, registration, CSS, markup, binding, framework example),
  *copy* (a standalone bundle with all markup, CSS, behavior, dependencies,
  notices and instructions) and *mapping* (the compact canonical contract and
  the deviation workflow, for incompatible or native hosts). Multi-file widgets
  include their transitive dependencies and are never called a self-contained
  snippet.
- **Portal.** A short orientation page replaced the long homepage; the full
  reference moved to `/theme/reference/` with tested migration of old anchors.
  Normative content stays in the first static HTML, and ordinary pages load no
  catalogue-wide JavaScript. The command palette is a compact floating panel,
  not the original full-width top bar.
- **Vue showcase.** Vue 3 JavaScript SFCs, Vite and Vue Router consume the
  framework-agnostic package; there is no parallel Vue component library.
  Synthetic, resettable data; drag interactions have a keyboard alternative;
  screens that depend on a service say what they cannot demonstrate. GitHub
  Pages hosts it at `/theme/demo/` with hash routing; Vercel only if a proven
  Pages limit blocks the agreed experience.

## Delivered

- `packages/ui/`: modular ESM classes and registration, native forms and
  lifecycle, generated API and token dependency metadata, complete copy
  distributions, and framework/mode task kits.
- `site/src/pages/`: the portal, all 67 component pages, foundations,
  patterns, tools, the implementation guide, agent-kit preparation and the
  complete reference. The command palette loads its generated navigation index
  on first use.
- `apps/demo/`: five dashboard contexts, five record workflows, four
  productivity apps, forms, developer and utility screens and the whole
  component gallery.
- `docs/ui-consumption.md`: installation, binding, lifecycle, native form
  behavior, copy closure, pinning and migration.

## Evidence

- At selection, the foundation passed source validation, generation and drift
  checks, 105 source tests, the static build, nine distribution tests and the
  configured browser suite (204 passed, 124 intentionally skipped).
  Verification-report generation kept all 1,866 specimen files. This is
  automated foundation evidence, not package acceptance or a manual
  accessibility pass.
- `npm run ui:consumers` and `npm run test:ui` install a real tarball in
  isolated HTML/Vue/React/Astro apps, compile declarations and test three
  engines. `npm run ui:report` records artifact, fixture and protocol
  identities; `npm run ui:publish-evidence` checks that report against the
  downloadable tarball before it publishes `verification/ui.json`.
- CI requires the package checks and the full site checks before Pages
  deployment. Failed runs stay evidence of failure; no manual pass is inferred.
- The gallery axe protocol respects the decorative whitespace waiver in
  `spec/components/code-editor.md`. Native validation tests move focus out of
  the invalid field before checking pointer activation, because native
  validation UI can swallow a click. Payload budgets are in
  `docs/ui-architecture.md`.
