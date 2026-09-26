---
id: identity
title: Identity
order: 10
summary: What the j3w1 theme is, where it came from, and the five rules that keep a port recognisable.
---

<!-- @compact:start -->
True-black canvas (`#000000`), near-black panels (`#100c0c`) and chrome (`#090707`), with dark-red raised layers, rose interface text (`#e99499`), near-white reading text (`#f4eeee`), dark-red selections (`#531310`), a bright red focus ring (`#e53935`), 1px square borders, zero radii, one monospace family for chrome, reading and code. Red marks *interaction*: focus, selection, active borders, primary actions. It is not a decoration and it is not applied to everything. Darkness is the canvas; readable content is the priority.

Five rules keep an implementation recognisable:

1. Preserve the warm-black / rose / red identity. Never substitute a charcoal-and-blue dark theme because the target ships one.
2. Use the role assigned to a token, never the token whose colour happens to look closest.
3. Keep content, selection, keyboard focus, diagnostics and changed text distinguishable from one another. Selection is a fill; focus is a ring.
4. Nothing is rounded, blurred, glowing or gradient-filled. Elevation is a 1px border and, for modals, a backdrop.
5. Preserve the host application's behaviour, keyboard handling and accessibility settings. Geometry and typography limits of a host are documented deviations, not reasons to rewrite it.
<!-- @compact:end -->

## Where it came from

The palette began on a Manjaro i3 workstation, preserved in `j3w1/1w3j`. A
pywal ramp was pulled from a red wallpaper, then frozen and tuned slot by slot
in `config/Xresources` while watching what `ls`, vim and the agnoster prompt
really showed. The i3 configuration gave the rest of the look: 1px pixel
borders, 14/−2 gaps, tabbed layouts, a hidden top bar with Chinese status
labels, dunst toasts framed in `#ae1914`, and dmenu selections in `#630f0d`.

The modern reference is `j3w1/j3w1.github.io`, a web version of that
workstation. Its stylesheet named the roles this specification uses
(`--terminal`, `--surface-raised`, `--selection`, `--focus`, `--prose`,
`--muted` …) and wrote the first contrast contract. Both sources are pinned by
revision in `references/sources.json`. This repository is now the authority:
later changes in either source are proposals, not automatic updates.

## What "modern" means here

Modern means clear structure, responsive layout, strong keyboard and
screen-reader support, exact states, and controls that are pleasant to use. It
does not mean pill buttons, glass panels, gradients, neon glows, a
Material-style redesign, or red on every surface. The site shows sixteen such
misreadings as labelled non-examples.

One narrow exception: the colour previews that the spec page draws next to
each hex value may be round, sit on a checkerboard and animate (D-014).
Component and consumer rules do not change.

## Profiles

- `default` — the approved everyday composition. Monochrome red/rose for chrome,
  text, borders, interaction and actions. Three bounded hues (amber, green,
  blue) for status, diagnostics and diffs (D-001). Syntax is monochrome; the
  three hues are available to opt-in syntax themes as `code.hued.*` (D-030).
- `heritage-ansi` — the sixteen Xresources slots and their historical
  assignments, exact, including the ones that fail the contrast floor. Use it
  for terminals, archives and fidelity, never for new interface text.
- `extended` — a proposed overlay that colours syntax, a full sixteen-slot
  semantic terminal palette and chart series with the same three hues. It is
  not approved, and the site labels it.

## Naming

Roles are `color.<group>.<role>`. The group list is closed: `surface`, `text`,
`border`, `interaction`, `action`, `status`, `code`, `diagnostic`, `diff`,
`terminal`, `chart`, `icon`. Primitives are `color.primitive.<family>.<step>`;
the step rises with luminance. A CSS custom property is the path with dots
replaced by dashes: `color.interaction.focus.ring` →
`--color-interaction-focus-ring`. Roles alias primitives; primitives carry
provenance.
