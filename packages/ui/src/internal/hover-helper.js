/* One algorithm for every hover helper (D-042; spec/foundations.md, Hover
   helpers). A helper is the extra text a pointer reveals over a trigger: a
   tooltip, the colour-circle preview, the token inspector.

   - Pointer: the helper sits 12px after and below the pointer and follows it,
     once per animation frame. It flips to the pointer's other side instead of
     crossing a viewport edge and keeps an 8px gutter, so it is never clipped.
     It takes no pointer events while it follows.
   - Keyboard focus and touch have no pointer: the helper anchors to its
     trigger, below it, or above when there is no room below.
   - It closes as soon as the pointer leaves its trigger. Keyboard focus on the
     trigger, or focus inside the helper, keeps it open, anchored.
   - It is capped at 40vh by 24rem and scrolls. With the pointer on the
     trigger, the wheel scrolls an overflowing helper, and only while the
     helper can still scroll that way; then the page scrolls.
   - A click, tap or Enter on a trigger whose helper overflows or holds
     interactive content pins it: a non-modal popover (popover.md) that stops
     following, takes pointer events, shows a close button and receives focus.
     Escape and the close button close it and return focus to the trigger; a
     press outside closes it and leaves focus where the press puts it. The
     first activation pins; a second activation of the pinned trigger is the
     trigger's own (a link navigates, a button acts).
   - Nothing moves focus on hover. Positioning never animates. */

export const HOVER_HELPER = Object.freeze({ offset: 12, gutter: 8, gap: 4, openDelay: 300, maxBlock: "40vh", maxInline: "24rem" });

const fit = (start, size, limit, gutter) => Math.max(gutter, Math.min(start, limit - size - gutter));

/** Where a pointer-following helper of `size` goes, in viewport pixels. */
export function followPoint(point, size, viewport, { offset = HOVER_HELPER.offset, gutter = HOVER_HELPER.gutter, rtl = false } = {}) {
  const axis = (at, extent, limit, reverse) => {
    const after = at + offset, before = at - offset - extent;
    const afterFits = after + extent <= limit - gutter, beforeFits = before >= gutter;
    const preferAfter = !reverse;
    const start = preferAfter
      ? (afterFits || !beforeFits && limit - at >= at ? after : before)
      : (beforeFits || !afterFits && at >= limit - at ? before : after);
    return fit(start, extent, limit, gutter);
  };
  return { left: axis(point.x, size.width, viewport.width, rtl), top: axis(point.y, size.height, viewport.height, false) };
}

/** Where a helper anchored to a trigger's `rect` goes: below, else above. */
export function anchorPoint(rect, size, viewport, { gap = HOVER_HELPER.gap, gutter = HOVER_HELPER.gutter, rtl = false } = {}) {
  const below = rect.bottom + gap, above = rect.top - gap - size.height;
  const top = below + size.height <= viewport.height - gutter || viewport.height - rect.bottom >= rect.top ? below : above;
  return { left: fit(rtl ? rect.right - size.width : rect.left, size.width, viewport.width, gutter), top: fit(top, size.height, viewport.height, gutter) };
}

/** True while `element` can still scroll by `delta` pixels on the block axis. */
export function canScroll(element, delta) {
  if (delta > 0) return element.scrollTop + element.clientHeight < element.scrollHeight - 1;
  if (delta < 0) return element.scrollTop > 0;
  return false;
}

export const overflows = element => element.scrollHeight > element.clientHeight + 1 || element.scrollWidth > element.clientWidth + 1;
const INTERACTIVE = 'a[href],button,input,select,textarea,summary,[contenteditable],[tabindex]:not([tabindex="-1"])';
export const interactive = (element, except) => [...element.querySelectorAll(INTERACTIVE)].some(node => node !== except && !except?.contains(node));

const wheelPixels = (event, element) => event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientHeight : 1);
const focusable = node => node instanceof HTMLElement && node.isConnected && (node.tabIndex >= 0 || node.matches("a[href],button,input,select,textarea,summary"));
const SAVED = ["role", "aria-hidden", "aria-label", "aria-labelledby", "tabindex"];

