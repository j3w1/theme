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

Each entry has a Decision, a Why and a Status line (status, date, who decided,
and what later entries changed). Alternatives and Consequences appear only where
they add something stated nowhere else. Entries are ordered by topic.

## Decisions by topic

### Governance and process

| # | Title | Status | Date | Decided by |
| --- | --- | --- | --- | --- |
| D-000 | Responsibility split: tokens, spec, ports, evidence | accepted | 2026-09-05 | owner (design package) |
| D-002 | v0.1.0 ships the full R1 component inventory | accepted | 2026-09-06 | owner |
| D-004 | Public repository; MIT code, CC BY 4.0 prose | accepted | 2026-09-06 | owner |
| D-005 | Default profile id is `default` | proposed | 2026-09-06 | — |
| D-010 | The site deploys from `main` | proposed | 2026-09-06 | — |
| D-011 | Reference screenshots are cropped before publication | proposed | 2026-09-06 | — |
| D-012 | Exports are committed and drift-checked | proposed | 2026-09-06 | — |
| D-013 | Consumption eligibility is separate from approval | proposed | 2026-09-07 | — |
| D-028 | Merge gates and the deployment gate are different suites | accepted | 2026-09-11 | owner (explicit verification-split instruction) |
| D-031 | Select the checks a change needs; shard the deployment matrix | accepted | 2026-09-26 | owner (explicit CI renovation request, plan approval) |

### Colour foundation

| # | Title | Status | Date | Decided by |
| --- | --- | --- | --- | --- |
| D-001 | Controlled three-hue extension for status, diagnostics and diffs | accepted | 2026-09-06 | owner |
| D-003 | Text-role corrections with new in-hue values | accepted | 2026-09-06 | owner |
| D-007 | `border.control` uses `#A3676B` | proposed | 2026-09-06 | — |
| D-008 | Fold site hairlines into `border.divider`; `surface.sunken`; unified overlay border | proposed | 2026-09-06 | — |
| D-023 | True Black / Rose canonical foundation | accepted | 2026-09-08 | owner (explicit selection of candidate I) |
| D-026 | Primary action fill darkens off heritage ANSI 12 | accepted | 2026-09-11 | owner (explicit acceptance after visual review) |
| D-027 | Recede the interactive chrome | accepted | 2026-09-11 | owner (explicit acceptance after visual review) |
| D-029 | Readable terminal and code reds | accepted | 2026-09-26 | owner (explicit selection of values and release in planning) |
| D-030 | Hued syntax roles for opt-in code highlighting | accepted | 2026-09-26 | owner (explicit request for a more colourful Codex, selection of the extended hues) |
| D-032 | Coral slot 6 and a fixed prompt background | accepted | 2026-09-26 | owner (explicit selection of coral and the PowerShell prompt look) |
| D-035 | An accent surface for the user's own content | accepted | 2026-10-06 | owner (Telegram acceptance: own and other people's messages too similar; chose #3d0c0a from a side-by-side comparison) |
| D-036 | A translucent text-selection tint | accepted | 2026-10-06 | owner (Telegram acceptance: Android text selection barely visible; chose 50% from a side-by-side comparison) |

### Typography and density

| # | Title | Status | Date | Decided by |
| --- | --- | --- | --- | --- |
| D-009 | Density modes `compact` and `comfortable` as tokens | proposed | 2026-09-06 | — |
| D-033 | Rose prose, semantic content headings and inherited bold | accepted | 2026-09-28 | owner (explicit implementation plan) |
| D-037 | Display and title type sizes | proposed | 2026-10-14 | — |

### Interaction and components

| # | Title | Status | Date | Decided by |
| --- | --- | --- | --- | --- |
| D-006 | Focus-ring rule, including invalid + focus | proposed | 2026-09-06 | — |
| D-014 | Automatic inline literal color previews | proposed | 2026-09-07 | — |
| D-015 | Clarify component mappings exposed by consumption acceptance | proposed | 2026-09-07 | — |
| D-024 | Distinguish links from body text and headings | accepted | 2026-09-08 | owner (explicit preview correction) |
| D-025 | Theme interactive controls throughout the portal and demo | accepted | 2026-09-09 | owner (explicit native-control replacement request) |

