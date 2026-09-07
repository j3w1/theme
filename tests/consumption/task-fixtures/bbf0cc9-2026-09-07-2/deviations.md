## j3w1/theme deviation report

theme: j3w1-theme 0.1.0 @ bbf0cc992588aa6fa22d7294e1e8a09a955af028 (commit) profile=default
integration: css-vars (standalone HTML, native browser controls, no framework)
implemented: button (4/6 states); checkbox (5/10 states); dialog (7/7 states); text-field (5/14 states).

The counts describe reachable workflow states, not test coverage. Button: default, hover, focus-visible, active. Checkbox: default, hover, focus-visible, checked, checked+focus-visible. Text-field: default, hover, focus-visible, placeholder-shown, filled. Dialog: default, open, closed, focus-trapped, hover, focus-visible, reduced-motion. Existing recipe CSS for additional field/button states is retained but those states are not claimed as implemented workflow behaviors.

unsupported surfaces:
- No known required surface is unavailable in a modern browser supporting native dialog.showModal(). Older browsers without that API are unsupported; no polyfill is bundled.
- The preferred font is referenced by name, not bundled. The approved fallback stack applies; exact font availability is environment-dependent.

deviations:
| component | state / property | spec value | applied | reason | kind |
| --- | --- | --- | --- | --- | --- |
| button | disabled, loading; destructive tone | All six button states and four tones | Enabled primary, secondary and tertiary actions only | No asynchronous, disabled or destructive action occurs in the requested workflow. | omitted |
| checkbox | mixed, checked+disabled, disabled, invalid, required; group | All ten checkbox states and group variant | Optional single binary notifications checkbox | Task supplies no mixed group, requirement, validation or disabled rule. | omitted |
| text-field | required, invalid, invalid+focus-visible, invalid+hover, disabled, disabled+filled, read-only, read-only+focus-visible, loading; other variants | All fourteen field states and variants | Optional editable text field with no validation or asynchronous state | No validation, read-only, disabling, loading or other input variant was requested. | omitted |
| dialog | alert-dialog confirm tone | Alert-dialog anatomy describes filled destructive confirm | color.action.primary.bg with color.action.primary.text | The confirmation is non-destructive; primary tone follows the default Confirm variant and the action-role scope. The semantic alertdialog requirement is retained. | substituted |

| button | primary active border | stateTokens active border: color.border.active | color.action.primary.border | Recipe and component prose retain the primary border while prose changes active borders on outline tones. Conflicting JSON mapping is disclosed. | substituted |

host rules that took precedence: sealed standalone output; only settings workflow; no external resources, network writes or persistence.
lock: theme.lock.json

### Pending decisions

D-007: color.border.control used unchanged for native text input and checkbox boundaries. D-008: color.border.overlay and color.surface.backdrop used unchanged for the modal, color.border.divider for the status separator. These are use-and-report disclosures; none is approved by this implementation.

### Questions, assumptions and ambiguities

