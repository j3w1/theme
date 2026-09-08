import { all, make, enabled } from "../internal/dom.js";

export function avatar(root, { on }) {
  const frame = root.querySelector(".avatar"), fallback = root.querySelector("[data-avatar-fallback]");
  if (!frame || !fallback) return {};
  let image = frame.querySelector("img");
  if (!image) { image = make(root, "img", { alt: "", hidden: "" }); frame.prepend(image); }
  let source = image.getAttribute("src") ?? "";
  const update = value => {
    source = String(value ?? ""); image.hidden = true; fallback.hidden = false;
    delete frame.dataset.error;
    if (!source) { image.removeAttribute("src"); delete frame.dataset.loading; return; }
    frame.dataset.loading = "true"; image.src = source;
  };
  on(image, "load", () => { delete frame.dataset.loading; image.hidden = false; fallback.hidden = true; });
  on(image, "error", () => { delete frame.dataset.loading; frame.dataset.error = "true"; image.hidden = true; fallback.hidden = false; });
  update(root.getAttribute("src") ?? source);
  return { get src() { return source; }, set src(value) { update(value); }, attributeChanged(name) { if (name === "src") update(root.getAttribute("src")); } };
}

export function chart(root) {
  const figure = root.querySelector("figure"), svg = figure?.querySelector("svg"), tbody = figure?.querySelector("tbody");
  if (!figure || !svg || !tbody) return {};
  let values = all(tbody, "tr").map(row => ({ label: row.cells[0]?.textContent.trim() ?? "", value: Number(row.cells[1]?.textContent) }));
  const update = data => {
    if (!Array.isArray(data) || data.length > 200 || data.some(row => typeof row.label !== "string" || typeof row.value !== "number" || !Number.isFinite(row.value) || row.value < 0)) throw new TypeError("data must contain at most 200 labelled finite non-negative values");
    values = data.map(row => ({ label: row.label, value: row.value }));
    svg.replaceChildren(); tbody.replaceChildren();
    const ns = "http://www.w3.org/2000/svg";
    const group = root.ownerDocument.createElementNS(ns, "g"); group.setAttribute("class", "chart-series"); svg.append(group);
    const width = Math.max(300, values.length * 32), max = Math.max(1, ...values.map(row => row.value));
    svg.setAttribute("viewBox", `0 0 ${width} 140`);
    svg.setAttribute("aria-label", values.length ? values.map(row => `${row.label}: ${row.value}`).join("; ") : "No data available");
    for (const [index, row] of values.entries()) {
      const bar = root.ownerDocument.createElementNS(ns, "rect"), step = (width - 20) / values.length, height = row.value / max * 100;
      for (const [name, value] of Object.entries({ x: 10 + index * step + step * 0.15, y: 110 - height, width: step * 0.7, height })) bar.setAttribute(name, String(value));
      const title = root.ownerDocument.createElementNS(ns, "title"); title.textContent = `${row.label}: ${row.value}`; bar.append(title); group.append(bar);
      const tr = make(root, "tr"); tr.append(make(root, "th", { scope: "row" }, row.label), make(root, "td", {}, row.value)); tbody.append(tr);
    }
    svg.toggleAttribute("hidden", !values.length);
    const empty = figure.querySelector("[data-chart-empty]"); if (empty) empty.hidden = values.length !== 0;
  };
  return { get data() { return values.map(row => ({ ...row })); }, set data(data) { update(data); } };
}

export function editorSearch(root, { on }) {
  const input = root.querySelector("[data-query]"), pre = root.querySelector("[data-source]"), status = root.querySelector("[data-search-status]");
  if (!input || !pre) return {};
  let source = pre.textContent, current = -1, matches = [];
  const previous = root.querySelector("[data-previous]"), following = root.querySelector("[data-next]");
  const select = index => {
    current = matches.length ? (index + matches.length) % matches.length : -1;
    all(pre, "mark").forEach((mark, i) => mark.toggleAttribute("data-current", i === current));
    if (status) status.textContent = !input.value ? "Enter text to search." : matches.length ? `Match ${current + 1} of ${matches.length}` : "No matches.";
  };
  const search = () => {
    matches = []; pre.replaceChildren();
    const query = input.value.toLocaleLowerCase();
    // Preserve original UTF-16 offsets even when case folding changes length.
    let folded = "", offset = 0; const starts = [], ends = [];
    for (const char of source) { const text = char.toLocaleLowerCase(); for (let i = 0; i < text.length; i++) { starts.push(offset); ends.push(offset + char.length); } folded += text; offset += char.length; }
    if (query) {
      let position = 0;
      while ((position = folded.indexOf(query, position)) >= 0) {
        const start = starts[position], end = ends[position + query.length - 1];
        if (!matches.length || start >= matches.at(-1).end) matches.push({ start, end });
        position += query.length;
      }
    }
    let cursor = 0;
    for (const match of matches) { pre.append(root.ownerDocument.createTextNode(source.slice(cursor, match.start)), make(root, "mark", {}, source.slice(match.start, match.end))); cursor = match.end; }
    pre.append(root.ownerDocument.createTextNode(source.slice(cursor)));
    if (previous) previous.disabled = !matches.length; if (following) following.disabled = !matches.length;
    select(0);
  };
  const next = (direction = 1) => { if (!matches.length) return; select(current + (direction < 0 ? -1 : 1)); all(pre, "mark")[current]?.scrollIntoView({ block: "nearest", inline: "nearest" }); };
  on(input, "input", search);
  on(input, "keydown", event => { if (event.key === "Enter") { event.preventDefault(); next(event.shiftKey ? -1 : 1); } else if (event.key === "Escape" && input.value) { event.preventDefault(); event.stopPropagation(); input.value = ""; search(); } });
  on(previous, "click", () => next(-1)); on(following, "click", () => next());
  search();
  return { next, get source() { return source; }, set source(text) { source = String(text); search(); }, get query() { return input.value; }, set query(value) { input.value = String(value); search(); }, get matchCount() { return matches.length; } };
}

export function developerView(root, { on }) {
  on(root, "click", event => { const action = event.target.closest("button,[data-action]"); if (action && enabled(action)) root.emit("action", { action: action.dataset.action ?? action.textContent.trim() }); });
  return { setText(text) {
    let pre = root.querySelector("pre");
    if (!pre) { pre = make(root, "pre", { class: "j3w1-readonly-text", tabindex: "0", "aria-label": "Read-only text" }); const view = root.firstElementChild; view.replaceChildren(pre); }
    pre.textContent = String(text);
  } };
}
