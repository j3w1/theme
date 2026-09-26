---
id: decisions
title: Decision log
order: 90
summary: Numbered design and governance decisions. A token or rule is approved only through an accepted entry here.
---

Statuses: `proposed` (awaiting the owner), `accepted`, `rejected`, `superseded`.
A token moves from `proposed` to `approved` only by an `accepted` decision referenced
in its `$extensions["io.github.j3w1.theme"].approval.decision`. Agents may open
`proposed` entries; only the owner changes a status.

Each entry has a Decision and a Status line (status, date, who decided, and
what later entries changed), plus Why, Consequences and Alternatives where they
apply.

| # | Title | Status | Date | Decided by |
| --- | --- | --- | --- | --- |
| D-000 | Responsibility split: tokens, spec, ports, evidence | accepted | 2026-09-05 | owner (design package) |
| D-001 | Controlled three-hue extension for status, diagnostics and diffs | accepted | 2026-09-06 | owner |
| D-002 | v0.1.0 ships the full R1 component inventory | accepted | 2026-09-06 | owner |
| D-003 | Text-role corrections with new in-hue values | accepted | 2026-09-06 | owner |
| D-004 | Public repository; MIT code, CC BY 4.0 prose | accepted | 2026-09-06 | owner |
| D-005 | Default profile id is `default` | proposed | 2026-09-06 | — |
| D-006 | Focus-ring rule, including invalid + focus | proposed | 2026-09-06 | — |
| D-007 | `border.control` uses `#A3676B` | proposed | 2026-09-06 | — |
| D-008 | Fold site hairlines into `border.divider`; `surface.sunken`; unified overlay border | proposed | 2026-09-06 | — |
| D-009 | Density modes `compact` and `comfortable` as tokens | proposed | 2026-09-06 | — |
| D-010 | The site deploys from `main` | proposed | 2026-09-06 | — |
| D-011 | Reference screenshots are cropped before publication | proposed | 2026-09-06 | — |
| D-012 | Exports are committed and drift-checked | proposed | 2026-09-06 | — |
| D-013 | Consumption eligibility is separate from approval | proposed | 2026-09-07 | — |
| D-014 | Automatic inline literal color previews | proposed | 2026-09-07 | — |
| D-015 | Clarify component mappings exposed by consumption acceptance | proposed | 2026-09-07 | — |
| D-016 | Pinned release comparison report and historical rendering | proposed | 2026-09-08 | — |
| D-017 | Private framework parity evidence | proposed | 2026-09-08 | — |
| D-018 | Declared port capabilities and fresh import evidence | proposed | 2026-09-08 | — |
| D-019 | One-way namespaced Figma Variables bridge | proposed | 2026-09-08 | — |
| D-020 | Bounded local validation and recovery workflow | proposed | 2026-09-08 | — |
| D-021 | Local form composition with versioned data | proposed | 2026-09-08 | — |
| D-022 | Local visual selection before agent implementation distribution | proposed | 2026-09-08 | — |
| D-023 | True Black / Rose canonical foundation | accepted | 2026-09-08 | owner (explicit selection of candidate I) |
| D-024 | Distinguish links from body text and headings | accepted | 2026-09-08 | owner (explicit preview correction) |
| D-025 | Theme interactive controls throughout the portal and demo | accepted | 2026-09-09 | owner (explicit native-control replacement request) |
| D-026 | Primary action fill darkens off heritage ANSI 12 | accepted | 2026-09-11 | owner (explicit acceptance after visual review) |
| D-027 | Recede the interactive chrome | accepted | 2026-09-11 | owner (explicit acceptance after visual review) |
| D-028 | Merge gates and the deployment gate are different suites | accepted | 2026-09-11 | owner (explicit verification-split instruction) |
| D-029 | Readable terminal and code reds | accepted | 2026-09-26 | owner (explicit selection of values and release in planning) |
| D-030 | Hued syntax roles for opt-in code highlighting | accepted | 2026-09-26 | owner (explicit request for a more colourful Codex, selection of the extended hues) |
| D-031 | Select the checks a change needs; shard the deployment matrix | accepted | 2026-09-26 | owner (explicit CI renovation request, plan approval) |
| D-032 | Coral slot 6 and a fixed prompt background | accepted | 2026-09-26 | owner (explicit selection of coral and the PowerShell prompt look) |

## D-000 Responsibility split

**Decision.** Token files own literal values and aliases; the specification owns
meaning, permitted uses and constraints; port mappings own native keys; evidence
records own what was actually tested. README, the site and pictures summarise
them and never replace them.

**Consequences.** A disagreement between spec and tokens is a defect to fix, not
a choice. Images never override token values. Historical source is evidence of
origin, not an override of the adopted accessible design.

**Status.** accepted · 2026-09-05 · owner (design package `ARCHITECTURE.md`).

## D-001 Controlled three-hue extension

