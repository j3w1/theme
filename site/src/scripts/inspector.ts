/* Token inspector: hovering or focusing any [data-token] element shows the
   role's path, CSS variable, resolved value per profile, alias and status,
   read from the JSON the layout embedded. Escape closes it. The same data is
   in the token tables, so nothing is lost without JavaScript. */

import { anchorFor } from "../../../scripts/lib/anchors.mjs";
type Row = [css: string, aliasOf: string, status: string, description: string, eligibility: { action: string; reason: string; decisionIds: string[] }, deprecated: boolean | string];
type Data = { defaultProfile: string; version: string; profiles: Record<string, Record<string, Row>> };

export const initInspector = (): void => {
  const box = document.getElementById("inspector");
  const raw = document.getElementById("j3w1-tokens")?.textContent;
  if (!box || !raw) return;
  const data = JSON.parse(raw) as Data;
  let current: HTMLElement | null = null;

  const show = (target: HTMLElement) => {
    const path = target.dataset.token ?? "";
    const profiles = Object.entries(data.profiles);
    const main = data.profiles[data.defaultProfile]?.[path];
    if (!main) return;
    const rows = profiles.map(([id, tokens]) => `<dt>${id}</dt><dd><code>${tokens[path]?.[0] ?? "—"}</code>${tokens[path]?.[2] === "proposed" ? ' <span class="tag tag-proposed">proposed</span>' : ""} ${tokens[path]?.[4].action ?? "blocked"}${tokens[path]?.[5] ? " deprecated" : ""} ${(tokens[path]?.[4].decisionIds ?? []).map((id) => `<a href="#${anchorFor.decision(id)}">${id}</a>`).join(" ")}</dd>`).join("");
    box.innerHTML = `<dl><dt>role</dt><dd><code>${path}</code></dd><dt>css</dt><dd><code>--${path.replaceAll(".", "-")}</code></dd>${rows}<dt>alias of</dt><dd><code>${main[1] || "—"}</code></dd><dt>status</dt><dd>${main[2]}</dd>${main[3] ? `<dt>use</dt><dd>${main[3]}</dd>` : ""}<dt>anchor</dt><dd><a href="#t-${path.replaceAll(".", "-")}">#t-${path.replaceAll(".", "-")}</a></dd></dl>`;
    const rect = target.getBoundingClientRect();
    box.hidden = false;
    const width = Math.min(384, window.innerWidth - 16);
    box.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))}px`;
    box.style.top = `${rect.bottom + 6 + box.offsetHeight > window.innerHeight ? Math.max(8, rect.top - box.offsetHeight - 6) : rect.bottom + 6}px`;
    current = target;
  };

  const hide = () => {
    box.hidden = true;
    current = null;
  };

  document.addEventListener("mouseover", (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-token]");
    if (target) show(target);
  });
  document.addEventListener("mouseout", (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-token]");
    if (target && target === current && !box.matches(":hover")) hide();
  });
  document.addEventListener("focusin", (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-token]");
    if (target) show(target);
    else if (!box.contains(event.target as Node)) hide();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !box.hidden) hide();
  });
  document.querySelectorAll<HTMLElement>("[data-token]").forEach((el) => {
    if (!el.hasAttribute("tabindex")) el.tabIndex = 0;
    el.setAttribute("aria-describedby", "inspector");
  });
};
