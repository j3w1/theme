# Independent corrected composed acceptance review

Conclusion: **passed** for this exact corrected candidate and the bounded settings-form task. The original rejection remains historical evidence; no prior pass is reused for changed bytes.

Source revision: bbf0cc992588aa6fa22d7294e1e8a09a955af028

KIT.json digest: sha256-Zzz0eyFDnu5A7xlpxaz3wkPXhZV5J8arZkfw9Zui7gk=

| Candidate | SHA-256 (base64) |
| --- | --- |
| result.html | sha256-tpkqO3eSLZ9GA8FjNd9mckrnNOf3j7I0dj1DA0jRgQo= |
| deviations.md | sha256-RORseyGIfpQWZTRWjxyE4g8NR9Wst8h2GBLc+53AfRM= |
| theme.lock.json | sha256-XuXe0MHEHz6bLR4V4shB14ZjlRtBmK32oYvkytV49xA= |

Candidate and original rejected candidate both preserved: true.

## Executed checks

384 main assertions passed; 8 additional correction/preservation assertions passed; 0 failed. Full per-check evidence is in review.json and raw.json; focused overflow evidence is in settled.json.

Rechecked every sealed file digest, available upstream input digest, lock identity and upstream hashes, schema constraints, literal token declarations, attribution and pending decisions. All pass against the same sealed kit. No remote source or Git history was consulted.

Native editing and independent checkbox toggling, keyboard order and focus rings, native modal opening, background inertness, forward/reverse containment, Escape/Cancel/Close/Confirm, plain-text status, input preservation and return focus all passed. Narrow page/modal reflow, stacked visible actions with long content, reduced motion, sampled forced colors, no-JS native controls/explanation, script errors and external-request checks also passed.

## Consolidated correction

A-001 resolved: .dialog-body now has tabindex=0, role=region, and accessible name Settings confirmation details. At 320x568 with the 600-character name, its clientHeight is 366 and scrollHeight is 516. Tab follows Close → body → Cancel → Confirm → Close; PageDown changes scrollTop 0 → 150 and Home restores 0.

A-002 resolved: focused body computes rgb(255, 162, 167) solid 2px, offset -3px. Forced colors retains solid 2px/-3px and matches the actual Highlight system color, rgb(55, 0, 110).

Settled axe scans pass on the filled checked form, open modal, and narrow long-content modal. The focused narrow follow-up has zero violations and zero incomplete checks. Scans await actual animation completion; the candidate animation is neither disabled nor changed.

## Contract findings retained

- C-001: Dialog semantic rule requires alertdialog for confirmation, while alert-dialog prose assigns destructive confirm tone; default Confirm token mapping supplies primary tone. Candidate discloses primary substitution for non-destructive settings.

- C-002: Button active stateTokens names color.border.active for primary, while prose changes borders only on outline tones and supplied recipe retains primary border. Candidate discloses recipe/prose choice.

- C-003: Global focus prose specifies on-fill text color; explicit button/checkbox focus mappings use ring-container. Candidate follows explicit mappings and discloses ambiguity.

These are upstream contract ambiguities, not new approved theme rules. The candidate still discloses omitted states and deviations; this pass does not certify omitted states or all-state conformance.

## Environment and limits

{"browser":"Chromium","version":"153.0.8010.12","playwright":"1.63.0","axe":"4.13.0","os":"win32 10.0.26200","node":"v24.18.0","headless":true,"viewports":[{"width":1000,"height":800},{"width":320,"height":568}],"profile":"default","density":"comfortable"}

- Chromium 153.0.8010.12 only; Firefox, WebKit/Safari and real touch devices not run.
- Automated keyboard events only; no manual keyboard protocol or screen-reader run.
- Actual 200% browser zoom and 200% text-only zoom not run.
- Computed role checks and browser paths sample implemented workflow states; omitted/unsupported states are not all-state conformance.
- Upstream source identity validated against sealed KIT manifest and available bytes only; no network, Git history or independent remote provenance validation. Parent export files absent from kit are checked by pinned digest metadata, not reconstructed.
- Font availability and preferred font rasterization not verified.
- Forced colors check sampled Save outline retention; complete high-contrast visual evaluation not run.
