/* Specimen profile: sets data-profile on every demo and foundation specimen
   (not on the page chrome), so the [data-profile] blocks in
   tokens.generated.css restyle the specimens only. */

import { KEYS, get, set } from "./storage";

const targets = () => document.querySelectorAll<HTMLElement>(".demo, .ladder, .spec-rows, .border-set, .status-set");

export const apply = (id: string) => {
  document.documentElement.setAttribute("data-demo-profile", id);
  targets().forEach((el) => {
    if (id === "default") el.removeAttribute("data-profile");
    else el.setAttribute("data-profile", id);
  });
};

export const initProfile = (): void => {
  const select = document.getElementById("profile") as HTMLSelectElement | null;
  const stored = get(KEYS.profile);
  if (stored) apply(stored);
  if (!select) return;
  if (stored) select.value = stored;
  select.addEventListener("change", () => {
    apply(select.value);
    set(KEYS.profile, select.value);
  });
};
