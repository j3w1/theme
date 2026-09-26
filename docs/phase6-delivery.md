# Phase 6 delivery contract and continuation

This records the owner-directed Phase 6 scope and what was built. The owner
selected True Black / Rose (candidate I); D-023 records it. All 67 inventory
entries have canonical contracts, official implementations, typed APIs and
complete copy distributions. The static portal and the full Vue showcase are
built. Acceptance comes from the separate execution records for the exact
artifact and protocol; this document does not accept a release by itself.

During the implementation preview, the owner asked for red graphs, distinct
table column-header and body colors, and a stronger title, subtitle and
navigation-group hierarchy. These use existing approved roles: red
`color.chart.series-2`, bright rose column headers, regular rose body values,
near-white page titles, bright section and group headings, muted supporting
text. They add no colors and keep the True Black / Rose foundation. The later
request for a separate link color is D-024: strong red links, persistent
underlines, near-white hover text.

The selected foundation passed source validation, generation and drift checks,
105 source tests, the static build, nine distribution tests, and the configured
browser suite (204 passed, 124 intentionally skipped). Verification-report
generation kept all 1,866 specimen files; its source and browser checks passed
(six browser passes, three intentional skips). This is automated foundation
evidence, not package acceptance or a manual accessibility pass.

## Primary success criterion

An agent building another application can discover, select, install or copy,
use and verify j3w1 elements, components and compositions from pinned
artifacts. It never scrapes page DOM, reads values from screenshots, rebuilds
missing behavior or guesses which CSS and dependencies make a snippet work.

Design meaning stays in `tokens/` and `spec/`; the package implements it, and
copy bundles, the portal and the Vue application consume that implementation.
None of them is a second specification (see `docs/ui-architecture.md`).

## Gate order

1. **6A:** Current plus exactly three local candidates: matched interfaces,
   state board, numeric report, real browser evidence and owner selection.
2. **6B:** Make the selected foundation canonical in tokens and spec, record the
   owner's decision, keep history, regenerate and validate exports.
3. **6C:** Productize all 67 baseline inventory entries, including R2/L; generate
   the package, standalone distributions and machine implementation mapping.
4. **6D:** Build the multi-page portal and the complete Vue showcase with
   consumption docs, live implementation examples and agent-kit entry points.
5. **6E:** Verify external consumers, publish evidence, prepare tarballs and
   migration docs, then deploy the tested artifacts. npm publication stays an
   owner release action.

The owner must select between 6A and 6B. Show a requested hybrid as one combined
candidate first. Never infer approval from a recommendation or green checks.
Identity changes outside the selected foundation go back to the owner.

## Official package and copy distributions

Create the publishable `@j3w1/ui` npm workspace package: modular ESM, typed
public APIs, separate class and registration exports, per-component imports, safe
repeated registration, semantic token CSS and documented styling extension
points. Native semantics, real forms, properties, attributes, slots and events
are the default vocabulary. Choose light or Shadow DOM per component from its
semantics, static content, composition and real interoperability.

Every inventory entry maps to an official consumable implementation. Deferred
entries get complete behavior contracts first. Patterns and developer views get
bounded APIs that fit their meaning. The form builder stays the existing bounded
model, not an application framework.

Each component or pattern has three integration routes:

| Mode | Required deliverable |
| --- | --- |
| Package | Exact install, import, registration, CSS, markup, event/property binding and framework example |
| Copy | All required markup, CSS, behavior, dependencies, notices and integration instructions in a standalone bundle |
| Mapping | Existing compact canonical contract and portability/deviation workflow for incompatible or native hosts |

Prefer package mode when compatible; copy mode is first-class. Multi-file
widgets include their transitive dependencies and are never called a
self-contained snippet. Reuse the maintained implementation and generators; do
not fork behavior for the site, recipes or framework examples. Validate multiple
instances and coexistence with host styles.

Add an implementation manifest to the deterministic machine exports: component
ID, canonical version, package and export identity, recipe path, framework
examples, variants and states, token dependencies. Keep run evidence in separate
artifacts with freshness identities. Show implementation, package, copyability,
showcase and verification as separate facts.

Add target framework and consumption mode to discovery indexes and task kits. A
small task gets only the selected implementations, their complete dependency
closure and the shared rules. Keep existing integration and lock formats
working; record official package use apart from custom mappings. Agents pin
one immutable revision and keep the required eligibility and decision
disclosures.

## Portal and documentation

A short design-system orientation page replaces the long homepage. It still
reads as a UI theme specification, with exact values, state rules and evidence.
The full reference moves to `/theme/reference/`, with tested migration of the
old anchors. Core routes: foundations, components, patterns, tokens, tools,
implement, agents, ports and releases. Essential and normative content is in the
first static HTML; ordinary pages load no catalogue-wide JS.

