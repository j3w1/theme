# Design mode

Design mode is the local loop for changing how the theme looks. One screen
shows the site twice: **before** is a frozen production build of where the
session started, **after** is the live dev server, so you judge a change
against what it replaces before you commit it. It is a working tool, not a
gate: nothing it produces is evidence, and it approves nothing.

## Run it

```
npm ci
npm run design:doctor   # optional: checks the prerequisites below and stops
npm run design
```

Then open `http://localhost:4400/` (the default). Stop with Ctrl+C.

- `DESIGN_PORT=4500 npm run design` uses another port. The frozen side, the
  live side and the dev server take the next three ports; `DESIGN_DEV_PORT`
  moves only the last.
- The first entry builds the baseline (`npm run build`) and starts the dev
  server; its first content sync can take about a minute on a cold cache. The
  status line names the running step, and the after frame shows the frozen
  build until the dev server is ready.
- Later entries reuse the baseline whenever `.cache/design-mode/baseline/` and
  its `baseline.json` exist, even if `HEAD` has moved, so a checkpoint commit
  does not destroy what you compare against. The before label names the anchor
  commit, plus "working tree" if the tree was dirty then.
- `npm run design:baseline`, or the **Re-anchor before** button, re-anchors the
  frozen side to the working tree, to chain comparisons across a session.

**Prerequisites** (`npm run design:doctor` checks each and names the fix;
`npm run design` runs the same check first):

- Node 24 (`engines` in `package.json`), and `npm ci` has run.
- `packages/ui/dist` holds the package (`index.json`, `styles/controls.css`,
  `enhance/choice.js`); it is committed and `npm run generate` rebuilds it.
- `site/src/styles/tokens.generated.css` exists (`npm run generate`).
- git answers inside the checkout; the four ports are free; npm answers and
  `.cache/` is writable.

Run it through npm. `package.json` declares `"packageManager": "npm@…"`, so
pnpm and Yarn refuse to run here, and the baseline build always uses npm.
Started another way, such as `node scripts/design-mode.mjs`, it runs `npm` from
`PATH` and says so. Astro's telemetry is disabled for design mode and the
processes it starts.

## What the two sides are

| Side | Source | Why |
| --- | --- | --- |
| before | `.cache/design-mode/baseline/`, a frozen `npm run build` | Production-faithful: real base path, inline hex previews, `ui/` and `demo/` present |
| after | the dev server, proxied | Vite HMR, so an edit repaints immediately |

The sides use separate origins, so links, assets and fetches resolve as on
Pages; a small injected agent relays each side's scroll ratio and route. Under
the dev server the `ui/`, `demo/`, `exports/` and `downloads/` trees and the
inline hex previews (D-014) are missing, so the live proxy applies the build's
decoration (`decorateHexHtml`/`tokenColorIndex` and the same route list) and
falls back to the frozen build for anything the dev server cannot answer, with
the header `x-design-mode: baseline-fallback`. Design mode starts the dev
server through Astro's JS API because `astro dev` gives it only 30 seconds to
report ready.

The route, width and scale selects are the j3w1 combobox from `packages/ui`,
served under `/ui/`. The route picker must not be an `<input list>`, and the
text field beside it has no `list` attribute: Chrome draws that popup as
unstyled OS chrome.

## Comparison modes

- **Side by side**: both viewports at their true CSS widths, scroll synced.
- **Swipe**: one clipped over the other; drag the seam or use the slider.
- **Blend**: after faded over before; ghosting shows a shift of a few pixels.
- **Blink**: the two alternate in place, so any shift reads as a jump.

Widths match the browser suite's gates: 1440×1000 desktop, 640×500 for 200%
zoom, 360×740 narrow. They are real CSS widths; the scale control only shrinks
the result to fit and does not emulate device pixel ratio.

## Token changes

`site/src/styles/tokens.generated.css` is generated; to change a colour, edit
`tokens/`. Design mode watches `tokens/` and runs the real tokens generator,
which rewrites that stylesheet, `exports/tokens.resolved.json` and
`exports/tokens.css` (printed hexes come from the exports). A DTCG colour
carries both `components` and `hex`, and the resolver rejects it if they
disagree: write both, with `components` as each channel ÷ 255.

The watcher skips validation and the other generators. At the end of the
session run `npm run generate` (contrast report, usage index, `schemas/json/`,
README blocks, digests), then `npm run check`.

## The session ledger

`.cache/design-mode/session.json` records each change: the owner's instruction
in their own words, the files touched, and where the change belongs.

```
node scripts/design-mode.mjs --note "warm the panel surface" --class token --files tokens/primitives.tokens.json
```

`--class` is one of `page-local`, `token`, `spec-rule`, `component` or
`copy/identity`. The site is confirmation-only (`theme.json`), so anything that
is not page layout belongs in `tokens/` or `spec/` and must be reconciled there
before the work can merge. `npm run design:exit` prints the session by class
and counts the changes that still need reconciling.

## Where the code is

`scripts/design-mode.mjs` wires the servers, proxy, watchers and regeneration.
`scripts/tooling/design-mode.mjs` holds the server-free units tested by
`tests/design-mode.test.js`. Neither is under `scripts/lib`, so changing design
mode does not change the package identities `scripts/build-ui.mjs` hashes. The
live route list comes from `scripts/lib/hex-routes.mjs`, the list the build's
hex-swatch integration reads.

## Limits

- The ledger, baseline and log live in ignored `.cache/`; none of it is
  evidence or published.
- Design mode does not run the check loop or validate. Changes that need a
  decision entry (AGENTS.md) still need one in `spec/decisions.md`.
- Automated rendering in two frames is not a manual keyboard or screen-reader
  result.
