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

Each entry has a Decision (what was chosen, with `Rule:` naming the section
that holds the rule), a Why (the reason and the rejected alternatives worth
remembering) and a Status line (status, date, who decided, and what later
entries changed). Computed ratios are in `exports/contrast.md`. Entries are
ordered by topic.

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
| D-039 | Code and terminal backgrounds: two pairs, two scopes | accepted | 2026-10-15 | owner (explicit choice: keep both, scope them) |

### Typography and density

| # | Title | Status | Date | Decided by |
| --- | --- | --- | --- | --- |
| D-009 | Density modes `compact` and `comfortable` as tokens | proposed | 2026-09-06 | — |
| D-033 | Rose prose, semantic content headings and inherited bold | accepted | 2026-09-28 | owner (explicit implementation plan) |
| D-037 | Display and title type sizes | accepted | 2026-10-14 | owner (G2 authority review) |
| D-038 | Compact is the default density | accepted | 2026-10-14 | owner (explicit instruction at the G1 design review) |

### Interaction and components

| # | Title | Status | Date | Decided by |
| --- | --- | --- | --- | --- |
| D-006 | Focus-ring rule, including invalid + focus | proposed | 2026-09-06 | — |
| D-014 | Automatic inline literal color previews | proposed | 2026-09-07 | — |
| D-015 | Clarify component mappings exposed by consumption acceptance | proposed | 2026-09-07 | — |
| D-024 | Distinguish links from body text and headings | accepted | 2026-09-08 | owner (explicit preview correction) |
| D-025 | Theme interactive controls throughout the portal and demo | accepted | 2026-09-09 | owner (explicit native-control replacement request) |
| D-040 | One contrast focus ring for fills and invalid fields | accepted | 2026-10-15 | owner (explicit choice: one role, focus.ring-contrast) |

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

**Decision.** Token files own literal values and aliases; the specification
owns meaning, permitted uses and constraints; port mappings own native keys;
evidence records own what was tested. README, the site and pictures only
summarise them. Rule: `AGENTS.md`, Source of truth.

**Why.** With one owner per fact, a disagreement between spec and tokens is a
defect to fix, not a choice, and neither images nor historical sources can
override the adopted accessible design.

**Status.** accepted · 2026-09-05 · owner (design package `ARCHITECTURE.md`).

## D-002 v0.1.0 inventory

**Decision.** The first public release holds every `R1` inventory component
plus four composed specimens (settings panel, administrative form, filterable
table, i3 window frame), each specified and demonstrated. Ten core components
are also tested: button, link, text-field, select, checkbox, radio-group,
tabs, dialog, menu, table. `R2` items and the form-builder specimen wait for
v0.2.

**Status.** accepted · 2026-09-06 · owner.

## D-004 Visibility and licensing

**Decision.** The repository is public: MIT for code, tokens, schemas and
generated JSON/CSS; CC BY 4.0 for specification prose, specimens and generated
Markdown; screenshots under `references/` are reference only, all rights
reserved. Fonts, vendor template material and private business data are never
committed; CI scans for them. Rule: `LICENSE.md`.

**Status.** accepted · 2026-09-06 · owner.

## D-005 Default profile id

**Decision.** The approved everyday composition is the profile `default`;
renaming it later is a MAJOR version change.

**Status.** proposed · 2026-09-06.

## D-010 Deployment source

**Decision.** The site deploys from `main` through GitHub Actions after the
full pipeline passes. The page header prints the version and build commit and
links to the latest tag. Consumers still pin tags or commits.

**Status.** proposed · 2026-09-06.

## D-011 Reference screenshots

**Decision.** Crop the title bar (or redact the name) before committing a
screenshot under `references/`, and disclose the redaction in its provenance
record. If the owner prefers, screenshots stay out of the repository,
described only in `references/catalogue.json`.

**Why.** The four PhpStorm screenshots show a private project name in the
title bar.

**Status.** proposed · 2026-09-06.

## D-012 Committed exports

**Decision.** Generated files (`exports/`, `site/src/styles/tokens.generated.css`,
`schemas/json/`, the README marker blocks) are committed and byte-identical
across runs, with no timestamps or commit hashes; `npm run check` fails CI on
drift or orphans. `dist/` is never committed. Rule: `AGENTS.md`, Source of
truth.

