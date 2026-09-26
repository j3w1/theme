# Official web implementation architecture

Status: all 67 inventory entries, copy distributions, the static portal and Vue
showcase are implemented. This document describes the architecture. Actual
acceptance and deployment are in the separate delivery and execution records.

## Ownership

- `tokens/` and `spec/` keep design authority.
- `packages/ui/src/` owns browser behavior and public API metadata.
- The build combines that behavior, the canonical component styles and the
  maintained usage examples into the package and the complete copy
  distributions.
- The portal and Vue showcase consume those outputs. They carry no second
  component implementation.

**Choices (D-025).** Theme-rendered choices are the default web implementation.
The shared `internal/choice.js` renderer draws single comboboxes and multiple
listboxes. The original select keeps FormData, constraints, defaults and events.

- The package Select uses the renderer directly; component compositions enhance
  their own bare controls.
- The public `enhance/choice` entry watches only the application root you pass
  it, and skips controls owned by another j3w1 component. It never moves the
  native select out of its framework-owned DOM position.
- Destroy disconnects observers and listeners and restores the native control
  and its label relationship.
- The Vue application and portal use this public entry; they keep no separate
  dropdown implementations. Native no-JavaScript fallbacks stay visible.

**Control styles.** The standalone `styles/controls.css` is generated from the
same canonical `site/src/styles/themed-controls.css` that component and copy
distributions use. It is separate because component styles are scoped to their
custom-element tag, while application enhancement is scoped to
`data-j3w1-controls`. The canonical stylesheet also puts generic control chrome
behind that enhancement boundary, so importing component reference CSS cannot
change unrelated native specimens, forced-state examples or standalone recipes.

Historical specimen and private comparison rendering resolve this CSS closure
from the selected Git revision, then apply the existing resource and behavior
checks. Relative imports stay inside that revision's style tree. External,
missing, cyclic and escaping dependencies fail closed.

**Inventory.** The inventory is the finite list in `spec/inventory.json`. Package
generation fails if an entry has no canonical contract or implementation
mapping. Contract maturity stays separate from implementation and verification
status; productization does not quietly approve pending design decisions.

## Native content and lifecycle

Components use light DOM where native semantics, form ownership, static content
and composition benefit. Each implementation manifest entry records the reason.

- A field's input stays the successful native form control; the wrapper submits
  no duplicate hidden value.
- Labels, fieldsets, constraint validation and reset keep browser behavior.
- Custom widgets must implement their complete canonical keyboard and accessibility
  contracts.

Registration:

- Class imports are separate from browser registration.
- Each registration module includes its component dependencies.
- Registering again with the same constructor, or the identical generated
  implementation identity, is safe, including across independent copy
  directories. A different version or foreign definition is an error.
- The implementation identity hashes the component's definition and the exact
  emitted modules its class reaches, so it changes only when that runtime code
  changes.
- The root registration module registers the complete catalogue on purpose.
- Server renderers import class definitions only when needed and register in
  the browser. Native child markup is the static and server-rendered content.

Lifecycle:

- Connected listeners use a connection-scoped AbortSignal. Disconnect aborts
  them and runs controller cleanup for timers, observers and document-level
  effects.
- Writable controller properties survive reconnection. Properties set before
  custom-element upgrade are replayed after connection.
- Call `refresh()` after replacing a component's native child structure.
  Reactive changes to existing native children need no remount.

Properties change state without inventing user input events. Native input and
change events stay available. Documented `j3w1-*` custom events bubble across
component boundaries and carry structured details. Navigation, persistence,
authorization and network services belong to the consuming application.

## Styles and complete copying

- Token CSS comes from the selected canonical profile.
- Component styles come from canonical CSS, shared inherited rules and
  maintained behavior selectors.
- Distribution selectors are scoped to the custom-element name. They keep real
  states and drop forced-state specimen selectors.
- Light DOM is intentional; it does not claim immunity to overriding host CSS.
  Semantic variables and anatomy classes are the documented extension points.

Per-component CSS includes transitive composition dependencies. Per-component
ESM includes the complete runtime dependency closure. The build parses emitted
module imports with `es-module-lexer`, follows literal relative imports, and
rejects unbundled bare imports and non-literal dynamic dependencies. Import-like
text inside strings or comments cannot become a dependency by accident.

Each copy directory contains runnable HTML, element markup, CSS, token CSS,
runtime modules, notices, instructions and file digests.

- The CLI checks every selected file before creating a destination.
- It refuses an existing destination, unsafe paths and symlink destinations.
- Multi-component kits keep complete standalone component directories.
- Consumers keep the required code licenses and specimen attribution; shipping
  code next to prose does not relicense it.

## Build and verification commands

The workspace uses Node 24 and npm.

1. `npm run ui:build` builds the package.
2. `npm run ui:pack` prepares its tarball.
3. `npm run ui:consumers` packs the real package and installs it into
   independent temporary HTML, Vue, React and Astro applications. They import
   public package paths, compile declarations, build their applications and run
   the installed copy CLI. They have no workspace source imports.
4. `npm run test:ui` runs the served artifacts in Chromium, Firefox and WebKit.

Generated outputs are checked for drift, including orphaned files. These
commands need the complete implementation catalogue and maintained examples;
infrastructure alone is not a release. Passing scripted fixtures is reported
separately from real agent-run acceptance.

Source checks, generated drift checks, static build checks, browser execution,
packed installation, copying and release deployment are separate gates. Site
evidence stays tied to the exact built specimen bytes. Package evidence also
identifies the packed tarball and the external fixture bytes. Manual
screen-reader and physical-device results need their own recorded protocols;
automated browser runs do not establish them.

## Payload budgets

Distribution checks cap these sizes:

| Measure | Cap |
| --- | --- |
| Initial Vue JavaScript | 64 KiB gzip |
| Initial portal JavaScript | 32 KiB gzip |
| Each lazy Vue chunk | 192 KiB gzip |
| Complete installable tarball | 2 MiB |

First measurements were about 46 KiB for the Vue entry and 140 KiB for the
lazily loaded bounded form builder, which includes its schema and HTML-parsing
dependencies. These are transfer-size estimates, not a claim that the static
host enables a particular compression setting. The test follows static imports
and keeps optional dynamic imports separate. Per-component imports avoid loading
the full catalogue on ordinary pages.

## Standards consulted

The implementation uses the native form and custom-element platform contracts:
[custom elements](https://html.spec.whatwg.org/multipage/custom-elements.html),
[form infrastructure](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html),
and [Vue's custom-element integration](https://vuejs.org/guide/extras/web-components).
Custom widgets follow their canonical component specification and the linked
[APG keyboard guidance](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/).
These are living documents consulted during implementation; the package's real
browser evidence defines the exercised compatibility.
