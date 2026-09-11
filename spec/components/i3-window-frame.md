---
id: i3-window-frame
name: i3 window frame
family: composed
maturity: stable
priority: R1
since: 0.1.0
order: 40
summary: The workstation frame; an i3 bar with workspaces and Chinese i3status labels above the terminal and code-editor components as tiled, tabbed or floating windows behind i3 title bars.
native: true
aria:
  pattern: "region landmark; a group for the bar holding a tablist of workspaces (aria-selected on the visible one) and a labelled status group; each window a focusable named group, or a tablist and tabpanels in the tabbed variant; the clients keep their own roles (log, textbox)"
  apg: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
variants:
  - id: default
    name: Tiled
    description: Two windows side by side; the terminal is focused.
  - id: tabbed
    name: Tabbed
    description: One container whose title row is a tab list; the terminal tab is visible and the editor panel is hidden.
  - id: floating
    name: Floating
    description: The terminal fills the workspace; the editor floats above it with the theme's only shadow and is focused.
sizes: [compact, comfortable]
states:
  - default
  - focus-visible
  - selected
  - container-inactive
  - error
tokens:
  root.bg: color.surface.desktop
  root.border: color.border.default
  bar.bg: color.surface.chrome
  bar.text: color.text.default
  bar.rule: color.border.divider
  workspace.text: color.text.default
  workspace.selected-bg: color.interaction.selection.bg
  workspace.selected-text: color.interaction.selection.text
  workspace.bg-hover: color.interaction.hover.bg
  workspace.ring: color.interaction.focus.ring
  workspace.ring-on-selection: color.interaction.focus.ring-container
  workspace.urgent-bg: color.status.danger.fill
  workspace.urgent-text: color.status.danger.on-fill
  status.separator: color.text.muted
  status.glyph: color.icon.decorative
  clock.text: color.text.bright
  area.bg: color.surface.desktop
  window.bg: color.surface.canvas
  window.border: color.border.default
  window.border-focused: color.border.active
  window.ring: color.interaction.focus.ring-container
  title.bg: color.surface.chrome
  title.text: color.text.muted
  title.bg-focused: color.surface.chrome-alt
  title.text-focused: color.text.bright
  tab.indicator: color.border.selected-indicator
  tab.indicator-inactive: color.border.selected-indicator-inactive
  floating.border: color.border.overlay
  floating.shadow: shadow.floating
  terminal.bg: color.terminal.bg
  terminal.text: color.terminal.fg
  editor.bg: color.code.bg
stateTokens:
  default: { fg: color.text.muted, bg: color.surface.chrome }
  focus-visible: { fg: color.text.bright, bg: color.surface.chrome-alt, outline: color.interaction.focus.ring-container }
  selected: { fg: color.interaction.selection.text, bg: color.interaction.selection.bg }
  container-inactive: { fg: color.text.muted, bg: color.surface.chrome }
  error: { fg: color.status.danger.on-fill, bg: color.status.danger.fill }
contrast:
  - { fg: color.text.default, bg: color.surface.chrome, label: "workspace names and status text on the bar" }
  - { fg: color.text.bright, bg: color.surface.chrome, label: "clock on the bar" }
  - { fg: color.text.bright, bg: color.surface.chrome-alt, label: "focused title" }
  - { fg: color.border.active, bg: color.surface.desktop, min: 3, kind: ui, label: "focused window frame on the desktop" }
  - { fg: color.border.overlay, bg: color.surface.desktop, min: 3, kind: ui, label: "floating window frame on the desktop" }
  - { fg: color.interaction.focus.ring-container, bg: color.surface.canvas, min: 3, kind: ui, state: focus-visible, label: "container ring on the window surface" }
  - { fg: color.interaction.focus.ring, bg: color.surface.chrome, min: 3, kind: ui, label: "ring on a workspace or tab" }
  - { fg: color.border.selected-indicator, bg: color.surface.chrome, min: 3, kind: ui, label: "visible-tab indicator on the title row" }
  - { fg: color.status.danger.fill, bg: color.surface.chrome, min: 3, kind: ui, state: error, label: "urgent fill against the bar" }
  - { fg: color.interaction.selection.bg, bg: color.surface.chrome, min: 1, kind: ui, label: "visible-workspace fill against the bar", waiver: "the fill is identified by its on-fill text (12.47:1) and aria-selected, as every selection fill in the theme" }
  - { fg: color.border.selected-indicator-inactive, bg: color.surface.chrome, min: 1, kind: ui, state: container-inactive, label: "inactive tab indicator", waiver: "an unfocused container's indicator is informative only; the visible tab is still named by aria-selected and bright text is withheld on purpose" }
  - { fg: color.border.default, bg: color.surface.desktop, min: 1, kind: ui, label: "unfocused window frames (decorative)", waiver: "an unfocused window is identified by its title bar and its client; the 1px frame only separates it from the desktop, as pixel borders do in i3" }
  - { fg: color.text.muted, bg: color.surface.chrome, min: 1, kind: ui, label: "status block separators (decorative)", waiver: "the separators only space blocks that are already distinct text" }
  - { fg: color.icon.decorative, bg: color.surface.chrome, min: 1, kind: ui, label: "status glyphs (decorative)", waiver: "every glyph is followed by its label; the glyphs are aria-hidden" }
