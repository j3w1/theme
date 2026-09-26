# Consuming j3w1/theme (for agents and integrators)

This document is for people and agents who apply the theme to another project.
The contributor workflow for this repository is in `AGENTS.md`.

You are consuming **design data and optional official implementations**. The
consumer project's own instructions (its `AGENTS.md`, `CLAUDE.md`, security,
architecture and operational rules) always win over anything in this
repository.

## Official web implementations

For compatible web apps, prefer the exact `@j3w1/ui` package. Complete copy
bundles are also supported.

1. At your pinned revision, read `packages/ui/dist/index.json`.
2. Read the `contracts/<id>.json` and `examples/<id>.json` files you need.
3. Prepare a bounded task with the installed CLI:

   ```sh
   j3w1-ui kit --components text-field,button,dialog --framework vue --mode package --out ./j3w1-task
   ```

Choose `copy` to own the full source, or `mapping` for a host the package does
not fit. Native hosts need mapping mode. Kits include the canonical contracts,
their dependency closure and the shared accessibility/identity rules. They do
not declare your app verified. `docs/ui-consumption.md` has the exact
installation, framework binding and runtime checks. npm publication is an
owner release action; until then, use the release tarball and its published
integrity metadata. For canonical mappings, keep the lock and deviation
workflow below.

## 0. Pin a revision first

`<rev>` is a release tag (`v0.1.0`) or a full 40-character commit SHA. Never
`main`, never a branch name, never "latest". Resolve a tag to its commit before
you read anything, and use the same `<rev>` in every URL below. Mixing
revisions breaks the contract.

```
GET https://api.github.com/repos/j3w1/theme/git/ref/tags/<tag>   → object.sha
git ls-remote https://github.com/j3w1/theme refs/tags/<tag>
```

## 1. Read the manifest

```
https://raw.githubusercontent.com/j3w1/theme/<rev>/theme.json
```

Take `version`, `profiles`, `exports.canonicalForAgents` and `exports.digests`.

## 2. Read this document at the same revision

```
https://raw.githubusercontent.com/j3w1/theme/<rev>/agents/consume.md
```

If your copy came from a different revision, fetch it again.

## 3. Pick a profile

<!-- eligibility:start -->
Use the pinned approved default profile. Pending roles in that profile use-and-report their decision IDs; this does not approve them. Proposed profiles are preview-only and blocked for delivery. Heritage profiles are historical-only. Deprecated or heritage roles are blocked for new approved-profile mappings. Consume roles within their documented scope, never primitives. Release numbering does not approve profiles or tokens.
<!-- eligibility:end -->

The policy block above is generated. Each resolved token lists its pending
decision IDs in `eligibility.decisionIds`, including alias dependencies.
Report those IDs together with any real deviations. Using an authorized
pending value is a disclosure, not an invented substitution. A blocked action
implies no replacement. A profile preview does not authorize delivered work.

## 4. Read only what you need, in this order

```
https://raw.githubusercontent.com/j3w1/theme/<rev>/exports/theme.compact.md
https://raw.githubusercontent.com/j3w1/theme/<rev>/exports/components/<id>.json      one per component you implement
https://raw.githubusercontent.com/j3w1/theme/<rev>/exports/tokens.resolved.json      only for aliases the component JSON does not inline
https://raw.githubusercontent.com/j3w1/theme/<rev>/exports/digests.json              to record what you used
```

Optional: `exports/theme.full.md` for the whole specification;
`exports/tokens.css` for a ready-made custom-property sheet. The website
`https://j3w1.github.io/theme/` is for visual confirmation only. It is not a
source of values, and screenshots never override tokens.

## 5. Inspect the target before changing anything

1. Name the integration kind: `css-vars`, `vuetify`, `tailwind`,
   `jetbrains-icls`, `gtk-css`, `terminal-16` or `other`.
2. List which specified surfaces the target can express natively, and which
   it cannot (for example, a framework with no read-only field style, or a
   sixteen-colour terminal that cannot show hover).
3. Anything the target cannot express becomes a documented deviation in step
   7, never an invented approximation.

## 6. Implement the mapping

