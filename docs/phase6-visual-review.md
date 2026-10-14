# Phase 6A local visual review

The local foundation-selection gate from issue #37 (D-022). It compares Current
with exactly three candidate token overlays, publishes no package and does not
change the canonical palette. The owner selected candidate I (D-023); this
document stays because the review can be reproduced.

## Run the review

1. Use Node 24 and run `npm ci`.
2. Run `npm run phase6:visual-review` in this checkout (set `REVIEW_PORT` first
   to use another port). It builds and serves only `.cache/phase6a/site/`,
   bound to loopback.
3. Open the default address, `http://127.0.0.1:4322/review/compare/`.
4. Stop the server with Ctrl+C.

Routes are `/review/current/`, `/review/conservative/`, `/review/balanced/`,
`/review/maximum-legibility/`, `/review/compare/` and `/review/report/`. Each
candidate also has `foundations/` and `components/` routes; `components/`
renders every specification's variant/state combinations with the shared
parsed specimen renderer. Forced states are appearance references, not
implemented behavior or keyboard evidence.

The comparison page syncs the Vue scene (dashboard, records, settings,
controls, developer views, consumption documentation), query, filter, form,
density, direction and launcher state across four same-origin frames. Frame
widths are real CSS widths, not scaled screenshots; a 640px frame is
equivalent reflow evidence, not proof of a manual browser zoom. Native OS
controls and font fallback depend on the recorded environment.

## Local candidate inputs

Candidate data is ignored on purpose and never copied into `dist/`,
`exports/`, public assets, canonical token profiles or a package. The review
reads `.cache/phase6a/inputs/conservative.json`, `balanced.json` and
`maximum-legibility.json`. A fresh checkout without them stops with a
prerequisite message; do not invent or download candidates.

Each input follows `overlaySchema` in `scripts/lib/visual-review.mjs`: version
1, the exact baseline digest, candidate ID, a summary, an optional display name,
and a role-keyed changes object, each with an sRGB hex value, rationale and
tradeoff. Values replace existing opaque color declarations before the
canonical alias resolver runs. Unknown roles, non-color roles, historical ANSI
primitive changes, stale baselines and malformed input fail. Inputs never
change approval metadata.

`npm run phase6:visual-build` regenerates the local output without starting the
server; the same source and input bytes give the same output. The report holds
input and specimen identities, perceptual OKLCH deltas, affected components,
all declared contrast pairs (unrounded, from the existing engine), untouched
roles and unchanged waivers, and shows unwaived failures rather than hiding
them. A recommendation is a design hypothesis, not approval.

## Verification and limits

1. Run `npm run phase6:visual-test` after the local build. It uses the shared
   environment fixture, writes local Playwright results and captures matched
   screens in `.cache/phase6a/evidence/`.
2. Run `npm test` for the review source tests.

The tests cover synchronization, form recovery, launcher keyboard and focus,
responsive layout, RTL, motion, forced colors, static boards and isolation from
public distribution. The repository check loop still applies; its evidence
describes the public site, not these local candidates. The full public browser
suite also checks revision-pinned source links and task-kit packaging: build a
clean committed candidate with `GITHUB_SHA` set to its full commit, as hosted
CI does. An unpinned local build omits those links and disables packaging, so
it cannot pass those assertions; keep the failed run and rebuild from the
committed candidate. Never weaken the assertions or stamp a dirty build as a
published revision.

No font is downloaded or bundled and no private reference source or asset is
copied. The Vue screen is an original preview from canonical roles and existing
component CSS. All data is synthetic, updates stay in memory, and no remote
services run.

## Owner gate

Present the input names, the report, the matched review URLs and the
evidence-weighted recommendation. Keep stable route IDs across rounds. Archive
rejected inputs, output and evidence together before replacing them, and never
carry a rejected round's recommendation into a new report. Wait for explicit
selection; show a requested hybrid again as one candidate. Do not canonicalize,
merge, deploy, tag or publish a candidate before selection.