### Site, tools and distribution

| # | Title | Status | Date | Decided by |
| --- | --- | --- | --- | --- |
| D-016 | Pinned release comparison report and historical rendering | proposed | 2026-09-08 | — |
| D-017 | Private framework parity evidence | proposed | 2026-09-08 | — |
| D-019 | One-way namespaced Figma Variables bridge | proposed | 2026-09-08 | — |
| D-020 | Bounded local validation and recovery workflow | proposed | 2026-09-08 | — |
| D-021 | Local form composition with versioned data | proposed | 2026-09-08 | — |
| D-022 | Local visual selection before agent implementation distribution | proposed | 2026-09-08 | — |

### Ports

| # | Title | Status | Date | Decided by |
| --- | --- | --- | --- | --- |
| D-018 | Declared port capabilities and fresh import evidence | proposed | 2026-09-08 | — |
| D-034 | Versioned Windows native and Windhawk adapters | accepted | 2026-09-28 | owner (explicit implementation plan) |

## D-000 Responsibility split

**Decision.** Token files own literal values and aliases; the specification owns
meaning, permitted uses and constraints; port mappings own native keys; evidence
records own what was actually tested. README, the site and pictures summarise
them and never replace them.

**Consequences.** A disagreement between spec and tokens is a defect to fix, not
a choice. Images never override token values. Historical source is evidence of
origin, not an override of the adopted accessible design.

**Status.** accepted · 2026-09-05 · owner (design package `ARCHITECTURE.md`).

## D-002 v0.1.0 inventory

**Decision.** The first public release holds every `R1` inventory component
(about 47 across all nine families) plus four composed specimens (settings
panel, administrative form, filterable table, i3 window frame), each *specified*
and *demonstrated*. Ten core components are also *tested*: button, link,
text-field, select, checkbox, radio-group, tabs, dialog, menu, table. `R2` items
and the form-builder specimen wait for v0.2.

**Status.** accepted · 2026-09-06 · owner.

## D-004 Visibility and licensing

**Decision.** The repository is public. MIT: code, tokens, schemas, scripts,
tests, site source, generated JSON/CSS exports. CC BY 4.0: specification prose,
specimens, generated Markdown exports. Screenshots under `references/`: all
rights reserved, reference only. Fonts, vendor template material and private
business data are never committed; CI scans for them. See `LICENSE.md`.

**Status.** accepted · 2026-09-06 · owner.

## D-005 Default profile id

**Decision.** The approved everyday composition is the profile `default`;
renaming it later is a MAJOR version change.

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
separate facts; the generator emits the policy and eligibility metadata. This
governs consumption only: no pending value is approved, and D-005 through D-012
are unchanged.

**Why.** Issue #4 found conflicting instructions to use and to prohibit pending
roles in the approved default profile; blocking them until each is approved was
the alternative.

**Status.** proposed · 2026-09-07 (formal log status remains owner-controlled).
Owner direction, 2026-09-07, in Phase 1 planning: "Use and report", and "Block
new use" for deprecated roles; implementation authorized.

## D-028 Merge gates and the deployment gate are different suites

**Decision.** The full browser and packed-consumer matrix gates deployment, not
merging; it runs on `main` before `deploy` and on demand through the workflow
dispatch. A subset never writes evidence: it uses the plain list reporter,
because the evidence reporter would mark unselected tests not run and publish a
matrix that only looked complete. Packed consumers move with the browser suite,
which republishes their evidence against the deployed package;
`scripts/ui-verification-report.mjs` requires the complete protocol on all three
engines. No mandatory local gate: `npm run test:all` is recommended, never
verified; the practice is recorded in `AGENTS.md`. As first recorded, pull
requests merged on `validate`, `build` and a `smoke` job (desktop project; page,
portal, button and text-field specs; plain list reporter), which is never a
coverage claim.

**Why.** Accepting D-026 and D-027 cost 29.5 minutes of CI before merge, 84% of
it the browser matrix: pure latency on a public repository. A browser failure
stops publication, not a correct merge; a local receipt proves only that
something wrote it. Sharding before merge (about six minutes, partial evidence
files) and consumers on the merge path were rejected.