/**
 * Drive one helper element for one or many triggers.
 * @param {HTMLElement} helper The helper; positioned fixed by this controller.
 * @param {object} options
 * @param {(node: Element) => Element | null} options.trigger The trigger an event target belongs to, or null.
 * @param {(trigger: Element, helper: HTMLElement) => (boolean | void | Promise<boolean | void>)} [options.render] Fill the helper; false cancels.
 * @param {number} [options.openDelay] Pointer open delay in ms (tooltips 300; 0 opens at once).
 * @param {"auto" | boolean} [options.pin] "auto" pins when the helper overflows or holds interactive content; true always (content known to be interactive); false never.
 * @param {boolean} [options.focus] Keyboard focus on a trigger opens it anchored (default true).
 * @param {boolean} [options.touch] A tap may pin it (default true).
 * @param {string[]} [options.pointerTypes] Pointers that hover (default mouse and pen).
 * @param {(trigger: Element) => string} [options.label] Accessible name of the pinned helper.
 * @param {string} [options.closeLabel] Accessible name of the close button.
 * @param {string} [options.closeClass] Class of the close button.
 * @param {(state: { open: boolean, pinned: boolean, trigger: Element | null }) => void} [options.onChange]
 */
export function hoverHelper(helper, options) {
  const { trigger: match, render, openDelay = HOVER_HELPER.openDelay, pin: pinRule = "auto", focus: byFocus = true, touch = true, pointerTypes = ["mouse", "pen"], label, closeLabel = "Close", closeClass = "tooltip-close", onChange } = options;
  const doc = helper.ownerDocument, win = doc.defaultView;
  const abort = new AbortController();
  const on = (target, type, handler, extra = {}) => target.addEventListener(type, handler, { ...extra, signal: abort.signal });
  let current = null, mode = null, pinned = false, ready = false, generation = 0;
  let pointer = null, frame = 0, timer = 0, pending = null, dismissed = null, saved = null, returnTo = null, closeButton = null, lastPointerType = "mouse", restoring = false;

  Object.assign(helper.style, { position: "fixed", maxInlineSize: `min(${HOVER_HELPER.maxInline}, calc(100vw - ${2 * HOVER_HELPER.gutter}px))`, maxBlockSize: `min(${HOVER_HELPER.maxBlock}, calc(100vh - ${2 * HOVER_HELPER.gutter}px))`, overflow: "auto", pointerEvents: "none" });

  const visible = () => !helper.hidden && !!current;
  const notify = () => onChange?.({ open: visible(), pinned, trigger: current });
  const triggerOf = node => node instanceof Element && !helper.contains(node) ? match(node) : null;
  const holdsFocus = () => {
    const active = doc.activeElement;
    if (!active || active === doc.body) return false;
    return helper.contains(active) || (byFocus && !!current?.contains(active) && active.matches(":focus-visible"));
  };
  const viewport = () => ({ width: doc.documentElement.clientWidth, height: doc.documentElement.clientHeight });
  /* A fixed box near the right edge shrinks to the space left: measure it at the gutter. */
  const measure = () => {
    helper.style.left = `${HOVER_HELPER.gutter}px`; helper.style.top = `${HOVER_HELPER.gutter}px`;
    const { width, height } = helper.getBoundingClientRect();
    return { width, height };
  };
  const rtl = () => !!current && win.getComputedStyle(current).direction === "rtl";
  const place = () => {
    if (!visible()) return;
    let at;
    if (pinned) {
      const { left, top } = helper.getBoundingClientRect(), size = measure(), view = viewport(), g = HOVER_HELPER.gutter;
      at = { left: fit(left, size.width, view.width, g), top: fit(top, size.height, view.height, g) };
    } else if (mode === "pointer" && pointer) at = followPoint(pointer, measure(), viewport(), { rtl: rtl() });
    else at = anchorPoint(current.getBoundingClientRect(), measure(), viewport(), { rtl: rtl() });
    helper.style.left = `${at.left}px`; helper.style.top = `${at.top}px`;
  };
  const schedule = () => { if (!frame) frame = win.requestAnimationFrame(() => { frame = 0; place(); }); };

  const cancelOpen = () => { win.clearTimeout(timer); timer = 0; pending = null; };
  const reveal = async (target, how) => {
    cancelOpen();
    if (current === target && visible()) { mode = how; place(); return true; }
    const mine = ++generation;
    if (pinned) unpin(false);
    current = target; mode = how; ready = false;
    let result;
    try { result = render?.(target, helper); if (result instanceof Promise) result = await result; }
    catch { result = false; }
    if (mine !== generation) return false;
    if (result === false) { close(); return false; }
    ready = true;
    helper.hidden = false;
    helper.scrollTop = 0;
    place(); notify();
    return true;
  };
  const open = (target, how) => {
    if (dismissed === target) return;
    if (how === "pointer" && openDelay > 0 && !visible()) {
      if (pending === target) return;
      cancelOpen();
      pending = target;
      /* The pending trigger counts as current, so a slow open is cancelled by leaving. */
      timer = win.setTimeout(() => { timer = 0; pending = null; void reveal(target, "pointer"); }, openDelay);
      return;
    }
    void reveal(target, how);
  };
  function close(restore = false) {
    cancelOpen();
    generation++;
    const target = current, back = returnTo;
    if (pinned) unpin(false);
    const was = visible();
    helper.hidden = true; current = null; mode = null; ready = false;
    /* Focus returns to the trigger without reopening its helper. */
    if (restore) { dismissed = target; restoring = true; try { (focusable(target) ? target : back)?.focus({ preventScroll: true }); } finally { restoring = false; } }
    if (was) notify();
  }
  const leave = () => {
    if (pinned) return;
    if (holdsFocus()) { mode = "anchor"; schedule(); return; }
    close();
  };

  const pinnable = () => pinRule === true || (pinRule === "auto" && (overflows(helper) || interactive(helper, closeButton)));
  function pin() {
    if (pinned || !visible()) return;
    pinned = true;
    const active = doc.activeElement;
    returnTo = active && active !== doc.body && !helper.contains(active) ? active : null;
    saved = Object.fromEntries(SAVED.map(name => [name, helper.getAttribute(name)]));
    helper.setAttribute("role", "dialog");
    helper.removeAttribute("aria-hidden");
    const name = label?.(current);
    if (name) helper.setAttribute("aria-label", name);
    helper.tabIndex = -1;
    helper.dataset.pinned = "";
    helper.style.pointerEvents = "auto";
    if (current.hasAttribute("aria-expanded")) saved.expanded = current.getAttribute("aria-expanded");
    current.setAttribute("aria-expanded", "true");
    closeButton = doc.createElement("button");
    closeButton.type = "button"; closeButton.className = closeClass; closeButton.setAttribute("aria-label", closeLabel); closeButton.textContent = "×";
    helper.prepend(closeButton);
    place();
    helper.focus({ preventScroll: true });
    notify();
  }
  function unpin(notifyChange = true) {
    if (!pinned) return;
    pinned = false;
    closeButton?.remove(); closeButton = null;
    for (const name of SAVED) saved[name] === null ? helper.removeAttribute(name) : helper.setAttribute(name, saved[name]);
    if (current) "expanded" in saved ? current.setAttribute("aria-expanded", saved.expanded) : current.removeAttribute("aria-expanded");
    delete helper.dataset.pinned;
    helper.style.pointerEvents = "none";
    saved = null;
    if (notifyChange) notify();
  }

  on(doc, "pointermove", event => {
    lastPointerType = event.pointerType;
    if (pinned) return;
    if (!pointerTypes.includes(event.pointerType)) { if (mode === "pointer" || pending) close(); return; }
    pointer = { x: event.clientX, y: event.clientY };
    const target = triggerOf(event.target);
    if (dismissed && target !== dismissed) dismissed = null;
    if (!target) { if (pending) cancelOpen(); if (mode === "pointer") leave(); return; }
    /* Keyboard focus wins: hovering never takes over a helper focus holds. */
    if (current && target !== current && holdsFocus()) return;
    if (target === current && visible()) { mode = "pointer"; schedule(); return; }
    open(target, "pointer");
  });
  on(doc, "pointerout", event => {
    if (pinned || !current && !pending) return;
    const to = event.relatedTarget instanceof Node ? event.relatedTarget : null;
    const owner = current ?? pending;
    if (to && owner.contains(to)) return;
    if (pending) cancelOpen();
    if (mode === "pointer") leave();
  });
  on(doc, "pointerdown", event => {
    lastPointerType = event.pointerType;
    const target = event.target instanceof Node ? event.target : null;
    if (!visible() || target && (helper.contains(target) || current.contains(target))) return;
    close();
  }, { capture: true });
  on(doc, "click", event => {
    const target = triggerOf(event.target);
    if (!target || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const type = event.pointerType || (event.detail === 0 ? "keyboard" : lastPointerType);
    if (type === "touch" ? !touch : type !== "keyboard" && !pointerTypes.includes(type)) return;
    /* A second activation of the pinned trigger is the trigger's own. */
    if (pinned && target === current) return;
    if (pinRule === false) { if (visible()) close(); return; }
    if (pinRule === true) {
      event.preventDefault();
      if (current === target && visible() && ready) { pin(); return; }
      const how = type === "mouse" || type === "pen" ? "pointer" : "anchor";
      void reveal(target, how).then(shown => { if (shown && current === target) pin(); });
      return;
    }
    /* "auto": measure synchronously, so a short helper never blocks the trigger's activation. */
    if (!(current === target && visible())) {
      const how = (type === "mouse" || type === "pen") && pointer ? "pointer" : "anchor";
      cancelOpen(); generation++; current = target; mode = how;
      const result = render?.(target, helper);
      if (result instanceof Promise || result === false) { close(); return; }
      ready = true; helper.hidden = false; place();
    }
    if (pinnable()) { event.preventDefault(); pin(); }
    else { dismissed = target; close(); }
  });
  on(doc, "keydown", event => {
    if (event.key === "Escape" && pending && !visible()) { dismissed = pending; cancelOpen(); return; }
    if (event.key === "Escape" && visible()) {
      const wasPinned = pinned;
      event.preventDefault(); event.stopImmediatePropagation();
      dismissed = current;
      close(wasPinned || helper.contains(doc.activeElement));
      return;
    }
    if (event.key === "Enter" && !pinned && pinRule !== false && byFocus) {
      const target = triggerOf(event.target);
      if (!target || target !== current || !visible() || !ready) return;
      if (pinRule === true || pinnable()) { event.preventDefault(); pin(); }
    }
  }, { capture: true });
  on(doc, "focusin", event => {
    const target = event.target;
    if (restoring || helper.contains(target)) return;
    const trigger = byFocus ? triggerOf(target) : null;
    if (trigger) {
      if (trigger === current && visible()) return;
      dismissed = null;
      if (pinned) close();
      void reveal(trigger, "anchor");
      return;
    }
    /* Focus elsewhere: a pinned helper closes; an anchored one loses its reason. */
    if (pinned || mode === "anchor") close();
  });
  on(doc, "focusout", event => {
    if (event.relatedTarget || pinned) return;
    queueMicrotask(() => {
      if (pinned || holdsFocus() || current?.matches(":hover")) return;
      if (current) close();
    });
  });
  on(doc, "click", event => { if (closeButton && event.target instanceof Node && closeButton.contains(event.target)) close(true); });
  /* While the pointer is on the trigger the wheel scrolls an overflowing helper. */
  on(doc, "wheel", event => {
    if (!visible() || pinned && helper.contains(event.target)) return;
    const target = event.target instanceof Node ? event.target : null;
    if (!target || !current.contains(target)) return;
    const delta = wheelPixels(event, helper);
    if (!canScroll(helper, delta)) return;
    event.preventDefault();
    helper.scrollTop += delta;
  }, { passive: false });
  /* Scroll and resize: a following helper is revalidated against the last
     pointer position; an anchored one re-anchors; a pinned one stays inside
     the gutter. */
  const revalidate = event => {
    if (!visible() || event?.target instanceof Node && helper.contains(event.target)) return;
    if (pinned || mode !== "pointer" || !pointer) { schedule(); return; }
    win.requestAnimationFrame(() => {
      if (!visible() || pinned || mode !== "pointer") return;
      const hit = doc.elementFromPoint(pointer.x, pointer.y);
      if (hit && triggerOf(hit) === current) place();
      else leave();
    });
  };
  on(doc, "scroll", revalidate, { capture: true, passive: true });
  on(win, "resize", revalidate);
  const passiveClose = () => { if (!pinned) close(); };
  on(win, "blur", passiveClose);
  on(doc, "pointercancel", passiveClose);
  on(doc, "visibilitychange", () => { if (doc.hidden) passiveClose(); });

  helper.hidden = true;
  return {
    /** Open for a trigger, anchored (as keyboard focus does). */
    show: target => reveal(target, "anchor"),
    close: () => close(),
    pin,
    get open() { return visible(); },
    get pinned() { return pinned; },
    get trigger() { return current; },
    destroy() { close(); abort.abort(); win.cancelAnimationFrame(frame); },
  };
}
