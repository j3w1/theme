---
id: admin-form
name: Admin form
family: composed
maturity: stable
priority: R1
since: 0.1.0
order: 20
summary: A create-or-edit record screen composed from breadcrumbs, a wizard step list, alerts, six field components and a button row; the review step is a table with an Edit button per row.
native: true
aria:
  pattern: "region landmark named by the h2; a Breadcrumb nav landmark; the wizard step list with aria-current=step; role=status and role=alert notices; a form landmark of native controls; aria-busy on the form while saving; a disabled fieldset around it while inert"
  apg: https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/
variants:
  - id: default
    name: Identity step
  - id: review
    name: Review step
    description: The third step; the field grid is replaced by a table of the entered values with a tertiary Edit button per row, and the primary action saves the record.
sizes: [compact, comfortable]
states:
  - default
  - invalid
  - busy
  - disabled
tokens:
  root.bg: color.surface.default
  root.border: color.border.default
  crumbs.link: color.text.link
  crumbs.current: color.text.bright
  title.text: color.text.bright
  step.text: color.text.default
  step.current-text: color.text.bright
  step.current-indicator: color.border.selected-indicator
  step.complete: color.status.success.text
  step.invalid: color.status.danger.text
  notice.tint: color.status.info.tint
  notice.border: color.status.info.border
  notice.text: color.status.info.text
  summary.tint: color.status.danger.tint
  summary.border: color.status.danger.border
  summary.text: color.status.danger.text
  field.bg: color.surface.input
  field.border: color.border.control
  field.text: color.text.default
  field.label: color.text.bright
  field.help: color.text.muted
  field.affix: color.text.muted
  invalid.border: color.status.danger.border
  invalid.message: color.status.danger.text
  disabled.bg: color.interaction.disabled.bg
  disabled.text: color.text.disabled
  disabled.border: color.border.disabled
  review.key: color.text.muted
  review.header-rule: color.border.strong
  review.row-rule: color.border.divider
  footer.border: color.border.divider
  continue.bg: color.action.primary.bg
  continue.text: color.action.primary.text
  continue.busy-glyph: color.action.primary.text
  back.text: color.action.secondary.text
  back.border: color.action.secondary.border
  draft.text: color.action.tertiary.text
  draft.bg-hover: color.action.tertiary.hover-bg
stateTokens:
  default: { fg: color.text.default, bg: color.surface.input, border: color.border.control }
  invalid: { fg: color.status.danger.text, bg: color.status.danger.tint, border: color.status.danger.border }
  busy: { fg: color.action.primary.text, bg: color.action.primary.bg }
contrast:
  - { fg: color.text.bright, bg: color.surface.default, label: "title, labels and the current step on the panel surface" }
  - { fg: color.text.muted, bg: color.surface.default, label: "help, affix and review keys on the panel surface" }
  - { fg: color.text.link, bg: color.surface.default, label: "breadcrumb links on the panel surface" }
  - { fg: color.status.success.text, bg: color.surface.default, label: "complete-step check" }
  - { fg: color.status.info.text, bg: color.status.info.tint, label: "notice title on its tint" }
  - { fg: color.text.default, bg: color.status.info.tint, label: "notice text on its tint" }
  - { fg: color.text.default, bg: color.status.danger.tint, state: invalid, label: "summary text on the danger tint" }
  - { fg: color.status.danger.text, bg: color.surface.default, state: invalid, label: "field messages on the panel surface" }
  - { fg: color.status.danger.border, bg: color.surface.input, min: 3, kind: ui, state: invalid, label: "invalid field boundary" }
  - { fg: color.border.selected-indicator, bg: color.surface.default, min: 3, kind: ui, label: "current-step indicator bar" }
  - { fg: color.action.secondary.border, bg: color.surface.default, min: 3, kind: ui, label: "Back button and file-input button boundaries" }
  - { fg: color.text.disabled, bg: color.interaction.disabled.bg, min: 3, kind: ui, state: disabled, label: "disabled control text (exempt; house floor 3:1)" }
  - { fg: color.text.disabled, bg: color.surface.default, min: 3, kind: ui, state: disabled, label: "disabled labels and review keys (exempt; house floor 3:1)" }
  - { fg: color.border.disabled, bg: color.interaction.disabled.bg, min: 1, kind: ui, state: disabled, label: "disabled boundaries (exempt)", waiver: "disabled controls are exempt from 1.4.11" }
  - { fg: color.border.strong, bg: color.surface.default, min: 1, kind: ui, label: "review header rule (decorative)", waiver: "the header row is identified by th scope=col; the rule only separates it" }
  - { fg: color.border.default, bg: color.surface.default, min: 1, kind: ui, label: "panel edge (decorative)", waiver: "the panel edge separates the screen from the page; every control inside carries its own boundary" }
  - { fg: color.border.divider, bg: color.surface.default, min: 1, kind: ui, label: "step, row and footer rules (decorative)", waiver: "the rules group content that is already distinct by landmark, list and table structure" }
