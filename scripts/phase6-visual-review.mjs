import { promises as fs } from "node:fs";
import path from "node:path";
import { createServer } from "node:http";
import { build } from "vite";
import { repoRoot, readText, listFiles, stableJson, sha256 } from "./lib/fs.mjs";
import { reviewBaseline, evaluateCandidate, candidateIds } from "./lib/visual-review.mjs";
import { buildCss, buildDensityCss } from "./lib/css.mjs";
import { renderSpecimenMarkup, stateAttributes } from "./lib/specimen-markup.mjs";
import { splitVariants } from "./lib/spec.mjs";
import { decorateHexHtml } from "./lib/hex-html.mjs";

const root = path.join(repoRoot, ".cache/phase6a");
const output = path.join(root, "site");
const esc = s => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
const write = async (file, data) => {
  const target = path.join(output, file);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, data, "utf8");
};

export const buildReview = async () => {
  const baseline = await reviewBaseline();
  let overlays;
  try { overlays = await Promise.all(candidateIds.map(async id => {
    const data = JSON.parse(await fs.readFile(path.join(root, "inputs", `${id}.json`), "utf8"));
    if (data.id !== id) throw new Error(`Wrong candidate in ${id}.json`);
    return data;
  })); } catch (error) {
    throw new Error(`Local candidate inputs are required in .cache/phase6a/inputs/. See docs/phase6-visual-review.md. ${error.message}`);
  }
  const candidates = await Promise.all([null, ...overlays].map(input => evaluateCandidate(baseline, input)));
  const styles = ["site/src/styles/base.css", "site/src/styles/hex-swatches.css",
    ...(await listFiles("site/src/styles/components", { filter: file => file.endsWith(".css") }))];
  const availableStyles = await Promise.all(styles.map(file => readText(file)));
  const css = availableStyles.join("\n") + "\n" + await readText("tools/visual-review/review.css");
  await write("review.css", css);
  const template = await readText("tools/visual-review/screen.html");
  const implementationInputs = Object.fromEntries(await Promise.all(["tools/visual-review/app.mjs", "scripts/phase6-visual-review.mjs", "scripts/lib/visual-review.mjs", "scripts/lib/specimen-markup.mjs", "scripts/lib/markup.mjs", "scripts/lib/hex-literals.mjs", "scripts/lib/hex-html.mjs", "package-lock.json"].map(async file => [file, sha256(await readText(file))])));
  const specimenDigest = sha256(stableJson({ template, css, implementationInputs, components: baseline.components.map(c => [c.id, c.demo, c.states, c.variants]) }));
  const header = (candidate, title) => `<!doctype html><html lang="en" data-profile="${candidate.id === "current" ? "default" : "local-candidate"}" data-candidate="${candidate.id}" data-density="comfortable"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(title)} · j3w1 local review</title><link rel="stylesheet" href="/review/${candidate.id}/tokens.css"><link rel="stylesheet" href="/review.css"></head><body><a class="review-skip" href="#main">Skip to content</a>`;
  const nav = `<nav class="review-bar" aria-label="Visual review"><a href="/review/compare/">j3w1 / visual review</a>${candidates.map(c => `<a href="/review/${c.id}/">${esc(c.report.name)}</a>`).join("")}<a href="/review/report/">Evidence &amp; changes</a></nav>`;
  const gallery = baseline.components.map(c => `<section class="review-component" id="c-${c.id}"><h2>${esc(c.name)}</h2><p>${esc(c.summary)}</p><div class="review-matrix">${[...splitVariants(c.demo)].flatMap(([variant, markup]) => c.states.map((state, i) => `<article class="review-cell"><h3>${esc(variant)} / ${esc(state)}</h3><div class="state-sample" ${stateAttributes(state)}>${renderSpecimenMarkup(markup, `review-${c.id}-${variant}-${i}`, { state, inert: true })}</div></article>`)).join("")}</div></section>`).join("\n");
  const ladderGroups = [["surface", "color.surface."], ["text", "color.text."], ["border", "color.border."], ["interaction", "color.interaction."], ["action", "color.action."], ["status", "color.status."]];
  for (const c of candidates) {
    await write(`review/${c.id}/tokens.css`, buildCss({ profiles: new Map([[c.id, c.resolved]]), defaultId: c.id }) + buildDensityCss(c.resolved));
    const data = { id: c.id, name: c.report.name, summary: c.report.summary, specimenDigest, baselineDigest: baseline.baselineDigest,
      focusHex: c.resolved.get("color.interaction.focus.ring").resolved.hex };
    const foundations = ladderGroups.map(([name, prefix]) => `<section><h2>${name} ladder</h2><div class="ladder">${[...c.resolved].filter(([role]) => role.startsWith(prefix)).map(([role, token]) => `<div class="ladder-row"><span class="ladder-paint" style="background:var(--${role.replaceAll(".", "-")})" aria-hidden="true"></span><code>${role}</code><code>${token.resolved.hex}</code></div>`).join("")}</div></section>`).join("");
    const metadata = `<script type="application/json" id="review-data">${JSON.stringify(data).replaceAll("<", "\\u003c")}</script>`;
    await write(`review/${c.id}/index.html`, decorateHexHtml(`${header(c, c.report.name)}${nav}<main id="main"><header class="review-intro"><p class="eyebrow">PHASE 6A / LOCAL VISUAL SELECTION</p><h1>${esc(c.report.name)}</h1><p>${esc(c.report.summary)}</p><p>Temporary candidate. Shared Vue preview, not the published component package. <a href="foundations/">Foundations</a> · <a href="components/">Full existing state board</a></p></header><div id="review-app"><p>Loading the interactive Vue composition…</p></div><noscript><p>The Vue composition requires JavaScript. <a href="components/">The complete static specimen board</a> and <a href="foundations/">foundations</a> remain available.</p></noscript></main>${metadata}<script type="module" src="/assets/review.js"></script></body></html>`));
    await write(`review/${c.id}/components/index.html`, decorateHexHtml(`${header(c, "State board")}${nav}<main id="main" class="board"><h1>${esc(c.report.name)} / state board</h1><p>All ${baseline.components.length} existing specifications, every declared variant and state. Forced states are visual references, not proof of implemented behavior. Deferred inventory is not claimed as productized.</p>${gallery}</main></body></html>`));
    await write(`review/${c.id}/foundations/index.html`, decorateHexHtml(`${header(c, "Foundations")}${nav}<main id="main" class="board"><h1>${esc(c.report.name)} / foundations</h1>${foundations}</main></body></html>`));
  }
  const compare = `<header class="review-intro"><p class="eyebrow">J3W1 / FOUNDATION STUDY 01</p><h1>One interface. Three directions.</h1><p>Compare the same Vue composition at identical widths. Changes to scene, query and form values synchronize across all four frames. Candidate navigation and framework code are shared.</p></header><div id="review-app"></div>`;
  await write("review/compare/index.html", `${header(candidates[0], "Compare")}${nav}<main id="main">${compare}</main><script id="review-data" type="application/json">${JSON.stringify({ compare: true, candidates: candidates.map(c => ({ id: c.id, name: c.report.name })) })}</script><script type="module" src="/assets/review.js"></script></body></html>`);
  const rows = [...new Set(candidates.flatMap(c => c.report.changes.map(r => r.role)))].sort();
  const report = { schemaVersion: 1, baselineDigest: baseline.baselineDigest, specimenDigest, sourceInputs: baseline.inputs, implementationInputs,
    candidateOrder: candidates.map(c => c.id), candidates: candidates.map(c => c.report),
    recommendation: "B is the design hypothesis: more separation and calmer rose/red hierarchy. Choose using the full-screen review and numerical evidence together; this recommendation is not owner selection.",
    browserEvidence: "not run; see local evidence after npm run phase6:visual-test", ownerSelection: null };
  await write("review/report/report.json", stableJson(report));
  const summary = candidates.map(c => `<article class="review-panel"><h2>${esc(c.report.name)}</h2><p>${esc(c.report.summary)}</p><p>${c.report.primitiveChanges} primitive / ${c.report.semanticChanges} semantic changes. ${c.report.failures.length} unwaived contrast failures. Minimum text ${c.report.minimumText.toFixed(2)}:1; UI ${c.report.minimumUI.toFixed(2)}:1. No waiver changes.</p>${c.report.failures.length ? `<ul>${c.report.failures.map(f => `<li>${esc(f.label)}: ${f.display}:1 (requires ${f.min}:1)</li>`).join("")}</ul>` : ""}</article>`).join("");
  const table = `<div class="table-scroll"><table><caption>Changed roles: identical canonical component relationships</caption><thead><tr><th>Role</th><th>Current</th>${candidates.slice(1).map(c => `<th>${esc(c.report.name)}</th>`).join("")}</tr></thead><tbody>${rows.map(role => `<tr><th scope="row">${esc(role)}</th><td>${baseline.resolved.get(role).resolved.hex}</td>${candidates.slice(1).map(c => { const r = c.report.changes.find(r => r.role === role); return `<td>${c.resolved.get(role).resolved.hex}${r ? `<p>ΔL ${r.deltaL.toFixed(3)} / ΔC ${r.deltaC.toFixed(3)} / Δh ${r.deltaHue?.toFixed(1) ?? "n/a"}</p><p>${esc(r.reason)}</p><p>Tradeoff: ${esc(r.tradeoff)}</p><p>Affected: ${esc(r.components.join(", ") || "dependency; inspect semantic rows")}</p>` : " (unchanged)"}</td>`; }).join("")}</tr>`).join("")}</tbody></table></div>`;
  await write("review/report/index.html", decorateHexHtml(`${header(candidates[0], "Candidate report")}${nav}<main id="main" class="board"><h1>Visual-foundation evidence</h1><p>${esc(report.recommendation)}</p><p>Perceptual coordinates use OKLCH. Contrast uses the shared unrounded sRGB engine and every existing declared component/global pair. Historical ANSI and canonical files are unchanged. Browser/manual outcomes are separate; the numerical report does not certify accessibility.</p><a href="report.json">Complete report JSON, including every contrast pair and untouched role</a><div class="report-summary">${summary}</div>${table}</main></body></html>`));
  await build({ configFile: false, root: repoRoot, logLevel: "warn", define: { "process.env.NODE_ENV": JSON.stringify("production"), __VUE_OPTIONS_API__: true, __VUE_PROD_DEVTOOLS__: false, __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false },
    build: { outDir: path.join(output, "assets"), emptyOutDir: false, lib: { entry: path.join(repoRoot, "tools/visual-review/app.mjs"), formats: ["es"], fileName: () => "review.js" } } });
  console.log(`Local review generated: ${candidates.map(c => `${c.id}: ${c.report.failures.length} contrast failures`).join("; ")}`);
  return report;
};

