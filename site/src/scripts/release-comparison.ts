for (const section of document.querySelectorAll<HTMLElement>("[data-release-component]")) {
  const cases = JSON.parse(section.dataset.cases!) as { key: string; before: string | null; after: string | null; fixture: string }[];
  section.querySelector("select")?.addEventListener("change", (event) => {
    const chosen = cases.find((row) => row.key === (event.target as HTMLSelectElement).value);
    if (!chosen?.before || !chosen.after) return;
    for (const side of ["before", "after"] as const) { const frame = section.querySelector<HTMLIFrameElement>(`[data-release-side="${side}"]`)!; frame.src = chosen[side]!; frame.title = `${section.dataset.releaseComponent} ${side} ${chosen.key}`; }
    section.querySelector("[data-release-fixture]")!.textContent = chosen.fixture;
  });
}