anatomy:
  - part: root
    description: The region landmark named by the title, surface.default behind a 1px border.default; a single-column grid and the inline-size container the footer stacking is measured on.
  - part: breadcrumbs
    description: Records / Workstations / New, the last with aria-current="page".
  - part: title
    description: The h2 in text.bright.
  - part: steps
    description: The wizard step list only (Identity, Network, Review); the current step carries aria-current="step" and the 2px indicator, complete steps the ✓, future steps are disabled.
  - part: notice / summary
    description: An info alert (role status) above the fields; in the invalid state a danger alert (role alert) summarising the failed fields replaces it.
  - part: fields
    description: The form landmark; a grid of the name and hostname text-fields (the hostname with a .lan suffix), the role select, the commissioned-on date-picker, the SSH-key file-input, the notes textarea with its count and the enable checkbox. Each keeps its own contract.
  - part: review
    description: In the review variant, a table whose row headers are the field names in text.muted, values in text.default and a tertiary Edit button per row.
  - part: footer
    description: A border.divider rule above Back (secondary), Save draft (tertiary) and Continue or Save workstation (primary), end-aligned; stacked full-width below 600px.
keyboard:
  - key: Tab / Shift+Tab
    action: Breadcrumb links, the reachable step buttons, then every field in reading order, then Back, Save draft and Continue; the file-input's native input is the stop and its button label is drawn with the ring.
  - key: Enter
    action: Follows a breadcrumb, activates a step or a button; in a text field submits the form in a host.
  - key: Space
    action: Toggles the checkbox; opens the file chooser from the file-input.
  - key: Arrow keys
    action: Move within the select and the date field's segments.
  - key: Escape
    action: Nothing; the screen is not a dialog.
responsive: The root is an inline-size container; the field grid uses auto-fill columns of at least 20rem, so it is two columns wide in the reference frame and one at 320px, the notes always spanning the row. Below 600px the footer buttons stack full width with the primary action first in visual order. The review table scrolls inside its own container when narrower than its content. RTL mirrors the breadcrumb separators, the step order, the suffix and the button alignment.
portability:
  web: Landmarks and native controls; aria-invalid and the summary alert appear after submit, aria-busy while saving, and a disabled fieldset makes the form inert; the state hooks are data-state-invalid, data-state-busy and data-state-disabled on the root. Hosts without container queries stack the footer at the 600px viewport breakpoint. The 56rem width and the two-column grid are layout of this specimen, not rules.
  nativeFallbacks:
    - "GTK4: a Breadcrumb-free HeaderBar title, an Adw.Carousel-free step list as a ListBox, and a PreferencesGroup of rows; invalid rows use the .error style class and an InfoBar carries the summary."
    - "Qt: QWizard with its page list, a QFormLayout of fields, a QMessageBox-free inline banner; busy disables the page through setEnabled(false)."
    - "Terminal UI: a title, a step line, fields stacked at full width, the summary as a double-line box; the ✓ and ✕ glyphs survive without colour."
