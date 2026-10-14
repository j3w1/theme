---
id: form-patterns
title: Form composition and recovery
order: 145
summary: A local reference workflow preserves values through validation, review and an explicitly simulated save.
---

## Scope

The [validation and recovery pattern](https://j3w1.github.io/theme/patterns/validation-recovery/)
composes admin-form, text-field, textarea, select, checkbox, alert, button and
table under proposed D-020. It is a reference composition, not an approved
profile or a persistence system; the component rules still apply. Its JSON
contract (`spec/patterns/validation-recovery.json`) records the components'
content digests, fields, fixtures, transitions and limits.

## Interaction

1. Submit to validate. Errors appear together in a focused summary linking to
   the affected fields; every entered value is kept, including unrelated
   notes and choices.
2. Correct and submit again to reach review. Editing never announces errors
   per keystroke nor silently removes the last submitted summary. Review
   offers an explicit way back to editing.
3. Confirming the review enters busy: controls are disabled and a pending
   message is shown.
4. Only the separate Complete simulation action reaches success; a submit
   click alone never does.

Busy, disabled, invalid and success each mean something different. Reset
clears in-memory values and errors.

The ws-07 conflict on Name and Hostname and the lowercase hostname rule
(letters, digits, hyphen-separated segments) are local admin-form fixtures,
not server checks; no request, account, storage or database is involved.
Without JavaScript the page keeps static normal, invalid, busy and success
examples.

## Evidence and limits

Automated protocols cover keyboard submission, summary navigation,
correction, preservation, review, busy, success, narrow layout and no-JS
content; a test that exists is not a passing run (see the verification
report). No manual screen-reader pass is claimed. Submit-time feedback follows
the [GOV.UK validation pattern](https://design-system.service.gov.uk/patterns/validation/).
