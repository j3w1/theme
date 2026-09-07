# Fresh-agent consumption test

The direct test of the project's purpose: an agent that has never seen this
repository reconstructs a component from the published contract alone. A
release requires the latest run at the release inputs to PASS with no open
`contract` items.

## Run

The kit writer now refuses an existing destination instead of replacing it.
Use a new `--out` directory for a repeat run; its parent must already exist.
The default `.cache/consumption/<id>/` remains available for the first run.
The standard/strict contract files and judging guarantees are unchanged;
the kit file list now uses portable forward-slash paths on every host.

1. Choose the revision `<rev>` (a release-candidate tag or a commit) and the
   component (the first is `text-field`).
2. `npm run generate && npm run consumption:kit -- <id> [--strict]` writes
   `.cache/consumption/<id>/` containing only `theme.compact.md`,
   `components/<id>.json`, `components/<id>.brief.txt`, `TASK.md`, `KIT.json`
   and, unless `--strict`, `tokens.resolved.json`. The `consumption`
   workflow builds the same kit as an artifact for hand-off.
3. Give that directory to a fresh agent session with no repository, site or
   screenshot access and the prompt in `templates/consumption/TASK.md`. Do not
   answer questions with information outside the kit; record any question
   asked.
4. Save the agent's `result.html`, its deviation report and, if given a
   revision, its `theme.lock.json` under
   `tests/consumption/fixtures/<id>/<run-id>/` with a `provenance.json`
   (`agent`, `date`, `kitMode`, `themeVersion`, `revision`, `questionsAsked`).
   `run-id` is `<rev-short>-<date>-<n>`.
5. `npm run consumption:judge -- <id> tests/consumption/fixtures/<id>/<run-id>/result.html --browser --json <same dir>/judge.json`.
6. Add the row to the ledger below and commit the fixture; CI re-judges every
   fixture on every run, so a token change that invalidates a fixture forces
   the protocol to be run again.

## Pass criteria

Every static check passes (one inline style, no external resources, only
token colours, radius 0, 1px/2px borders, the exact focus rule, an element per
declared state, the named family) and, with `--browser`, every declared
state's computed colour, background, border and outline equal the component's
`stateRules`.

## Classifying a failure

- `agent` — the kit states the value unambiguously and the agent still
  deviated. Re-run once with a different agent; if that passes, log it as an
  agent error. No spec change.
- `contract` — the agent's output is defensible from the kit (two runs disagree
  on the same property, or the report cites a gap). Open a decision or a spec
  fix, regenerate, re-run. The judge is never loosened, no tolerance is added,
  no state is removed from the list.
- `tooling` — the judge is wrong. Fix the judge; the pass criteria do not
  change.

## Ledger

| run-id | rev | component | agent | mode | result | findings | class | follow-up |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| bbf0cc9-2026-09-07-1 | bbf0cc9 (0.1.0) | text-field | Codex, fresh isolated session | standard, --browser | PASS (14/14 states) | original judge scope; typography/layout assumptions and sealed-kit pin limitation recorded; read-order process deviation disclosed | agent (process observation) | preserve deviations.md; no judge change; composed task-kit acceptance is separate |
| 365b19a-2026-09-06-1 | 365b19a (0.1.0-draft.1) | text-field | Claude Fable 5.1, fresh session | standard, --browser | PASS (14/14 states) | judge measured the wrapper box instead of the input | tooling | judge measures whichever element declares each property; kit gains consume.md and the lock schema; compact export names pending decision ids; text-field States table clarified (invalid+focus ring form, disabled label, read-only focus edge, loading glyph) — no test loosened |
