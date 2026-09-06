---
id: diff-view
name: Diff view
family: developer
maturity: stable
priority: R1
since: 0.1.0
order: 30
summary: Unified and split diffs as native tables; added, removed and modified rows keep their textual gutter marker, word-level changes are underlines, conflicts are double borders.
native: true
aria:
  pattern: "native <table> with a caption; one row per line; collapsed hunks are a <button> with aria-expanded controlling a hidden <tbody>"
  apg: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
variants:
  - id: unified
    name: Unified
    description: One column of lines with old and new numbers and the + − ~ gutter.
  - id: split
    name: Split
    description: Old and new side by side, each with its own numbers and marker.
  - id: word-level
    name: Word-level
    description: Removed and added rows with the changed words underlined.
  - id: conflict
    name: Merge conflict
    description: Ours, theirs and the three marker lines inside a double border.
sizes: [compact, comfortable]
states:
  - default
  - hover
  - selected
  - focus-visible
  - expanded
  - collapsed
tokens:
  root.bg: color.code.bg
  root.border: color.border.control
  root.text: color.text.default
  line-number.text: color.text.muted
  line-number.rule: color.code.gutter-rule
  row.divider: color.border.divider
  added.bg: color.diff.added.bg
  added.gutter: color.diff.added.gutter
  added.emphasis: color.diff.added.emphasis
  removed.bg: color.diff.removed.bg
  removed.gutter: color.diff.removed.gutter
  removed.emphasis: color.diff.removed.emphasis
  modified.bg: color.diff.modified.bg
  modified.gutter: color.diff.modified.gutter
  hunk.bg: color.diff.header-bg
  hunk.text: color.text.muted
  hunk.context: color.text.default
  conflict.border: color.diff.conflict-border
  conflict.marker: color.text.bright
  fold.text: color.text.link
  fold.bg-hover: color.interaction.hover.bg-strong
  row.bg-hover: color.interaction.hover.bg
  row.ring: color.interaction.focus.ring
  row.bg-selected: color.interaction.selection.bg
  row.text-selected: color.interaction.selection.text
  row.ring-selected: color.interaction.focus.ring-container
stateTokens:
  default: { fg: color.text.default, bg: color.code.bg, border: color.border.control }
  hover: { fg: color.text.default, bg: color.interaction.hover.bg }
  selected: { fg: color.interaction.selection.text, bg: color.interaction.selection.bg }
  focus-visible: { fg: color.text.default, bg: color.code.bg, outline: color.interaction.focus.ring }
  expanded: { fg: color.text.link, bg: color.diff.header-bg }
  collapsed: { fg: color.text.link, bg: color.diff.header-bg }
contrast:
  - { fg: color.text.default, bg: color.diff.added.bg, label: "text on an added row" }
  - { fg: color.text.default, bg: color.diff.removed.bg, label: "text on a removed row" }
  - { fg: color.text.default, bg: color.diff.modified.bg, label: "text on a modified row" }
  - { fg: color.text.default, bg: color.diff.header-bg, label: "hunk context on the header" }
  - { fg: color.text.muted, bg: color.diff.header-bg, label: "hunk range on the header" }
  - { fg: color.text.muted, bg: color.code.bg, label: "line numbers on a context row" }
  - { fg: color.text.muted, bg: color.diff.added.bg, label: "line numbers on an added row" }
  - { fg: color.text.muted, bg: color.diff.removed.bg, label: "line numbers on a removed row" }
  - { fg: color.text.muted, bg: color.diff.modified.bg, label: "line numbers on a modified row" }
  - { fg: color.diff.added.gutter, bg: color.diff.added.bg, label: "the + marker" }
  - { fg: color.diff.removed.gutter, bg: color.diff.removed.bg, min: 3, kind: ui, label: "the − marker (bold, 4.24:1; glyph plus fill)" }
  - { fg: color.diff.modified.gutter, bg: color.diff.modified.bg, label: "the ~ marker" }
  - { fg: color.diff.added.emphasis, bg: color.diff.added.bg, min: 3, kind: ui, label: "word-level added underline" }
  - { fg: color.diff.removed.emphasis, bg: color.diff.removed.bg, min: 3, kind: ui, label: "word-level removed underline and strike" }
  - { fg: color.diff.conflict-border, bg: color.code.bg, min: 3, kind: ui, label: "conflict double border" }
  - { fg: color.text.bright, bg: color.diff.header-bg, label: "conflict marker lines" }
  - { fg: color.interaction.focus.ring, bg: color.diff.added.bg, min: 3, kind: ui, state: focus-visible, label: "ring on an added row" }
  - { fg: color.interaction.focus.ring, bg: color.diff.removed.bg, min: 3, kind: ui, state: focus-visible, label: "ring on a removed row" }
  - { fg: color.interaction.focus.ring, bg: color.diff.modified.bg, min: 3, kind: ui, state: focus-visible, label: "ring on a modified row" }
  - { fg: color.interaction.focus.ring-container, bg: color.interaction.selection.bg, min: 3, kind: ui, state: focus-visible, label: "ring on the selected row" }
  - { fg: color.text.link, bg: color.diff.header-bg, label: "fold button text" }
