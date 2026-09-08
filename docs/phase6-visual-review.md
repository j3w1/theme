# Phase 6A local visual review

The primary Phase 6 outcome is agent consumption: install or copy complete
elements, components and compositions into another application with pinned
contracts, explicit dependencies and verified instructions. The official web
package, multi-page specification portal and full Vue showcase support that
outcome. This checkpoint implements only the local foundation selection gate
from issue #37. It does not publish a package or change the canonical palette.

## Run the review

Use Node 24 and `npm ci`, then `npm run phase6:visual-review` in this checkout.
The command builds and serves only `.cache/phase6a/site/`, bound to loopback.
The default address is `http://127.0.0.1:4322/review/compare/`.
`REVIEW_PORT` can select a different port. Stop the server with Ctrl+C.

Routes are `/review/current/`, `/review/conservative/`, `/review/balanced/`,
`/review/maximum-legibility/`, `/review/compare/` and `/review/report/`.
Each candidate also has `foundations/` and `components/` routes. The latter
renders every existing specification's variant/state combinations using the
shared parsed specimen renderer. Forced states are appearance references,
not implemented behavior or keyboard evidence. Deferred inventory remains
explicitly outside the productization claim at this checkpoint.

The Vue scene selector covers dashboard, records, settings, controls,
developer views and a consumption-documentation composition. The comparison
page synchronizes scene, query, filter, form, density, direction and launcher
state between four same-origin frames. Frame widths are real CSS widths,
not scaled screenshots. A 640px frame is equivalent reflow evidence, not
proof of a manually exercised browser zoom command. Native OS controls and
font fallback still depend on the recorded environment.

## Local candidate inputs

Candidate data is deliberately ignored and never copied into `dist/`,
`exports/`, public assets, canonical token profiles or a package. The current
review checkout holds these files under `.cache/phase6a/inputs/`:

- `conservative.json`
- `balanced.json`
- `maximum-legibility.json`

A fresh checkout without those files stops with a prerequisite message.
Do not silently invent or download candidates. The owner-selected local
review inputs must be supplied before reproducing this specific review.
Each input uses `overlaySchema` in `scripts/lib/visual-review.mjs`: version 1,
the exact baseline digest, candidate ID, summary, and a role-keyed changes
object containing an sRGB hex value, rationale and tradeoff. Values replace
existing opaque color declarations before the canonical alias resolver runs.
Unknown roles, non-color roles, historical ANSI primitive changes, stale
baselines and malformed input fail. Inputs never change approval metadata.

`npm run phase6:visual-build` regenerates local output without starting the
server. Output is deterministic for the same source/input bytes. The report
contains input identities, specimen identity, perceptual OKLCH deltas, affected
components, all declared contrast pairs, untouched roles and unchanged waivers.
It exposes unwaived failures rather than repairing or hiding them. Contrast is
computed from unrounded sRGB values using the existing engine. A recommendation
is a design hypothesis, not approval. Browser results are recorded separately.

## Verification and limitations

Run `npm run phase6:visual-test` after the local build. It uses the shared
environment fixture, writes local Playwright results and captures matched
screens in `.cache/phase6a/evidence/`. Tests cover synchronization, form
recovery, launcher keyboard/focus, responsive layout, RTL, motion, forced
colors, static boards and isolation from public distribution. Review source
tests run with `npm test`. The ordinary repository check loop still applies;
its evidence describes the public site, not these local candidates.

The full public browser suite also exercises revision-pinned source links and
task-kit packaging. For that gate, use a clean committed candidate and set
`GITHUB_SHA` to its full commit before `npm run build`, as hosted CI does.
An ordinary unpinned local build intentionally omits those links and disables
packaging; it cannot satisfy the pinned-link assertions. Preserve that failed
run if this prerequisite was missed, then rebuild from the committed candidate.
Do not weaken the assertions or stamp a dirty build as a published revision.

No font is downloaded or bundled. No private reference source or asset is
copied. The Vue screen is an original preview composition using canonical
roles and existing component CSS. Its controls are not advertised as the
future official package. The consumption-page actions intentionally describe
future deliverables rather than offering nonexistent package/download links.
All data is synthetic and updates stay in memory. No remote services run.

## Owner gate and continuation

Present A (Conservative), B (Balanced), C (Maximum legibility), the report,
matched local review URLs and the evidence-weighted recommendation. Wait for
explicit selection. A requested hybrid must be consolidated and shown again.
Do not canonicalize, merge, deploy, tag or publish a candidate before selection.

After selection: freeze the canonical foundation with owner decision provenance;
productize every baseline inventory entry; generate install/copy distributions
from the maintained implementation; build the static-first portal with API and
consumption examples; build the full Vue showcase; verify external consumer
fixtures and documentation; release tested artifacts. The portal replaces the
long homepage, preserves the complete reference at a secondary route and keeps
machine contracts as the agent entry point. Pages is the default host; the demo
may use Vercel if an actual hosting limitation requires it.
