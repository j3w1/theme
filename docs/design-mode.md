# Design mode

Design mode is the local loop for changing how the theme looks. It renders the
published site twice behind one comparison screen — a frozen production build of
where the session started next to the live dev server — so a change can be
judged against what it replaces before any of it is committed.

It is a working tool, not a gate. Nothing it produces is evidence, and entering
it approves nothing.

## Run it

The repository is an npm workspace, and design mode is run through npm:

```
npm ci
npm run design:doctor   # optional: checks the prerequisites below and stops
npm run design
```

The comparison screen is `http://localhost:4400/`. `DESIGN_PORT` moves it; the
frozen side, the live side and the dev server take the next three ports
(`DESIGN_DEV_PORT` moves only the last). Stop with Ctrl+C.

The three servers listen first, so the screen answers at once. Behind it, the
first entry builds the baseline (`npm run build`) and then starts the dev
server, whose first content sync can take about a minute on a cold cache. The
status line under the controls names whichever is running. Until the dev
server is ready the after frame shows the frozen build, and both frames reload
when it is.

Later entries reuse the baseline whenever `.cache/design-mode/baseline/` and
its `baseline.json` exist, wherever `HEAD` has moved since. That is deliberate:
a session commits a checkpoint after each accepted change, and rebuilding
"before" each time would destroy what is being compared against. The label on
the before frame names the commit it was anchored at, plus "working tree" when
the tree was dirty then. `npm run design:baseline` re-anchors the frozen side to
the working tree, which is also what the **Re-anchor before** button does. Use
it to chain comparisons across a long session instead of always diffing
against where it started.

### Prerequisites

`npm run design:doctor` checks each of these and names the fix for any that
fails; `npm run design` runs the same check before it starts anything.

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

`package.json` declares `"packageManager": "npm@…"`. pnpm and Yarn read that
field and refuse to install into or run scripts in this repository, which keeps
a second lockfile from appearing next to `package-lock.json`. The baseline build
always runs npm, because the workspace layout and `scripts/pack-ui.mjs`
(`npm pack --workspace … --json`) are npm-specific. When design mode is started
through `npm run`, the build runs that same npm directly (no `PATH` lookup, no
shell). Started any other way, for example with `node scripts/design-mode.mjs`,
it runs `npm` from `PATH` and says so.

Astro's telemetry is disabled for design mode and the processes it starts.

## What the two sides are

| Side | Source | Why |
| --- | --- | --- |
| before | `.cache/design-mode/baseline/`, a frozen `npm run build` | Production-faithful: real base path, inline hex previews, `ui/` and `demo/` present |
| after | the dev server, proxied | Vite HMR, so an edit repaints immediately |

The two are served from separate origins so every internal link, asset and
runtime fetch resolves exactly as it does on Pages. Cross-origin frames cannot
read each other, so each side carries a small injected agent that relays its
scroll ratio and its route through the comparison screen.

Every Astro integration in this repository hooks `astro:build:done`, so under
the dev server the `ui/`, `demo/`, `exports/` and `downloads/` trees are missing
and the inline hex previews (D-014) are never applied. Both would read as
differences the session did not cause, so the live proxy closes them: it applies
the same decoration the build applies, using the same
`decorateHexHtml`/`tokenColorIndex` pair and the same route list, and falls back
to the frozen build for anything the dev server cannot answer. A fallback
response carries `x-design-mode: baseline-fallback`.

`astro dev` on its own cannot start this project: the CLI forks the dev server
and gives it 30 seconds to report ready, and syncing 67 component collections
takes longer than that on a cold cache. Design mode uses Astro's JS API, which
has no such deadline.

## Controls

The screen is built from the theme it exists to change. `enhance/choice` from
`packages/ui` renders the route, width and scale selects as the j3w1 combobox,
and the comparison server serves `packages/ui/dist` under `/ui/` the way
`site/integrations/copy-exports.mjs` puts it under `dist/ui`.

The route picker must not be an `<input list>`. Chrome's UA stylesheet gives
one `appearance: menulist-button`, which discards the author background and
colour, draws the popup as OS chrome positioned by the browser rather than
under the field, and filters the options natively so the rest of the list
disappears after a selection. A `<datalist>` popup cannot be styled at all. The
plain text field beside it carries no `list` attribute for the same reason.

## Comparison modes

- **Side by side** — both viewports at their true CSS widths, scroll synced.
- **Swipe** — one clipped over the other at an adjustable split; drag the seam
  or use the slider.
- **Blend** — the after side faded over the before side; ghosting reveals
  movement of a few pixels that a static pair hides.
- **Blink** — the two alternated in place, which makes any shift read as a jump.

Widths are the ones the browser suite gates on: 1440×1000 desktop, 640×500 for
200% zoom, 360×740 narrow. They are real CSS widths, not scaled screenshots;
the scale control only shrinks the rendered result to fit the screen and does
not emulate device pixel ratio.

## Token changes

`site/src/styles/tokens.generated.css` is generated and must never be
hand-edited, so a colour change edits `tokens/` and regenerates. Design mode
watches `tokens/` and runs the real tokens generator, which rewrites that
stylesheet along with `exports/tokens.resolved.json` and `exports/tokens.css`.

The generator runs rather than a shortcut because the page prints token hexes
read back out of the exports: writing only the stylesheet would repaint a
swatch while its printed value still claimed the old hex.

A DTCG colour carries both `components` and `hex`, and the resolver rejects the
token if they disagree — write both, with `components` as each channel ÷ 255.

What the watcher skips is validation and the other fourteen generators.
`npm run generate` at the end of the session is what brings the contrast report,
the usage index, `schemas/json/`, the README blocks and the digests back into
line, and `npm run check` is what proves it.

## The session ledger

`.cache/design-mode/session.json` records each change: the instruction in the
owner's own words, the files touched, and where the change ultimately belongs.

```
node scripts/design-mode.mjs --note "warm the panel surface" --class token --files tokens/primitives.tokens.json
```

`--class` is one of `page-local`, `token`, `spec-rule`, `component` or
`copy/identity`. The classification is the point: the site is confirmation-only
(`theme.json`), so anything that is not genuinely page layout has a home in
`tokens/` or `spec/` and has to be reconciled there before the work can merge.

`npm run design:exit` prints the session grouped by class, and names how many
changes still owe a reconciliation.

## Where the code is

`scripts/design-mode.mjs` wires the servers, the live proxy, the HMR upgrade,
the watchers and the regeneration. The units that need no server live in
`scripts/tooling/design-mode.mjs` and are covered by `tests/design-mode.test.js`:
port derivation, route mapping, the frame agent, baseline metadata, route
discovery, the ledger and its report, the package-manager choice and the
prerequisite check. Neither file is under `scripts/lib`, so changing design mode
does not change the package identities `scripts/build-ui.mjs` hashes. The route
list the live side decorates comes from `scripts/lib/hex-routes.mjs`, the same
list the build's hex-swatch integration reads.

## Limits

The ledger, the baseline and the log live in ignored `.cache/`; none of it is
evidence and none of it is published. Design mode does not run the check loop,
does not validate, and does not decide anything: a new colour, a change to an
approved value, a new or renamed role and any change to the focus, selection or
contrast rules still need a decision entry in `spec/decisions.md`, and only the
owner changes a status. Automated rendering in two frames is not a manual
keyboard or screen-reader result.
