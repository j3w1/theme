# Design mode

Design mode is the local loop for changing how the theme looks. One screen
shows the site twice: **before** is a frozen production build of where the
session started, **after** is the live dev server. You judge a change against
what it replaces before you commit it.

It is a working tool, not a gate. Nothing it produces is evidence, and it
approves nothing.

## Run it

The repository is an npm workspace. Run design mode through npm:

```
npm ci
npm run design:doctor   # optional: checks the prerequisites below and stops
npm run design
```

Then open `http://localhost:4400/`. Stop with Ctrl+C.

To use another port, set `DESIGN_PORT`. The frozen side, the live side and the
dev server take the next three ports; `DESIGN_DEV_PORT` moves only the last.

The three servers listen first, so the screen answers at once. The first entry
then builds the baseline (`npm run build`) and starts the dev server. Its first
content sync can take about a minute on a cold cache. The status line under the
controls names the running step. Until the dev server is ready, the after frame
shows the frozen build; both frames reload when it is.

Later entries reuse the baseline whenever `.cache/design-mode/baseline/` and its
`baseline.json` exist, even if `HEAD` has moved. This is deliberate: a session
commits a checkpoint after each accepted change, and rebuilding "before" each
time would destroy what you compare against. The before label names the anchor
commit, plus "working tree" if the tree was dirty then.

`npm run design:baseline`, or the **Re-anchor before** button, re-anchors the
frozen side to the working tree. Use it to chain comparisons across a long
session.

### Prerequisites

`npm run design:doctor` checks each item and names the fix for a failure.
`npm run design` runs the same check before it starts.

- Node 24 (`engines` in `package.json`).
- `npm ci` has run, so Astro and Vite resolve.
- `packages/ui/dist` holds the package the screen and the live side load
  (`index.json`, `styles/controls.css`, `enhance/choice.js`). It is committed;
  `npm run generate` rebuilds it.
- `site/src/styles/tokens.generated.css` exists (`npm run generate`).
- git answers inside the checkout; "before" records the commit it came from.
- The four ports are free.
- npm answers, and `.cache/` is writable.

### Package manager

`package.json` declares `"packageManager": "npm@…"`, so pnpm and Yarn refuse to
install or run scripts here. That keeps a second lockfile away from
`package-lock.json`. The baseline build always runs npm, because the workspace
layout and `scripts/pack-ui.mjs` (`npm pack --workspace … --json`) are
npm-specific. Started through `npm run`, it runs that same npm directly (no
`PATH` lookup, no shell). Started another way, such as
`node scripts/design-mode.mjs`, it runs `npm` from `PATH` and says so.

Astro's telemetry is disabled for design mode and the processes it starts.

## What the two sides are

| Side | Source | Why |
| --- | --- | --- |
| before | `.cache/design-mode/baseline/`, a frozen `npm run build` | Production-faithful: real base path, inline hex previews, `ui/` and `demo/` present |
| after | the dev server, proxied | Vite HMR, so an edit repaints immediately |

The sides use separate origins, so every link, asset and runtime fetch resolves
exactly as on Pages. Cross-origin frames cannot read each other, so each side
has a small injected agent that relays its scroll ratio and route.

Every Astro integration here hooks `astro:build:done`. Under the dev server, the
`ui/`, `demo/`, `exports/` and `downloads/` trees are missing and the inline hex
previews (D-014) are not applied. Both would look like changes the session did
not make, so the live proxy fixes them:

- It applies the build's decoration, with the same
  `decorateHexHtml`/`tokenColorIndex` pair and route list.
- It falls back to the frozen build for anything the dev server cannot answer.
  A fallback response carries `x-design-mode: baseline-fallback`.

`astro dev` alone cannot start this project. Its CLI gives the forked dev server
30 seconds to report ready, and syncing 67 component collections takes longer on
a cold cache. Design mode uses Astro's JS API, which has no such deadline.

## Controls

The screen uses the theme it changes. `enhance/choice` from `packages/ui`
renders the route, width and scale selects as the j3w1 combobox. The comparison
server serves `packages/ui/dist` under `/ui/`, as
`site/integrations/copy-exports.mjs` does under `dist/ui`.

The route picker must not be an `<input list>`. Chrome gives one
`appearance: menulist-button`: it drops the author background and colour, draws
the popup as OS chrome placed by the browser, and filters the options so the
rest of the list disappears after a selection. A `<datalist>` popup cannot be
styled at all. For the same reason, the text field beside it has no `list`
attribute.

## Comparison modes

- **Side by side** — both viewports at their true CSS widths, scroll synced.
- **Swipe** — one clipped over the other at an adjustable split; drag the seam
  or use the slider.
- **Blend** — after faded over before; ghosting shows a shift of a few pixels
  that a static pair hides.
- **Blink** — the two alternate in place, so any shift reads as a jump.

Widths match the browser suite's gates: 1440×1000 desktop, 640×500 for 200%
zoom, 360×740 narrow. They are real CSS widths, not scaled screenshots. The
scale control only shrinks the result to fit; it does not emulate device pixel
ratio.

## Token changes

`site/src/styles/tokens.generated.css` is generated; never hand-edit it. To
change a colour, edit `tokens/`. Design mode watches `tokens/` and runs the real
tokens generator, which rewrites that stylesheet, `exports/tokens.resolved.json`
and `exports/tokens.css`. A shortcut that wrote only the stylesheet would repaint
a swatch while the page still printed the old hex, because printed hexes come
from the exports.

A DTCG colour carries both `components` and `hex`, and the resolver rejects it if
they disagree. Write both, with `components` as each channel ÷ 255.

The watcher skips validation and the other fourteen generators. At the end of
the session:

1. Run `npm run generate`. It brings the contrast report, the usage index,
   `schemas/json/`, the README blocks and the digests back into line.
2. Run `npm run check` to prove it.

## The session ledger

`.cache/design-mode/session.json` records each change: the owner's instruction
in their own words, the files touched, and where the change belongs.

```
node scripts/design-mode.mjs --note "warm the panel surface" --class token --files tokens/primitives.tokens.json
```

`--class` is one of `page-local`, `token`, `spec-rule`, `component` or
`copy/identity`. The class matters: the site is confirmation-only
(`theme.json`), so anything that is not page layout belongs in `tokens/` or
`spec/` and must be reconciled there before the work can merge.

`npm run design:exit` prints the session by class and counts the changes that
still need reconciling.

## Where the code is

- `scripts/design-mode.mjs` wires the servers, live proxy, HMR upgrade, watchers
  and regeneration.
- `scripts/tooling/design-mode.mjs` holds the units that need no server, tested
  by `tests/design-mode.test.js`: port derivation, route mapping, the frame
  agent, baseline metadata, route discovery, the ledger and its report, the
  package-manager choice and the prerequisite check.
- Neither file is under `scripts/lib`, so changing design mode does not change
  the package identities `scripts/build-ui.mjs` hashes.
- The live side's route list comes from `scripts/lib/hex-routes.mjs`, the list
  the build's hex-swatch integration reads.

## Limits

- The ledger, baseline and log live in ignored `.cache/`. None of it is evidence
  or published.
- Design mode does not run the check loop or validate, and it decides nothing.
  A new colour, a change to an approved value, a new or renamed role, or any
  change to the focus, selection or contrast rules still needs a decision entry
  in `spec/decisions.md`. Only the owner changes a status.
- Automated rendering in two frames is not a manual keyboard or screen-reader
  result.
