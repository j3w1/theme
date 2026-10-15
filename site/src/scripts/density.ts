/* Chrome stays compact (D-038); saved density applies only to specimens. */
import { KEYS, get, set } from "./storage";
export const DEFAULT_DENSITY = "compact";
export const applyDensity = (density: string) => {
  document.documentElement.dataset.demoDensity = density;
  document.querySelectorAll<HTMLElement>("[data-specimen], .demo, .ladder, .spec-rows, .border-set, .status-set").forEach((target) => { target.dataset.density = density; });
};
export const initDensity = (): void => {
  const select = document.getElementById("density") as HTMLSelectElement | null;
  const stored = get(KEYS.density);
  const density = stored === "comfortable" ? stored : DEFAULT_DENSITY;
  applyDensity(density);
  if (!select) return;
  select.value = density;
  select.addEventListener("change", () => { applyDensity(select.value); set(KEYS.density, select.value); });
};
