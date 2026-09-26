# Phase 6A local visual review

Phase 6 exists so agents can install or copy complete elements, components and
compositions into another application, with pinned contracts, explicit
dependencies and verified instructions. The official web package, the
multi-page portal and the full Vue showcase serve that goal. This checkpoint
builds only the local foundation-selection gate from issue #37. It publishes no
package and does not change the canonical palette.

## Run the review

1. Use Node 24 and run `npm ci`.
2. Run `npm run phase6:visual-review` in this checkout (set `REVIEW_PORT` first
   to use another port). It builds and serves only `.cache/phase6a/site/`,
   bound to loopback.
3. Open the default address, `http://127.0.0.1:4322/review/compare/`.
4. Stop the server with Ctrl+C.

Routes are `/review/current/`, `/review/conservative/`, `/review/balanced/`,
`/review/maximum-legibility/`, `/review/compare/` and `/review/report/`. Each
candidate also has `foundations/` and `components/` routes. `components/`
renders every existing specification's variant/state combinations with the
shared parsed specimen renderer. Forced states are appearance references, not
implemented behavior or keyboard evidence. Deferred inventory stays outside the
productization claim at this checkpoint.

The Vue scene selector covers dashboard, records, settings, controls, developer
views and a consumption-documentation composition. The comparison page syncs
scene, query, filter, form, density, direction and launcher state across four
same-origin frames. Frame widths are real CSS widths, not scaled screenshots. A
640px frame is equivalent reflow evidence, not proof of a manual browser zoom.
Native OS controls and font fallback still depend on the recorded environment.

## Local candidate inputs

Candidate data is ignored on purpose. It is never copied into `dist/`,
`exports/`, public assets, canonical token profiles or a package. This review
checkout holds these files under `.cache/phase6a/inputs/`:

- `conservative.json`
- `balanced.json`
- `maximum-legibility.json`

A fresh checkout without them stops with a prerequisite message. Do not invent
or download candidates. Supply the owner-selected local inputs before
reproducing this review.

Each input follows `overlaySchema` in `scripts/lib/visual-review.mjs`:

- version 1;
- the exact baseline digest;
- candidate ID, a summary, and an optional display name;
- a role-keyed changes object, each with an sRGB hex value, rationale and tradeoff.

Values replace existing opaque color declarations before the canonical alias
resolver runs. Unknown roles, non-color roles, historical ANSI primitive changes,
stale baselines and malformed input fail. Inputs never change approval metadata.

`npm run phase6:visual-build` regenerates the local output without starting the
server. The same source and input bytes give the same output. The report
contains input identities, specimen identity, perceptual OKLCH deltas, affected
components, all declared contrast pairs, untouched roles and unchanged waivers.
It shows unwaived failures rather than fixing or hiding them. Contrast comes
from unrounded sRGB values through the existing engine. A recommendation is a
design hypothesis, not approval. Browser results are recorded separately.

## Verification and limitations

1. Run `npm run phase6:visual-test` after the local build. It uses the shared
   environment fixture, writes local Playwright results and captures matched
   screens in `.cache/phase6a/evidence/`.
2. Run `npm test` for the review source tests.

The tests cover synchronization, form recovery, launcher keyboard and focus,
responsive layout, RTL, motion, forced colors, static boards and isolation from
public distribution. The ordinary repository check loop still applies; its
evidence describes the public site, not these local candidates.

The full public browser suite also checks revision-pinned source links and
task-kit packaging. For that gate:

1. Use a clean committed candidate.
2. Set `GITHUB_SHA` to its full commit before `npm run build`, as hosted CI does.

An ordinary unpinned local build omits those links and disables packaging on
purpose, so it cannot pass the pinned-link assertions. If you missed this step,
keep the failed run and rebuild from the committed candidate. Do not weaken the
assertions or stamp a dirty build as a published revision.

No font is downloaded or bundled. No private reference source or asset is
copied. The Vue screen is an original preview built from canonical roles and
existing component CSS; its controls are not presented as the future official
package. The consumption-page actions describe future deliverables instead of
offering package or download links that do not exist. All data is synthetic,
updates stay in memory, and no remote services run.

## Owner gate and continuation

1. Present the three current input names, the report, the matched local review
   URLs and the evidence-weighted recommendation.
2. Keep stable route IDs across review rounds; display names identify the
   current directions.
3. Archive rejected inputs, output and evidence together before replacing them.
   Never carry a rejected round's recommendation into a new report.
4. Wait for explicit selection. Consolidate a requested hybrid and show it again.
5. Do not canonicalize, merge, deploy, tag or publish a candidate before
   selection.

After selection:

1. Freeze the canonical foundation with owner decision provenance.
2. Productize every baseline inventory entry.
3. Generate install and copy distributions from the maintained implementation.
4. Build the static-first portal with API and consumption examples.
5. Build the full Vue showcase.
6. Verify external consumer fixtures and documentation.
7. Release tested artifacts.

The portal replaces the long homepage, keeps the complete reference at a
secondary route and keeps machine contracts as the agent entry point. Pages is
the default host; the demo may use Vercel if a real hosting limit requires it.
