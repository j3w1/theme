---
id: component-id
name: Component name
family: forms-basic
maturity: draft
priority: R1
since: 0.1.0
order: 10
summary: One sentence, under 200 characters, saying what the component is for.
native: true
aria:
  pattern: native <element>
variants:
  - id: default
    name: Default
sizes: [compact, comfortable]
states: [default, hover, focus-visible, disabled]
tokens:
  root.bg: color.surface.input
  root.border: color.border.control
  root.text: color.text.default
stateTokens:
  default: { fg: color.text.default, bg: color.surface.input, border: color.border.control }
anatomy:
  - part: root
    description: The outer box.
keyboard:
  - key: Tab
    action: Moves focus in document order.
responsive: How it behaves at 320px and in RTL.
portability:
  web: What native element or APG pattern implements it.
  nativeFallbacks: []
fixtures: [FX-STATE-MATRIX]
related: []
specimens: []
keywords: []
sources: []
compact: false
---

## Purpose

## Anatomy

## States

| State | Visual | Non-colour channel |
| --- | --- | --- |
| default | … | — |
| hover | … | … |
| focus-visible | … | the ring |
| disabled | … | `disabled` attribute; cursor |

## Keyboard

## Accessibility

## Portability

## Non-examples