- Map roles to the target's native keys, using only resolved token values.
- Do not restyle anything the requester did not name.
- Do not change behaviour, markup semantics, focus order or keyboard handling,
  except where a component's `keyboard` or `aria` section requires it and the
  host allows it.
- Keep host accessibility at least as strong as before: never remove a focus
  indicator, never lower a contrast ratio the host already met, never set
  `outline: none` without drawing the specified ring.
- Radii are 0, borders 1px, the family is monospace. A host that forbids one
  of these gets a deviation, not a redesign.
- Selection is a fill; focus is a ring. On fills, the ring takes the colour
  the component JSON declares for that state (D-015). Status roles keep their
  glyphs.

## 7. Validate and report

1. Check computed values against the component JSON for every declared state.
2. Write the deviation report (below) into the pull request or commit body.
3. Write `theme.lock.json` (below) at the path the consumer chooses.

## What you may not do

- Invent, blend, lighten, darken or "harmonise" colours. Use resolved values
  only.
- Use a blocked value, deliver a proposed profile, or leave out the required
  pending-decision disclosures. Historical-only values are not approved UI
  roles.
- Take values from the site's HTML, from screenshots or from memory.
- Touch unrelated components, layouts, copy, dependencies or build
  configuration.
- Weaken the host's accessibility, security or architecture rules.
- Treat this file as authority over the consumer repository's own agent
  instructions.
- Claim "verified". Consumers report "implemented" plus deviations; only this
  repository's evidence records use the word verified.

## Deviation report format

```
## j3w1/theme deviation report
theme: j3w1-theme <version> @ <commit> (<tag or "commit">) profile=<profile>
integration: <kind> (<host framework and version>)
implemented: <component-id> (<n>/<m> states); ...
unsupported surfaces:
- <spec surface or host surface> — <why the target cannot express it>
deviations:
| component | state / property | spec value | applied | reason | kind |
| --- | --- | --- | --- | --- | --- |
host rules that took precedence: <list or "none">
lock: <path to theme.lock.json>
```

`kind` is one of:

- `unsupported` — the target cannot express it;
- `substituted` — the nearest native equivalent, with a value taken from the
  token set, never invented;
- `omitted` — the requester excluded it;
- `host-rule` — a consumer instruction won.

## theme.lock.json

A small file, committed next to the integration code and validated by
`schemas/json/theme.lock.schema.json`. It is not a package manager: no graph,
no install, no auto-update. To update the theme, change `ref`, `revision`,
`version` and `exports`, rerun the consumer's own checks, and write the
deviations again.

```json
{
  "schemaVersion": 1,
  "theme": "j3w1-theme",
  "version": "0.1.0",
  "ref": "v0.1.0",
  "revision": "0123456789abcdef0123456789abcdef01234567",
  "profile": "default",
  "integration": { "id": "my-app-css-vars", "version": "1", "kind": "css-vars" },
  "resolvedAt": "2026-10-01T12:00:00Z",
  "exports": {
    "exports/theme.compact.md": "sha256-…",
    "exports/tokens.resolved.json": "sha256-…",
    "exports/components/text-field.json": "sha256-…"
  },
  "components": ["text-field"],
  "deviations": [
    {
      "component": "text-field",
      "target": "read-only",
      "kind": "unsupported",
      "specValue": "color.border.divider dotted bottom edge",
      "applied": null,
      "reason": "The host renders read-only as disabled; no separate style hook."
    }
  ]
}
```

- `revision` is always the full commit, even when `ref` is a tag.
- `exports` keys are the repository-relative paths listed in
  `exports/digests.json`, for exactly the files you read.
- `deviations` may be empty, but must be present.

## The short prompt

Once a consumer project points its own agent instructions at this document and
records a pinned revision, the everyday request can be:

> Implement this interface using j3w1/theme's approved default profile.

Without that setup, say it in full:

> Implement this interface using `j3w1/theme`. Resolve and record a theme
> revision, follow `agents/consume.md`, use the approved default profile, and
> read the relevant component specifications. Preserve this project's
> behaviour and framework; report unsupported mappings and deviations.
