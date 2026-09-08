# Phase 6 delivery contract and continuation

This records the owner-directed program scope and implementation. The owner
selected True Black / Rose (candidate I); D-023 records that authorization.
All 67 inventory entries now have canonical contracts, official implementations,
typed APIs and complete copy distributions. The static portal and full Vue
showcase are implemented. Acceptance comes from the separate execution records
for the exact artifact and protocol; this document does not self-accept a release.

During the implementation preview, the owner requested red graphs, distinct
table column-header/body colors, and stronger title/subtitle and navigation-group
hierarchy. These use existing approved roles: red `color.chart.series-2`, bright
rose column headers, regular rose body values, near-white page titles, bright
section/group headings and muted supporting text. They do not introduce colors
or alter the retained True Black / Rose foundation. The subsequent owner
request for a separate link color is recorded in D-024: strong red links with
persistent underlines and near-white hover text.

The selected foundation passed source validation, generation and drift checks,
105 source tests, the static build, nine distribution tests, and the configured
browser suite (204 passed, 124 intentionally skipped). Verification-report
generation preserved all 1,866 specimen files; its source checks and browser
checks passed (six browser passes, three intentional skips). This is automated
foundation evidence, not a claim of package or manual accessibility acceptance.

## Primary success criterion

An agent building another application can discover, select, install or copy,
incorporate and verify j3w1 elements, components and compositions using pinned
artifacts. It does not scrape page DOM, infer values from screenshots, reconstruct
missing behavior or guess which CSS/dependencies make a snippet work.

Canonical design meaning stays in `tokens/` and `spec/`. The package implements
that meaning. Copy bundles derive from the maintained implementation. The static
portal and the Vue application consume it. None becomes a second specification.

## Gate order

1. **6A:** Current + exactly three local candidates; matched interfaces, state
   board, numeric report, actual browser evidence and owner selection.
2. **6B:** Canonicalize the selected foundation through tokens and spec, record
   owner decision provenance, preserve history, regenerate and validate exports.
3. **6C:** Productize all 67 baseline inventory entries, including R2/L entries;
   generate package, standalone distributions and machine implementation mapping.
4. **6D:** Build the multi-page portal and complete Vue showcase with consumption
   documentation, live implementation examples and agent kit entry points.
5. **6E:** Verify external consumers, publish evidence, prepare tarballs and
   migration documentation, then deploy tested artifacts. npm publication remains
   an owner release action.

Owner selection is required between 6A and 6B. Requested hybrids are shown as one
consolidated candidate before selection. Do not infer approval from a comparison
recommendation or green automated checks. Identity changes outside the selected
foundation return to the owner.

## Official package and copy distributions

Create the publishable `@j3w1/ui` npm workspace package with modular ESM and typed
public APIs. Provide separate class and registration exports, per-component
imports, safe repeated registration, semantic token CSS and documented styling
extension points. Native semantics, real forms, properties, attributes, slots
and events are the default vocabulary. Choose light/Shadow DOM per component
based on semantics, static content, composition and actual interoperability.

Every inventory entry must map to an official consumable implementation. Deferred
entries get complete canonical behavior contracts before implementation. Patterns
and developer views receive bounded consumable APIs appropriate to their meaning.
The form builder remains the existing bounded model, not an application framework.

Each component or pattern has three integration routes:

| Mode | Required deliverable |
| --- | --- |
| Package | Exact install, import, registration, CSS, markup, event/property binding and framework example |
| Copy | All required markup, CSS, behavior, dependencies, notices and integration instructions in a standalone bundle |
| Mapping | Existing compact canonical contract and portability/deviation workflow for incompatible or native hosts |

Package mode is preferred when compatible. Copy mode is first-class. Multi-file
widgets must include their transitive dependencies rather than claim to be a
self-contained snippet. Reuse maintained package implementation and generators;
do not fork behavior for site, recipes and framework examples. Validate multiple
instances and coexistence with host styles.

Extend deterministic machine exports with an implementation manifest linking
component ID, canonical version, package/export identity, recipe path, framework
examples, variants/states and token dependencies. Keep actual run evidence in
separate artifacts with freshness identities. Expose implementation, package,
copyability, showcase and verification as distinct facts.

Extend discovery indexes and task kits for target framework and consumption mode.
A small task receives only selected implementations and their complete dependency
closure plus shared rules. Maintain existing integration/lock compatibility;
record official package consumption distinctly from custom mappings. Agents pin
one immutable revision and retain required eligibility/decision disclosures.

## Portal and documentation

