/* Comparison screen behaviour. The two frames are separate origins — the
   frozen build and the live dev server — so nothing here reads into them.
   Each frame carries an injected agent that posts its scroll ratio and route,
   and this relays between them. */

import { enhanceControls } from "/ui/enhance/choice.js";

const $ = (id) => document.getElementById(id);
const STORE = "j3w1-design:view";

/* Seeded from this page's own port the way the server derives them, so the
   frames still load if /api/state fails. */
const origin = (offset) => `${location.protocol}//${location.hostname}:${Number(location.port || 4400) + offset}`;
const state = { base: "/theme/", before: origin(1), after: origin(2), routes: [""], ledger: [], baseline: null, baselineBuilding: false };
const view = { route: "", width: "1440x1000", zoom: "fit", mode: "side", split: 50, blend: 50, sync: true };

try { Object.assign(view, JSON.parse(localStorage.getItem(STORE) ?? "{}")); } catch { /* first run, or storage refused */ }
/* Mode is a within-session choice, never a remembered one: opening into a
   stacked mode set in an earlier session reads as a missing frame. */
view.mode = "side";
const remember = () => { try { localStorage.setItem(STORE, JSON.stringify(view)); } catch { /* not essential */ } };

/* ---- frames ------------------------------------------------------------ */

const frames = { before: $("before-frame"), after: $("after-frame") };
let expected = "";

const load = () => {
  expected = view.route;
  frames.before.src = `${state.before}${state.base}${view.route}`;
  frames.after.src = `${state.after}${state.base}${view.route}`;
};

const applyGeometry = () => {
  const [width, height] = view.width.split("x").map(Number);
  const stage = $("stage");
  const gutters = 32;
  const gap = 16;
  const labels = 28;
  const across = stage.clientWidth - gutters;
  /* Measured from the top of the stage to the bottom of the window, not from
     the stage's own height: the stage is sized by the frames, so measuring it
     would make the scale depend on itself. */
  const down = innerHeight - stage.getBoundingClientRect().top - gutters - labels;
  /* Fit has to respect both axes, or a tall viewport preset scrolls the stage
     instead of showing the comparison. */
  /* Clamped: the control bar wraps on a narrow window, which can push the
     stage far enough down that the height budget goes to zero or negative and
     the frames collapse to nothing. A small frame is recoverable; an invisible
     one looks like the tool is broken. */
  const fit = Math.min(1, (view.mode === "side" ? (across - gap) / 2 : across) / width, down / height);
  const chosen = view.zoom === "fit" ? fit : Number(view.zoom);
  const scale = Number.isFinite(chosen) ? Math.max(0.2, chosen) : 1;
  stage.style.setProperty("--frame-width", `${width}px`);
  stage.style.setProperty("--frame-height", `${height}px`);
  stage.style.setProperty("--scale", String(scale));
};

/* Stacked frames look like one frame, so the legend is the only thing telling
   you two are there. In blink it also names whichever side is on screen. */
const renderLegend = () => {
  const legend = $("overlay-legend");
  legend.hidden = view.mode === "side";
  if (legend.hidden) return;
  const anchored = state.baseline?.commit?.slice(0, 12) ?? "unanchored";
  const showing = $("stage").dataset.blink === "before" ? "before" : "after";
  const detail = { swipe: `swipe at ${view.split}%`, blend: `after at ${view.blend}%`, blink: `blink · showing ${showing}` }[view.mode] ?? view.mode;
  const mark = (side, label, note) =>
    (view.mode === "blink" && showing === side) || view.mode !== "blink"
      ? `<b>${label}</b> <span class="dim">${note}</span>`
      : `${label} <span class="dim">${note}</span>`;
  legend.innerHTML = `${mark("before", "Before", anchored)} ⟷ ${mark("after", "After", "live")} <span class="dim">· ${detail}</span>`;
};

