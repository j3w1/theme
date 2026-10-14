---
id: foundations
title: Foundations
order: 20
summary: Surfaces, text ladder, borders, interaction states, focus, typography, spacing, density, elevation, motion, icons and layout, with the rules that govern each role.
---

Values live in `tokens/`; this document says what each role means and where
it may be used. Every rule is normative for the `default` profile.

## Surfaces

`surface.desktop` and `surface.canvas` are true black (`#000000`). Readable
content sits on the canvas or on:

- `default` (`#100c0c`) for panels and cards;
- `raised` (`#160b0b`) for sticky headers, menus and popovers;
- `overlay` for dialogs and drawers;
- `accent` (`#3d0c0a`) for the user's own content set apart from its neighbours, such as outgoing chat messages; secondary text on it uses `text.muted`, never `text.subtle`. Red links cap its brightness: at this hue it stays at or below `#3f0c0a` (D-035);
- `sunken` (`#000000`) for reading and detail panes;
- `input` for form-control fills;
- `chrome` and `chrome-alt` for window frames and bars.

The layers differ only slightly, so controls also carry `border.control`.
Never tint photos, video, document content or user-defined data colours.

## Text ladder

| Role | Value | Use |
| --- | --- | --- |
| `text.prose` | `#e99499` | long-form reading; aliases text.default (D-033) |
| `text.heading` | `#f4eeee` | content titles and H1–H6 |
| `text.highlight` | `#f4eeee` | deliberate exceptional highlights |
| `text.bright` | `#ffa2a7` | brighter UI labels and semantic rose emphasis |
| `text.default` | `#e99499` | interface and body text |
| `text.muted` | `#bd787d` | secondary text; the darkest colour permitted for chrome text |
| `text.subtle` | `#ad7175` | metadata, comments, line numbers |
| `text.disabled` | `#8a5559` | disabled controls only (exempt under WCAG 1.4.3; at least 3:1 by policy) |
| `text.accent` | `#e53935` | accent text on canvas and default surfaces only |
| `text.accent-strong` | `#f73f35` | accent text safe on every surface |
| `text.link` | `#f73f35` | links, always underlined, distinct from rose body and headings (D-024); hover is near-white `text.link-hover` on `interaction.hover.bg` (D-027) |

Ratios per surface are in the contrast report. `#a3676b` and `#7d1310` are
never text roles in `default`, even on a darker background (D-003); they serve
as `border.control`, `icon.decorative`, `status.neutral.fill`,
`chart.series.4`, `border.disabled` and `code.whitespace`. Metadata and
comments people need to read use `text.subtle`, not a graphic colour.

## Borders

Every border is 1px (`border.width.default`). 2px (`border.width.emphasis`) is
only for the selected indicator bar, the sticky-header rule and the invalid
border. The quote rule, which marks a block rather than bounding a control, is
the one wider edge, at twice the emphasis width.

- `border.divider` (`#2b0e0d`) separates rows and sections.
- `border.default` (`#531310`) is decorative, never the only visible edge of
  a control.
- `border.control` (`#a3676b`) is the edge of every form control at rest.
- `border.active` (`#e53935`) marks the focused or active control.
- `border.overlay` (`#e53935`) frames every floating layer.

Styles: solid by default; dashed only for focus, drop targets and read-only
fields; dotted for hints; double for conflicts. Radius is `0` everywhere,
including checkboxes, switches, chips, avatars, badges and tooltips.

<!-- @compact:start -->
## Interaction states

Every interactive component declares which of these apply and demonstrates every applicable one, including the combinations. Precedence when several apply: disabled > loading > invalid > selected > pressed > hover; focus-visible is always drawn on top and never suppressed by another state.

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | rest tokens | — |
| hover (`@media (hover: hover)` only) | background → `interaction.hover.bg`; links use it too with `text.link-hover`, menu items → `interaction.hover.bg-strong` | link underline thickens 1px → 2px; cursor |
| active / pressed | background → `interaction.pressed.bg`; border → `border.active` | border change; no translation |
| focus-visible | the ring (below) | the ring itself; never a glow or a colour shift alone |
| selected | fill `interaction.selection.bg` with `interaction.selection.text`; tabs and navigation use a 2px `border.selected-indicator` | `aria-selected` / `aria-current`; a check glyph in lists |
| selected + focus-visible | the selection fill **and** the ordinary ring (rule 1; D-027) | both visible at once |
| text selected, host keeps the text colour | translucent `interaction.text-selection.tint` (D-036), which also suits hosts that paint the fill over their content; where the host can recolour selected text, `interaction.text-selection.bg` with `interaction.text-selection.text` | the host's selection handles |
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

