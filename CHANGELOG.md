# Changelog

## Unreleased

- Fix inline swatch interaction when hover media queries report false despite
  working mouse input. CSS hover controls the morph; mouse and pen events
  control the popup, excluding touch. Downstream: D-014 compatibility only;
  the 16px to 17.4px scale and token values are unchanged.

- #13: add a deterministic task-kit builder shared by the browser and CLI,
  with selected contracts, preserved global rules, token closure, pinned
  source hashes and separate derived-file digests. Standard/minimal modes
  differ only in optional recipes. Both kit commands refuse existing output
  directories and redirected paths; legacy `--strict` keeps its meaning.

- #7: generate scoped standalone button, text-field and dialog references from
  maintained sources, with token closure, source digests, license notices and
  no-JavaScript downloads. Copying with distinct instance prefixes preserves
  labels and ARIA relationships. Dialog modal behavior remains host-owned.

- Make inline color-match popups follow the pointer within their circle and
  dismiss on hover loss, with post-scroll hit testing. Document this D-014
  feature on the single-page specification. Downstream: presentation only;
  token values and the keyboard token inspector retain their contracts.

- #5: generate a semantic token usage index with source locations, aliases,
  declared component/port references and contrast declarations. Add exact
  filters and persistent token detail pages with a static no-JavaScript path.
  Downstream: additive schema-version-1 `exports/token-usage.json`; consumers
  fetch it at the same revision as their existing contracts.

- Keep specification tables compact with readable columns, intact copy labels
  and keyboard-accessible local scrolling, including tables rendered from
  Markdown. Token and component values are unchanged.

- #11: preserve test-file coverage and publish separate, digest-bound execution
  evidence with a static matrix, explicit manual gaps and progressive filtering.
  Downstream: schemaVersion 1 coverage adds `testImplemented`; `tested` keeps
  its original meaning. Execution evidence has its own schema and is published
  after tests without changing the specimen artifact.

- #1: generate exact inline hex previews throughout the static page and token
  inspector, including alpha, all matching token paths and reduced motion.
  Downstream: presentation only; copy text, token values and CSS exports are
  unchanged. D-014 records the owner-authorized preview geometry exception.

- #4: unify pending-role consumption around pinned use-and-report, separate
  approval from deprecation and release numbering, and expose decision links.
  Downstream: resolved tokens and component values gain additive `decisionId`
  and `eligibility` metadata; existing status/value fields and schemaVersion 1
  retain their meanings. Blocked mappings have no automatic replacement.

All notable changes to the j3w1 theme specification. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow the
policy in `README.md` (roles and approved values are the public contract).

## [Unreleased]

## [0.1.0] - 2026-09-06

The first public specification: the j3w1 identity as versioned tokens,
component rules, one generated page and machine exports for agents.

### Added

- **Tokens.** `default` (approved), `heritage-ansi` (the sixteen historical
  slots, exact) and the proposed `extended` overlay, in DTCG 2025.10 form with
  provenance on every primitive. The D-001 status hues (amber, green, blue)
  and the D-003 text corrections (`text.subtle`, `text.disabled`).
- **Specification.** Identity, foundations with the state rules and the focus
  contract, accessibility with the recorded limitations, portability, and the
  decision log D-000 to D-012.
- **Components.** 47 across nine families, every one specified and
  demonstrated with a full state matrix; ten core components carry browser
  tests. Four composed specimens: settings panel, administrative form,
  filterable table, i3 window frame.
- **The page.** One long specification at https://j3w1.github.io/theme/ with
  token tables, specimens, stress fixtures, sixteen non-examples, the contrast
  report and the coverage ledger. Everything normative is in the initial HTML.
- **For agents.** `agents/consume.md`, the compact and full Markdown exports,
  per-component JSON and briefs, resolved tokens, CSS custom properties,
  `llms.txt`, digests, and the `theme.lock.json` convention. The fresh-agent
  consumption test passes on `text-field`.
- **Gates.** 853 declared contrast pairs measured unrounded; base-path,
  consistency, private-material, keyboard, axe, reflow, reduced-motion, no-JS
  and print checks; generated artifacts committed and drift-checked.

### Notes

- No native application ports are published. Historical implementations are
  catalogued in `references/` and are not supported downloads.
- Decisions D-005 to D-012 are still `proposed`; the roles they cover are
  implemented as listed and named in the compact export.

[0.1.0]: https://github.com/j3w1/theme/releases/tag/v0.1.0