**Status.** accepted · 2026-09-11 · owner: merges gate on a few minutes of
checks, the full matrix gates deployment, a local full run stays recommended.
Superseded in part by D-031 (path-selected pull-request checks, a sharded
deployment matrix with one evidence report, `release-gate` as the only required
check); the rules above still hold.

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
  selected checks; browser subsets write no evidence (D-028).
- A push to `main` that changes the site runs the whole matrix: browser projects
  split into jobs (desktop in four parts; projects read from the Playwright
  config) whose blob reports merge once into the evidence reporter, with packed
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
which the site never reads, took 63 minutes to deploy, and the browser suite ran
on one worker for 24.7 minutes. Shards now write blob reports merged into one
report, so D-028's objection to sharding no longer applies. Rejected: a
self-hosted runner (fork pull requests could run code on it), reusing
pull-request evidence on `main` (the build stamps the commit), Playwright's
internal shard weights (not public).

**Status.** accepted · 2026-09-26 · owner, who found thirty-minute runs on
`main` unacceptable and asked for classified checks modelled on theselfish.one.
Supersedes D-028 in part.

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
uses such hues. Measured contrast is in `exports/contrast.md`.

**Status.** accepted · 2026-09-06 · owner. Superseded in part by D-030 (opt-in
`code.hued.*`; `code.syntax.*` stays monochrome).

## D-003 Text-role corrections

**Decision.** `text.subtle` = `#AD7175` for metadata, comments and line numbers.
`text.disabled` = `#8A5559` (exempt under WCAG 1.4.3, at least 3:1 by house
policy). `#A3676B` stays as `border.control`, `icon.decorative`,
`status.neutral.fill` and `chart.series.4` (non-text, at least 3:1); `#7D1310`
only as `border.disabled`, `code.whitespace` and minor grid lines, never text.
`heritage-ansi` keeps the original assignments, flagged `$deprecated`.

**Why.** `#A3676B` (the site's `--quiet`) measures 4.45:1 on `#0C0909` and
`#7D1310` (`--inactive`) 1.86:1, yet the site used `#7D1310` for line numbers;
its suggested `#A8403A` measures only 3.27:1.

**Status.** accepted · 2026-09-06 · owner.

## D-007 Control boundary colour

**Decision.** `border.control` = `#A3676B`.

**Why.** Control boundaries need 3:1 against their surface (WCAG 1.4.11);
`#531310` (1.39) and `#9E231F` (2.56) fail, and `#C81A1A` (3.42) is too loud for
every input at rest.

**Status.** proposed · 2026-09-06.

## D-008 Hairlines, sunken surface, overlay border

**Decision.** The site's six near-identical hairlines (`#290D0C`, `#24100F`,
`#321110`, `#38100F`, `#190B0B`, `#2B0E0D`) fold into `border.divider` =
`#2B0E0D`. `#0A0707` becomes `surface.sunken`. Every floating layer (dialog,
drawer, menu, popover, toast) takes a 1px `border.overlay` = `#E53935`. The
dunst frame `#AE1914` survives only in `heritage-ansi`.

**Status.** proposed · 2026-09-06.

## D-023 True Black / Rose canonical foundation

**Decision.** Seven surface assignments change: canvas, sunken, input, code and
terminal use the existing pure black primitive; chrome uses `#090707`; default
panels use `#100c0c`. The two new values become `color.primitive.ink.14` and
`color.primitive.ink.28`, keeping luminance order and all historical primitives.
Everything else stays exactly as reviewed (rose/white foreground, red actions,
focus, borders, selections, status and chart roles); raised/overlay stay
`#241010`, alternate chrome `#1c0a09`. The historical profile keeps its previous
surfaces. This approves these surfaces only, not other pending decisions, new
colors or accessibility waivers; the A–I candidate reviews stay historical local
evidence, not public profiles. It ships in 1.0.0 under the major-version rule;
existing pins stay immutable.

**Why.** The owner explicitly selected the reviewed candidate I: "use the True
Black / Rose theme and make it permanent for j3w1/theme".

**Status.** accepted · 2026-09-08 · owner, who also authorized the remaining
Phase 6 implementation. Superseded in part only: D-024 (`text.link`), D-026
(`action.primary.bg`), D-027 (`surface.raised`, `interaction.selection.bg`,
`text.placeholder`).