**Decision.** `default` adds three desaturated, warm-shifted hues: amber
`#C9973F` (warning, modified), green `#86A46F` (success, added), blue `#7E9EBB`
(info); dark tints `#1F1A0C`, `#0F1A0E`, `#0F141C`. They appear only in
`status`, `diagnostic` and `diff` (plus `code`, `terminal` and `chart` in
`extended`), never in `surface`, `text`, `border`, `interaction` or `action`. No
purple, cyan or magenta. Every status role also has a glyph, underline pattern
or border style. `default` syntax stays monochrome; `extended` stays `proposed`.

**Why.** Lightness alone cannot separate diagnostics, diffs and status (a
200-line diff cannot be scanned by glyph); the owner's PhpStorm scheme already
uses such hues.

**Consequences.** Contrast on canvas / surface / raised: amber 7.54 / 7.34 /
6.90, green 7.13 / 6.95 / 6.53, blue 7.08 / 6.90 / 6.48.

**Status.** accepted · 2026-09-06 · owner. Superseded in part by D-030 (opt-in
`code.hued.*`; `code.syntax.*` stays monochrome).

## D-002 v0.1.0 inventory

**Decision.** The first public release holds every `R1` inventory component
(about 47 across all nine families) plus four composed specimens (settings
panel, administrative form, filterable table, i3 window frame), each *specified*
and *demonstrated*. Ten core components are also *tested*: button, link,
text-field, select, checkbox, radio-group, tabs, dialog, menu, table.

**Consequences.** `R2` items and the form-builder specimen wait for v0.2.

**Status.** accepted · 2026-09-06 · owner.

## D-003 Text-role corrections

**Decision.** `text.subtle` = `#AD7175` (5.10 / 4.96 / 4.67) for metadata,
comments and line numbers. `text.disabled` = `#8A5559` (3.33 / 3.24 / 3.05;
exempt under WCAG 1.4.3, at least 3:1 by house policy). `#A3676B` stays as
`border.control`, `icon.decorative`, `status.neutral.fill` and `chart.series.4`
(non-text, at least 3:1); `#7D1310` only as `border.disabled`, `code.whitespace`
and minor grid lines, never text.

**Why.** `#A3676B` (the site's `--quiet`) measures 4.45:1 on `#0C0909` and
`#7D1310` (`--inactive`) 1.86:1, yet the site used `#7D1310` for line numbers;
its suggested `#A8403A` measures only 3.27:1.

**Consequences.** `heritage-ansi` keeps the original assignments, flagged
`$deprecated`.

**Status.** accepted · 2026-09-06 · owner.

## D-004 Visibility and licensing

**Decision.** The repository is public. MIT: code, tokens, schemas, scripts,
tests, site source, generated JSON/CSS exports. CC BY 4.0: specification prose,
specimens, generated Markdown exports. Screenshots under `references/`: all
rights reserved, reference only.

**Consequences.** Fonts, vendor template material and private business data are
never committed; CI scans for them. See `LICENSE.md`.

**Status.** accepted · 2026-09-06 · owner.

## D-005 Default profile id

**Decision.** The approved everyday composition is the profile `default`;
renaming it later is a MAJOR version change.

**Status.** proposed · 2026-09-06.

## D-006 Focus-ring rule

**Decision.** Controls and rows: `outline: 1px dashed
{color.interaction.focus.ring}` (`#E53935`), `outline-offset: -2px`. Focusable
containers (panes, windows, dialogs, cards): `outline: 2px solid
{color.interaction.focus.ring-container}` (`#FFA2A7`), `outline-offset: -3px`.
On any fill (selection, action, status) the ring takes the on-fill text colour;
on invalid + focus, where the 2px danger border is already red, it takes
`#FFA2A7` at `outline-offset: -4px`. `:focus:not(:focus-visible)` draws nothing;
forced-colors mode uses `Highlight`. Selection is a fill, focus a ring.

**Why.** `#E53935` on `#911410` measures 2.15:1.

**Status.** proposed · 2026-09-06. Clarified by D-015 (declared component ring
mappings on fills). Since D-027 a selected row (`#531310`, 3.38:1) takes the
ordinary ring.

## D-007 Control boundary colour

**Decision.** `border.control` = `#A3676B` (4.45 / 4.33 / 4.07).

**Why.** Control boundaries need 3:1 against their surface (WCAG 1.4.11);
`#531310` (1.39) and `#9E231F` (2.56) fail.

**Alternatives.** `#C81A1A` (3.42): too loud for every input at rest.

**Status.** proposed · 2026-09-06.

## D-008 Hairlines, sunken surface, overlay border

**Decision.** The site's six near-identical hairlines (`#290D0C`, `#24100F`,
`#321110`, `#38100F`, `#190B0B`, `#2B0E0D`) fold into `border.divider` =
`#2B0E0D`. `#0A0707` becomes `surface.sunken`. Every floating layer (dialog,
drawer, menu, popover, toast) takes a 1px `border.overlay` = `#E53935`.