Every component page combines a live official implementation with anatomy,
tokens, states, variants, interaction and keyboard rules, accessibility,
evidence, responsive behavior, generated API tables and minimal runnable usage.
It offers package instructions, complete copy files, framework examples, machine
contract links, an agent-kit action and links to realistic showcase compositions.

Document installation, registration, per-component loading, font fallback,
density, attributes versus properties, custom events, native slots, forms,
validation, focus, lifecycle cleanup, allowed customization, browser limits,
troubleshooting, upgrades, pinning and migration. Code in the docs comes from
maintained examples run against the packed artifact in clean fixtures.

The command palette is an official component used by the portal: a compact,
square, floating Unix utility panel with one prompt, dense vertical rows, a
category column, the canonical selection and focus roles, and local
deterministic search. The later issue comment replaces the original full-width
top-bar direction.

## Full Vue showcase

Use Vue 3 JavaScript single-file components, Vite and Vue Router to consume the
framework-agnostic package. Do not build a parallel Vue-native component
library. All public code, content, assets and data are written independently.

- Analytics, CRM, commerce, academy and logistics dashboards.
- Product, order, customer, user and invoice list/detail/edit workflows.
- Email, chat, calendar and kanban layouts with bounded local actions.
- Profile/settings, a permissions demo, authentication/recovery examples,
  pricing/help and utility/error pages.
- Basic/advanced forms, validation recovery, wizards, uploads, charts, developer
  views, the bounded form builder and the complete component gallery.

Use deterministic synthetic data, resettable in-memory state and working local
interactions. Say which screens depend on a service. Give drag interactions a
keyboard alternative. The agreed breadth covers application categories;
it does not require every external reference route or real backend services.

## Acceptance and hosting

Prove install and copy into separate applications with no access to private
source paths. Test packed consumers in HTML, Vue, Astro and React. Cover basic
element copying, the full interactive lifecycle, composition dependency closure,
host-style coexistence, multiple instances, bounded task kits and pinned
upgrades. Keep scripted fixtures separate from real agent-run consumption
acceptance.

Complete the repository gates, package/copy/documentation checks, all-inventory
coverage, representative cross-browser flows, accessibility/input/lifecycle
checks and revision-aware evidence. Set payload budgets from measured builds.
Never claim a manual screen-reader or physical-device pass without its protocol.

GitHub Pages hosts the static portal and `/theme/demo/` by default, with hash
routing for the Vue application. If a proven Pages limit blocks the agreed
experience, deploy the demo to Vercel and link it from the portal. Hosting never
justifies cutting the agreed scope. After the visual-selection and quality gates,
check that deployed bytes match the tested artifacts.

## Implemented delivery surfaces and evidence

- `packages/ui/`: modular ESM classes and registration, native forms and
  lifecycle, generated API and token dependency metadata, complete copy
  distributions, and framework/mode task kits with the selected canonical
  contracts and shared rules.
- `site/src/pages/`: static portal, all 67 component pages, foundations,
  patterns, tools, implementation guide, agent-kit preparation and the complete
  reference. The packaged command palette loads its generated navigation index
  on first use and searches components, token values, canonical documents,
  decisions, tools, patterns, agent routes, ports and releases. Token values use
  the shared inline hex presentation; static section navigation is the fallback.
- `apps/demo/`: Vue 3 JavaScript SFCs with hash routing, five dashboard
  contexts, five record workflows, four productivity apps, forms, developer and
  utility screens, resettable synthetic data and the whole component gallery.
- `docs/ui-consumption.md` and the maintained framework sources: installation,
  binding, lifecycle, native form behavior, copy closure, pinning and migration.
- `npm run ui:consumers` and `npm run test:ui`: install a real tarball in
  isolated HTML/Vue/React/Astro apps, compile declarations and test three
  engines.
- `npm run ui:report` keeps sanitized artifact, fixture and protocol identities
  and the recorded environments. `npm run ui:publish-evidence` checks that report
  against the downloadable tarball before it publishes `verification/ui.json`.
- The specification evidence pipeline keeps the exact built specimen bytes. CI
  requires the package checks and the full site checks before Pages deployment.
  Failed runs stay evidence of failure; no manual pass is inferred.

The gallery axe protocol respects the documented decorative whitespace waiver in
`spec/components/code-editor.md`; real code text is still scanned. Native
validation tests move keyboard focus out of the invalid field before checking
pointer activation, because native validation UI can swallow a click. Payload
gates measure the initial static-import closure apart from lazy chunks; see
`docs/ui-architecture.md` for the measured budgets.
