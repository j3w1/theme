# True Black / Rose migration

Version 1.0.0 adopts the owner-selected candidate I (D-023), a major version
under the rule for changing approved values. Seven surfaces change; the
heritage profile keeps its prior surface assignments.

| Semantic role | Previous value | Selected value |
| --- | --- | --- |
| color.surface.canvas | #0c0909 | #000000 |
| color.surface.sunken | #0a0707 | #000000 |
| color.surface.input | #0c0909 | #000000 |
| color.surface.code | #0c0909 | #000000 |
| color.surface.terminal | #0c0909 | #000000 |
| color.surface.chrome | #100909 | #090707 |
| color.surface.default | #160b0b | #100c0c |

`color.code.bg` and `color.terminal.bg` keep their original assignments; do not
confuse them with `color.surface.code` and `color.surface.terminal`. Two new
primitives hold the chrome and panel values; applications still consume
semantic roles, never primitive keys. In the same release `color.text.link`
moved from `#ffa2a7` to strong red `#f73f35` (D-024); the heritage profile keeps
the previous link. Later releases changed more roles: see D-026, D-027 and
D-033 and the [rose typography migration](rose-typography-migration.md).

## Update a consumer

1. Update your one immutable source pin.
2. Regenerate your mapped CSS or native artifacts.
3. Inspect the real background/foreground relationships.
4. Rerun your integration checks.

Do not overwrite user customization or silently edit another repository. Native
import verification and manual accessibility records apply only to their
recorded source and artifact digests.

## Package and site changes in 1.0.0

The package and complete copy bundles implement all 67 inventory entries;
existing mappings and lock formats still work. When you adopt them, install one
exact version, update its tokens and component styles together, and review the
full dependency closure when you replace copied source. The CLI refuses to
overwrite an old copy: create a fresh directory and merge your application
changes by hand.

The portal replaces the long homepage; the full static reference is
`/theme/reference/`. Old homepage hashes move there with JavaScript, and the
static full-reference link works without it. The Vue demo uses
`/theme/demo/#/...` so direct links work on GitHub Pages.
