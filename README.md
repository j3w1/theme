# j3w1 UI Theme Spec

**True-black canvas. Near-black surfaces. Rose text. Red focus. Square components.**

This repository is the versioned specification of the j3w1 look. People and AI
agents use it to build the same theme in websites, apps, editors, terminals and
native theme formats. It publishes:

- a design-system portal: **https://j3w1.github.io/theme/**;
- the complete static specification: **https://j3w1.github.io/theme/reference/**;
- an independently written [Vue demo](https://j3w1.github.io/theme/demo/);
- machine-readable exports for agents.

<!-- version:start -->
Specification version **2.0.0** (release; default: approved, heritage-ansi: heritage, extended: proposed).

Use the pinned approved default profile. Pending roles in that profile use-and-report their decision IDs; this does not approve them. Proposed profiles are preview-only and blocked for delivery. Heritage profiles are historical-only. Deprecated or heritage roles are blocked for new approved-profile mappings. Consume roles within their documented scope, never primitives. Release numbering does not approve profiles or tokens.
<!-- version:end -->

Approval and consumption eligibility are separate; see the policy above and
`spec/decisions.md` D-013.

## Application theme downloads

Theme files for apps, ready to import. Each file link is pinned to this
version's release tag, and the site serves the same file from its **download**
link. Each port's README under `ports/` gives scope, limits and rollback.
Declared status and import evidence are explained under
[Application ports](#application-ports).

<!-- downloads:start -->
| Application | File (theme 2.0.0) | Also on the site | Install | Status |
| --- | --- | --- | --- | --- |
| ChatGPT desktop app (Appearance) | [presets.json](https://raw.githubusercontent.com/j3w1/theme/v2.0.0/ports/chatgpt/dist/presets.json) | [download](https://j3w1.github.io/theme/ports/chatgpt/presets.json) | Open ChatGPT > Settings > Appearance > Dark theme > Import and paste a preset's import string, or set the values in the preset's table by hand (see ports/chatgpt/README.md). | experimental; import evidence not verified |
| Claude Code (custom theme) | [j3w1.json](https://raw.githubusercontent.com/j3w1/theme/v2.0.0/ports/claude-code/dist/j3w1.json) | [download](https://j3w1.github.io/theme/ports/claude-code/j3w1.json) | Save as ~/.claude/themes/j3w1.json and set "theme": "custom:j3w1" in ~/.claude/settings.json; or run node ports/claude-code/install.mjs apply in a clone of this repository (see its README). | experimental; import evidence not verified |
| Codex CLI (tmTheme) | [j3w1.tmTheme](https://raw.githubusercontent.com/j3w1/theme/v2.0.0/ports/codex/dist/j3w1.tmTheme) | [download](https://j3w1.github.io/theme/ports/codex/j3w1.tmTheme) | Save as ~/.codex/themes/j3w1.tmTheme and set theme = "j3w1" under [tui] in ~/.codex/config.toml; or run node ports/codex/install.mjs apply in a clone of this repository (see its README). | experimental; import evidence not verified |
| Ghostty theme | [j3w1](https://raw.githubusercontent.com/j3w1/theme/v2.0.0/ports/ghostty/dist/j3w1) | [download](https://j3w1.github.io/theme/ports/ghostty/j3w1) | Save as ~/.config/ghostty/themes/j3w1 and add `theme = j3w1` to your Ghostty config. | experimental; import evidence not verified |
| Orca (Ghostty config import) | [config.ghostty](https://raw.githubusercontent.com/j3w1/theme/v2.0.0/ports/orca/dist/config.ghostty) | [download](https://j3w1.github.io/theme/ports/orca/config.ghostty) | Save as %APPDATA%\ghostty\config.ghostty (Windows) or ~/.config/ghostty/config.ghostty, then Orca → Settings → Terminal → Import from Ghostty → Apply Changes. | experimental; import evidence not verified |
| Warp theme YAML (also Orca's Import from YAML) | [j3w1.yaml](https://raw.githubusercontent.com/j3w1/theme/v2.0.0/ports/warp/dist/j3w1.yaml) | [download](https://j3w1.github.io/theme/ports/warp/j3w1.yaml) | Orca → Settings → Terminal Themes → Import from YAML (or save into %APPDATA%\warp\Warp\data\themes\ and use Import from Warp), then select "j3w1 theme" as the Dark Theme. Warp: save into its themes folder. | experimental; import evidence not verified |
<!-- downloads:end -->

To change how the theme looks, use [design mode](docs/design-mode.md)
(`npm run design`). It shows the real site, built at an anchored commit, next
to the live dev server, so you judge a change against what it replaces. It is
a working tool, not a gate.

History in brief:

- The owner chose **True Black / Rose** after the
  [local visual-foundation review](docs/phase6-visual-review.md). D-023 records
  the seven canonical surface changes; D-024 records the strong-red links the
  owner asked for next. See [the migration notes](docs/true-black-rose-migration.md)
  and [the delivery record](docs/phase6-delivery.md) for verification status.
- D-025 records the owner's request for themed controls across the portal and
  the Vue demo. Since version 1.1.0, single and multiple choices use j3w1
  surfaces and selection colors, keep their native form data and fallback, and
  come with a supported enhancement for existing app markup. The shared command
  palette puts a full-width search field under its label.

Forms and design tools:

- The [validation and recovery composition](https://j3w1.github.io/theme/patterns/validation-recovery/)
  and the [draft form builder](https://j3w1.github.io/theme/builder/) show local
  form behavior with canonical fields. Definitions are bounded, content-pinned
  JSON. Entered values never go into downloads or storage.
- The optional [Figma Variables bridge](https://j3w1.github.io/theme/figma/)
  is a reviewed one-way import with dry-run, explicit apply and rollback
  receipts. Generate its sample with
  `node scripts/figma-bridge.mjs --ref FULL_COMMIT_OR_RELEASE_TAG`.
- Limits and evidence: [form patterns](spec/form-patterns.md),
  [builder contract](spec/components/form-builder.md) and
  [bridge instructions](spec/figma-bridge.md).

## What this is, and what it is not

`j3w1/theme` **defines** the theme: exact tokens, semantic roles, interaction
states, accessibility limits, component specifications and portability rules.
The official `@j3w1/ui` package implements all 67 inventory entries with native
HTML, typed Custom Elements, per-component imports and complete copy
distributions. The [consumption instructions](docs/ui-consumption.md) cover the
package, copy and native mapping routes. `j3w1/j3w1.github.io` stays a separate
downstream app. No purchased template source or assets are included.

## Where it came from

The palette began on a Manjaro i3 workstation, preserved in
[`j3w1/1w3j`](https://github.com/j3w1/1w3j), and was named as web roles by
[`j3w1/j3w1.github.io`](https://github.com/j3w1/j3w1.github.io). The full
story is in `spec/identity.md`. Both sources are pinned by revision in
`references/sources.json`. Historical ports (a gedit scheme, an IntelliJ
scheme, tmux, browser extensions) are listed in `references/catalogue.json`
as evidence, not downloads.

## The identity in seven values

<!-- tokens:start -->
| Role | Value | Status | Use |
| --- | --- | --- | --- |
| `color.surface.canvas` | `#000000` | approved; use | Page and terminal background. |
| `color.surface.default` | `#100c0c` | approved; use | Panels and cards. |
| `color.surface.raised` | `#160b0b` | approved; use | Sticky headers, menus, popovers; D-027 recessed it so an open list reads as depth rather than a lighter panel. |
| `color.text.default` | `#e99499` | observed; use | Interface and body text. |
| `color.text.bright` | `#ffa2a7` | observed; use | Headings and emphasis. Links use color.text.link. |
| `color.text.prose` | `#f4eeee` | observed; use | Long-form reading text. |
| `color.text.muted` | `#bd787d` | observed; use | Secondary text; the darkest colour permitted for chrome text. |
| `color.text.subtle` | `#ad7175` | approved; use | Metadata, comments, line numbers. |
| `color.border.control` | `#a3676b` | proposed; use-and-report (D-007) | Form-control boundary (4.45:1, meets the 3:1 non-text minimum). |
| `color.border.default` | `#531310` | observed; use | Decorative border (1.39:1; never the only edge of a control). |
| `color.interaction.focus.ring` | `#e53935` | observed; use | 1px dashed focus ring on controls and rows. |
| `color.interaction.selection.bg` | `#531310` | approved; use | Selected row, tab, workspace; D-027 recessed the fill, leaving the 2px indicator and the check to carry selection. |
| `color.action.primary.bg` | `#7d1310` | approved; use | Primary button fill; D-026 darkened it off color12, which stays fixed as heritage ANSI 12. |
| `color.status.danger.text` | `#f73f35` | observed; use | Danger text (5.40:1). |
| `color.status.warning.text` | `#c9973f` | approved; use | Warning text (7.54:1). |
| `color.status.success.text` | `#86a46f` | approved; use | Success text (7.13:1). |
| `color.status.info.text` | `#7e9ebb` | approved; use | Info text (7.08:1). |
<!-- tokens:end -->

Three bounded hues (amber, green, blue) exist for status, diagnostics and diffs
(decision D-001), and for opt-in syntax themes through `code.hued.*` (D-030).
They are forbidden in surfaces, chrome, buttons, links and selections. The
reference syntax highlighting stays monochrome in the default profile.

## Profiles

| Profile | Status | Purpose |
| --- | --- | --- |
| `default` | approved | The everyday composition every implementation targets. |
| `heritage-ansi` | heritage | The sixteen historical terminal slots and assignments, exact, including the ones that fail the contrast floor. |
| `extended` | proposed | Semantic hues for syntax, a full sixteen-slot terminal palette that reaches 4.5:1, coloured chart series. |

## Using the theme

**People:** browse the portal's foundations, components, patterns and tools.
The full static reference keeps every state matrix, stress fixture,
non-example, contrast report and coverage ledger. Old homepage hashes redirect
to its sections.

**Agents:** use the deterministic artifacts. Pin a tag or commit, then follow
[`agents/consume.md`](agents/consume.md):

1. Read `theme.json`.
2. Read `exports/theme.compact.md`.
3. Read the `exports/components/<id>.json` files you need.
4. Record `theme.lock.json` and report deviations.

`exports/llms.txt` is a discovery index for tools that look for one. For the
official implementations, read `packages/ui/dist/index.json`, then the
`contracts/<id>.json` and `examples/<id>.json` you need. The installed
`j3w1-ui kit` command prepares bounded framework, package, copy or mapping
kits. npm publication is still an owner action; until then the portal offers
an installable tarball with integrity metadata.

**Contributors:** read [`AGENTS.md`](AGENTS.md). `CLAUDE.md` imports it.

### Tools on the portal

- **Shared specimen markup.** State matrices use
  `scripts/lib/specimen-markup.mjs` for native state attributes and hidden-cell
  focus handling. Its parsed ID-reference rewriting is shared with recipe
  instances through `scripts/lib/markup.mjs`. Recipes reject unresolved local
  references; matrices keep their documented fixture links. Keep these
  transformations shared when you add specimen tools.
- **[Component workbench](https://j3w1.github.io/theme/workbench/).** Live
  controls for button, text field, checkbox, tabs and dialog, plus table and
  sidebar navigation previews. Pick a maintained variant and starting state,
  then check real iframe widths, density, language and RTL. Comparison frames
  can use different environments. The anatomy inspector keeps declared roles,
  resolved values and browser measurements apart; it reports mismatches
  without correcting the specimen. Forced visual states are labelled and do
  not replace keyboard interaction or form validation.
- **Contrast comparisons** use the existing unrounded contrast engine. Pick
  the declared pair, or an explicit text/UI context and an opaque underlay.
  Eligibility and waivers stay separate from the number.
- **Motion controls** replay only maintained transitions. Static endpoints and
  reduced motion take precedence. These diagnostic tools do not certify
  accessibility.
- **Share links.** Copy a configuration or preview link to reproduce its
  starting state. Links name the actual build and source digest; a revision
  that is not available is reported with a pinned source link. Entered
  specimen text is left out unless you include it in the shown share payload.
  Nothing is saved to browser storage.
- **Issue drafts.** Component and token pages link to a reviewed public issue
  draft. A draft includes the actual build, profile and public anchor, and
  never includes entered specimen text. If a draft is longer than the
  8,000-character portable URL budget, copy it and paste it into GitHub's
  composer. Opening the composer never submits an issue.

Canonical specimens, normative content and direct reporting links all work
without JavaScript.

`schemas/playground.mjs` defines the closed configuration choices, and
`site/workbench.json` binds controls to maintained specimen parts. The build
checks each binding in every variant. Preview routes and state matrices share
the parsed renderer: add new bindings and coverage instead of writing another
specimen implementation.

### Choosing a semantic role

Use the [token usage explorer](https://j3w1.github.io/theme/tokens/), or follow
a token-name link from the specification.

- Filter by role group, component, part, state, variant, profile, status and
  surface. All selected usage filters must match the same declaration; an
  unknown relationship matches nothing.
- Exact path, CSS-variable and hex searches still work, and equal values keep
  their separate roles.
- Filter URLs can be shared. The explorer stores no preferences and sends no
  searches to a service.

Each token has its own page with every profile value, eligibility, pending
decisions, alias dependencies, provenance, component and port references, and
contrast declarations. Profile tables and details work without JavaScript.
Copy controls copy the role path or the CSS variable. In hosted builds, source
links use the build's full commit and the parsed source line; local builds show
checkout-relative locations and claim no published revision.

Agents can also fetch `exports/token-usage.json` at the same pinned revision as
the other contracts. This schema-version-1 reverse index comes from source
mappings, not from colour similarity.

- Variant references are included only when a mapped part's prefix equals a
  declared variant id.
- Missing port consumers stay unknown.
- The index is digest-covered and uses `schemas/json/token-usage.schema.json`.
  After you edit source mappings, regenerate it with `npm run generate`.

### Standalone component recipes

The [recipe source viewer](https://j3w1.github.io/theme/recipes/) packages the
default button, text-field and dialog straight from the maintained demo and
CSS sources. Each component section links to its source and standalone HTML.

1. Download `example.html` to run it without Astro, or include `tokens.css`,
   `foundation.css` and `component.css`, in that order, with `markup.html`.
2. Pick a unique instance prefix in the viewer for each copy. Labels and ARIA
   references are rewritten together. `two-instances.html` shows two copies
   side by side.

Styles stay inside `.j3w1-recipe`. The dialog is an open visual reference:
modal lifecycle, close actions, focus trapping and focus return are the host's
job. No behavior module or font binary is bundled.

`site/recipes.json` declares the inputs; `npm run generate` writes and
drift-checks `exports/recipes/`. Source and output digests name the exact
bytes. Use these paths at one pinned commit; the hosted viewer shows the
revision it came from. Recipe markup keeps the specimen's CC BY 4.0 licence and
attribution; CSS keeps its MIT notices. Each recipe's manifest, README and
LICENSE list its dependencies, pending decisions and limits.

Browser checks use port 4173 by default. If another checkout is testing, set
`PW_PORT` to a free port before `npm run test:browser` and
`npm run test:verification`; both use the same server configuration. For
example, PowerShell: `$env:PW_PORT = '4174'`; POSIX shells:
`PW_PORT=4174 npm run test:browser`. Finish the build before you start tests.

### Task-scoped implementation kits

With the [task-kit builder](https://j3w1.github.io/theme/kit/):

1. Select components.
2. Describe the authorized task and give an integration ID, version and kind.
3. Download a ZIP, or copy the complete Markdown package.

Inputs stay in the browser; no model service, backend or storage is used.
Without JavaScript, use the CLI from a checkout at a committed revision:

```sh
npm run task:kit -- --components text-field,checkbox,button,dialog --task "Implement a settings form" --integration-id settings --integration-version 1 --out ../settings-kit
```

- The CLI uses the current full commit by default. `--ref` takes a full commit
  or a release tag, never a branch. Every input is read from that Git revision.
- The browser embeds its source revision and the expected file digests, and
  rejects mixed deployment bytes. A pinned build needs committed generated
  inputs and `GITHUB_SHA` set to that full commit. An ordinary unpinned local
  build shows the workflow but turns packaging off.
- Standard mode includes the available standalone recipes; `--mode minimal`
  leaves out only the optional recipes. Both keep the selected JSON and
  specification contracts, all shared global rules and foundations, the
  required token/alias closure, the consumer contract, the lock schema and a
  bounded prompt. Briefs of unselected components are removed from the derived
  compact file.
- `KIT.json` keeps upstream hashes apart from the derived compact/subset
  hashes. The lock's `resolvedAt` is the source commit's timestamp, so the same
  inputs give the same output. An empty starting deviation list does not
  certify a downstream implementation.

Output must be a new local directory under an existing parent that is not
redirected. Existing destinations, symbolic links, Windows reparse points and
unsafe file names fail closed. The writer never erases a destination
recursively; a failed write leaves partial output for inspection. Keep the
parent directory stable while writing: this is not an OS sandbox against
concurrent changes. The legacy `consumption:kit` command uses the same writer
and refuses existing directories. Its default path and its `--strict`
omission of `tokens.resolved.json` are unchanged; pick a new `--out` for each
rerun.

The original [single-component protocol](tests/consumption/PROTOCOL.md) and
the [composed task-kit protocol](tests/consumption/TASK-KITS.md) are separate
acceptance exercises. A generated kit does not run an agent or prove that the
consumer's implementation conforms.

## Pinned release comparison

The [release comparison](https://j3w1.github.io/theme/releases/) compares two
published revisions from `site/releases.json`. The catalogue pins every tag to
its full commit and tells a release apart from a published commit checkpoint.
Builds need those Git objects locally (`fetch-depth: 0` in CI). Building and
viewing the comparison never fetch a moving branch.

```sh
npm run release:compare -- --from v0.1.0 --to b601998b3711dcd62949d497ed828af2089f9544 --out ../release-comparison
```

- Both arguments take only release tags or full commits. `--profile` picks one
  common historical profile.
- The output is a new directory under an existing parent that is not
  redirected, written by the same guarded writer as task kits. It holds
  JSON/Markdown migration reports and reconstructed before/after specimens.
- It never builds historical code, upgrades consumers or certifies a port.
- An optional `--migrations` JSON file follows the generated
  `release-migration` schema and names both commits plus explicit role renames.
  Equal values alone never imply a rename.

How the report reads history:

- Each historical export is checked against its own digest ledger. Missing or
  unsupported historical contracts stay unsupported.
- Missing usage indexes are disclosed; direct component/port mappings, where
  present, still give bounded dependency evidence. Missing historical
  eligibility fields stay unknown.
- Reports separate value, alias, status/decision, component/state,
  portability and appearance-source changes. "Known affected" means a declared
  dependency or contract changed, not an observed regression in an app.
  Unregistered consumers stay unknown, and an empty port catalogue stays empty.

The visual reference reuses the parsed specimen renderer with historical
markup/CSS for the workbench's seven components and their variants and states.
Both sides use 640 × 480 frames, comfortable density, LTR and static motion
endpoints. No historical JavaScript and no remote font or asset requests are
allowed. Fixture changes are disclosed; fonts depend on the shared browser and
machine. The frames are reconstructed references, not historical runtime
evidence. Browser tests capture matching specimens and attach their real
environment, while the report itself says truthfully that visual execution is
not run. Other engines, physical devices, manual accessibility and unlisted
component captures stay unverified. Report and specimen outputs live in
`dist/releases/`, outside the committed canonical exports, and are covered by
the ordinary built-artifact evidence.

To add a published revision, add a reviewed catalogue pin and pass the usual
generate/check/build/dist/browser/evidence gates. Adding a comparison changes
no palette and approves nothing. D-016 records the report schema boundary.

## Repository map

| Path | Owns |
| --- | --- |
| `theme.json` | Versions, profiles and their statuses, entry points, export map, site URL and base path, licence map |
| `tokens/` | Exact values (`primitives`), semantic roles (`semantic`), non-colour foundations, and profile overrides — DTCG 2025.10 format, supported scope declared in the manifest |
| `spec/` | Identity, foundations, accessibility, portability, the decision log, `families.json`, `contrast.json`, and one Markdown file plus one demo fragment per component |
| `agents/consume.md` | How to apply the theme elsewhere |
| `schemas/` | zod schema factories shared by the scripts and the site; `schemas/json/` is generated |
| `scripts/` | Validators and generators (`npm run validate`, `npm run generate`, `npm run check`); `scripts/lib/` is hashed into the package identities, `scripts/tooling/` holds local-tooling helpers that are not |
| `exports/` | Generated, committed: resolved tokens, semantic usage index, CSS custom properties, contrast report, coverage ledger, per-component JSON and briefs, compact and full Markdown, `llms.txt`, digests |
| `site/` | The Astro source of the design-system portal, complete reference and token tools, built to `dist/` and deployed to `/theme/` by CI |
| `references/` | Pinned provenance, catalogued historical implementations, excerpts, and any reference screenshots with their provenance |
| `ports/` | One folder per app, each with a manifest, mapping, generated theme file and evidence; Orca, Claude Code and Codex also hold their installer and one guide (`ports/README.md` says which one you need) |
| `templates/` | Starting points for a port, a component and the fresh-agent consumption task |
| `tests/` | Source tests, `dist/` tests, browser tests, consumption fixtures |

## Application ports

The [capability explorer](https://j3w1.github.io/theme/ports/) builds its
summary, role-to-native-key rows, artifact links and evidence state from the
same committed port inputs. `exports/port-capabilities.json` is digest-covered
and included in task kits. It keeps mapped, inherited, unsupported,
out-of-scope and not-implemented roles apart from import verification. Legacy
unmapped roles keep their reason, with no guessed classification. An empty
catalogue publishes no app support.

`ports/README.md` describes the optional capability metadata and the exact
evidence fingerprint. A stale artifact token digest hides its claimed resolved
values. Changing targets, mappings, capabilities or artifact bytes makes
import evidence stale. Static tables and JSON work without JavaScript.

### Private framework parity

With no licensed target supplied, `npm run parity:private` prints a useful
**not run** prerequisite record. Public validation, builds and browser tests
never need a private target. To run the bounded seven-component experiment:

1. Follow [the private harness protocol](templates/private-parity/README.md).
2. Pass an operator-owned JSON file from outside this repository:

   ```sh
   npm run parity:private -- --config /private/location/parity.json
   ```

The protocol checks the installed versions against the target package and
lock. It copies only the selected script/style inputs into a new private
directory. It captures native references and real framework controls with the
recorded environment, input hashes, property differences and screenshots. It
never starts the target app's backend or runs its package scripts. Finished
diagnostics may report differences; they do not certify an app port. Private
sources, configuration and results stay out of Git and the public site, also
when verification fails.

<!-- ports:start -->
| Port | Format | Declared status | Import evidence | Theme | Tested on | Supported / inherited / unsupported |
| --- | --- | --- | --- | --- | --- | --- |
| ChatGPT desktop app (Appearance) | chatgpt-appearance | experimental | not verified | 2.0.0 | — (windows, macos) | 1 / 0 / 9 |
| Claude Code (custom theme) | claude-theme-json | experimental | not verified | 2.0.0 | — (linux, macos, windows) | 1 / 1 / 2 |
| Codex CLI (tmTheme) | codex-tmtheme | experimental | not verified | 2.0.0 | — (linux, macos) | 1 / 1 / 3 |
| Ghostty theme | ghostty-config | experimental | not verified | 2.0.0 | — (macos, linux) | 3 / 1 / 1 |
| Orca (Ghostty config import) | ghostty-config | experimental | not verified | 2.0.0 | — (windows, macos, linux) | 4 / 1 / 1 |
| Warp theme YAML (also Orca's Import from YAML) | warp-yaml | experimental | not verified | 2.0.0 | — (windows, macos, linux) | 1 / 1 / 3 |
<!-- ports:end -->

## Component coverage

*Specified* means the component's specification validates. *Demonstrated*
means its demo renders every declared variant on the site. *Test implemented*
means a browser test exists for it. Real outcomes are published separately in
the linked verification report, with exact scope, configuration and digests.
The ledger is generated from the sources.

The shared browser evidence fixture records the real browser/OS, the final
viewport, and the page root's declared profile and density when the test ends.
A missing declaration is recorded as `not-declared`; a page context that is
not available is reported explicitly. These fields do not infer a mode for
every nested specimen. Protocols that exercise several local modes describe
them in their verification annotation instead of labelling every run as
comfortable.

<!-- coverage:start -->
| Component | Family | Priority | Specified | Demonstrated | Test implemented |
| --- | --- | --- | --- | --- | --- |
| `admin-form` | composed | R1 | yes | yes | — |
| `alert` | feedback | R1 | yes | yes | — |
| `avatar` | display | R2 | yes | yes | — |
| `badge` | display | R1 | yes | yes | — |
| `breadcrumbs` | navigation | R1 | yes | yes | — |
| `button-group` | actions | R2 | yes | yes | — |
| `button` | actions | R1 | yes | yes | yes |
| `card` | display | R1 | yes | yes | — |
| `chart` | display | R2 | yes | yes | — |
| `checkbox` | forms-basic | R1 | yes | yes | yes |
| `chip` | display | R1 | yes | yes | — |
| `code-editor` | developer | R1 | yes | yes | — |
| `combobox` | forms-advanced | R1 | yes | yes | — |
| `command-palette` | navigation | R2 | yes | yes | — |
| `compact-dashboard` | composed | R2 | yes | yes | — |
| `data-table` | display | R1 | yes | yes | — |
| `date-picker` | forms-advanced | R1 | yes | yes | — |
| `description-list` | display | R2 | yes | yes | — |
| `diagnostics` | developer | R1 | yes | yes | — |
| `dialog` | feedback | R1 | yes | yes | yes |
| `diff-view` | developer | R1 | yes | yes | — |
| `disclosure` | navigation | R2 | yes | yes | — |
| `drawer` | feedback | R1 | yes | yes | — |
| `editor-search` | developer | R2 | yes | yes | — |
| `empty-state` | feedback | R1 | yes | yes | — |
| `error-state` | feedback | R2 | yes | yes | — |
| `field` | forms-basic | R1 | yes | yes | — |
| `fieldset` | forms-basic | R1 | yes | yes | — |
| `file-browser` | composed | R2 | yes | yes | — |
| `file-input` | forms-advanced | R1 | yes | yes | — |
| `filterable-table` | composed | R1 | yes | yes | — |
| `form-builder` | forms-advanced | L | yes | yes | yes |
| `i3-window-frame` | composed | R1 | yes | yes | — |
| `icon-button` | actions | R1 | yes | yes | — |
| `kbd` | display | R2 | yes | yes | — |
| `link` | actions | R1 | yes | yes | yes |
| `list` | display | R1 | yes | yes | — |
| `loading-indicator` | feedback | R1 | yes | yes | — |
| `menu` | navigation | R1 | yes | yes | yes |
| `multiselect` | forms-advanced | R2 | yes | yes | — |
| `number-field` | forms-basic | R1 | yes | yes | — |
| `pagination` | navigation | R1 | yes | yes | — |
| `popover` | feedback | R2 | yes | yes | — |
| `progress` | feedback | R1 | yes | yes | — |
| `radio-group` | forms-basic | R1 | yes | yes | yes |
| `range` | forms-basic | R2 | yes | yes | — |
| `repeater` | forms-advanced | R2 | yes | yes | — |
| `search-field` | forms-basic | R1 | yes | yes | — |
| `segmented-control` | actions | R2 | yes | yes | — |
| `select` | forms-basic | R1 | yes | yes | yes |
| `settings-panel` | composed | R1 | yes | yes | — |
| `sidebar-nav` | navigation | R1 | yes | yes | — |
| `skeleton` | feedback | R2 | yes | yes | — |
| `skip-link` | navigation | R1 | yes | yes | — |
| `switch` | forms-basic | R1 | yes | yes | — |
| `table` | display | R1 | yes | yes | yes |
| `tabs` | navigation | R1 | yes | yes | yes |
| `terminal` | developer | R1 | yes | yes | — |
| `text-field` | forms-basic | R1 | yes | yes | yes |
| `textarea` | forms-basic | R1 | yes | yes | — |
| `time-picker` | forms-advanced | R1 | yes | yes | — |
| `timeline` | display | R2 | yes | yes | — |
| `toast` | feedback | R1 | yes | yes | — |
| `toolbar` | navigation | R1 | yes | yes | — |
| `tooltip` | feedback | R1 | yes | yes | — |
| `tree` | navigation | R2 | yes | yes | — |
| `wizard` | forms-advanced | R1 | yes | yes | — |
<!-- coverage:end -->

## Versioning

Semantic versioning over the contract, not the code.

- **Major:** removing or renaming a role, changing an approved value or its
  meaning, removing a component or state, an incompatible export or lock
  schema.
- **Minor:** new roles, components, states, variants or profiles; promoting
  proposed to approved.
- **Patch:** prose, generation, test and site fixes, evidence updates.

Every global appearance change gets a changelog entry and a downstream impact
note. Releases are tags; consumers pin them.

## Licence

MIT for code, tokens, schemas, scripts and generated JSON/CSS; CC BY 4.0 for
specification prose and specimens; reference screenshots all rights reserved.
See [`LICENSE.md`](LICENSE.md). No fonts are distributed; the recommended
family is named in `theme.json`.
