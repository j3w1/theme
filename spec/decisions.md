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
| D-015 | Clarify component mappings exposed by consumption acceptance | proposed | 2026-09-07 | — |
| D-016 | Pinned release comparison report and historical rendering | proposed | 2026-09-08 | — |

## D-000 Responsibility split

Status: accepted · 2026-09-05 (adopted from the design package `ARCHITECTURE.md`).

**Decision.** Token files own literal values and aliases. The specification owns
meaning, permitted uses and constraints. Port mappings own native keys. Evidence
records own what was actually tested. README, the site, and pictures summarise
these authorities and never replace them. A disagreement between spec and tokens
is a defect to resolve, not permission to choose the convenient answer. Images
never override token values. Historical source is evidence of origin, not an
override of the adopted accessible design.

## D-001 Controlled three-hue extension

Status: accepted · 2026-09-06.

**Context.** The observed identity is monochrome red/rose. Diagnostics, diffs and
status information need differentiation that lightness alone cannot give (a
200-line diff cannot be scanned by glyph). The owner's own PhpStorm scheme already
uses conventional hues for these surfaces.

**Decision.** The `default` profile adds exactly three hues, desaturated and
warm-shifted: amber `#C9973F` (warning, modified), green `#86A46F` (success,
added), blue `#7E9EBB` (info), with dark tints `#1F1A0C`, `#0F1A0E`, `#0F141C`.
They are permitted only in the `status`, `diagnostic`, `diff` and (in the
`extended` overlay) `code`, `terminal` and `chart` groups. They are forbidden in
`surface`, `text`, `border`, `interaction` and `action`. Purple, cyan and magenta
are not added. Every status role also carries a mandatory non-colour channel
(glyph, underline pattern or border style). Syntax highlighting in `default`
stays monochrome; the `extended` overlay profile remains `proposed`.

**Consequences.** Measured contrast on canvas / surface / raised: amber
7.54 / 7.34 / 6.90, green 7.13 / 6.95 / 6.53, blue 7.08 / 6.90 / 6.48.

## D-002 v0.1.0 inventory

Status: accepted · 2026-09-06.

**Decision.** The first public release contains every component marked `R1` in
the coverage inventory (about 47 across all nine families) plus four composed
specimens (settings panel, administrative form, filterable table, i3 window
frame), each *specified* and *demonstrated*; ten core components are also
*tested* (button, link, text-field, select, checkbox, radio-group, tabs, dialog,
menu, table). `R2` items and the form-builder specimen are deferred to v0.2.

## D-003 Text-role corrections

Status: accepted · 2026-09-06.

**Context.** `#A3676B` (the site's `--quiet`) measures 4.45:1 on `#0C0909` and
`#7D1310` (`--inactive`) 1.86:1; the site already restricts them but still uses
`#7D1310` for line numbers. The site's suggested replacement `#A8403A` measures
only 3.27:1.

**Decision.** `text.subtle` = `#AD7175` (5.10 / 4.96 / 4.67) for metadata,
comments and line numbers. `text.disabled` = `#8A5559` (3.33 / 3.24 / 3.05;
exempt under WCAG 1.4.3, at least 3:1 by house policy). `#A3676B` remains in
service as `border.control`, `icon.decorative`, `status.neutral.fill` and
`chart.series.4` (non-text, at least 3:1). `#7D1310` remains only as
`border.disabled`, `code.whitespace` and minor grid lines, never as text. The
`heritage-ansi` profile keeps the original assignments flagged `$deprecated`.

## D-004 Visibility and licensing

Status: accepted · 2026-09-06.

**Decision.** The repository is public. Code, tokens, schemas, scripts, tests,
site source and generated JSON/CSS exports are MIT. Specification prose,
specimens and generated Markdown exports are CC BY 4.0. Screenshots under
`references/` are all rights reserved, reference only. No fonts, no vendor
template material, no private business data are ever committed; CI scans for
them. See `LICENSE.md`.

## D-005 Default profile id

Status: proposed.

**Decision.** The approved everyday composition is the profile `default`. A
later rename would be a MAJOR version change.

## D-006 Focus-ring rule

Status: proposed.

**Decision.** Controls and rows: `outline: 1px dashed {color.interaction.focus.ring}`
(`#E53935`) with `outline-offset: -2px`. Focusable containers (panes, windows,
dialogs, cards): `outline: 2px solid {color.interaction.focus.ring-container}`
(`#FFA2A7`) with `outline-offset: -3px`. On any filled surface (selection,
action fills, status fills) the ring takes that surface's on-fill text colour,
because `#E53935` on `#911410` measures 2.15:1. For invalid + focus, where the
2px danger border is already red, the ring switches to the container colour
`#FFA2A7` at `outline-offset: -4px`. `:focus:not(:focus-visible)` draws nothing.
In forced-colors mode the ring uses `Highlight`. Selection is always a fill and
focus is always a ring; neither borrows the other's form.

**Current clarification (D-015).** The owner-directed component mappings
below clarify the generic on-fill wording above. Primary buttons and checked
controls retain their explicitly declared container-colour ring; destructive
fills retain their declared on-fill text ring. Geometry and contrast floors
are unchanged.

## D-007 Control boundary colour

Status: proposed.

**Decision.** Form-control boundaries must reach 3:1 against their surface
(WCAG 1.4.11). `#531310` (1.39) and `#9E231F` (2.56) both fail, so
`border.control` = `#A3676B` (4.45 / 4.33 / 4.07). The alternative `#C81A1A`
(3.42) is rejected as too loud for every input at rest.

## D-008 Hairlines, sunken surface, overlay border

Status: proposed.

**Decision.** The site's six near-identical hairline hexes (`#290D0C`,
`#24100F`, `#321110`, `#38100F`, `#190B0B`, `#2B0E0D`) fold into one
`border.divider` = `#2B0E0D`. `#0A0707` becomes `surface.sunken`. Every
floating layer (dialog, drawer, menu, popover, toast) uses a 1px
`border.overlay` = `#E53935`; the historical dunst frame `#AE1914` survives only
in `heritage-ansi`.