**Consequences.** The dunst frame `#AE1914` survives only in `heritage-ansi`.

**Status.** proposed · 2026-09-06.

## D-009 Density modes

**Decision.** Density modes are tokens, set with `data-density` on any subtree.
`compact` matches the site: control 24px, row 28px, UI type 12/16, icon 16, list
gap 2. `comfortable`: control 32px, row 36px, UI type 13/18, icon 16, list gap
4.

**Consequences.** Both meet the 24×24 CSS-pixel target minimum; `compact` needs
4px between adjacent targets.

**Status.** proposed · 2026-09-06.

## D-010 Deployment source

**Decision.** The site deploys from `main` through GitHub Actions after the full
pipeline passes. The page header prints the version and build commit and links
to the latest tag. Consumers still pin tags or commits.

**Status.** proposed · 2026-09-06.

## D-011 Reference screenshots

**Decision.** Crop the title bar (or redact the name) before committing a
screenshot under `references/`, and disclose the redaction in its provenance
record. If the owner prefers, screenshots stay out of the repository, described
only in `references/catalogue.json`.

**Why.** The four PhpStorm screenshots show a private project name in the title
bar.

**Status.** proposed · 2026-09-06.

## D-012 Committed exports

**Decision.** `exports/`, `site/src/styles/tokens.generated.css`,
`schemas/json/` and the README marker blocks are generated and committed; `npm
run check` fails CI on drift or orphan files. No timestamps or commit hashes, so
two runs are byte-identical. `dist/` is never committed.

**Status.** proposed · 2026-09-06.

## D-013 Consumption eligibility is separate from approval

**Decision.** In an approved default profile, pending roles may be used at a
pinned revision with their pending decision IDs (dependencies included)
disclosed. Proposed profiles are preview-only and blocked for delivery; heritage
profiles are historical-only; deprecated or heritage roles cannot be newly
mapped in an approved profile, and no substitute is implied. Observed/approved
roles are usable within their documented scope; primitives are inspection-only.
Release version, profile status, role status, deprecation and eligibility are
separate facts; the generator emits the policy and eligibility metadata.

**Why.** Issue #4 found conflicting instructions to use and to prohibit pending
roles in the approved default profile.

**Consequences.** Governs consumption only: no pending value is approved, and
D-005 through D-012 are unchanged.

**Alternatives.** Block pending roles until individually approved.

**Status.** proposed · 2026-09-07 (formal log status remains owner-controlled).
Owner direction, 2026-09-07, in Phase 1 planning: "Use and report", and "Block
new use" for deprecated roles; implementation authorized.

## D-014 Automatic inline literal color previews

**Decision.** Every visible CSS hex literal on the spec page gets one generated
preview; the literal stays exact and is data, never inferred from a token or
screenshot. The preview is 16px with its theme-derived 1px boundary, circular at
rest; on CSS `:hover` it scales to 17.4px with radius zero (fast duration token
and ease-out on transform and border-radius; none under reduced motion). Alpha
shows over a checkerboard of theme tokens. Only this preview may use rounded
geometry, patterned gradient backgrounds and border-radius animation. Text,
copying, keyboard order and no-JS access stay intact. Syntax specimens `#f00`,
`#f008`, `#ff0000`, `#ff000080`, `#000000`, `#ffffff` (literal data, not roles)
also test copy fidelity and transparent, dark and light previews in the browser
suite.

**Why.** Issue #1 asks for circular previews and a transparency checkerboard,
against the square and no-gradient rules.

**Consequences.** Literal-data presentation only: no new palette, semantic role
or geometry rule.

**Status.** proposed · 2026-09-07 (formal log status remains owner-controlled).
Owner direction, 2026-09-07: the narrow exception explicitly approved,
implementation authorized.

### Follow the pointer hovering effect

Part of this exception only; the tooltip and focus contracts are unchanged.
Mouse and pen pointers open a non-interactive popup with the exact value; touch
and unknown pointers do not. CSS `:hover` alone drives the morph; neither uses
the `hover` or `any-hover` media features, which can report no hover despite
mouse input. The popup follows the pointer inside the circle at an 8px gap,
flips when necessary and stays within an 8px viewport gutter, bounded by the
viewport. It closes at once when the pointer leaves the circle, on an outside
press, Escape or loss of window focus, and after page or nested-container
scrolling unless the same circle is still under the last pointer position. It
cannot capture input or hold itself open and adds no keyboard stop; token tables
and the keyboard-accessible token inspector keep the persistent information and
links. Tracking has no animation or easing, even under reduced motion. Circles
and literal text stay visible without JavaScript.

## D-015 Clarify component mappings exposed by consumption acceptance

