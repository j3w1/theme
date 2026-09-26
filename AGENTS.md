# j3w1/theme agent instructions

This repository **defines** the j3w1 theme: one versioned specification with
exact tokens, component rules, a generated single-page visual reference at
`https://j3w1.github.io/theme/`, and machine exports for agents. If you are
applying the theme somewhere else, read `agents/consume.md` instead of this
file.

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

Literal values live in `tokens/`. Meaning and permitted uses live in `spec/`.
Native keys live in port mappings. Test facts live in evidence records.
`exports/`, `schemas/json/`, `site/src/styles/tokens.generated.css` and the
README marker blocks are generated: edit their sources and run
`npm run generate`; never edit them by hand. A contradiction between spec and
tokens is a defect to resolve, not a choice to make.

## The check loop

CI picks the checks a change needs (D-031). You can see its choice before you
push:

```
node scripts/ci/select.mjs --event pull_request --base origin/main --head HEAD
```

`release-gate` is the only required check: it passes when every selected check
passed.

**Before you push.** Run what the plan selects. The usual set:

```
npm run generate      # rewrite every generated file (run it after any source change)
npm run validate      # sources: manifest, decisions, tokens, docs, spec, contrast, ports, references, private material
npm run check         # generated files are current, no orphans
npm test              # node --test over sources and exports
npm run build && npm run test:dist   # the site under /theme/
npm run test:smoke    # the built site loads, renders from the tokens, takes a keyboard
```

`npm run check` only reports drift; `npm run generate` fixes it.

**The whole suite.** `npm run test:all` runs everything; the browser part runs
in parallel. Run it when you changed rendering, tokens, components or the package,
and say in the pull request that you did. On `main`, CI runs the whole matrix
for every change to the site before it deploys. From the Actions tab, the
workflow dispatch runs it on any branch.

**Evidence.** Only the whole suite writes execution evidence. A subset, such as
`test:smoke`, the specs a pull request selects, or a local run of one spec,
shard or project, writes none and never claims coverage.

Report checks that were not run separately from checks that passed.

**Design mode is a working tool, not a gate.** `npm run design` compares the
site at an anchored commit with the live dev server (`docs/design-mode.md`).
Nothing it shows is evidence, and it approves nothing.

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
`scripts/lib/anchors.mjs`. Outputs contain no timestamps and no commit hashes.
Commits are conventional (`feat:`, `fix:`, `docs:`, `spec:`, `tokens:`,
`site:`, `chore:`) and explain why.

## Specification UI maintenance

Every human-visible CSS hex literal rendered by the j3w1 UI Theme Spec must
receive its generated inline color swatch (D-014). New sections and components
inherit the whole-page build transform; never hand-maintain inline swatches.
Explicit runtime renderers, such as the token inspector, use the same literal
parser/presentation helpers. Never scan the runtime DOM for colors. Preserve
source/copy text and machine exports. Run the hex source, dist and browser gates.


## Execution evidence

`tested` remains the compatibility alias for `testImplemented`, never a pass.
Every browser test needs an explicit `verification` annotation describing its
component, category, states, variants and limits. Use the shared evidence fixture
for actual environment metadata. Matrix presence is rendering coverage only.
After the browser suite, run `npm run verification:report`,
`npm run verification:check` and `npm run test:verification`. Preserve the exact
specimen bytes. Run records belong in ignored `test-results/` and published
`dist/verification/`, never deterministic committed exports. Do not claim a
manual keyboard or screen-reader pass without a recorded protocol and environment.

## CE Metadata integration

This repository joined the CE Metadata portfolio on 2026-09-22. Nothing is installed here and
nothing is imported: CE Metadata is a service that reads this repository through one GitHub App
installation, and this section is the cooperation contract an agent working in it needs.

