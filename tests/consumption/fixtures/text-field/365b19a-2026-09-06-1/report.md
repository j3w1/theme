# text-field — consumption report

theme: j3w1-theme 0.1.0-draft.1 · profile: default · sourceDigest: sha256-8OQMCIgCpf9ai1///uY3cYpsQTr44Npife7eSPAd2N8=
component: text-field (maturity stable, priority R1) · deliverable: `result.html`
inputs read: TASK.md, theme.compact.md, components/text-field.json, components/text-field.brief.txt, KIT.json, and targeted lookups in tokens.resolved.json (density.*, font.line-height.*, font.weight.*, space.*, icon.size.md, color.code.caret, color.surface.canvas). No other source.

## Deviations

No deviations from the approved contract.

Roles used whose decision is still `proposed` (theme.compact.md, "Roles pending an owner decision"; values may change in the next pre-release; decision ids live in `spec/decisions.md`, which was not supplied, so none can be quoted):

| Role | Value | Used for |
| --- | --- | --- |
| `color.border.control` | `#a3676b` | `root.border` — rest, hover, placeholder-shown, filled, required border |
| `color.border.divider` | `#2b0e0d` | `root.border-readonly` — the dotted bottom edge of the read-only field |

`theme.lock.json` was not written: TASK.md asks for it only "if you were given a revision", and no lock-file schema or revision (tag/commit) was supplied beyond the version string and sourceDigest already carried in the JSON header.

## Ambiguities and how they were resolved

1. **Deviation-report format.** theme.compact.md says to follow its format and the brief says "per agents/consume.md", but no file in the kit contains a template (consume.md was not supplied). Resolved: header with theme/version/digest, a "Deviations" section ("No deviations" plus the proposed-role table the compact spec asks for), then this list.
2. **Page background.** The contrast table checks help/message text against `color.surface.default` (#160b0b, "the panel surface"), but the read-only rule requires the field on `color.surface.canvas` (#0c0909). Resolved: the whole page is on the canvas; it is darker than the panel, so every listed ratio is met or exceeded; no panel wrapper is drawn.
3. **Size.** The JSON declares `compact` and `comfortable` sizes but no state exercises them and no density values are inlined. Resolved: rendered `comfortable` only (density.comfortable.control-height 32px, control-padding-x 12px, gap 4px from tokens.resolved.json).
4. **Ring form on the invalid field.** `focus.ring-container` is `2px solid #ffa2a7` for containers, but the invalid+focus-visible rule says "the ring in {color.interaction.focus.ring-container} at −4px" and D-006 says that on a filled surface "the ring takes that surface's on-fill text colour". Resolved as a colour swap only: `outline: 1px dashed #ffa2a7; outline-offset: -4px`. The brief's own rule ("focus is a 1px dashed ring") supports this.
5. **Border colour under invalid+focus-visible.** focus-visible alone turns the border to `border.active` (#e53935); invalid uses `status.danger.border` (also #e53935). Resolved: the danger border is declared explicitly in the combined rule so precedence is visible even though the values coincide.
6. **Read-only + focus-visible edge colour.** "The dotted edge and the dashed ring" does not say whether the edge turns `border.active`. Resolved: the edge stays `color.border.divider`; only the 1px dashed #e53935 ring at −2px is added, because the read-only field "has no box" and border→active belongs to the boxed field.
7. **"No box" geometry for read-only.** Resolved with `border-width: 0 0 1px 0; border-style: dotted` rather than transparent side borders, so no colour value outside the kit is needed and the 32px height is unchanged via `box-sizing: border-box`.
8. **Invalid border and text inset.** A 2px border inside a 32px border-box shifts the text 1px. Resolved: horizontal padding drops to 11px on `[aria-invalid="true"]` so the text inset stays 13px and the height is unchanged. Geometry only.
9. **Loading glyph placement.** Resolved: the glyph is an `aria-hidden` sibling absolutely positioned at `inset-inline-end: 12px` inside a `position: relative` box wrapper (no role); the input gets `padding-inline-end: 32px` so the value never runs under the glyph; `aria-busy="true"` is on the `<input>`. The `.tf-box` wrapper exists on every instance so loading does not change layout.
10. **Static rendering of non-native states.** hover, focus-visible, placeholder-shown, filled and loading cannot be forced by attributes alone. Resolved: `.is-hover`, `.is-focus-visible`, `.is-placeholder-shown`, `.is-filled`, `.is-loading` classes sit alongside the live `:hover` (inside `@media (hover: hover)`), `:focus-visible`, `:placeholder-shown` and `[aria-busy="true"]` selectors; each rule is a selector list so the static and live paths share one declaration block. `.is-filled` and `.is-placeholder-shown` intentionally add no styling ("as default with a value"; placeholder colour comes from `::placeholder`).
11. **Label colour when disabled.** The text-field token set has no `label.text-disabled` (checkbox/radio-group do have `text.disabled` for labels). Resolved: the label stays `color.text.bright` in the disabled states; only the control uses `text.disabled`, `border.disabled`, `disabled.bg`, per the state rule.
12. **`-webkit-text-fill-color` on disabled inputs.** Blink/WebKit substitute their own disabled text colour unless this is set. Resolved: set to the same `#8a5559` (`color.text.disabled`); no new colour.
13. **Disabled placeholder.** Not specified. Resolved: `#8a5559` (`text.disabled`) so a disabled field never shows the brighter placeholder rose.
14. **Motion.** Rule 7 permits transitions on opacity, transform and background only. Resolved: `transition: background-color 80ms` (motion.duration.fast) for the hover fill; border/outline changes are instant; `prefers-reduced-motion: reduce` sets 0.01ms.
15. **Forced colours.** D-006 says forced-colors mode uses `Highlight`. Resolved: `outline-color: Highlight` on the focus-visible selectors under `@media (forced-colors: active)`; `Highlight` is the system keyword named in theme.compact.md, not an invented value.
16. **Font.** `font.family.mono` is "not bundled" and web fonts are forbidden. Resolved: the stack is used verbatim with the generic `monospace` fallback; nothing is loaded.
17. **Demo chrome.** The page carries an `<h1>` and a per-cell `data-state` caption so the matrix is readable, using only `text.bright`, `text.muted`, h1/ui-sm sizes and the spacing scale; they are not part of the component and can be removed without touching the field CSS.

## Questions I would have asked

- Is there a canonical deviation-report template (agents/consume.md) and a `theme.lock.json` schema I should have followed?
- Should the invalid+focus-visible ring keep the 1px dashed control form (as implemented) or take the 2px solid container form of `focus.ring-container`?
- Does the read-only field's dotted edge change colour on focus, or does only the ring appear?
- Should the compact density be demonstrated even though it is not in `states`, and if so with which state(s)?
- Should the label (and help text) dim in the disabled states, as they do for checkbox/radio-group, or stay bright as implemented?
- Is the demonstration expected on the panel surface (#160b0b, as the contrast table assumes for help/message) or the canvas (#0c0909, as the read-only rule requires)?
- What are the decision ids for `color.border.control` and `color.border.divider` so they can be cited here?
- Should the ⋯ loading glyph replace a trailing affix/action when one is present, or sit beside it?