# Independent composed acceptance review

Conclusion: **rejected** for the exact candidate below. Two implementation findings affect the long-content modal keyboard/accessibility path. Candidate bytes preserved: true.

Source revision: bbf0cc992588aa6fa22d7294e1e8a09a955af028

KIT.json digest: sha256-Zzz0eyFDnu5A7xlpxaz3wkPXhZV5J8arZkfw9Zui7gk=

| Candidate | SHA-256 (base64) |
| --- | --- |
| result.html | sha256-mzsJpfNpImAdoghh85c4f+7eI8CR5hHG+qGDvIrFV+4= |
| deviations.md | sha256-5EA+/4vYod91FUBHgBUhmQeJyKhNag8lOkiTfYZeTjo= |
| theme.lock.json | sha256-XuXe0MHEHz6bLR4V4shB14ZjlRtBmK32oYvkytV49xA= |

Environment: {"browser":"Chromium","version":"153.0.8010.12","playwright":"1.63.0","axe":"4.13.0","os":"win32 10.0.26200","node":"v24.18.0","headless":true,"viewports":[{"width":1000,"height":800},{"width":320,"height":568}],"profile":"default","density":"comfortable"}

## Findings

- **A-001 / agent / serious / blocking:** Overflowing dialog body has no explicit tabindex or focusable descendant. Settled axe reports scrollable-region-focusable at 320x568 with a 600-character display name. Chromium implicitly includes the scroller in Tab order and PageDown scrolls 0 to 150, but this does not satisfy the portable keyboard-access gate. Correction: Make the scrollable body explicitly keyboard focusable and appropriately named, preserving modal containment and all close paths.

- **A-002 / agent / medium / blocking:** When Chromium implicitly focuses the overflowing body, computed outline is rgb(238, 238, 238) auto 1px, offset 0px. The kit requires a focusable-container ring of 2px solid color.interaction.focus.ring-container at -3px. No host restriction was declared. Correction: Apply the approved container focus ring to the scrollable body and retain Highlight in forced colors; verify the long-content keyboard path.

- **C-001 / contract / medium:** Dialog semantic rule requires alertdialog for confirmation, while alert-dialog prose assigns destructive confirm tone; default Confirm token mapping supplies primary tone. Candidate discloses primary substitution for non-destructive settings.

- **C-002 / contract / medium:** Button active stateTokens names color.border.active for primary, while prose changes borders only on outline tones and supplied recipe retains primary border. Candidate discloses recipe/prose choice.

- **C-003 / contract / medium:** Global focus prose specifies on-fill text color; explicit button/checkbox focus mappings use ring-container. Candidate follows explicit mappings and discloses ambiguity.

- **T-001 / tooling / informational:** Initial axe scans ran during allowed 150ms opacity entrance and reported transient contrast failures. Follow-up awaited actual animation completion without changing candidate: zero contrast violations; scrollable-region-focusable remains. Initial raw results retained.

- **T-002 / tooling / informational:** First follow-up harness used browser.newPage; axe required explicit browser.newContext. Harness corrected and executed successfully; candidate untouched.

## Executed evidence

The first run recorded 383 assertions: 381 passed and 2 axe-state assertions failed. The settled follow-up isolated the actual overflow accessibility defect from entrance-animation timing. Full raw checks and axe nodes are preserved in raw.json and settled.json.

All sealed KIT file digests, available source input hashes, candidate upstream lock digests and identity, local schema constraints, literal role values, attribution and pending-decision disclosures passed. The upstream revision was not fetched.

Passed exercised behavior includes text editing, independent checkbox Space toggling, initial Tab order and specified control rings, native modal/top-layer opening, background inertness, forward/reverse modal Tab boundaries, Escape/Cancel/Close without status changes, Confirm with plain-text status and input preservation, return focus to Save on every close path, 320px horizontal reflow, stacked actions and visible modal actions with long content, reduced-motion duration, sampled forced-color focus, no-JS explanation with native controls, no script errors and no external requests.

The settled narrow modal body has clientHeight 366 and scrollHeight 516. Chromium tabs through Close → dialog-body → Cancel → Confirm. PageDown while the body is focused scrolls 0 → 150. The body still lacks explicit focusability and uses an unapproved host-default ring. Settled axe has one serious scrollable-region-focusable violation, no incomplete checks, and no contrast violations.

The candidate discloses omitted button, checkbox and text-field states. Those disclosures do not certify those states or establish all-state conformance. Contract ambiguities remain unresolved theme decisions; they are not silently accepted as new rules.

## Limits

- Chromium 153.0.8010.12 only; Firefox, WebKit/Safari and real touch devices not run.
- Automated keyboard events only; no manual keyboard protocol or screen-reader run.
- Actual 200% browser zoom and 200% text-only zoom not run.
- Computed role checks and browser paths sample implemented workflow states; omitted/unsupported states are not all-state conformance.
- Upstream source identity validated against sealed KIT manifest and available bytes only; no network, Git history or independent remote provenance validation. Parent export files absent from kit are checked by pinned digest metadata, not reconstructed.
- Font availability and preferred font rasterization not verified.
- Forced colors check sampled Save outline retention; complete high-contrast visual evaluation not run.
