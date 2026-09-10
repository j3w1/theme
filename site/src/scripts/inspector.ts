/* Token inspector: hovering or focusing any [data-token] element shows the
   role's path, CSS variable, resolved value per profile, alias and status,
   read from the JSON the layout embedded. Escape closes it. The same data is
   in the token tables, so nothing is lost without JavaScript. */

import { anchorFor } from "../../../scripts/lib/anchors.mjs";
import { renderHexText, escapeHtml } from "../../../scripts/lib/hex-literals.mjs";
import { withBase } from "../lib/base";
type Row = [css: string, aliasOf: string, status: string, description: string, eligibility: { action: string; reason: string; decisionIds: string[] }, deprecated: boolean | string];
type Match = { profile: string; path: string };
type Data = { defaultProfile: string; version: string; profiles: Record<string, Record<string, Row>>; colorIndex: Record<string, Match[]> };

export const initInspector = (): void => {
  const box = document.getElementById("inspector");
  const raw = document.getElementById("j3w1-tokens")?.textContent;
  if (!box || !raw) return;
  const data = JSON.parse(raw) as Data;
  const preview = document.createElement("div");
  preview.id = "hex-popup";
  preview.className = "inspector hex-popup";
  preview.setAttribute("aria-hidden", "true");
  preview.hidden = true;
  document.body.append(preview);
  let circle: HTMLElement | null = null;
  let pointer = { x: 0, y: 0 };
  let frame = 0;
  const closePreview = () => { preview.hidden = true; circle = null; };

  /* One placement rule for every hover popup on the page: sit beside the
     pointer, flip to the other side when the popup would leave the viewport,
     and never touch the edge. A popup opened from the keyboard has no pointer
     and anchors to its element instead — see placeByElement. */
  const axis = (point: number, size: number, limit: number) => Math.max(8, Math.min(point + 8 + size <= limit - 8 ? point + 8 : point - size - 8, limit - size - 8));
  const placeByPointer = (popup: HTMLElement, at: { x: number; y: number }) => {
    const { width, height } = popup.getBoundingClientRect();
    popup.style.left = `${axis(at.x, width, innerWidth)}px`;
    popup.style.top = `${axis(at.y, height, innerHeight)}px`;
  };
  const placeByElement = (popup: HTMLElement, target: HTMLElement) => {
    const rect = target.getBoundingClientRect();
    const width = Math.min(384, innerWidth - 16);
    popup.style.left = `${Math.max(8, Math.min(rect.left, innerWidth - width - 8))}px`;
    popup.style.top = `${rect.bottom + 6 + popup.offsetHeight > innerHeight ? Math.max(8, rect.top - popup.offsetHeight - 6) : rect.bottom + 6}px`;
  };
  const placePreview = () => placeByPointer(preview, pointer);
  document.addEventListener("pointermove", (event) => {
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>(".hex-swatch[data-token-matches]") : null;
    if (!target || box.contains(target) || !["mouse", "pen"].includes(event.pointerType)) { closePreview(); return; }
    pointer = { x: event.clientX, y: event.clientY };
    if (circle !== target) {
      const matches = data.colorIndex[target.dataset.tokenMatches ?? ""] ?? [];
      preview.innerHTML = `<p>Exact value matches; equality does not assign a role.</p><ul>${matches.map((match) => `<li>${escapeHtml(match.profile)}: <code>${escapeHtml(match.path)}</code></li>`).join("")}</ul>`;
      circle = target;
    }
    box.hidden = true;
    preview.hidden = false;
    placePreview();
  });
  document.addEventListener("pointerout", (event) => {
    if (circle && (!(event.relatedTarget instanceof Node) || !circle.contains(event.relatedTarget))) closePreview();
  });
  const revalidate = () => {
    if (!circle || frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (!circle) return;
      const hit = document.elementFromPoint(pointer.x, pointer.y);
      if (!hit || !circle.contains(hit)) closePreview();
      else placePreview();
    });
  };
  document.addEventListener("scroll", revalidate, { capture: true, passive: true });
  window.addEventListener("resize", revalidate);
  window.addEventListener("blur", closePreview);
  document.addEventListener("pointerdown", closePreview);
  document.addEventListener("pointercancel", closePreview);
  document.addEventListener("visibilitychange", () => { if (document.hidden) closePreview(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closePreview(); });
  let current: HTMLElement | null = null;
  const text = (value: string) => renderHexText(value, data.colorIndex);

  const show = (target: HTMLElement, byPointer = false) => {
    if (box.contains(target)) return;
    const path = target.dataset.token ?? "";
    const profiles = Object.entries(data.profiles);
    const main = data.profiles[data.defaultProfile]?.[path];
    if (target.dataset.tokenMatches) {
      const matches = data.colorIndex[target.dataset.tokenMatches] ?? [];
      box.innerHTML = `<p>Exact value matches; equality does not assign a role.</p><ul>${matches.map((match) => `<li>${escapeHtml(match.profile)}: <a href="#${anchorFor.token(match.path)}"><code>${escapeHtml(match.path)}</code></a></li>`).join("")}</ul>`;
    } else {
      if (!main) return;
      const rows = profiles.map(([id, tokens]) => `<dt>${escapeHtml(id)}</dt><dd><code>${text(tokens[path]?.[0] ?? "—")}</code> ${escapeHtml(tokens[path]?.[2] ?? "unresolved")} ${tokens[path]?.[4].action ?? "blocked"}${tokens[path]?.[5] ? " deprecated" : ""} ${(tokens[path]?.[4].decisionIds ?? []).map((id) => `<a href="#${anchorFor.decision(id)}">${id}</a>`).join(" ")}</dd>`).join("");
      box.innerHTML = `<dl><dt>role</dt><dd><code>${escapeHtml(path)}</code></dd><dt>css</dt><dd><code>--${escapeHtml(path.replaceAll(".", "-"))}</code></dd>${rows}<dt>alias of</dt><dd><code>${escapeHtml(main[1] || "—")}</code></dd><dt>status</dt><dd>${escapeHtml(main[2])}</dd>${main[3] ? `<dt>use</dt><dd>${text(main[3])}</dd>` : ""}<dt>anchor</dt><dd><a href="#${anchorFor.token(path)}">#${anchorFor.token(path)}</a></dd></dl>`;
    }
    if (main) {
      const link = document.createElement("a");
      link.href = withBase(`tokens/${encodeURIComponent(path)}/`);
      link.textContent = "Full usage and source details";
      box.append(link);
    }
    box.hidden = false;
    if (byPointer) placeByPointer(box, pointer);
    else placeByElement(box, target);
    current = target;
  };

  const hide = () => {
    box.hidden = true;
    current = null;
  };

  /* Hover follows the pointer, so the panel tracks the cursor across a wide
     token table rather than pinning to wherever the row happens to start. */
  document.addEventListener("pointermove", (event) => {
    if (!["mouse", "pen"].includes(event.pointerType)) return;
    if ((event.target as HTMLElement).closest(".hex-swatch")) return;
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-token]");
    if (!target) return;
    pointer = { x: event.clientX, y: event.clientY };
    if (target === current) placeByPointer(box, pointer);
    else show(target, true);
  });
  document.addEventListener("mouseout", (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-token]");
    if (target && target === current && !box.matches(":hover")) hide();
  });
  document.addEventListener("focusin", (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-token]");
    /* Keyboard focus has no pointer to follow; anchor to the element. */
    if (target) show(target, false);
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
