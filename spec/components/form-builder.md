---
id: form-builder
name: Form builder
family: forms-advanced
maturity: draft
priority: L
since: 0.1.0
order: 100
summary: A bounded reference editor for five canonical field kinds, with keyboard ordering, local preview and explicit JSON definition import and export.
native: true
aria:
  pattern: Native buttons, labelled inputs, fieldsets and ordered field definitions; no drag-only operations.
variants:
  - id: default
    name: Reference definition
sizes: [compact, comfortable]
states: [default, empty, invalid, disabled]
tokens:
  root.bg: color.surface.default
  root.text: color.text.default
  root.border: color.border.control
  status.text: color.text.muted
stateTokens:
  default: { fg: color.text.default, bg: color.surface.default, border: color.border.control }
contrast:
  - { fg: color.text.default, bg: color.surface.default, label: Editor text }
  - { fg: color.text.muted, bg: color.surface.default, label: Definition status }
anatomy:
  - part: definition
    description: An ordered list of stable field identities and native edit, move and remove actions.
  - part: preview
    description: Canonical text-field, textarea, select, checkbox and radio-group markup rendered from the definition at either density.
  - part: transfer
    description: Explicit bounded JSON import and definition-only download; entered preview values are excluded.
keyboard:
  - key: Tab / Shift+Tab
    action: Reach add, field editor, ordering, removal, preview and transfer controls in document order.
  - key: Enter / Space
    action: Activate the focused native button. Move up and Move down preserve stable identity and focus.
  - key: Arrow keys
    action: Use native select and radio choices in the preview.
responsive: One column at narrow widths; editor controls and buttons wrap without changing order. Preview supports compact and comfortable density in the default profile.
portability:
  web: A local reference implementation using existing field contracts. JSON is a theme-pinned definition, not an executable form or backend API.
  nativeFallbacks: [No native port or production form platform is claimed.]
fixtures: [FX-360, FX-ZOOM-200, FX-DENSITY]
related: [admin-form, text-field, textarea, select, checkbox, radio-group, button]
keywords: [schema, builder, form, local, keyboard]
compact: false
---

## Purpose

Build a bounded reference form in the
[interactive builder](https://j3w1.github.io/theme/builder/). D-021 remains
proposed; this draft promotes no tokens, roles, profiles or native ports.

## Anatomy

Each field has a stable ID, label, help, required flag and, for select and
radio, stable option IDs and labels. Saving an edit validates the whole
proposed definition before replacing the current one.

The preview uses the canonical field renderer and validation model of the
validation-recovery composition. Changing a definition clears preview values
and errors; moving focus or typing a preview value never changes the
definition.

## States

The empty state shows an explanation and an add action. An invalid import or edit
reports a corrective message and keeps the current definition. Move buttons
are disabled at the list boundaries. Default shows the ordered definition and
preview. The static specimen shows the definition; interactive execution
evidence is recorded separately.

## Keyboard

No drag is required. Moving keeps focus on the moved field's controls;
removing focuses the next remaining field or the add control; import and
reset return to the add control. Preview submit focuses its error summary,
whose links target stable field control IDs.

## Accessibility

Use the canonical label, help and error associations, required markers and
radio fieldset/legend semantics. Stable IDs survive JSON round trips and
reordering. Imported strings are text, never markup. Test presence claims no
manual screen-reader pass.

## Portability

Definition schema version 1 pins theme name, version, default profile and
constituent component content digest. Limits: 64 KiB, 20 fields, 20 options
per choice field, 120-character labels, 400-character help, 2000-character
preview text. Unknown keys, duplicate IDs, unsupported kinds, invalid choices
and mismatched theme identity are rejected atomically. An old content
identity needs an explicit migration outside this tool.

Everything stays in memory; only Download definition creates a file, with the
schema and no entered values. Reset clears definition and preview. No
autosave, network submission, schema execution, arbitrary HTML/CSS/JavaScript
or imported validation expression.

## Non-examples

A production backend, conditional logic engine, drag-only editor, arbitrary
code generator, persistent account form, or native application port.
