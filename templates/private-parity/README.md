# Private framework parity protocol

This independently authored harness compares button, text field, select,
checkbox, tabs, dialog and table against the maintained native specimens.
It is a bounded diagnostic experiment, not an application integration or a
claim that framework controls conform in every state.

## Prerequisites

Supply an operator-owned licensed template checkout with installed Vue,
Vuetify and Vite dependencies. The initial adapter supports a pnpm lock with
exact root dependency versions. The template version, installed versions,
package declarations and lock entries must agree. Review the applicable
license separately; never supply a purchase code or credentials. The harness
does not interpret a purchase certificate as redistribution permission.

The JSON configuration belongs outside this repository and every Git
checkout. It follows `schemas/json/private-parity.schema.json`:

- `target`: absolute licensed checkout path, read-only.
- `out`: new private directory under an existing real parent, outside both
  checkouts and outside any Git repository. No destination is replaced.
- `themeRef`: full commit or release tag; the default profile must be approved.
- `templateVersion`: selected actual package version.
- `license`: `type` (regular or extended), a non-secret terms/document
  `reference`, and `reviewed: true` only after the operator's review.
- `lock`: target-relative pnpm lock path.
- `sources`: explicit `from` / `to` script/style files or directories.
  Directories are copied recursively, refusing other file types and redirected
  paths. Select only the host defaults and required style dependency closure.
  Neither application data nor font/image assets belong in this selection.
- `defaults` and `styles`: copied paths relative to the private `host/`
  directory. Defaults must be a default-exported framework defaults object.
- `aliases`: host style import aliases mapped to copied `host/` paths.

The independent fixture loads actual host defaults/styles and installed
framework packages. Vite's root and cache are private; no target application
scripts, backend, account connection or environment file is executed.
The browser server listens on loopback and browser requests stay at that
origin. Selected source files are rehashed after capture to detect mutation.

## Results and limits

No configuration produces a prerequisite record with result `not run`.
Invalid prerequisites never produce passing execution evidence. Successful
execution writes private `metadata.json`, `report.json` and `captures/`.
Records identify the theme revision/profile, template and framework versions,
dependency/package hashes, exact copied input and native specimen hashes,
fixture identity, browser/OS/viewport/density/motion settings, observed focus,
computed properties and capture hashes.

Default and representative focus, disabled, invalid, checked or selected
states are selected only when the canonical component declares them. Native
forced visual states and actual host props are labeled separately. The
fixture maps primary/on-primary, surface/background/default text and error
colors to existing roles; geometry, widget structure, state layers and focus
implementation remain inherited for diagnosis. Comparisons use exact measured
values without a tolerance. Font-family mismatches are environmental limits.
The intentional-mismatch source regression proves detection logic, not a
licensed target import.

The native renderer retains its source structure and helper prose. Host
labels, options, rows and actions are parsed from those same maintained
synthetic specimens; application data is never loaded. Screenshots are scoped to
the measured controls. Different host structures or helper scaffolding can
produce expected differences and are not silently corrected. Complete keyboard
lifecycle, screen-reader and application-chrome conformance remain unverified.
Inspect every record before making a narrower compatibility claim.

Keep all output private, including build errors, vendor source and screenshots.
No harness output is discovered by public generation, Actions or Pages.
Public summaries require separate content and license review.
