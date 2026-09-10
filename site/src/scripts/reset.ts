/* Reset: clears every j3w1-theme:* key, strips query parameters, restores
   default density and profile and shows every section again. */

import { clearAll } from "./storage";
import { apply as applyProfile } from "./profile";
import { DEFAULT_DENSITY } from "./density";

export const initReset = (): void => {
  const button = document.getElementById("reset");
  if (!button) return;
  button.addEventListener("click", () => {
    document.documentElement.setAttribute("data-density", DEFAULT_DENSITY);
    applyProfile("default");
    const density = document.getElementById("density") as HTMLSelectElement | null;
    if (density) { density.value = DEFAULT_DENSITY; density.dispatchEvent(new Event("change", { bubbles: true })); }
    const profile = document.getElementById("profile") as HTMLSelectElement | null;
    if (profile) { profile.value = "default"; profile.dispatchEvent(new Event("change", { bubbles: true })); }
    const search = document.getElementById("search") as HTMLInputElement | null;
    if (search) {
      search.value = "";
      search.dispatchEvent(new Event("input"));
    }
    document.querySelectorAll<HTMLInputElement>('#family-filter input[name="family"]').forEach((b) => {
      b.checked = true;
    });
    document.querySelectorAll<HTMLElement>("section.family, section.component, [data-toc-component]").forEach((el) => {
      el.hidden = false;
      if (el.parentElement && el.hasAttribute("data-toc-component")) el.parentElement.hidden = false;
    });
    /* Last, so the change events above can settle the themed controls without
       leaving anything of theirs behind in storage. */
    clearAll();
    const url = new URL(location.href);
    url.search = "";
    history.replaceState(null, "", url);
  });
};