**Right now it writes nothing here.** Being in the portfolio means this repository is read and
censused and its objects are visible. It does not mean any writer reaches them. Reviewed
classification rules may decide labels only in the repositories named by
`classification_authority.repositories` in [`policy/object-metadata.yaml`](https://github.com/j3w1/ce-metadata/blob/main/policy/object-metadata.yaml),
and the canonical label definitions are written only in the repositories named by
`coverage_repositories` in [`policy/label-management.yaml`](https://github.com/j3w1/ce-metadata/blob/main/policy/label-management.yaml).
This repository is in neither yet. Each is its own reviewed change, made once this repository's
corpus has been classified — so the first labels that appear here will have been reviewed before
they were written, not after.

**Protected CE label prefixes:** `ce-systems`, `cross-repo`, `historical-evidence`, `type:`,
`area:`, `concern:`. Labels outside them are never touched — including the ones GitHub creates by
default and the ones Dependabot applies. Within them CE Metadata is authoritative once a writer
reaches this repository: a reviewed rule states an object's whole managed label set, so a CE label
added by hand and absent from that rule is drift, and the sweep removes it.

**Do not hand-label to steer it.** An object labelled by hand to influence classification is not
configuration, it is drift the next sweep removes — and it spends a breaker budget doing so. If
the labels are wrong, the reviewed policy is wrong: report the exact object, the policy digest,
the plan and the readback, and the fix is a policy change.

**Classification decides labels; it is not only evidence.** Every sweep classifies uncovered
objects, and since [ADR 0038](https://github.com/j3w1/ce-metadata/blob/main/docs/adr/0038-reviewed-classification-rules-as-label-authority.md)
a complete, canonical, unambiguous classification derived from reviewed rules *is* an object's
exact managed label set where no explicit reviewed rule covers it — in the repositories that
declaration names.

The half that fails closed matters more here. An object whose evidence does not decide a single
`type:` and a single `area:` sits at `NEEDS_REVIEW` and writes nothing. Since
[ADR 0039](https://github.com/j3w1/ce-metadata/blob/main/docs/adr/0039-semantic-pr-evidence.md) a pull request is classified from the
files it changed **as well as** its title: where they disagree in an exclusive namespace structure
wins and the title rule's whole contribution is set aside, and where they agree they merge. Within
one class of evidence there is no principled winner, so two conflicting title rules and two
conflicting structural rules both fail closed. An incomplete changed-file list fails a *universal*
fact closed — "every path here is documentation" cannot be established from a truncated list — but
an *existential* one can still hold.

Since [ADR 0046](https://github.com/j3w1/ce-metadata/blob/main/docs/adr/0046-classification-evidence-from-title-convention.md) the
classifier reads this portfolio's own title conventions: a conventional-commit prefix
(`feat:`, `fix:`, `ci:`), a leading imperative verb, or an identifier or bracketed tag followed by
one. The identifier itself is skipped and cannot be read — the patterns answer identically for any
scheme — so a `CE-####` prefix implies neither a type nor an area. What decides a type is the verb
after it.

**No CE task identifier is allocated by any of this.** CE Metadata cannot create `CE-GD`, `HQ`,
`IAR`, `IAP`, `MQ`, `D3` or `DONE` state, approve anything, mark anything ready, or merge. This
repository's existing delivery process is untouched.

**Do not create a competing writer.** A second workflow, Action or agent writing the same labels or
the same Project membership is exactly the failure `NO_DUAL_WRITER` exists to prevent. Project
membership is written by the owner-authenticated Project bridge, never by the App, and Project
Status belongs to GitHub's own native workflows rather than to CE Metadata.

**This repository's profile is reviewed policy, not a claim made here.** Its role is `design-system`, its
membership writer is `OWNER_AUTHENTICATED_BRIDGE`, its default area is `area:design-system`, and the prefixes
above are what protected policy currently allows it. Read them from
[`policy/repositories.yaml`](https://github.com/j3w1/ce-metadata/blob/main/policy/repositories.yaml) rather than from this file, and
verify the live grant before assuming a writer is active — a grant names exact repositories and,
at a canary ring, exact objects, so being in the allowlist is not the same as being covered by a
live grant.
