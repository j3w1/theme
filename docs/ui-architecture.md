# Official web implementation architecture

Status: all 67 inventory entries, copy distributions, the static portal and Vue
showcase are implemented. This document describes architecture; consult the
separate delivery and execution records for actual acceptance and deployment.

## Ownership

`tokens/` and `spec/` retain design authority. `packages/ui/src/` owns browser
behavior and public API metadata. The build combines that maintained behavior,
canonical component styles and maintained usage examples into the package and
complete copy distributions. The portal and Vue showcase consume those outputs.
They do not carry another component implementation.

The inventory remains the finite list in `spec/inventory.json`. Package generation
fails if an entry has no canonical contract or implementation mapping. Existing
contract maturity remains distinct from implementation and verification status;
productization does not silently approve pending design decisions.

## Native content and lifecycle

Components use light DOM where native semantics, form ownership, static content
and composition benefit from it. Each implementation manifest entry records the
specific reason. A field's input remains the successful native form control;
the wrapper does not submit a duplicate hidden value. Labels, fieldsets,
constraint validation and reset continue to use browser behavior. Custom widgets
must implement their complete canonical keyboard and accessibility contracts.

Class imports are separate from browser registration. Individual registration
modules include their component dependencies. Repeating registration with the
same constructor or identical generated implementation identity is safe, including
independent copy directories. A different version or foreign definition is an error. Importing
the root registration module deliberately registers the complete catalogue.
Server renderers import class definitions only when needed and register in the
browser. Native child markup is the static and server-rendered content.

Connected listeners use a connection-scoped AbortSignal. Disconnect aborts them
and invokes controller cleanup for timers, observers and document-level effects.
Writable controller properties survive reconnection. Properties assigned before
custom-element upgrade are replayed after connection. `refresh()` is the explicit
operation after replacing a component's native child structure; reactive changes
to existing native children do not require remounting the whole component.

Properties change state without inventing user input events. Native input/change
events remain available. Documented `j3w1-*` custom events bubble across component
boundaries and carry structured details. Application navigation, persistence,
authorization and network services belong to the consuming application.

## Styles and complete copying

Token CSS derives from the selected canonical profile. Component styles derive
from canonical CSS, shared inherited rules and maintained behavior selectors.
Distribution selectors are scoped to the custom-element name. They retain real
states while excluding forced-state specimen selectors. Light DOM is intentional;
it does not claim immunity to overriding host CSS. Semantic variables and anatomy
classes are documented extension points.

Per-component CSS includes transitive composition dependencies. Per-component ESM
includes the complete runtime dependency closure. The build parses emitted module
imports with `es-module-lexer`, follows literal relative imports and rejects
unbundled bare imports or non-literal dynamic dependencies. Documentation strings
and comments cannot accidentally become dependencies.

Each copy directory contains runnable HTML, element markup, CSS, token CSS,
runtime modules, notices, instructions and file digests. The CLI verifies every
selected file before creating a destination. It refuses an existing destination,
unsafe paths and symlink destinations. Multi-component kits retain complete
standalone component directories. Consumers keep required code licenses and
specimen attribution; distributing code alongside prose does not relicense it.

## Build and verification commands

The workspace uses Node 24 and npm. `npm run ui:build` builds the package;
`npm run ui:pack` prepares its tarball. Generated outputs are checked for drift,
including orphaned files. These commands require the complete implementation
catalogue and maintained examples; infrastructure alone is not a release.

`npm run ui:consumers` packs the actual package and installs it into independent
temporary HTML, Vue, React and Astro applications. Those fixtures import public
package paths, compile declarations, build their applications and run the
installed copy CLI. They have no workspace source imports. `npm run test:ui`
then exercises the served artifacts in Chromium, Firefox and WebKit. Passing
scripted fixtures is reported separately from actual agent-run acceptance.

Source checks, generated drift checks, static build checks, browser execution,
packed installation, copying and release deployment are distinct gates. The
existing revision-aware site evidence remains tied to exact built specimen
bytes. Package evidence also identifies the packed tarball and external fixture
bytes. Manual screen-reader and physical-device results require their own
recorded protocols; automated browser runs do not establish those results.

## Payload budgets

Distribution checks cap initial Vue JavaScript at 64 KiB gzip, initial portal
JavaScript at 32 KiB gzip, each lazy Vue chunk at 192 KiB gzip, and the complete
installable tarball at 2 MiB. Initial measurements were about 46 KiB for the Vue
entry and 140 KiB for the lazily loaded bounded form builder; the builder includes
its schema and HTML-parsing dependencies. These are transfer-size estimates,
not a claim that the static host enables a particular compression setting.
The test follows static imports while keeping optional dynamic imports separate.
Per-component imports avoid loading the full catalogue on ordinary pages.

## Standards consulted

The implementation uses the native form and custom-element platform contracts:
[custom elements](https://html.spec.whatwg.org/multipage/custom-elements.html),
[form infrastructure](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html),
and [Vue's custom-element integration](https://vuejs.org/guide/extras/web-components).
Custom widgets follow their canonical component specification and the linked
[APG keyboard guidance](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/).
Living documents were consulted during implementation; the package's actual
browser evidence defines exercised compatibility.
