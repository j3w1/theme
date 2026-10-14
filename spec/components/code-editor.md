---
id: code-editor
name: Code editor
family: developer
maturity: stable
priority: R1
since: 0.1.0
order: 10
summary: The editor surface, gutter, caret, current line, selection, bracket match and monochrome syntax roles that every code-editing or code-viewing host maps onto.
native: false
aria:
  pattern: "presentation of <pre> inside role=textbox with aria-multiline and aria-readonly; a real editor is a host surface"
  apg: https://www.w3.org/WAI/ARIA/apg/patterns/
  role: textbox
variants:
  - id: default
    name: JavaScript
    description: Every syntax role in one twelve-line sample.
  - id: markup
    name: Markup
    description: Tags, attributes, an entity escape and a heading.
  - id: folded
    name: Folded region
    description: A collapsed block with its fold marker and skipped line numbers.
sizes: [compact, comfortable]
states:
  - default
  - focus-visible
  - selected
  - selected+container-inactive
  - current
  - read-only
tokens:
  root.bg: color.code.bg
  root.border: color.border.control
  root.ring: color.interaction.focus.ring-container
  gutter.bg: color.code.gutter-bg
  gutter.rule: color.code.gutter-rule
  gutter.bg-read-only: color.surface.sunken
  line-number.text: color.code.line-number
  line-number.text-active: color.code.line-number-active
  line.bg-current: color.code.current-line
  caret.bg: color.code.caret
  selection.bg: color.code.selection-bg
  selection.bg-inactive: color.interaction.selection.inactive-bg
  selection.text-inactive: color.interaction.selection.inactive-text
  bracket.outline: color.code.bracket-match
  indent.guide: color.code.indent-guide
  whitespace.text: color.code.whitespace
  fold.text: color.text.muted
  fold.border: color.border.control
  syntax.keyword: color.code.syntax.keyword
  syntax.string: color.code.syntax.string
  syntax.comment: color.code.syntax.comment
  syntax.number: color.code.syntax.number
  syntax.constant: color.code.syntax.constant
  syntax.function: color.code.syntax.function
  syntax.variable: color.code.syntax.variable
  syntax.type: color.code.syntax.type
  syntax.operator: color.code.syntax.operator
  syntax.punctuation: color.code.syntax.punctuation
  syntax.property: color.code.syntax.property
  syntax.heading: color.code.syntax.heading
  syntax.tag: color.code.syntax.tag
  syntax.attribute: color.code.syntax.attribute
  syntax.escape: color.code.syntax.escape
  syntax.invalid: color.code.syntax.invalid
  syntax.deprecated: color.code.syntax.deprecated
stateTokens:
  default: { fg: color.code.syntax.variable, bg: color.code.bg, border: color.border.control }
  focus-visible: { fg: color.code.syntax.variable, bg: color.code.current-line, outline: color.interaction.focus.ring-container }
  selected: { fg: color.code.syntax.variable, bg: color.code.selection-bg }
  selected+container-inactive: { fg: color.interaction.selection.inactive-text, bg: color.interaction.selection.inactive-bg }
  current: { fg: color.code.syntax.variable, bg: color.code.bg, border: color.code.bracket-match }
  read-only: { fg: color.code.line-number, bg: color.surface.sunken }