## D-026 Primary action fill darkens off heritage ANSI 12

**Decision.** `color.action.primary.bg` aliases the existing
`color.primitive.red.200` (`#7d1310`) instead of `color.primitive.red.300`; no
colour is minted. Pressed `#630f0d` stays below, hover `#911410` above. The
decorative waiver `primary fill against the panel` goes from 2.07:1 to 1.83:1
(the label identifies the button); no waiver is added or widened.

**Why.** The owner asked for a slightly darker fill on primary actions such as
the portal's `Explore components` button. `color.primitive.red.300` is also
`color.primitive.ansi.12` and `color.terminal.ansi.12`, and `schemas/roles.mjs`
pins every `color.primitive.ansi.<i>` to its heritage value, so it cannot darken
without repainting the terminal's bright red. A new primitive, or a darker
portal button only (a value outside `tokens/`, against the confirmation-only
rule in `theme.json`), were the alternatives.

**Status.** accepted · 2026-09-11 · owner (accepted as implemented after
review). Supersedes D-023 only for `action.primary.bg` (`#871f19`, kept "exactly
as reviewed" under its red actions clause).

## D-027 Recede the interactive chrome

**Decision.** Four roles move to existing palette values; no colour is minted.

- `surface.raised`: `ink.30` (`#160b0b`), was `ink.52`; an open list reads as
  depth, distinct from `surface.default` (`#100c0c`).
- `interaction.selection.bg`: `red.100` (`#531310`), was `red.350`. The fill
  never carried selection (2.00:1 against the raised surface); the unchanged 2px
  `border.selected-indicator` and check glyph do.
- `text.placeholder`: `rose.350` (`#a3676b`), was `rose.600`; over the 4.5:1
  floor on `surface.input` without a waiver.
- Links hover on `interaction.hover.bg`, not `interaction.hover.bg-strong`,
  which menu items keep.

A selected row now takes the ordinary 1px dashed ring; `action.primary.bg` and
`status.danger.fill` keep the recoloured ring (measurements in
`spec/foundations.md`, Interaction states, rule 1). No waiver is added or
widened. `spec/foundations.md` was corrected; D-006 stays as written.
`tests/foundation-selection.test.js` guards the set.

**Why.** The owner found the open list, selected row, placeholder and link hover
louder than the content they sit against. Darkening only the pointed-at
components, or adding intermediate primitives, were the alternatives.

**Status.** accepted · 2026-09-11 · owner (accepted as implemented after
review). Supersedes D-023 only for `surface.raised` (`#241010`),
`interaction.selection.bg` (`#911410`) and `text.placeholder` (`#bd787d`).

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
New role `color.terminal.prompt-text` colours the prompt's path segment.
Terminal ports regenerate; CE Devbox's shell palette and the Agnoster prompt
follow in their own repositories.

**Why.** In Orca, Claude Code and Codex the owner found the reds right but too
dim: Claude Code's inline code uses slot 12 (2.12:1), code-block keywords and
Codex git branches slot 4 (2.09:1). Ten of the sixteen slots failed the 4.5:1
text floor, and programs, not the theme, pick the slot. Rejected: the heritage
slots (unreadable), the `extended` palette (the owner keeps the red and rose
families), a gentle lift leaving slots 4 and 12 near 3:1, and an OKLCH lift
(gamut clipping drifts toward raspberry).

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
code background and 5.74:1 or more in an editor selection. The reference editor
and other consumers keep `code.syntax.*`; a host opts in by mapping
`code.hued.*`, as the Codex port does. This extends D-001's code-group allowance
to these roles; `extended` stays proposed.

**Why.** The owner found Codex's code "too boring and single-coloured"; D-001
allowed code hues only in the proposed `extended` overlay, which is blocked for
delivery. Approving all of `extended` would reassign terminal slots too.

**Status.** accepted · 2026-09-26 · owner, who chose the extended hues.

## D-032 Coral slot 6 and a fixed prompt background

**Decision.**

- Slot 6 is coral `#ff7a66` (`color.primitive.coral.700`, 7.77:1 on the terminal
  background): warm and vivid, apart from the rose text, without taking amber's
  code role.
- Emulators mix dim colours halfway into the background, so dimmed coral is
  about 2.7:1. A dim-only host setting may help; brightening slot 6 to
  compensate is ruled out.
- New role `color.terminal.prompt-bg`, the prompt's path-segment background, is
  heritage `#8c1212` (`color.primitive.ansi.4`) in every profile.
  `color.terminal.prompt-text` is bright rose `#ffa2a7` in `default` (4.97:1)
  and the proposed `extended`, and `#f4eeee` in `heritage-ansi` (8.28:1).
  Prompts set both as 24-bit colours, whatever the slots carry.
- Hosts that set the palette (Orca, Ghostty, Warp, CE Devbox's shell palette)
  all use the same one; the prompt is the one deliberate heritage-style
  exception. CE Devbox maps Agnoster's directory and virtualenv segments to the
  prompt roles in its own repository.

**Why.** Claude Code highlights fenced code with fixed ANSI slots: PowerShell
cmdlets took slot 6 (`#bb696c`, nearly the rose text `#e99499`), and types slot 6
dimmed (2.07:1). Agnoster's directory segment sits on slot 4, which D-029 made
`#e53131`, so its slot-7 text fell to 2.28:1; the owner's PowerShell shows
`#ffa2a7` on `#8c1212` (4.97:1), the look to keep. Rejected: peach `#ffab91`,
blush `#ffc2c5` or amber `#e0a84a` for slot 6; dark text on the bright slot 4;
the heritage palette in SSH shells (palettes should match across hosts).

**Status.** accepted · 2026-09-26 · owner, who saw both problems in real use and
chose the values. Supersedes D-029 in part.

## D-035 An accent surface for the user's own content

First recorded as D-034 and renumbered before merge, because PR #69 held D-033
and D-034.

**Decision.**

- New role `color.surface.accent`: the user's own content, set apart from
  neighbouring surfaces, such as outgoing chat messages.
- Its value is a new primitive, `color.primitive.red.40` (`#3d0c0a`).
- Text on it: `text.default` 7.30, `text.bright` 8.74, `text.muted` 4.90,
  `text.link` 4.55. `text.subtle` does not reach 4.5:1 (4.30), so secondary text
  on it uses `text.muted`.
- Every port classifies the role; only Telegram maps it. Outgoing bubbles use
  it, incoming bubbles stay `surface.raised`, and timestamps on both use
  `text.muted`. The bubbles are ΔE 24.0 apart (CIE76). Claude Code's
  `userMessageBackground` keeps `interaction.selection.bg`; adopting the new
  role there is a separate change.

**Why.** In live acceptance on Android and Windows the owner found their own
messages too hard to tell from other people's (`#241010` against `#160b0b`, ΔE
7.4). Reusing `#2b0e0d` (ΔE 12.6) was still too subtle; from four options
rendered in real colours (`#241010`, `#2b0e0d`, `#330b09`, `#3d0c0a`) the owner
chose the deepest. Red links cap the bubble's brightness: they pass at
`#3f0c0a` (4.51:1) and fail from `#400c0a` (4.48:1), so `#3d0c0a` keeps a small
margin. Not chosen: `#330b09` (ΔE 18.6, keeps `text.subtle` at 4.52:1);
incoming on `surface.default` (ΔE 10.2, nearly merges with the wallpaper at ΔE
1.8); `status.danger.tint` (the wrong meaning).

**Status.** accepted · 2026-10-06 · owner, who saw the problem in real use,
rejected the first value after a second look, and chose `#3d0c0a` from the
side-by-side comparison.

## D-036 A translucent text-selection tint

First recorded as D-035 and renumbered before merge (see D-035).

**Decision.**

- New role `color.interaction.text-selection.tint` for hosts that keep the text
  colour inside a selection. It is translucent, so it also suits hosts that
  paint the fill over their content.
- Its value is a new primitive, `color.primitive.alpha.red-50`: the existing
  text-selection red `red.350` (`#911410`) at 50%.
- Over the canvas, the raised and the accent surface it is ΔE 36.5, 35.1 and
  21.5 from the surface (CIE76; Android's 8-bit composites `#490a08`,
  `#54100e`, `#67100d`). `text.default` on it measures 6.89, 6.29 and 5.53;
  `text.link` 4.30, 3.92 and 3.45.
- Two global contrast pairs composite over the canvas only, with float alpha
  (`#480a08`): default text 6.91, bright 8.28. The raised and accent figures are
  enforced by the Telegram port's tests. Links are not a declared pair, because
  waivers are for decorative graphics only; their limit is recorded in
  `spec/accessibility.md`, Limitations.
- Hosts that recolour selected text use `text-selection.bg` with
  `text-selection.text`. The Telegram port gives Android text selection the
  tint; Desktop keeps `selection.bg` with near-white selected text. Every port
  classifies the role; only Telegram maps it. Obsidian also keeps the text
  colour (rose on its `text-selection.bg` measures 3.96:1), so the tint fits
  it, but adopting it needs its own import check and is a separate change.
- Limits while an Android selection lasts are in `spec/accessibility.md`,
  Limitations. Not recorded there: no strength meets both the over-the-text
  case and the accent-surface floor (40% gives 4.34 and 3.68); review r11 found
  that case after the owner's choice; and inside an outgoing code block the
  selection stands ΔE 18.3 from the block. A selection is short-lived, as with
  editor selections.

**Why.** On Android the owner found selected text barely visible in the message
field: the 12% `interaction.marquee` was ΔE 5.2 from the field. The first fix,
opaque `interaction.selection.bg` (`#531310`), hid content on pinned Telegram
paths that paint the fill after it (rich-editor tables, captions and media
blocks; the rich-message translation preview, found by review r10), and was ΔE
10.2 on the outgoing bubble. The only translucent roles were the marquee and
black scrims. The owner compared the opaque fill and the tint at 40, 50 and 60%
in the message field, both bubbles and a rich-editor photo, and chose 50%. 40%
is ΔE 17.8 on the accent surface, near the 18.6 rejected for bubbles; 60% drops
links to 3.24:1 and dims media more; opaque `text-selection.bg` drops rose text
to 3.96:1, because Android cannot recolour it.

**Status.** accepted · 2026-10-06 · owner, who saw the problem in real use and
chose 50% from the side-by-side comparison after the review rejected the opaque
fill.

## D-009 Density modes

**Decision.** Density modes are tokens, set with `data-density` on any subtree.
`compact` matches the site: control 24px, row 28px, UI type 12/16, icon 16, list
gap 2. `comfortable`: control 32px, row 36px, UI type 13/18, icon 16, list gap
4.

**Status.** proposed · 2026-09-06.

## D-033 Rose prose, semantic content headings and inherited bold

**Decision.** Ordinary interface, body and long-form prose use rose `#e99499`;
`text.prose` aliases `text.default`. `text.bright` remains `#ffa2a7` for brighter
UI labels. New `text.heading` (content titles and H1–H6) and `text.highlight`
(deliberate exceptional highlights) use existing paper `#f4eeee`.
Application/window chrome titles use rose default or bright. Bold changes weight
only and inherits its semantic foreground; it is never a reason to choose white.
Selection remains an explicit near-white exception. Primary action labels use
bright rose across rest, hover and pressed; danger/on-fill text retains paper
`#f9faf9` where contrast requires it. Version 4.0.0 changes the canonical
semantics, site and ports (audit in `docs/rose-typography-migration.md`);
historical ANSI slots and decision records are unchanged, and no waiver or
contrast floor changes.

**Why.** White prose and white bold overwhelmed the intended rose identity, and
prose was an ambiguous alias for white. Headings are distinguished by
typography, not by turning lower headings into body text. The owner rejected
Obsidian-only overrides, white bold and rose lower headings in favor of one
canonical hierarchy.

**Status.** accepted · 2026-09-28 · owner, explicit instruction and implementation
plan approval. Supersedes earlier near-white prose descriptions and bright/red
content-heading assignments; updates D-026's primary foreground only.

## D-037 Display and title type sizes

**Decision.** Two type roles join the scale: `font.size.display` with
`font.line-height.display` (32/40) for page heroes and metric figures, and
`font.size.title` with `font.line-height.title` (24/32) for page titles above
h1. Portal pages use them instead of literal sizes; components keep h1–h3.

**Why.** The portal set 48, 32, 24, 22 and 18px outside the token scale. The
owner chose token sizes over shrinking every heading to h1 (planning,
2026-10-14), or page-local literal sizes.

**Status.** proposed · 2026-10-14. The owner asked for display type tokens in
planning; the owner sets the status.

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

## D-014 Automatic inline literal color previews

**Decision.** Every visible CSS hex literal on the spec page gets one generated
preview; the literal stays exact and is data, never inferred from a token or
screenshot. The preview is 16px with its theme-derived 1px boundary, circular at
rest; on CSS `:hover` it scales to 17.4px with radius zero (fast duration token
and ease-out on transform and border-radius; none under reduced motion). Alpha
shows over a checkerboard of theme tokens. Only this preview may use rounded
geometry, patterned gradient backgrounds and border-radius animation; it adds no
palette, semantic role or geometry rule. Text, copying, keyboard order and no-JS
access stay intact. The browser suite tests copy fidelity and transparent, dark
and light previews with the syntax specimens `#f00`, `#f008`, `#ff0000`,
`#ff000080`, `#000000`, `#ffffff` (literal data, not roles).

**Why.** Issue #1 asks for circular previews and a transparency checkerboard,
against the square and no-gradient rules.

**Status.** proposed · 2026-09-07 (formal log status remains owner-controlled).
Owner direction, 2026-09-07: the narrow exception explicitly approved,
implementation authorized.

### Follow the pointer hovering effect

Part of this exception only; the tooltip and focus contracts are unchanged.

- Mouse and pen pointers open a non-interactive popup with the exact value;
  touch and unknown pointers do not. CSS `:hover` alone drives the morph;
  neither uses the `hover` or `any-hover` media features, which can report no
  hover despite mouse input.
- The popup follows the pointer inside the circle at an 8px gap, flips when
  necessary and stays within an 8px viewport gutter.
- It closes at once when the pointer leaves the circle, on an outside press,
  Escape or loss of window focus, and after page or nested-container scrolling
  unless the same circle is still under the last pointer position.
- It cannot capture input or hold itself open and adds no keyboard stop; token
  tables and the keyboard-accessible token inspector keep the persistent
  information and links. Tracking has no animation or easing, even under
  reduced motion. Circles and literal text stay visible without JavaScript.

## D-015 Clarify component mappings exposed by consumption acceptance

**Decision.** Keep current component appearance and all token values. Ordinary
confirmation uses the primary tone; destructive tone is for destructive actions,
whatever the confirmation's semantic role. A pressed primary button keeps
`color.action.primary.border`, secondary and tertiary use `color.border.active`,
destructive keeps its declared border; the generic metadata is corrected to
match. Controls keep their documented ring mappings (primary and
checked/selected fills: `color.interaction.focus.ring-container` where declared;
destructive fills: their on-fill text role). The global wording points to them,
keeping ring geometry, forced-colors behavior and every contrast floor. No
profile or pending token is approved; historical acceptance reports stay
historical evidence.

**Why.** Phase 2's independently reviewed composed acceptance preserved these
three contradictions; Phase 3 controls must not present an arbitrary
interpretation as canonical (rather than enforcing the generic prose everywhere
or marking affected workbench configurations unresolved).

**Status.** proposed · 2026-09-07. The owner directed application on 2026-09-07;
formal status remains owner-managed.

## D-024 Distinguish links from body text and headings

**Decision.** `color.text.link` maps to the existing strong red `#f73f35`,
keeping the persistent red underline and near-white hover text on the strong
dark-red hover fill. Visited links keep color and underline; current-page and
selected navigation keep their on-fill roles; body and heading colors are
unchanged. No new primitive, status hue, contrast exception or focus rule; the
historical profile keeps the old link.

**Why.** In the implementation preview the owner asked for links more
distinguishable from normal text, using different colors, rather than bright
rose (the heading color) or blue/purple (an unrelated hue).

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
step buttons; native inputs keep constraints and values. Browser-owned system
dialogs and no-JavaScript fallbacks stay native, without platform hacks; native
ports keep their mappings. The command field fills its dialog width below its
label. This supersedes the select spec's ban on replacing the host popup (web
implementations) and the date/time specs' host-popup descriptions (enhanced web
implementations). Ships in 1.1.0; 1.0.0 pins stay immutable.

