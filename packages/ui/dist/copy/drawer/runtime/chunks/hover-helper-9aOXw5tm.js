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
	let pointer = null, frame = 0, timer = 0, pending = null, dismissed = null, saved = null, returnTo = null, closeButton = null, lastPointerType = "mouse", restoring = false;
	Object.assign(helper.style, {
		position: "fixed",
		maxInlineSize: `min(${HOVER_HELPER.maxInline}, calc(100vw - ${2 * HOVER_HELPER.gutter}px))`,
		maxBlockSize: `min(${HOVER_HELPER.maxBlock}, calc(100vh - ${2 * HOVER_HELPER.gutter}px))`,
		overflow: "auto",
		pointerEvents: "none"
	});
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
	const viewport = () => ({
		width: doc.documentElement.clientWidth,
		height: doc.documentElement.clientHeight
	});
	const measure = () => {
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
	const schedule = () => {
		if (!frame) frame = win.requestAnimationFrame(() => {
			frame = 0;
			place();
		});
	};
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
		const mine = ++generation;
		if (pinned) unpin(false);
		current = target;
		mode = how;
		ready = false;
		let result;
		try {
			result = render?.(target, helper);
			if (result instanceof Promise) result = await result;
		} catch {
			result = false;
		}
		if (mine !== generation) return false;
		if (result === false) {
			close();
			return false;
		}
		ready = true;
		helper.hidden = false;
		helper.scrollTop = 0;
		place();
		notify();
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
			try {
				(focusable(target) ? target : back)?.focus({ preventScroll: true });
			} finally {
				restoring = false;
			}
		}
		if (was) notify();
	}
	const leave = () => {
		if (pinned) return;
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
		const active = doc.activeElement;
		returnTo = active && active !== doc.body && !helper.contains(active) ? active : null;
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
	on(doc, "pointermove", (event) => {
		lastPointerType = event.pointerType;
		if (pinned) return;
		if (!pointerTypes.includes(event.pointerType)) {
			if (mode === "pointer" || pending) close();
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
		if (current && target !== current && holdsFocus()) return;
		if (target === current && visible()) {
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
		const target = event.target instanceof Node ? event.target : null;
		if (!visible() || target && (helper.contains(target) || current.contains(target))) return;
		close();
	}, { capture: true });
	on(doc, "click", (event) => {
		const target = triggerOf(event.target);
		if (!target || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
		const type = event.pointerType || (event.detail === 0 ? "keyboard" : lastPointerType);
		if (type === "touch" ? !touch : type !== "keyboard" && !pointerTypes.includes(type)) return;
		if (pinned && target === current) return;
		if (pinRule === false) {
			if (visible()) close();
			return;
		}
		if (pinRule === true) {
			event.preventDefault();
			if (current === target && visible() && ready) {
				pin();
				return;
			}
			reveal(target, type === "mouse" || type === "pen" ? "pointer" : "anchor").then((shown) => {
				if (shown && current === target) pin();
			});
			return;
		}
		if (!(current === target && visible())) {
			const how = (type === "mouse" || type === "pen") && pointer ? "pointer" : "anchor";
			cancelOpen();
			generation++;
			current = target;
			mode = how;
			const result = render?.(target, helper);
			if (result instanceof Promise || result === false) {
				close();
				return;
			}
			ready = true;
			helper.hidden = false;
			place();
		}
		if (pinnable()) {
			event.preventDefault();
			pin();
		} else {
			dismissed = target;
			close();
		}
	});
	on(doc, "keydown", (event) => {
		if (event.key === "Escape" && (visible() || pending)) {
			const wasPinned = pinned;
			event.preventDefault();
			event.stopImmediatePropagation();
			dismissed = current ?? pending;
			close(wasPinned || helper.contains(doc.activeElement));
			return;
		}
		if (event.key === "Enter" && !pinned && pinRule !== false && byFocus) {
			const target = triggerOf(event.target);
			if (!target || target !== current || !visible() || !ready) return;
			if (pinRule === true || pinnable()) {
				event.preventDefault();
				pin();
			}
		}
	}, { capture: true });
	on(doc, "focusin", (event) => {
		const target = event.target;
		if (restoring || helper.contains(target)) return;
		const trigger = byFocus ? triggerOf(target) : null;
		if (trigger) {
			if (trigger === current && visible()) return;
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
			if (pinned || holdsFocus() || current?.matches(":hover")) return;
			if (current) close();
		});
	});
	on(doc, "click", (event) => {
		if (closeButton && event.target instanceof Node && closeButton.contains(event.target)) close(true);
	});
	on(doc, "wheel", (event) => {
		if (!visible() || pinned && helper.contains(event.target)) return;
		const target = event.target instanceof Node ? event.target : null;
		if (!target || !current.contains(target)) return;
		const delta = wheelPixels(event, helper);
		if (!canScroll(helper, delta)) return;
		event.preventDefault();
		helper.scrollTop += delta;
	}, { passive: false });
	const revalidate = (event) => {
		if (!visible() || event?.target instanceof Node && helper.contains(event.target)) return;
		if (pinned || mode !== "pointer" || !pointer) {
			schedule();
			return;
		}
		win.requestAnimationFrame(() => {
			if (!visible() || pinned || mode !== "pointer") return;
			const hit = doc.elementFromPoint(pointer.x, pointer.y);
			if (hit && triggerOf(hit) === current) place();
			else leave();
		});
	};
	on(doc, "scroll", revalidate, {
		capture: true,
		passive: true
	});
	on(win, "resize", revalidate);
	const passiveClose = () => {
		if (!pinned) close();
	};
	on(win, "blur", passiveClose);
	on(doc, "pointercancel", passiveClose);
	on(doc, "visibilitychange", () => {
		if (doc.hidden) passiveClose();
	});
	helper.hidden = true;
	return {
		/** Open for a trigger, anchored (as keyboard focus does). */
		show: (target) => reveal(target, "anchor"),
		close: () => close(),
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
			close();
			abort.abort();
			win.cancelAnimationFrame(frame);
		}
	};
}
export { hoverHelper as a, followPoint as i, anchorPoint as n, interactive as o, canScroll as r, overflows as s, HOVER_HELPER as t };
