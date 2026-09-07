import { queryUsage } from "../../../scripts/lib/usage-query.mjs";
const form = document.getElementById("usage-filters") as HTMLFormElement | null;
const raw = document.getElementById("usage-data");
if (form && raw) {
  const index = JSON.parse(raw.textContent!);
  const params = new URLSearchParams(location.search);
  for (const control of Array.from(form.elements) as HTMLInputElement[]) {
    if (!control.name || !params.has(control.name)) continue;
    if (control.type === "checkbox") control.checked = params.get(control.name) === "true";
    else control.value = params.get(control.name)!;
  }
  const update = () => {
    const fields = Object.fromEntries(new FormData(form).entries());
    const profile = Object.hasOwn(index.profiles, String(fields.profile)) ? String(fields.profile) : "default";
    const options = { ...fields, profile, eligible: fields.eligible === "on" };
    const matches = new Set(queryUsage(index, options).map((t) => t.path));
    document.querySelectorAll<HTMLElement>("[data-usage-profile]").forEach((section) => {
      section.hidden = section.dataset.usageProfile !== profile;
      section.querySelectorAll<HTMLElement>("[data-usage-path]").forEach((row) => { row.hidden = !matches.has(row.dataset.usagePath!); });
    });
    document.getElementById("usage-count")!.textContent = `${matches.size} documented ${matches.size === 1 ? "role" : "roles"} in ${profile}`;
    document.getElementById("usage-empty")!.hidden = matches.size !== 0;
    const url = new URL(location.href);
    url.search = "";
    for (const [key, value] of Object.entries(options)) if (value && !(key === "profile" && value === "default")) url.searchParams.set(key, String(value));
    history.replaceState(null, "", url);
  };
  form.addEventListener("submit", (event) => event.preventDefault());
  form.addEventListener("input", update);
  // Native reset applies its default action after the reset listener. Query
  // the controls on the next task, after their defaults have been restored.
  form.addEventListener("reset", () => setTimeout(update, 0));
  update();
}
