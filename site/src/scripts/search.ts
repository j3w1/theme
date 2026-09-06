/* Search over a build-time index (components, documents, tokens). Fetched on
   first focus of the field; results hide non-matching component sections and
   contents entries, and announce the count. The query lives in ?q= so a
   filtered view can be shared. Without JavaScript the contents and the
   browser's own find remain. */

type Entry = { kind: string; id: string; anchor: string; title: string; family: string | null; text: string };

const base = (): string => {
  const link = document.querySelector<HTMLLinkElement>('link[rel="alternate"][type="text/markdown"]');
  const href = link?.getAttribute("href") ?? "/theme/exports/theme.compact.md";
  return href.replace(/exports\/theme\.compact\.md$/, "");
};

export const initSearch = (): void => {
  const input = document.getElementById("search") as HTMLInputElement | null;
  const count = document.getElementById("search-count");
  if (!input || !count) return;
  let entries: Entry[] | null = null;
  let loading: Promise<Entry[]> | null = null;

  const load = (): Promise<Entry[]> => {
    if (entries) return Promise.resolve(entries);
    loading ??= fetch(`${base()}search-index.json`)
      .then((r) => r.json())
      .then((json: { entries: Entry[] }) => (entries = json.entries));
    return loading;
  };

  const apply = (query: string) => {
    const q = query.trim().toLowerCase();
    const sections = document.querySelectorAll<HTMLElement>("section.component");
    const tocLinks = document.querySelectorAll<HTMLElement>("[data-toc-component]");
    if (!q) {
      sections.forEach((s) => (s.hidden = false));
      tocLinks.forEach((l) => ((l.parentElement as HTMLElement).hidden = false));
      count.textContent = "";
      return;
    }
    const matching = new Set((entries ?? []).filter((e) => e.text.includes(q) || e.id.includes(q)).map((e) => e.id));
    let shown = 0;
    sections.forEach((s) => {
      const id = s.dataset.component ?? "";
      const hit = matching.has(id) || (s.dataset.keywords ?? "").includes(q);
      s.hidden = !hit;
      if (hit) shown += 1;
    });
    tocLinks.forEach((l) => {
      const id = l.dataset.tocComponent ?? "";
      (l.parentElement as HTMLElement).hidden = !(matching.has(id));
    });
    const tokenHits = (entries ?? []).filter((e) => e.kind === "token" && (e.text.includes(q) || e.id.includes(q)));
    count.textContent = `${shown} component${shown === 1 ? "" : "s"}${tokenHits.length ? `, ${tokenHits.length} token${tokenHits.length === 1 ? "" : "s"} (first: ${tokenHits[0].id})` : ""}`;
  };

  const sync = () => {
    const url = new URL(location.href);
    if (input.value.trim()) url.searchParams.set("q", input.value.trim());
    else url.searchParams.delete("q");
    history.replaceState(null, "", url);
  };

  input.addEventListener("focus", () => void load(), { once: true });
  input.addEventListener("input", () => {
    void load().then(() => {
      apply(input.value);
      sync();
    });
  });

  const initial = new URL(location.href).searchParams.get("q");
  if (initial) {
    input.value = initial;
    void load().then(() => apply(initial));
  }
};
