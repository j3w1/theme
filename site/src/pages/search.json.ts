import { getCollection } from "astro:content";
import { defaultTokens } from "../lib/theme";
import { withBase } from "../lib/base";
import { anchorFor } from "../../../scripts/lib/anchors.mjs";

export async function GET() {
  const entries: { category: string; label: string; href: string; value?: string }[] = [];
  const add = (category: string, label: string, path: string, value?: string) => entries.push({ category, label, href: withBase(path), ...(value ? { value } : {}) });
  for (const component of (await getCollection("components")).sort((a, b) => a.id.localeCompare(b.id, "en"))) add("COMP", `${component.data.name} / ${component.id}`, `components/${component.id}/`);
  for (const [name, token] of Object.entries(defaultTokens).sort(([a], [b]) => a.localeCompare(b, "en"))) add("TOKEN", name, `tokens/${name}/`, token.css);
  const docs = (await getCollection("docs")).sort((a, b) => a.data.order - b.data.order);
  for (const doc of docs) add("SPEC", doc.data.title, `reference/#${anchorFor.doc(doc.id)}`);
  for (const match of (docs.find(doc => doc.id === "decisions")?.body ?? "").matchAll(/^## (D-\d+)\s+(.+)$/gm)) add("DECISION", `${match[1]} ${match[2]}`, `reference/#${anchorFor.decision(match[1])}`);
  for (const [path, label] of [["workbench/", "State workbench, viewport and contrast lab"], ["builder/", "Form builder"], ["kit/", "Mapping task kit"], ["figma/", "Figma Variables bridge"], ["verification/", "Execution evidence"], ["recipes/", "Standalone HTML recipes"]]) add("TOOL", label, path);
  add("PATTERN", "Validation and recovery", "patterns/validation-recovery/");
  add("AGENT", "Component package, copy and mapping kits", "agents/");
  add("AGENT", "Installation and framework integration", "implement/");
  add("PORT", "Port capabilities and mapping evidence", "ports/");
  add("RELEASE", "Pinned release comparison", "releases/");
  return new Response(JSON.stringify(entries.map((entry, index) => ({ id: anchorFor.uiExample("portal", `search-${index}`), ...entry }))), { headers: { "Content-Type": "application/json; charset=utf-8" } });
}
