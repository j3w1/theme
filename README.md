# j3w1 UI Theme Spec

**Warm-black surfaces. Rose text. Red focus. One monospace family. Square components.**

This repository is the canonical, versioned specification of the j3w1 visual
identity, so that people and AI agents can implement it consistently in
websites, application interfaces, editors, terminals and native theme
formats. It publishes one long visual reference page at
**https://j3w1.github.io/theme/** and machine-readable exports for agents.

<!-- version:start -->
Specification version **0.1.0** (release; default: approved, heritage-ansi: heritage, extended: proposed).

Use the pinned approved default profile. Pending roles in that profile use-and-report their decision IDs; this does not approve them. Proposed profiles are preview-only and blocked for delivery. Heritage profiles are historical-only. Deprecated or heritage roles are blocked for new approved-profile mappings. Consume roles within their documented scope, never primitives. Release numbering does not approve profiles or tokens.
<!-- version:end -->

Approval and consumption eligibility are separate; see the policy above and
`spec/decisions.md` D-013.

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
| `color.surface.canvas` | `#0c0909` | observed; use | Page and terminal background. |
| `color.surface.default` | `#160b0b` | observed; use | Panels and cards. |
| `color.surface.raised` | `#241010` | observed; use | Sticky headers, menus, popovers. |
| `color.text.default` | `#e99499` | observed; use | Interface and body text (8.65:1 on canvas). |
| `color.text.bright` | `#ffa2a7` | observed; use | Headings, emphasis, links. |
| `color.text.prose` | `#f4eeee` | observed; use | Long-form reading text. |
| `color.text.muted` | `#bd787d` | observed; use | Secondary text; the darkest colour permitted for chrome text (5.81:1). |
| `color.text.subtle` | `#ad7175` | approved; use | Metadata, comments, line numbers (5.10:1). |
| `color.border.control` | `#a3676b` | proposed; use-and-report (D-007) | Form-control boundary (4.45:1, meets the 3:1 non-text minimum). |
| `color.border.default` | `#531310` | observed; use | Decorative border (1.39:1; never the only edge of a control). |
| `color.interaction.focus.ring` | `#e53935` | observed; use | 1px dashed focus ring on controls and rows. |
| `color.interaction.selection.bg` | `#911410` | observed; use | Selected row, tab, workspace. |
| `color.action.primary.bg` | `#871f19` | observed; use | Primary button fill (color12). |
| `color.status.danger.text` | `#f73f35` | observed; use | Danger text (5.40:1). |
| `color.status.warning.text` | `#c9973f` | approved; use | Warning text (7.54:1). |
| `color.status.success.text` | `#86a46f` | approved; use | Success text (7.13:1). |
| `color.status.info.text` | `#7e9ebb` | approved; use | Info text (7.08:1). |
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

