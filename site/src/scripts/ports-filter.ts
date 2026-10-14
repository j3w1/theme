const form = document.querySelector<HTMLFormElement>("[data-port-filter]");
if (form) {
  form.hidden = false;
  const input = form.elements.namedItem("query") as HTMLInputElement;
  input.value = new URL(location.href).searchParams.get("q") ?? "";
  const apply = () => {
    const query = input.value.trim().toLowerCase();
    let count = 0;
    for (const section of document.querySelectorAll<HTMLElement>("[data-port-entry]")) {
      if (section.dataset.portSearch !== undefined) {
        section.hidden = !section.dataset.portSearch.includes(query);
        if (!section.hidden) count++;
        continue;
      }
      const portMatch = section.querySelector("h2")?.textContent?.toLowerCase().includes(query);
      let visible = 0;
      for (const row of section.querySelectorAll<HTMLElement>("[data-port-row]")) {
        row.hidden = !portMatch && !row.textContent?.toLowerCase().includes(query);
        if (!row.hidden) visible++;
      }
      section.hidden = visible === 0; count += visible;
    }
    form.querySelector("[data-port-count]")!.textContent = count + (document.querySelector("[data-port-search]") ? " ports shown" : " mappings shown");
  };
  form.addEventListener("input", () => { apply(); const url = new URL(location.href); if (input.value) url.searchParams.set("q", input.value); else url.searchParams.delete("q"); history.replaceState(null, "", url); });
  form.addEventListener("reset", () => { input.value = ""; apply(); const url = new URL(location.href); url.searchParams.delete("q"); history.replaceState(null, "", url); });
  apply();
}