contrast:
  - { fg: color.code.caret, bg: color.code.current-line, min: 3, kind: ui, state: focus-visible, label: "caret on the current line" }
  - { fg: color.code.bracket-match, bg: color.code.bg, min: 3, kind: ui, state: current, label: "bracket-match outline on the editor surface" }
  - { fg: color.code.bracket-match, bg: color.code.current-line, min: 3, kind: ui, state: current, label: "bracket-match outline on the current line" }
  - { fg: color.code.line-number, bg: color.code.gutter-bg, label: "line numbers in the gutter" }
  - { fg: color.code.line-number-active, bg: color.code.current-line, label: "active line number" }
  - { fg: color.code.syntax.keyword, bg: color.code.bg, label: "keyword" }
  - { fg: color.code.syntax.string, bg: color.code.bg, label: "string" }
  - { fg: color.code.syntax.comment, bg: color.code.bg, label: "comment" }
  - { fg: color.code.syntax.number, bg: color.code.bg, label: "number and constant" }
  - { fg: color.code.syntax.function, bg: color.code.bg, label: "function" }
  - { fg: color.code.syntax.type, bg: color.code.bg, label: "type" }
  - { fg: color.code.syntax.property, bg: color.code.bg, label: "property, heading and invalid text" }
  - { fg: color.code.syntax.tag, bg: color.code.bg, label: "tag" }
  - { fg: color.code.syntax.attribute, bg: color.code.bg, label: "attribute and escape" }
  - { fg: color.code.syntax.deprecated, bg: color.code.bg, label: "deprecated text" }
  - { fg: color.code.syntax.string, bg: color.code.selection-bg, state: selected, label: "muted string text inside the selection" }
  - { fg: color.code.syntax.keyword, bg: color.code.selection-bg, state: selected, label: "keyword and tag text inside the selection (D-029)" }
  - { fg: color.code.syntax.property, bg: color.code.selection-bg, state: selected, label: "property, heading and invalid text inside the selection (D-029)" }
  - { fg: color.text.muted, bg: color.code.bg, label: "fold marker text" }
  - { fg: color.code.indent-guide, bg: color.code.bg, min: 1, kind: ui, label: "indent guide (decorative)", waiver: "indent guides duplicate the whitespace that is already in the text; they carry no information of their own" }
  - { fg: color.code.whitespace, bg: color.code.bg, min: 1, kind: ui, label: "rendered whitespace (decorative)", waiver: "rendered whitespace duplicates characters that are already in the text; foundations names it decorative" }
  - { fg: color.code.gutter-rule, bg: color.code.bg, min: 1, kind: ui, label: "gutter rule (decorative)", waiver: "the gutter is identified by its number column; the rule is a divider, not a boundary" }
anatomy:
  - part: root
    description: The editor box, 1px border.control on code.bg; role textbox, multiline, read-only in this reference; the container ring on focus.
  - part: gutter
    description: The line-number column on gutter-bg with a 1px gutter-rule on its inner edge; fold markers live here.
  - part: line
    description: One row of the document; the current line carries current-line as its background across gutter and text.
  - part: text
    description: The code itself, white-space preserved, coloured only through the syntax roles; indent guides and rendered whitespace sit inside it.
  - part: caret
    description: A 1px bar in code.caret drawn only while the editor has focus; never blinks in the reference.
  - part: selection
    description: A fill in code.selection-bg over a character range; inactive containers drop to the inactive selection fill.
  - part: bracket
    description: The two characters of a matched pair, each outlined 1px in bracket-match.
  - part: fold
    description: A collapsed region marker, ⋯ in text.muted inside a 1px border.control box, with a › in the gutter.
keyboard:
  - key: (host)
    action: The host editor owns every key; the theme changes no binding, no caret behaviour and no selection model.
  - key: Tab
    action: Reaches the editor as one stop in the reference; whether Tab inserts or moves focus is the host's rule and is announced by the host.
  - key: Escape
    action: In hosts that trap Tab, Escape must release focus to the next stop; the theme does not provide it.
responsive: The box fills its container with min-width 0 and scrolls horizontally inside itself; lines never wrap in the reference; at 320px the gutter stays and the text pane scrolls. Type is the code scale in both densities; density does not change editor metrics. RTL keeps code left-to-right (bidi isolation) while the gutter mirrors to the inline-start edge.
portability:
  web: "role=textbox aria-multiline=true aria-readonly=true over <pre>, tabindex=0, one focus stop; a live editor (CodeMirror, Monaco, contenteditable) is a host surface that maps these roles onto its own theme API and keeps its own caret, selection and keyboard handling."
  nativeFallbacks:
    - "GTK: GtkSourceView style scheme; current-line, selection, bracket-match and the syntax roles map one to one; the container ring becomes the frame's focus outline."
    - "Qt: KSyntaxHighlighting theme JSON; editor colours and text styles carry the same roles; caret width follows the toolkit."
    - "JetBrains: an editor scheme (.icls); CARET_ROW, SELECTION_BACKGROUND, MATCHED_BRACE_ATTRIBUTES and the language attribute keys; the UI theme is a separate capability."
    - "Terminal editors (vim, helix): 16-slot hosts use the default profile's terminal slots (the readable heritage sixteen, D-029) and document that the caret follows the terminal cursor."
