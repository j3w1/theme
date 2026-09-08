import { renderHexText } from "../../../scripts/lib/hex-literals.mjs";

const root = document.querySelector<HTMLElement>("[data-search-index]");
if (root) {
  const input = root.querySelector<HTMLInputElement>('[role="combobox"]')!;
  const list = root.querySelector<HTMLElement>('[role="listbox"]')!;
  const status = root.querySelector<HTMLElement>("[data-command-status]")!;
  const dialog = root.querySelector<HTMLDialogElement>("dialog")!;
  let loaded = false;
  let pending: Promise<void> | null = null;
  const load = () => {
    if (loaded || pending) return;
    input.setAttribute("aria-busy", "true");
    pending = (async () => {
      try {
        const indexUrl = new URL(root.dataset.searchIndex!, location.href);
        const base = new URL(".", indexUrl).pathname;
        const response = await fetch(indexUrl);
        if (!response.ok) throw new Error("Index unavailable");
        const entries = await response.json();
        if (!Array.isArray(entries)) throw new Error("Invalid index");
        const fragment = document.createDocumentFragment();
        for (const entry of entries) {
          if (typeof entry.id !== "string" || !/^[a-z0-9-]+$/.test(entry.id) || typeof entry.category !== "string" || typeof entry.label !== "string" || typeof entry.href !== "string" || (entry.value !== undefined && typeof entry.value !== "string")) throw new Error("Invalid command");
          const target = new URL(entry.href, location.href);
          if (target.origin !== location.origin || !target.pathname.startsWith(base)) throw new Error("Command outside the theme");
          const option = document.createElement("li");
          option.id = entry.id; option.setAttribute("role", "option"); option.tabIndex = -1;
          const category = document.createElement("span"); category.className = "portal-command-category"; category.textContent = entry.category + " ";
          const link = document.createElement("a"); link.href = target.href; link.tabIndex = -1; link.textContent = entry.label;
          if (entry.value) { const value = document.createElement("small"); value.className = "portal-command-value"; value.innerHTML = renderHexText(" " + entry.value); link.append(value); }
          option.append(category, link); fragment.append(option);
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