Matrix rendering uses `scripts/lib/specimen-markup.mjs` for native state
attributes and hidden-cell focus handling. Its parsed ID-reference rewriting
is shared with recipe instances through `scripts/lib/markup.mjs`; recipes
reject unresolved local references, while matrices retain their documented
fixture links. Keep these transformations shared when adding specimen tools.
The [component workbench](https://j3w1.github.io/theme/workbench/) provides
live controls for button, text field, checkbox, tabs and dialog, plus table
and sidebar navigation previews. Choose a maintained variant and initial
state, then inspect real iframe widths, density, language and RTL behavior.
Comparison frames can use different environments. The anatomy inspector
separates declared roles, resolved values and browser measurements; it reports
mismatches without correcting the specimen. Forced visual states are labeled
and do not substitute for keyboard interaction or form validation.

Contrast comparisons use the existing unrounded contrast engine. Choose the
declared pair or an explicit text/UI context and opaque underlay; eligibility
and waivers remain separate from the numeric result. Motion controls replay
only maintained transitions, with static endpoints and reduced motion taking
precedence. These diagnostic tools do not certify accessibility.

Copy a configuration or preview link to reproduce its initial state. Links
identify the actual build and source digest; unavailable revisions are reported
with a pinned source link. Entered specimen text is excluded unless explicitly
included in the displayed share payload. Nothing is saved to browser storage.
Component and token pages also link to a reviewed public issue draft. Drafts
include the actual build, profile and public anchor, and always omit entered
specimen text. If a draft exceeds the 8,000-character portable URL budget,
copy it and paste it into GitHub's composer. Opening the composer never submits
an issue. Canonical specimens, normative content and direct reporting links
remain available without JavaScript.

`schemas/playground.mjs` defines closed configuration choices, and
`site/workbench.json` binds controls to maintained specimen parts. The build
validates each binding in every variant. Preview routes and state matrices
share the parsed renderer; add new bindings and coverage rather than creating
another specimen implementation.

### Choosing a semantic role

Use the [token usage explorer](https://j3w1.github.io/theme/tokens/) or follow
a token-name link from the specification. Filter by documented role group,
component, part, state, variant, profile, status and surface. All selected
usage facets must match the same declaration; an unknown relationship has no
match. Exact path, CSS-variable and hex searches remain available, and equal
values retain their separate roles. Filter URLs can be shared; the explorer
does not store preferences or submit searches to a service.

Each token has a persistent page with all profile values, eligibility,
pending decisions, alias dependencies, provenance, component/port references
and contrast declarations. Profile tables and details remain readable without
JavaScript. Copy controls copy the role path or CSS variable. Source links in
hosted builds use the build's full commit and parsed source line; local builds
show checkout-relative locations without claiming a published revision.

Agents can optionally fetch `exports/token-usage.json` at the same pinned
revision as the other contracts. This schema-version-1 reverse index is
generated from source mappings, not colour similarity. Variant references are
included only when a mapped part's prefix equals a declared variant id.
Missing port consumers remain unknown. The usage index is digest-covered and
uses `schemas/json/token-usage.schema.json`; regenerate it with the ordinary
`npm run generate` workflow after editing source mappings.

### Standalone component recipes

The [recipe source viewer](https://j3w1.github.io/theme/recipes/) packages the
default button, text-field and dialog directly from maintained demo and CSS
sources. Each component section links to its source and standalone HTML.
Download `example.html` to run without Astro, or include `tokens.css`,
`foundation.css` and `component.css` in order with `markup.html`.

Styles stay inside `.j3w1-recipe`; choose a unique instance prefix in the
viewer for each copy. Labels and ARIA references are rewritten together.
`two-instances.html` demonstrates coexistence. The dialog is an open visual
reference: modal lifecycle, close actions, focus trapping and focus return
remain host responsibilities. No behavior module or font binary is bundled.

`site/recipes.json` declares the inputs; `npm run generate` writes and
drift-checks `exports/recipes/`. Source and output digests identify the exact
bytes. Consume these paths at one pinned commit; the hosted viewer exposes
its supplying revision. Recipe markup retains the specimen's CC BY 4.0
license and attribution; CSS retains MIT notices. See each recipe's manifest,
README and LICENSE for dependencies, pending decisions and limitations.

Browser checks default to port 4173. When another checkout is testing, set
`PW_PORT` to a free port before `npm run test:browser` and
`npm run test:verification`; both use the same server configuration. For
example, PowerShell: `$env:PW_PORT = '4174'`; POSIX shells:
`PW_PORT=4174 npm run test:browser`. Finish the build before starting tests.

### Task-scoped implementation kits

Use the [task-kit builder](https://j3w1.github.io/theme/kit/) to select
components, describe the authorized task and supply an integration ID,
version and kind. Download a ZIP or copy the complete Markdown package.
Inputs stay in the browser; no model service, backend or persistence is used.
Without JavaScript, use the CLI from a checkout at a committed revision:

```sh
npm run task:kit -- --components text-field,checkbox,button,dialog --task "Implement a settings form" --integration-id settings --integration-version 1 --out ../settings-kit
```

The CLI defaults to the current full commit; `--ref` accepts a full commit or
release tag, never a branch. It reads every input from that Git revision.
The browser embeds its source revision and expected file digests, then rejects
mixed deployment bytes. A pinned build requires committed generated inputs
and `GITHUB_SHA` set to that full commit. An ordinary unpinned local build
shows the workflow but disables packaging.

Standard mode includes available standalone recipes. `--mode minimal` omits
only optional recipes. Both retain the selected JSON/specification contracts,
all shared global rules and foundations, required token/alias closure, the
consumer contract, lock schema and bounded prompt. Unselected component
briefs are removed from the derived compact file. `KIT.json` distinguishes
upstream hashes from derived compact/subset hashes. The lock's `resolvedAt`
is the source commit timestamp, making repeated inputs deterministic; an
empty initial deviation list does not certify a downstream implementation.

Output must be a new local directory under an existing, non-redirected parent.
Existing destinations, symbolic links, Windows reparse points and unsafe file
names fail closed. The writer never recursively erases a destination; a failed
write preserves partial output for inspection. Keep the user-owned parent
stable while writing; this is not an OS sandbox against concurrent mutation.
The legacy `consumption:kit` command now uses the same writer and refuses
existing directories. Its default path and `--strict` omission of
`tokens.resolved.json` are unchanged; select a new `--out` for each rerun.

The original [single-component protocol](tests/consumption/PROTOCOL.md) and
the [composed task-kit protocol](tests/consumption/TASK-KITS.md) remain separate
acceptance exercises. A generated kit does not execute an agent or prove that
the consumer's implementation conforms.

## Repository map

| Path | Owns |
| --- | --- |
| `theme.json` | Versions, profiles and their statuses, entry points, export map, site URL and base path, licence map |
| `tokens/` | Exact values (`primitives`), semantic roles (`semantic`), non-colour foundations, and profile overrides — DTCG 2025.10 format, supported scope declared in the manifest |
| `spec/` | Identity, foundations, accessibility, portability, the decision log, `families.json`, `contrast.json`, and one Markdown file plus one demo fragment per component |
| `agents/consume.md` | How to apply the theme elsewhere |
| `schemas/` | zod schema factories shared by the scripts and the site; `schemas/json/` is generated |
| `scripts/` | Validators and generators (`npm run validate`, `npm run generate`, `npm run check`) |
| `exports/` | Generated, committed: resolved tokens, semantic usage index, CSS custom properties, contrast report, coverage ledger, per-component JSON and briefs, compact and full Markdown, `llms.txt`, digests |
| `site/` | The Astro source of the single-page specification and token tools, built to `dist/` and deployed to `/theme/` by CI |
| `references/` | Pinned provenance, catalogued historical implementations, excerpts, and any reference screenshots with their provenance |
| `ports/` | Native application ports, when they exist, each with a manifest, mapping, artifacts and evidence |
| `templates/` | Starting points for a port, a component and the fresh-agent consumption task |
| `tests/` | Source tests, `dist/` tests, browser tests, consumption fixtures |

## Application ports

The [capability explorer](https://j3w1.github.io/theme/ports/) derives its
summary, role-to-native-key rows, artifact links and evidence state from the
same committed port inputs. `exports/port-capabilities.json` is digest-covered
and included in task kits. It distinguishes mapped, inherited, unsupported,
out-of-scope and not-implemented roles from import verification. Legacy
unmapped roles keep their reason without a guessed classification. An empty
catalogue publishes no application support.

See `ports/README.md` for optional capability metadata and the exact evidence
fingerprint. A stale artifact token digest hides its claimed resolved values;
changing targets, mappings, capabilities or artifact bytes invalidates import
evidence. Static tables and JSON remain available without JavaScript.

### Private framework parity

`npm run parity:private` prints a useful **not run** prerequisite record when
no licensed target is supplied. Public validation, builds and browser tests
never require a private target. To run the bounded seven-component experiment,
follow [the private harness protocol](templates/private-parity/README.md) and
pass an operator-owned JSON file outside this repository:

```sh
npm run parity:private -- --config /private/location/parity.json
```

The protocol validates actual installed versions against the target package
and lock, copies explicitly selected script/style inputs into a new private
directory, and captures native references and real framework controls with
recorded environment, input hashes, property differences and screenshots.
It never starts the target application's backend or runs its package scripts.
Completed diagnostics may report differences; they do not certify an
application port. Private sources, configuration and results stay outside Git
and the public site, including when verification fails.

<!-- ports:start -->
No native ports are published yet. Historical implementations are catalogued in `references/` and are not supported downloads.
<!-- ports:end -->

## Component coverage

*Specified* means the component's specification validates; *demonstrated*
means its demo renders every declared variant on the site; *test implemented* means a
browser test exists for it. Actual outcomes are published separately in the
linked verification report, with exact scope, configuration and digests. The ledger is generated from the sources.

<!-- coverage:start -->
| Component | Family | Priority | Specified | Demonstrated | Test implemented |
| --- | --- | --- | --- | --- | --- |
| `admin-form` | composed | R1 | yes | yes | — |
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
| `filterable-table` | composed | R1 | yes | yes | — |
| `i3-window-frame` | composed | R1 | yes | yes | — |
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
| `settings-panel` | composed | R1 | yes | yes | — |
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