The existing long homepage is replaced by a concise design-system orientation
page. It remains visibly a UI theme specification, with rigorous values, state
rules and evidence. The full reference moves to `/theme/reference/` with tested
legacy-anchor migration. Core routes are foundations, components, patterns,
tokens, tools, implement, agents, ports and releases. Keep essential/normative
content in initial static HTML. Avoid catalogue-wide JS on ordinary pages.

Every component page combines a live official implementation with anatomy,
tokens, states, variants, interaction/keyboard rules, accessibility, evidence,
responsive behavior, generated API tables and minimal runnable usage. It offers
package instructions, complete copy files, framework examples, machine contract
links, an agent-kit action and links to realistic showcase compositions.

Document installation, registration, per-component loading, font fallback,
density, attributes versus properties, custom events, native slots, forms,
validation, focus, lifecycle cleanup, allowed customization, browser limitations,
troubleshooting, upgrades, pinning and migration. Code shown in docs must come
from maintained examples exercised against the packed artifact in clean fixtures.

The command palette is an official component used by the portal: compact square
floating Unix utility panel, one prompt, dense vertical rows/category column,
canonical selection/focus roles and local deterministic search. The later issue
comment supersedes the original full-width top-bar direction.

## Full Vue showcase

Use Vue 3 JavaScript single-file components, Vite and Vue Router to consume the
framework-agnostic package. Do not establish a parallel Vue-native component
library. Public code, content, assets and data are independently authored.

- Analytics, CRM, commerce, academy and logistics dashboard compositions.
- Product, order, customer, user and invoice list/detail/edit workflows.
- Email, chat, calendar and kanban layouts with bounded local actions.
- Profile/settings, permissions demonstration, authentication/recovery examples,
  pricing/help and utility/error pages.
- Basic/advanced forms, validation recovery, wizards, uploads, charts, developer
  views, the bounded form builder and complete component gallery.

Use deterministic synthetic data, resettable in-memory state and working local
interactions. Disclose demonstration limits for service-dependent screens.
Use keyboard alternatives for drag interactions. The agreed breadth covers
application categories, not a requirement to duplicate every external reference
route or implement real backend services.

## Acceptance and hosting

Prove installation and copying into separate applications with no private source
path access. Test packed consumers in HTML, Vue, Astro and React. Cover basic
element copying, full interactive lifecycle, composition dependency closure,
host-style coexistence, multiple instances, bounded task kits and pinned upgrades.
Distinguish scripted fixtures from actual agent-run consumption acceptance.

Complete the repository gates, package/copy/documentation checks, all-inventory
coverage, cross-browser representative flows, accessibility/input/lifecycle
checks and revision-aware evidence. Define payload budgets from measured builds.
Do not claim a manual screen-reader or physical-device pass without its protocol.

GitHub Pages is the default for the static portal and `/theme/demo/`, using hash
routing for the Vue application. If a demonstrated Pages limitation prevents the
agreed experience, deploy the demo to Vercel and link it from the portal. Hosting
does not justify reducing the agreed feature scope. Verify deployed bytes against
the tested artifacts after the visual-selection and quality gates.

## Implemented delivery surfaces and evidence

- `packages/ui/`: modular ESM classes and registration, native forms/lifecycle,
  generated API and token dependency metadata, complete copy distributions and
  framework/mode task kits with selected canonical contracts and shared rules.
- `site/src/pages/`: static portal, all 67 component pages, foundations, patterns,
  tools, implementation guide, agent kit preparation and complete reference.
- `apps/demo/`: Vue 3 JavaScript SFCs with hash routing, five dashboard contexts,
  five record workflows, four productivity apps, forms, developer and utility
  screens, resettable synthetic data, and the entire component gallery.
- `docs/ui-consumption.md` and maintained framework sources: installation,
  binding, lifecycle, native form behavior, copy closure, pinning and migration.
- `npm run ui:consumers` and `npm run test:ui`: install an actual tarball in
  isolated HTML/Vue/React/Astro apps, compile declarations and test three engines.
- `npm run ui:report`: retain sanitized artifact/fixture/protocol identities and
  recorded environments. `npm run ui:publish-evidence` verifies that report
  against the downloadable tarball before publishing `verification/ui.json`.
- The existing specification evidence pipeline retains exact built specimen
  bytes. CI requires package checks as well as the full site checks before Pages
  deployment. Failed runs remain evidence of failure; no manual pass is inferred.

The gallery axe protocol respects the already documented decorative whitespace
waiver in `spec/components/code-editor.md`; real code text remains scanned.
Native validation tests move keyboard focus out of the invalid field before
checking pointer activation, because native validation UI can consume a click.
Payload gates measure initial static-import closure separately from lazy chunks;
see `docs/ui-architecture.md` for the measured budgets.
