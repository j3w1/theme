const form = document.querySelector<HTMLFormElement>("[data-port-filter]");
if (form) {
  form.hidden = false;
  const input = form.elements.namedItem("query") as HTMLInputElement;
  const apply = () => {
    const query = input.value.trim().toLowerCase();
    let count = 0;
    for (const section of document.querySelectorAll<HTMLElement>("[data-port-entry]")) {
      const portMatch = section.querySelector("h2")?.textContent?.toLowerCase().includes(query);
      let visible = 0;
      for (const row of section.querySelectorAll<HTMLElement>("[data-port-row]")) {
        row.hidden = !portMatch && !row.textContent?.toLowerCase().includes(query);
        if (!row.hidden) visible++;
      }
      section.hidden = visible === 0; count += visible;
    }
    form.querySelector("[data-port-count]")!.textContent = count + " mappings shown";
  };
  form.addEventListener("input", apply);
  form.addEventListener("reset", () => { input.value = ""; apply(); });
  apply();
}
