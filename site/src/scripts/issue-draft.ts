import { issueDraft, issueComposer } from "../../../scripts/lib/issue-draft.mjs";

export function initializeIssueDraft(root: HTMLElement) {
  if (root.dataset.initialized) return;
  root.dataset.initialized = "true";
  let context = JSON.parse(root.dataset.reportContext ?? "null");
  const form = root.querySelector<HTMLFormElement>("[data-issue-form]")!;
  const body = root.querySelector<HTMLTextAreaElement>("[data-issue-body]")!;
  const reviewed = root.querySelector<HTMLInputElement>("[data-review-issue]")!;
  const composer = root.querySelector<HTMLAnchorElement>("[data-open-issue]")!;
  const copy = root.querySelector<HTMLButtonElement>("[data-copy-issue]")!;
  const status = root.querySelector<HTMLElement>("[data-issue-status]")!;
  const invalidate = () => { reviewed.checked = false; composer.removeAttribute("href"); composer.setAttribute("aria-disabled", "true"); copy.disabled = true; body.value = ""; status.textContent = ""; };
  root.addEventListener("theme:report-context", ((event: CustomEvent) => { context = event.detail; invalidate(); }) as EventListener);
  form.addEventListener("input", (event) => { if (event.target !== reviewed) invalidate(); });
  form.addEventListener("submit", (event) => {
    event.preventDefault(); invalidate();
    if (!context) { status.textContent = "Select a valid report target first."; return; }
    body.value = issueDraft(Object.fromEntries(new FormData(form)), context); copy.disabled = false;
  });
  reviewed.addEventListener("change", () => {
    const enabled = reviewed.checked && !!body.value;
    composer.setAttribute("aria-disabled", String(!enabled));
    if (!enabled) { composer.removeAttribute("href"); return; }
    const result = issueComposer(context.id ?? context.config.component, body.value);
    composer.href = result.href;
    status.textContent = result.manualPaste ? "This draft exceeds the portable link budget. Copy the draft, open the composer, then paste it into the issue body." : "Opening the composer does not submit the issue. GitHub may require sign-in; the copy option remains available.";
  });
  composer.addEventListener("click", (event) => { if (!reviewed.checked || !body.value) event.preventDefault(); });
  copy.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(body.value); status.textContent = "Draft copied."; }
    catch { body.focus(); body.select(); status.textContent = "Clipboard unavailable. The draft is selected for manual copying."; }
  });
  root.querySelector("[data-cancel-issue]")!.addEventListener("click", () => { form.reset(); invalidate(); });
}
for (const root of document.querySelectorAll<HTMLElement>("[data-issue-draft]")) initializeIssueDraft(root);
