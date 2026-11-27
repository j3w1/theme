/* Every URL the built site emits must live under /theme/ or be a fragment,
   a relative path that resolves inside dist/, or an allowed external host.
   Root-absolute anything else would 404 on GitHub Pages. */

import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import test from "node:test";
import { listFiles, readJson, readText, repoRoot } from "../../scripts/lib/fs.mjs";
import { hashDestinations } from "../../apps/demo/src/navigation.js";
import { parse } from "parse5";
import { walkMarkup } from "../../scripts/lib/markup.mjs";

const manifest = await readJson("theme.json");
const base = `${manifest.site.base}/`;
const ALLOWED_HOSTS = ["github.com", "raw.githubusercontent.com", "api.github.com", "www.w3.org", "creativecommons.org", "keepachangelog.com", "www.designtokens.org", "docs.github.com", "docs.astro.build", "code.claude.com", "llmstxt.org", "www.jetbrains.com", "plugins.jetbrains.com", "developers.figma.com", "design-system.service.gov.uk"];

const distFiles = await listFiles("dist");
assert.ok(distFiles.length > 0, "dist/ is empty — run npm run build first");

const attrValues = (text, css = false) => {
  const out = [];
  const cssValues = source => { for (const m of source.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) out.push(m[1]); };
  if (css) cssValues(text);
  else walkMarkup(parse(text),node=>{
    for (const {name,value} of node.attrs??[]) {
      if (["href","src","srcset","action","poster","data-copy-brief"].includes(name)) out.push(value);
      if (node.tagName==="meta" && name==="content" && /^(https?:\/\/|\/)/.test(value))out.push(value);
      if (name==="style")cssValues(value);
    }
    if(node.tagName==="style")cssValues((node.childNodes??[]).map(child=>child.value??"").join(""));
  });
  return out;
};

const exists = async (relative) => {
  try {
    await fs.access(path.join(repoRoot, relative));
    return true;
  } catch {
    return false;
  }
};

test("no root-absolute URL escapes the base path, and every internal reference resolves", async () => {
  const problems = [];
  for (const file of distFiles.filter((f) => f.endsWith(".html") || f.endsWith(".css"))) {
    const text = await readText(file);
    for (const raw of attrValues(text, file.endsWith(".css"))) {
      const value = raw.trim();
      if (!value || value.startsWith("#") || value.startsWith("mailto:")) continue;
      if (/^https?:\/\//.test(value)) {
        const host = new URL(value).host;
        if (host === "j3w1.github.io" && !value.startsWith(manifest.site.url)) problems.push(`${file}: ${value} links to the user site outside ${manifest.site.url}`);
        else if (host !== "j3w1.github.io" && !ALLOWED_HOSTS.includes(host)) problems.push(`${file}: external host ${host} is not allowed`);
        continue;
      }
      if (value.startsWith("data:")) {
        problems.push(`${file}: data: URI ${value.slice(0, 40)}…`);
        continue;
      }
      if (value.startsWith("/")) {
        if (!value.startsWith(base)) {
          problems.push(`${file}: root-absolute ${value} does not start with ${base}`);
          continue;
        }
        const target = value.slice(base.length).split(/[?#]/)[0];
        const candidate = target === "" ? "dist/index.html" : `dist/${target}${target.endsWith("/") ? "index.html" : ""}`;
        if (!(await exists(candidate)) && !(await exists(`dist/${target}/index.html`))) problems.push(`${file}: ${value} does not resolve in dist/`);
        continue;
      }
      const dir = path.posix.dirname(file);
      const target = path.posix.normalize(path.posix.join(dir, value.split(/[?#]/)[0]));
      if (!(await exists(target)) && !(await exists(`${target}/index.html`))) problems.push(`${file}: relative ${value} does not resolve`);
    }
  }
  for (const file of distFiles.filter((f) => f.endsWith(".js"))) {
    const text = await readText(file);
    for (const m of text.matchAll(/["'`](\/(?!theme\/)[a-z0-9_./-]+)["'`]/gi)) {
      if (m[1].startsWith("/theme")) continue;
      // The Vue Router bundle contains registered hash destinations and its
      // protocol-relative URL sentinel. These are not HTTP resource requests.
      // portal.spec.js visits every destination and asserts actual request paths.
      if (file.startsWith("dist/demo/assets/") && (hashDestinations.includes(m[1]) || m[1] === "//")) continue;
      problems.push(`${file}: string literal ${m[1]} looks root-absolute`);
    }
  }
  assert.deepEqual(problems, []);
});

test("canonical, og:url and the nojekyll marker are correct", async () => {
  const html = await readText("dist/index.html");
  assert.match(html, new RegExp(`<link rel="canonical" href="${manifest.site.url.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}"`));
  assert.match(html, new RegExp(`property="og:url" content="${manifest.site.url.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}"`));
  assert.ok(await exists("dist/.nojekyll"));
  assert.ok(await exists("dist/index.html"));
  assert.ok(await exists("dist/404.html"));
});

/* R-j: fragments are part of the link contract, including links between pages. */
test("every same-site HTML link fragment names a real target on its destination", async () => {
  const pages = new Map();
  const inventory = await readJson("spec/inventory.json");
  for (const file of distFiles.filter((file) => file.endsWith(".html"))) {
    const ids = new Set(), links = [];
    walkMarkup(parse(await readText(file)), (node) => {
      for (const { name, value } of node.attrs ?? []) {
        if (name === "id") ids.add(value);
        if ((node.tagName === "a" || node.tagName === "area") && name === "href") links.push(value);
      }
    });
    pages.set(file, { ids, links });
  }
  const problems = new Set();
  for (const [file, { links }] of pages) {
    // These inert historical reconstructions are digest-recorded evidence,
    // not navigation. Keep their exact pinned bytes (coordinator direction).
    if (file.startsWith("dist/releases/specimens/")) continue;
    const relative = file.slice("dist/".length).replace(/index\.html$/, "");
    const from = new URL(relative, manifest.site.url);
    for (const href of links) {
      const target = new URL(href, from);
      if (target.origin !== new URL(manifest.site.url).origin || !target.pathname.startsWith(base) || !target.hash || target.hash === "#") continue;
      const route = decodeURIComponent(target.pathname.slice(base.length));
      const candidate = "dist/" + (route.endsWith("/") || !route ? route + "index.html" : route);
      const page = pages.get(candidate) ?? pages.get(candidate + "/index.html");
      if (!page) continue; // Download fragments (JSON evidence, SVG) are not HTML ids.
      const hash = decodeURIComponent(target.hash.slice(1));
      if (route.startsWith("demo/") && (hashDestinations.includes(hash) || /^\/components\/[a-z0-9-]+$/.test(hash) && inventory.components.some((component) => hash === `/components/${component.id}`))) continue; // Vue's registered hash routes.
      if (!page.ids.has(hash)) problems.add(`${file}: ${href} -> missing #${hash}`);
    }
  }
  assert.deepEqual([...problems], []);
});
