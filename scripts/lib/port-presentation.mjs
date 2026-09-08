import { escapeHtml as esc } from "./hex-literals.mjs";
export const renderPortCatalogue = (catalogue, { base = "/theme/", revision = null } = {}) => {
  if (revision !== null && !/^[a-f0-9]{40}$/.test(revision)) throw new Error("Port source links need an immutable revision");
  const source = (file, raw = false) => revision ? (raw ? "https://raw.githubusercontent.com/j3w1/theme/" : "https://github.com/j3w1/theme/blob/") + revision + "/" + file.split("/").map(encodeURIComponent).join("/") : null;
  const link = (text, file, raw = false) => source(file, raw) ? '<a href="' + esc(source(file, raw)) + '">' + esc(text) + "</a>" : esc(text);
  if (!catalogue.ports.length) return '<p data-port-empty>No native ports are published yet. Historical implementations are reference material, and private framework experiments are not supported downloads. The catalogue is empty.</p>';
  return '<form class="usage-filters" data-port-filter hidden><label>Search ports, roles and native keys <input name="query" type="search"></label><button type="reset">Reset search</button><p aria-live="polite" data-port-count></p></form>' + catalogue.ports.map(port => `
<section data-port-entry>
<h2>${esc(port.displayName)}</h2>
<p>Declared status: ${esc(port.declaredStatus)}. Evidence: <strong>${esc(port.verification.status)}</strong> — ${esc(port.verification.reason)}</p>
<p>${esc(port.integrationKind ?? "Integration kind not recorded")} · ${esc(port.format)} · targets ${esc(port.targetVersions.join(", "))} · ${esc(port.os.join(", "))} · profile ${esc(port.profile)} · theme ${esc(port.themeVersion)}. Theme pin: ${esc(port.themeRevision ?? "not recorded")}.</p>
<p>Evidence subject: <code>${esc(port.subjectDigest)}</code></p>
<p>${link("Installation and scope", port.readme)}${port.evidencePath ? " · " + link("Recorded import evidence", port.evidencePath) : ""}</p>
<p>Rollback: ${esc(port.rollback ?? "No separate rollback procedure recorded; consult the port README before installation.")}</p>
<ul>${port.files.map(file => "<li>" + link(file.path, file.source, true) + " — " + esc(file.install) + " — <code>" + esc(file.digest) + "</code></li>").join("")}</ul>
<h3>Surfaces</h3><ul>${Object.entries(port.surfaces).map(([surface, detail]) => "<li>" + esc(surface) + ": " + esc(detail.state) + " — " + esc(detail.reason) + "</li>").join("")}</ul>
<h3>Semantic mappings</h3>
<div class="table-scroll" tabindex="0" role="region" aria-label="${esc(port.displayName)} mappings"><table class="spec-table">
<thead><tr><th scope="col">Role</th><th scope="col">Native key / surface</th><th scope="col">Resolved value</th><th scope="col">Mapping state</th><th scope="col">Evidence / deviation</th></tr></thead>
<tbody>${port.mappings.map(mapping => `<tr data-port-row><td><a href="${esc(base + "tokens/" + encodeURIComponent(mapping.role) + "/")}">${esc(mapping.role)}</a></td>
<td>${esc(mapping.nativeKeys.join(", ") || "No native key")} / ${esc(mapping.surface ?? "not recorded")}</td><td><code>${esc(mapping.value ?? "Unavailable: artifact token digest differs")}</code></td><td>${esc(mapping.state)}</td>
<td>${esc(mapping.reason)} Eligibility: ${esc(mapping.eligibility.action)}. ${link("Source mapping", mapping.source)}</td></tr>`).join("")}</tbody>
</table></div></section>`).join("");
};
