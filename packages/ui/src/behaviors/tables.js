import { all, enabled, rove, identify } from "../internal/dom.js";

export function table(root, { on }) {
  const element = root.querySelector("table"), body = element?.tBodies[0];
  if (!element || !body) return {};
  const rows = () => [...body.rows].filter(row => !row.matches(".table-empty,.table-loading,.data-table-empty,.data-table-loading,[data-empty],[data-loading]"));
  const shown = () => rows().filter(row => !row.hidden);
  const interactive = element.classList.contains("data-table");
  const selectAll = element.querySelector(".data-table-select-all");
  let anchor = null, query = "";
  rows().forEach((row, index) => identify(root, row, `row-${index}`));
  const selected = () => rows().filter(row => row.getAttribute("aria-selected") === "true");
  const syncSelection = () => {
    for (const row of rows()) { const box = row.querySelector('input[type="checkbox"]'); if (box) box.checked = row.getAttribute("aria-selected") === "true"; }
    if (selectAll) { const count = shown().filter(row => row.getAttribute("aria-selected") === "true").length; selectAll.setAttribute("aria-checked", count === 0 ? "false" : count === shown().length ? "true" : "mixed"); }
  };
  const reportSelection = () => { syncSelection(); root.emit("selection", { ids: selected().map(row => row.id) }); };
  const setSelected = ids => { if (!Array.isArray(ids) || ids.some(id => !rows().some(row => row.id === id))) throw new RangeError("Selection contains an unknown row"); rows().forEach(row => row.setAttribute("aria-selected", String(ids.includes(row.id)))); syncSelection(); };
  const sort = (column, direction = "ascending") => {
    const headers = [...element.tHead.rows[0].cells];
    if (!Number.isInteger(column) || column < 0 || column >= headers.length || !["ascending", "descending"].includes(direction)) throw new RangeError("Invalid sort column or direction");
    const compare = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
    const value = row => row.cells[column]?.dataset.sortValue ?? row.cells[column]?.textContent.trim() ?? "";
    rows().sort((a, b) => compare.compare(value(a), value(b)) * (direction === "ascending" ? 1 : -1)).forEach(row => body.append(row));
    headers.forEach(header => { if (header === headers[column]) header.setAttribute("aria-sort", direction); else header.removeAttribute("aria-sort"); });
    root.emit("sort", { column, direction });
  };
  const filter = text => {
    query = String(text ?? "");
    const status = root.querySelector("select[data-status-filter]")?.value ?? "all";
    for (const row of rows()) row.hidden = !row.textContent.toLocaleLowerCase().includes(query.toLocaleLowerCase()) || status !== "all" && row.dataset.status !== status;
    const count = shown().length;
    const empty = body.querySelector(".table-empty,.data-table-empty,[data-empty]"); if (empty) empty.hidden = count !== 0 || element.getAttribute("aria-busy") === "true";
    const output = root.querySelector("[data-table-status],.filterable-table-count,.search-field-status"); if (output) output.textContent = `${count} matching records`;
    if (interactive) { const focused = shown().find(row => row.tabIndex === 0) ?? shown()[0]; if (focused) rove(rows(), rows().indexOf(focused), false); }
    syncSelection();
  };
  on(element, "click", event => {
    const button = event.target.closest(".table-sort,.data-table-sort");
    if (button && enabled(button)) { const header = button.closest("th"); sort(header.cellIndex, header.getAttribute("aria-sort") === "ascending" ? "descending" : "ascending"); }
  });
  on(selectAll, "click", () => { if (!enabled(selectAll)) return; const checked = selectAll.getAttribute("aria-checked") !== "true"; shown().forEach(row => row.setAttribute("aria-selected", String(checked))); reportSelection(); });
  on(body, "change", event => { if (event.target.matches('input[type="checkbox"]')) { event.target.closest("tr").setAttribute("aria-selected", String(event.target.checked)); reportSelection(); } });
  on(body, "keydown", event => {
    if (!interactive || event.target.matches("input,button,a,select,textarea")) return;
    const row = event.target.closest("tr"), options = shown(), index = options.indexOf(row); if (index < 0) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") { event.preventDefault(); options.forEach(item => item.setAttribute("aria-selected", "true")); reportSelection(); return; }
    if (event.key === " ") { event.preventDefault(); if (!selectAll) rows().filter(item => item !== row).forEach(item => item.setAttribute("aria-selected", "false")); row.setAttribute("aria-selected", String(row.getAttribute("aria-selected") !== "true")); anchor = row; reportSelection(); return; }
    if (!["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : Math.max(0, Math.min(options.length - 1, index + (event.key === "ArrowDown" ? 1 : -1)));
    const next = rove(options, nextIndex);
    if (event.shiftKey && selectAll) { anchor ??= row; const start = options.indexOf(anchor); options.forEach((item, i) => item.setAttribute("aria-selected", String(i >= Math.min(start, nextIndex) && i <= Math.max(start, nextIndex)))); reportSelection(); }
    else if (!selectAll) { setSelected([next.id]); reportSelection(); anchor = next; }
    else anchor = next;
  });
  const input = root.querySelector('input[type="search"]');
  on(input, "input", () => filter(input.value));
  on(root.querySelector("select[data-status-filter]"), "change", () => filter(input?.value ?? query));
  let drag = null;
  const sizes = new Map();
  const resize = (header, width) => { const value = Math.max(64, Math.min(1200, width)); header.style.width = `${value}px`; header.style.minWidth = `${value}px`; sizes.set(header, value); };
  all(element, ".data-table-resize").forEach(handle => {
    const header = handle.closest("th");
    // The handle stays decorative and outside the tab order; header menus are the keyboard alternative.
    on(handle, "pointerdown", event => { if (event.button !== 0) return; event.preventDefault(); drag = { header, x: event.clientX, width: header.getBoundingClientRect().width, rtl: getComputedStyle(header).direction === "rtl" }; handle.setPointerCapture?.(event.pointerId); });
  });
  on(root.ownerDocument, "pointermove", event => { if (drag) resize(drag.header, drag.width + (event.clientX - drag.x) * (drag.rtl ? -1 : 1)); });
  on(root.ownerDocument, "pointerup", () => { drag = null; }); on(root.ownerDocument, "pointercancel", () => { drag = null; });
  on(root, "j3w1-action", event => {
    const match = /^resize:(\d+):(narrow|widen|reset)$/.exec(event.detail.action ?? ""); if (!match) return;
    const header = element.tHead.rows[0].cells[Number(match[1])]; if (!header) return;
    if (match[2] === "reset") { header.style.removeProperty("width"); header.style.removeProperty("min-width"); sizes.delete(header); }
    else resize(header, (sizes.get(header) ?? header.getBoundingClientRect().width) + (match[2] === "narrow" ? -24 : 24));
  });
  syncSelection(); filter(input?.value ?? "");
  return { sort, filter, get selectedIds() { return selected().map(row => row.id); }, set selectedIds(ids) { setSelected(ids); }, cleanup() { drag = null; } };
}

export function pagination(root, { on }) {
  let current = Number(root.querySelector('[aria-current="page"]')?.dataset.page ?? 1);
  const setPage = page => {
    if (!Number.isInteger(page) || page < 1) throw new RangeError("page must be a positive integer");
    current = page;
    all(root, "[data-page]").forEach(control => { if (Number(control.dataset.page) === page) control.setAttribute("aria-current", "page"); else control.removeAttribute("aria-current"); });
    const output = root.querySelector(".pagination-status-current"); if (output) output.textContent = String(page);
  };
  on(root, "click", event => {
    const control = event.target.closest("[data-page]"); if (!control || !enabled(control)) return;
    const page = Number(control.dataset.page); setPage(page);
    if (!root.emit("page", { page })) event.preventDefault();
  });
  return { get page() { return current; }, set page(value) { setPage(value); } };
}
