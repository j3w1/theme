import { all, enabled, make } from "../internal/dom.js";

export function wizard(root, { on }) {
  const panels = all(root, ".wizard-panel"), steps = all(root, ".wizard-step-button"), backButton = root.querySelector(".wizard-back"), nextButton = root.querySelector(".wizard-next");
  if (!panels.length || panels.length !== steps.length) throw new Error("A wizard requires one complete panel for each step button");
  let step = 0, reached = 0;
  const originalDisabled = new Map(all(root, "input,select,textarea").map(control => [control, control.disabled]));
  const draw = (focus = false) => {
    steps.forEach((button, index) => {
      button.disabled = index > reached || root.hasAttribute("disabled");
      if (index === step) button.setAttribute("aria-current", "step"); else button.removeAttribute("aria-current");
      button.closest(".wizard-step")?.classList.toggle("wizard-step-complete", index < step);
      panels[index].hidden = index !== step;
      all(panels[index], "input,select,textarea").forEach(control => { control.disabled = originalDisabled.get(control) || index > reached || root.hasAttribute("disabled"); });
    });
    if (backButton) backButton.disabled = step === 0 || root.hasAttribute("disabled");
    if (nextButton) nextButton.disabled = root.hasAttribute("disabled");
    if (focus) { const heading = panels[step].querySelector("h2,h3,h4"); if (heading) { heading.tabIndex = -1; heading.focus(); } }
  };
  const go = next => {
    if (!Number.isInteger(next) || next < 0 || next > reached || next >= panels.length) throw new RangeError("The requested wizard step is not reachable");
    step = next; draw(true); root.emit("step", { step });
  };
  const next = () => {
    if (root.hasAttribute("disabled")) return false;
    for (const control of all(panels[step], "input,select,textarea")) if (enabled(control) && !control.reportValidity()) return false;
    if (step === panels.length - 1) { root.emit("complete", {}); return true; }
    reached = Math.max(reached, step + 1); go(step + 1); return true;
  };
  const back = () => { if (step && !root.hasAttribute("disabled")) go(step - 1); };
  steps.forEach((button, index) => on(button, "click", () => { if (enabled(button)) go(index); }));
  on(nextButton, "click", next); on(backButton, "click", back);
  draw();
  return { next, back, get step() { return step; }, set step(value) { go(value); }, snapshot() { return { step, reached }; }, restore(state) { step = state.step; reached = state.reached; draw(); }, attributeChanged() { draw(); }, cleanup() { for (const [control, disabled] of originalDisabled) control.disabled = disabled; } };
}

export function formComposition(root, { on }) {
  const review = root.querySelector("[data-form-review]"), status = root.querySelector("[data-form-status]");
  let values = [], form = null;
  const showReview = (focus = true) => {
    form ??= root.querySelector("form");
    if (!form || !review || !form.reportValidity()) return;
    values = [...new FormData(form)];
    const body = review.querySelector("tbody"); body.replaceChildren();
    for (const [name, value] of values) { const row = make(root, "tr"); row.append(make(root, "th", { scope: "row" }, name), make(root, "td", {}, typeof value === "string" ? value : value.name)); body.append(row); }
    form.hidden = true; review.hidden = false;
    if (focus) review.querySelector("h3")?.focus();
  };
  for (const form of all(root, "form")) {
    on(form, "submit", event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      if (review) showReview();
      else { root.emit("submit", { values: [...new FormData(form)] }); if (status) status.textContent = "Values passed to the host application."; }
    });
  }
  on(root.querySelector("[data-form-edit]"), "click", () => { review.hidden = true; form.hidden = false; form.querySelector("input,select,textarea")?.focus(); });
  on(root.querySelector("[data-form-confirm]"), "click", () => { root.emit("submit", { values }); if (status) status.textContent = "Reviewed values passed to the host application."; });
  if (root.querySelector('[data-start="review"]')) showReview(false);
  return {};
}
