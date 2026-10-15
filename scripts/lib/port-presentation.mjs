import manifest from "../../theme.json" with { type: "json" };
const siteBase = manifest.site.base.replace(/\/?$/, "/");
import { anchorFor } from "./anchors.mjs";
import { escapeHtml as esc } from "./hex-literals.mjs";
// Where the site serves a port's importable file, relative to the site base:
// ports/<id>/<file name>. The README table and the Ports page share it.
export const portDownloadPath = (id, file) => `ports/${id}/${file.split("/").at(-1)}`;
export const renderPortFilter = () => {
  const id = anchorFor.usageControl("port-query");
  return `<form class="site-filters" data-port-filter hidden><div class="text-field"><label class="text-field-label" for="${id}">Search ports, roles and native keys</label><div class="text-field-root"><input class="text-field-input" id="${id}" name="query" type="search"></div></div><button class="button button-secondary" type="reset">Reset search</button><p aria-live="polite" data-port-count></p></form>`;
};
export const renderPortCatalogue = (catalogue, { base = siteBase, revision = null, summary = false } = {}) => {
  if (revision !== null && !/^[a-f0-9]{40}$/.test(revision)) throw new Error("Port source links need an immutable revision");
  const source = (file, raw = false) => revision ? (raw ? "https://raw.githubusercontent.com/j3w1/theme/" : "https://github.com/j3w1/theme/blob/") + revision + "/" + file.split("/").map(encodeURIComponent).join("/") : null;
  const link = (text, file, raw = false) => source(file, raw) ? '<a href="' + esc(source(file, raw)) + '">' + esc(text) + "</a>" : esc(text);
  if (!catalogue.ports.length) return '<p data-port-empty>No native ports are published yet. Historical implementations are reference material, and private framework experiments are not supported downloads. The catalogue is empty.</p>';
  if (summary) return renderPortFilter() + '<div class="site-cards">' + catalogue.ports.map(port => {
    const search = [port.displayName, port.format, port.profile, ...port.os, ...port.mappings.flatMap(mapping => [mapping.role, ...mapping.nativeKeys, mapping.state, mapping.surface ?? ""])].join(" ").toLowerCase();
    return `<section class="card" data-port-entry data-port-search="${esc(search)}"><h2 class="card-title">${esc(port.displayName)}</h2>
<p>Declared ${esc(port.declaredStatus)} · import evidence: ${esc(port.verification.status)}</p>
<p>${Object.entries(port.surfaces).map(([surface, detail]) => `${esc(surface)}: ${esc(detail.state)}`).join(" · ")}</p>
<p><a class="link link-standalone" href="${esc(base + "ports/" + port.id + "/")}">Scope, mappings and installation →</a></p>
<ul>${port.files.map(file => `<li><a class="link" href="${esc(base + portDownloadPath(port.id, file.path))}" download>Download ${esc(file.path.split("/").at(-1))}</a></li>`).join("")}</ul></section>`;
  }).join("") + '</div>';
  return renderPortFilter() + catalogue.ports.map(port => `
<section data-port-entry>
<h2>${esc(port.displayName)}</h2>
<p>Declared status: ${esc(port.declaredStatus)}. Evidence: <strong>${esc(port.verification.status)}</strong> — ${esc(port.verification.reason)}</p>
<p>${esc(port.integrationKind ?? "Integration kind not recorded")} · ${esc(port.format)} · targets ${esc(port.targetVersions.join(", "))} · ${esc(port.os.join(", "))} · profile ${esc(port.profile)} · theme ${esc(port.themeVersion)}. Theme pin: ${esc(port.themeRevision ?? "not recorded")}.</p>
<p>Evidence subject: <code>${esc(port.subjectDigest)}</code></p>
<p>${link("Installation and scope", port.readme)}${port.evidencePath ? " · " + link("Recorded import evidence", port.evidencePath) : ""}</p>
<p>Rollback: ${esc(port.rollback ?? "No separate rollback procedure recorded; consult the port README before installation.")}</p>
<ul>${port.files.map(file => '<li><a href="' + esc(base + portDownloadPath(port.id, file.path)) + '" download>Download ' + esc(file.path.split("/").at(-1)) + "</a> (" + link("source at this revision", file.source, true) + ") — " + esc(file.install) + " — <code>" + esc(file.digest) + "</code></li>").join("")}</ul>
<h3>Surfaces</h3><ul>${Object.entries(port.surfaces).map(([surface, detail]) => "<li>" + esc(surface) + ": " + esc(detail.state) + " — " + esc(detail.reason) + "</li>").join("")}</ul>
<h3>Semantic mappings</h3>
<div class="table-scroll" tabindex="0" role="region" aria-label="${esc(port.displayName)} mappings"><table class="spec-table">
<thead><tr><th scope="col">Role</th><th scope="col">Native key / surface</th><th scope="col">Resolved value</th><th scope="col">Mapping state</th><th scope="col">Evidence / deviation</th></tr></thead>
<tbody>${port.mappings.map(mapping => `<tr data-port-row><td><a href="${esc(base + "tokens/" + encodeURIComponent(mapping.role) + "/")}">${esc(mapping.role)}</a></td>
<td>${esc(mapping.nativeKeys.join(", ") || "No native key")} / ${esc(mapping.surface ?? "not recorded")}</td><td><code>${esc(mapping.value ?? "Unavailable: artifact token digest differs")}</code></td><td>${esc(mapping.state)}</td>
<td>${esc(mapping.reason)} Eligibility: ${esc(mapping.eligibility.action)}. ${link("Source mapping", mapping.source)}</td></tr>`).join("")}</tbody>
</table></div></section>`).join("");
};