**Why.** Seeing native blue selections in the work board and agent-kit picker,
the owner explicitly instructed: "replace mostly all native components like
`<select>` we must use all j3w1 themed", and asked for a properly proportioned
command-search field. Advisory option CSS keeps the blue selection; one-off
dropdowns duplicate behavior.

**Status.** accepted · 2026-09-09 · owner.

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
mapping naming both revisions; equal values do not establish one. No design
values, eligibility rules or verification statuses change.

**Why.** Run metadata must stay out of deterministic exports, and missing
historical fields must not be read by today's rules. A raw file diff has no
semantic categories; running historical applications widens the trust boundary.

**Status.** proposed · 2026-09-08. Issue #2 authorizes derived release
diagnostics; formal status and all theme approvals remain owner-managed.

## D-017 Private framework parity evidence

**Decision.** An independently authored private harness takes an
operator-supplied licensed target and an explicit license review, copies only
declared template inputs into a new private fixture directory, uses synthetic
examples and records exact theme, template, framework, dependency and fixture
identities. The target and its application behavior stay outside its write
scope; browser captures, copied vendor inputs and detailed results stay private;
missing prerequisites give not-run output. A successful diagnostic run is not a
verified port or a claim of complete visual parity.

**Why.** A public vendor copy breaks the license boundary, and a generic mock
would be presented as template evidence.

