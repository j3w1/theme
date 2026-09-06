/* Build-time search index: components, documents and token paths. Fetched by
   scripts/search.ts on first focus of the search field. */

import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { anchorFor } from "../../../scripts/lib/anchors.mjs";
import { defaultTokens } from "../lib/theme";

export const GET: APIRoute = async () => {
  const components = (await getCollection("components")).map((c) => ({
    kind: "component",
    id: c.data.id,
    anchor: anchorFor.component(c.data.id),
    title: c.data.name,
    family: c.data.family,
    text: [c.data.name, c.data.summary, ...c.data.keywords, ...c.data.states].join(" ").toLowerCase(),
  }));
  const docs = (await getCollection("docs")).map((d) => ({
    kind: "doc",
    id: d.data.id,
    anchor: anchorFor.doc(d.data.id),
    title: d.data.title,
    family: null,
    text: [d.data.title, d.data.summary].join(" ").toLowerCase(),
  }));
  const tokens = Object.entries(defaultTokens).map(([path, t]) => ({
    kind: "token",
    id: path,
    anchor: anchorFor.token(path),
    title: path,
    family: null,
    text: [path, t.css, t.description ?? ""].join(" ").toLowerCase(),
  }));
  return new Response(JSON.stringify({ entries: [...docs, ...components, ...tokens] }), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
};
