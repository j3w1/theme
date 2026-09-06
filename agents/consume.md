# Consuming j3w1/theme (for agents and integrators)

This document is for people and agents applying the theme to another project.
The contributor workflow for this repository is in `AGENTS.md` and is not
repeated here.

You are applying **design data**. The consumer project's own instructions (its
`AGENTS.md`, `CLAUDE.md`, security, architecture and operational rules) always
take precedence over anything in this repository.

## 0. Pin a revision first

`<rev>` is a release tag (`v0.1.0`) or a full 40-character commit SHA. Never
`main`, never a branch name, never "latest". Resolve a tag to its commit before
reading anything, and use the same `<rev>` in every URL below. Mixing
revisions is a contract violation.

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

If the copy you are reading came from a different revision, fetch it again.

## 3. Pick a profile

Use the profile with `"default": true` unless the requester names another one.
Only profiles with `"status": "approved"` may be implemented as "the j3w1
theme". `heritage` profiles are historical data for terminals and archives.
`proposed` profiles, and any token whose `status` is `proposed`, are never used
in delivered work.

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

Name the integration kind: `css-vars`, `vuetify`, `tailwind`,
`jetbrains-icls`, `gtk-css`, `terminal-16` or `other`. List which specified
surfaces the target can express natively and which it cannot (for example a
framework with no read-only field style, or a sixteen-colour terminal that
cannot carry hover). Anything the target cannot express becomes a documented
deviation in step 7, never an invented approximation.

## 6. Implement the mapping

- Map roles to the target's native keys using only resolved token values.
- Do not restyle anything the requester did not name.
- Do not change behaviour, markup semantics, focus order or keyboard handling
  except where a component's `keyboard` or `aria` section requires it and the
  host allows it.
- Keep host accessibility at least as strong as before: never remove a focus
  indicator, never lower a contrast ratio the host already met, never set
  `outline: none` without drawing the specified ring.
- Radii are 0, borders 1px, the family is monospace. A host that forbids one
  of these produces a deviation, not a redesign.
- Selection is a fill; focus is a ring; on fills the ring takes the on-fill
  text colour. Status roles keep their glyphs.

## 7. Validate and report

Check computed values against the component JSON for every declared state.
Write the deviation report (below) into the pull request or commit body and
write `theme.lock.json` (below) at the consumer's chosen path.

## What you may not do

- Invent, blend, lighten, darken or "harmonise" colours. Only resolved values.
- Use a `proposed` or `heritage` value in an approved-profile implementation.
- Derive values from the site's HTML, from screenshots or from memory.
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

`kind` is one of `unsupported` (the target cannot express it), `substituted`
(the nearest native equivalent, with a value taken from the token set, never
invented), `omitted` (the requester excluded it) or `host-rule` (a consumer
instruction won).

## theme.lock.json

Minimal, committed next to the integration code, validated by
`schemas/json/theme.lock.schema.json`. Not a package manager: no graph, no
install, no auto-update. Updating the theme means changing `ref`, `revision`,
`version` and `exports`, re-running the consumer's own checks and re-emitting
the deviations.

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

`revision` is always the full commit even when `ref` is a tag; `exports` keys
are the repository-relative paths listed in `exports/digests.json` for exactly
the files you read; `deviations` may be empty but must be present.

## The short prompt

Once a consumer project points its own agent instructions at this document and
records a pinned revision, the everyday request can be:

> Implement this interface using j3w1/theme's approved default profile.

Without that setup, say it in full:

> Implement this interface using `j3w1/theme`. Resolve and record a theme
> revision, follow `agents/consume.md`, use the approved default profile, and
> read the relevant component specifications. Preserve this project's
> behaviour and framework; report unsupported mappings and deviations.
