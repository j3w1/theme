const form = document.getElementById("filters");
if (form) {
  form.hidden = false;
  const update = () => {
    const values = new FormData(form);
    let visible = 0;
    for (const row of document.querySelectorAll("tr[data-component]")) {
      row.hidden = ["component", "kind", "result"].some((key) => values.get(key) && row.dataset[key] !== values.get(key));
      if (!row.hidden) visible++;
    }
    document.getElementById("filter-count").textContent = `${visible} records shown`;
  };
  form.addEventListener("change", update);
  form.addEventListener("reset", () => setTimeout(update, 0));
  update();
}
