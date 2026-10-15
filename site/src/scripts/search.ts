/* Lazy static search; failures leave the index retryable on focus or input. */
import { loadSearchIndex, type SearchEntry } from "./search-loader";
import { refreshVisibility } from "./filter";
export const initSearch = (): void => {
  const input = document.getElementById("search") as HTMLInputElement | null;
  const count = document.getElementById("search-count");
  if (!input || !count) return;
  let entries: SearchEntry[] = [];
  let tokenHits = 0;
  const announce = (shown: number) => { count.textContent = input.value.trim() ? `${shown} component${shown === 1 ? "" : "s"}${tokenHits ? `, ${tokenHits} tokens` : ""}` : ""; };
  document.addEventListener("reference-visibility", (event) => announce((event as CustomEvent<number>).detail));
  const apply = () => {
    const q = input.value.trim().toLowerCase();
    const matching = new Set(entries.filter((entry) => entry.text.includes(q) || entry.id.includes(q)).map((entry) => entry.id));
    document.querySelectorAll<HTMLElement>("section.component").forEach((section) => { section.dataset.searchMatch = String(!q || matching.has(section.dataset.component ?? "") || (section.dataset.keywords ?? "").includes(q)); });
    tokenHits = q ? entries.filter((entry) => entry.kind === "token" && (entry.text.includes(q) || entry.id.includes(q))).length : 0;
    refreshVisibility();
  };
  const run = async () => {
    try { entries = (await loadSearchIndex()).entries; apply(); }
    catch { count.textContent = "Search index unavailable. Focus or type to retry; all sections remain readable."; }
  };
  input.addEventListener("focus", () => void run());
  input.addEventListener("input", () => {
    const url = new URL(location.href);
    if (input.value.trim()) url.searchParams.set("q", input.value.trim()); else url.searchParams.delete("q");
    history.replaceState(null, "", url);
    void run();
  });
  const initial = new URL(location.href).searchParams.get("q");
  if (initial) { input.value = initial; void run(); }
};
