/* Rehype plugin for the spec Markdown:
   - shifts headings so the page outline stays h1 > h2 (doc or family) > h3
     (component) > h4 (sections): documents shift by one, components by two;
   - wraps `{token.path}` references in prose as <code data-token> so the
     inspector can resolve them;
   - strips the @compact markers, which are for the export builders. */

import { anchorFor } from "../../scripts/lib/anchors.mjs";
const SHIFT = { doc: 1, component: 2 };
const TOKEN = /\{([a-z0-9][a-z0-9.-]*)\}/g;

const pathOf = (file) => String(file?.path ?? file?.history?.[0] ?? "").replaceAll("\\", "/");

const kindOf = (file) => {
  const p = pathOf(file);
  if (p.includes("/spec/components/")) return "component";
  if (p.includes("/spec/") || p.includes("/agents/")) return "doc";
  return null;
};

const stemOf = (file) => pathOf(file).replace(/^.*\//, "").replace(/\.md$/, "");

const walk = (node, fn) => {
  fn(node);
  for (const child of node.children ?? []) walk(child, fn);
};

const textOf = (node) => (node.type === "text" ? node.value : (node.children ?? []).map(textOf).join(""));

const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function rehypeSpec() {
  return (tree, file) => {
    const kind = kindOf(file);
    if (!kind) return;
    const by = SHIFT[kind];
    const prefix = `${kind === "component" ? "c" : "d"}-${stemOf(file)}--`;
    walk(tree, (node) => {
      if (node.type === "element" && /^h[1-6]$/.test(node.tagName)) {
        node.tagName = `h${Math.min(6, Number(node.tagName[1]) + by)}`;
        /* heading ids are namespaced by their source so "Keyboard" in two
           documents never collides; every id on the page must be unique */
        node.properties ??= {};
        const own = node.properties.id ?? slug(textOf(node));
        node.properties.id = `${prefix}${own}`;
        const decision = stemOf(file) === "decisions" && textOf(node).match(/^(D-\d{3})\b/);
        if (decision) node.properties.id = anchorFor.decision(decision[1]);
      }
      if (node.type === "comment" && /@compact:(start|end)/.test(node.value)) node.value = "";
    });
    const rewrite = (parent) => {
      if (!parent.children) return;
      const next = [];
      for (const child of parent.children) {
        if (child.type === "element" && child.tagName === "table") {
          child.properties ??= {};
          child.properties.className = [...(child.properties.className ?? []), "spec-table"];
          rewrite(child);
          next.push({ type: "element", tagName: "div", properties: { className: ["table-scroll"], tabIndex: 0, role: "region", ariaLabel: "Specification table" }, children: [child] });
          continue;
        }
        if (child.type === "text" && TOKEN.test(child.value) && parent.tagName !== "code" && parent.tagName !== "pre") {
          TOKEN.lastIndex = 0;
          let last = 0;
          for (const match of child.value.matchAll(TOKEN)) {
            if (match.index > last) next.push({ type: "text", value: child.value.slice(last, match.index) });
            next.push({ type: "element", tagName: "code", properties: { dataToken: match[1] }, children: [{ type: "text", value: match[1] }] });
            last = match.index + match[0].length;
          }
          if (last < child.value.length) next.push({ type: "text", value: child.value.slice(last) });
        } else {
          rewrite(child);
          next.push(child);
        }
      }
      parent.children = next;
    };
    rewrite(tree);
  };
}
