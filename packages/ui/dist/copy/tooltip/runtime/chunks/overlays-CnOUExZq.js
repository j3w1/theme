import { i as all, o as enabled, s as identify, u as place } from "./choice-BYcDpKUh.js";
//#region packages/ui/src/behaviors/overlays.js
function modal(root, { on }) {
	const dialog = root.querySelector("dialog");
	if (!dialog) return {};
	let opener = null;
	const show = (trigger = root.ownerDocument.activeElement) => {
		if (dialog.open || root.hasAttribute("disabled")) return;
		opener = trigger;
		dialog.showModal();
		(dialog.querySelector("[autofocus]") ?? dialog.querySelector("button:not(.dialog-button-destructive)"))?.focus();
		root.emit("open", {});
	};
	const close = (value = "") => {
		if (dialog.open) dialog.close(String(value));
	};
	on(root, "click", (event) => {
		const button = event.target.closest("button");
		if (button?.matches("[data-open]")) {
			show(button);
			return;
		}
		if (button && dialog.contains(button) && enabled(button)) {
			if (button.matches("[data-close],.dialog-close,.drawer-close")) close(button.dataset.close ?? "cancel");
			else if (button.dataset.action && root.emit("action", { action: button.dataset.action })) close(button.dataset.action);
		}
		if (root.constructor.componentId === "drawer" && event.target.closest("a[href]") && dialog.contains(event.target)) close("navigate");
	});
	on(dialog, "cancel", (event) => {
		if (!root.emit("cancel", {})) event.preventDefault();
	});
	on(dialog, "close", () => {
		if (opener?.isConnected) opener.focus();
		root.emit("close", { returnValue: dialog.returnValue });
	});
	return {
		show,
		close,
		get open() {
			return dialog.open;
		},
		set open(value) {
			value ? show() : close();
		},
		get returnValue() {
			return dialog.returnValue;
		},
		cleanup() {
			if (dialog.open) dialog.close();
		}
	};
}
function tooltip(root, { on }) {
	const trigger = root.querySelector(".tooltip-trigger"), popup = root.querySelector("[role=\"tooltip\"]");
	if (!trigger || !popup) return {};
	identify(root, popup, "tooltip");
	trigger.setAttribute("aria-describedby", popup.id);
	let timer, dismissed = false, hovering = false;
	const stop = () => {
		clearTimeout(timer);
	};
	const hide = () => {
		stop();
		popup.hidden = true;
	};
	const show = () => {
		stop();
		if (!dismissed) {
			popup.hidden = false;
			place(trigger, popup);
		}
	};
	on(trigger, "pointerenter", (event) => {
		if (event.pointerType !== "touch") {
			hovering = true;
			dismissed = false;
			timer = setTimeout(show, 300);
		}
	});
	on(root, "pointerleave", (event) => {
		if (!root.contains(event.relatedTarget)) {
			hovering = false;
			dismissed = false;
			if (root.ownerDocument.activeElement !== trigger) hide();
		}
	});
	on(popup, "pointerenter", () => {
		hovering = true;
		stop();
	});
	on(trigger, "focus", () => {
		dismissed = false;
		show();
	});
	on(trigger, "blur", () => {
		if (!hovering) hide();
	});
	on(trigger, "click", () => {
		dismissed = true;
		hide();
	});
	on(trigger, "pointerdown", (event) => {
		if (event.pointerType === "touch") {
			dismissed = false;
			timer = setTimeout(show, 500);
		}
	});
	on(trigger, "pointerup", stop);
	on(trigger, "pointercancel", stop);
	on(root.ownerDocument, "keydown", (event) => {
		if (event.key === "Escape" && !popup.hidden) {
			event.preventDefault();
			event.stopImmediatePropagation();
			dismissed = true;
			hide();
		}
	}, { capture: true });
	on(root.ownerDocument, "scroll", () => {
		if (!popup.hidden) place(trigger, popup);
	}, { capture: true });
	on(root.ownerDocument.defaultView, "resize", () => {
		if (!popup.hidden) place(trigger, popup);
	});
	hide();
	return {
		show,
		hide,
		get open() {
			return !popup.hidden;
		},
		cleanup: hide
	};
}
function popover(root, { on }) {
	const trigger = root.querySelector("[data-popover-trigger]"), panel = root.querySelector("[data-popover-panel]");
	if (!trigger || !panel) return {};
	identify(root, panel, "popover");
	trigger.setAttribute("aria-controls", panel.id);
	const native = typeof panel.showPopover === "function";
	if (native) {
		panel.setAttribute("popover", "auto");
		panel.hidden = false;
	} else panel.hidden = true;
	let open = false;
	const sync = (value) => {
		open = value;
		trigger.setAttribute("aria-expanded", String(value));
		root.emit("toggle", { expanded: value });
	};
	const show = () => {
		if (open || !enabled(trigger)) return;
		native ? panel.showPopover() : panel.hidden = false;
		sync(true);
		place(trigger, panel);
	};
	const hide = (focus = false) => {
		if (!open) return;
		native ? panel.hidePopover() : panel.hidden = true;
		sync(false);
		if (focus) trigger.focus();
	};
	on(trigger, "click", () => open ? hide() : show());
	on(panel, "beforetoggle", (event) => {
		open = event.newState === "open";
		trigger.setAttribute("aria-expanded", String(open));
	});
	on(panel, "click", (event) => {
		if (event.target.closest("[data-close]")) hide(true);
	});
	on(root.ownerDocument, "pointerdown", (event) => {
		if (!native && !root.contains(event.target)) hide();
	});
	on(root, "keydown", (event) => {
		if (event.key === "Escape" && open) {
			event.preventDefault();
			event.stopPropagation();
			hide(true);
		}
	});
	on(root.ownerDocument.defaultView, "resize", () => {
		if (open) place(trigger, panel);
	});
	trigger.setAttribute("aria-expanded", "false");
	return {
		show,
		hide,
		get open() {
			return open;
		},
		set open(value) {
			value ? show() : hide();
		},
		cleanup() {
			hide();
		}
	};
}
function feedback(root, { on }) {
	const dismiss = (item) => {
		if (!item || !root.emit("dismiss", { id: item.id })) return;
		const hadFocus = item.contains(root.ownerDocument.activeElement);
		const focusable = all(root.ownerDocument, "button,a[href],input,select,textarea,[tabindex='0']").filter((node) => enabled(node) && !node.closest("[hidden]"));
		const currentIndex = focusable.indexOf(root.ownerDocument.activeElement);
		const next = focusable.slice(currentIndex + 1).find((node) => !item.contains(node)) ?? focusable.slice(0, currentIndex).reverse().find((node) => !item.contains(node));
		item.hidden = true;
		if (hadFocus) next?.focus();
	};
	on(root, "click", (event) => {
		const button = event.target.closest("button");
		if (!button || !enabled(button)) return;
		if (button.matches(".toast-close,.alert-close,.chip-remove,[data-dismiss]")) dismiss(button.closest(".toast,.alert,.chip") ?? root);
		else if (button.matches(".chip-filter")) {
			button.setAttribute("aria-pressed", String(button.getAttribute("aria-pressed") !== "true"));
			root.emit("action", {
				action: button.textContent.trim(),
				pressed: button.getAttribute("aria-pressed") === "true"
			});
		} else if (button.matches("[data-retry]")) root.emit("retry", {});
		else root.emit("action", { action: button.dataset.action ?? button.textContent.trim() });
	});
	on(root, "keydown", (event) => {
		if (event.key === "Escape") {
			const toast = event.target.closest(".toast");
			if (toast) {
				event.preventDefault();
				event.stopPropagation();
				dismiss(toast);
			}
		}
	});
	return { dismiss(id) {
		dismiss(id ? root.querySelector(`#${CSS.escape(id)}`) : root.querySelector(".toast,.alert") ?? root);
	} };
}
//#endregion
export { tooltip as i, modal as n, popover as r, feedback as t };