- No host existed in the empty output folder. Native HTML with inline CSS and JavaScript is the explicitly permitted css-vars target.
- No starting settings or validation constraints were supplied. Display name starts empty and optional; notifications start unchecked. Empty and whitespace-only names remain valid and are not trimmed; only the empty string is described as (empty).
- Comfortable density is selected. Layout uses the supplied spacing scale and content maximum; dialog maximum width uses the normative 28rem and a 16px gutter on each side. The recipe's 13px-root width conversion is not used for this newly composed modal.
- Save snapshots the current draft. Cancel, Close and Escape leave both draft controls and previously confirmed status unchanged. Confirm changes only the on-page status and closes the dialog. Repeated confirmations include a count so the live-region text changes even for identical settings. This counter exists only in page memory.
- Confirm uses primary tone because saving these settings is not destructive. The dialog contract requires alertdialog semantics for confirmations but its anatomy also says alert dialogs use destructive tone; this ambiguity is recorded as a substituted mapping above. No destructive action was invented.
- The native modal manages inertness and Escape. A boundary-only Tab handler cycles from Close backward to Confirm and from Confirm forward to Close. The named confirmation-details region is now an explicit tab stop between Close and Cancel. Initial focus goes to the first control, Close; every close path returns focus to Save. Backdrop clicks do not cancel. This supplements native modal containment: the first Chromium test found browser-chrome focus at the Tab boundaries. Native top-layer behavior is retained.
- The button recipe primary active border stays primary.border, while its JSON stateTokens names border.active. The component prose limits the active border change to outline tones. Recipe and prose behavior is retained; this conflict is a kit ambiguity, not an independently resolved theme rule.
- The supplied primary/checked focus role is ring-container (#ffa2a7) at the control ring width, despite global prose saying on-fill text colour; explicit component token mappings are followed.
- JavaScript is required for confirmation. Without it, inputs remain native and editable, Save is hidden, and an explanatory message is shown. No network submission fallback is supplied.
- Native browser autofill/session restoration policies are outside this page; the form requests autocomplete off. No storage API, fetch, form navigation or external asset is used.

### Attribution

Adapted from j3w1 UI Theme Spec, https://github.com/j3w1/theme. Specification and adapted structure: CC BY 4.0, https://creativecommons.org/licenses/by/4.0/. Changes: settings composition, checkbox presentation and native modal lifecycle. Code and tokens retain the MIT notice embedded in result.html.

### Checks

The first automated run failed the strict reverse Tab-cycle assertion: native Chromium moved focus to browser chrome (document.activeElement became body), while keeping the page inert. A boundary-only Tab handler corrected this behavior; the final run below tests the corrected artifact. No manual screen-reader or manual keyboard claim is made.

Final automated run: Chromium 153.0.8010.12, headless on Windows. Default profile, comfortable density, JavaScript enabled except the no-JavaScript case; viewports 1000×800 and 320×568. 34 assertions passed:

- canvas token
- field border token
- primary rest token
- initial keyboard order
- field focus ring
- native editing
- Space toggles checkbox
- checked focus ring token
- checked SVG visible
- native modal opens
- initial modal focus
- overlay token
- backdrop token
- reverse Tab wraps
- forward Tab wraps
- Escape returns focus
- Escape preserves status
- cancel returns focus
- cancel preserves status
- close returns focus
- close preserves status
- safe Confirm status
- Confirm focus return
- Confirm closes modal
- 320px page reflow
- long-name page reflow
- long-name dialog reflow
- 320px actions stack
- reduced-motion no animation
- forced-color ring retained
- no script errors
- no network requests
- no-JS Save hidden
- no-JS explanation visible

Not run: other engines, manual keyboard protocol, screen readers, axe scan, actual 200% browser/text-only zoom, touch devices, font availability. Computed checks sample implemented states, not every combination. No universal accessibility conformance claim.

Lock structure checked against all constraints used by the supplied JSON schema (including timestamp pattern and date parsing), using a local schema walker. Passed. Upstream identity and digests retained from the sealed kit; no remote revision resolution was performed.

### Independent rejection and consolidated correction

The original composed-output remains unchanged as rejected historical evidence. Its 34-assertion run above applies only to that original candidate and is not reused as acceptance evidence for this corrected candidate.

- A-001: the independent reviewer reported scrollable-region-focusable at 320×568 with a 600-character name. The dialog body now has tabindex=0, role=region, and the accessible name Settings confirmation details. Its content is reachable by keyboard even when it overflows.
- A-002: the implicitly focused scroller previously inherited the browser default ring. The explicit scroller now draws focus.ring-container (2px solid color.interaction.focus.ring-container) at focus.offset-container (-3px), with Highlight in forced-colors mode.
- This is one consolidated correction for these related focus defects. Native modal behavior and the existing boundary-only Tab handler remain. No theme token or contract ambiguity is resolved.
- Contract disclosures C001/C002/C003 remain as recorded above: confirmation tone, primary pressed border, and on-fill ring wording. The lock is byte-identical to the original because this correction implements existing requirements without adding a mapping deviation.

Corrected-candidate testing is recorded below.

Corrected-candidate final automated run: Chromium 153.0.8010.12, headless Windows, default profile, comfortable density, JavaScript enabled, 320×568 viewport with 600-character display name. 27 assertions passed:

- native modal with 600-character name
- initial Close focus
- Tab reaches scroller
- named region semantics
- fixture actually overflows
- exact standard container ring
- PageDown scrolls content
- Home returns to top
- Tab focuses #cancel
- Tab focuses #confirm
- Tab focuses #close
- Shift+Tab focuses #confirm
- Shift+Tab focuses #cancel
- Shift+Tab focuses .dialog-body
- 320px page reflow
- 320px modal reflow
- forced-colors Highlight container ring
- Escape closes from scroller and restores focus
- Escape preserves status
- cancel closes and returns focus
- close closes and returns focus
- confirm closes and returns focus
- Confirm retains complete long name in status
- settled axe scan zero violations
- original result.html unchanged
- original deviations.md unchanged
- original theme.lock.json unchanged

The overflowing region measured 366px client height and 516px scroll height. PageDown moved scrollTop from 0 to 150; Home returned it to zero. The settled axe scan used WCAG 2 A/AA, 2.1 A/AA and 2.2 AA tags and reported zero violations.

The first correction test attempt passed the keyboard/style assertions but could not execute axe because the test harness used browser.newPage() without an explicit context. The final run corrected the test harness with browser.newContext(); no additional implementation change was made.

Not run for this corrected candidate: other engines, manual keyboard and screen-reader protocols, actual browser/text-only zoom, touch, and font availability. Previous broad test claims remain historical. Independent acceptance belongs to the reviewer.