1. **Selection is a fill; focus is a ring.** Neither borrows the other's form. The ring must reach 3:1 on whatever it sits over: `#e53935` falls below it on `action.primary.bg` and `status.danger.fill`, so the ring recolours on those fills; it meets it on `interaction.selection.bg` (D-027), so a selected row keeps the ordinary control ring.
2. **Focus ring (D-006; component mapping clarification D-015).** Controls and rows: `outline: 1px dashed {color.interaction.focus.ring}; outline-offset: -2px`. Focusable containers (panes, windows, dialogs, cards): `outline: 2px solid {color.interaction.focus.ring-container}; outline-offset: -3px`. On filled surfaces use the component's explicit ring mapping: primary buttons and checked controls use `interaction.focus.ring-container` where declared; destructive buttons use their declared on-fill text role. The selection fill is the exception and takes the ordinary ring, on the measurement in rule 1. Keep the control or container geometry independently of the colour mapping. `:focus:not(:focus-visible)` draws nothing. Forced-colors mode uses `Highlight`. A host focus indicator is never removed without this replacement.
3. **Never colour-only.** Every state and every status carries a second channel: a glyph (`✕ ! ✓ i ·`), a border width, an underline pattern, or an ARIA state. Charts carry pattern fills.
4. **Hover changes fills and borders, never text colour alone**, and only on hover-capable pointers.
5. **Disabled never uses opacity.** Opacity leaks the background and breaks contrast accounting.
6. **Contrast floor.** Text ≥ 4.5:1 and control boundaries, rings and meaningful graphics ≥ 3:1 against the actual background of the state, measured after compositing translucent colours.
7. **Motion.** Durations are 80 / 120 / 150 ms at most, on opacity, transform and background only; under `prefers-reduced-motion: reduce` every duration is 0.01 ms, nothing slides or shimmers, and no behaviour waits on `transitionend`.
<!-- @compact:end -->

## Actions

Four button tones:

- `primary`, the only filled button at rest: `action.primary.bg` (`#7d1310`)
  with `action.primary.text` (bright rose; D-033).
- `secondary`, an outline: `border.control`, text `text.bright`.
- `tertiary`, a ghost or icon button: `text.default`, hover
  `interaction.hover.bg`.
- `destructive`, an outline in `action.destructive.text` (`#f73f35`) that
  fills on hover with `action.destructive.hover-bg` (`#dc282e`) and `#f9faf9`
  text. A filled variant exists for confirm dialogs.

Destructive actions also need a confirmation step or an undo; the colour is
not the safeguard.

## Status, diagnostics and diffs (D-001)

Five statuses: `danger` (`#f73f35` text, `#dc282e` fill), `warning`
(`#c9973f`), `success` (`#86a46f`), `info` (`#7e9ebb`), `neutral` (`#bd787d`
text, `#a3676b` fill). Each has `text`, `fill`, `on-fill`, `tint` and `border`
roles, a required glyph (`✕ ! ✓ i ·`) and its own underline or border pattern
(wavy, dashed, solid, dotted, double). The three extension hues are
desaturated and shifted warm to fit the identity, and meet 4.5:1 as text on
every surface. They are **forbidden** in `surface`, `text`, `border`,
`interaction` and `action`. Purple, cyan and magenta do not exist in the
theme.

Diagnostics:

- error: wavy `#e53935` underline, `#f73f35` text, `#e53935` stripe, `#2b0e0d`
  line background;
- warning: wavy amber;
- info: dotted blue;
- hint: dotted `text.subtle`;
- unused: `text.muted` with a dotted underline.

Diffs:

- added: `#0f1a0e` line background, green gutter mark and `+`; word-level
  additions as a 2px green underline (no fill, so text contrast is untouched);
- removed: `#2b0e0d` background, red gutter mark and `−`; word-level removals
  underlined and struck through;
- modified: `#1f1a0c` background, amber gutter mark and `~`;
- conflicts: a double `#f73f35` border.

Always keep textual markers and existing status icons.

## Code and terminal

Editor surfaces:

- background `code.bg` (`#0c0909`), current line `code.current-line`
  (`#1c0a09`);
- line numbers `code.line-number` (`text.subtle`, replacing the site's
  `#7d1310`);
- caret `#e99499`;
- selection `#420f0c` (muted text stays above 4.5:1 inside it);
- search matches `#630f0d`, with the current match inverted (`#ffa2a7` on
  `#0c0909`);
- bracket match as a 1px `#e53935` border;
- indent guides `#531310`; rendered whitespace `#7d1310` (decorative).

Syntax in `default` is monochrome: keywords `#f7463c`, strings `#bd787d`,
comments `#ad7175` italic, numbers and constants `#d4868b`, functions
`#ffa2a7`, variables and operators `#e99499`, types `#b37175`, properties and
headings `#e95551`, tags `#f7463c`, attributes and escapes `#d4868b` (the two
reds as lifted by D-029). Hosts that want hue can opt in to `code.hued.*`
(D-030): strings green `#86a46f`; numbers, constants, functions, attributes and
escapes amber `#c9973f`; types and properties blue `#7e9ebb`; operators
`#ffa2a7`. Keywords, tags, comments, variables and punctuation do not change.
Invalid text takes a wavy underline; deprecated text a line-through. Languages
inherit these roles; a language-specific override needs a written reason.
Inside an editor selection some syntax roles fall below 4.5:1; see
`spec/accessibility.md`, Limitations.

Terminal slots:

