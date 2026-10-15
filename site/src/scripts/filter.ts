/* Search and family selection meet here, including their contents entries. */
export const refreshVisibility = (): number => {
  const boxes = [...document.querySelectorAll<HTMLInputElement>('#family-filter input[name="family"]')];
  const on = new Set(boxes.filter((box) => box.checked).map((box) => box.value));
  const sections = [...document.querySelectorAll<HTMLElement>("section.component")];
  let shown = 0;
  for (const section of sections) {
    section.hidden = section.dataset.searchMatch === "false" || (boxes.length > 0 && !on.has(section.dataset.family ?? ""));
    if (!section.hidden) shown++;
    const link = document.querySelector<HTMLElement>(`[data-toc-component="${section.dataset.component}"]`);
    if (link?.parentElement) link.parentElement.hidden = section.hidden;
  }
  document.querySelectorAll<HTMLElement>("section.family[data-family]").forEach((family) => { family.hidden = boxes.length > 0 && !on.has(family.dataset.family ?? ""); });
  document.dispatchEvent(new CustomEvent("reference-visibility", { detail: shown }));
  return shown;
};
export const initFilter = (): void => {
  const fieldset = document.getElementById("family-filter");
  if (!fieldset) return;
  const boxes = [...fieldset.querySelectorAll<HTMLInputElement>('input[name="family"]')];
  const initial = new URL(location.href).searchParams.get("family");
  if (initial !== null) {
    const selected = new Set(initial.split(","));
    boxes.forEach((box) => { box.checked = selected.has(box.value); });
  }
  fieldset.addEventListener("change", () => {
    refreshVisibility();
    const on = boxes.filter((box) => box.checked).map((box) => box.value);
    const url = new URL(location.href);
    if (on.length === boxes.length) url.searchParams.delete("family");
    else url.searchParams.set("family", on.join(","));
    history.replaceState(null, "", url);
  });
  refreshVisibility();
};
