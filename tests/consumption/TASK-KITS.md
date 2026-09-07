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
