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

```
npm run validate      # sources only: manifest, decisions, tokens, docs, spec, contrast, ports, references, private material
npm run generate      # rewrite every generated artifact
npm run check         # CI mode: generated artifacts must be current, no orphans
npm test              # node --test over the sources and exports
npm run build && npm run test:dist   # the site under /theme/, base paths, consistency
npm run test:browser  # keyboard, axe, reflow, motion, no-JS, enhancements, print
```

Finish with all of the above green. Report checks that were not run
separately from checks that passed.

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