export const serveReview = (port) => {
  const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json" };
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      if (url.pathname === "/") { res.writeHead(302, { Location: "/review/compare/" }); res.end(); return; }
      const pathname = decodeURIComponent(url.pathname);
      if (pathname.includes("\\") || pathname.includes("\0") || pathname.split("/").includes("..")) throw new Error("Invalid route");
      const file = path.resolve(output, `.${pathname}${pathname.endsWith("/") ? "index.html" : ""}`);
      if (!file.startsWith(`${output}${path.sep}`)) throw new Error("Outside review output");
      const bytes = await fs.readFile(file);
      res.writeHead(200, { "Content-Type": types[path.extname(file)] ?? "application/octet-stream", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
      res.end(bytes);
    } catch { res.writeHead(404); res.end("Review route not found"); }
  });
  server.on("error", error => { console.error(`Cannot serve local review: ${error.message}`); process.exitCode = 1; });
  server.listen(port, "127.0.0.1", () => console.log(`Visual review: http://127.0.0.1:${port}/review/compare/`));
  return server;
};

if (process.argv[1] && path.resolve(process.argv[1]) === path.join(repoRoot, "scripts/phase6-visual-review.mjs")) {
  const args = process.argv.slice(2);
  const port = Number(process.env.REVIEW_PORT ?? 4322);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("REVIEW_PORT must be an integer between 1024 and 65535");
  if (args.some(a => !["--build", "--serve"].includes(a))) throw new Error("Use --build or --serve");
  if (!args.includes("--serve")) await buildReview();
  if (!args.includes("--build")) serveReview(port);
}
