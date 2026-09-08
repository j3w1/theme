# True Black / Rose migration

The owner selected the exact locally reviewed candidate I and authorized its
permanent adoption. D-023 records the approval. Version 1.0.0 follows the
repository's major-version rule for changing approved values.

| Semantic role | Previous value | Selected value |
| --- | --- | --- |
| color.surface.canvas | #0c0909 | #000000 |
| color.surface.sunken | #0a0707 | #000000 |
| color.surface.input | #0c0909 | #000000 |
| color.surface.code | #0c0909 | #000000 |
| color.surface.terminal | #0c0909 | #000000 |
| color.surface.chrome | #100909 | #090707 |
| color.surface.default | #160b0b | #100c0c |

The subsequent owner-requested link refinement (D-024) changes `color.text.link`
from `#ffa2a7` to the existing strong red `#f73f35`. Visited links retain that
color; persistent underlines and near-white hover text distinguish navigation.
The heritage profile explicitly retains the previous link assignment.

Other existing token values remain unchanged. In particular, rose body
text, pink headings, white prose, red borders/actions/focus/selection, status,
chart, code and terminal semantic assignments remain as reviewed. The distinct
`color.code.bg` and `color.terminal.bg` roles retain their original assignments;
do not confuse them with `color.surface.code` and `color.surface.terminal`.
The complete heritage profile explicitly retains its prior surface assignments.

Consumers must update one immutable source pin, regenerate their mapped CSS or
native artifacts, inspect actual background/foreground relationships and rerun
their integration checks. Do not overwrite user customization or silently edit
another repository. Native import verification and manual accessibility records
remain specific to their recorded source and artifact digests.

The change adds two primitives to represent the selected chrome and panel values.
Applications continue to consume semantic roles, never these primitive keys.
No pending decision outside this selected foundation is approved by this change.

The portal replaces the long homepage; the full static state reference is now
`/theme/reference/`. Existing homepage hashes migrate there with JavaScript,
and the static full-reference link supports readers without it. The Vue demo
uses `/theme/demo/#/...` so direct links work on GitHub Pages.

The new package and complete copy bundles implement all 67 inventory entries.
Existing mappings and lock formats remain supported. Install one exact version,
update its tokens and component styles together, and review the full dependency
closure when replacing copied source. The CLI refuses to overwrite an old copy;
create a fresh directory and merge your application changes deliberately.