fixtures: [FX-STATE-MATRIX, FX-LONG, FX-320, FX-360, FX-ZOOM-200, FX-RM, FX-HC, FX-I18N, FX-RTL, FX-DENSITY]
related: [breadcrumbs, wizard, alert, text-field, select, date-picker, file-input, textarea, checkbox, button, table]
specimens: []
keywords: [form, record, create, edit, wizard, review, validation, composed]
sources: [j3w1-web]
compact: false
---

## Purpose

A record screen that proves the advanced form components compose with the
navigation and feedback components: a trail, a heading, a step list, a
notice, a grid of fields and a row of actions, then the same screen at its
review step. It exists to show validation, saving and inertness across a
whole form, not to prescribe a product.

## Anatomy

The region landmark; the breadcrumbs (Records / Workstations / New); the h2
in {color.text.bright}; the wizard step list with the current step on the
2px {color.border.selected-indicator}; an info alert on
{color.status.info.tint}; the form landmark holding the name and hostname
text-fields, the role select, the commissioned-on date-picker, the SSH-key
file-input, the notes textarea with its count and the enable checkbox; the
footer rule and the Back, Save draft and Continue buttons. The review
variant replaces the fields with a table whose row headers are the field
names in {color.text.muted} and whose last column is a tertiary Edit button.
Every part is the component's own markup and classes.

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | rest tokens of every component on {color.surface.default}; the current step carries the indicator bar, future steps are disabled | `aria-current="step"` |
| invalid | the name and hostname fields take the 2px {color.status.danger.border} and show their ✕ messages; the current step's marker becomes ✕; a danger alert on {color.status.danger.tint} summarising the two fields replaces the notice; the other fields stay at rest | border width 1 → 2px; glyphs; `aria-invalid`; `role="alert"` |
| busy | Continue shows the static ⋯ glyph in {color.action.primary.text}; the form carries `aria-busy`; nothing shrinks or animates | glyph; `aria-busy`; cursor: progress |
| disabled | every control takes its component's disabled treatment ({color.text.disabled}, {color.border.disabled}, {color.interaction.disabled.bg}); labels and review keys dim; no hover anywhere | `disabled` on the wrapping fieldset; cursor: not-allowed; never opacity |

The composed components keep their own hover, focus-visible, required,
placeholder-shown and read-only treatments; this specimen declares only the
states the whole form adds to them.

## Keyboard

Landmarks first: the region, the Breadcrumb navigation and the form are
offered by name. Tab walks the trail, the reachable steps, the fields in
reading order and the three buttons; the file-input's hidden native input is
the stop and its visible button label is drawn with the ring. The select and
the date field move with arrows inside one stop. In the review variant the
Edit buttons are ordinary stops inside the table. Nothing traps focus.

## Accessibility

The region and the form are both named by the h2. Complete steps read ", complete"
through a visually hidden suffix; future steps are disabled, not hidden.
The notice is `role="status"` and the invalid summary is `role="alert"`, so
the summary is announced once on submit while each field's message stays
linked by `aria-describedby`; `aria-invalid` is set only after submit. While
saving the form carries `aria-busy` and, once inert, sits inside a disabled
fieldset so every control reports its state natively. The review table has
a caption, column headers and row headers; each Edit button names its field
through a visually hidden suffix. Contrast: notice title 6.5:1 or better on
its tint, messages 5.26:1 on the panel surface, the invalid boundary 4.69:1
on the input surface, disabled text 3.24:1 (exempt).

## Portability

Landmarks, native controls, one container query and three root hooks
(`data-state-invalid`, `data-state-busy`, `data-state-disabled`); no script
is needed to render any state. Hosts without container queries stack the
footer at the 600px viewport breakpoint. The 56rem reference width and the
two-column field grid are layout of this specimen and not rules; the
specimen proves composition, not a product. Toolkits port each contained
component through its own mapping.

## Non-examples

A rounded card with a drop shadow around the form. A Material stepper with
circular numbered badges and a connecting line. A red banner across the
whole form instead of the summary alert plus field messages. Fields whose
borders glow red. A spinner replacing the Continue label. Saving while the
fields fade to half opacity. Placing the actions in a sticky footer bar with
a shadow.
