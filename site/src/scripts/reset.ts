/* Reset: clears every j3w1-theme:* key, strips query parameters, restores
   default density and profile and shows every section again. */

import { clearAll } from "./storage";
import { apply as applyProfile } from "./profile";

export const initReset = (): void => {
  const button = document.getElementById("reset");
  if (!button) return;
  button.addEventListener("click", () => {
    clearAll();
    document.documentElement.setAttribute("data-density", "comfortable");
    applyProfile("default");
    const density = document.getElementById("density") as HTMLSelectElement | null;
    if (density) density.value = "comfortable";
    const profile = document.getElementById("profile") as HTMLSelectElement | null;
    if (profile) profile.value = "default";
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
    const url = new URL(location.href);
    url.search = "";
    history.replaceState(null, "", url);
  });
};
