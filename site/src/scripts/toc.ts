/* Marks the contents entry of the section currently in view with
   aria-current, and collapses the contents disclosure on narrow screens. */

export const initToc = (): void => {
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("#toc a[href^='#']"));
  if (!links.length || !("IntersectionObserver" in window)) return;
  const byId = new Map(links.map((l) => [l.getAttribute("href")!.slice(1), l]));
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        links.forEach((l) => l.removeAttribute("aria-current"));
        byId.get(entry.target.id)?.setAttribute("aria-current", "true");
      }
    },
    { rootMargin: "0px 0px -70% 0px" },
  );
  for (const id of byId.keys()) {
    const target = document.getElementById(id);
    if (target) observer.observe(target);
  }
  const details = document.querySelector<HTMLDetailsElement>("#toc details");
  if (details && window.matchMedia("(max-width: 899px)").matches) details.open = false;
};
