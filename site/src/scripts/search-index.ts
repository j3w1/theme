/* One build-time index serves both the hub and command palette. */
import { getCollection } from "astro:content";
import { defaultTokens } from "../lib/theme";
import { withBase } from "../lib/base";
import { anchorFor } from "../../../scripts/lib/anchors.mjs";
import ports from "../../../exports/port-capabilities.json";

export async function searchIndex() {
  const entries: Record<string, unknown>[] = [];
  const categories: Record<string, string> = { component: "COMP", doc: "SPEC" };
  const add = (kind: string, id: string, title: string, path: string, text: string, family: string | null = null, anchor = "", value?: string) => entries.push({ kind, id, title, label: title, category: categories[kind] ?? kind.toUpperCase(), href: withBase(path), text: text.toLowerCase(), family, anchor, ...(value ? { value } : {}) });
  for (const c of (await getCollection("components")).sort((a, b) => a.id.localeCompare(b.id, "en"))) add("component", c.data.id, `${c.data.name} / ${c.data.id}`, `components/${c.data.id}/`, [c.data.name, c.data.summary, ...c.data.keywords, ...c.data.states].join(" "), c.data.family, anchorFor.component(c.data.id));
  const docs = (await getCollection("docs")).sort((a, b) => a.data.order - b.data.order);
  for (const d of docs) add("doc", d.data.id, d.data.title, `reference/${d.data.id === "decisions" ? "decisions/" : ""}#${anchorFor.doc(d.data.id)}`, `${d.data.title} ${d.data.summary}`, null, anchorFor.doc(d.data.id));
  for (const match of (docs.find((d) => d.data.id === "decisions")?.body ?? "").matchAll(/^## (D-\d+)\s+(.+)$/gm)) add("decision", match[1], `${match[1]} ${match[2]}`, `reference/decisions/#${anchorFor.decision(match[1])}`, match[0], null, anchorFor.decision(match[1]));
  for (const [path, t] of Object.entries(defaultTokens).sort(([a], [b]) => a.localeCompare(b, "en"))) add("token", path, path, `tokens/${path}/`, `${path} ${t.css} ${t.description ?? ""}`, null, anchorFor.token(path), t.css);
  for (const [path, label] of [["workbench/", "State workbench, viewport and contrast lab"], ["builder/", "Form builder"], ["kit/", "Mapping task kit"], ["figma/", "Figma Variables bridge"], ["verification/", "Execution evidence"], ["recipes/", "Standalone HTML recipes"], ["reference/contrast/", "Computed contrast pairs"], ["reference/fixtures/", "Stress fixtures and non-examples"], ["patterns/validation-recovery/", "Validation and recovery"], ["agents/", "Component package, copy and mapping kits"], ["implement/", "Installation and framework integration"], ["ports/", "Port capabilities and mapping evidence"], ["releases/", "Pinned release comparison"]]) add("tool", path, label, path, label);
  for (const port of ports.ports) add("port", port.id, port.displayName, `ports/${port.id}/`, `${port.displayName} ${port.format} ${port.os.join(" ")}`);
  return { entries: entries.map((entry, index) => ({ ...entry, commandId: anchorFor.uiExample("portal", `search-${index}`) })) };
}
export async function searchResponse() {
  return new Response(JSON.stringify(await searchIndex()), { headers: { "Content-Type": "application/json; charset=utf-8" } });
}
