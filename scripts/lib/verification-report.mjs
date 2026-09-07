import { promises as fs } from "node:fs";
import path from "node:path";
import { artifactFiles, artifactFingerprint, freshnessOf, displayResult, sourceFingerprint, validateEvidence } from "./evidence.mjs";
import { readJson, readText, repoRoot, stableJson } from "./fs.mjs";
import { escapeHtml as esc } from "./hex-literals.mjs";
import { anchorFor } from "./anchors.mjs";

export const renderReport = ({ coverage, subject, evidence = null }) => {
  const freshness = evidence ? freshnessOf(evidence, subject) : "current";
  const records = evidence?.records ?? [];
  const components = ["page", ...Object.keys(coverage.components)];
  const rows = [];
  const summaries = [];
  for (const component of components) {
    const own = records.filter((r) => r.scope.component === component);
    const anchor = anchorFor.verification(component);
    const counts = Object.fromEntries(["passed", "failed", "skipped", "not applicable", "not run"].map((status) => [status, own.filter((r) => r.result === status).length]));
    const positive = counts.passed ? `<a href="#${anchor}">${counts.passed} ${freshness === "stale" ? "stale passes" : "passed records"}</a>` : "0 passed records";
    summaries.push(`<tr><th scope="row"><a href="../#${component === "page" ? "main" : anchorFor.component(component)}">${esc(component)}</a></th><td>${positive}; ${counts.failed} failed; ${counts.skipped} skipped</td><td>${own.filter((r) => r.kind === "manual").length} manual records</td></tr>`);
    rows.push(`<tr class="group" id="${anchor}"><th colspan="9" scope="rowgroup">${esc(component)}</th></tr>`);
    for (const record of own) {
      const e = record.environment;
      const status = displayResult(record, freshness);
      rows.push(`<tr data-component="${component}" data-kind="${record.kind}" data-result="${freshness === "stale" ? "stale" : record.result}" id="${record.id}"><th scope="row">${esc(record.scope.category)}</th><td>${esc(record.kind)}</td><td>${esc(record.scope.states.join(", ") || "unspecified")} / ${esc(record.scope.variants.join(", ") || "unspecified")}</td><td>${esc(e.browser)} ${esc(e.browserVersion ?? "not recorded")}<br>${esc(e.os)}</td><td>${esc(e.project)}; ${e.viewport ? `${e.viewport.width}×${e.viewport.height}` : "viewport unknown"}; JS ${e.javaScript ? "on" : "off"}</td><td>${esc(e.profile)} / ${esc(e.density)}</td><td><a href="evidence.json#${record.id}">${esc(status)}</a></td><td>${esc(record.reason ?? record.scope.note)}</td><td>${record.test ? `${esc(record.test.file)}:${record.test.line}<br>${esc(record.test.title)}<br>` : ""}${esc(record.reference)}</td></tr>`);
    }
    for (const browser of ["chromium", "firefox", "webkit"]) {
      if (own.some((r) => r.kind === "automated" && r.environment.browser === browser)) continue;
      rows.push(`<tr data-component="${component}" data-kind="automated" data-result="not run"><th scope="row">Unrecorded automated coverage</th><td>automated</td><td>all unspecified</td><td>${browser}</td><td colspan="2">No recorded configuration</td><td>not run</td><td colspan="2">Test implementation does not establish execution.</td></tr>`);
    }
    for (const category of ["keyboard", "screen-reader"]) {
      if (own.some((r) => r.kind === "manual" && r.scope.category === category)) continue;
      rows.push(`<tr data-component="${component}" data-kind="manual" data-result="not run"><th scope="row">${category}</th><td>manual</td><td colspan="4">No recorded manual protocol or configuration</td><td>not run</td><td colspan="2">Automated checks do not establish manual verification.</td></tr>`);
    }
  }
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Verification evidence — j3w1 theme</title><link rel="stylesheet" href="../exports/tokens.css"><link rel="stylesheet" href="report.css"></head><body><a href="#matrix" class="skip">Skip to verification matrix</a><main><h1>Verification evidence</h1><p><a href="../#coverage-ledger">Specification and source coverage</a> · <a href="subject.json">Tested subject</a>${evidence ? ' · <a href="evidence.json">Execution evidence JSON</a>' : ""}</p><p>${evidence ? `Recorded run: ${esc(evidence.run.result)}; evidence freshness: <strong>${freshness}</strong>. ${evidence.run.reference.startsWith("https://github.com/") ? `<a href="${esc(evidence.run.reference)}">CI run</a>` : esc(evidence.run.reference)}` : "No execution evidence is attached to this build. Every execution result is not run."}</p><p>Specified and demonstrated describe sources; test implemented means a test exists. A passed record applies only to its recorded category, states, variants, browser and configuration. Unlisted combinations remain not run. Rendering a state matrix does not verify its keyboard behavior. Stale records preserve their original outcome but do not verify this revision. No blanket WCAG conformance is claimed.</p><p>Source digest: <code>${esc(subject.sourceDigest)}</code><br>Specimen artifact digest: <code>${esc(subject.artifactDigest)}</code></p><h2>Component summaries</h2><div class="scroll" tabindex="0" role="region" aria-label="Component summaries"><table><thead><tr><th>Component</th><th>Execution records</th><th>Manual evidence</th></tr></thead><tbody>${summaries.join("")}</tbody></table></div><h2 id="matrix">Full verification matrix</h2><form id="filters" hidden><label>Component <select name="component"><option value="">All components</option>${components.map((c) => `<option>${c}</option>`).join("")}</select></label><label>Method <select name="kind"><option value="">All methods</option><option>automated</option><option>manual</option></select></label><label>Result <select name="result"><option value="">All results</option>${["passed", "failed", "skipped", "stale", "not run", "not applicable"].map((s) => `<option>${s}</option>`).join("")}</select></label><button type="reset">Reset filters</button><span id="filter-count" aria-live="polite"></span></form><div class="scroll" tabindex="0" role="region" aria-label="Verification matrix"><table><thead><tr><th>Category</th><th>Method</th><th>States / variants</th><th>Browser / OS</th><th>Configuration</th><th>Profile / density</th><th>Result / evidence</th><th>Reason or scope</th><th>Test / protocol</th></tr></thead><tbody>${rows.join("")}</tbody></table></div></main><script type="module" src="filter.js"></script></body></html>`;
};

export const writeReport = async (evidence = null, { initialize = false } = {}) => {
  const before = await artifactFiles();
  const directory = path.join(repoRoot, "dist/verification");
  await fs.mkdir(directory, { recursive: true });
  const subject = initialize ? { schemaVersion: 1, sourceDigest: await sourceFingerprint(), artifactDigest: artifactFingerprint(before), files: before } : await readJson("dist/verification/subject.json");
  if (subject.sourceDigest !== await sourceFingerprint()) throw new Error("Sources changed after the build; rebuild before publishing evidence");
  if (subject.artifactDigest !== artifactFingerprint(before)) throw new Error("Specimen assets changed after testing");
  if (evidence) await validateEvidence(evidence);
  if (initialize) await fs.writeFile(path.join(directory, "subject.json"), stableJson(subject));
  if (evidence) await fs.writeFile(path.join(directory, "evidence.json"), stableJson(evidence));
  await fs.writeFile(path.join(directory, "index.html"), renderReport({ coverage: await readJson("exports/coverage.json"), subject, evidence }));
  await fs.writeFile(path.join(directory, "report.css"), await readText("site/src/styles/verification.css"));
  await fs.writeFile(path.join(directory, "filter.js"), await readText("site/src/scripts/verification-filter.js"));
  if (stableJson(before) !== stableJson(await artifactFiles())) throw new Error("Report generation modified tested specimen assets");
  return subject;
};
