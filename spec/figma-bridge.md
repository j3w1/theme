---
id: figma-bridge
title: Figma Variables bridge
order: 146
summary: A one-way, pinned Variables API bridge with explicit diffs and external ownership receipts.
---

## Supported mapping

This independently authored bridge maps sRGB colors to COLOR variables and
scalar px spacing/radius to FLOAT variables. Aliases remain native variable
aliases. Token paths are stable identities; slash-separated names live in the
j3w1/theme/default/v1 collection. Alias primitives are dependencies with empty
property scopes, not newly approved application roles. Semantic scopes are
specific to text, fills, strokes, gaps and corner radius. Eligibility and pending
decision IDs travel with each definition.

Only the approved default profile is imported. Heritage and proposed profiles
are reported, never converted into extra modes. Typography, shadows, composite
borders and other unsupported types are reported without flattening. Figma
does not natively import this JSON: the adapter uses the
[Variables Plugin API](https://developers.figma.com/docs/plugins/api/figma-variables/).
Install the font families named in the pinned typography tokens independently;
this bridge neither imports fonts nor distributes binaries.

## Generate a pinned payload

In a verified checkout, run:

```sh
node scripts/figma-bridge.mjs --ref FULL_COMMIT_OR_RELEASE_TAG > payload.json
```

The default sample selects color.surface.default, color.text.default, space.4
and radius.none, plus their two alias dependencies. Use `--roles` with an
explicit comma-separated role selection to change the sample. The command
reads Git objects at the resolved full revision and records source and payload
digests, mapping version, unsupported items and excluded profiles. It never
reads moving branch bytes or substitutes the working tree.

## Reviewed import route

Use the Figma connector's `use_figma` Variables API route in a new design draft
or an existing collection for which you retain the current receipt. Read the
connector's current skill/API instructions first. The actual adapter is
[exports/figma/importer.mjs](https://j3w1.github.io/theme/exports/figma/importer.mjs); pin its download to
the same reviewed delivery revision as these instructions.

Load the module's function in the connector script (remove only the ES-module
`export` keyword), then return the awaited call:

```js
return await importFigmaVariables(figma, {
  payload, receipt: null, documentKey, action: "dry-run"
});
```

Supply the locally generated payload and exact target file key as explicit
inputs. Inspect the returned diff. Dry-run performs reads only. Invoke again
with `action: "apply"` only for the reviewed change. Preserve the entire
returned receipt outside the document and repository. Subsequent dry-runs and
applies must supply that receipt and the same document key. An exact re-import
is a no-op. Updates show before/after definitions; omitted owned variables are
retained and reported, never silently removed. These receipts are trusted
local ownership records, not importable third-party configuration.

This reviewed route is bounded to eight variables including dependencies per
namespace, one collection and one default mode, fitting an incremental
connector operation. Larger payloads fail before mutation. The connector's
atomic script execution is required for apply/rollback; this module is not a
standalone plugin transaction manager. No team publishing permission or paid
plan capability is assumed. Permission, mode and API errors remain failures.

## Rollback and conflicts

Use `action: "rollback"` with the current receipt to undo its most recent
apply. Existing variables regain their exact recorded values and metadata;
new variables are removed in reverse dependency order. The result returns the
previous receipt. A newly created collection is removed only when it contains
no unrelated variables. Preserve the returned previous receipt for another
rollback or subsequent import.

Rollback also refuses to remove a variable referenced by a retained variable
in any local collection. Inspect any canvas bindings you added after import
before requesting rollback; this adapter does not audit every canvas node.

Before any mutation the adapter compares all owned IDs, values, descriptions,
scopes, collection identity and mode against the receipt. Missing, detached or
manually edited variables stop apply and rollback. It never adopts a matching
name without a receipt. Resolve the conflict deliberately in Figma or create a
separate draft; do not discard ownership records to force an overwrite.

## Actual verification status

A real six-variable sample was imported through the connector in a new design
draft with Starter/Full access and Plugin API 1.0.0. Actual alias IDs matched;
spacing and radius matched exactly. Color channels matched the exact float32
representation of the source channels, with no tolerance. Exact re-import
changed no IDs. A separately previewed spacing addition was applied and rolled
back. A deliberate manual edit was rejected without overwriting the edit, then
the test edit was explicitly restored. Private receipts remain outside public
artifacts. The issue evidence records the exact candidate and source revision.

Source protocols also cover detached IDs, value updates, initial rollback,
unrelated variables, invalid payloads and extra modes using an explicit API
fixture. Those are fixture results, not additional account capability claims.
No full component kit, native port, library publication, manual design review,
or automatic Figma-to-token synchronization is claimed. D-019 remains proposed.
