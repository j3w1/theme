# j3w1/theme agent instructions

This repository **defines** the j3w1 theme: one versioned specification with
exact tokens, component rules, machine exports for agents, and a portal at
`https://j3w1.github.io/theme/` with a compact `/reference/` hub, component
detail on `/components/<id>/`, and `/reference/contrast/` and
`/reference/decisions/`. If you are applying the theme somewhere else, read
`agents/consume.md` instead of this file.

## Required reading, in order

1. `README.md`, then `theme.json` (versions, profiles, entry points).
2. `spec/identity.md`, `spec/foundations.md`, `spec/accessibility.md`,
   `spec/portability.md`, and `spec/decisions.md` (what is approved and what
   is only proposed).
3. The token files the profile lists, and `schemas/roles.mjs` for the required
   role set.
4. The component you are touching: `spec/components/<id>.md`, its
   `<id>.demo.html`, `site/src/styles/components/<id>.css`, and its browser
   spec if one exists.

Historical material under `references/` is evidence of origin, not authority.
Images never override tokens.

## Source of truth

Literal values live in `tokens/`, meaning and permitted uses in `spec/`, native
keys in port mappings, test facts in evidence records (D-000). A contradiction
between spec and tokens is a defect to resolve, not a choice to make.

Generated, never edited by hand: `exports/`, `schemas/json/`,
`site/src/styles/tokens.generated.css`, `packages/ui/dist/`,
`packages/ui/README.md` (a copy of `docs/ui-consumption.md`), the port files
under `ports/*/dist/`, `ports/orca/install/specimen.json`, and the marker
blocks in `README.md`, `agents/consume.md` and the port guides. Edit their
sources and run `npm run generate`.

## The check loop

CI picks the checks a change needs (D-031); `release-gate` is the only required
check and passes when every selected check passed. See the plan before you
push:

```
node scripts/ci/select.mjs --event pull_request --base origin/main --head HEAD
```

Run what it selects, usually `npm run generate` (after any source change; `npm
run check` only reports drift), `npm run validate`, `npm run check`, `npm
test`, `npm run build && npm run test:dist`, and `npm run test:smoke`. Build
like CI with `GITHUB_SHA` set to the full commit; a pinned build refuses
uncommitted generated files, so commit first. Browser runs use port 4173; set
`PW_PORT` to a free port when another checkout is testing.

`npm run test:all` is the whole suite, with the browser part in parallel. Run
it when you changed rendering, tokens, components or the package, and say so
in the pull request. On `main`, CI runs the whole matrix for every site change
before it deploys; the workflow dispatch runs it on any branch.

Only the whole suite writes execution evidence. A subset (`test:smoke`, the
specs a pull request selects, one spec, shard or project) writes none and
never claims coverage. Report checks that were not run separately from checks
that passed.

Design mode (`npm run design`, `docs/design-mode.md`) is a working tool, not a
gate: nothing it shows is evidence, and it approves nothing.

## What you may do without a decision

Fix generation, mapping, rendering, test and documentation defects within the
existing rules. Tighten a schema without adding meaning. Add or correct
evidence. Add a component whose every token reference resolves to an approved
role.

## What needs a decision entry first

A new colour or a change to an approved value. A new role or a renamed role.
A change to the focus, selection or contrast rules. A new profile. Promoting
anything from `proposed` to `approved`. Changing the licence boundaries.
Open a `proposed` row in `spec/decisions.md` with context and alternatives;
only the owner changes a status.

## Never

- Weaken a test, add a tolerance, or remove a state to obtain a green result.
- Add a literal colour to a stylesheet or demo; only token variables.
- Commit font binaries, vendor template material, credentials or private
  project data. `scripts/lib/private-material.mjs` holds the scan; the words
  it forbids are not repeated anywhere else.
- Link to or import from the user site outside `/theme/`; there is no live
  import from `j3w1.github.io` and no bidirectional synchronisation.
- Mark a port `verified` without a real import and matching evidence.
- Modify `j3w1/j3w1.github.io` or `j3w1/1w3j` from this repository.
- Put normative content behind JavaScript or inside `<details>` on the site.
- Use `main` in any URL an agent is meant to fetch; exports embed the tag.

## Conventions

npm with `npm ci`, Node 24, ES modules, no linter (the contract tests are the
style guide), generated files committed and drift-checked, LF line endings,
kebab-case ids, closed lists in `schemas/`. Anchors come only from
`scripts/lib/anchors.mjs`. Outputs contain no timestamps and no commit hashes,
with one exception: `theme.json`'s `release.commit` (recorded after its tag
exists) and the install commands generated from it into the port guides.
Commits are conventional (`feat:`, `fix:`, `docs:`, `spec:`, `tokens:`,
`site:`, `chore:`) and explain why.

## Hex swatches (D-014)

Every visible CSS hex literal on the site gets its generated inline swatch from
the whole-page build transform; never add or maintain one by hand. Runtime
renderers, such as the token inspector, use the same literal parser and
presentation helpers and never scan the DOM for colours. Source text, copied
text and machine exports stay unchanged. The three gates are
`tests/hex-literals.test.js`, `tests/dist/hex-swatches.test.js` and
`tests/browser/hex-swatches.spec.js`.

