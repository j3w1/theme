import { renderHexText } from "../../../scripts/lib/hex-literals.mjs";

const root = document.querySelector<HTMLElement>("[data-search-index]");
if (root) {
  const input = root.querySelector<HTMLInputElement>('[role="combobox"]')!;
  const list = root.querySelector<HTMLElement>('[role="listbox"]')!;
  const status = root.querySelector<HTMLElement>("[data-command-status]")!;
  const dialog = root.querySelector<HTMLDialogElement>("dialog")!;
  const indexUrl = new URL(root.dataset.searchIndex!, location.href);
  const base = new URL(".", indexUrl).pathname;
  const commandTarget = (href: string) => {
    const target = new URL(href, location.href);
    if (target.origin !== location.origin || !target.pathname.startsWith(base)) throw new Error("Command outside the theme");
    return target;
  };
  root.addEventListener("j3w1-command", event => {
    const action = (event as CustomEvent).detail?.action;
    if (event.defaultPrevented || typeof action !== "string") return;
    const target = commandTarget(action);
    event.preventDefault();
    location.assign(target.href);
  });
  let loaded = false;
  let pending: Promise<void> | null = null;
  const load = () => {
    if (loaded || pending) return;
    input.setAttribute("aria-busy", "true");
    pending = (async () => {
      try {
        const response = await fetch(indexUrl);
        if (!response.ok) throw new Error("Index unavailable");
        const entries = await response.json();
        if (!Array.isArray(entries)) throw new Error("Invalid index");
        const fragment = document.createDocumentFragment();
        for (const entry of entries) {
          if (typeof entry.id !== "string" || !/^[a-z0-9-]+$/.test(entry.id) || typeof entry.category !== "string" || typeof entry.label !== "string" || typeof entry.href !== "string" || (entry.value !== undefined && typeof entry.value !== "string")) throw new Error("Invalid command");
          const target = commandTarget(entry.href);
          const option = document.createElement("li");
          option.id = entry.id; option.setAttribute("role", "option"); option.tabIndex = -1; option.dataset.action = target.href;
          const category = document.createElement("span"); category.className = "portal-command-category"; category.textContent = entry.category + " ";
          const label = document.createElement("span"); label.className = "portal-command-label"; label.textContent = entry.label;
          if (entry.value) { const value = document.createElement("small"); value.className = "portal-command-value"; value.innerHTML = renderHexText(" " + entry.value); label.append(value); }
          option.append(category, label); fragment.append(option);
        }
        list.append(fragment);
        loaded = true;
        if (dialog.open) input.dispatchEvent(new Event("input", { bubbles: true }));
      } catch {
        status.textContent = "Search index unavailable. Section navigation remains available; reopen to retry.";
      } finally {
        input.removeAttribute("aria-busy");
        pending = null;
      }
    })();
  };
  input.addEventListener("focus", load);
  root.addEventListener("click", event => { if ((event.target as Element).closest("[data-open]")) load(); });
}