**Status.** proposed · 2026-09-06.

## D-013 Consumption eligibility is separate from approval

**Decision.** Eligibility is a separate fact from approval. In the approved
default profile, pending roles may be used at a pinned revision when their
pending decision IDs, dependencies included, are disclosed. Proposed profiles
are preview-only, heritage profiles historical-only, and deprecated or
heritage roles cannot be newly mapped. Nothing pending is approved. Rule:
`agents/consume.md`, Pick a profile (generated policy).

**Why.** Issue #4 found conflicting instructions to use and to prohibit
pending roles in the approved default profile. Rejected: blocking them until
each is approved.

**Status.** proposed · 2026-09-07 (formal log status remains owner-controlled).
Owner direction, 2026-09-07, in Phase 1 planning: "Use and report", and "Block
new use" for deprecated roles; implementation authorized.

## D-028 Merge gates and the deployment gate are different suites

**Decision.** The full browser and packed-consumer matrix gates deployment,
not merging: it runs on `main` before `deploy` and on demand through the
workflow dispatch. A subset never writes evidence; it uses the plain list
reporter, because the evidence reporter would publish a matrix that only
looked complete. Packed consumers run with the browser suite, and
`scripts/ui-verification-report.mjs` requires their complete protocol on all
three engines. No mandatory local gate: `npm run test:all` is recommended,
never verified (`AGENTS.md`, The check loop).

**Why.** Accepting D-026 and D-027 cost 29.5 minutes of CI before merge, 84%
of it the browser matrix. A browser failure stops publication, not a correct
merge; a local receipt proves only that something wrote it. Rejected:
sharding before merge (partial evidence files) and packed consumers on the
merge path.

**Status.** accepted · 2026-09-11 · owner: merges gate on a few minutes of
checks, the full matrix gates deployment, a local full run stays recommended.
Superseded in part by D-031 (path-selected pull-request checks, a sharded
deployment matrix with one evidence report, `release-gate` as the only required
check); the rules above still hold.

## D-031 Select the checks a change needs; shard the deployment matrix

**Decision.** CI is `select` → checks → `release-gate`: a change runs the
checks its changed paths need, and a push to `main` that changes the site
runs the whole matrix in shards before it deploys. Rules: `docs/ci.md`.

**Why.** `main` ran every check whatever changed: a terminal-kit-only change
took 63 minutes to deploy, and the browser suite ran on one worker for 24.7
minutes. Merged blob reports remove D-028's objection to sharding. Rejected: a
self-hosted runner (fork pull requests could run code on it), reusing
pull-request evidence on `main` (the build stamps the commit), Playwright's
internal shard weights (not public).

**Status.** accepted · 2026-09-26 · owner, who found thirty-minute runs on
`main` unacceptable and asked for classified checks modelled on theselfish.one.
Supersedes D-028 in part.

## D-001 Controlled three-hue extension

**Decision.** `default` adds three desaturated, warm-shifted hues: amber
`#C9973F` (warning, modified), green `#86A46F` (success, added), blue
`#7E9EBB` (info), with dark tints `#1F1A0C`, `#0F1A0E`, `#0F141C`. They serve
status, diagnostics and diffs only (plus code, terminal and chart in
`extended`). Rule: `spec/foundations.md`, Status, diagnostics and diffs.

**Why.** Lightness alone cannot separate diagnostics, diffs and status (a
200-line diff cannot be scanned by glyph); the owner's PhpStorm scheme already
uses such hues.

**Status.** accepted · 2026-09-06 · owner. Superseded in part by D-030 (opt-in
`code.hued.*`; `code.syntax.*` stays monochrome).

## D-003 Text-role corrections

**Decision.** `text.subtle` = `#AD7175` for metadata, comments and line
numbers; `text.disabled` = `#8A5559`. `#A3676B` and `#7D1310` keep only
non-text roles; `heritage-ansi` keeps the original assignments, flagged
`$deprecated`. Rule: `spec/foundations.md`, Text ladder.

