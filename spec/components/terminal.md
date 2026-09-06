---
id: terminal
name: Terminal
family: developer
maturity: stable
priority: R1
since: 0.1.0
order: 40
summary: Terminal text on the terminal surface with the sixteen heritage ANSI slots carried exactly, the cursor, the selection and the six text attributes; a transcript, the slot grid and the attributes.
native: true
aria:
  pattern: "native <pre role=log> for a transcript; a plain <pre> with aria-label for the slot grid and the attribute sheet"
  apg: https://www.w3.org/WAI/ARIA/apg/practices/names-and-descriptions/
variants:
  - id: default
    name: Transcript
    description: An agnoster-style prompt, an ls listing coloured by the slots that pass the text floor, an ESC[31m-style error line and the cursor.
  - id: ansi-grid
    name: ANSI grid
    description: One row per slot, labelled with its number; slots that pass 4.5:1 show sample text, slots that fail show colour blocks and a ✕, and every background is a block.
  - id: attributes
    name: Attributes
    description: Bold, dim, italic, underline, inverse and strikethrough.
sizes: [compact, comfortable]
states:
  - default
  - focus-visible
  - selected
  - busy
  - current
tokens:
  root.bg: color.terminal.bg
  root.text: color.terminal.fg
  root.border: color.border.control
  root.ring: color.interaction.focus.ring-container
  cursor.bg: color.terminal.cursor
  cursor.text: color.terminal.bg
  selection.bg: color.terminal.selection-bg
  selection.text: color.terminal.selection-text
  current.bg: color.code.current-line
  prompt.bg: color.terminal.ansi.4
  prompt.text: color.terminal.selection-text
  prompt.branch-bg: color.terminal.ansi.3
  prompt.branch-text: color.terminal.bg
  dim.text: color.text.muted
  inverse.bg: color.terminal.fg
  inverse.text: color.terminal.bg
  label.text: color.text.muted
  fail.glyph: color.terminal.fg
  slot.ansi-0: color.terminal.ansi.0
  slot.ansi-1: color.terminal.ansi.1
  slot.ansi-2: color.terminal.ansi.2
  slot.ansi-3: color.terminal.ansi.3
  slot.ansi-4: color.terminal.ansi.4
  slot.ansi-5: color.terminal.ansi.5
  slot.ansi-6: color.terminal.ansi.6
  slot.ansi-7: color.terminal.ansi.7
  slot.ansi-8: color.terminal.ansi.8
  slot.ansi-9: color.terminal.ansi.9
  slot.ansi-10: color.terminal.ansi.10
  slot.ansi-11: color.terminal.ansi.11
  slot.ansi-12: color.terminal.ansi.12
  slot.ansi-13: color.terminal.ansi.13
  slot.ansi-14: color.terminal.ansi.14
  slot.ansi-15: color.terminal.ansi.15
stateTokens:
  default: { fg: color.terminal.fg, bg: color.terminal.bg, border: color.border.control }
  focus-visible: { fg: color.terminal.fg, bg: color.terminal.bg, outline: color.interaction.focus.ring-container }
  selected: { fg: color.terminal.selection-text, bg: color.terminal.selection-bg }
  busy: { fg: color.terminal.bg, bg: color.terminal.cursor }
  current: { fg: color.terminal.fg, bg: color.code.current-line }
contrast:
  - { fg: color.terminal.cursor, bg: color.terminal.bg, min: 3, kind: ui, label: "hollow cursor outline at rest" }
  - { fg: color.terminal.cursor, bg: color.code.current-line, min: 3, kind: ui, state: current, label: "cursor on the cursor line" }
  - { fg: color.terminal.selection-text, bg: color.terminal.ansi.4, label: "prompt segment text on slot 4" }
  - { fg: color.terminal.bg, bg: color.terminal.ansi.3, label: "branch segment text on slot 3" }
  - { fg: color.terminal.ansi.4, bg: color.terminal.bg, min: 1, kind: ui, label: "prompt arrow (the segment's own colour, decorative)", waiver: "the arrow is the segment edge; the segment text carries the content" }
  - { fg: color.text.muted, bg: color.terminal.bg, label: "dim text and grid labels" }
  - { fg: color.terminal.bg, bg: color.terminal.fg, label: "inverse text" }
  - { fg: color.terminal.ansi.2, bg: color.terminal.bg, label: "slot 2" }
  - { fg: color.terminal.ansi.3, bg: color.terminal.bg, label: "slot 3" }
  - { fg: color.terminal.ansi.5, bg: color.terminal.bg, label: "slot 5" }
  - { fg: color.terminal.ansi.7, bg: color.terminal.bg, label: "slot 7" }
  - { fg: color.terminal.ansi.11, bg: color.terminal.bg, label: "slot 11" }
  - { fg: color.terminal.ansi.1, bg: color.terminal.bg, label: "slot 1 (3.42:1)", waiver: "heritage slot; documented as failing, programs choose slot semantics" }
  - { fg: color.terminal.ansi.4, bg: color.terminal.bg, label: "slot 4 (2.09:1)", waiver: "heritage slot; documented as failing, programs choose slot semantics" }
  - { fg: color.terminal.ansi.6, bg: color.terminal.bg, label: "slot 6 (3.26:1)", waiver: "heritage slot; documented as failing, programs choose slot semantics" }
  - { fg: color.terminal.ansi.8, bg: color.terminal.bg, label: "slot 8 (1.86:1)", waiver: "heritage slot; documented as failing, programs choose slot semantics" }
  - { fg: color.terminal.ansi.9, bg: color.terminal.bg, label: "slot 9 (2.70:1)", waiver: "heritage slot; documented as failing, programs choose slot semantics" }
  - { fg: color.terminal.ansi.10, bg: color.terminal.bg, label: "slot 10 (2.92:1)", waiver: "heritage slot; documented as failing, programs choose slot semantics" }
  - { fg: color.terminal.ansi.12, bg: color.terminal.bg, label: "slot 12 (2.12:1)", waiver: "heritage slot; documented as failing, programs choose slot semantics" }
  - { fg: color.terminal.ansi.13, bg: color.terminal.bg, label: "slot 13 (4.43:1)", waiver: "heritage slot; documented as failing, programs choose slot semantics" }
  - { fg: color.terminal.ansi.14, bg: color.terminal.bg, label: "slot 14 (4.28:1)", waiver: "heritage slot; documented as failing, programs choose slot semantics" }
  - { fg: color.terminal.ansi.15, bg: color.terminal.bg, label: "slot 15 (4.45:1; not in the foundations list)", waiver: "heritage slot; documented as failing, programs choose slot semantics" }
  - { fg: color.terminal.ansi.0, bg: color.terminal.bg, label: "slot 0 (1.00:1; it is the background)", waiver: "heritage slot; slot 0 is the terminal background and is never a foreground on it" }
anatomy:
  - part: root
    description: The <pre> on terminal.bg in a 1px border.control box; role=log for a transcript; the container ring on focus.
  - part: line
    description: One row of cells; the cursor line takes code.current-line when current.
  - part: prompt
    description: Agnoster-style segments; the path on slot 4 with selection-text, the branch on slot 3 with terminal.bg text, each followed by an arrow in the segment's own colour.
  - part: slot
    description: A span coloured by one of the sixteen slots as foreground (.terminal-fg-N) or background (.terminal-bg-N).
  - part: cursor
    description: One cell; hollow (1px terminal.cursor outline) at rest, solid terminal.cursor with terminal.bg text while focused or busy; it does not blink.
  - part: selection
    description: A run of cells filled terminal.selection-bg with terminal.selection-text.
  - part: attribute
    description: Bold, dim (text.muted), italic, underline, inverse (fg and bg swapped), strikethrough.
  - part: label
    description: Slot numbers and attribute names in text.muted; the ✕ after a failing slot number, in terminal.fg.
keyboard:
  - key: (host)
    action: The emulator and the shell own every key; the theme changes no binding and no cursor behaviour.
  - key: Tab
    action: Reaches the transcript as one focus stop; inside a live emulator Tab belongs to the shell.
  - key: Shift+Arrows / mouse
    action: Selection is the emulator's; the theme draws it in selection-bg and selection-text.
responsive: The transcript scrolls horizontally inside its box and never wraps; at 320px the prompt segments stay on one line and the grid scrolls. Type is the terminal scale (13/19, −0.5px letter-spacing) in both densities. The terminal is always left-to-right; RTL pages do not mirror it.
portability:
  web: "<pre role=log aria-live=polite> for a transcript; slot classes on spans; the cursor is a span, not a caret; selection through ::selection with the terminal roles; xterm.js and similar map the sixteen slots, foreground, background, cursor and selection from these roles."
  nativeFallbacks:
    - "Xresources / URxvt / xterm: *background, *foreground, *cursorColor and *color0–15 (the origin of these values)."
    - "Alacritty, kitty, WezTerm, Windows Terminal: the sixteen slots plus foreground, background, cursor and selection keys; bold-as-bright must be off for the slots to hold."
    - "GNOME Terminal, Konsole: palette entries in order; disable the system theme so the slots are not re-derived."
    - "tmux, vim inside a terminal: they see slot numbers, never these values; a 256-colour or 24-bit escape bypasses the slots entirely."
fixtures: [FX-STATE-MATRIX, FX-320, FX-ZOOM-200, FX-RM, FX-HC, FX-LONG, FX-OVERFLOW]
related: [code-editor, diagnostics, diff-view]
specimens: [i3-window-frame]
keywords: [terminal, ansi, xresources, prompt, cursor, shell, palette, heritage]
sources: [j3w1-web, legacy-i3]
compact: false
---

## Purpose

The reference for terminal text: the surface, the default foreground, the
cursor, the selection, the six attributes and the sixteen slots the
workstation froze in `Xresources`. The slots are the origin of the theme and
are carried exactly; what a program does with a slot is that program's
choice, and the theme documents where a choice fails rather than quietly
fixing it.

## Anatomy

Root `.terminal` (the `<pre>`) with a variant class `.terminal-transcript`,
`.terminal-ansi-grid` or `.terminal-attributes`. Parts `.terminal-<part>`:
`-line`, `-prompt` with `-prompt-path`, `-prompt-branch` and `-prompt-arrow`,
`-cursor`, `-sel`, `-label`, `-fail` (the `✕`), and the attributes `-bold`,
`-dim`, `-italic`, `-underline`, `-inverse`, `-strike`. Slot classes are
`.terminal-fg-0` … `.terminal-fg-15` and `.terminal-bg-0` … `.terminal-bg-15`,
each a single role variable {color.terminal.ansi.0} … {color.terminal.ansi.15},
so the profile switch on the specimen recolours the grid without touching
the markup. The foreground is {color.terminal.fg} on {color.terminal.bg};
the prompt path segment is {color.terminal.selection-text} on
{color.terminal.ansi.4} and the branch segment {color.terminal.bg} on
{color.terminal.ansi.3}, the two agnoster backgrounds the workstation used.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | text on {color.terminal.bg}; the cursor cell hollow, a 1px {color.terminal.cursor} outline; no ring | the hollow cursor |
| focus-visible | container ring 2px {color.interaction.focus.ring-container} at −3px; the cursor solid {color.terminal.cursor} with {color.terminal.bg} text | the ring; the cursor fills |
| selected | the run filled {color.terminal.selection-bg} with {color.terminal.selection-text}; slot colours inside the run give way to the selection text | the fill spans whole cells; the emulator exposes the selection |
| busy | a command is running: the cursor is a solid static block at the end of the output; the transcript is `aria-busy` | `aria-busy`; the cursor shape; no blink |
| current | the cursor line filled {color.code.current-line} across its width; the cursor as in focus | the row fill; the cursor cell |

The cursor never blinks in the reference. A host keeps the user's own blink
setting and stops blinking under reduced motion; the theme never turns it on.

## Keyboard

The emulator and the shell own every key, including Tab, Escape and the
selection modifiers. The reference transcript is a single focus stop that
consumes nothing. The theme draws the ring when the host reports focus, the
fill when the host reports a selection, and the block cursor where the host
puts it.

## Accessibility

The transcript is `role=log` so new output is announced politely; the grid
and the attribute sheet are plain `<pre>` elements with a label. The sixteen
slots are exact in every profile: slots 2, 3, 5, 7 and 11 reach 4.5:1 on the
terminal background; slots 1, 4, 6, 8, 9, 10, 12, 13 and 14 do not
(1.86:1–4.43:1), and the grid marks each of them with a `✕` after its number
so the failure is visible, not implied. Two more are marked on the same
evidence: slot 15 measures 4.45:1 and slot 0 is the background itself. The
`extended` overlay reassigns the slots to a semantic sixteen that all reach
4.5:1; the site's profile control shows the grid under it. The background
row is legible only with a foreground the program chooses: with the default
foreground only slots 0 and 8 pass, which is why the row is shown and not
declared as a contract. Two escape families bypass the slots entirely and
are outside the theme: bold-as-bright, which substitutes slots 8–15 for 0–7
and must be off for the slots to hold, and 256-colour or 24-bit sequences,
which carry their own values. Attributes are attributes: dim uses
{color.text.muted} (5.81:1) rather than a slot, inverse swaps foreground and
background (8.65:1), and bold, italic, underline and strikethrough are text
styles a screen reader can expose.

## Portability

Every emulator with a sixteen-slot palette can hold these values byte for
byte; the port's evidence records whether bold-as-bright is off and whether
the cursor and selection keys exist. Programs that pick slot 4 or 12 for
directories inherit the documented failure; a port may recommend `LS_COLORS`
or a prompt configuration but never changes the slots to compensate. The
cursor shape (block, bar, underline) is the user's setting; the theme only
supplies its colour.

## Non-examples

Normalising the heritage slots so every one reaches 4.5:1 and calling it
`heritage-ansi`. A blinking cursor in the reference. A cursor that is a
glowing bar. Bold rendered as bright, which silently swaps the slots. A
purple or cyan slot borrowed from another scheme. Wrapping the transcript at
narrow widths and breaking the prompt segments. A selection drawn as a ring
instead of a fill. Rounded prompt segments or a gradient prompt.