anatomy:
  - part: root
    description: The region landmark on surface.desktop behind a 1px border.default; the inline-size container the stacking is measured on; the private geometry variables live here.
  - part: bar
    description: A 28px group on surface.chrome; the workspace tablist at the start, the status group at the end; scrolls horizontally rather than wrapping.
  - part: workspace
    description: A tab-role button (1:theme, 2:reference, 3:ports); the visible one is the selection fill; an urgent one is the danger fill with a trailing ! mark.
  - part: status
    description: The i3status blocks in Chinese with a decorative Nerd Font glyph each (处理器, 内存储器, 局域网, 电池) and the clock in the %m月%d号 %H时%M分%S秒 form, separated by 1px text.muted rules.
  - part: area
    description: The workspace on surface.desktop; a two-column grid with the 14px inner gap and the inner-plus-outer (12px) edge padding.
  - part: window
    description: A focusable named group on surface.canvas behind a 1px frame; border.default at rest, border.active when focused, border.overlay with shadow.floating when floating.
  - part: title
    description: A 23px title bar on surface.chrome in text.muted; the focused window's title is text.bright on surface.chrome-alt. In the tabbed variant the titles form a tablist whose visible tab carries the 2px indicator.
  - part: client
    description: The terminal or code-editor component, its own 1px boundary given up to the frame.
keyboard:
  - key: Tab / Shift+Tab
    action: The workspace tablist (its selected tab is the stop), then each window group, then the client inside it; in the tabbed variant the tab list, then the visible panel's client.
  - key: Arrow keys
    action: Move between workspaces in the bar and between tabs in a tabbed container; inside a client the client's own contract applies.
  - key: Enter / Space
    action: Shows the workspace or tab under focus.
  - key: Mod+h j k l, Mod+1..9
    action: The window manager's own bindings move focus and switch workspaces on the workstation; the specimen documents them and does not reimplement them.
responsive: The root is an inline-size container; below 600px the windows stack in one column, the floating window narrows to 80% of the workspace, and the bar scrolls horizontally rather than wrapping. Each client scrolls inside its own window; the region never scrolls horizontally. RTL mirrors the workspace order, the status side and the floating window's inset; the clients themselves stay left-to-right as terminals and editors do.
portability:
  web: A region, groups, a tablist and the clients' own roles; every state renders from the root hooks data-state-focus-visible, data-state-selected, data-state-container-inactive and data-state-error without a script. The bar height (28px), title height (23px) and gaps (14px inner, −2px outer) are private variables on the root that reproduce the workstation's i3 configuration; they are reference metrics, not tokens, and not a rule for any other application.
  nativeFallbacks:
    - "i3 / sway: bar colours from the bar block, client colours from client.focused, client.unfocused and client.urgent, border pixel 1, gaps inner 14 and outer −2; the port records the exact mapping."
    - "GTK4 / Qt: not applicable; a desktop application never draws its own window manager. Hosts style their own frames with the border and title roles only."
    - "Terminal multiplexer (tmux): the status line takes the bar roles, the pane borders border.default and border.active, the active window name the selection fill."
