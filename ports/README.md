# Application ports

No native ports are published yet. Historical implementations (the owner's
gedit scheme, IntelliJ scheme, tmux and browser-extension colours) are
catalogued in `references/catalogue.json`; they are evidence of origin, not
supported downloads.

A port is created under `ports/<slug>/` only when implementation work begins,
from `templates/port/`. Each port carries `port.json` (validated by
`schemas/port.mjs`), `mapping.json` (spec role → native key, with every
unmapped role listed), `src/` (generator inputs), `dist/` (committed importable
files) and `evidence/` (real captures with application version, OS and date).

Statuses: `experimental` (artifacts exist, checks pass, real-target verification
incomplete), `verified` (imported into the recorded target with matching
evidence and a current token digest), `deprecated` (with a reason). A parse
success is a structural pass, not verification. The README support table is
generated from these manifests and says so when the directory is empty.

`mapping.json` uses schema version 1 (`schemas/json/port-mapping.schema.json`):
`mappings` maps each theme role path to an array of native key strings;
`unmapped` maps each remaining role path to a reason. List every role in the
declared profile exactly once across those two objects. The generated usage
index reads only these declared mappings; it never infers private consumers
or treats a mapping as evidence of a successful application import.

## Capability details and import verification

Set `capabilitiesPath: "capabilities.json"` in a port manifest to publish
schema-version-1 detail through `schemas/json/port-capabilities.schema.json`.
Record integration kind, a full theme revision, explicit surface states and
reasons, every role's mapping state/surface/reason, and rollback instructions.
Each mapped classification must agree with `mapping.json` and belong to a
supported surface. Inherited, unsupported, out-of-scope and not-implemented
roles must remain unmapped. Without this file the old mapping contract stays
valid, but the explorer reports unclassified unmapped roles and missing pins.

An optional `verificationPath` identifies a real-import JSON protocol under
`evidence/`, validated by `schemas/json/port-import-evidence.schema.json`.
Record the application version, platform (`windows`, `linux` or `macos`),
actual OS version, checks, outcomes, protocol and
limits. Compute `subjectDigest` with `portSubject` in
`scripts/lib/port-capabilities.mjs` over the manifest (excluding its claimed
status and evidence list), mapping, capabilities (excluding the report path),
exact artifact hashes, current resolved profile tokens and the token-export
digest. Records can be marked verified only when that subject still matches,
the manifest declares verified, target/tested versions include the recorded
version, the recorded platform is a declared target, and all recorded checks
actually passed. A parse or synthetic fixture
cannot supply a real-import protocol.

The generator writes `exports/port-capabilities.json`; summaries, detail rows
and task kits consume it. Consumers fetch it at their own pinned revision.
Do not place private parity reports here automatically. Any public integration
evidence still requires explicit content/license review.
