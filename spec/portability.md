---
id: portability
title: Portability
order: 40
summary: How the theme travels to other applications and frameworks, what a port must reproduce, what it may declare unsupported, and how support is catalogued truthfully.
---

## Scope of a port

A port themes only what the host documents as customisable. Editor colouring,
application chrome, terminal colours and plugin surfaces are separate scopes;
a file that changes one does not claim the others. A port never patches
binaries, injects unsupported hacks, overwrites a user's whole settings file or
replaces keybindings, credentials or unrelated preferences. It installs under a
unique name beside the host's defaults and documents how to roll back.

## What every port must reproduce

1. The surface ladder: canvas, default, raised, overlay, input.
2. The text ladder: default, bright, prose, muted, subtle, disabled.
3. Focus as a ring distinct from selection as a fill, with the ring recoloured
   on fills.
4. Selection, inactive selection and hover as three distinguishable fills.
5. The status hues with their glyphs where the host renders glyphs.
6. Zero radii and 1px borders where the host allows geometry; otherwise a
   recorded deviation.
7. The monospace family by name, honouring the user's size.

Every required role is mapped, explicitly inherited from the host, marked
unsupported with an explanation, or intentionally out of scope. A percentage
of coverage is meaningful only with its denominator.

## Fallbacks by host capability

| Host capability | Fallback |
| --- | --- |
| No dashed outlines (many native toolkits) | solid 1px ring in `focus.ring`; record the deviation |
| No separate inactive selection | selection fill everywhere; record it |
| No read-only styling hook | treat as default text with a dotted bottom edge if borders are available, else as default |
| No pattern fills (charts) | keep the glyph or label channel; never colour alone |
| Sixteen-colour terminal | `heritage-ansi` for fidelity or the `extended` slots when approved; document bold-as-bright and whether 256/24-bit colours bypass the slots |
| Fixed radii in the host | document; do not fight the toolkit |
| Host forbids removing its focus indicator | keep the host's indicator; never draw two |

## Web consumers

The site's `exports/tokens.css` exposes every role as a custom property.
Consume roles (`--color-text-default`), never primitives. A framework
integration maps roles onto the framework's theme keys and lists what it
cannot express; `agents/consume.md` gives the reading order and the deviation
report format, and `theme.lock.json` pins the revision.

## Native ports (future)

A port lives at `ports/<slug>/` with `port.json`, `mapping.json`, `src/`,
`dist/` and `evidence/`, created from `templates/port/` only when work begins.
Statuses are `experimental`, `verified` and `deprecated`; reference
implementations and roadmap candidates are not statuses. `verified` requires a
real import into the recorded application version with matching evidence and a
token digest equal to the current default profile. A successful XML or JSON
parse is a structural pass, not verification. Never hand-edit a generated hex;
fix the mapping or the approved token and regenerate.

For JetBrains, an editor scheme (`.icls`) and a UI theme plugin are separate
capabilities; the scheme alone does not recolour toolbars or dialogs. For
Notepad++, a style-theme XML, the dark-mode chrome setting and User Defined
Languages are three mechanisms. Consult the vendor documentation for the
tested version before mapping.

## The reference implementation

`j3w1/j3w1.github.io` is the flagship web implementation and the source of the
observed values. It is not an upstream that this repository scrapes at build
time, and there is no automatic synchronisation in either direction. A later
integration pins a release of this theme in that site through a separate
reviewed change and records its own site-specific values (window-manager
geometry, wallpaper gradients) as such.
