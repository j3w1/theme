/* Token inspector: hovering or focusing any [data-token] element shows the
   role's path, CSS variable, resolved value per profile, alias and status,
   fetched from shared static data on first interaction. A click or Enter pins
   it; Escape closes it. The same data is in the token tables, so nothing is
   lost without JavaScript. */

import { anchorFor } from "../../../scripts/lib/anchors.mjs";
import { loadStaticJson } from "./search-loader";
import { renderHexText, escapeHtml } from "../../../scripts/lib/hex-literals.mjs";
import { withBase } from "../lib/base";
import { hoverHelper } from "@j3w1/ui/enhance/hover-helper";
type Row = [css: string, aliasOf: string, status: string, description: string, eligibility: { action: string; reason: string; decisionIds: string[] }, deprecated: boolean | string];
type Match = { profile: string; path: string };
type Data = { defaultProfile: string; version: string; profiles: Record<string, Record<string, Row>>; colorIndex: Record<string, Match[]> };

export const initInspector = (): void => {
  const box = document.getElementById("inspector");
  const source = box?.dataset.inspectorSource;
  if (!box || !source) return;
  let data: Data | undefined;
  let loading: Promise<Data> | undefined;
  const load = () => (loading ??= loadStaticJson<Data>(source).then((value) => (data = value), (error) => { loading = undefined; throw error; }));
  const preview = document.createElement("div");
  preview.id = "hex-popup";
  preview.className = "inspector hex-popup";
  preview.setAttribute("aria-hidden", "true");
  preview.hidden = true;
  document.body.append(preview);
  const text = (value: string) => renderHexText(value, data!.colorIndex);

  /* Every hover helper on the site runs the one shared algorithm (D-042,
     foundations, Hover helpers): it follows the pointer, closes when the
     pointer leaves its trigger, scrolls with the wheel over the trigger, and
     pins on click when it overflows or holds links. */

  /* The colour circle's preview (D-014): mouse and pen only, no keyboard stop,
     no links; it pins only when its list of matches overflows. */
  const fillPreview = (target: Element) => {
    const matches = data!.colorIndex[(target as HTMLElement).dataset.tokenMatches ?? ""] ?? [];
    preview.innerHTML = `<p>Exact value matches; equality does not assign a role.</p><ul>${matches.map((match) => `<li>${escapeHtml(match.profile)}: <code>${escapeHtml(match.path)}</code></li>`).join("")}</ul>`;
  };
  hoverHelper(preview, {
    trigger: (node) => {
      const swatch = node.closest<HTMLElement>(".hex-swatch[data-token-matches]");
      return swatch && !box.contains(swatch) ? swatch : null;
    },
    openDelay: 0,
    focus: false,
    touch: false,
    label: () => "Exact value matches",
    render: (target) => data ? fillPreview(target) : load().then(() => fillPreview(target)),
  });

  /* The token inspector holds links, so a click, tap or Enter on a token pins
     it; the pinned panel's first link is the token's own page. */
  const showToken = (target: Element) => {
    const el = target as HTMLElement;
    const path = el.dataset.token ?? "";
    const profiles = Object.entries(data!.profiles);
    const main = data!.profiles[data!.defaultProfile]?.[path];
    if (el.dataset.tokenMatches) {
      const matches = data!.colorIndex[el.dataset.tokenMatches] ?? [];
      box.innerHTML = `<p>Exact value matches; equality does not assign a role.</p><ul>${matches.map((match) => `<li>${escapeHtml(match.profile)}: <a href="${withBase("tokens/")}#${anchorFor.token(match.path)}"><code>${escapeHtml(match.path)}</code></a></li>`).join("")}</ul>`;
    } else {
      if (!main) return false;
      const rows = profiles.map(([id, tokens]) => `<dt>${escapeHtml(id)}</dt><dd><code>${text(tokens[path]?.[0] ?? "—")}</code> ${escapeHtml(tokens[path]?.[2] ?? "unresolved")} ${tokens[path]?.[4].action ?? "blocked"}${tokens[path]?.[5] ? " deprecated" : ""} ${(tokens[path]?.[4].decisionIds ?? []).map((id) => `<a href="${withBase("reference/decisions/")}#${anchorFor.decision(id)}">${id}</a>`).join(" ")}</dd>`).join("");
      box.innerHTML = `<dl><dt>role</dt><dd><code>${escapeHtml(path)}</code></dd><dt>css</dt><dd><code>--${escapeHtml(path.replaceAll(".", "-"))}</code></dd>${rows}<dt>alias of</dt><dd><code>${escapeHtml(main[1] || "—")}</code></dd><dt>status</dt><dd>${escapeHtml(main[2])}</dd>${main[3] ? `<dt>use</dt><dd>${text(main[3])}</dd>` : ""}<dt>anchor</dt><dd><a href="${withBase("reference/")}#${anchorFor.token(path)}">#${anchorFor.token(path)}</a></dd></dl>`;
    }
    if (main) {
      const link = document.createElement("a");
      link.href = withBase(`tokens/${encodeURIComponent(path)}/`);
      link.textContent = "Full usage and source details";
      box.append(link);
    }
    return true;
  };
  const inspector = hoverHelper(box, {
    trigger: (node) => node.closest(".hex-swatch") ? null : node.closest<HTMLElement>("[data-token]"),
    openDelay: 0,
    pin: true,
    label: (target) => `Token inspector: ${(target as HTMLElement).dataset.token ?? ""}`,
    render: (target) => data ? showToken(target) : load().then(() => showToken(target)),
  });

  /* Native role links in tables/grids already have a keyboard stop. Prose
     references remain readable text; do not add thousands of duplicate stops. */
  document.querySelectorAll<HTMLElement>("a[data-token]").forEach((el) => { el.setAttribute("aria-describedby", "inspector"); });
  /* A native token link can receive focus before this enhancement loads.
     Preserve that focus and restore the missed inspector, without refocusing. */
  const focused = document.activeElement instanceof HTMLElement
    ? document.activeElement.closest<HTMLElement>("[data-token]") : null;
  if (focused) void inspector.show(focused);
};
