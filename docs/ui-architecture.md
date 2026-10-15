# Official web implementation architecture

All 67 inventory entries, copy distributions, the static portal and the Vue
showcase are implemented. This document describes the architecture; acceptance
and deployment are in the separate delivery and execution records.

## Ownership

- `tokens/` and `spec/` keep design authority.
- `packages/ui/src/` owns browser behavior and public API metadata.
- The build combines that behavior, the canonical component styles and the
  maintained usage examples into the package and the complete copy
  distributions.
- The portal and Vue showcase consume those outputs and carry no second
  component implementation.

**Site chrome.** The portal is built from the components it documents. Chrome
uses the default `compact` density (D-038) and only canonical component classes: actions are
`.button` in one of the four tones, navigation is `.link`, calls to action are
`.link-standalone`. Forced states appear only inside specimens.

**Build lock.** UI builds keep stable entry paths under `.cache/ui-build` so
emitted bytes and implementation identities are reproducible. An exclusive
`.cache/ui-build.lock` serializes concurrent build and check processes; it is
released on success or a caught failure, and a wait longer than 60 seconds
fails. If a process is forcibly stopped, confirm no UI build is running before
removing its lock.

**Choices (D-025).** The shared `internal/choice.js` renderer draws single
comboboxes and multiple listboxes; the original select keeps FormData,
constraints, defaults and events. The package Select uses the renderer
directly; component compositions enhance their own bare controls. The public
`enhance/choice` entry watches only the application root you pass it, skips
controls owned by another j3w1 component and never moves the native select out
of its framework-owned DOM position. Destroy disconnects observers and
listeners and restores the native control and its label relationship. The Vue
application and portal use this public entry, with no separate dropdowns.

**Control styles.** The standalone `styles/controls.css` is generated from the
same canonical `site/src/styles/themed-controls.css` that component and copy
distributions use. It is separate because component styles are scoped to their
custom-element tag, while application enhancement is scoped to
`data-j3w1-controls`. Generic control chrome sits behind that enhancement
boundary, so importing component reference CSS cannot change unrelated native
specimens, forced-state examples or standalone recipes. Historical specimen and
private comparison rendering resolve this CSS closure from the selected Git
revision; relative imports stay inside that revision's style tree, and
external, missing, cyclic and escaping dependencies fail closed.

**Specimens.** State matrices, preview routes, recipes and the workbench share one parsed renderer:
`scripts/lib/specimen-markup.mjs` for native state attributes and hidden-cell focus, and
`scripts/lib/markup.mjs` for ID-reference rewriting. `site/workbench.json` binds controls to
specimen parts under the closed choices in `schemas/playground.mjs`. Add bindings and coverage
there; never write another specimen implementation.

**Inventory.** The inventory is the finite list in `spec/inventory.json`.
Package generation fails if an entry has no canonical contract or
implementation mapping. Contract maturity stays separate from implementation
and verification status; productization does not approve pending decisions.

## Native content and lifecycle

Components use light DOM where native semantics, form ownership, static content
and composition benefit; each implementation manifest entry records the
reason. A field's input stays the successful native form control, and the
wrapper submits no duplicate hidden value. Labels, fieldsets, constraint
validation and reset keep browser behavior. Custom widgets implement their
complete canonical keyboard and accessibility contracts.

Registration:

- Class imports are separate from browser registration; each registration
  module includes its component dependencies, and the root registration module
  registers the complete catalogue on purpose.
- Registering again with the same constructor, or the identical generated
  implementation identity, is safe, including across independent copy
  directories. A different version or foreign definition is an error.
- The implementation identity hashes the component's definition and the exact
  emitted modules its class reaches, so it changes only when that runtime code
  changes.
- Server renderers import class definitions only when needed and register in
  the browser. Native child markup is the static and server-rendered content.

Lifecycle:

- Connected listeners use a connection-scoped AbortSignal. Disconnect aborts
  them and runs controller cleanup for timers, observers and document-level
  effects.
- Writable controller properties survive reconnection; properties set before
  upgrade are replayed after connection.
- Call `refresh()` after replacing a component's native child structure.
  Reactive changes to existing native children need no remount.

Properties change state without inventing user input events. Native input and
change events stay available; documented `j3w1-*` custom events bubble across
component boundaries with structured details. Navigation, persistence,
authorization and network services belong to the consuming application.

## Styles and complete copying

- Token CSS comes from the selected canonical profile; component styles from
  canonical CSS, shared inherited rules and maintained behavior selectors.
- Distribution selectors are scoped to the custom-element name. They keep real
  states and drop forced-state specimen selectors.
- Light DOM does not claim immunity to overriding host CSS. Semantic variables
  and anatomy classes are the documented extension points.

Per-component CSS includes transitive composition dependencies, and
per-component ESM the complete runtime dependency closure. The build parses
emitted imports with `es-module-lexer`, follows literal relative imports, and
rejects unbundled bare imports and non-literal dynamic dependencies;
import-like text in strings or comments is never a dependency.

Each copy directory contains runnable HTML, element markup, CSS, token CSS,
runtime modules, notices, instructions and file digests. The CLI checks every
selected file before creating a destination and refuses an existing
destination, unsafe paths and symlink destinations. Multi-component kits keep
complete standalone component directories. Consumers keep the required code
licenses and specimen attribution; shipping code next to prose does not
relicense it.

## Build and verification commands

1. `npm run ui:build` builds the package.
2. `npm run ui:pack` prepares its tarball.
3. `npm run ui:consumers` installs the packed package into independent
   temporary HTML, Vue, React and Astro applications that import public package
   paths only, compile declarations, build and run the installed copy CLI.
4. `npm run test:ui` runs the served artifacts in Chromium, Firefox and WebKit.

Source checks, generated drift checks, static build checks, browser execution,
packed installation, copying and release deployment are separate gates. Site
evidence is tied to the exact built specimen bytes; package evidence also
identifies the packed tarball and the external fixture bytes. Scripted fixtures
are reported apart from real agent-run acceptance, infrastructure alone is not
a release, and manual screen-reader and
physical-device results need their own recorded protocols.

## Payload budgets

| Measure | Cap |
| --- | --- |
| Initial Vue JavaScript | 64 KiB gzip |
| Initial portal JavaScript | 32 KiB gzip |
| Each lazy Vue chunk | 192 KiB gzip |
| Complete installable tarball | 2 MiB |

The distribution test follows static imports and keeps optional dynamic imports
separate. First measurements were about 46 KiB for the Vue entry and 140 KiB
for the lazily loaded form builder. These are transfer-size estimates, not a
claim about the static host's compression.

## Standards consulted

[Custom elements](https://html.spec.whatwg.org/multipage/custom-elements.html),
[form infrastructure](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html),
[Vue's custom-element integration](https://vuejs.org/guide/extras/web-components)
and the [APG keyboard guidance](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/).
They are living documents; the package's real browser evidence defines the
exercised compatibility.
