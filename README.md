# j3w1 UI Theme Spec

**Warm-black surfaces. Rose text. Red focus. One monospace family. Nothing rounded.**

This repository is the canonical, versioned specification of the j3w1 visual
identity, so that people and AI agents can implement it consistently in
websites, application interfaces, editors, terminals and native theme
formats. It publishes one long visual reference page at
**https://j3w1.github.io/theme/** and machine-readable exports for agents.

<!-- version:start -->
Specification version **0.1.0-draft.1** (default: approved, heritage-ansi: heritage, extended: proposed).
<!-- version:end -->

> Pre-release. Values marked **PROPOSED** on the site and in the exports are
> not approved; see `spec/decisions.md`.

## What this is, and what it is not

`j3w1/theme` **defines** the theme: exact tokens, semantic roles, interaction
states, accessibility constraints, component specifications and portability
rules. `j3w1/j3w1.github.io` **demonstrates** it as a working i3-inspired web
workstation and will later consume a pinned release. This repository is not a
component library, not a copy of a purchased admin template, and not a backup
of anyone's dotfiles. A themed table on the site is a specification specimen,
not a promise to maintain a data-grid product.

## Where it came from

The palette began on a Manjaro i3 workstation preserved in
[`j3w1/1w3j`](https://github.com/j3w1/1w3j): a pywal ramp pulled from a red
wallpaper, frozen and hand-tuned slot by slot in `config/Xresources` while
watching what `ls`, vim and the shell prompt rendered. The i3 configuration
supplied the idiom: 1px pixel borders, 14/−2 gaps, tabbed layouts, a hidden
top bar with Chinese status labels, dunst toasts, dmenu selections. The
contemporary reference is
[`j3w1/j3w1.github.io`](https://github.com/j3w1/j3w1.github.io), whose
stylesheet named the roles adopted here. Both are pinned by revision in
`references/sources.json`; historical ports (a gedit scheme, an IntelliJ
scheme, tmux, browser extensions) are catalogued in
`references/catalogue.json` as evidence, not downloads.

## The identity in seven values

<!-- tokens:start -->
| Role | Value | Status | Use |
| --- | --- | --- | --- |
| `color.surface.canvas` | `#0c0909` | observed | Page and terminal background. |
| `color.surface.default` | `#160b0b` | observed | Panels and cards. |
| `color.surface.raised` | `#241010` | observed | Sticky headers, menus, popovers. |
| `color.text.default` | `#e99499` | observed | Interface and body text (8.65:1 on canvas). |
| `color.text.bright` | `#ffa2a7` | observed | Headings, emphasis, links. |
| `color.text.prose` | `#f4eeee` | observed | Long-form reading text. |
| `color.text.muted` | `#bd787d` | observed | Secondary text; the darkest colour permitted for chrome text (5.81:1). |
| `color.text.subtle` | `#ad7175` | approved | Metadata, comments, line numbers (5.10:1). |
| `color.border.control` | `#a3676b` | proposed | Form-control boundary (4.45:1, meets the 3:1 non-text minimum). |
| `color.border.default` | `#531310` | observed | Decorative border (1.39:1; never the only edge of a control). |
| `color.interaction.focus.ring` | `#e53935` | observed | 1px dashed focus ring on controls and rows. |
| `color.interaction.selection.bg` | `#911410` | observed | Selected row, tab, workspace. |
| `color.action.primary.bg` | `#871f19` | observed | Primary button fill (color12). |
| `color.status.danger.text` | `#f73f35` | observed | Danger text (5.40:1). |
| `color.status.warning.text` | `#c9973f` | approved | Warning text (7.54:1). |
| `color.status.success.text` | `#86a46f` | approved | Success text (7.13:1). |
| `color.status.info.text` | `#7e9ebb` | approved | Info text (7.08:1). |
<!-- tokens:end -->

Three bounded hues (amber, green, blue) exist for status, diagnostics and diffs
only (decision D-001). They are forbidden in surfaces, chrome, buttons, links
and selections. Syntax highlighting stays monochrome in the default profile.

## Profiles

| Profile | Status | Purpose |
| --- | --- | --- |
| `default` | approved | The everyday composition every implementation targets. |
| `heritage-ansi` | heritage | The sixteen historical terminal slots and assignments, exact, including the ones that fail the contrast floor. |
| `extended` | proposed | Semantic hues for syntax, a full sixteen-slot terminal palette that reaches 4.5:1, coloured chart series. |

## Using the theme

**People:** open the site. Everything normative is on one page: foundations,
every component with its states, composed specimens, stress fixtures,
non-examples, the contrast report and the coverage ledger.

**Agents:** do not read the site. Pin a tag or commit and follow
[`agents/consume.md`](agents/consume.md): read `theme.json`, then
`exports/theme.compact.md`, then the `exports/components/<id>.json` you need,
record `theme.lock.json`, and report deviations. `exports/llms.txt` is a
discovery index for tools that look for one.

**Contributors:** read [`AGENTS.md`](AGENTS.md). `CLAUDE.md` imports it.

## Repository map

| Path | Owns |
| --- | --- |
| `theme.json` | Versions, profiles and their statuses, entry points, export map, site URL and base path, licence map |
| `tokens/` | Exact values (`primitives`), semantic roles (`semantic`), non-colour foundations, and profile overrides — DTCG 2025.10 format, supported scope declared in the manifest |
| `spec/` | Identity, foundations, accessibility, portability, the decision log, `families.json`, `contrast.json`, and one Markdown file plus one demo fragment per component |
| `agents/consume.md` | How to apply the theme elsewhere |
| `schemas/` | zod schema factories shared by the scripts and the site; `schemas/json/` is generated |
| `scripts/` | Validators and generators (`npm run validate`, `npm run generate`, `npm run check`) |
| `exports/` | Generated, committed: resolved tokens, CSS custom properties, contrast report, coverage ledger, per-component JSON and briefs, compact and full Markdown, `llms.txt`, digests |
| `site/` | The Astro source of the single page, built to `dist/` and deployed to `/theme/` by CI |
| `references/` | Pinned provenance, catalogued historical implementations, excerpts, and any reference screenshots with their provenance |
| `ports/` | Native application ports, when they exist, each with a manifest, mapping, artifacts and evidence |
| `templates/` | Starting points for a port, a component and the fresh-agent consumption task |
| `tests/` | Source tests, `dist/` tests, browser tests, consumption fixtures |

## Application ports

<!-- ports:start -->
No native ports are published yet. Historical implementations are catalogued in `references/` and are not supported downloads.
<!-- ports:end -->

## Component coverage

*Specified* means the component's specification validates; *demonstrated*
means its demo renders every declared variant on the site; *tested* means a
browser test exists for it. The ledger is generated from the sources.

<!-- coverage:start -->
| Component | Family | Priority | Specified | Demonstrated | Tested |
| --- | --- | --- | --- | --- | --- |
| `alert` | feedback | R1 | yes | yes | — |
| `badge` | display | R1 | yes | yes | — |
| `breadcrumbs` | navigation | R1 | yes | yes | — |
| `button` | actions | R1 | yes | yes | yes |
| `card` | display | R1 | yes | yes | — |
| `checkbox` | forms-basic | R1 | yes | yes | yes |
| `chip` | display | R1 | yes | yes | — |
| `code-editor` | developer | R1 | yes | yes | — |
| `combobox` | forms-advanced | R1 | yes | yes | — |
| `data-table` | display | R1 | yes | yes | — |
| `date-picker` | forms-advanced | R1 | yes | yes | — |
| `diagnostics` | developer | R1 | yes | yes | — |
| `dialog` | feedback | R1 | yes | yes | yes |
| `diff-view` | developer | R1 | yes | yes | — |
| `drawer` | feedback | R1 | yes | yes | — |
| `empty-state` | feedback | R1 | yes | yes | — |
| `field` | forms-basic | R1 | yes | yes | — |
| `fieldset` | forms-basic | R1 | yes | yes | — |
| `file-input` | forms-advanced | R1 | yes | yes | — |
| `icon-button` | actions | R1 | yes | yes | — |
| `link` | actions | R1 | yes | yes | yes |
| `list` | display | R1 | yes | yes | — |
| `loading-indicator` | feedback | R1 | yes | yes | — |
| `menu` | navigation | R1 | yes | yes | yes |
| `number-field` | forms-basic | R1 | yes | yes | — |
| `pagination` | navigation | R1 | yes | yes | — |
| `progress` | feedback | R1 | yes | yes | — |
| `radio-group` | forms-basic | R1 | yes | yes | yes |
| `search-field` | forms-basic | R1 | yes | yes | — |
| `select` | forms-basic | R1 | yes | yes | yes |
| `sidebar-nav` | navigation | R1 | yes | yes | — |
| `skip-link` | navigation | R1 | yes | yes | — |
| `switch` | forms-basic | R1 | yes | yes | — |
| `table` | display | R1 | yes | yes | yes |
| `tabs` | navigation | R1 | yes | yes | yes |
| `terminal` | developer | R1 | yes | yes | — |
| `text-field` | forms-basic | R1 | yes | yes | yes |
| `textarea` | forms-basic | R1 | yes | yes | — |
| `time-picker` | forms-advanced | R1 | yes | yes | — |
| `toast` | feedback | R1 | yes | yes | — |
| `toolbar` | navigation | R1 | yes | yes | — |
| `tooltip` | feedback | R1 | yes | yes | — |
| `wizard` | forms-advanced | R1 | yes | yes | — |
<!-- coverage:end -->

## Versioning

Semantic versioning over the contract, not the code. **Major:** removing or
renaming a role, changing an approved value or its meaning, removing a
component or state, incompatible export or lock schema. **Minor:** new roles,
components, states, variants or profiles; promoting proposed to approved.
**Patch:** prose, generation, test and site fixes, evidence updates. Every
global appearance change gets a changelog entry and a downstream impact note.
Releases are tags; consumers pin them.

## Licence

MIT for code, tokens, schemas, scripts and generated JSON/CSS; CC BY 4.0 for
specification prose and specimens; reference screenshots all rights reserved.
See [`LICENSE.md`](LICENSE.md). No fonts are distributed; the recommended
family is named in `theme.json`.