**Status.** proposed · 2026-09-08. Issue #3 authorizes the harness; approval
statuses and license boundaries are unchanged.

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

**Why.** Manual duplicate maintenance, a paid-only REST workflow, and flattening
aliases or composites were the alternatives.

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

**Why.** A color-only invalid snapshot, validation on every keystroke, or a
submit click treated as a successful save were the alternatives.

**Status.** proposed · 2026-09-08. Issue #16 authorizes one pattern from
existing admin-form, field, alert and button rules, without new palette roles.

## D-021 Local form composition with versioned data

**Decision.** Five canonical field kinds can be added, edited, removed and
reordered with buttons. Definitions, preview values and validation state are
separate. JSON imports have closed fields, bounded size/counts and unique stable
IDs; a failed import changes nothing. Content identity pins the supplying theme
and component contracts; downloads hold definitions, never entered values.
Rendering and validation reuse D-020. A draft reference component, not a backend
platform or native port.

**Why.** Arbitrary HTML/schema execution, a conditional workflow engine, or a
second field implementation were the alternatives.

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
documentation portal and Vue application. Productizing the old palette first,
unapproved preview profiles, or appearance-only snippets were the alternatives.

**Status.** proposed · 2026-09-08. Issue #37 and the owner's implementation
instruction authorize three local candidates; design approval remains
owner-managed. The selection is D-023.

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

**Why.** A hand-maintained support matrix, or a parse treated as an import, were
the alternatives.

**Status.** proposed · 2026-09-08. Issue #14 authorizes a derived mapping
explorer; it creates no port, changes no host capability and approves no
profile.

## D-034 Versioned Windows native and Windhawk adapters

**Decision.** A Windows port uses native settings where sufficient and pinned
Windhawk 2.0 alpha 6 stylers solely as rendering adapters for canonical semantic
tokens: a bounded exception to the unsupported-injection prohibition in
portability. No binary patching, shell replacement, paid tool or third-party
theme is permitted. Unknown shell versions/structures fail closed. Full lifecycle
support includes pinned install/update, verification, original-state restore,
transaction rollback and removal of owned theme assets. User shortcuts, window
management, existing layouts and desktop icons are preserved; cursors and black
wallpaper are included. Native limitations are disclosed, not silently patched.

**Why.** Native settings cannot represent the full black/rose shell identity,
and the owner explicitly accepted the pinned prerelease to use its upstream CLI.
Private storage edits and UI automation are less reproducible; binary theme
patching was rejected.

**Status.** accepted · 2026-09-28 · owner, explicit implementation plan approval.