- `heritage-ansi` carries the sixteen `Xresources` slots exactly.
  `color.primitive.ansi.*` keeps those values byte for byte; lifted values
  live in `color.primitive.ansi-readable.*`, and `heritage-ansi` pins every
  changed role back to the heritage primitive (D-029).
- `default` carries the readable heritage sixteen (D-029): every slot that
  fell below the text floor keeps its hue and saturation and gains lightness,
  except slot 6, which is coral `#ff7a66` (D-032). Slots 1–7 and 9–15 reach
  4.5:1 on the terminal background; slot 8 (bright black) stays the dim tier,
  at 3:1.
- The `extended` overlay proposes a semantic sixteen that all reach 4.5:1.

Programs, not the theme, choose which slot means what; the readable sixteen
make that choice safe for text.

## Typography

One family: `SauceCodePro NFM` (Source Code Pro in the Nerd Fonts build),
falling back to Source Code Pro, Cascadia Mono, Consolas, Liberation Mono,
DejaVu Sans Mono and `monospace`. The site records `size-adjust` metrics for
the fallbacks; no font file is distributed. Weights 400 and 700, plus italic.

Scale (size/line-height in px): `ui-sm` 12/16, `ui-md` 13/18, `ui-lg` 14/20,
`reading` 15/24, `code` 13/19, `terminal` 13/19 with −0.5px letter-spacing,
`h1` 20/28 bold, `h2` 16/24 bold, `h3` 13/18 bold in `text.heading`, `caption`
11/16 only with `text.muted` or lighter. Proposed (D-037): `display` 32/40 for
page heroes and metric figures and `title` 24/32 for page titles above `h1`;
components keep `h1`–`h3`. Hosts keep the size the user chose; tiny UI text is
a metric of the reference implementation, not a rule.

## Spacing and density (D-009)

Spacing steps: 0, 1, 2, 4, 8, 12, 16, 24, 32, 48 px. `compact` is the default
density (D-038): it applies wherever no `data-density` is set, in components,
the site and copied bundles. Set `data-density="comfortable"` on any subtree to
opt in to the larger mode:

| Mode | Control | Row | Type | Horizontal padding | Gaps | Use |
| --- | --- | --- | --- | --- | --- | --- |
| `compact` | 24px | 28px | `ui-sm` | 8px | 2px | matches the workstation |
| `comfortable` | 32px | 36px | `ui-md` | 12px | 4px | everyday applications |

Both meet the 24×24 CSS-pixel target minimum; `compact` needs 4px between
neighbouring targets. Table rows always use the comfortable row height (a data
row is content, and compact rows are harder to scan); controls inside a row
follow the page density. The site's 3px i3 gap, 14/−2 window gaps and 28px bar
are window-manager geometry, not theme tokens.

## Elevation and layering

No shadows, except `shadow.floating` (`0 6px 22px rgb(0 0 0 / 55%)`) on the i3
floating-window specimen. A floating layer is a 1px `border.overlay` on
`surface.raised`; a modal adds `surface.backdrop` (`rgb(0 0 0 / 65%)`).
Stacking: canvas 0 < raised 1 < popover 10 < drawer 20 < dialog 30 < toast 40 <
skip link 1000.

A popup opened by hovering follows the pointer:

- It sits 8px from the cursor, flips to the cursor's other side instead of
  crossing a viewport edge, and keeps 8px from every edge.
- It moves again on pointer move, scroll and resize.
- A popup with nothing to operate takes no pointer events; one with a control
  or link stays reachable and open while the pointer is inside it.
- Either kind closes when the pointer leaves both the trigger and the popup.

Opened from the keyboard, the same popup anchors to its trigger: below it, or
above when there is no room below. This is a placement rule only; what opens a
popup and what kind it is belong to the component's contract.

## Icons

SVG line icons on a 16px grid, 1.5px stroke, `stroke: currentColor`,
`fill: none`, sizes 12 / 16 / 20. No icon font is needed; Nerd Font glyphs
appear only in terminal and heritage specimens. Icon-only controls carry
`aria-label` and a tooltip. `icon.decorative` (`#a3676b`) is for glyphs that
mean nothing on their own.

## Layout

Reading measure 72ch, content column 680px, application layout 1440px.
Breakpoints 320 (reflow floor), 600, 900, 1280.

- Components use container queries.
- Sidebars collapse to drawers below 900px.
- Data tables scroll horizontally, with a sticky first column, below 600px.
- The page never scrolls horizontally at 320px.
- Right-to-left mirrors breadcrumb separators, pagination, sidebar and drawer
  sides, wizard progression, affixes and tree indentation.

## Typography semantics (D-033)

All content titles and H1–H6 use `text.heading`; size, weight and spacing carry
the hierarchy. Chrome and window titles use `text.default` or `text.bright`;
body and long-form prose use `text.default` and `text.prose`. Bold inherits the
current semantic colour, including inside headings, muted text, links and
selections, and never requests white by itself. Near-white is limited to
headings, deliberate highlights, selections, hover highlights and documented
contrast-critical on-fill text; measure the actual state pair. Role audit:
`docs/rose-typography-migration.md`.
