---
id: foundations
title: Foundations
order: 20
summary: Surfaces, text ladder, borders, interaction states, focus, typography, spacing, density, elevation, motion, icons and layout, with the rules that govern each role.
---

Values live in `tokens/`; this document says what each role means and where it
may be used. Every rule below is normative for the `default` profile.

## Surfaces

`surface.desktop` and `surface.canvas` use true black (`#000000`). Readable
content sits on the canvas or `default` (`#100c0c`) panels and cards, `raised` (`#241010`) for sticky headers,
menus and popovers, `overlay` for dialogs and drawers, `sunken` (`#000000`)
for reading and detail panes, `input` for form-control fills, `chrome` and
`chrome-alt` for window frames and bars. Layering is subtle by design; it may
not erase the boundary of a control, which is why controls also carry
`border.control`.

Never tint photographs, video, document content or user-defined data colours to
put more red on screen.

## Text ladder

| Role | Value | Contrast on canvas / default / raised | Use |
| --- | --- | --- | --- |
| `text.prose` | `#f4eeee` | 18.31 / 16.96 / 15.83 | long-form reading, on-fill text |
| `text.bright` | `#ffa2a7` | 10.98 / 10.17 / 9.49 | headings and emphasis |
| `text.default` | `#e99499` | 9.16 / 8.48 / 7.92 | interface and body text |
| `text.muted` | `#bd787d` | 6.15 / 5.69 / 5.31 | secondary text; the darkest colour permitted for chrome text |
| `text.subtle` | `#ad7175` | 5.40 / 5.00 / 4.66 | metadata, comments, line numbers |
| `text.disabled` | `#8a5559` | 3.52 / 3.26 / 3.05 | disabled controls only (exempt under WCAG 1.4.3; at least 3:1 by policy) |
| `text.accent` | `#e53935` | 4.97 / 4.60 / 4.30 | accent text on canvas and default surfaces only |
| `text.accent-strong` | `#f73f35` | 5.72 / 5.29 / 4.94 | accent text safe on every surface |

Ordinary text must reach 4.5:1 against its actual background in every state.
`#a3676b` and `#7d1310` are never text roles in `default`, even when a
particular darker background improves their ratio; they
remain in service as `border.control`, `icon.decorative`, `status.neutral.fill`
and `border.disabled`. Metadata and comments that a person needs to read are
not decorative and use `text.subtle`, not a graphic colour.

The specification page’s generated literal-color previews have the narrow
geometry, checkerboard and motion exception recorded in D-014; the component
and consumer rules remain as written.

## Borders

Every border is 1px (`border.width.default`); 2px (`border.width.emphasis`) is
reserved for the selected indicator bar, the sticky-header rule and the invalid
border. `border.divider` (`#2b0e0d`) separates rows and sections;
`border.default` (`#531310`) is decorative and may never be the only visible
edge of a control; `border.control` (`#a3676b`, 4.71:1) is the boundary of
every form control at rest; `border.active` (`#e53935`) marks the focused or
active control; `border.overlay` (`#e53935`) frames every floating layer.
Styles: solid by default; dashed only for focus, drop targets and read-only
fields; dotted for hints; double for conflicts. Radius is `0` everywhere,
including checkboxes, switches, chips, avatars, badges and tooltips.

<!-- @compact:start -->
## Interaction states

Every interactive component declares which of these apply and demonstrates every applicable one, including the combinations. Precedence when several apply: disabled > loading > invalid > selected > pressed > hover; focus-visible is always drawn on top and never suppressed by another state.

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | rest tokens | — |
| hover (`@media (hover: hover)` only) | background → `interaction.hover.bg`; links and menu items → `interaction.hover.bg-strong` with `text.link-hover` | link underline thickens 1px → 2px; cursor |
| active / pressed | background → `interaction.pressed.bg`; border → `border.active` | border change; no translation |
| focus-visible | the ring (below) | the ring itself; never a glow or a colour shift alone |
| selected | fill `interaction.selection.bg` with `interaction.selection.text`; tabs and navigation use a 2px `border.selected-indicator` | `aria-selected` / `aria-current`; a check glyph in lists |
| selected + focus-visible | the selection fill **and** a ring in the fill's on-fill colour (`interaction.focus.ring-container`, 7.92:1 on the selection) | both visible at once |
| selected, container inactive | `interaction.selection.inactive-bg` with `interaction.selection.inactive-text`; no ring | lightness drop between the two fills |
| disabled | `text.disabled`, `border.disabled`, `interaction.disabled.bg`; no hover or pressed styling; still focusable when `aria-disabled` | `disabled` / `aria-disabled`; `cursor: not-allowed`; never opacity |
| invalid | border → `status.danger.border` at 2px; message in `status.danger.text` with the `✕` glyph; `aria-invalid`; `aria-describedby` | border width 1 → 2px; glyph; message |
| invalid + focus-visible | the 2px danger border **and** the ring in `interaction.focus.ring-container` at `focus.offset-invalid` | double boundary |
| read-only | `text.default`; 1px dotted `border.divider` bottom; no fill; focusable; selectable | `readonly`; dotted edge |
| loading | size unchanged; a static `⋯` glyph replaces the leading icon; `aria-busy` | glyph; no animation under reduced motion |
| busy / indeterminate | static 45° stripes of `action.primary.bg` on `interaction.pressed.bg`; `aria-valuetext` | stripes |
| checked / mixed | fill `action.primary.bg`, glyph `✓` or `–` in `action.primary.text` | glyph |
| expanded / collapsed | SVG chevron rotated 0 / 90° within the motion budget | `aria-expanded` |
| current | 2px `border.selected-indicator` and `text.bright` | indicator bar |
| drop-target / dragging | dashed `interaction.drop-target` border; `interaction.marquee` fill | dashed pattern |

