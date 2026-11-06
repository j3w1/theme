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
     Escape and the close button close it and return focus to the trigger
     (for a trigger with no tab stop, to where focus was before the press); a
     press outside closes it and leaves focus where the press puts it. The
     pinning activation is consumed before it reaches the trigger's own
     handlers; a second activation of the pinned trigger is the trigger's own
     (a link navigates, a button acts). When the content is still loading, the
     activation waits for it: it pins if the helper turns out to need it, and
     otherwise a copy of it is replayed to its original target. Focus moving
     anywhere first, even to the page, abandons it. A target in a text field,
     select or editable region is never held, because a replay cannot perform
     its own activation.
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

/** The size cap for a helper, from the same viewport its placement uses
    (documentElement.clientWidth/Height, which exclude classic scrollbars). */
export function helperLimits(viewport, { gutter = HOVER_HELPER.gutter } = {}) {
  return {
    maxInlineSize: `min(${HOVER_HELPER.maxInline}, ${Math.max(0, viewport.width - 2 * gutter)}px)`,
    maxBlockSize: `min(${HOVER_HELPER.maxBlock}, ${Math.max(0, viewport.height - 2 * gutter)}px)`,
  };
}

/* Every live controller of a document, shared by every copy of this module
   (the portal bundles one copy and loads another from /ui/; a consumer may
   copy a third), so the one whose pinned helper holds focus gets Escape
   first. Each entry is { ownsFocus(): boolean }. */
const REGISTRY = Symbol.for("j3w1.hover-helper.controllers");
const registry = doc => (doc[REGISTRY] ??= new Set());
/* A replayed activation carries this mark, so no copy holds it again. */
const REPLAYED = Symbol.for("j3w1.hover-helper.replayed");
/* Enter on these becomes a click, which the click path holds. */
const ENTER_CLICKS = "a[href],area[href],button,input[type=button],input[type=submit],input[type=reset],input[type=image],summary";
/* A target whose own activation (a caret, a picker, a file chooser) an
   untrusted replay cannot perform: inside a text field or select, or
   anywhere editable, whether or not that context lies within the trigger.
   Its activation is never held. */
