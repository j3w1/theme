---
id: figma-bridge
title: Figma Variables bridge
order: 146
summary: A one-way, pinned Variables API bridge with explicit diffs and external ownership receipts.
---

## Supported mapping

This independently written bridge maps sRGB colors to COLOR variables and
scalar px spacing/radius to FLOAT variables.

- Aliases stay native variable aliases.
- Token paths are stable identities. Slash-separated names live in the
  j3w1/theme/default/v1 collection.
- Alias primitives are dependencies with empty property scopes, not newly
  approved application roles.
- Semantic scopes are specific to text, fills, strokes, gaps and corner radius.
- Eligibility and pending decision IDs travel with each definition.

Only the approved default profile is imported. Heritage and proposed profiles
are reported, never turned into extra modes. Typography, shadows, composite
borders and other unsupported types are reported, not flattened. Figma does
not import this JSON natively: the adapter uses the
[Variables Plugin API](https://developers.figma.com/docs/plugins/api/figma-variables/).
Install the font families named in the pinned typography tokens yourself; this
bridge neither imports fonts nor distributes binaries.

## Generate a pinned payload

In a verified checkout, run:

```sh
node scripts/figma-bridge.mjs --ref FULL_COMMIT_OR_RELEASE_TAG > payload.json
```

The default sample selects color.surface.default, color.text.default, space.4
and radius.none, plus their two alias dependencies. Pass `--roles` with an
explicit comma-separated list of roles to change the sample. The command reads
Git objects at the resolved full revision. It records source and payload
digests, the mapping version, unsupported items and excluded profiles. It
never reads moving branch bytes or uses the working tree instead.

## Reviewed import route

Use the Figma connector's `use_figma` Variables API route, in a new design
draft or in an existing collection whose current receipt you still hold. Read
the connector's current skill/API instructions first. The adapter is
[exports/figma/importer.mjs](https://j3w1.github.io/theme/exports/figma/importer.mjs); pin its download to
the same reviewed delivery revision as these instructions.

1. Load the module's function in the connector script (remove only the
   ES-module `export` keyword), then return the awaited call:

   ```js
   return await importFigmaVariables(figma, {
     payload, receipt: null, documentKey, action: "dry-run"
   });
   ```

2. Pass the locally generated payload and the exact target file key as
   explicit inputs.
3. Inspect the returned diff. Dry-run only reads.
4. Call again with `action: "apply"`, only for the reviewed change.
5. Keep the whole returned receipt outside the document and the repository.
   Every later dry-run and apply must pass that receipt and the same document
   key.

An exact re-import changes nothing. Updates show before/after definitions.
Owned variables left out of a payload are kept and reported, never silently
removed. Receipts are trusted local ownership records, not importable
third-party configuration.

Limits of this route:

- at most eight variables, dependencies included, per namespace; one
  collection; one default mode — small enough for one incremental connector
  operation. Larger payloads fail before anything changes;
- apply and rollback need the connector's atomic script execution; this
  module is not a standalone plugin transaction manager;
- no team publishing permission or paid plan capability is assumed;
- permission, mode and API errors stay failures.

## Rollback and conflicts

To undo the most recent apply, call with `action: "rollback"` and the current
receipt.

- Existing variables get back their exact recorded values and metadata.
- New variables are removed in reverse dependency order.
- The result returns the previous receipt. Keep it for another rollback or a
  later import.
- A newly created collection is removed only when it holds no unrelated
  variables.
- Rollback refuses to remove a variable that a kept variable in any local
  collection still references. Check any canvas bindings you added after the
  import before you roll back; this adapter does not audit every canvas node.

Before any change, the adapter compares every owned ID, value, description,
scope, collection identity and mode against the receipt. Missing, detached or
hand-edited variables stop apply and rollback. It never adopts a matching name
without a receipt. Resolve a conflict on purpose in Figma, or create a
separate draft; do not throw away ownership records to force an overwrite.

## Actual verification status

A real six-variable sample was imported through the connector into a new
design draft, with Starter/Full access and Plugin API 1.0.0.

- Alias IDs matched. Spacing and radius matched exactly.
- Color channels matched the exact float32 form of the source channels, with
  no tolerance.
- An exact re-import changed no IDs.
- A separately previewed spacing addition was applied and rolled back.
- A deliberate manual edit was rejected without being overwritten; the test
  edit was then explicitly restored.

Private receipts stay outside public artifacts. The issue evidence records the
exact candidate and source revision.

Source protocols also cover detached IDs, value updates, first rollback,
unrelated variables, invalid payloads and extra modes, using an explicit API
fixture. Those are fixture results, not claims about more account
capabilities. No full component kit, native port, library publication, manual
design review, or automatic Figma-to-token sync is claimed. D-019 remains
proposed.