fixtures: [FX-STATE-MATRIX, FX-320, FX-360, FX-ZOOM-200, FX-RM, FX-HC, FX-I18N, FX-RTL, FX-DENSITY]
related: [terminal, code-editor, tabs]
specimens: []
keywords: [i3, window manager, bar, workspace, tiled, tabbed, floating, workstation]
sources: [j3w1-web, legacy-i3]
compact: false
---

## Purpose

The frame the palette was tuned in: an i3 bar, tiled windows with 1px
pixel borders, 14/−2 gaps, a tabbed container and one floating window. It
proves that the terminal and code-editor components sit inside window
chrome drawn from the same roles, and it records the workstation's geometry
as reference metrics. It is a specimen of composition, not a desktop.

## Anatomy

The region on {color.surface.desktop}; the 28px bar on
{color.surface.chrome} with the workspace tablist (the visible workspace on
{color.interaction.selection.bg}) and the i3status group in Chinese with
its clock in {color.text.bright}; the workspace grid with the reference
gaps; each window a focusable group behind a 1px {color.border.default}
frame, {color.border.active} when focused, with a 23px title bar in
{color.text.muted} on {color.surface.chrome} that turns {color.text.bright}
on {color.surface.chrome-alt} when focused; the terminal or code-editor as
the client with its own boundary given up to the frame. Tabbed: the titles
form a tablist whose visible tab carries the 2px
{color.border.selected-indicator}. Floating: the editor sits above the
terminal behind {color.border.overlay} with {shadow.floating}, the only
shadow in the theme.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | the terminal window focused: {color.border.active} frame and the bright title; the editor at rest; workspace 1 filled | the title text; `aria-selected` |
| focus-visible | the 2px {color.interaction.focus.ring-container} ring at −3px inside the focused window or container; the client draws no second ring | the ring |
| selected | workspace 2 takes the selection fill with {color.interaction.selection.text}; workspace 1 drops to rest | `aria-selected` |
| container-inactive | no window has focus: every frame {color.border.default}, every title {color.text.muted} on {color.surface.chrome}, the tab indicator {color.border.selected-indicator-inactive}, no caret | lightness drop; no caret |
| error | workspace 3 is urgent: {color.status.danger.fill} with {color.status.danger.on-fill} and a trailing ! | the ! mark; "urgent" read to assistive technology |

The clients keep their own states (the terminal's busy cursor, the editor's
selection and read-only gutter); this specimen declares only the states the
frame adds around them.

## Keyboard

The workspace tablist is one stop with arrow movement; Enter or Space shows
a workspace. Each window is a focusable group so the frame itself can hold
focus, as i3 focuses a container; Tab then enters the client, whose own
contract applies (the terminal log, the read-only editor textbox). In the
tabbed variant the tab list is one stop and only the visible panel's client
follows. Mod+h j k l and Mod+1..9 belong to the window manager and are
documented, not reimplemented. Nothing traps focus.

## Accessibility

The region names its workspace and layout. The bar is a group holding a
named tablist and a status group in `lang="zh"`, whose Nerd Font glyphs
are `aria-hidden` so only the labels are read. Every window is a named
group; the focused one says so in its name and the floating one too.
Urgency carries the ! mark and a visually hidden "urgent". Contrast:
workspace names 8.60:1 and the clock 10.31:1 on the bar, focused titles
10.01:1, rest titles 5.77:1, the focused frame 4.97:1 and the ring 10.37:1
on the window surface, the urgent fill 4.12:1 against the bar with 4.58:1
text on it.

## Portability

Groups, a tablist and the clients' own roles; every state renders from the
root hooks without a script. The i3 geometry — bar 28px, titles 23px, gaps
14px inner and −2px outer — is reproduced with private variables on this
specimen's root only. Those numbers are reference metrics of the
workstation, recorded so a port of the i3 configuration matches it; they
are not tokens and not a rule for any other application, which keeps its
own window manager, bar and gaps. The specimen proves composition, not a
product; only i3 and sway ports draw this frame.

## Non-examples

A window with rounded corners or a title bar gradient. A focused window
that glows or blurs its neighbours. A shadow under a tiled window; the only
shadow is the floating one. Gaps of 14/−2 forced into an unrelated
application's layout. A workspace indicator drawn as a red underline
instead of the selection fill. Traffic-light close buttons in the title
bar. A translucent bar.
