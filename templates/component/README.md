# Authoring a component

A component is three files plus, for the ten core components, a browser test.
`spec/components/text-field.*` and `site/src/styles/components/text-field.css`
are the reference; copy their shape.

| File | Purpose |
| --- | --- |
| `spec/components/<id>.md` | Frontmatter (validated by `schemas/component.mjs`) + the seven body sections in order: Purpose, Anatomy, States, Keyboard, Accessibility, Portability, Non-examples |
| `spec/components/<id>.demo.html` | Static fragment, one block per declared variant, separated by `<!-- @variant <id> -->` lines (the first block is `default`). No `<script>`, no `style=`, no `on*=`, no root-absolute links. Use real semantics and ids; the matrix suffixes ids per cell |
| `site/src/styles/components/<id>.css` | Reference CSS. Token variables only (`var(--color-…)`, `var(--space-…)`, `--density-*`, `--_local` privates). No hex/rgb/hsl literals; `transparent` and `currentColor` are fine |
| `tests/browser/components/<id>.spec.js` | Only for the ten core components (`spec/inventory.json` → `tested`) |

## Rules the validator enforces

- `id` equals the file name and exists in `spec/inventory.json` with the same
  `family` and `priority`.
- `states` includes `default`; combinations are `a+b` from the canonical
  vocabulary in `schemas/component.mjs` (`STATES`).
- Every declared state (except `default` and `filled`) is described in the
  `## States` table (first column must contain the state name), and every
  row carries a non-colour channel in the third column (`—` counts).
- Every token path in `tokens`, `stateTokens`, `contrast` and any `{role.path}`
  in the prose resolves in the default profile. Prefer semantic roles; never
  reference `color.primitive.*`.
- `stateTokens` pairs are measured automatically: `fg` on `bg` at 4.5:1,
  `border`/`outline` on `bg` at 3:1. Decorative edges must not be declared as
  `border`; declare them in `contrast[]` with a `waiver` instead.
- For every declared state the CSS contains `[data-state="<state>"]` **or**
  `[data-state-<part>]` for each `+` part. Pair every real pseudo-class with
  its forced-state selector (`.x:hover, [data-state-hover] .x { … }`).
- The demo has a fragment for every variant and no undeclared variant.
- `related` and `specimens` name inventory ids. `sources` name
  `references/sources.json` ids.
- Exactly ten components carry `compact: true` (the ten core ones).

## What the state matrix does for you

Each cell is a clone of the variant fragment wrapped in
`<div data-state="a+b" data-state-a data-state-b>`. Non-default cells are
`aria-hidden` with every focusable made `tabindex="-1"`. For native states
the matrix also edits the clone: `disabled` wraps the cell in a disabled
fieldset and adds `disabled`; `read-only` adds `readonly`; `required` adds
`required`; `invalid` adds `aria-invalid="true"`; `checked` adds `checked` to
checkboxes and radios; `placeholder-shown` strips `value`; `loading`/`busy`
add `aria-busy`; `selected`, `current`, `expanded` add the matching `aria-*`
to the root; `open` opens `details`/`dialog`. Everything else is CSS.

## Design rules to apply (spec/foundations.md is normative)

- Radius `0`; borders `1px` (`2px` for the selected indicator, sticky header
  rule and invalid border); control boundaries use `color.border.control`.
- Focus is a ring: `outline: var(--focus-ring); outline-offset: var(--focus-offset)`
  on controls, `var(--focus-ring-container)` / `var(--focus-offset-container)`
  on containers, and on a fill the ring takes the fill's on-fill text colour.
  Selection is a fill; never draw focus as a fill.
- Hover changes fills and borders only; disabled never uses opacity; every
  status carries its glyph; nothing animates longer than 150ms and reduced
  motion removes it.
- Heights come from `--density-control-height` / `--density-row-height` with
  a fallback (`var(--density-control-height, 32px)`).
- Give every flex or grid item that holds an input `min-width: 0`; otherwise it refuses to shrink at 320px or 200% zoom.
- Use native elements where the frontmatter says `native: true`; custom
  widgets cite an APG pattern and implement its keyboard contract in the
  `keyboard` list.

## Check

```
node scripts/validate.mjs spec     # frontmatter, tokens, states, CSS pairs, contrast
npm run generate && npm run build && npm run test:dist && npm run test:browser
```
