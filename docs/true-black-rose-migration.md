# True Black / Rose migration

The owner selected the exact locally reviewed candidate I and approved its
permanent adoption; D-023 records it. Version 1.0.0 follows the repository's
major-version rule for changing approved values.

| Semantic role | Previous value | Selected value |
| --- | --- | --- |
| color.surface.canvas | #0c0909 | #000000 |
| color.surface.sunken | #0a0707 | #000000 |
| color.surface.input | #0c0909 | #000000 |
| color.surface.code | #0c0909 | #000000 |
| color.surface.terminal | #0c0909 | #000000 |
| color.surface.chrome | #100909 | #090707 |
| color.surface.default | #160b0b | #100c0c |

The later owner-requested link change (D-024) moves `color.text.link` from
`#ffa2a7` to the existing strong red `#f73f35`. Visited links keep that color;
persistent underlines and near-white hover text mark navigation. The heritage
profile keeps the previous link assignment.

All other token values are unchanged: rose body text, pink headings, white
prose, red borders/actions/focus/selection, and the status, chart, code and
terminal assignments stay as reviewed. `color.code.bg` and `color.terminal.bg`
keep their original assignments; do not confuse them with `color.surface.code`
and `color.surface.terminal`. The heritage profile keeps its prior surface
assignments.

## Update a consumer

1. Update your one immutable source pin.
2. Regenerate your mapped CSS or native artifacts.
3. Inspect the real background/foreground relationships.
4. Rerun your integration checks.

Do not overwrite user customization or silently edit another repository. Native
import verification and manual accessibility records apply only to their
recorded source and artifact digests.

The change adds two primitives for the selected chrome and panel values.
Applications still consume semantic roles, never these primitive keys. This
change approves no pending decision outside the selected foundation.

The portal replaces the long homepage; the full static state reference is now
`/theme/reference/`. Old homepage hashes move there with JavaScript, and the
static full-reference link works without it. The Vue demo uses
`/theme/demo/#/...` so direct links work on GitHub Pages.

The new package and complete copy bundles implement all 67 inventory entries.
Existing mappings and lock formats still work. When you adopt the package:

1. Install one exact version.
2. Update its tokens and component styles together.
3. Review the full dependency closure when you replace copied source.

The CLI refuses to overwrite an old copy. Create a fresh directory and merge
your application changes by hand.
