// packages/ui/src/internal/hover-helper.js
var HOVER_HELPER = Object.freeze({
	offset: 12,
	gutter: 8,
	gap: 4,
	openDelay: 300,
	maxBlock: "40vh",
	maxInline: "24rem"
});
var fit = (start, size, limit, gutter) => Math.max(gutter, Math.min(start, limit - size - gutter));
/** Where a pointer-following helper of `size` goes, in viewport pixels. */
function followPoint(point, size, viewport, { offset = HOVER_HELPER.offset, gutter = HOVER_HELPER.gutter, rtl = false } = {}) {
	const axis = (at, extent, limit, reverse) => {
		const after = at + offset, before = at - offset - extent;
		const afterFits = after + extent <= limit - gutter, beforeFits = before >= gutter;
		return fit(!reverse ? afterFits || !beforeFits && limit - at >= at ? after : before : beforeFits || !afterFits && at >= limit - at ? before : after, extent, limit, gutter);
	};
	return {
		left: axis(point.x, size.width, viewport.width, rtl),
		top: axis(point.y, size.height, viewport.height, false)
	};
}
/** Where a helper anchored to a trigger's `rect` goes: below, else above. */
function anchorPoint(rect, size, viewport, { gap = HOVER_HELPER.gap, gutter = HOVER_HELPER.gutter, rtl = false } = {}) {
	const below = rect.bottom + gap, above = rect.top - gap - size.height;
	const top = below + size.height <= viewport.height - gutter || viewport.height - rect.bottom >= rect.top ? below : above;
	return {
		left: fit(rtl ? rect.right - size.width : rect.left, size.width, viewport.width, gutter),
		top: fit(top, size.height, viewport.height, gutter)
	};
}
/** True while `element` can still scroll by `delta` pixels on the block axis. */
function canScroll(element, delta) {
	if (delta > 0) return element.scrollTop + element.clientHeight < element.scrollHeight - 1;
	if (delta < 0) return element.scrollTop > 0;
	return false;
}
var overflows = (element) => element.scrollHeight > element.clientHeight + 1 || element.scrollWidth > element.clientWidth + 1;
var INTERACTIVE = "a[href],button,input,select,textarea,summary,[contenteditable],[tabindex]:not([tabindex=\"-1\"])";
var interactive = (element, except) => [...element.querySelectorAll(INTERACTIVE)].some((node) => node !== except && !except?.contains(node));
/** The size cap for a helper, from the same viewport its placement uses
(documentElement.clientWidth/Height, which exclude classic scrollbars). */
function helperLimits(viewport, { gutter = HOVER_HELPER.gutter } = {}) {
	return {
		maxInlineSize: `min(${HOVER_HELPER.maxInline}, ${Math.max(0, viewport.width - 2 * gutter)}px)`,
		maxBlockSize: `min(${HOVER_HELPER.maxBlock}, ${Math.max(0, viewport.height - 2 * gutter)}px)`
	};
}
var REGISTRY = Symbol.for("j3w1.hover-helper.controllers");
var registry = (doc) => doc[REGISTRY] ??= /* @__PURE__ */ new Set();
var REPLAYED = Symbol.for("j3w1.hover-helper.replayed");
var ENTER_CLICKS = "a[href],area[href],button,input[type=button],input[type=submit],input[type=reset],input[type=image],summary";
var UNREPLAYABLE = "select,textarea,[contenteditable]:not([contenteditable=\"false\"]),input:not([type=button],[type=submit],[type=reset],[type=image],[type=checkbox],[type=radio])";
var EVENT_FIELDS = [
	"bubbles",
	"cancelable",
	"composed",
	"view",
	"detail",
	"screenX",
	"screenY",
	"clientX",
	"clientY",
	"ctrlKey",
	"shiftKey",
	"altKey",
	"metaKey",
	"button",
	"buttons",
	"pointerId",
	"pointerType",
	"width",
	"height",
	"pressure",
	"tangentialPressure",
	"tiltX",
	"tiltY",
	"twist",
	"isPrimary",
	"key",
	"code",
	"location",
	"repeat",
	"isComposing"
];
var thenable = (value) => typeof value?.then === "function";
var wheelPixels = (event, element) => event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientHeight : 1);
var focusable = (node) => node instanceof HTMLElement && node.isConnected && (node.tabIndex >= 0 || node.matches("a[href],button,input,select,textarea,summary"));
var SAVED = [
	"role",
	"aria-hidden",
	"aria-label",
	"aria-labelledby",
	"tabindex"
];
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
function hoverHelper(helper, options) {
	const { trigger: match, render, openDelay = HOVER_HELPER.openDelay, pin: pinRule = "auto", focus: byFocus = true, touch = true, pointerTypes = ["mouse", "pen"], label, closeLabel = "Close", closeClass = "tooltip-close", onChange } = options;
	const doc = helper.ownerDocument, win = doc.defaultView;
	const abort = new AbortController();
	const on = (target, type, handler, extra = {}) => target.addEventListener(type, handler, {
		...extra,
		signal: abort.signal
	});
	let current = null, mode = null, pinned = false, ready = false, generation = 0;
	let pointer = null, frame = 0, recheck = false, timer = 0, pending = null, dismissed = null, saved = null, returnTo = null, closeButton = null;
	let lastPointerType = "mouse", restoring = false, pinIntent = null, activation = null, pressFocus = null, rendering = null;
	const viewport = () => ({
		width: doc.documentElement.clientWidth,
		height: doc.documentElement.clientHeight
	});
	Object.assign(helper.style, {
		position: "fixed",
		overflow: "auto",
		pointerEvents: "none"
	}, helperLimits(viewport()));
	const visible = () => !helper.hidden && !!current;
	const notify = () => onChange?.({
		open: visible(),
		pinned,
		trigger: current
	});
	const triggerOf = (node) => node instanceof Element && !helper.contains(node) ? match(node) : null;
	const holdsFocus = () => {
		const active = doc.activeElement;
		if (!active || active === doc.body) return false;
		return helper.contains(active) || byFocus && !!current?.contains(active) && active.matches(":focus-visible");
	};
	const self = { ownsFocus: () => pinned && helper.contains(doc.activeElement) };
	const measure = () => {
		Object.assign(helper.style, helperLimits(viewport()));
		helper.style.left = `${HOVER_HELPER.gutter}px`;
		helper.style.top = `${HOVER_HELPER.gutter}px`;
		const { width, height } = helper.getBoundingClientRect();
		return {
			width,
			height
		};
	};
	const rtl = () => !!current && win.getComputedStyle(current).direction === "rtl";
	const place = () => {
		if (!visible()) return;
		let at;
		if (pinned) {
			const { left, top } = helper.getBoundingClientRect(), size = measure(), view = viewport(), g = HOVER_HELPER.gutter;
			at = {
				left: fit(left, size.width, view.width, g),
				top: fit(top, size.height, view.height, g)
			};
		} else if (mode === "pointer" && pointer) at = followPoint(pointer, measure(), viewport(), { rtl: rtl() });
		else at = anchorPoint(current.getBoundingClientRect(), measure(), viewport(), { rtl: rtl() });
		helper.style.left = `${at.left}px`;
		helper.style.top = `${at.top}px`;
	};
	const tick = () => {
		frame = 0;
		const check = recheck;
		recheck = false;
		if (!visible()) return;
		if (check && !pinned && mode === "pointer" && pointer) {
			const hit = doc.elementFromPoint(pointer.x, pointer.y);
			if (!hit || triggerOf(hit) !== current) {
				leave();
				return;
			}
		}
		place();
	};
	const schedule = (check = false) => {
		if (check) recheck = true;
		if (!frame) frame = win.requestAnimationFrame(tick);
	};
	const show = () => {
		ready = true;
		helper.hidden = false;
		helper.scrollTop = 0;
		place();
		notify();
	};
	const STALE = {};
	const draw = (target) => {
		if (rendering?.target === target) return rendering.promise;
		const run = () => {
			if (current !== target) return STALE;
			try {
				return render?.(target, helper);
			} catch {
				return false;
			}
		};
		const result = rendering ? rendering.promise.then(run) : run();
		if (!thenable(result)) return result;
		const entry = {
			target,
			promise: Promise.resolve(result).then((value) => value, () => false)
		};
		rendering = entry;
		entry.promise.then(() => {
			if (rendering === entry) rendering = null;
		});
		return entry.promise;
	};
	const failed = (result) => result === false || result === STALE;
	const cancelOpen = () => {
		win.clearTimeout(timer);
		timer = 0;
		pending = null;
	};
	const reveal = async (target, how) => {
		cancelOpen();
		if (current === target && visible()) {
			mode = how;
			place();
			return true;
		}
		if (pinIntent === target) return activation;
		const mine = ++generation;
		if (pinned) unpin(false);
		current = target;
		mode = how;
		ready = false;
		let result = draw(target);
		if (thenable(result)) result = await result;
		if (mine !== generation) return false;
		if (failed(result)) {
			close();
			return false;
		}
		show();
		return true;
	};
	const open = (target, how) => {
		if (dismissed === target) return;
		if (how === "pointer" && openDelay > 0 && !visible()) {
			if (pending === target) return;
			cancelOpen();
			pending = target;
			timer = win.setTimeout(() => {
				timer = 0;
				pending = null;
				reveal(target, "pointer");
			}, openDelay);
			return;
		}
		reveal(target, how);
	};
	function close(restore = false) {
		cancelOpen();
		generation++;
		pinIntent = null;
		const target = current, back = returnTo;
		if (pinned) unpin(false);
		const was = visible();
		helper.hidden = true;
		current = null;
		mode = null;
		ready = false;
		if (restore) {
			dismissed = target;
			restoring = true;
			const destination = focusable(target) ? target : back?.isConnected ? back : null;
			try {
				if (destination) destination.focus({ preventScroll: true });
				else if (helper.contains(doc.activeElement)) doc.activeElement.blur();
			} finally {
				restoring = false;
			}
		}
		if (was) notify();
	}
	const closeKeepingFocus = () => close(helper.contains(doc.activeElement));
	const leave = () => {
		if (pinned || pinIntent) return;
		if (holdsFocus()) {
			mode = "anchor";
			schedule();
			return;
		}
		close();
	};
	const pinnable = () => pinRule === true || pinRule === "auto" && (overflows(helper) || interactive(helper, closeButton));
	function pin() {
		if (pinned || !visible()) return;
		pinned = true;
		pinIntent = null;
		const active = doc.activeElement;
		returnTo = active && active !== doc.body && !helper.contains(active) ? active : pressFocus;
		saved = Object.fromEntries(SAVED.map((name) => [name, helper.getAttribute(name)]));
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
		closeButton.type = "button";
		closeButton.className = closeClass;
		closeButton.setAttribute("aria-label", closeLabel);
		closeButton.textContent = "×";
		helper.prepend(closeButton);
		place();
		helper.focus({ preventScroll: true });
		notify();
	}
	function unpin(notifyChange = true) {
		if (!pinned) return;
		pinned = false;
		closeButton?.remove();
		closeButton = null;
		for (const name of SAVED) saved[name] === null ? helper.removeAttribute(name) : helper.setAttribute(name, saved[name]);
		if (current) "expanded" in saved ? current.setAttribute("aria-expanded", saved.expanded) : current.removeAttribute("aria-expanded");
		delete helper.dataset.pinned;
		helper.style.pointerEvents = "none";
		saved = null;
		if (notifyChange) notify();
	}
	const consume = (event) => {
		event.preventDefault();
		event.stopImmediatePropagation();
	};
	const replayer = (event, origin, target) => {
		const init = Object.fromEntries(EVENT_FIELDS.filter((name) => name in event).map((name) => [name, event[name]]));
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
		if (pinnable()) {
			if (event) consume(event);
			pin();
			return true;
		}
		dismissed = target;
		close();
		return false;
	};
	const activate = (target, how, event) => {
		if (current === target && visible() && ready) {
			decide(target, event);
			return;
		}
		cancelOpen();
		const mine = ++generation;
		if (pinned) unpin(false);
		current = target;
		mode = how;
		ready = false;
		const result = draw(target);
		if (!thenable(result)) {
			if (failed(result)) {
				close();
				return;
			}
			show();
			decide(target, event);
			return;
		}
		const origin = event.composedPath?.()[0] ?? event.target;
		const control = origin instanceof Element ? origin.closest(UNREPLAYABLE) : null;
		if (control && target.contains(control)) {
			dismissed = target;
			close();
			return;
		}
		const replay = replayer(event, origin, target);
		consume(event);
		pinIntent = target;
		activation = result.then((value) => {
			if (mine !== generation || pinIntent !== target) return visible() && current === target;
			pinIntent = null;
			if (failed(value)) close();
			else {
				show();
				if (decide(target, null)) return true;
			}
			replay();
			return false;
		});
	};
	on(doc, "pointermove", (event) => {
		lastPointerType = event.pointerType;
		if (pinned) return;
		if (!pointerTypes.includes(event.pointerType)) {
			if (!pinIntent && (mode === "pointer" || pending)) close();
			return;
		}
		pointer = {
			x: event.clientX,
			y: event.clientY
		};
		const target = triggerOf(event.target);
		if (dismissed && target !== dismissed) dismissed = null;
		if (!target) {
			if (pending) cancelOpen();
			if (mode === "pointer") leave();
			return;
		}
		if (current && target !== current && (holdsFocus() || pinIntent)) return;
		if (target === current && (visible() || pinIntent)) {
			if (mode === "anchor" && holdsFocus() || pinIntent) return;
			mode = "pointer";
			schedule();
			return;
		}
		open(target, "pointer");
	});
	on(doc, "pointerout", (event) => {
		if (pinned || !current && !pending) return;
		const to = event.relatedTarget instanceof Node ? event.relatedTarget : null;
		if (to && (current ?? pending).contains(to)) return;
		if (pending) cancelOpen();
		if (mode === "pointer") leave();
	});
	on(doc, "pointerdown", (event) => {
		lastPointerType = event.pointerType;
		const active = doc.activeElement;
		if (!(active && helper.contains(active))) pressFocus = active && active !== doc.body ? active : null;
		const target = event.target instanceof Node ? event.target : null;
		const owner = current ?? pinIntent;
		if (!owner || target && (helper.contains(target) || owner.contains(target))) return;
		if (visible() || pinIntent) close();
	}, { capture: true });
	on(doc, "click", (event) => {
		if (event[REPLAYED]) return;
		if (closeButton && event.target instanceof Node && closeButton.contains(event.target)) {
			close(true);
			return;
		}
		const target = triggerOf(event.target);
		if (!target || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
		const type = event.pointerType || (event.detail === 0 ? "keyboard" : lastPointerType);
		if (type === "touch" ? !touch : type !== "keyboard" && !pointerTypes.includes(type)) return;
		if (pinned && target === current) return;
		if (pinIntent === target) {
			consume(event);
			return;
		}
		if (pinRule === false) {
			if (visible()) close();
			return;
		}
		activate(target, (type === "mouse" || type === "pen") && pointer ? "pointer" : "anchor", event);
	}, { capture: true });
	on(doc, "keydown", (event) => {
		if (event[REPLAYED]) return;
		if (event.key === "Escape") {
			if (!visible()) {
				if (pinIntent) close();
				else if (pending) {
					dismissed = pending;
					cancelOpen();
				}
				return;
			}
			if (!self.ownsFocus() && [...registry(doc)].some((other) => other !== self && other.ownsFocus?.())) return;
			const wasPinned = pinned;
			event.preventDefault();
			event.stopImmediatePropagation();
			dismissed = current;
			close(wasPinned || helper.contains(doc.activeElement));
			return;
		}
		if (event.key === "Enter" && !pinned && pinRule !== false && byFocus) {
			const target = triggerOf(event.target);
			if (!target || target !== current) return;
			if (pinIntent === target) {
				consume(event);
				return;
			}
			if (visible() && ready) {
				if (pinnable()) {
					consume(event);
					pin();
				}
				return;
			}
			if (pinRule === true && !(event.target instanceof Element && event.target.matches(ENTER_CLICKS))) activate(target, "anchor", event);
		}
	}, { capture: true });
	on(doc, "focusin", (event) => {
		const target = event.target;
		if (restoring || helper.contains(target)) return;
		const owner = triggerOf(target);
		if (pinIntent && owner !== pinIntent) close();
		const trigger = byFocus ? owner : null;
		if (trigger) {
			if (trigger === current && visible()) {
				if (!pinned && target.matches(":focus-visible")) {
					mode = "anchor";
					schedule();
				}
				return;
			}
			if (trigger === pinIntent) return;
			dismissed = null;
			if (pinned) close();
			reveal(trigger, "anchor");
			return;
		}
		if (pinned || mode === "anchor") close();
	});
	on(doc, "focusout", (event) => {
		if (event.relatedTarget || pinned) return;
		queueMicrotask(() => {
			if (pinned || pinIntent || holdsFocus() || current?.matches(":hover")) return;
			if (current) close();
		});
	});
	on(doc, "wheel", (event) => {
		if (event.ctrlKey || !visible() || pinned && helper.contains(event.target)) return;
		const target = event.target instanceof Node ? event.target : null;
		if (!target || !current.contains(target)) return;
		const delta = wheelPixels(event, helper);
		if (!canScroll(helper, delta)) return;
		event.preventDefault();
		helper.scrollTop += delta;
	}, { passive: false });
	const revalidate = (event) => {
		if (!visible() || event?.target instanceof Node && helper.contains(event.target)) return;
		schedule(true);
	};
	on(doc, "scroll", revalidate, {
		capture: true,
		passive: true
	});
	on(win, "resize", revalidate);
	const passiveClose = () => {
		if (!pinned && !pinIntent) close();
	};
	on(win, "blur", passiveClose);
	on(doc, "pointercancel", passiveClose);
	on(doc, "visibilitychange", () => {
		if (doc.hidden) passiveClose();
	});
	registry(doc).add(self);
	helper.hidden = true;
	return {
		/** Open for a trigger, anchored (as keyboard focus does). */
		show: (target) => reveal(target, "anchor"),
		/** Close; focus inside the helper returns to its trigger, or for a trigger with no tab stop to where focus was before the press. */
		close: closeKeepingFocus,
		pin,
		get open() {
			return visible();
		},
		get pinned() {
			return pinned;
		},
		get trigger() {
			return current;
		},
		destroy() {
			closeKeepingFocus();
			abort.abort();
			win.cancelAnimationFrame(frame);
			frame = 0;
			recheck = false;
			registry(doc).delete(self);
		}
	};
}
export { helperLimits as a, overflows as c, followPoint as i, anchorPoint as n, hoverHelper as o, canScroll as r, interactive as s, HOVER_HELPER as t };
