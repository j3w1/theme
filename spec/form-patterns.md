---
id: form-patterns
title: Form composition and recovery
order: 145
summary: A local reference workflow preserves values through validation, review and an explicitly simulated save.
---

## Scope

The [validation and recovery pattern](https://j3w1.github.io/theme/patterns/validation-recovery/) composes
admin-form, text-field, textarea, select, checkbox, alert, button and table.
It is a reference composition under proposed D-020. It is not a new approved
profile or a production persistence system, and the existing component rules
still apply. Its compact JSON contract records the content digests of the
components it uses, plus its fields, fixtures, transitions and limits.

## Interaction

1. Enter values and submit to validate. Errors appear together in a focused
   summary, with links to the affected fields. Every entered value is kept,
   including unrelated notes and choices.
2. Correct the fields and submit again to reach review. Editing does not
   announce errors on each keystroke, and it does not silently remove the last
   submitted error summary. Review offers an explicit way back to editing.
3. Confirm the review to enter busy: the form controls are disabled and a
   pending message is shown.
4. Use the separate Complete simulation action to reach success. A submit
   click alone is never success.

Busy, disabled, invalid and success each mean something different. Reset
clears in-memory values and errors.

The example reserves ws-07 for Name and Hostname. It requires a lowercase
hostname made of letters, digits and hyphen-separated segments. These are
named local fixtures from admin-form, not server uniqueness checks. No request,
account, storage or database is involved. Without JavaScript, the page keeps
static normal, invalid, busy and success examples.

## Evidence and limits

Automated protocols cover keyboard submission, summary navigation, correction,
preservation, review, busy and success, plus narrow layout and no-JS content.
A test that exists is not a passing run: read the published verification
report for real runs. No manual screen-reader pass is claimed. The submit-time
feedback follows the
[GOV.UK validation pattern](https://design-system.service.gov.uk/patterns/validation/).
