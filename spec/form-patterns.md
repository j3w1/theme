---
id: form-patterns
title: Form composition and recovery
order: 145
summary: A local reference workflow preserves values through validation, review and an explicitly simulated save.
---

## Scope

The [validation and recovery pattern](https://j3w1.github.io/theme/patterns/validation-recovery/) composes
admin-form, text-field, textarea, select, checkbox, alert, button and table.
It is a reference composition under proposed D-020, not a new approved profile
or a production persistence system. Existing component rules remain normative.
Its compact JSON contract records the constituent component content digests,
fields, fixtures, transitions and limits.

## Interaction

Enter values and submit to validate. Errors appear together in a focused
summary with links to the affected fields. Preserve every entered value,
including unrelated notes and choices. Correct fields and submit again to
review. Editing does not announce errors on each keystroke or silently remove
the last submitted error summary. Review offers an explicit return to editing.

Confirming the review enters busy, with the form controls disabled and an
explicit pending message. The separate Complete simulation action produces
success. A submit click alone is never success. Busy, disabled, invalid and
success have distinct meaning. Reset clears in-memory values and errors.

The example reserves ws-07 for Name and Hostname and requires a lowercase
hostname made of letters, digits and hyphen-separated segments. These are
named local fixtures from admin-form, not server uniqueness checks. No request,
account, storage or database is involved. The page retains static normal,
invalid, busy and success examples without JavaScript.

## Evidence and limits

Automated protocols cover keyboard submission, summary navigation, correction,
preservation, review, busy and success, along with narrow layout and no-JS
content. Test implementation is not an execution pass. Read the published
verification report for actual runs; no manual screen-reader pass is claimed.
The submit-time feedback follows the
[GOV.UK validation pattern](https://design-system.service.gov.uk/patterns/validation/).