const applyMode = () => {
  const stage = $("stage");
  stage.dataset.mode = view.mode;
  stage.style.setProperty("--split", String(view.split));
  stage.style.setProperty("--blend", String(view.blend));
  $("split-control").hidden = view.mode !== "swipe";
  $("blend-control").hidden = view.mode !== "blend";
  $("divider").hidden = view.mode !== "swipe";
  if (view.mode !== "blink") stage.removeAttribute("data-blink");
  renderLegend();
  applyGeometry();
};

/* Blink alternates the two frames in place; movement that a static pair hides
   reads immediately as a jump. */
let blinking = null;
const applyBlink = () => {
  clearInterval(blinking);
  blinking = null;
  if (view.mode !== "blink") return;
  let showBefore = false;
  blinking = setInterval(() => {
    showBefore = !showBefore;
    $("stage").dataset.blink = showBefore ? "before" : "after";
    renderLegend();
  }, 700);
};

/* Dragging the seam is the affordance the mode is named after; the range input
   stays as the keyboard path. An iframe swallows pointer events, so both are
   made inert for the duration or the drag dies at the frame's edge. */
const dragSplit = (event) => {
  const stage = $("stage");
  const viewport = $("divider").parentElement;
  event.preventDefault();
  stage.dataset.dragging = "true";
  const move = (moved) => {
    const box = viewport.getBoundingClientRect();
    const ratio = Math.min(100, Math.max(0, ((moved.clientX - box.left) / box.width) * 100));
    view.split = Math.round(ratio);
    $("split").value = String(view.split);
    applyMode();
  };
  const release = () => {
    stage.removeAttribute("data-dragging");
    removeEventListener("pointermove", move);
    removeEventListener("pointerup", release);
    remember();
  };
  addEventListener("pointermove", move);
  addEventListener("pointerup", release);
};

/* ---- scroll relay ------------------------------------------------------ */

