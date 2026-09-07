import { validatePlaygroundConfig } from "../../../schemas/playground.mjs";
import { decodeWorkbenchLink } from "../../../scripts/lib/workbench-config.mjs";
import { specimenStrings, longSpecimenLabel } from "../../../scripts/lib/specimen-fixtures.mjs";
import { renderHexText } from "../../../scripts/lib/hex-literals.mjs";
import { bindSpecimen } from "./specimen-behavior";

const data = JSON.parse(document.body.dataset.previewData!);
const root = document.querySelector<HTMLElement>("[data-preview-root]")!;
const overlay = document.querySelector<HTMLElement>("[data-part-overlay]")!;
const status = document.querySelector<HTMLElement>("[data-preview-status]")!;
const note = document.querySelector<HTMLElement>("[data-preview-note]")!;
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
let config: any;
let lifecycle = new AbortController();
let observer: ResizeObserver | null = null;
let animationFrame = 0;
let replayTimer = 0;
let replayFrame = 0;
let motionNode: HTMLElement | null = null;
const send = (message: object) => { if (parent !== window) parent.postMessage(message, location.origin); };
const announce = (text: string) => { status.textContent = text; };
const text = (selector: string | null, value: string) => {
  if (!selector || !value) return;
  const target = root.querySelector<HTMLElement>(selector);
  if (!target) return;
  // Replace only direct text nodes, preserving required marks, glyphs and ARIA.
  for (const child of [...target.childNodes]) if (child.nodeType === Node.TEXT_NODE) child.remove();
  const span = document.createElement("span"); span.dataset.sampleText = "";
  span.innerHTML = renderHexText(value);
  target.prepend(span);
  const link = target.closest("a");
  if (link?.hasAttribute("aria-label")) { link.setAttribute("aria-label", value); link.title = value; }
};
function stopMotion() {
  clearTimeout(replayTimer); cancelAnimationFrame(replayFrame);
  if (motionNode) { motionNode.style.removeProperty("transition-duration"); motionNode.getAnimations().forEach((animation) => animation.cancel()); }
  const stateRoot = root.firstElementChild as HTMLElement | null;
  if (stateRoot && config && !config.state.split("+").includes("hover")) stateRoot.removeAttribute("data-state-hover");
  motionNode = null;
}
function measure() {
  cancelAnimationFrame(animationFrame);
  animationFrame = requestAnimationFrame(() => {
    if (!config) return;
    const part = data.parts.find((item: any) => item.part === config.part);
    const target = part ? root.querySelector<HTMLElement>(part.selector) : null;
    const box = target?.getBoundingClientRect();
    overlay.hidden = !box || box.width === 0 || box.height === 0;
    const modal = target?.closest("dialog:modal");
    (modal ?? document.body).append(overlay);
    if (box && !overlay.hidden) Object.assign(overlay.style, { left: `${box.x}px`, top: `${box.y}px`, width: `${box.width}px`, height: `${box.height}px` });
    const styles = target ? getComputedStyle(target) : null;
    const mapped = data.measurements?.part === config.part ? data.measurements : null;
    const mappedNode = mapped ? root.querySelector<HTMLElement>(mapped.selector) : null;
    const measurements = mappedNode ? Object.entries(mapped.properties).map(([property, pattern]) => {
      const role = (pattern as string).replace("$density", config.density);
      const expected = data.tokens[config.profile][role].css;
      const actual = (getComputedStyle(mappedNode) as any)[property];
      return { property, role, expected, actual, match: actual === expected || parseFloat(actual) === parseFloat(expected) && /px$/.test(actual) && /px$/.test(expected) };
    }) : [];
    const inner = [root, ...root.querySelectorAll<HTMLElement>("*")].filter((el) => /auto|scroll/.test(getComputedStyle(el).overflowX) && el.scrollWidth > el.clientWidth).map((el) => ({ element: el.className, overflow: el.scrollWidth - el.clientWidth }));
    const motionTarget = data.bindings.motion ? root.querySelector<HTMLElement>(data.bindings.motion) : null;
    const motionStyle = motionTarget ? getComputedStyle(motionTarget) : null;
    send({ type: "theme:measurement", width: innerWidth, height: innerHeight, outerOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth), innerOverflow: inner, part: config.part, available: !!box && box.width > 0 && box.height > 0, box: box ? { width: box.width, height: box.height, x: box.x, y: box.y } : null, measured: styles ? { padding: styles.padding, margin: styles.margin, gap: styles.gap, border: styles.borderWidth, fontSize: styles.fontSize, lineHeight: styles.lineHeight, backgroundColor: styles.backgroundColor, color: styles.color } : null, measurements, motion: motionStyle ? { properties: motionStyle.transitionProperty, duration: motionStyle.transitionDuration, easing: motionStyle.transitionTimingFunction, reduced: reduced.matches || config.motion === "reduced" } : null });
  });
}
function render(input: unknown) {
  const next = validatePlaygroundConfig(input, data.contract, data.profiles);
  stopMotion(); lifecycle.abort(); lifecycle = new AbortController(); observer?.disconnect();
  const template = [...document.querySelectorAll<HTMLTemplateElement>("template[data-specimen-variant]")].find((item) => item.dataset.specimenVariant === next.variant && item.dataset.specimenState === next.state);
  if (!template) throw new Error("No maintained specimen for this state and variant");
  config = next;
  document.body.append(overlay);
  root.replaceChildren(template.content.cloneNode(true));
  root.dataset.profile = config.profile; root.dataset.density = config.density;
  root.dir = config.direction;
  document.documentElement.dataset.profile = config.profile;
  document.documentElement.dataset.density = config.density;
  root.dataset.motion = config.motion;
  const fixture = specimenStrings.find((item) => item.lang === config.fixture);
  root.lang = fixture?.lang ?? "en";
  text(data.bindings.label, config.label || (config.fixture === "long" ? longSpecimenLabel : fixture ? (config.component === "button" ? fixture.action : fixture.label) : ""));
  text(data.bindings.help, config.help || fixture?.help || "");
  const stateRoot = root.firstElementChild as HTMLElement;
  note.textContent = `${config.profile} (${data.profiles.find((p: any) => p.id === config.profile).status}); ${config.state === "default" ? "native interaction" : "documented visual simulation with native attributes where applicable"}. Forced focus is not keyboard focus; invalid is not form validation. Configuration records the initial state; interactions are temporary.`;
  if (config.component === "dialog") note.textContent += " The dialog starts closed to avoid taking focus on configuration changes. Open modal dialog applies the configured appearance using native modality.";
  if (config.component === "checkbox" && config.variant === "group" && config.state === "required") note.textContent += " Required-group validation belongs to the host; this specimen does not require every option.";
  if (["table", "sidebar-nav"].includes(config.component) && config.state.includes("selected")) note.textContent += " Selection is a visual specimen, not an implemented row-selection or listbox model.";
  bindSpecimen(stateRoot, config.component, config.state, announce, lifecycle.signal);
  observer = new ResizeObserver(measure); observer.observe(root, { box: "border-box" });
  const part = data.parts.find((item: any) => item.part === config.part);
  if (part) { const target = root.querySelector(part.selector); if (target) observer.observe(target, { box: "border-box" }); }
  for (const event of ["input", "change", "focusin", "focusout", "click"]) root.addEventListener(event, measure, { signal: lifecycle.signal });
  measure(); announce("");
}
function replay(slow: boolean) {
  stopMotion();
  if (!data.bindings.motion || document.hidden || reduced.matches || config.motion === "reduced") { announce("Static reduced-motion result; no playback."); return; }
  const stateRoot = root.firstElementChild as HTMLElement;
  motionNode = root.querySelector<HTMLElement>(data.bindings.motion);
  if (!motionNode) { announce("No maintained transition for this variant."); return; }
  if (slow) motionNode.style.transitionDuration = getComputedStyle(motionNode).transitionDuration.split(",").map((value) => `${parseFloat(value) * (value.trim().endsWith("ms") ? 1 : 1000) * 4}ms`).join(",");
  stateRoot.removeAttribute("data-state-hover"); void motionNode.offsetWidth;
  replayFrame = requestAnimationFrame(() => { stateRoot.setAttribute("data-state-hover", ""); announce(slow ? "Inspection playback at one-quarter speed." : "Maintained hover transition replayed."); replayTimer = window.setTimeout(() => { stopMotion(); if (config.state.split("+").includes("hover")) stateRoot.setAttribute("data-state-hover", ""); }, 1500); });
}
function fromUrl() {
  try {
    const link = decodeWorkbenchLink(location.hash, data);
    render(link.config);
    if (link.mismatch) {
      announce("Requested revision or source snapshot is unavailable here. This preview uses the displayed current build.");
      if (link.requestedRevision) { const source = document.createElement("a"); source.href = `https://github.com/j3w1/theme/tree/${encodeURIComponent(link.requestedRevision)}`; source.textContent = " View requested pinned source"; status.append(source); }
    }
  } catch (error) { announce(`Invalid preview link: ${(error as Error).message}`); }
}
document.documentElement.classList.add("js");
window.addEventListener("message", (event) => {
  if (event.origin !== location.origin || event.source !== parent || parent === window) return;
  try {
    if (event.data?.type === "theme:configure") render(event.data.config);
    if (event.data?.type === "theme:replay" && typeof event.data.slow === "boolean") replay(event.data.slow);
    if (event.data?.type === "theme:measure") measure();
    if (event.data?.type === "theme:stop") stopMotion();
  } catch (error) { announce((error as Error).message); send({ type: "theme:error", message: (error as Error).message }); }
});
window.addEventListener("hashchange", fromUrl);
window.addEventListener("resize", measure);
window.addEventListener("scroll", measure, true);
document.addEventListener("visibilitychange", () => { if (document.hidden) stopMotion(); });
reduced.addEventListener("change", () => { stopMotion(); measure(); });
window.addEventListener("pagehide", () => { stopMotion(); lifecycle.abort(); observer?.disconnect(); cancelAnimationFrame(animationFrame); });
fromUrl(); send({ type: "theme:ready", sourceDigest: data.sourceDigest, revision: data.revision });
