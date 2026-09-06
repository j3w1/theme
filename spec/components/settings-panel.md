---
id: settings-panel
name: Settings panel
family: composed
maturity: stable
priority: R1
since: 0.1.0
order: 10
summary: A two-column settings screen composed from the sidebar-nav, fieldset, switch, select, radio-group, text-field, checkbox and button components; below 600px the sidebar becomes a tab strip.
native: true
aria:
  pattern: "region landmark named by the h2; a nav landmark for the sections with aria-current on the open one; a form landmark holding native controls in one fieldset; aria-busy on the form while applying"
  apg: https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/
variants:
  - id: default
    name: Two columns
  - id: narrow
    name: Narrow (360px)
    description: The same markup with the root fixed at 360px; the container query collapses the sidebar into a tab strip above the form.
sizes: [compact, comfortable]
states:
  - default
  - focus-visible
  - invalid
  - busy
tokens:
  root.bg: color.surface.default
  root.border: color.border.default
  nav.bg: color.surface.default
  nav.border: color.border.divider
  nav.text: color.text.default
  nav.current-text: color.text.bright
  nav.current-indicator: color.border.selected-indicator
  nav.bg-hover: color.interaction.hover.bg
  title.text: color.text.bright
  lead.text: color.text.muted
  group.border: color.border.divider
  group.legend: color.text.bright
  control.bg: color.surface.input
  control.border: color.border.control
  control.text: color.text.default
  control.ring: color.interaction.focus.ring
  control.checked-bg: color.action.primary.bg
  control.checked-glyph: color.action.primary.text
  invalid.border: color.status.danger.border
  invalid.message: color.status.danger.text
  footer.border: color.border.divider
  apply.bg: color.action.primary.bg
  apply.text: color.action.primary.text
  apply.busy-glyph: color.action.primary.text
  reset.text: color.action.secondary.text
  reset.border: color.action.secondary.border
stateTokens:
  default: { fg: color.text.default, bg: color.surface.default }
  focus-visible: { fg: color.text.default, bg: color.surface.input, border: color.border.control, outline: color.interaction.focus.ring }
  invalid: { fg: color.text.default, bg: color.surface.input, border: color.status.danger.border }
  busy: { fg: color.action.primary.text, bg: color.action.primary.bg }
contrast:
  - { fg: color.text.bright, bg: color.surface.default, label: "title, legend and the current section on the panel surface" }
  - { fg: color.text.muted, bg: color.surface.default, label: "lead and help text on the panel surface" }
  - { fg: color.status.danger.text, bg: color.surface.default, state: invalid, label: "validation message on the panel surface" }
  - { fg: color.border.selected-indicator, bg: color.surface.default, min: 3, kind: ui, label: "current-section indicator bar" }
  - { fg: color.border.control, bg: color.surface.default, min: 3, kind: ui, label: "control boundaries on the panel surface" }
  - { fg: color.action.secondary.border, bg: color.surface.default, min: 3, kind: ui, label: "Reset button boundary" }
  - { fg: color.border.default, bg: color.surface.default, min: 1, kind: ui, label: "panel edge (decorative)", waiver: "the panel edge separates the screen from the page; every control inside carries its own boundary" }
  - { fg: color.border.divider, bg: color.surface.default, min: 1, kind: ui, label: "sidebar, group and footer rules (decorative)", waiver: "the rules group content that is already distinct by landmark and legend" }
anatomy:
  - part: root
    description: The region landmark, surface.default behind a 1px border.default; a two-column grid and the inline-size container the collapse is measured on.
  - part: nav
    description: The sidebar-nav in the first column (Appearance, Keyboard, Notifications, Advanced) with aria-current on the open section; below 600px a horizontal strip whose current link carries the 2px indicator along its bottom edge.
  - part: content
    description: The form landmark in the second column, named by the title, aria-busy while applying.
  - part: title / lead
    description: The h2 in text.bright and a one-line explanation in text.muted.
  - part: group
    description: One fieldset holding, in order, two switches, a select, a horizontal radio-group, a numeric text-field with a px suffix and a checkbox group; each keeps its own component contract.
  - part: footer
    description: A border.divider rule above the primary Apply and the secondary Reset buttons.
keyboard:
  - key: Tab / Shift+Tab
    action: Walks the section links, then the controls in reading order, then Apply and Reset; nothing inside is a composite widget, so every control is its own stop.
  - key: Enter / Space
    action: Follows a section link; toggles a switch or checkbox; opens the select.
  - key: Arrow keys
    action: Move within the radio-group and the select's options; step the numeric field.
  - key: Escape
    action: Nothing; the panel is not a dialog and nothing is dismissed.