addEventListener("message", (event) => {
  const message = event.data;
  if (!message || message.j3w1design !== true) return;
  if (message.type === "ready") {
    const route = message.path.startsWith(state.base) ? message.path.slice(state.base.length) : message.path.replace(/^\//, "");
    /* A link followed inside the live frame moves the whole comparison. */
    if (message.side === "after" && route !== expected) {
      expected = route;
      view.route = route;
      $("route").value = route;
      remember();
      frames.before.src = `${state.before}${state.base}${route}`;
    }
    return;
  }
  if (message.type === "scroll" && view.sync) {
    const other = message.side === "before" ? frames.after : frames.before;
    other.contentWindow?.postMessage({ j3w1design: true, side: message.side, type: "scroll", ratio: message.ratio }, "*");
  }
});

/* ---- ledger ------------------------------------------------------------ */

const renderLedger = () => {
  const list = $("ledger-list");
  list.replaceChildren();
  $("ledger-count").textContent = String(state.ledger.length);
  $("ledger-empty").hidden = state.ledger.length > 0;
  for (const entry of state.ledger) {
    const item = document.createElement("li");
    const badge = document.createElement("span");
    badge.className = "entry-class";
    badge.dataset.class = entry.changeClass;
    badge.textContent = entry.changeClass;
    item.append(badge, document.createTextNode(entry.note));
    if (entry.files?.length) {
      const files = document.createElement("span");
      files.className = "entry-files";
      files.textContent = entry.files.join(" · ");
      item.append(files);
    }
    list.append(item);
  }
};

const renderStatus = () => {
  const status = $("status");
  if (state.baselinePhase) {
    status.dataset.busy = "true";
    status.textContent = state.baselinePhase === "copying"
      ? "Copying the new build into place. The frozen side keeps serving the previous one until the swap."
      : "Rebuilding the frozen side (npm run build, about a minute). The live side keeps working throughout.";
    return;
  }
  status.dataset.busy = "false";
  const anchored = state.baseline?.commit?.slice(0, 12);
  $("before-note").textContent = anchored ? `${anchored}${state.baseline.dirty ? " + working tree" : ""}` : "unanchored";
  status.textContent = "";
};

/* ---- state ------------------------------------------------------------- */

/* The theme's own choice enhancement replaces the native popup with the
   j3w1 combobox. A native <input list> can never be themed: Chrome gives it
   appearance: menulist-button, which discards author colours and draws an
   unstyleable, browser-positioned, self-filtering popup. */
let controls = null;

const renderRoutes = () => {
  const select = $("route");
  select.replaceChildren();
  const known = state.routes.includes(view.route) ? state.routes : [view.route, ...state.routes];
  for (const route of known) {
    const option = document.createElement("option");
    option.value = route;
    option.textContent = route === "" ? "/ (overview)" : `/${route}`;
    option.selected = route === view.route;
    select.append(option);
  }
  controls ? controls.refresh() : (controls = enhanceControls(document.body));
};

const refresh = async () => {
  const next = await (await fetch("/api/state")).json();
  const wasBuilding = state.baselineBuilding;
  Object.assign(state, next);
  renderRoutes();
  renderLedger();
  renderStatus();
  renderLegend();
  if (wasBuilding && !state.baselineBuilding) load();
  if (state.baselineBuilding) setTimeout(refresh, 2000);
};

/* ---- controls ---------------------------------------------------------- */

$("width").value = view.width;
$("zoom").value = view.zoom;
$("split").value = String(view.split);
$("blend").value = String(view.blend);
$("sync").checked = view.sync;
for (const radio of document.querySelectorAll('input[name="mode"]')) radio.checked = radio.value === view.mode;

const goTo = (raw) => {
  view.route = raw.replace(/^\//, "");
  if (view.route && !view.route.endsWith("/") && !view.route.includes(".")) view.route += "/";
  remember();
  renderRoutes();
  load();
};

$("route").addEventListener("change", () => goTo($("route").value));

/* The select covers the routes the baseline actually has; the path field
   reaches anything deeper, such as components/button/. */
$("path").addEventListener("change", () => {
  const typed = $("path").value.trim();
  if (!typed) return;
  goTo(typed);
  $("path").value = "";
});

$("divider").addEventListener("pointerdown", dragSplit);

$("width").addEventListener("change", () => { view.width = $("width").value; remember(); applyGeometry(); });
$("zoom").addEventListener("change", () => { view.zoom = $("zoom").value; remember(); applyGeometry(); });
$("split").addEventListener("input", () => { view.split = Number($("split").value); remember(); applyMode(); });
$("blend").addEventListener("input", () => { view.blend = Number($("blend").value); remember(); applyMode(); });
$("sync").addEventListener("change", () => { view.sync = $("sync").checked; remember(); });

for (const radio of document.querySelectorAll('input[name="mode"]')) {
  radio.addEventListener("change", () => {
    if (!radio.checked) return;
    view.mode = radio.value;
    remember();
    applyMode();
    applyBlink();
  });
}

$("reload").addEventListener("click", load);

$("reanchor").addEventListener("click", async () => {
  await fetch("/api/baseline", { method: "POST" });
  state.baselineBuilding = true;
  state.baselinePhase = "building";
  renderStatus();
  setTimeout(refresh, 1500);
});

/* The panel is fixed to the end edge and covers its own toggle, so it has to
   carry its own way out: a close button, and Escape. */
const setLedger = (open) => {
  $("ledger").hidden = !open;
  $("toggle-ledger").setAttribute("aria-expanded", String(open));
  (open ? $("close-ledger") : $("toggle-ledger")).focus();
};

$("toggle-ledger").addEventListener("click", () => setLedger($("ledger").hidden));
$("close-ledger").addEventListener("click", () => setLedger(false));

addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !$("ledger").hidden) setLedger(false);
});

addEventListener("resize", applyGeometry);

/* ---- start ------------------------------------------------------------- */

/* The frames are the point of the screen, so they load even when the state
   fetch or the control enhancement fails. */
try { await refresh(); } catch (error) { console.error("design mode: state unavailable", error); }
applyMode();
applyBlink();
load();