anatomy:
  - part: root
    description: The table on code.bg inside a 1px border.control box; the caption names the file pair.
  - part: row
    description: One line of the diff; context rows are plain, added rows fill added.bg, removed rows removed.bg, modified rows modified.bg.
  - part: ln
    description: Old and new line numbers in text.muted with a 1px gutter-rule on the inner edge; empty on the side that has no line.
  - part: marker
    description: The textual gutter glyph, bold; + in added.gutter, − in removed.gutter, ~ in modified.gutter, a space on context rows.
  - part: text
    description: The line, white-space preserved; word-level spans sit inside it.
  - part: hunk
    description: The @@ header row on header-bg; the range in text.muted, the enclosing symbol in text.default.
  - part: fold
    description: A header row whose button reads "… N unchanged lines" with a chevron; it controls a hidden <tbody> of context rows.
  - part: conflict
    description: The block from <<<<<<< to >>>>>>> inside a 3px double conflict-border; the three marker rows on header-bg in text.bright.
keyboard:
  - key: Tab / Shift+Tab
    action: Moves between the fold buttons and any row the host makes focusable; rows are not stops in a plain table.
  - key: Enter / Space
    action: On a fold button toggles the hidden hunk; focus stays on the button.
  - key: Down / Up
    action: In grid hosts, moves the selected row; the theme draws the ring on whichever row the host focuses.
  - key: (host)
    action: Next-change and previous-change navigation, staging and comment affordances are host bindings.
responsive: The table scrolls horizontally inside its box; line numbers and markers are sticky at the inline-start edge below 600px; the split variant becomes unified below 600px in hosts that can, otherwise scrolls. At 320px nothing wraps and nothing is clipped. RTL mirrors the number columns while the code stays left-to-right.
portability:
  web: "native <table> with <caption>, <tbody> per hunk, a <button aria-expanded aria-controls> per collapsed hunk; markers are real characters in their own cell; word-level changes are <ins>/<del> or spans with text-decoration; conflicts are a bordered <tbody>."
  nativeFallbacks:
    - "GTK/Qt: a two-column source view or QPlainTextEdit with per-line backgrounds; the marker column is a gutter renderer with real glyphs."
    - "JetBrains: DIFF_INSERTED, DIFF_DELETED, DIFF_MODIFIED and DIFF_CONFLICT keys; the gutter marker follows the IDE."
    - "Terminal (delta, git diff --color): the three fills as background slots, markers untouched; word-level as underline where the emulator supports it."
fixtures: [FX-STATE-MATRIX, FX-320, FX-ZOOM-200, FX-RM, FX-HC, FX-LONG, FX-OVERFLOW]
related: [code-editor, diagnostics, terminal]
specimens: [i3-window-frame]
keywords: [diff, patch, unified, split, hunk, conflict, merge, review]
sources: [j3w1-web, legacy-i3]
compact: false
---

## Purpose

How changed text is shown: line rows with a fill and a textual marker,
word-level changes as underlines that leave text contrast untouched, hunk
headers, collapsible unchanged regions, and merge conflicts in a double
border. The `+`, `−` and `~` markers are content, present in every state and
every profile.

## Anatomy