## D-009 Density modes

Status: proposed.

**Decision.** Two density modes are tokens, applied with `data-density` on any
subtree. `compact` matches the site: control height 24px, row height 28px, UI
type 12/16, icon 16, list gap 2. `comfortable`: control 32px, row 36px, UI
type 13/18, icon 16, list gap 4. Both meet the 24×24 CSS-pixel target minimum;
`compact` requires 4px between adjacent targets.

## D-010 Deployment source

Status: proposed.

**Decision.** The site deploys from `main` through GitHub Actions after the
full pipeline passes. The page header prints the version and build commit and
links to the latest tag; consumers pin tags or commits regardless.

## D-011 Reference screenshots

Status: proposed.

**Context.** The four PhpStorm screenshots show a private project name in the
window title bar.

**Decision.** Before any screenshot is committed under `references/`, the title
bar is cropped (or the name redacted) and the redaction is disclosed in the
provenance record. If the owner prefers, the screenshots stay out of the public
repository and are described in `references/catalogue.json` only.

## D-012 Committed exports

Status: proposed.

**Decision.** `exports/`, `site/src/styles/tokens.generated.css`, the JSON
schemas under `schemas/json/` and the README marker blocks are generated and
committed; `npm run check` fails CI on drift or orphan files. Outputs contain no
timestamps and no commit hashes so two runs are byte-identical. `dist/` is never
committed.

## D-013 Consumption eligibility is separate from approval

Status: proposed (formal log status remains owner-controlled).

**Context.** Issue #4 found conflicting instructions to use and to prohibit
pending roles in the approved default profile. Alternatives were to block
pending roles until individually approved, or to use pinned values with disclosure.

**Owner direction, 2026-09-07.** During Phase 1 planning the owner selected
"Use and report" and "Block new use" for deprecated roles, then authorized
implementation. That explicit direction governs consumption without approving
pending token values or changing D-005 through D-012.

**Policy.** An approved default profile's pending roles may be used at a pinned
revision with disclosure of their pending decision IDs, including dependencies.
Proposed profiles remain preview-only and blocked for delivery. Heritage profiles
are historical-only. Deprecated or heritage roles cannot be newly mapped in an
approved profile; no substitute is implied. Ordinary observed/approved roles
remain usable within their documented scope; primitives remain inspection-only.
Release version, profile status, role status, deprecation and eligibility are
separate facts. The generator emits the policy and eligibility metadata.

## D-014 Automatic inline literal color previews

Status: proposed (formal log status remains owner-controlled).

**Context.** Issue #1 requests circular previews and a transparency checkerboard,
which conflict with the general square geometry and no-gradient rules. Keeping
square previews would remove the requested circle-to-square interaction.

**Owner direction, 2026-09-07.** The owner explicitly approved a narrow preview
exception and authorized implementation. It is presentation of literal data,
not a new palette, semantic role or component geometry rule.

