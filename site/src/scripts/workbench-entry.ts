/* One opt-in browsing context at a time; the main document remains static. */
export function initWorkbenchEntry() {
  let active: HTMLButtonElement | null = null;
  const close = () => {
    if (!active) return;
    document.getElementById(active.getAttribute("aria-controls")!)?.replaceChildren();
    active.setAttribute("aria-expanded", "false"); active.textContent = "Open live controls here";
    active = null;
  };
  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-workbench-open]")) button.addEventListener("click", () => {
    if (active === button) { close(); return; }
    close(); active = button;
    const frame = document.createElement("iframe"); frame.className = "workbench-embedded";
    frame.title = `${button.closest("section")?.querySelector("h3")?.textContent ?? "Component"} workbench`;
    frame.src = button.dataset.workbenchOpen!;
    document.getElementById(button.getAttribute("aria-controls")!)!.append(frame);
    button.setAttribute("aria-expanded", "true"); button.textContent = "Close live controls";
  });
}
