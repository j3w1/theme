import { reportContext } from "../../../scripts/lib/issue-draft.mjs";
import { initializeIssueDraft } from "./issue-draft";
const root = document.querySelector<HTMLElement>("[data-report-page]")!;
const data = JSON.parse(root.dataset.reportData!);
const form = root.querySelector<HTMLFormElement>("[data-report-controls]")!;
const target = form.elements.namedItem("target") as HTMLSelectElement;
const profile = form.elements.namedItem("profile") as HTMLSelectElement;
const issue = root.querySelector<HTMLElement>("[data-issue-draft]")!;
const status = root.querySelector<HTMLElement>("[data-report-target]")!;
initializeIssueDraft(issue);
const update = () => {
  try {
    const [kind, id] = target.value.split(":");
    const context = { ...reportContext(data, kind, id, profile.value), viewport: { width: innerWidth, height: innerHeight } };
    issue.dispatchEvent(new CustomEvent("theme:report-context", { detail: context }));
    status.textContent = `${kind}: ${id}; ${profile.value}. Actual build: ${data.revision ?? "local and unpinned"}.`;
  } catch { issue.dispatchEvent(new CustomEvent("theme:report-context", { detail: null })); status.textContent = "Choose a valid component or token."; }
};
const query = new URLSearchParams(location.search);
const kind = query.has("component") ? "component" : "token";
target.value = `${kind}:${query.get(kind) ?? ""}`;
if (data.profiles.includes(query.get("profile"))) profile.value = query.get("profile")!;
form.addEventListener("submit", e => e.preventDefault());
form.addEventListener("change", update);
update();