## Execution evidence

- `tested` stays the compatibility alias for `testImplemented`; it is never a
  pass. A test in the matrix proves rendering coverage only.
- Every browser test needs an explicit `verification` annotation naming its
  component, category, states, variants and limits, and uses the shared
  evidence fixture for the real environment metadata.
- After the browser suite, run `npm run verification:report`, then
  `npm run verification:check`, then `npm run test:verification`.
- Keep the exact specimen bytes. Run records go in the ignored `test-results/`
  and the published `dist/verification/`, never in the committed exports.
- Do not claim a manual keyboard or screen-reader pass without a recorded
  protocol and environment.

## CE Meta integration

This repository joined the CE Meta portfolio on 2026-09-22. Nothing is installed here and
nothing is imported: CE Meta is a service that reads this repository through one GitHub App
installation, and this section is the cooperation contract an agent working in it needs.

**It writes labels here.** This repository is named by `classification_authority.repositories` in
[`policy/object-metadata.yaml`](https://github.com/j3w1/ce-meta/blob/main/policy/object-metadata.yaml)
and by `coverage_repositories` in
[`policy/label-management.yaml`](https://github.com/j3w1/ce-meta/blob/main/policy/label-management.yaml),
so the App's labels writer applies the exact managed label set that reviewed policy decides for each
object here, and the label-definition writer keeps the canonical label definitions here. Whether any
other writer reaches an object here — a rule in `policy/repository-metadata.yaml`, or a Project
membership grant — is stated by that policy and its live grant, not by this file. An object whose
reviewed evidence decides nothing sits at `NEEDS_REVIEW` or `HOLD` and writes nothing.

**Protected CE label prefixes:** `ce-systems`, `cross-repo`, `historical-evidence`, `type:`,
`area:`, `concern:`. Labels outside them are never touched — including the ones GitHub creates by
default and the ones Dependabot applies. Within them CE Meta is authoritative once a writer
reaches this repository: a reviewed rule states an object's whole managed label set, so a CE label
added by hand and absent from that rule is drift, and the sweep removes it.

**Do not hand-label to steer it.** An object labelled by hand to influence classification is not
configuration, it is drift the next sweep removes — and it spends a breaker budget doing so. If
the labels are wrong, the reviewed policy is wrong: report the exact object, the policy digest,
the plan and the readback, and the fix is a policy change.

**Classification decides labels; it is not only evidence.** Every sweep classifies uncovered
objects, and since [ADR 0038](https://github.com/j3w1/ce-meta/blob/main/docs/adr/0038-reviewed-classification-rules-as-label-authority.md)
a complete, canonical, unambiguous classification derived from reviewed rules *is* an object's
exact managed label set where no explicit reviewed rule covers it — in the repositories that
declaration names.

The half that fails closed matters more here. An object whose evidence does not decide a single
`type:` and a single `area:` sits at `NEEDS_REVIEW` and writes nothing. Since
[ADR 0039](https://github.com/j3w1/ce-meta/blob/main/docs/adr/0039-semantic-pr-evidence.md) a pull request is classified from the
files it changed **as well as** its title: where they disagree in an exclusive namespace structure
wins and the title rule's whole contribution is set aside, and where they agree they merge. Within
one class of evidence there is no principled winner, so two conflicting title rules and two
conflicting structural rules both fail closed. An incomplete changed-file list fails a *universal*
fact closed — "every path here is documentation" cannot be established from a truncated list — but
an *existential* one can still hold.

Since [ADR 0046](https://github.com/j3w1/ce-meta/blob/main/docs/adr/0046-classification-evidence-from-title-convention.md) the
classifier reads this portfolio's own title conventions: a conventional-commit prefix
(`feat:`, `fix:`, `ci:`), a leading imperative verb, or an identifier or bracketed tag followed by
one. The identifier itself is skipped and cannot be read — the patterns answer identically for any
scheme — so a `CE-####` prefix implies neither a type nor an area. What decides a type is the verb
after it.

**No CE task identifier is allocated by any of this.** CE Meta cannot create `CE-GD`, `HQ`,
`IAR`, `IAP`, `MQ`, `D3` or `DONE` state, approve anything, mark anything ready, or merge. This
repository's existing delivery process is untouched.

**Do not create a competing writer.** A second workflow, Action or agent writing the same labels or
the same Project membership is exactly the failure `NO_DUAL_WRITER` exists to prevent. Project
membership is written by the owner-authenticated Project bridge, never by the App, and Project
Status belongs to GitHub's own native workflows rather than to CE Meta.

**This repository's profile is reviewed policy, not a claim made here.** Its role is `design-system`, its
membership writer is `OWNER_AUTHENTICATED_BRIDGE`, its default area is `area:design-system`, and the prefixes
above are what protected policy currently allows it. Read them from
[`policy/repositories.yaml`](https://github.com/j3w1/ce-meta/blob/main/policy/repositories.yaml) rather than from this file, and
verify the live grant before assuming a writer is active — a grant names exact repositories and,
at a canary ring, exact objects, so being in the allowlist is not the same as being covered by a
live grant.