**Why.** `#A3676B` (the site's `--quiet`) falls just short of the text floor
and `#7D1310` (`--inactive`) far short, yet the site used `#7D1310` for line
numbers; its suggested `#A8403A` failed too.

**Status.** accepted · 2026-09-06 · owner.

## D-007 Control boundary colour

**Decision.** `border.control` = `#A3676B`.

**Why.** Control boundaries need 3:1 against their surface (WCAG 1.4.11):
`#531310` and `#9E231F` fail, and `#C81A1A` is too loud for every input at
rest.

**Status.** proposed · 2026-09-06.

## D-008 Hairlines, sunken surface, overlay border

**Decision.** The site's six near-identical hairlines fold into
`border.divider` = `#2B0E0D`; `#0A0707` becomes `surface.sunken`; every
floating layer takes a 1px `border.overlay` = `#E53935`. The dunst frame
`#AE1914` survives only in `heritage-ansi`. Rule: `spec/foundations.md`,
Borders.

**Status.** proposed · 2026-09-06.

## D-023 True Black / Rose canonical foundation

**Decision.** Seven surface roles change: canvas, sunken, input,
`surface.code` and `surface.terminal` take the existing pure black; chrome
takes `#090707` and default panels `#100c0c`, as new primitives
`color.primitive.ink.14` and `ink.28`. Everything else stays as reviewed, the
historical profile keeps its surfaces, and the A–I candidate reviews stay
local evidence. It approves nothing else and ships in 1.0.0 as a major change.
Rule: `spec/foundations.md`, Surfaces.

**Why.** The owner explicitly selected the reviewed candidate I: "use the True
Black / Rose theme and make it permanent for j3w1/theme".

**Status.** accepted · 2026-09-08 · owner, who also authorized the remaining
Phase 6 implementation. Superseded in part only: D-024 (`text.link`), D-026
(`action.primary.bg`), D-027 (`surface.raised`, `interaction.selection.bg`,
`text.placeholder`).

## D-026 Primary action fill darkens off heritage ANSI 12

**Decision.** `color.action.primary.bg` aliases the existing
`color.primitive.red.200` (`#7d1310`) instead of `red.300`; pressed `#630f0d`
stays below it and hover `#911410` above. No colour is minted. The decorative
pair `primary fill against the panel` stays waived (the label identifies the
button); no waiver is added or widened. Rule: `spec/foundations.md`, Actions.

**Why.** The owner asked for a slightly darker fill on primary actions.
`red.300` is also heritage ANSI 12, which `schemas/roles.mjs` pins, so it
could not darken without repainting the terminal's bright red. Rejected: a new
primitive, or a darker portal button alone (a value outside `tokens/`).

**Status.** accepted · 2026-09-11 · owner (accepted as implemented after
review). Supersedes D-023 only for `action.primary.bg` (`#871f19`, kept "exactly
as reviewed" under its red actions clause).

## D-027 Recede the interactive chrome

**Decision.** Four roles move to existing palette values; no colour is minted
and no waiver is added or widened.

- `surface.raised`: `ink.30` (`#160b0b`), so an open list reads as depth.
- `interaction.selection.bg`: `red.100` (`#531310`); the 2px
  `border.selected-indicator` and the check glyph carry selection, not the
  fill.
- `text.placeholder`: `rose.350` (`#a3676b`), over the text floor on
  `surface.input` without a waiver.
- Links hover on `interaction.hover.bg`; menu items keep
  `interaction.hover.bg-strong`.

A selected row now takes the ordinary ring; primary and danger fills keep the
recoloured one. Rule: `spec/foundations.md`, Interaction states, rule 1.
D-006 stays as written.

**Why.** The owner found the open list, selected row, placeholder and link
hover louder than the content they sit against. Rejected: darkening only the
pointed-at components, or adding intermediate primitives.

**Status.** accepted · 2026-09-11 · owner (accepted as implemented after
review). Supersedes D-023 only for `surface.raised` (`#241010`),
`interaction.selection.bg` (`#911410`) and `text.placeholder` (`#bd787d`).

## D-029 Readable terminal and code reds

**Decision.** `default` carries a readable heritage sixteen: each slot below
the text floor keeps its hue and saturation and gains HSL lightness, in the
heritage light-to-dark order. Slot 8 (bright black) stays the dim tier. Slots
0, 2, 3, 5, 7 and 11 already passed.

| slot | heritage | default profile |
| --- | --- | --- |
| 1 | `#c81a1a` | `#e84b4b` |
| 4 | `#8c1212` | `#e53131` |
| 6 | `#9e474a` | `#bb696c` |
| 8 | `#7d1310` | `#b71c17` (dim tier) |
| 9 | `#ab1612` | `#ea3833` |
| 10 | `#ad2721` | `#dc4f49` |
| 12 | `#871f19` | `#db433a` |
| 13 | `#e82132` | `#ed5360` |
| 14 | `#e0292f` | `#e6565a` |
| 15 | `#a3676b` | `#b17e81` |

Syntax reds lift: `code.syntax.keyword` and `tag` to `#f7463c`
(`color.primitive.red.860`), `property`, `heading` and `invalid` to `#e95551`
(`color.primitive.red.810`). Interface reds are unchanged. New role
`color.terminal.prompt-text` colours the prompt's path segment. Rule:
`spec/foundations.md`, Code and terminal.

**Why.** In Orca, Claude Code and Codex the owner found the reds right but too
dim: Claude Code's inline code uses slot 12, code-block keywords and Codex git
branches slot 4, both far under 3:1. Ten of the sixteen slots failed the text
floor, and programs, not the theme, pick the slot. Rejected: the heritage
slots, the `extended` palette (the owner keeps the red and rose families), a
gentle lift leaving slots 4 and 12 near 3:1, and an OKLCH lift (gamut clipping
drifts toward raspberry).

**Status.** accepted · 2026-09-26 · owner, who chose the values, asked for the
change and approved this entry by selecting them. Superseded in part by D-032:
slot 6 is coral `#ff7a66`, not `#bb696c`; the prompt gets
`color.terminal.prompt-bg` (heritage `#8c1212`) with `#ffa2a7` text in
`default`.

## D-030 Hued syntax roles for opt-in code highlighting

**Decision.** `default` gains opt-in `color.code.hued.*` roles carrying the
`extended` code hues; keywords, tags, comments, variables and punctuation keep
`code.syntax`. Consumers keep `code.syntax.*` unless a host opts in by mapping
`code.hued.*`, as the Codex port does. This extends D-001's code allowance to
these roles only; `extended` stays proposed. Rule: `spec/foundations.md`, Code
and terminal.

**Why.** The owner found Codex's code "too boring and single-coloured"; D-001
allowed code hues only in the proposed `extended` overlay, which is blocked
for delivery. Approving all of `extended` would reassign terminal slots too.

**Status.** accepted · 2026-09-26 · owner, who chose the extended hues.

## D-032 Coral slot 6 and a fixed prompt background

**Decision.**

- Slot 6 is coral `#ff7a66` (`color.primitive.coral.700`): warm and vivid,
  apart from the rose text, without taking amber's code role. Brightening it
  so that dimmed coral passes is ruled out.
- New role `color.terminal.prompt-bg` is heritage `#8c1212`
  (`color.primitive.ansi.4`) in every profile. `color.terminal.prompt-text` is
  bright rose `#ffa2a7` in `default` and `extended`, `#f4eeee` in
  `heritage-ansi`.

Rule: `spec/components/terminal.md`, Accessibility and Portability.

**Why.** Claude Code highlights fenced code with fixed ANSI slots: PowerShell
cmdlets took slot 6 (`#bb696c`, nearly the rose text), and dimmed types fell
far under the floor. Agnoster's directory segment sits on slot 4, which D-029
brightened, so its slot-7 text fell under 3:1; the owner's PowerShell shows
`#ffa2a7` on `#8c1212`, the look to keep. Rejected: peach `#ffab91`, blush
`#ffc2c5` or amber `#e0a84a` for slot 6; dark text on the bright slot 4; the
heritage palette in SSH shells (palettes should match across hosts).

**Status.** accepted · 2026-09-26 · owner, who saw both problems in real use and
chose the values. Supersedes D-029 in part.

## D-035 An accent surface for the user's own content

First recorded as D-034 and renumbered before merge, because PR #69 held D-033
and D-034.

**Decision.** New role `color.surface.accent` for the user's own content set
apart from neighbouring surfaces, such as outgoing chat messages, valued at a
new primitive `color.primitive.red.40` (`#3d0c0a`). Secondary text on it uses
`text.muted`, because `text.subtle` misses the floor there. Rule:
`spec/foundations.md`, Surfaces; port use in `spec/portability.md`, Native
ports.

**Why.** In live acceptance on Android and Windows the owner found their own
messages too hard to tell from other people's (`#241010` against `#160b0b`,
ΔE 7.4). Reusing `#2b0e0d` (ΔE 12.6) was still too subtle; from four options
rendered in real colours (`#241010`, `#2b0e0d`, `#330b09`, `#3d0c0a`) the
owner chose the deepest, just under the ceiling red links set. Not chosen:
`#330b09` (ΔE 18.6, though it keeps `text.subtle` readable); incoming on
`surface.default` (nearly merges with the wallpaper); `status.danger.tint`
(the wrong meaning).

**Status.** accepted · 2026-10-06 · owner, who saw the problem in real use,
rejected the first value after a second look, and chose `#3d0c0a` from the
side-by-side comparison.

## D-036 A translucent text-selection tint

First recorded as D-035 and renumbered before merge (see D-035).

**Decision.** New role `color.interaction.text-selection.tint` for hosts that
keep the text colour inside a selection, valued at a new primitive
`color.primitive.alpha.red-50`: the text-selection red `red.350` (`#911410`)
at 50%. Being translucent, it also suits hosts that paint the fill over their
content. Rule: `spec/foundations.md`, Interaction states; limits in
`spec/accessibility.md`, Limitations; port use in `spec/portability.md`,
Native ports.

**Why.** On Android the owner found selected text barely visible in the
message field: the 12% `interaction.marquee` was ΔE 5.2 from the field. The
first fix, opaque `interaction.selection.bg`, hid content on pinned Telegram
paths that paint the fill after it (rich-editor tables, captions and media
blocks; the rich-message translation preview, found by review r10) and was ΔE
10.2 on the outgoing bubble. The owner compared it with the tint at 40, 50 and
60% in the message field, both bubbles and a rich-editor photo, and chose 50%.
Rejected: 40% (ΔE 17.8 on the accent surface, near the 18.6 rejected for
bubbles); 60% (links lower still, media dimmer); opaque `text-selection.bg`
(rose text falls under the floor, because Android cannot recolour it). Review
r11 found the over-the-text limit after the owner's choice.

**Status.** accepted · 2026-10-06 · owner, who saw the problem in real use and
chose 50% from the side-by-side comparison after the review rejected the opaque
fill.

## D-039 Code and terminal backgrounds: two pairs, two scopes

**Decision.** Both pairs stay, with their values. `surface.code` and
`surface.terminal` (pure black, D-023) are what a static code block or a
terminal pane sits on; `code.bg` and `terminal.bg` (`#0c0909`) fill the inside
of an editor and a terminal's cell grid, where `terminal.bg` equals ANSI 0.
Rule: `spec/foundations.md`, Code and terminal.

**Why.** Both pairs carried the same descriptions ("Editor background",
"Terminal background") with different values, so a consumer could not tell
which to use. Rejected: merging into pure black, which changes the terminal
background of the four terminal ports (Claude Code, Ghostty, Orca, Warp) and
Obsidian's code background; merging into `#0c0909`, which partly reverses
D-023 and changes the code block Windows maps from `surface.code`.

**Status.** accepted · 2026-10-15 · owner, choosing "Keep both, scope them".

## D-009 Density modes

**Decision.** Density modes are tokens, set with `data-density` on any
subtree: `compact` matches the site, `comfortable` suits everyday
applications. Rule: `spec/foundations.md`, Spacing and density.

**Status.** proposed · 2026-09-06.

## D-033 Rose prose, semantic content headings and inherited bold

**Decision.** Interface, body and long-form prose use rose `#e99499`;
`text.prose` aliases `text.default`, and `text.bright` `#ffa2a7` stays for
brighter UI labels. New `text.heading` (content titles and H1–H6) and
`text.highlight` use the existing paper `#f4eeee`. Bold changes weight only
and inherits its semantic foreground.
Primary action labels are bright rose in every state; on-fill text keeps paper
`#f9faf9` where contrast needs it. Version 4.0.0 ships it; historical ANSI
slots, decision records, waivers and contrast floors are unchanged. Rule:
`spec/foundations.md`, Text ladder and Typography semantics; audit in
`docs/rose-typography-migration.md`.

**Why.** White prose and white bold overwhelmed the rose identity, and prose
was an ambiguous alias for white. Headings are distinguished by typography,
not by turning lower headings into body text. Rejected: Obsidian-only
overrides, white bold and rose lower headings.

**Status.** accepted · 2026-09-28 · owner, explicit instruction and implementation
plan approval. Supersedes earlier near-white prose descriptions and bright/red
content-heading assignments; updates D-026's primary foreground only.

## D-037 Display and title type sizes

**Decision.** Two type roles join the scale: `font.size.display` with
`font.line-height.display` (32/40) for page heroes and metric figures, and
`font.size.title` with `font.line-height.title` (24/32) for page titles above
h1. Portal pages use them instead of literal sizes; components keep h1–h3.
Rule: `spec/foundations.md`, Typography.

**Why.** The portal set 48, 32, 24, 22 and 18px outside the token scale. The
owner chose token sizes over shrinking every heading to h1 (planning,
2026-10-14), or page-local literal sizes.

**Status.** accepted · 2026-10-14 · owner (G2 authority review). The owner
asked for display type tokens in planning.

## D-038 Compact is the default density

**Decision.** `compact` is the default density for components, the site and
copied bundles: the density variables carry the compact values wherever no
`data-density` is set. `comfortable` stays available as an opt-in on any
subtree. The site chrome is compact.

**Why.** The owner, reviewing the redesigned site: "keep components compacted
by default, j3w1/theme default is compacted components", and "if it is not
stated that default is compaction, then standardize it in j3w1/theme". Before
this, only `[data-density]` blocks defined the variables, so unset subtrees fell
back to per-component values that were the comfortable ones.

**Status.** accepted · 2026-10-14 · owner (explicit instruction at the G1
design review). Builds on D-009 (proposed), which defines the two modes.

## D-006 Focus-ring rule

**Decision.** Two rings: controls and rows take a 1px dashed
`interaction.focus.ring`, focusable containers a 2px solid
`interaction.focus.ring-container`. On a fill the ring takes the on-fill text
colour; on invalid + focus it takes `ring-container` at the invalid offset;
forced colours use `Highlight`. Selection is a fill, focus a ring. Rule:
`spec/foundations.md`, Interaction states, rules 1–2.

**Why.** The red ring vanishes on red fills: `#E53935` on `#911410` falls
under 3:1.

**Status.** proposed · 2026-09-06. Clarified by D-015 (declared component ring
mappings on fills). Since D-027 a selected row (`#531310`, 3.38:1) takes the
ordinary ring.

## D-014 Automatic inline literal color previews

**Decision.** Every visible CSS hex literal on the spec page gets one
generated preview. The literal stays exact and is data, never inferred from a
token or screenshot. Only this preview may be round, patterned or animate its
radius. The browser suite tests copy fidelity and transparent, dark and light
previews with the syntax specimens `#f00`, `#f008`, `#ff0000`, `#ff000080`,
`#000000`, `#ffffff` (literal data, not roles). Rule: `spec/identity.md`, What
"modern" means here.

**Why.** Issue #1 asks for circular previews and a transparency checkerboard,
against the square and no-gradient rules.

**Status.** proposed · 2026-09-07 (formal log status remains owner-controlled).
Owner direction, 2026-09-07: the narrow exception explicitly approved,
implementation authorized.

### Follow the pointer hovering effect

Part of this exception only; the rules are in `spec/identity.md`, What
"modern" means here.

## D-015 Clarify component mappings exposed by consumption acceptance

**Decision.** Keep every appearance and token value, and settle three
contradictions found by Phase 2's composed acceptance. Ordinary confirmation
uses the primary tone; the destructive tone is for destructive actions. A
pressed primary button keeps `color.action.primary.border`, secondary and
tertiary take `color.border.active`, destructive keeps its declared border.
Filled controls keep their declared ring mappings. Nothing pending is
approved. Rule: `spec/foundations.md`, Interaction states, rule 2, and each
component's mapping.

**Why.** Phase 3 controls must not present an arbitrary interpretation as
canonical. Rejected: enforcing the generic prose everywhere, or marking the
affected workbench configurations unresolved.

**Status.** proposed · 2026-09-07. The owner directed application on 2026-09-07;
formal status remains owner-managed.

## D-024 Distinguish links from body text and headings

**Decision.** `color.text.link` maps to the existing strong red `#f73f35`,
keeping the red underline and the near-white hover text; visited links keep
colour and underline, and the historical profile keeps the old link. No new
primitive, hue, contrast exception or focus rule. Rule: `spec/foundations.md`,
Text ladder.

**Why.** In the implementation preview the owner asked for links more
distinguishable from normal text. Rejected: bright rose (then the heading
colour) and blue or purple (an unrelated hue).

**Status.** accepted · 2026-09-08 · owner, correcting D-023 for links only.
D-027 later moves link hover to `interaction.hover.bg`.

## D-025 Theme interactive controls throughout the portal and demo

**Decision.** The maintained select renders its single- and multiple-choice
lists in theme-owned DOM with the existing roles, following the select-only
combobox and multiple listbox patterns; the native select stays the form-value
and constraint source and the no-JavaScript fallback. The same enhancement
serves application controls, the portal, the Vue demo and copy bundles, and
themes input, button, checkbox, radio, range and file chrome; date and time
inputs get theme-owned editors. Browser system dialogs stay native; native
ports keep their mappings. The command field fills its dialog width below its
label. This supersedes, for enhanced web implementations, the select spec's
ban on replacing the host popup and the date/time host-popup descriptions.
Ships in 1.1.0. Rule: `spec/components/select.md`, `date-picker.md`,
`time-picker.md`; `docs/ui-consumption.md`.

**Why.** Seeing native blue selections in the work board and agent-kit picker,
the owner instructed: "replace mostly all native components like `<select>` we
must use all j3w1 themed", and asked for a properly proportioned
command-search field. Rejected: advisory option CSS (keeps the blue
selection) and one-off dropdowns (duplicate behaviour).

**Status.** accepted · 2026-09-09 · owner.

## D-040 One contrast focus ring for fills and invalid fields

**Decision.** A composite role, `focus.ring-contrast`: the 1px dashed control
ring in `interaction.focus.ring-container`. Controls on a fill (checked,
mixed, primary) and invalid fields beside the danger border use it wherever
the ordinary red ring would merge with what is under or beside it; containers
keep `focus.ring-container`. Rendering is unchanged. Rule:
`spec/foundations.md`, rule 2 and the state table.

**Why.** Twelve component stylesheets wrote the same ring out longhand. A role
names it once for every consumer and port. Rejected: keeping it written out;
`focus.ring-on-fill`, which would misname the eight invalid-field uses.

**Status.** accepted · 2026-10-15 · owner, choosing a new role and then the
name `focus.ring-contrast` for all twelve uses. Builds on D-006 (proposed).

## D-016 Pinned release comparison report and historical rendering

**Decision.** A release comparison report (schema version 1) records both
immutable revisions, profile and input digests, separate semantic change
categories, dependency evidence and unsupported historical inputs. Reports
and historical specimen renderings are build artifacts in `dist/releases/`.
History is read from Git, never executed or imported; the shared renderer
draws each side's maintained markup and styles, a reconstruction rather than
evidence that old JavaScript or a port ran. Browser captures are run evidence;
missing evidence stays not run. A rename needs an explicit mapping naming
both revisions. No design value, eligibility rule or verification status
changes. The rules stay here: no spec section covers release comparison.

**Why.** Run metadata must stay out of deterministic exports, and today's
rules must not read missing historical fields. Rejected: a raw file diff (no
semantic categories) and running historical applications (a wider trust
boundary).

**Status.** proposed · 2026-09-08. Issue #2 authorizes derived release
diagnostics; formal status and all theme approvals remain owner-managed.

## D-017 Private framework parity evidence

**Decision.** An independently authored private harness takes an
operator-supplied licensed target and an explicit licence review, copies only
declared template inputs into a new private fixture, uses synthetic examples,
and records exact theme, template, framework, dependency and fixture
identities. It never writes to the target; captures, copied vendor inputs and
detailed results stay private; missing prerequisites give not-run output. A
successful run is not a verified port or a claim of visual parity. The rules
stay here: no spec section covers the harness.

**Why.** Rejected: a public vendor copy (breaks the licence boundary) and a
generic mock (would pose as template evidence).

**Status.** proposed · 2026-09-08. Issue #3 authorizes the harness; approval
statuses and license boundaries are unchanged.

## D-019 One-way namespaced Figma Variables bridge

**Decision.** A one-way bridge from a pinned revision to Figma Variables:
colours and scalar spacing and radius values with their aliases, in one
collection and one mode. Dry-run is read-only and apply explicit; receipts
kept outside Figma guard every update and rollback. Rule:
`spec/figma-bridge.md`.

**Why.** Rejected: manual duplicate maintenance, a paid-only REST workflow,
and flattening aliases or composites.

**Status.** proposed · 2026-09-08. Issue #15 authorizes this bounded adapter;
approval and eligibility follow the canonical source.

## D-020 Bounded local validation and recovery workflow

**Decision.** One executable validation and recovery pattern (editing,
invalid, review, busy, success) built from the existing admin-form, field,
alert and button rules: validation on explicit submission, values kept, a
separate simulated completion, no request. Rule: `spec/form-patterns.md`.

**Why.** Rejected: a colour-only invalid snapshot, validation on every
keystroke, and a submit click treated as a successful save.

**Status.** proposed · 2026-09-08. Issue #16 authorizes one pattern from
existing admin-form, field, alert and button rules, without new palette roles.

## D-021 Local form composition with versioned data

**Decision.** A local form builder for five canonical field kinds, added,
edited, removed and reordered with buttons. Definitions, preview values and
validation state stay separate; JSON import is bounded and download holds
definitions only. Rendering and validation reuse D-020. A draft reference
component, not a backend platform or native port. Rule:
`spec/components/form-builder.md`.

**Why.** Rejected: arbitrary HTML or schema execution, a conditional workflow
engine, and a second field implementation.

**Status.** proposed · 2026-09-08. Issue #19 authorizes the deferred
form-builder demonstration.

## D-022 Local visual selection before agent implementation distribution

**Decision.** Before canonicalisation a local harness compares exactly three
explicit token overlays with Current, using the shared specimen rendering and
an original Vue composition. Overlays, reports and review builds stay
ignored, never public profiles. Numbers and browser evidence approve nothing:
the owner selects a candidate. Rule: `docs/phase6-visual-review.md`.

**Why.** Agents need installable or copyable components with complete
dependencies and pinned contracts, shared by the package, the portal and the
Vue application. Rejected: productising the old palette first, unapproved
preview profiles, and appearance-only snippets.

**Status.** proposed · 2026-09-08. Issue #37 and the owner's implementation
instruction authorize three local candidates; design approval remains
owner-managed. The selection is D-023.

## D-018 Declared port capabilities and fresh import evidence

**Decision.** Ports declare per-role capabilities in an optional
`capabilities.json`, and a `verified` port needs a fresh real import bound to
its current inputs. Rule: `spec/portability.md`, Native ports.

**Why.** Rejected: a hand-maintained support matrix, and a parse treated as an
import.

**Status.** proposed · 2026-09-08. Issue #14 authorizes a derived mapping
explorer; it creates no port, changes no host capability and approves no
profile.

## D-034 Versioned Windows native and Windhawk adapters

**Decision.** A Windows port uses native settings where sufficient and pinned
Windhawk 2.0 alpha 6 stylers solely as rendering adapters for canonical
semantic tokens: a bounded exception to the ban on unsupported injection. No
binary patching, shell replacement, paid tool or third-party theme; unknown
shell versions or structures fail closed. Its lifecycle (pinned install and
update, verification, original-state restore, rollback, removal of owned
assets) preserves user shortcuts, window management, layouts and desktop
icons. Rule: `spec/portability.md`, Scope of a port; `ports/windows/README.md`.

**Why.** Native settings cannot represent the full black/rose shell identity,
and the owner accepted the pinned prerelease to use its upstream CLI.
Rejected: private storage edits and UI automation (less reproducible), and
binary theme patching.

**Status.** accepted · 2026-09-28 · owner, explicit implementation plan approval.
