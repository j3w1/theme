---
id: avatar
name: Avatar
family: display
maturity: stable
priority: R2
since: 1.0.0
order: 539
summary: A square entity image with a named text fallback.
native: true
aria:
  pattern: Named image or text fallback
variants:
  - id: default
    name: Default
sizes:
  - compact
  - comfortable
states:
  - default
  - loading
  - error
tokens:
  root.bg: color.surface.default
  root.text: color.text.default
  root.border: color.border.control
  heading.text: color.text.bright
  secondary.text: color.text.muted
  control.bg: color.surface.input
  control.focus: color.interaction.focus.ring
  dependency.role-border-width-default: border.width.default
  dependency.role-font-weight-bold: font.weight.bold
  dependency.role-radius-none: radius.none
  dependency.role-space-12: space.12
  dependency.role-space-2: space.2
  dependency.role-space-32: space.32
stateTokens:
  default:
    fg: color.text.default
    bg: color.surface.default
    border: color.border.control
contrast:
  - fg: color.text.default
    bg: color.surface.default
    label: Primary content
  - fg: color.text.muted
    bg: color.surface.default
    label: Supporting content
  - fg: color.border.control
    bg: color.surface.default
    min: 3
    kind: ui
    label: Control boundary
anatomy:
  - part: frame
    description: Square bounded image area with a border.
  - part: fallback
    description: Caller-supplied initials, backed by the full accessible name.
  - part: image
    description: Optional image; failed loading restores the text fallback.
keyboard:
  - key: Tab
    action: No additional tab stop. An enclosing link remains native.
responsive: Wrap labels and actions without changing source order. Use logical
  spacing in RTL. Preserve native target sizes at both densities; only bounded
  data regions may scroll horizontally.
portability:
  web: Identify a person or entity with an optional caller-owned image and text
    fallback. The component ships no image service or assets. Failed images
    restore the fallback and retain the full accessible name.
  nativeFallbacks:
    - Use equivalent native semantics and approved roles; record any unsupported
      behavior as a mapping deviation.
fixtures:
  - FX-320
  - FX-360
  - FX-ZOOM-200
  - FX-I18N
  - FX-RTL
  - FX-RM
  - FX-HC
  - FX-TOUCH
  - FX-DENSITY
  - FX-STATE-MATRIX
related: []
specimens: []
keywords:
  - avatar
sources: []
compact: false
---

## Purpose

Identify a person or entity with an optional caller-owned image and text fallback. The component ships no image service or assets. Failed images restore the fallback and retain the full accessible name.

## Anatomy

- **frame:** Square bounded image area with a border.
- **fallback:** Caller-supplied initials, backed by the full accessible name.
- **image:** Optional image; failed loading restores the text fallback.

## States

| State | Presentation | Non-colour channel |
| --- | --- | --- |
| default | Initials or loaded image. | Full name on the image container. |
| loading | Fallback remains visible. | No loss of the full accessible name while loading. |
| error | Fallback remains visible. | Image failure does not remove the entity name. |

## Keyboard

- **Tab:** No additional tab stop. An enclosing link remains native.

## Accessibility

Use one full accessible name, avoiding duplicate announcements from image alt and fallback text. Initials alone do not adequately identify a person. A decorative avatar beside an equivalent visible name may be aria-hidden.

## Portability

Wrap labels and actions without changing source order. Use logical spacing in RTL. Preserve native target sizes at both densities; only bounded data regions may scroll horizontally. Use equivalent native semantics and approved roles; record any unsupported behavior as a mapping deviation. The host owns application data, persistence, permissions and services.

## Non-examples

Unlabelled controls, color-only status, drag-only operations, hidden required instructions, stolen focus or an invented service success.
