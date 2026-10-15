---
id: identity
title: Identity
order: 10
summary: What the j3w1 theme is, where it came from, and the five rules that keep a port recognisable.
---

<!-- @compact:start -->
True-black canvas (`#000000`), near-black panels (`#100c0c`) and chrome (`#090707`), with dark-red raised layers, rose interface and reading text (`#e99499`), near-white content headings (`#f4eeee`), dark-red selections (`#531310`), a bright red focus ring (`#e53935`), 1px square borders, zero radii, one monospace family for chrome, reading and code. Red marks *interaction*: focus, selection, active borders, primary actions; it is not decoration. Darkness is the canvas; readable content is the priority.

Five rules keep an implementation recognisable:

1. Preserve the warm-black / rose / red identity. Never substitute a charcoal-and-blue dark theme because the target ships one.
2. Use the role assigned to a token, never the token whose colour happens to look closest.
3. Keep content, selection, keyboard focus, diagnostics and changed text distinguishable from one another. Selection is a fill; focus is a ring.
4. Nothing is rounded, blurred, glowing or gradient-filled. Elevation is a 1px border and, for modals, a backdrop.
5. Preserve the host application's behaviour, keyboard handling and accessibility settings. Geometry and typography limits of a host are documented deviations, not reasons to rewrite it.
<!-- @compact:end -->

## Where it came from

The palette began on a Manjaro i3 workstation (`j3w1/1w3j`): a pywal ramp
from a red wallpaper, frozen and tuned slot by slot in `config/Xresources`.
The i3 configuration gave the rest: 1px borders, 14/−2 gaps, tabbed layouts,
dunst toasts framed in `#ae1914`, dmenu selections in `#630f0d`. Its web
version, `j3w1/j3w1.github.io`, named the roles this specification uses and
wrote the first contrast contract. Both are pinned in
`references/sources.json`. This repository is the authority: later changes in
either source are proposals, not automatic updates.

## What "modern" means here

Clear structure, responsive layout, strong keyboard and screen-reader
support, exact states, pleasant controls. Not pill buttons, glass panels,
gradients, neon glows, a Material-style redesign, or red on every surface; the
site draws such misreadings as labelled non-examples.

One exception (D-014): the generated preview beside each visible CSS hex
literal on the spec page. It adds no palette, role or geometry rule, and text,
copying, keyboard order and no-JS access stay intact.

- A 16px circle with its theme-derived 1px boundary; alpha shows over a
  checkerboard of theme tokens.
- On CSS `:hover` it becomes a 17.4px square (fast duration, ease-out on
  transform and border-radius; none under reduced motion).
- Mouse and pen pointers also open a non-interactive popup with the exact
  value; touch and unknown pointers do not. CSS `:hover` alone drives both,
  never the `hover` or `any-hover` media features, which can report no hover
  despite a mouse.
- The popup follows the pointer inside the circle at an 8px gap, flips when
  needed and keeps an 8px viewport gutter. Tracking has no animation.
- It closes when the pointer leaves the circle, on an outside press, Escape,
  loss of window focus, and on page or nested scrolling unless the circle is
  still under the last pointer position. It never captures input, holds
  itself open or adds a keyboard stop; token tables and the token inspector
  keep the persistent information.

## Profiles

- `default` — the approved everyday composition: monochrome red/rose for
  chrome, text, borders, interaction and actions; three bounded hues (amber,
  green, blue) for status, diagnostics and diffs (D-001). Syntax is monochrome;
  opt-in syntax themes may use the hues as `code.hued.*` (D-030).
- `heritage-ansi` — the sixteen Xresources slots and their historical
  assignments, exact, including those that fail the contrast floor. For
  terminals, archives and fidelity, never new interface text.
- `extended` — a proposed, unapproved overlay that colours syntax, a
  sixteen-slot semantic terminal palette and chart series with the same three
  hues.

## Naming

Roles are `color.<group>.<role>`, from a closed group list: `surface`, `text`,
`border`, `interaction`, `action`, `status`, `code`, `diagnostic`, `diff`,
`terminal`, `chart`, `icon`. Primitives are `color.primitive.<family>.<step>`,
the step rising with luminance; roles alias primitives, and primitives carry
provenance. A CSS custom property is the path with dashes for dots:
`color.interaction.focus.ring` → `--color-interaction-focus-ring`.
