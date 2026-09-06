# Consumption task

Using **only** the files in this directory, write `result.html`: a standalone
HTML document with one inline `<style>` element that implements the component
described in `components/<id>.json` in every declared state.

Rules:

- Read `theme.compact.md` first, then the component JSON, then
  `tokens.resolved.json` only for aliases the JSON does not inline.
- Render one instance per declared state, each wrapped in an element with
  `data-state="<state>"`. Use real attributes where the state is native
  (`disabled`, `readonly`, `aria-invalid="true"`, `aria-selected`), and a
  class or attribute selector where it is not.
- Use only colour values that appear in the files you were given. Do not
  invent, blend or approximate.
- No external resources: no `<link>`, no `<script src>`, no `url(http…)`, no
  web fonts.
- Radius 0; borders 1px (2px only where the specification says emphasis);
  the focus ring exactly as specified.
- Do not read any other source, website or screenshot.

Deliver `result.html`, a short deviation report following the format in
`theme.compact.md` (or "no deviations"), and `theme.lock.json` if you were
given a revision.