Root `.diff-view` (the table) with the variant class `.diff-view-unified`,
`-split`, `-word-level` or `-conflict`. Row classes: `.diff-view-row`,
`-row-context`, `-row-added`, `-row-removed`, `-row-modified`, `-row-hunk`,
`-row-fold`, `-row-conflict` with `-row-conflict-start`, `-row-conflict-mid`
and `-row-conflict-end` for the marker lines. Cells: `.diff-view-ln`,
`-marker`, `-text`, `-fold-cell`, and `-range` for the `@@` span; the split
variant adds `-side-old` and `-side-new` on cells and, on a `-row-pair`,
`-cell-removed` and `-cell-added` per side (an empty `-cell-blank` faces an
added line); the conflict variant adds `-row-ours` and `-row-theirs`. Word-level spans: `.diff-view-word-added` (2px underline in
{color.diff.added.emphasis}) and `.diff-view-word-removed` (underline plus
line-through in {color.diff.removed.emphasis}). The fold button is
`.diff-view-fold` with an inline SVG chevron `.diff-view-chevron` and two
labels, `-fold-collapsed` and `-fold-expanded`; the folded rows are a
`<tbody class="diff-view-folded" hidden>`. Line numbers
use {color.text.muted} rather than {color.code.line-number} because the
modified fill would drop the subtle step to 4.45:1.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | added rows {color.diff.added.bg} with `+` in {color.diff.added.gutter}; removed {color.diff.removed.bg} with `−` in {color.diff.removed.gutter}; modified {color.diff.modified.bg} with `~` in {color.diff.modified.gutter}; hunk rows {color.diff.header-bg}; conflicts in a 3px double {color.diff.conflict-border} | the markers; the double border |
| hover | the row's number and marker cells → {color.interaction.hover.bg}; the text cell keeps its fill | cursor: default; only on hover-capable pointers |
| selected | the whole row filled {color.interaction.selection.bg} with {color.interaction.selection.text}; the marker stays | `aria-current` (or `:target` for a permalinked line); the marker glyph |
| focus-visible | 1px dashed {color.interaction.focus.ring} at −2px around the row; on a selected row the ring is {color.interaction.focus.ring-container} | the ring |
| expanded | the folded `<tbody>` is shown; the chevron points down; the button reads "Hide 12 unchanged lines" | `aria-expanded="true"`; the rows appear |
| collapsed | the folded `<tbody>` is hidden; the chevron points to the inline end; "… 12 unchanged lines" | `aria-expanded="false"`; the ellipsis |

Precedence: selected > hover; focus-visible is always drawn. A selected row
loses its diff fill but never its marker, which is why the marker is content.

## Keyboard

A plain table has no row focus; the fold buttons are the only stops and
toggle with Enter or Space, the chevron turning within the motion budget.
Hosts that expose the diff as a grid own row navigation and draw the ring on
the focused row; the theme adds no binding of its own.

## Accessibility

The caption names both files. Every changed row carries its marker in a cell
of its own, so a screen reader announces `+` or `−` before the line and a
monochrome print keeps the distinction. Word-level changes use
`text-decoration` (underline, or underline and line-through), never a fill,
so the row text stays at 7.56:1 or better on every diff fill. The `−` marker
measures 4.24:1 on the removed fill: it is bold, sits on its own fill and is
a glyph, so it is held to the 3:1 graphics floor and recorded here. Folded
hunks use `aria-expanded` and `aria-controls` on a real button; the hidden
rows are `hidden`, not visually clipped, so they are not read while
collapsed. Conflict markers are the literal `<<<<<<<`, `=======` and
`>>>>>>>` lines in {color.text.bright} on {color.diff.header-bg}, inside the
double border.

## Portability

A table with cell backgrounds, borders and text decoration is expressible in
every toolkit. Hosts without double borders draw two 1px lines and record it;
hosts without line-through keep the underline and the `−` marker. The three
extension hues are confined to the `diff` group here and change with the
profile; the markers do not.

## Non-examples

Red and green fills with no `+`/`−` marker. Word-level changes drawn as a
bright fill that pushes the text below 4.5:1. A removed line rendered in
`text.disabled` or struck through as a whole. Collapsed hunks that are only
visually clipped and still read out. Conflict blocks in purple. Hover that
recolours the code text. Round-cornered hunk cards floating on the page. A
selected row that drops the marker because "the colour says it".