**Decision.** Keep current component appearance and all token values. Ordinary
confirmation uses the primary tone; destructive tone is for destructive actions,
whatever the confirmation's semantic role. A pressed primary button keeps
`color.action.primary.border`, secondary and tertiary use `color.border.active`,
destructive keeps its declared border; the generic metadata is corrected to
match. Controls keep their documented ring mappings (primary and
checked/selected fills: `color.interaction.focus.ring-container` where declared;
destructive fills: their on-fill text role). The global wording points to them,
keeping ring geometry, forced-colors behavior and every contrast floor.

**Why.** Phase 2's independently reviewed composed acceptance preserved these
three contradictions; Phase 3 controls must not present an arbitrary
interpretation as canonical.

**Consequences.** No profile or pending-token approval; historical acceptance
reports stay historical evidence.

**Alternatives.** Enforce the generic prose everywhere, or mark affected
workbench configurations unresolved.

**Status.** proposed · 2026-09-07. The owner directed application on 2026-09-07;
formal status remains owner-managed.

## D-016 Pinned release comparison report and historical rendering

**Decision.** A report (schema version 1) records both immutable revisions,
profile and input digests, separate semantic change categories, explicit
dependency evidence and unsupported historical inputs. Reports and historical
specimen renderings are build artifacts in `dist/releases/`; canonical exports
keep their contract. History is read from Git, never executed as a build or
imported as a module. The shared specimen renderer draws each side's maintained
markup and styles (documented renderer version, matched conditions): a
reconstructed reference, not evidence that an old site's JavaScript or an
external port ran. Browser captures are run evidence with environment and
artifact hashes; missing evidence stays not run. A rename needs an explicit
mapping naming both revisions; equal values do not establish one.

**Why.** Run metadata must stay out of deterministic exports, and missing
historical fields must not be read by today's rules.

**Consequences.** No design values, eligibility rules or verification statuses
change.

**Alternatives.** A raw file diff (no semantic categories) or running historical
applications (a wider trust boundary).

**Status.** proposed · 2026-09-08. Issue #2 authorizes derived release
diagnostics; formal status and all theme approvals remain owner-managed.

## D-017 Private framework parity evidence

**Decision.** An independently authored private harness takes an
operator-supplied licensed target and an explicit license review, copies only
declared template inputs into a new private fixture directory, uses synthetic
examples and records exact theme, template, framework, dependency and fixture
identities. The target and its application behavior stay outside its write scope; browser captures, copied
vendor inputs and detailed results stay private; missing prerequisites give
not-run output.

**Consequences.** A successful diagnostic run is not a verified port or a claim
of complete visual parity.

**Alternatives.** A public vendor copy (breaks the license boundary) or a
generic mock presented as template evidence.

**Status.** proposed · 2026-09-08. Issue #3 authorizes the harness; approval
statuses and license boundaries are unchanged.

## D-018 Declared port capabilities and fresh import evidence

**Decision.** Optional `capabilities.json` refines each mapped/unmapped role
into mapped, inherited, unsupported, out-of-scope or not-implemented, with a
surface and reason; legacy unmapped reasons stay unclassified, never guessed.
Import verification is separate from mapping state and declared status: verified
output needs a recorded real-import protocol bound to current target metadata,
canonical tokens, mappings, capabilities and artifact bytes. Relevant changes
make evidence stale; failed or missing checks cannot pass. One generated
catalogue feeds summaries, drill-downs and task kits; private parity records
never enter it automatically.

**Alternatives.** A hand-maintained support matrix, or a parse treated as an
import.

**Status.** proposed · 2026-09-08. Issue #14 authorizes a derived mapping
explorer; it creates no port, changes no host capability and approves no
profile.

## D-019 One-way namespaced Figma Variables bridge

**Decision.** An explicit pinned revision supplies colors and scalar
spacing/radius values, one way. Aliases keep their dependency structure;
dependency-only primitives are hidden from property pickers; unsupported types
and non-approved profiles are reported. One collection and one mode avoid
assuming paid mode capabilities. Dry-run is read-only, apply explicit; import
receipts identify owned IDs and their last observed values; conflicts and manual
edits stop an update or rollback. The bridge never stores ownership in
unsupported plugin data, overwrites unrelated variables or writes back to the
repository.

**Alternatives.** Manual duplicate maintenance, a paid-only REST workflow, or
flattening aliases/composites.

**Status.** proposed · 2026-09-08. Issue #15 authorizes this bounded adapter;
approval and eligibility follow the canonical source.

## D-020 Bounded local validation and recovery workflow

**Decision.** One executable pattern: editing, invalid, review, busy, success.
Validation runs on explicit submission, keeps values and shows linked errors;
typing does not rewrite live announcements. Review can return to a field;
confirm enters busy, a separate local simulation-completion event enters
success, and no request is made. The workstation example's reserved name and
hostname are local fixture conflicts, not business policy. The contract pins
constituent component content digests and reports automated evidence apart from
manual screen-reader acceptance.