fixtures: [FX-STATE-MATRIX, FX-320, FX-ZOOM-200, FX-RM, FX-HC, FX-LONG, FX-RTL]
related: [diagnostics, diff-view, terminal]
specimens: [i3-window-frame]
keywords: [editor, syntax, gutter, caret, selection, bracket, fold, code]
sources: [j3w1-web, legacy-i3]
compact: false
---

## Purpose

The reference rendering of source code: the contract a real editor's theme
API is mapped onto. It never edits.

## Anatomy

Root `.code-editor`; parts `.code-editor-<part>`: `-pre`, `-line`, `-ln`
(line number), `-text`, `-indent`, `-ws` (rendered whitespace), `-caret`,
`-sel` (selection range), `-bracket`, `-fold`, `-fold-gutter`. Syntax spans
are `.code-editor-<role>`: `-kw` keyword, `-str` string, `-cm` comment,
`-num` number, `-const` constant, `-fn` function, `-var` variable, `-type`,
`-op` operator, `-punct` punctuation, `-prop` property, `-heading`, `-tag`,
`-attr` attribute, `-esc` escape, `-invalid`, `-deprecated`.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | code on {color.code.bg}; comments italic; invalid text wavy-underlined in {color.code.syntax.invalid}; deprecated text struck through | italic, wavy underline, line-through |
| focus-visible | 2px {color.interaction.focus.ring-container} ring at −3px; 1px {color.code.caret} bar; caret line filled {color.code.current-line} across gutter and text, its number {color.code.line-number-active} | the ring; the caret bar |
| selected | range filled {color.code.selection-bg}; syntax colours kept | the host's selection is announced; the fill spans line ends |
| selected+container-inactive | same range in {color.interaction.selection.inactive-bg} with {color.interaction.selection.inactive-text}; no caret, no ring | lightness drop between the two fills |
| current | both characters of the matched pair outlined 1px solid {color.code.bracket-match} | an outline box, not a colour change |
| read-only | gutter on {color.surface.sunken}, same line numbers; dotted gutter rule; no caret | `aria-readonly`; dotted rule; no caret |

Precedence: selection under the text, current line under the selection,
bracket outline and caret above everything. The caret never blinks in the
reference; a host that blinks it follows the user's cursor-blink setting and
stops under reduced motion.

## Keyboard

As in the key table. The theme only draws what the host's keys produce; the
read-only reference consumes no key. A host that captures Tab offers Escape,
then Tab, and announces it.

## Accessibility

Syntax colour is decoration; meaning never rides on colour alone (italic
comments, wavy-underlined invalid text, struck-through deprecated text).
Selection is a fill and focus a ring, drawn together, never substituting for
each other. Every syntax role meets 4.5:1 on {color.code.bg}. Inside
{color.code.selection-bg}, D-029 keeps keyword, tag, property and heading at
4.5:1; comment and type text fall below it, a recorded limitation of the
selection value, never fixed by recolouring tokens locally. The reference
stays monochrome; a host that wants hue maps {color.code.hued.string} and the
other opt-in `code.hued.*` roles (D-030), which meet 4.5:1 inside the
selection. Line numbers are text people read and meet the text floor; indent
guides, rendered whitespace and the gutter rule are decorative. In forced
colours the caret, selection and bracket outline take `Highlight`; syntax
spans keep their text styles.

## Portability

The port maps these roles onto the host's theme API without touching caret
behaviour, keyboard handling or selection semantics. No bracket-match
outline: bold weight, deviation recorded. No 1px caret: the host's own caret
in {color.code.caret}. The `heritage-ansi` and `extended` profiles change
role values only, never the mapping.

## Non-examples

Rainbow syntax in the reference, or any hue beyond the three bounded ones
(hosts opt into `code.hued.*`, D-030). A blinking or animated caret in the
reference. A selection that turns text white and drops the syntax roles. A
current line brighter than the selection. A bracket match as a background
fill, which reads as a selection. Line numbers in a decorative colour. A glow,
gradient or rounded corner on the box. Removing the host's focus indicator
without drawing the container ring.
