# Composed task-kit acceptance

This exercise supplements the sealed single-component protocol. A kit is a
handoff artifact; the product never runs an agent automatically.

## Procedure

1. Commit the producer and generated dependency inputs. Build a standard kit
   for text-field, checkbox, button and dialog at that full commit, with an
   explicit integration identity and bounded settings-form task. Record the
   kit's exact source revision and file digests.
2. Give only that directory and an empty output directory to a fresh isolated
   agent. The task is to implement a small composed form, with native text
   editing, a checkbox, a save button and host-managed confirmation dialog.
   No network writes or persistence are part of the exercise. Record every
   question, assumption, deviation and ambiguity.
3. Separately judge the exact returned HTML, report and lock against the kit.
   Inspect token roles and source hashes; exercise keyboard focus, dialog
   open/close/Escape/focus return, independent native inputs, narrow reflow and
   automated accessibility. Record tested scope explicitly; this is not an
   assertion that every possible component state was exercised.
4. Classify findings as agent, contract or tooling, using the original
   protocol's correction rules. Preserve prior evidence when a candidate is
   corrected; never weaken a check to obtain a pass.
5. Keep the original text-field reconstruction as a separate fresh-agent run
   with its original static/browser judge. Commit both evidence records and
   ensure existing fixtures still pass the repository checks.

## Evidence

Completed runs are recorded here with their exact kit source and candidate
paths. An implementation file's presence alone is not a passing result.

| Source revision | Candidate | Result | Scope and limitations |
| --- | --- | --- | --- |
| `bbf0cc992588aa6fa22d7294e1e8a09a955af028` | [Initial candidate](task-fixtures/bbf0cc9-2026-09-07-1/review.md) | REJECTED; preserved | Long-content dialog scroller lacked explicit keyboard focusability and the required container ring. Raw and settled results retained; no check weakened. |
| `bbf0cc992588aa6fa22d7294e1e8a09a955af028` | [Corrected candidate](task-fixtures/bbf0cc9-2026-09-07-2/review.md) | PASS within recorded scope | One consolidated agent correction; separate independent review: 392 checks passed, zero failed. Named scroller, keyboard scrolling, container/forced-color ring, modal lifecycle, native inputs, narrow reflow and settled axe verified in Chromium. Contract ambiguities and untested manual/engine scope remain explicit. |

The source pin is historical acceptance provenance. The subsequent main merge
adds the owner-directed hex-hover rule; selected component mappings and token
values are unchanged (generated source digests change). Final CI exercises the
corrected candidate separately from the original text-field judge. Source tests
bind the recorded candidate hashes to the independent review and upstream lock.

Three contract findings remain unresolved: non-destructive confirmation tone
versus alert-dialog prose, primary active-border mapping versus recipe/prose,
and on-fill focus wording versus explicit component mappings. The consumer's
choices are disclosed deviations, not new canonical rules or approval. Resolve
those source contradictions through the repository process before claiming
unambiguous downstream conformance for the affected mappings.

Archived reviewer runners retain their original sealed-cache input locations;
they are execution records. Reviewer screenshots named in the original reports
remain local cache attachments because repository policy excludes images from
test fixture directories; the raw measurements and findings are committed.
The maintained repeatable regression is
`tests/browser/task-consumption.spec.js`, with source provenance checks in
`tests/task-consumption.test.js`. Rejected records are never counted as passing.