**Alternatives.** A color-only invalid snapshot, validation on every keystroke,
or a submit click treated as a successful save.

**Status.** proposed · 2026-09-08. Issue #16 authorizes one pattern from
existing admin-form, field, alert and button rules, without new palette roles.

## D-021 Local form composition with versioned data

**Decision.** Five canonical field kinds can be added, edited, removed and
reordered with buttons. Definitions, preview values and validation state are
separate. JSON imports have closed fields, bounded size/counts and unique stable
IDs; a failed import changes nothing. Content identity pins the supplying theme
and component contracts; downloads hold definitions, never entered values.
Rendering and validation reuse D-020.

**Consequences.** A draft reference component, not a backend platform or native
port.

**Alternatives.** Arbitrary HTML/schema execution, a conditional workflow
engine, or a second field implementation.

**Status.** proposed · 2026-09-08. Issue #19 authorizes the deferred
form-builder demonstration.

## D-022 Local visual selection before agent implementation distribution

**Decision.** Before canonicalization a local harness compares exactly three
explicit token overlays with Current, using shared specimen rendering and an
original Vue composition. Overlays, reports and review builds stay ignored,
never public profiles or delivery artifacts. The existing alias resolver and
unrounded contrast engine judge candidates without changing canonical values,
historical ANSI slots or waivers. Numbers and browser evidence approve nothing:
the owner selects a concrete candidate before foundation freeze, mass
productization or deployment. See `docs/phase6-visual-review.md`.

**Why.** Agents need installable or copyable components and compositions with
complete dependencies and pinned contracts, shared by the future package,
documentation portal and Vue application.

**Alternatives.** Productizing the old palette first, unapproved preview
profiles, or appearance-only snippets.

**Status.** proposed · 2026-09-08. Issue #37 and the owner's implementation
instruction authorize three local candidates; design approval remains
owner-managed. The selection is D-023.

## D-023 True Black / Rose canonical foundation

**Decision.** Seven surface assignments change: canvas, sunken, input, code and
terminal use the existing pure black primitive; chrome uses `#090707`; default
panels use `#100c0c`. The two new values become `color.primitive.ink.14` and
`color.primitive.ink.28`, keeping luminance order and all historical primitives.
Everything else stays exactly as reviewed (rose/white foreground, red actions,
focus, borders, selections, status and chart roles); raised/overlay stay
`#241010`, alternate chrome `#1c0a09`. The historical profile keeps its previous
surfaces.

**Why.** The owner explicitly selected the reviewed candidate I: "use the True
Black / Rose theme and make it permanent for j3w1/theme".

**Consequences.** Approves these surfaces only, not other pending decisions, new
colors or accessibility waivers. The rejected A/B/C, revised D/E/F and final
G/H/I reviews are historical local evidence, not public profiles. Foundation for
the Phase 6 package, copy distributions, static portal and Vue showcase; ships
in 1.0.0 under the major-version rule, existing pins immutable.

**Status.** accepted · 2026-09-08 · owner, who also authorized the remaining
Phase 6 implementation. Superseded in part only: D-024 (`text.link`), D-026
(`action.primary.bg`), D-027 (`surface.raised`, `interaction.selection.bg`,
`text.placeholder`).

## D-024 Distinguish links from body text and headings

**Decision.** `color.text.link` maps to the existing strong red `#f73f35`,
keeping the persistent red underline and near-white hover text on the strong
dark-red hover fill. Visited links keep color and underline; current-page and
selected navigation keep their on-fill roles; body and heading colors are
unchanged.

**Why.** In the implementation preview the owner asked for links more
distinguishable from normal text, using different colors.

**Consequences.** No new primitive, status hue, contrast exception or focus
rule; the historical profile keeps the old link; ships in the same unreleased
1.0.0.

**Alternatives.** Bright rose (the heading color) or blue/purple (an unrelated
hue).

**Status.** accepted · 2026-09-08 · owner, correcting D-023 for links only.
D-027 later moves link hover to `interaction.hover.bg`.

## D-025 Theme interactive controls throughout the portal and demo

**Decision.** The maintained select renders its single-choice popup and
multiple-choice list in theme-owned DOM with the existing selection, surface,
text, border and focus roles; the native select remains the form-value and
constraint source and the no-JavaScript fallback. It follows the select-only
combobox and multiple listbox keyboard patterns, keeps labels, disabled
options/fieldsets, native input/change events, defaults and form reset, and
documents its tested scope. The same enhancement serves existing application
controls, the portal, the Vue demo, consumption docs and copy closures; input,
button, checkbox, radio, range and file chrome is themed too. Date inputs get a
theme-owned text editor and calendar, time inputs text entry and theme-owned
step buttons; native inputs keep constraints and values. Browser-owned system dialogs and
no-JavaScript fallbacks stay native, without platform hacks; native ports keep
their mappings. The command field fills its dialog width below its label.