responsive: The root is an inline-size container; below 600px the sidebar collapses into a scrollable tab strip above the form and both columns span the grid. Every control keeps min-width 0 and wraps its label above; at 320px the strip scrolls and the form stacks without clipping. RTL mirrors the sidebar side, the indicator edge and the px suffix.
portability:
  web: A region, a nav and a form landmark with native controls; the collapse is a container query on the root and needs no script. Hosts without container queries collapse at the 600px viewport breakpoint and record the deviation. The two-column grid and the 56rem reference width are layout of this specimen, not rules.
  nativeFallbacks:
    - "GTK4: a HeaderBar-free window with a StackSidebar and a PreferencesPage; each row maps to its own component port."
    - "Qt: QListWidget beside a QStackedWidget of QGroupBox forms; the busy state is a QProgressBar in the button row."
    - "Terminal UI: a two-pane layout whose left list uses the selection fill; below 60 columns the list becomes a top tab row."
fixtures: [FX-STATE-MATRIX, FX-320, FX-360, FX-ZOOM-200, FX-RM, FX-HC, FX-I18N, FX-RTL, FX-DENSITY]
related: [sidebar-nav, fieldset, switch, select, radio-group, text-field, checkbox, button, tabs]
specimens: []
keywords: [settings, preferences, sidebar, form, composed, screen, container query]
sources: [j3w1-web]
compact: false
---

## Purpose

A settings screen that proves the form components compose without new
tokens: a section list on the left, one fieldset of preferences on the
right, and a footer of actions. It exists to show the pieces together under
every state and at every width, not to prescribe a product.

## Anatomy

The region landmark; the sidebar-nav with the open section marked by
`aria-current` and the 2px {color.border.selected-indicator}; the form
landmark with its h2 in {color.text.bright} and lead in {color.text.muted};
one fieldset with a {color.border.divider} edge holding two switches (Hide
the bar, Smart gaps), a wallpaper select, the bar-label radio-group (中文 /
English), the inner-gap text-field with a `px` suffix and the bar-module
checkbox group; a footer rule and the Apply (primary) and Reset (secondary)
buttons. Every part is the component's own markup and classes.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | rest tokens of every component on {color.surface.default}; the open section carries the indicator bar | `aria-current` |
| focus-visible | the dashed {color.interaction.focus.ring} on the control holding focus (shown on the first switch); the other controls stay at rest | the ring |
| invalid | the inner-gap field takes the 2px {color.status.danger.border} and shows its ✕ message; the other controls stay at rest | border width 1 → 2px; glyph; `aria-invalid` |
| busy | Apply shows the static ⋯ glyph in {color.action.primary.text}; the form carries `aria-busy`; nothing shrinks or animates | glyph; `aria-busy`; cursor: progress |

The composed components keep their own hover, checked, disabled and
read-only treatments; this specimen declares only the states the screen adds
to them.

## Keyboard

Landmarks first: a screen reader's landmark list offers the region, the
navigation and the form by name. Tab walks the section links, then every
control in reading order, then Apply and Reset. The radio-group and the
select move with arrows inside one stop; the numeric field steps with Up and
Down; switches and checkboxes toggle with Space. Nothing traps focus and
nothing changes on hover alone.

## Accessibility

The region is named by the h2 through `aria-labelledby`; the nav has its own
label so two navigation landmarks on a page stay distinguishable; the open
section is `aria-current="page"`. The form is named by the same h2 and
carries `aria-busy="true"` while Apply is in progress, so the pending state
is announced without a live region. Every control has a programmatic label;
every message is linked by `aria-describedby`. Contrast: title 10.10:1 and
lead 5.66:1 on the panel surface, control boundaries 4.33:1, the indicator
bar 4.57:1, the danger border 4.69:1 on the input surface.

## Portability

Three landmarks, native controls and a container query; nothing here needs a
script. A host without container queries collapses the sidebar at the 600px
viewport breakpoint. The 56rem reference width, the sidebar width and the
two-column grid belong to this specimen and are not rules; the specimen
proves composition, not a product. Toolkits port each contained component
through its own mapping and place them with their native layout.

## Non-examples

A rounded, shadowed settings card. A Material-style app bar above the form.
Toggle switches with rounded pills or animated thumbs. Section links drawn
as filled tabs instead of the indicator bar. A red form background to show
that something is invalid. Applying while the controls are dimmed with
opacity. A spinner replacing the Apply label.
