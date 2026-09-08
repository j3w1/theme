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

All other existing token values remain unchanged. In particular, rose body
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