**Why.** Seeing native blue selections in the work board and agent-kit picker,
the owner explicitly instructed: "replace mostly all native components like
`<select>` we must use all j3w1 themed", and asked for a properly proportioned
command-search field.

**Consequences.** Supersedes the select spec's ban on replacing the host popup
(web implementations) and the date/time specs' host-popup descriptions (enhanced
web implementations). Ships in 1.1.0; 1.0.0 pins stay immutable. No new hues,
focus rules, accessibility waivers or license changes.

**Alternatives.** Advisory option CSS (the blue selection stays) or one-off
dropdowns (duplicated behavior).

**Status.** accepted · 2026-09-09 · owner.

## D-026 Primary action fill darkens off heritage ANSI 12

**Decision.** `color.action.primary.bg` aliases the existing
`color.primitive.red.200` (`#7d1310`) instead of `color.primitive.red.300`; no
colour is minted.

**Why.** The owner asked for a slightly darker fill on primary actions such as
the portal's `Explore components` button. `color.primitive.red.300` is also
`color.primitive.ansi.12` and `color.terminal.ansi.12`, and `schemas/roles.mjs`
pins every `color.primitive.ansi.<i>` to its heritage value, so it cannot darken
without repainting the terminal's bright red.

**Consequences.** Label contrast rises from 8.17:1 to 9.28:1, the ring over the
fill from 4.90:1 to 5.57:1. Pressed `#630f0d` stays below, hover `#911410`
above. The decorative waiver `primary fill against the panel` goes from 2.07:1
to 1.83:1 (the label identifies the button); no waiver is added or widened.

**Alternatives.** A new primitive at the exact value, or a darker portal button
only (a value outside `tokens/`, against the confirmation-only rule in
`theme.json`).

**Status.** accepted · 2026-09-11 · owner (accepted as implemented after
review). Supersedes D-023 only for `action.primary.bg` (`#871f19`, kept "exactly
as reviewed" under its red actions clause).

## D-027 Recede the interactive chrome

**Decision.** Four roles move to existing palette values; no colour is minted.
`surface.raised`: `ink.30` (`#160b0b`), was `ink.52`; an open list reads as
depth, distinct from `surface.default` (`#100c0c`). `interaction.selection.bg`:
`red.100` (`#531310`), was `red.350`; text on it rises from 7.92:1 to 12.47:1.
`text.placeholder`: `rose.350` (`#a3676b`), was `rose.600`; 4.71:1 on
`surface.input`, over the 4.5:1 floor without a waiver. Links hover on
`interaction.hover.bg`, not `interaction.hover.bg-strong`, which menu items
keep.

**Why.** The owner found the open list, selected row, placeholder and link hover
louder than the content they sit against.

**Consequences.** The fill never carried selection (2.00:1 at `#911410` against
the raised surface, under the 3:1 non-text minimum); the unchanged 2px
`border.selected-indicator` and check glyph do, per `spec/foundations.md`. The
report still has 954 pairs, 17 waived, none failing; no waiver is added or
widened. The ring measures 3.38:1 on `#531310` (2.15:1 on `#911410` was D-006's
reason to recolour), so a selected row takes the ordinary 1px dashed ring, not
the 2px solid container ring; `action.primary.bg` (2.52:1) and
`status.danger.fill` (1.13:1) keep the recoloured ring. `spec/foundations.md`
was corrected (its stale 2.15:1 reason); D-006 stays as written. `tests/foundation-selection.test.js`
guards the set.

**Alternatives.** Darken only the pointed-at components, or add intermediate
primitives.

**Status.** accepted · 2026-09-11 · owner (accepted as implemented after
review). Supersedes D-023 only for `surface.raised` (`#241010`),
`interaction.selection.bg` (`#911410`) and `text.placeholder` (`#bd787d`).

## D-028 Merge gates and the deployment gate are different suites

**Decision.** The full browser and packed-consumer matrix gates deployment, not
merging; it runs on `main` before `deploy` and on demand through the workflow
dispatch. A subset never writes evidence: it uses the plain list reporter,
because the evidence reporter would mark unselected tests not run and publish a
matrix that only looked complete. Packed consumers move with the browser suite,
which republishes their evidence against the deployed package;
`scripts/ui-verification-report.mjs` requires the complete protocol on all three
engines. No mandatory local gate: `npm run test:all` is recommended, never
verified; the practice is recorded in `AGENTS.md`.

**Why.** Accepting D-026 and D-027 cost 29.5 minutes of CI before merge (sources
0.6 minutes, build 0.7, packed consumers 3.3, browser matrix 24.9: 84% of the
wait), pure latency on a public repository. A browser failure stops publication,
not a correct merge; a local receipt proves only that something wrote it.

**Consequences.** As first recorded, pull requests merged on `validate`, `build`
and a new `smoke` job (desktop project; page, portal, button and text-field
specs; plain list reporter): the built site loads under its base path, renders
from the tokens and takes a keyboard. `smoke` is never a coverage claim.

**Alternatives.** Sharding before merge (about six minutes, bounded by the
largest spec file, partial evidence files) or consumers on the merge path (three
more minutes).

**Status.** accepted · 2026-09-11 · owner: merges gate on a few minutes of
checks, the full matrix gates deployment, a local full run stays recommended.
Superseded in part by D-031 (path-selected pull-request checks, a sharded
deployment matrix with one evidence report, `release-gate` as the only required
check); the rules above still hold.

## D-029 Readable terminal and code reds

**Decision.** `default` carries a readable heritage sixteen: each slot below the
text floor keeps its hue and saturation with its HSL lightness raised, in the
heritage light-to-dark order. Slot 8 (bright black) stays the deliberately dim
tier at about 3:1, the dark-red decorative and background slot.

| slot | heritage | default profile | contrast on `#0c0909` |
| --- | --- | --- | --- |
| 1 | `#c81a1a` | `#e84b4b` | 3.42 → 5.23 |
| 4 | `#8c1212` | `#e53131` | 2.09 → 4.55 |
| 6 | `#9e474a` | `#bb696c` | 3.26 → 5.05 |
| 8 | `#7d1310` | `#b71c17` | 1.86 → 3.01 (dim tier) |
| 9 | `#ab1612` | `#ea3833` | 2.70 → 4.83 |
| 10 | `#ad2721` | `#dc4f49` | 2.92 → 4.97 |
| 12 | `#871f19` | `#db433a` | 2.12 → 4.61 |
| 13 | `#e82132` | `#ed5360` | 4.43 → 5.67 |
| 14 | `#e0292f` | `#e6565a` | 4.28 → 5.52 |
| 15 | `#a3676b` | `#b17e81` | 4.45 → 5.83 |

Slots 0, 2, 3, 5, 7 and 11 already passed. New values live in
`color.primitive.ansi-readable.*`; `color.primitive.ansi.*` keeps the heritage
values byte for byte, and `heritage-ansi` pins changed roles back to them.
Syntax reds lift slightly: `code.syntax.keyword` and `tag` `#f73f35` → `#f7463c`
(`color.primitive.red.860`), `property`, `heading` and `invalid` `#e53935` →
`#e95551` (`color.primitive.red.810`): 5.56:1 on the code background, 4.52 and
4.51 in an editor selection (were 4.38 and 3.81). Interface reds are unchanged.
New role `color.terminal.prompt-text` colours the prompt's path segment: the
terminal background in `default` (4.55:1 on slot 4), the historical light
selection text in `heritage-ansi`.

**Why.** In Orca, Claude Code and Codex the owner found the reds right but too
dim: Claude Code's inline code such as `scriptblock` uses slot 12 (`#871f19`,
2.12:1), code-block keywords and Codex git branches slot 4 (`#8c1212`, 2.09:1).
Ten of the sixteen slots failed the 4.5:1 text floor, and programs, not the
theme, pick the slot.

