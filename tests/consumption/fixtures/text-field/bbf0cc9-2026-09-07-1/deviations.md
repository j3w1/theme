## j3w1/theme deviation report

theme: j3w1-theme 0.1.0 @ unavailable (kit references v0.1.0; commit not supplied) profile=default
integration: css-vars (standalone native HTML/CSS; no framework)
implemented: text-field (14/14 states)
unsupported surfaces:
- No unsupported native text-field surface identified within this state-only exercise.

deviations:
| component | state / property | spec value | applied | reason | kind |
| --- | --- | --- | --- | --- | --- |
| text-field | revision lock | Full commit and export digests in theme.lock.json | No lock file | The sealed kit supplies no full commit or export digest manifest; external lookup is forbidden. A version or sourceDigest is not a commit. | host-rule |
| text-field | variants beyond text | Password, search, number, affix | Default text variant only | Task requests one instance per declared state; no state names a variant. | omitted |

host rules that took precedence: sealed-kit-only input; standalone output; no external resources or fabricated revision.
lock: omitted because no full revision was supplied.

### Pending decision disclosures

- D-007: color.border.control (#a3676b), used for normal input boundaries.
- D-008: color.border.divider (#2b0e0d), used for read-only dotted bottom edges.
- These values are used under the kit's use-and-report policy. Their proposed statuses are unchanged.

### Questions, assumptions, and ambiguities

- What full commit produced this kit? Unanswered; no pin is fabricated.
- Comfortable geometry is absent from the component JSON and compact foundations table. The supplied resolved tokens provide the missing density values: 32px height, 12px horizontal padding, 4px gap. These are applied to each instance.
- The component export does not assign a text size or help size. Applied supplied ui-md 13px/18px to inputs and labels, ui-sm 12px/16px to help and messages; these assignments are assumptions, not new token values.
- Page layout and specimen copy are unspecified. Applied a single column with a 48rem maximum width, 16px page padding, 24px separation, and state names as labels. Copy is illustrative.
- Invalid examples represent states after interaction or submission, so aria-invalid is present in those static examples. No validation application or custom business rule was invented.
- Focus and hover examples use data-state selectors because all states must be visible simultaneously. Live :focus-visible and hover rules also work. Hover styling, including the examples, applies only under the specified hover-capable-pointer media query.
- Read-only's explicit component rule is taken as the exception to the general non-example of underline-only fields. The bottom dotted edge is retained during focus.
- The component-specific loading placement overrides the compact generic rule about replacing a leading icon: the static glyph appears after the input, inside its visual box. There is no trailing action in the chosen text variant.
- No owning form is provided by this state gallery. Enter submission and variant-specific keyboard actions are not exercised.
- Forced-colors uses the explicitly specified Highlight system color. Exact platform font availability is left to the supplied fallback stack; no fonts are fetched.
- Process deviation: the first batched read after TASK.md included consume.md and the component before theme.compact.md was read. The compact file and component were subsequently read before implementation; no outside source was consulted.

### Checks performed

Installed Playwright with headless Chromium 153.0.8010.12 exercised this output only:

- Exactly 14 state wrappers and 32px computed input heights.
- Native disabled, readonly and aria-invalid states; 2px invalid boundaries; read-only top-edge absence and dotted bottom style.
- Every static focus example has a 1px dashed outline at -2px, or -4px for invalid focus.
- State background and text computed values were captured and inspected against supplied values.
- Live input focus receives a dashed outline; loading input remains editable.
- No horizontal page overflow at a 320px viewport.
- One inline style element and no external stylesheet or script references.

Not run: other browser engines, manual keyboard protocol, screen reader, forced-colors runtime, actual text selection rendering, touch emulation, zoom, visual screenshot comparison, or independent acceptance judge. These checks do not establish those outcomes.
