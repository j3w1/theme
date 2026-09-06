/* Family filter: checkboxes hide whole family sections. Everything is shown
   by default; the selection lives in ?family= so it can be shared. */

export const initFilter = (): void => {
  const fieldset = document.getElementById("family-filter");
  if (!fieldset) return;
  const boxes = Array.from(fieldset.querySelectorAll<HTMLInputElement>('input[name="family"]'));

  const apply = () => {
    const on = new Set(boxes.filter((b) => b.checked).map((b) => b.value));
    document.querySelectorAll<HTMLElement>("section.family[data-family]").forEach((s) => {
      s.hidden = !on.has(s.dataset.family ?? "");
    });
    document.querySelectorAll<HTMLElement>("[data-toc-component]").forEach((l) => {
      const section = document.querySelector<HTMLElement>(`section.component[data-component="${l.dataset.tocComponent}"]`);
      if (section) (l.parentElement as HTMLElement).hidden = !on.has(section.dataset.family ?? "");
    });
    const url = new URL(location.href);
    if (on.size === boxes.length) url.searchParams.delete("family");
    else url.searchParams.set("family", [...on].join(","));
    history.replaceState(null, "", url);
  };

  const initial = new URL(location.href).searchParams.get("family");
  if (initial) {
    const wanted = new Set(initial.split(","));
    boxes.forEach((b) => (b.checked = wanted.has(b.value)));
  }
  boxes.forEach((b) => b.addEventListener("change", apply));
  if (initial) apply();
};