Rules that apply everywhere:

1. **Selection is a fill; focus is a ring.** Neither borrows the other's form. `#e53935` on `#911410` measures 2.15:1, which is why the ring recolours on fills instead of relying on hue.
2. **Focus ring (D-006; component mapping clarification D-015).** Controls and rows: `outline: 1px dashed {color.interaction.focus.ring}; outline-offset: -2px`. Focusable containers (panes, windows, dialogs, cards): `outline: 2px solid {color.interaction.focus.ring-container}; outline-offset: -3px`. On filled surfaces use the component's explicit ring mapping: primary buttons and checked controls use `interaction.focus.ring-container` where declared; destructive buttons use their declared on-fill text role. Selection uses its declared on-fill ring. Keep the control or container geometry independently of the colour mapping. `:focus:not(:focus-visible)` draws nothing. Forced-colors mode uses `Highlight`. A host focus indicator is never removed without this replacement.
3. **Never colour-only.** Every state and every status carries a second channel: a glyph (`✕ ! ✓ i ·`), a border width, an underline pattern, or an ARIA state. Charts carry pattern fills.
4. **Hover changes fills and borders, never text colour alone**, and only on hover-capable pointers.
5. **Disabled never uses opacity.** Opacity leaks the background and breaks contrast accounting.
6. **Contrast floor.** Text ≥ 4.5:1 and control boundaries, rings and meaningful graphics ≥ 3:1 against the actual background of the state, measured after compositing translucent colours.
7. **Motion.** Durations are 80 / 120 / 150 ms at most, on opacity, transform and background only; under `prefers-reduced-motion: reduce` every duration is 0.01 ms, nothing slides or shimmers, and no behaviour waits on `transitionend`.
<!-- @compact:end -->

## Actions

Four button tones. `primary` is the only filled button at rest
(`action.primary.bg` `#871f19` with `text.prose`, 8.17:1); `secondary` is an
outline (`border.control`, text `text.bright`); `tertiary` is a ghost or icon
button (`text.default`, hover `interaction.hover.bg`); `destructive` is an
outline in `action.destructive.text` (`#f73f35`) that fills with
`action.destructive.hover-bg` (`#dc282e`) and `#f9faf9` text (4.58:1) on
hover, and a filled variant for confirm dialogs. Destructive actions also
require a confirmation step or an undo affordance; the colour is not the
safeguard.

## Status, diagnostics and diffs (D-001)

Five statuses: `danger` (`#f73f35` text, `#dc282e` fill), `warning`
(`#c9973f`), `success` (`#86a46f`), `info` (`#7e9ebb`), `neutral` (`#bd787d`
text, `#a3676b` fill). Each has `text`, `fill`, `on-fill`, `tint` and `border`
roles, a mandatory glyph (`✕ ! ✓ i ·`) and a distinct underline or border
pattern (wavy, dashed, solid, dotted, double). The three extension hues are
desaturated and warm-shifted so they sit inside the identity, all between 6.5:1
and 7.6:1 on every surface, and are **forbidden** in `surface`, `text`,
`border`, `interaction` and `action`. Purple, cyan and magenta do not exist in
the theme.

Diagnostics: error = wavy `#e53935` underline, `#f73f35` text, `#e53935`
stripe, `#2b0e0d` line background; warning = wavy amber; info = dotted blue;
hint = dotted `text.subtle`; unused = `text.muted` with a dotted underline.
Diffs: added = `#0f1a0e` line background, green gutter mark and `+`,
word-level additions as a 2px green underline (no fill, so text contrast is
untouched); removed = `#2b0e0d` background, red gutter mark and `−`, word-level
removals underlined and struck through; modified = `#1f1a0c` background, amber
gutter mark and `~`; conflicts = a double `#f73f35` border. Textual markers and
existing status icons are always preserved.