const FIELDS = "select,textarea,input:not([type=button],[type=submit],[type=reset],[type=image],[type=checkbox],[type=radio])";
const ownActivation = node => node instanceof Element && (!!node.closest(FIELDS) || !!node.closest("[contenteditable]")?.isContentEditable);
/* What a replay copies from the held event. */
const EVENT_FIELDS = ["bubbles", "cancelable", "composed", "view", "detail", "screenX", "screenY", "clientX", "clientY", "ctrlKey", "shiftKey", "altKey", "metaKey", "button", "buttons", "pointerId", "pointerType", "width", "height", "pressure", "tangentialPressure", "tiltX", "tiltY", "twist", "isPrimary", "key", "code", "location", "repeat", "isComposing"];
const thenable = value => typeof value?.then === "function";

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
  let pointer = null, frame = 0, recheck = false, timer = 0, pending = null, dismissed = null, saved = null, returnTo = null, closeButton = null;
  let lastPointerType = "mouse", restoring = false, pinIntent = null, activation = null, pressFocus = null, rendering = null;

  const viewport = () => ({ width: doc.documentElement.clientWidth, height: doc.documentElement.clientHeight });
  Object.assign(helper.style, { position: "fixed", overflow: "auto", pointerEvents: "none" }, helperLimits(viewport()));

  const visible = () => !helper.hidden && !!current;
  const notify = () => onChange?.({ open: visible(), pinned, trigger: current });
  const triggerOf = node => node instanceof Element && !helper.contains(node) ? match(node) : null;
  const holdsFocus = () => {
    const active = doc.activeElement;
    if (!active || active === doc.body) return false;
    return helper.contains(active) || (byFocus && !!current?.contains(active) && active.matches(":focus-visible"));
  };
  const self = { ownsFocus: () => pinned && helper.contains(doc.activeElement) };
  /* A fixed box near the right edge shrinks to the space left: measure it at
     the gutter, under the cap of the viewport the placement uses. */
  const measure = () => {
    Object.assign(helper.style, helperLimits(viewport()));
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
  /* One frame scheduler for pointer placement and for scroll and resize
     revalidation, so at most one measure and place runs per frame. A
     revalidation also closes a following helper whose trigger is no longer
     under the last pointer position. */
  const tick = () => {
    frame = 0;
    const check = recheck; recheck = false;
    if (!visible()) return;
    if (check && !pinned && mode === "pointer" && pointer) {
      const hit = doc.elementFromPoint(pointer.x, pointer.y);
      if (!hit || triggerOf(hit) !== current) { leave(); return; }
    }
    place();
  };
  const schedule = (check = false) => { if (check) recheck = true; if (!frame) frame = win.requestAnimationFrame(tick); };
  const show = () => { ready = true; helper.hidden = false; helper.scrollTop = 0; place(); notify(); };

  /* One render at a time. A trigger already rendering reuses that render;
     another trigger's render waits until it settles, so an older render never
     writes over newer content. A queued request belongs to the generation
     that made it (a reuse brings it forward), and one that a later request
     has superseded never calls the renderer. A render that never settles
     holds the ones after it. */
  const STALE = {};
  const draw = target => {
    if (rendering?.target === target) { rendering.mine = generation; return rendering.promise; }
    const entry = { target, mine: generation, promise: null };
    const run = () => {
      if (entry.mine !== generation) return STALE;
      try { return render?.(target, helper); } catch { return false; }
    };
    const result = rendering ? rendering.promise.then(run) : run();
    if (!thenable(result)) return result;
    entry.promise = Promise.resolve(result).then(value => value, () => false);
    rendering = entry;
    void entry.promise.then(() => { if (rendering === entry) rendering = null; });
    return entry.promise;
  };
  const failed = result => result === false || result === STALE;

  const cancelOpen = () => { win.clearTimeout(timer); timer = 0; pending = null; };
  const reveal = async (target, how) => {
    cancelOpen();
    if (current === target && visible()) { mode = how; place(); return true; }
    /* An activation waiting for this trigger's content settles it. */
    if (pinIntent === target) return activation;
    const mine = ++generation;
    pinIntent = null;
    if (pinned) unpin(false);
    current = target; mode = how; ready = false;
    let result = draw(target);
    if (thenable(result)) result = await result;
    if (mine !== generation) return false;
    if (failed(result)) { close(); return false; }
    show();
    return true;
  };
  const open = (target, how) => {
    if (dismissed === target) return;
    if (how === "pointer" && openDelay > 0 && !visible()) {
      if (pending === target) return;
      cancelOpen();
      pending = target;
      timer = win.setTimeout(() => { timer = 0; pending = null; void reveal(target, "pointer"); }, openDelay);
      return;
    }
    void reveal(target, how);
  };
  function close(restore = false) {
    cancelOpen();
    generation++;
    pinIntent = null;
    const target = current, back = returnTo;
    if (pinned) unpin(false);
    const was = visible();
    helper.hidden = true; current = null; mode = null; ready = false;
    /* Focus returns to the trigger, or to where it was before the press on an
       unfocusable trigger, without reopening the helper. */
    if (restore) {
      dismissed = target; restoring = true;
      const destination = focusable(target) ? target : back?.isConnected ? back : null;
      try { if (destination) destination.focus({ preventScroll: true }); else if (helper.contains(doc.activeElement)) doc.activeElement.blur(); }
      finally { restoring = false; }
    }
    if (was) notify();
  }
  /* Programmatic closing returns focus when it removes the focused content. */
  const closeKeepingFocus = () => close(helper.contains(doc.activeElement));
  const leave = () => {
    if (pinned || pinIntent) return;
    if (holdsFocus()) { mode = "anchor"; schedule(); return; }
    close();
  };

  const pinnable = () => pinRule === true || (pinRule === "auto" && (overflows(helper) || interactive(helper, closeButton)));
  function pin() {
    if (pinned || !visible()) return;
    pinned = true; pinIntent = null;
    const active = doc.activeElement;
    returnTo = active && active !== doc.body && !helper.contains(active) ? active : pressFocus;
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

  /* Activation. The pinning activation is consumed in the capture phase, so
     it never reaches the trigger's own handlers; one that does not pin is
     left alone. While the content loads the activation is held, then pinned
     or replayed: one settlement for a click, a tap and Enter. */
  const consume = event => { event.preventDefault(); event.stopImmediatePropagation(); };
  /* A replay is a copy of the held event (its type, point, button and keys)
     dispatched at its original target, so that target's handlers and its
     default action (a link navigates, a button submits) run. The copy is
     untrusted (isTrusted is false): a handler that checks it, or an API that
     needs user activation once the browser's transient activation from the
     real press has expired, does not accept it. */
  const replayer = (event, origin, target) => {
    const init = Object.fromEntries(EVENT_FIELDS.filter(name => name in event).map(name => [name, event[name]]));
    const Type = event.constructor;
    return () => {
      const at = origin instanceof Node && origin.isConnected ? origin : target.isConnected ? target : null;
      if (!at) return;
      const copy = new Type(event.type, init);
      copy[REPLAYED] = true;
      at.dispatchEvent(copy);
    };
  };
  const decide = (target, event) => {
    if (pinnable()) { if (event) consume(event); pin(); return true; }
    dismissed = target; close(); return false;
  };
  const activate = (target, how, event) => {
    if (current === target && visible() && ready) { decide(target, event); return; }
    cancelOpen();
    const mine = ++generation;
    if (pinned) unpin(false);
    current = target; mode = how; ready = false;
    const result = draw(target);
    if (!thenable(result)) {
      if (failed(result)) { close(); return; }
      show(); decide(target, event); return;
    }
    const origin = event.composedPath?.()[0] ?? event.target;
    if (ownActivation(origin)) { dismissed = target; close(); return; }
    const replay = replayer(event, origin, target);
    consume(event);
    pinIntent = target;
    /* Focus moving anywhere while the content loads, even to the page,
       abandons the activation: it neither pins nor replays. */
    const focused = doc.activeElement;
    activation = result.then(value => {
      if (mine !== generation || pinIntent !== target) return visible() && current === target;
      if (doc.activeElement !== focused) { close(); return false; }
      pinIntent = null;
      if (failed(value)) close();
      else { show(); if (decide(target, null)) return true; }
      replay();
      return false;
    });
  };

  on(doc, "pointermove", event => {
    lastPointerType = event.pointerType;
    if (pinned) return;
    if (!pointerTypes.includes(event.pointerType)) { if (!pinIntent && (mode === "pointer" || pending)) close(); return; }
    pointer = { x: event.clientX, y: event.clientY };
    const target = triggerOf(event.target);
    if (dismissed && target !== dismissed) dismissed = null;
    if (!target) { if (pending) cancelOpen(); if (mode === "pointer") leave(); return; }
    /* Keyboard focus and a pending pin win: hovering never takes over. */
    if (current && target !== current && (holdsFocus() || pinIntent)) return;
    if (target === current && (visible() || pinIntent)) {
      /* Keyboard focus on this trigger keeps the helper anchored. */
      if (mode === "anchor" && holdsFocus() || pinIntent) return;
      mode = "pointer"; schedule(); return;
    }
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
    /* Remember where focus was before this press can move it, for an unfocusable trigger. */
    const active = doc.activeElement;
    if (!(active && helper.contains(active))) pressFocus = active && active !== doc.body ? active : null;
    const target = event.target instanceof Node ? event.target : null;
    const owner = current ?? pinIntent;
    if (!owner || target && (helper.contains(target) || owner.contains(target))) return;
    if (visible() || pinIntent) close();
  }, { capture: true });
  on(doc, "click", event => {
    /* The close button acts on any click, a replayed one included. */
    if (closeButton && event.target instanceof Node && closeButton.contains(event.target)) { close(true); return; }
    if (event[REPLAYED]) return;
    const target = triggerOf(event.target);
    if (!target || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const type = event.pointerType || (event.detail === 0 ? "keyboard" : lastPointerType);
    if (type === "touch" ? !touch : type !== "keyboard" && !pointerTypes.includes(type)) return;
    /* A second activation of the pinned trigger is the trigger's own. */
    if (pinned && target === current) return;
    if (pinIntent === target) { consume(event); return; }
    if (pinRule === false) { if (visible()) close(); return; }
    activate(target, (type === "mouse" || type === "pen") && pointer ? "pointer" : "anchor", event);
  }, { capture: true });
  on(doc, "keydown", event => {
    if (event[REPLAYED]) return;
    if (event.key === "Escape") {
      if (!visible()) {
        if (pinIntent) close();
        else if (pending) { dismissed = pending; cancelOpen(); }
        return;
      }
      /* The controller whose pinned helper holds focus answers Escape first,
         whichever copy of this module runs it. */
      if (!self.ownsFocus() && [...registry(doc)].some(other => other !== self && other.ownsFocus?.())) return;
      const wasPinned = pinned;
      event.preventDefault(); event.stopImmediatePropagation();
      dismissed = current;
      close(wasPinned || helper.contains(doc.activeElement));
      return;
    }
    if (event.key === "Enter" && !pinned && pinRule !== false && byFocus) {
      const target = triggerOf(event.target);
      if (!target || target !== current) return;
      if (pinIntent === target) { consume(event); return; }
      if (visible() && ready) { if (pinnable()) { consume(event); pin(); } return; }
      /* Still loading. Enter on a link or button becomes a click, which the
         click path holds; any other trigger's Enter is held here, through the
         same settlement. */
      if (!(event.target instanceof Element && event.target.matches(ENTER_CLICKS))) activate(target, "anchor", event);
    }
  }, { capture: true });
  on(doc, "focusin", event => {
    const target = event.target;
    if (restoring || helper.contains(target)) return;
    const trigger = byFocus ? triggerOf(target) : null;
    if (trigger) {
      if (trigger === current && visible()) {
        /* Keyboard focus takes precedence over the pointer for its own trigger. */
        if (!pinned && target.matches(":focus-visible")) { mode = "anchor"; schedule(); }
        return;
      }
      if (trigger === pinIntent) return;
      dismissed = null;
      if (pinned) close();
      void reveal(trigger, "anchor");
      return;
    }
    if (pinned || mode === "anchor") close();
  });
  on(doc, "focusout", event => {
    if (event.relatedTarget || pinned) return;
    queueMicrotask(() => {
      if (pinned || pinIntent || holdsFocus() || current?.matches(":hover")) return;
      if (current) close();
    });
  });
  /* While the pointer is on the trigger the wheel scrolls an overflowing
     helper. Ctrl+wheel (and pinch) stays the browser's zoom. */
  on(doc, "wheel", event => {
    if (event.ctrlKey || !visible() || pinned && helper.contains(event.target)) return;
    const target = event.target instanceof Node ? event.target : null;
    if (!target || !current.contains(target)) return;
    const delta = wheelPixels(event, helper);
    if (!canScroll(helper, delta)) return;
    event.preventDefault();
    helper.scrollTop += delta;
  }, { passive: false });
  /* Scroll and resize, in the shared frame: a following helper is
     revalidated against the last pointer position; an anchored one
     re-anchors; a pinned one stays inside the gutter. */
  const revalidate = event => {
    if (!visible() || event?.target instanceof Node && helper.contains(event.target)) return;
    schedule(true);
  };
  on(doc, "scroll", revalidate, { capture: true, passive: true });
  on(win, "resize", revalidate);
  const passiveClose = () => { if (!pinned && !pinIntent) close(); };
  on(win, "blur", passiveClose);
  on(doc, "pointercancel", passiveClose);
  on(doc, "visibilitychange", () => { if (doc.hidden) passiveClose(); });

  registry(doc).add(self);
  helper.hidden = true;
  return {
    /** Open for a trigger, anchored (as keyboard focus does). */
    show: target => reveal(target, "anchor"),
    /** Close; focus inside the helper returns to its trigger, or for a trigger with no tab stop to where focus was before the press. */
    close: closeKeepingFocus,
    pin,
    get open() { return visible(); },
    get pinned() { return pinned; },
    get trigger() { return current; },
    destroy() {
      closeKeepingFocus();
      abort.abort();
      win.cancelAnimationFrame(frame);
      frame = 0; recheck = false;
      registry(doc).delete(self);
    },
  };
}