**Consequences.** Terminal ports regenerate; CE Devbox's shell palette and the
Agnoster prompt's directory text follow in their own repositories.
`heritage-ansi` stays the exact historical record.

**Alternatives.** All rejected: the heritage slots (the owner: unreadable), the
`extended` palette (the owner keeps the red and rose families), a gentle lift
leaving slots 4 and 12 near 3:1, an OKLCH lift (gamut clipping drifts toward
raspberry).

**Status.** accepted · 2026-09-26 · owner, who chose the values, asked for the
change and approved this entry by selecting them. Superseded in part by D-032:
slot 6 is coral `#ff7a66`, not `#bb696c`; the prompt gets
`color.terminal.prompt-bg` (heritage `#8c1212`) with `#ffa2a7` text in
`default`.

## D-030 Hued syntax roles for opt-in code highlighting

**Decision.** `default` gains opt-in `color.code.hued.*` roles with the
`extended` code hues: strings green `#86a46f`; numbers, constants, functions,
attributes and escapes amber `#c9973f`; types and properties blue `#7e9ebb`;
operators bright rose `#ffa2a7`. Keywords, tags, comments, variables and
punctuation keep `code.syntax`. Every hued role reaches 7.08:1 or more on the
code background (operators 10.37:1) and 5.74:1 or more in an editor selection.

**Why.** The owner found Codex's code "too boring and single-coloured"; D-001
allowed code hues only in the proposed `extended` overlay, which is blocked for
delivery.

**Consequences.** The reference editor and other consumers keep `code.syntax.*`;
a host opts in by mapping `code.hued.*`, as the terminal kit's Codex theme does
once pinned to this release. This extends D-001's code-group allowance to these
roles; `extended` stays proposed.

**Alternatives.** Keep Codex monochrome (rejected by the owner), approve all of
`extended` (it reassigns terminal slots too), or replace `code.syntax.*`.

