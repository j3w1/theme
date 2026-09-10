/* Specimen density (D-009): sets data-density on <html>, which the generated
   [data-density] blocks in tokens.generated.css turn into --density-* values. */

import { KEYS, get, set } from "./storage";

/* The density the layouts render, and the one reset returns to. One constant,
   so the markup and the reset button cannot drift apart. */
export const DEFAULT_DENSITY = "compact";

export const initDensity = (): void => {
  const select = document.getElementById("density") as HTMLSelectElement | null;
  const root = document.documentElement;
  const stored = get(KEYS.density);
  if (stored === "compact" || stored === "comfortable") root.setAttribute("data-density", stored);
  if (!select) return;
  select.value = root.getAttribute("data-density") ?? DEFAULT_DENSITY;
  select.addEventListener("change", () => {
    root.setAttribute("data-density", select.value);
    set(KEYS.density, select.value);
  });
};
