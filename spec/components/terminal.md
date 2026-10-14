---
id: terminal
name: Terminal
family: developer
maturity: stable
priority: R1
since: 0.1.0
order: 40
summary: Terminal text with the readable heritage sixteen ANSI slots (D-029, D-032), the cursor, the selection and the six text attributes; a transcript, the slot grid and the attributes.
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
    description: One row per slot, labelled with its number; the default profile's text slots show sample text, slot 0 (the background) and slot 8 (the dim tier) show colour blocks and a ✕, and every background is a block.
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
  prompt.bg: color.terminal.prompt-bg
  prompt.text: color.terminal.prompt-text
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
  - { fg: color.terminal.prompt-text, bg: color.terminal.prompt-bg, label: "prompt segment text on the prompt background" }
  - { fg: color.terminal.bg, bg: color.terminal.ansi.3, label: "branch segment text on slot 3" }
  - { fg: color.terminal.prompt-bg, bg: color.terminal.bg, min: 1, kind: ui, label: "prompt arrow (the segment's own colour, decorative)", waiver: "the arrow is the segment edge; the segment text carries the content" }
  - { fg: color.text.muted, bg: color.terminal.bg, label: "dim text and grid labels" }
  - { fg: color.terminal.bg, bg: color.terminal.fg, label: "inverse text" }
  - { fg: color.terminal.ansi.2, bg: color.terminal.bg, label: "slot 2" }
  - { fg: color.terminal.ansi.3, bg: color.terminal.bg, label: "slot 3" }
  - { fg: color.terminal.ansi.5, bg: color.terminal.bg, label: "slot 5" }
  - { fg: color.terminal.ansi.7, bg: color.terminal.bg, label: "slot 7" }
  - { fg: color.terminal.ansi.11, bg: color.terminal.bg, label: "slot 11" }
  - { fg: color.terminal.ansi.1, bg: color.terminal.bg, label: "slot 1" }
  - { fg: color.terminal.ansi.4, bg: color.terminal.bg, label: "slot 4" }
  - { fg: color.terminal.ansi.6, bg: color.terminal.bg, label: "slot 6" }
  - { fg: color.terminal.ansi.8, bg: color.terminal.bg, label: "slot 8 (3.01:1, the dim tier)", waiver: "D-029 keeps bright black as the dim, decorative slot" }
  - { fg: color.terminal.ansi.9, bg: color.terminal.bg, label: "slot 9" }
  - { fg: color.terminal.ansi.10, bg: color.terminal.bg, label: "slot 10" }
  - { fg: color.terminal.ansi.12, bg: color.terminal.bg, label: "slot 12" }
  - { fg: color.terminal.ansi.13, bg: color.terminal.bg, label: "slot 13" }
  - { fg: color.terminal.ansi.14, bg: color.terminal.bg, label: "slot 14" }
  - { fg: color.terminal.ansi.15, bg: color.terminal.bg, label: "slot 15" }
  - { fg: color.terminal.ansi.0, bg: color.terminal.bg, label: "slot 0 (1.00:1; it is the background)", waiver: "heritage slot; slot 0 is the terminal background and is never a foreground on it" }
anatomy:
  - part: root
    description: The <pre> on terminal.bg in a 1px border.control box; role=log for a transcript; the container ring on focus.
  - part: line
    description: One row of cells; the cursor line takes code.current-line when current.
  - part: prompt
    description: Agnoster-style segments; the path on terminal.prompt-bg with terminal.prompt-text, the branch on slot 3 with terminal.bg text, each followed by an arrow in the segment's own colour.
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

The reference for terminal text. The sixteen slots, frozen in `Xresources`,
are the theme's origin: `heritage-ansi` carries them exactly; `default`
lifts the dim slots to readable values of the same hues (D-029) and makes
slot 6 coral (D-032). Programs choose their slots; the theme makes every slot
but the dim tier safe for text instead of steering them.

## Anatomy

Root `.terminal` plus `.terminal-transcript`, `.terminal-ansi-grid` or
`.terminal-attributes`; parts `.terminal-line`, `-prompt` (`-prompt-path`,
`-prompt-branch`, `-prompt-arrow`), `-cursor`, `-sel`, `-label`, `-fail`,
`-bold`, `-dim`, `-italic`, `-underline`, `-inverse`, `-strike`. Each slot
class reads one role variable ({color.terminal.ansi.0} …
{color.terminal.ansi.15}), so a profile switch recolours without touching
markup. {color.terminal.prompt-bg} is the heritage dark red in every profile,
whatever slot 4 carries (D-032).

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | text on {color.terminal.bg}; cursor hollow, 1px {color.terminal.cursor} outline; no ring | the hollow cursor |
| focus-visible | 2px {color.interaction.focus.ring-container} container ring at −3px; cursor solid {color.terminal.cursor} with {color.terminal.bg} text | the ring; the cursor fills |
| selected | run filled {color.terminal.selection-bg} with {color.terminal.selection-text}; slot colours inside give way to the selection text | whole-cell fill; the emulator exposes the selection |
| busy | command running: solid static block cursor at the end of the output; transcript `aria-busy` | `aria-busy`; cursor shape; no blink |
| current | cursor line filled {color.code.current-line} across its width; cursor as in focus | row fill; cursor cell |

The reference cursor never blinks. A host keeps the user's blink setting and
stops it under reduced motion; the theme never turns it on.

## Keyboard

As in the key table. The reference transcript consumes no key; the theme
draws the ring, selection and block cursor where the host reports them.

## Accessibility

In `default`, slots 1–7 and 9–15 meet 4.5:1 on the terminal background
(D-029); coral slot 6 sets highlighted names apart from rose text (D-032).
Slot 8 (dim tier) and slot 0 (the background) do not; the grid marks both
with `✕`. The crosses follow `default`, so under `heritage-ansi` (ten slots
fail) the sample text shows the failures. The `extended` overlay proposes a
semantic sixteen that all meet 4.5:1. The background row is not a contract:
the default foreground passes only on slot 0, the terminal background on
every slot but 0 and 8. Bold-as-bright and 256-colour or 24-bit sequences
bypass the slots and are outside the theme. Most emulators dim by mixing a
slot halfway into the background (dimmed slot 6 falls under 3:1); the theme
does not brighten slots to compensate, a host setting for dim text alone may
(D-032). Bold, italic, underline and strikethrough are styles a screen reader
can expose.

## Portability

Any sixteen-slot emulator holds these values byte for byte; port evidence
records whether bold-as-bright is off and whether cursor and selection keys
exist. A port carries the slots unchanged; it may recommend `LS_COLORS` or a
prompt configuration (the path segment draws in 24-bit colour, untouched by
the slots) but never changes slots to compensate. Cursor shape is the
user's; the theme supplies only its colour.

## Non-examples

Normalising the heritage slots to 4.5:1 and calling it `heritage-ansi`. A
blinking cursor in the reference. A glowing bar cursor. Bold rendered as
bright. A purple or cyan slot borrowed from another scheme. Wrapping the
transcript and breaking the prompt segments. A selection drawn as a ring
instead of a fill. Rounded or gradient prompt segments.