**Status.** accepted · 2026-09-26 · owner, who chose the extended hues.

## D-031 Select the checks a change needs; shard the deployment matrix

**Decision.** CI is `select` → checks → `release-gate`.

- `select` reads the changed paths and `scripts/ci/proofs.json`; a path gets
  cheaper only when a rule claims it. Unclaimed paths and control files
  (workflows, the selector and registry, `package.json`, the lockfile, the
  Playwright configs) run every check: a broad rule is a floor, never a verdict.
  On a pull request the base commit's control list also applies, so a change
  cannot make itself cheaper; review protects the selector. A file a browser
  spec imports runs that spec and counts as a site change.
- Unit tests and the build run in parallel. A pull request runs only the
  selected checks; browser subsets use the plain list reporter and write no
  evidence (D-028).
- A push to `main` that changes the site runs the whole matrix: browser projects
  split into jobs (desktop in four parts; projects read from the Playwright
  config) with blob reports merged once into the evidence reporter, and packed
  consumers in parallel. The merge needs every shard passed and reported; a
  check refuses evidence missing any configured test in any project. Then the
  verification report and deployment; no site change, no deployment. Changed
  paths count from the last commit that reached Pages, so a failed deploy is
  counted again.
- `release-gate`, the only required check, recomputes the plan from Git with the
  same code, refuses a mismatch, and checks each job ran exactly as planned and
  passed.
- `fullyParallel`, two workers per CI job, zero retries. The page axe scan is
  two tests (colour contrast; every other rule) from a tag-based run, together
  exactly the tagged rules. Only `playwright test` with nothing narrowing or
  listing it, or the merge of every shard, writes evidence; the counting check
  runs no reporter and proves the evidence file unchanged.

**Why.** `main` ran every check whatever changed: a terminal-kit-only change,
which the site never reads, took 63 minutes to deploy; the browser suite ran on
one worker for 24.7 minutes (one axe scan 3.6 minutes); `npm test` spent 139 of
its 141 seconds in terminal-kit suites.

**Consequences.** D-028's objection to sharding (partial evidence files) no
longer applies: shards write blob reports and one merge writes one report. A
change needing more cannot merge on `validate`, `build` and `smoke` alone.

**Alternatives.** A self-hosted runner as on theselfish.one (fork pull requests
could run code on it), reusing pull-request evidence on `main` (not possible
today: the build stamps the commit), Playwright's internal shard weights (not
public).

**Status.** accepted · 2026-09-26 · owner, who found thirty-minute runs on
`main` unacceptable and asked for classified checks modelled on theselfish.one.
Supersedes D-028 in part.

## D-032 Coral slot 6 and a fixed prompt background

**Decision.**

- Slot 6 is coral `#ff7a66` (`color.primitive.coral.700`, 7.77:1 on the terminal
  background): warm and vivid, apart from the rose text, without taking amber's
  code role.
- Dim text is not fixed in the slots: emulators mix dim colours halfway into the
  background, so dimmed coral is about 2.7:1. A dim-only host setting may help;
  brightening slot 6 to compensate is ruled out.
- New role `color.terminal.prompt-bg`, the prompt's path-segment background, is
  heritage `#8c1212` (`color.primitive.ansi.4`) in every profile.
  `color.terminal.prompt-text` is bright rose `#ffa2a7` in `default` (4.97:1)
  and the proposed `extended`, and `#f4eeee` in `heritage-ansi` (8.28:1).
  Prompts set both as 24-bit colours, whatever the slots carry.
- Hosts that set the palette (Orca, Ghostty, Warp, CE Devbox's shell palette)
  all use the same one; the prompt is the one deliberate heritage-style
  exception.

**Why.** Claude Code highlights fenced code with fixed ANSI slots: PowerShell
cmdlets such as `Invoke-RestMethod` took slot 6 (`#bb696c`, nearly the hue of
the rose text `#e99499`), and types such as `[scriptblock]` slot 6 dimmed
(2.07:1). Agnoster's directory segment sits on slot 4, which D-029 made
`#e53131`, so its text (slot 7, `#ffa2a7`) fell to 2.28:1 in Orca; the owner's
PowerShell, on the old palette, shows `#ffa2a7` on `#8c1212` (4.97:1), the look
to keep.

**Consequences.** Terminal ports regenerate. CE Devbox maps Agnoster's directory
and virtualenv segments to the prompt roles in its own repository.
`heritage-ansi` values are unchanged; it gains `prompt-bg` at its slot-4 value.

**Alternatives.** Peach `#ffab91`, blush `#ffc2c5` or amber `#e0a84a` for slot
6; dark text on the bright slot 4, as D-029 first proposed (rejected by the
owner after seeing it); the heritage palette in SSH shells (rejected: palettes
should match across hosts).

**Status.** accepted · 2026-09-26 · owner, who saw both problems in real use and
chose the values. Supersedes D-029 in part.