## Code and terminal

Editor surfaces use `code.bg` (`#0c0909`), `code.current-line` (`#1c0a09`),
`code.line-number` (`text.subtle`, replacing the site's `#7d1310`), caret
`#e99499`, selection `#420f0c` (muted text stays 4.71:1 inside it), search
matches `#630f0d` with the current match inverted (`#ffa2a7` on `#0c0909`),
bracket match as a 1px `#e53935` border, indent guides `#531310`, rendered
whitespace `#7d1310` (decorative). Syntax in `default` is monochrome:
keywords `#f73f35`, strings `#bd787d`, comments `#ad7175` italic, numbers and
constants `#d4868b`, functions `#ffa2a7`, variables and operators `#e99499`,
types `#b37175`, properties and headings `#e53935`, tags `#f73f35`,
attributes and escapes `#d4868b`; invalid text takes a wavy underline,
deprecated text a line-through. Languages inherit these roles; a
language-specific override needs a documented reason.

Terminal roles carry the sixteen slots **exactly** in every profile. Slots
1, 4, 6, 8, 9, 10, 12, 13, 14 and 15 do not reach 4.5:1 on the terminal
background (slot 15, `#a3676b`, measures 4.45:1; slot 0 is the background
itself); the theme documents this rather than normalising it, because
programs, not the theme, choose which slot means what. Inside an editor
selection (`code.selection-bg`, `#420f0c`) muted text stays at 4.71:1 but the
keyword, type, property and comment roles fall below 4.5:1; a selection is a
transient state and the limitation is recorded, not hidden. The `extended` overlay
proposes a semantic sixteen-slot palette that all reaches 4.5:1.

Links use strong red `text.link` (`#f73f35`) and a persistent underline, distinct
from the rose body and heading ladder (D-024). Hover uses near-white
`text.link-hover` on `interaction.hover.bg-strong`. Current-page and selected
navigation use their explicit indicator and on-fill roles.

## Typography

One family: `SauceCodePro NFM` (Source Code Pro through the Nerd Fonts build),
falling back to Source Code Pro, Cascadia Mono, Consolas, Liberation Mono,
DejaVu Sans Mono and `monospace`. The site records `size-adjust` metrics for
the fallbacks; no font file is distributed. Weights 400 and 700 plus italic.
Scale (size/line-height in px): `ui-sm` 12/16, `ui-md` 13/18, `ui-lg` 14/20,
`reading` 15/24, `code` 13/19, `terminal` 13/19 with −0.5px letter-spacing,
`h1` 20/28 bold, `h2` 16/24 bold, `h3` 13/18 bold in `text.accent`, `caption`
11/16 only with `text.muted` or lighter. Hosts keep the user's chosen size;
tiny UI text is a reference-implementation metric, not a rule.

## Spacing and density (D-009)

Spacing steps: 0, 1, 2, 4, 8, 12, 16, 24, 32, 48 px. Two density modes applied
with `data-density` on any subtree: `compact` (control 24px, row 28px, `ui-sm`
type, 8px horizontal padding, 2px gaps) matches the workstation; `comfortable`
(control 32px, row 36px, `ui-md` type, 12px padding, 4px gaps) suits everyday
applications. Both meet the 24×24 CSS-pixel target minimum; `compact` requires
4px between adjacent targets. The site's 3px i3 gap, 14/−2 window gaps and
28px bar are window-manager geometry, not theme tokens.

## Elevation and layering

There are no shadows except `shadow.floating` (`0 6px 22px rgb(0 0 0 / 55%)`)
on the i3 floating-window specimen. Floating layers are a 1px `border.overlay`
on `surface.raised`; modals add `surface.backdrop` (`rgb(0 0 0 / 65%)`).
Stacking: canvas 0 < raised 1 < popover 10 < drawer 20 < dialog 30 < toast 40 <
skip link 1000.

## Icons

SVG line icons on a 16px grid, 1.5px stroke, `stroke: currentColor`,
`fill: none`, sizes 12 / 16 / 20. No icon font is required; Nerd Font glyphs
appear only in terminal and heritage specimens. Icon-only controls carry
`aria-label` and a tooltip. `icon.decorative` (`#a3676b`) is for glyphs that
convey nothing on their own.

## Layout

Reading measure 72ch, content column 680px, application layout 1440px.
Breakpoints 320 (reflow floor), 600, 900, 1280. Components use container
queries; sidebars collapse to drawers below 900px; data tables scroll
horizontally with a sticky first column below 600px; the page never scrolls
horizontally at 320px. Right-to-left mirrors breadcrumb separators,
pagination, sidebar and drawer sides, wizard progression, affixes and tree
indentation.