**Exception.** Every visible CSS hex literal on the spec page receives one
automatically generated preview. Preserve the literal exactly. The preview is
16px including its theme-derived 1px boundary, circular at rest, and scales to
17.4px with radius zero when CSS `:hover` matches. The fast duration token and
ease-out govern transform and border-radius; reduced motion removes animation.
Alpha is composited over a checkerboard made from existing theme tokens.
Only this preview permits rounded geometry, patterned gradient backgrounds and
border-radius animation. Text, copying, keyboard order and no-JS access remain
intact. The parsed literal is data and never inferred from a token or screenshot.


Syntax specimens (literal data, not additional theme roles): `#f00`, `#f008`,
`#ff0000`, `#ff000080`, `#000000`, `#ffffff`. These examples also exercise
copy fidelity and transparent, dark and light previews in the browser suite.

### Follow the pointer hovering effect

The j3w1 specification's inline color circles provide a pointer-following
exact-value preview for actual mouse and pen pointer events. The popup follows the pointer's
position inside the circle with an 8px gap, flips when necessary and stays
inside an 8px viewport gutter. It disappears immediately when the pointer
leaves that circle, on an outside press, Escape, or loss of window focus.
After page or nested-container scrolling, recheck the element under the last
pointer position: keep the popup only if the same circle remains there.
The popup cannot capture pointer input or keep itself open when hovered.
It is a supplementary, non-interactive visual preview; token tables and the
keyboard-accessible token inspector retain the persistent information and links.
Long previews are bounded by the viewport. No new keyboard stop is introduced.
Pointer tracking has no animation or easing, including under reduced motion.
This owner-directed behavior extends the D-014 preview exception only; it
does not change the general tooltip or focus contract.

**Compatibility clarification.** CSS `:hover` controls the circle-to-square
morph directly. Mouse and pen pointer events control the popup; touch and
unknown pointer types do not open it. Neither behavior is gated by `hover`
or `any-hover` media features: browsers can report no hover capability while
still delivering mouse input. Reduced motion continues to remove animation,
and circles and their literal text remain visible without JavaScript.

## D-015 Clarify component mappings exposed by consumption acceptance

Status: proposed. The owner directed application of this resolution on
2026-09-07; its implementation preserves existing component appearance.
The formal decision status remains owner-managed.

**Context.** Phase 2's independently reviewed composed acceptance preserved
three contradictions: ordinary confirmation versus destructive alert-dialog
tone, the primary button's pressed-border metadata versus its prose/CSS, and
the global on-fill focus wording versus explicit component ring mappings.
Phase 3 controls must not present an arbitrary interpretation as canonical.

**Owner-directed resolution.** Preserve current component appearance and all token
values. Ordinary confirmation uses the primary action tone; destructive tone
belongs to destructive actions, independent of the confirmation's semantic
role. The primary button retains `color.action.primary.border` when pressed;
secondary and tertiary use `color.border.active`, and destructive retains its
declared destructive border. Correct the generic/default metadata accordingly.
Focusable controls retain their documented component ring mappings: primary
and checked/selected fills use `color.interaction.focus.ring-container` where
declared; destructive fills use their on-fill text role. Clarify the global
wording to refer to these explicit mappings, retaining ring geometry,
forced-colors behavior and every contrast floor. No profile or pending-token
approval is implied.

**Alternatives.** Enforce the generic prose everywhere, changing currently
rendered pressed borders and focus colors; or retain the contradictions and
explicitly mark affected workbench configurations unresolved. Neither is
silently selected. Historical acceptance reports remain historical evidence.

## D-016 Pinned release comparison report and historical rendering

Status: proposed. Issue #2 authorizes derived release diagnostics; formal
decision status and all theme approvals remain owner-managed.

**Context.** Release comparison needs a versioned report without putting
run metadata into deterministic canonical exports or interpreting missing
historical fields using today's rules.

**Implementation scope.** Schema version 1 records both immutable revisions,
profile and input digests, separate semantic change categories, explicit
dependency evidence, and unsupported historical inputs. Reports and historical
specimen renderings are build artifacts under `dist/releases/`; the canonical
exports retain their existing contract. Historical data is read from Git, never
executed as a build or imported as a module. The current shared specimen
renderer presents each side's maintained markup and styles with a documented
renderer version and matched conditions. This is a reconstructed visual
reference, not evidence that an old site's JavaScript or an external port ran.
Actual browser captures remain run evidence with recorded environment and
artifact hashes. Missing evidence stays not run. Renames require an explicit
mapping naming the two revisions; equal values do not establish a rename.

**Alternatives.** A raw file diff loses semantic categories and dependency
evidence; executing historical applications expands the trust boundary and
confounds renderer changes with theme changes. Neither is required for this
bounded comparison. No design values, eligibility rules or verification
statuses are changed by the report format.
