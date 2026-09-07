/* Native behavior for the bounded workbench specimen only. Static matrices
   and exported visual recipes do not import this module. */
export function bindSpecimen(root: HTMLElement, component: string, state: string, announce: (text: string) => void, signal: AbortSignal) {
  const on = (element: EventTarget, event: string, handler: EventListener) => element.addEventListener(event, handler, { signal });
  const all = <T extends HTMLElement>(selector: string) => [...root.querySelectorAll<T>(selector)];
  const parts = state.split("+");
  if (component === "button") for (const button of all<HTMLButtonElement>(".button")) on(button, "click", (event) => {
    if (parts.includes("loading")) { event.preventDefault(); announce("Loading: activation ignored."); }
    else announce("Button activated. This specimen performs no save or deletion.");
  });
  if (component === "checkbox") {
    root.removeAttribute("data-state-checked"); root.removeAttribute("data-state-mixed");
    for (const input of all<HTMLInputElement>('input[type="checkbox"]')) {
      input.indeterminate = parts.includes("mixed");
      // A mixed parent becomes checked on its first native Space activation.
      if (input.indeterminate) input.checked = false;
      if (parts.includes("required") && input.closest("fieldset")) input.required = false;
      on(input, "change", () => announce(input.indeterminate ? "Mixed" : input.checked ? "Checked" : "Unchecked"));
    }
  }
  if (component === "text-field") {
    const input = root.querySelector<HTMLInputElement>("input")!;
    const actions = all<HTMLButtonElement>(".text-field-action");
    const mutable = () => !input.disabled && !input.readOnly;
    if (input.type === "password") {
      const action = actions[0];
      if (action) on(action, "click", () => { const reveal = input.type === "password"; input.type = reveal ? "text" : "password"; action.setAttribute("aria-pressed", String(reveal)); action.textContent = reveal ? "hide" : "reveal"; });
    } else if (input.type === "search") {
      const clear = () => { if (mutable()) { input.value = ""; input.dispatchEvent(new Event("input", { bubbles: true })); announce("Search cleared."); } };
      if (actions[0]) { actions[0].disabled = !mutable(); on(actions[0], "click", () => { clear(); input.focus(); }); }
      on(input, "keydown", (event) => { if ((event as KeyboardEvent).key === "Escape" && input.value && mutable()) { event.preventDefault(); clear(); } });
    } else if (input.type === "number") {
      const step = (up: boolean, amount: number) => { if (!mutable()) return; up ? input.stepUp(amount) : input.stepDown(amount); input.dispatchEvent(new Event("input", { bubbles: true })); };
      actions.forEach((action, index) => { action.disabled = !mutable(); on(action, "click", (event) => step(index === 0, (event as MouseEvent).shiftKey ? 10 : 1)); });
      on(input, "keydown", (event) => { const e = event as KeyboardEvent; if (["ArrowUp", "ArrowDown"].includes(e.key) && mutable()) { e.preventDefault(); step(e.key === "ArrowUp", e.shiftKey ? 10 : 1); } });
    }
  }
  if (component === "tabs") {
    const tabs = all<HTMLButtonElement>('[role="tab"]');
    const panels = all<HTMLElement>('[role="tabpanel"]');
    const activate = (tab: HTMLButtonElement, focus = false) => {
      if (tab.disabled) return;
      for (const item of tabs) { item.setAttribute("aria-selected", String(item === tab)); item.tabIndex = item === tab ? 0 : -1; }
      for (const panel of panels) { panel.hidden = panel.id !== tab.getAttribute("aria-controls"); panel.tabIndex = panel.hidden ? -1 : 0; }
      if (focus) { tab.focus(); tab.scrollIntoView({ block: "nearest", inline: "nearest" }); }
    };
    const initial = parts.includes("selected") ? tabs.find((tab) => tab.classList.contains("tabs-tab-demo-target")) : tabs.find((tab) => tab.getAttribute("aria-selected") === "true");
    if (initial && !initial.disabled) activate(initial);
    for (const tab of tabs) {
      on(tab, "click", () => activate(tab));
      on(tab, "keydown", (event) => {
        const e = event as KeyboardEvent; const enabled = tabs.filter((item) => !item.disabled); const index = enabled.indexOf(tab);
        const rtl = getComputedStyle(root).direction === "rtl";
        const delta = e.key === "ArrowRight" ? (rtl ? -1 : 1) : e.key === "ArrowLeft" ? (rtl ? 1 : -1) : 0;
        const next = e.key === "Home" ? enabled[0] : e.key === "End" ? enabled.at(-1) : delta ? enabled[(index + delta + enabled.length) % enabled.length] : null;
        if (next) { e.preventDefault(); activate(next, true); }
      });
    }
  }
  if (component === "dialog") {
    const dialog = root.querySelector<HTMLDialogElement>("dialog")!;
    dialog.removeAttribute("open");
    const opener = document.querySelector<HTMLButtonElement>("[data-open-dialog]")!;
    const close = () => { dialog.close(); announce("Dialog closed; focus returned to its opener."); };
    on(opener, "click", () => {
      root.removeAttribute("data-state-closed");
      dialog.showModal();
      const first = dialog.querySelector<HTMLElement>("button, input, select, textarea, [tabindex]");
      if (!first || first.classList.contains("dialog-button-destructive") || parts.includes("focus-trapped")) { dialog.tabIndex = -1; dialog.focus(); }
      else first.focus();
    });
    for (const button of all<HTMLButtonElement>(".dialog-close, .dialog-button[type=button]")) on(button, "click", close);
    on(dialog, "close", () => opener.focus());
    on(dialog, "cancel", () => announce("Dialog cancelled."));
    const form = dialog.querySelector("form");
    if (form) on(form, "submit", (event) => { event.preventDefault(); close(); });
  }
  if (component === "sidebar-nav") {
    root.querySelector("nav")?.removeAttribute("aria-selected");
    for (const group of all<HTMLButtonElement>(".sidebar-nav-group")) {
      const children = root.querySelector<HTMLElement>(`#${CSS.escape(group.getAttribute("aria-controls")!)}`);
      if (!children) continue;
      children.hidden = group.getAttribute("aria-expanded") !== "true";
      root.removeAttribute("data-state-expanded");
      on(group, "click", () => { children.hidden = !children.hidden; group.setAttribute("aria-expanded", String(!children.hidden)); });
    }
    for (const link of all<HTMLAnchorElement>("a")) on(link, "click", (event) => { event.preventDefault(); announce("Reference navigation link; no application destination is supplied."); });
  }
  if (component === "table") {
    root.querySelector("table")?.removeAttribute("aria-selected");
    for (const button of all<HTMLButtonElement>(".table-sort")) on(button, "click", () => {
      const th = button.closest("th")!; const table = th.closest("table")!; const column = th.cellIndex;
      const ascending = th.getAttribute("aria-sort") !== "ascending";
      table.querySelectorAll("th").forEach((header) => header.removeAttribute("aria-sort"));
      th.setAttribute("aria-sort", ascending ? "ascending" : "descending");
      const glyph = button.querySelector(".table-sort-glyph"); if (glyph) glyph.textContent = ascending ? "▲" : "▼";
      const tbody = table.tBodies[0];
      const rows = [...tbody.rows].filter((row) => row.classList.contains("table-row"));
      rows.sort((a, b) => (a.cells[column]?.textContent ?? "").localeCompare(b.cells[column]?.textContent ?? "", undefined, { numeric: true }) * (ascending ? 1 : -1));
      rows.forEach((row) => tbody.append(row)); announce(ascending ? "Sorted ascending." : "Sorted descending.");
    });
  }
}
