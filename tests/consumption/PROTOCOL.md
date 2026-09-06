# Fresh-agent consumption test

The direct test of the project's purpose: an agent that has never seen this
repository reconstructs a component from the published contract alone. A
release requires the latest run at the release inputs to PASS with no open
`contract` items.

## Run

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
| — | — | — | — | — | not yet run | — | — | first run scheduled for the v0.1.0 release candidate |
