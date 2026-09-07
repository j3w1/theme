import { defaultPlaygroundConfig, validatePlaygroundConfig } from "../../../schemas/playground.mjs";
import { decodeWorkbenchLink, encodeWorkbenchLink, reproductionPayload } from "../../../scripts/lib/workbench-config.mjs";
import { evaluateWorkbenchContrast } from "../../../scripts/lib/workbench-contrast.mjs";
import { renderHexText, escapeHtml } from "../../../scripts/lib/hex-literals.mjs";
import { initializeIssueDraft } from "./issue-draft";
import { anchorFor } from "../../../scripts/lib/anchors.mjs";
import { withBase } from "../lib/base";

for (const root of document.querySelectorAll<HTMLElement>("[data-workbench]")) {
  const data = JSON.parse(root.dataset.workbenchData!);
  const form = root.querySelector<HTMLFormElement>("[data-workbench-controls]")!;
  const frame = root.querySelector<HTMLIFrameElement>("[data-workbench-frame]")!;
  const comparison = root.querySelector<HTMLElement>("[data-comparison]")!;
  const compareEnabled = root.querySelector<HTMLInputElement>("[data-compare-enabled]")!;
  const compareFrame = root.querySelector<HTMLIFrameElement>("[data-comparison-frame]")!;
  const compareField = (name: string) => root.querySelector<HTMLSelectElement>(`[data-compare-${name}]`)!;
  let compareReady = false;
  const status = root.querySelector<HTMLElement>("[data-workbench-status]")!;
  const revisionStatus = root.querySelector<HTMLElement>("[data-revision-status]")!;
  const includeText = root.querySelector<HTMLInputElement>("[data-include-text]")!;
  const sharePayload = root.querySelector<HTMLTextAreaElement>("[data-share-payload]")!;
  const shareLink = root.querySelector<HTMLInputElement>("[data-share-link]")!;
  const issueRoot = root.querySelector<HTMLElement>("[data-issue-draft]")!;
  initializeIssueDraft(issueRoot);
  const contrastForm = root.querySelector<HTMLFormElement>("[data-contrast-controls]")!;
  const field = (name: string) => form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement;
  const contrastField = (name: string) => contrastForm.elements.namedItem(name) as HTMLSelectElement;
  let config = defaultPlaygroundConfig(data.contract, data.profiles);
  let ready = false;
  let measurements: any = null;
  const announce = (text: string) => { status.textContent = text; };
  const post = (message: object) => frame.contentWindow?.postMessage(message, location.origin);
  const comparePost = (message: object) => compareFrame.contentWindow?.postMessage(message, location.origin);
  function updateComparison() {
    comparison.hidden = !compareEnabled.checked;
    root.querySelector("[data-viewport-grid]")!.classList.toggle("has-comparison", compareEnabled.checked);
    if (!compareEnabled.checked) { compareReady = false; compareFrame.removeAttribute("src"); return; }
    const other = validatePlaygroundConfig({ ...config, width: Number(compareField("width").value), density: compareField("density").value, direction: compareField("direction").value, motion: compareField("motion").value }, data.contract, data.profiles);
    compareFrame.style.width = `${other.width}px`;
    if (!compareFrame.hasAttribute("src")) compareFrame.src = root.dataset.previewUrl!;
    if (compareReady) comparePost({ type: "theme:configure", config: other });
  }
  const invalidateDraft = () => { issueRoot.dispatchEvent(new CustomEvent("theme:report-context", { detail: reproductionPayload(config, data, measurements) })); };
  const updateShare = () => {
    const hash = encodeWorkbenchLink(config, data, { includeText: includeText.checked });
    const url = new URL(location.href); url.hash = hash;
    shareLink.value = url.href;
    sharePayload.value = JSON.stringify(JSON.parse(decodeURIComponent(hash.slice(1))), null, 2);
    const isolated = new URL(root.dataset.previewUrl!, location.origin); isolated.hash = hash;
    root.querySelector<HTMLAnchorElement>("[data-open-preview]")!.href = isolated.href;
  };
  function contrast() {
    const resultNode = root.querySelector<HTMLElement>("[data-contrast-result]")!;
    try {
      const value = evaluateWorkbenchContrast(data, { profile: config.profile, ...Object.fromEntries(new FormData(contrastForm)) } as any);
      root.querySelector<HTMLTextAreaElement>("[data-contrast-copy]")!.value = JSON.stringify({ themeVersion: data.themeVersion, component: config.component, revision: data.revision, sourceDigest: data.sourceDigest, profile: config.profile, context: contrastField("context").value, ...value }, null, 2);
      const tokenLink = (path: string) => `<a href="${withBase(`tokens/${encodeURIComponent(path)}/`)}">${escapeHtml(path)}</a>`;
      resultNode.innerHTML = `<p><strong>${value.display}:1 — ${value.pass ? "meets" : "below"} ${value.min}:1</strong> (${escapeHtml(value.kind)}). ${value.declaredState ? `Declared state: ${escapeHtml(value.declaredState)}; <a href="${withBase("")}#${anchorFor.component(config.component)}">component state rules</a>.` : ""} Decision uses the unrounded ratio: ${value.ratio}.</p><p>Composited foreground ${renderHexText(value.fg)}; background ${renderHexText(value.bg)}; underlay ${tokenLink(value.roles.underlay)}. ${value.waiver ? `Declared exception: ${escapeHtml(value.waiver)}. This is not an accessibility pass.` : "No waiver applied."}</p><ul>${value.eligibility.map((item: any) => `<li>${tokenLink(item.path)}: ${escapeHtml(item.action)} — ${escapeHtml(item.reason)}${item.decisionIds.length ? ` (${item.decisionIds.map(escapeHtml).join(", ")})` : ""}</li>`).join("")}</ul><p>${value.alternatives.length ? `Documented foreground alternatives for the exact same part/state/variant/surface: ${value.alternatives.map(tokenLink).join(", ")}. Re-evaluate contrast before use.` : "No documented foreground alternative for this exact part/state/variant/surface."}</p>`;
    } catch (error) { resultNode.textContent = (error as Error).message; }
  }
  function setPair() {
    const selected = contrastField("pair").value;
    if (/^\d+$/.test(selected)) {
      const pair = data.contract.contrast[Number(selected)];
      contrastField("fg").value = pair.fg; contrastField("bg").value = pair.bg; contrastField("context").value = "declared";
    }
    contrast();
  }
  function renderMeasurements(value: any) {
    measurements = value;
    root.querySelector<HTMLElement>("[data-motion-report]")!.textContent = value.motion ? `Maintained properties: ${value.motion.properties}; computed duration: ${value.motion.duration}; easing: ${value.motion.easing}. Timing role: ${data.motion.role}. Endpoints: default → hover. The interpolation is decorative; the hover background communicates pointer state. ${value.motion.reduced ? "Reduced motion is active; transitions are instant." : "System permits ordinary motion."}` : "No replayable transition mapped for this specimen.";
    root.querySelector<HTMLElement>("[data-viewport-report]")!.textContent = `Actual viewport: ${value.width} × ${value.height} CSS px. Outer horizontal overflow: ${value.outerOverflow} px. Inner scrolling regions: ${value.innerOverflow.map((item: any) => `${item.element} (${item.overflow} px)`).join(", ") || "none"}.`;
    const selected = data.parts.find((part: any) => part.part === config.part);
    root.querySelector<HTMLElement>("[data-part-description]")!.textContent = selected ? `${selected.part}: ${selected.description}${value.available ? "" : " This part is absent or hidden in the selected variant/state."}` : "Select a documented part. The overlay does not capture input or change layout.";
    const row = (cells: string[]) => `<tr>${cells.map((cell) => `<td>${renderHexText(cell)}</td>`).join("")}</tr>`;
    const prefixes = config.part.split(/\s*\/\s*/);
    const declared = Object.entries(data.contract.tokens).filter(([part]) => prefixes.some((prefix: string) => part.startsWith(`${prefix}.`))).map(([part, role]) => row([part, role as string, data.tokens[config.profile][role as string].css, "Declared mapping; state-specific roles are not a computed-style assertion."]));
    const computed = value.available ? [row(["border-box width × height", "Not specified by a role mapping", "—", `${value.box.width} × ${value.box.height} px`]), ...Object.entries(value.measured).map(([name, actual]) => row([name, "Computed style", "—", String(actual)])), ...value.measurements.map((item: any) => row([item.property, item.role, item.expected, `${item.actual} — ${item.match ? "matches" : "MISMATCH"}`]))] : [];
    root.querySelector<HTMLElement>("[data-measurements]")!.innerHTML = [...declared, ...computed].join("");
  }
  function apply(input: unknown, historyMode: "push" | "replace" | "none" = "push") {
    const next = validatePlaygroundConfig(input, data.contract, data.profiles);
    config = next;
    for (const [name, value] of Object.entries(config)) if (field(name)) field(name).value = String(value);
    const preset = root.querySelector<HTMLSelectElement>("[data-width-preset]")!;
    preset.value = [320, 360, 640, 1280].includes(config.width) ? String(config.width) : "custom";
    frame.style.width = `${config.width}px`;
    if (historyMode !== "none") {
      const url = new URL(location.href); url.hash = encodeWorkbenchLink(config, data);
      if (url.href !== location.href) historyMode === "push" ? history.pushState(null, "", url) : history.replaceState(null, "", url);
    }
    if (ready) post({ type: "theme:configure", config });
    measurements = null; invalidateDraft(); updateShare(); updateComparison(); contrast(); announce("");
  }
  function readForm() { return { ...config, ...Object.fromEntries(new FormData(form)), width: Number(field("width").value) }; }
  function fromUrl() {
    try {
      const link = decodeWorkbenchLink(location.hash, data);
      apply(link.config, "none");
      revisionStatus.textContent = `${link.mismatch ? "Requested revision or source snapshot unavailable here. Showing the current build: " : "Actual build: "}${data.revision ?? "local and unpinned"}. Source snapshot: ${data.sourceDigest}.`;
      if (link.mismatch && link.requestedRevision) {
        const source = document.createElement("a"); source.href = `https://github.com/j3w1/theme/tree/${encodeURIComponent(link.requestedRevision)}`; source.textContent = " View requested pinned source"; revisionStatus.append(source);
      }
    } catch (error) { announce(`Invalid preview link: ${(error as Error).message}. Reset restores the canonical specimen.`); }
  }
  async function copy(value: string, control: HTMLInputElement | HTMLTextAreaElement) {
    try { await navigator.clipboard.writeText(value); announce("Copied."); }
    catch { control.focus(); control.select(); announce("Clipboard unavailable. The displayed text is selected for manual copying."); }
  }
  issueRoot.addEventListener("submit", () => invalidateDraft(), true);
  form.addEventListener("submit", (event) => event.preventDefault());
  form.addEventListener("change", (event) => {
    try {
      const target = event.target as HTMLInputElement;
      if (target.hasAttribute("data-width-preset") && target.value !== "custom") field("width").value = target.value;
      if (target.name === "fixture") field("direction").value = target.value === "ar" ? "rtl" : "ltr";
      apply(readForm());
    } catch (error) { announce((error as Error).message); }
  });
  form.addEventListener("input", (event) => {
    if (!["label", "help"].includes((event.target as HTMLInputElement).name)) return;
    try { apply(readForm(), "replace"); } catch (error) { announce((error as Error).message); }
  });
  root.querySelector("[data-workbench-reset]")!.addEventListener("click", () => { includeText.checked = false; compareEnabled.checked = false; apply(defaultPlaygroundConfig(data.contract, data.profiles)); revisionStatus.textContent = `Actual build: ${data.revision ?? "local and unpinned"}. Source snapshot: ${data.sourceDigest}.`; });
  contrastForm.addEventListener("submit", (event) => event.preventDefault());
  contrastForm.addEventListener("change", (event) => {
    const name = (event.target as HTMLSelectElement).name;
    if (name === "pair") setPair();
    else { if (["fg", "bg"].includes(name)) { contrastField("pair").value = "custom"; if (contrastField("context").value === "declared") contrastField("context").value = "text"; } contrast(); }
  });
  includeText.addEventListener("change", updateShare);
  root.querySelector("[data-copy-config]")!.addEventListener("click", () => copy(sharePayload.value, sharePayload));
  root.querySelector("[data-copy-link]")!.addEventListener("click", () => copy(shareLink.value, shareLink));
  const contrastCopy = root.querySelector<HTMLTextAreaElement>("[data-contrast-copy]")!;
  root.querySelector("[data-copy-contrast]")!.addEventListener("click", () => copy(contrastCopy.value, contrastCopy));
  compareEnabled.addEventListener("change", updateComparison);
  comparison.addEventListener("change", updateComparison);
  root.querySelector("[data-compare-reduced]")?.addEventListener("click", () => { compareEnabled.checked = true; compareField("motion").value = "reduced"; compareField("density").value = config.density; compareField("direction").value = config.direction; updateComparison(); });
  for (const button of root.querySelectorAll<HTMLElement>("[data-replay]")) button.addEventListener("click", () => { const message = button.dataset.replay === "stop" ? { type: "theme:stop" } : { type: "theme:replay", slow: button.dataset.replay === "slow" }; post(message); if (compareReady) comparePost(message); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) { post({ type: "theme:stop" }); comparePost({ type: "theme:stop" }); } });
  const visibility = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) { post({ type: "theme:stop" }); comparePost({ type: "theme:stop" }); } });
  visibility.observe(root);
  window.addEventListener("message", (event) => {
    if (event.origin !== location.origin) return;
    if (event.source === compareFrame.contentWindow && compareEnabled.checked) {
      if (event.data?.type === "theme:ready" && event.data.sourceDigest === data.sourceDigest && event.data.revision === data.revision) { compareReady = true; updateComparison(); }
      if (event.data?.type === "theme:measurement" && compareReady) root.querySelector<HTMLElement>("[data-comparison-report]")!.textContent = `Comparison viewport: ${event.data.width} × ${event.data.height} CSS px. Outer overflow: ${event.data.outerOverflow} px. Inner scrolling regions: ${event.data.innerOverflow.length}. ${event.data.motion?.reduced ? "Reduced motion is active." : "System motion preference applies."}`;
      return;
    }
    if (event.source !== frame.contentWindow) return;
    if (event.data?.type === "theme:ready") {
      if (event.data.sourceDigest !== data.sourceDigest || event.data.revision !== data.revision) { announce("Preview assets do not match this workbench build. Reload both before inspection."); return; }
      ready = true; post({ type: "theme:configure", config });
    }
    if (event.data?.type === "theme:measurement" && ready) renderMeasurements(event.data);
    if (event.data?.type === "theme:error") announce(event.data.message);
  });
  window.addEventListener("popstate", fromUrl);
  window.addEventListener("hashchange", fromUrl);
  window.addEventListener("pagehide", () => { visibility.disconnect(); post({ type: "theme:stop" }); comparePost({ type: "theme:stop" }); });
  document.documentElement.classList.add("js");
  setPair(); fromUrl();
  frame.src = root.dataset.previewUrl!;
}
