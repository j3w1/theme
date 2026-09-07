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
