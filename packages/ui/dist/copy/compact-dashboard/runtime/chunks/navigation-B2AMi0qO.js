import { a as announce, d as rove, f as visible, i as all, l as nativeInput, o as enabled, s as identify, u as place } from "./choice-40bzCHdX.js";
//#region packages/ui/src/behaviors/navigation.js
function tabs(root, { on }, listOverride) {
	const list = listOverride ?? root.querySelector("[role=\"tablist\"]");
	if (!list) return {};
	const items = () => all(list, "[role=\"tab\"]").filter(enabled);
	const select = (id, focus = false) => {
		const tab = items().find((item) => item.id === id);
		if (!tab) throw new RangeError(`Unknown enabled tab: ${id}`);
		all(list, "[role=\"tab\"]").forEach((item) => {
			item.setAttribute("aria-selected", String(item === tab));
			item.tabIndex = item === tab ? 0 : -1;
		});
		all(root, "[role=\"tabpanel\"]").filter((panel) => all(list, "[role=\"tab\"]").some((tab) => tab.getAttribute("aria-controls") === panel.id)).forEach((panel) => {
			panel.hidden = panel.id !== tab.getAttribute("aria-controls");
			if (!panel.hidden && !panel.querySelector("a[href],button,input,select,textarea,[tabindex='0']")) panel.tabIndex = 0;
		});
		if (focus) tab.focus();
		return tab;
	};
	const activate = (tab) => {
		select(tab.id);
		root.emit("select", {
			id: tab.id,
			panelId: tab.getAttribute("aria-controls")
		});
	};
	on(list, "click", (event) => {
		const tab = event.target.closest("[role=\"tab\"]");
		if (tab && enabled(tab)) activate(tab);
	});
	on(list, "keydown", (event) => {
		const current = event.target.closest("[role=\"tab\"]"), options = items();
		if (!current) return;
		const vertical = list.getAttribute("aria-orientation") === "vertical", rtl = getComputedStyle(list).direction === "rtl";
		const next = vertical ? "ArrowDown" : rtl ? "ArrowLeft" : "ArrowRight", previous = vertical ? "ArrowUp" : rtl ? "ArrowRight" : "ArrowLeft";
		let index = options.indexOf(current);
		if (event.key === next) index++;
		else if (event.key === previous) index--;
		else if (event.key === "Home") index = 0;
		else if (event.key === "End") index = options.length - 1;
		else if (["Enter", " "].includes(event.key)) {
			event.preventDefault();
			activate(current);
			return;
		} else return;
		event.preventDefault();
		const tab = rove(options, index);
		if (root.getAttribute("activation") !== "manual") activate(tab);
	});
	const initial = items().find((item) => item.getAttribute("aria-selected") === "true") ?? items()[0];
	if (initial) select(initial.id);
	return {
		select,
		get selectedId() {
			return list.querySelector("[aria-selected=\"true\"]")?.id ?? "";
		},
		set selectedId(id) {
			select(id);
		}
	};
}
function toolbar(root, { on }) {
	const bar = root.querySelector("[role=\"toolbar\"]");
	if (!bar) return {};
	const controls = () => all(bar, "button,a[href],input,select").filter((node) => enabled(node) && visible(node) && !node.closest("[role=\"menu\"]"));
	const initial = controls();
	rove(initial, Math.max(0, initial.findIndex((node) => node.tabIndex === 0)), false);
	on(bar, "focusin", (event) => {
		if (controls().includes(event.target)) rove(controls(), controls().indexOf(event.target), false);
	});
	on(bar, "keydown", (event) => {
		if (event.target.matches("input,select,textarea") || event.target.closest("[role=\"menu\"]")) return;
		const items = controls(), index = items.indexOf(event.target);
		const vertical = bar.getAttribute("aria-orientation") === "vertical", rtl = getComputedStyle(bar).direction === "rtl";
		const next = vertical ? "ArrowDown" : rtl ? "ArrowLeft" : "ArrowRight", prev = vertical ? "ArrowUp" : rtl ? "ArrowRight" : "ArrowLeft";
		if (![
			next,
			prev,
			"Home",
			"End"
		].includes(event.key)) return;
		event.preventDefault();
		rove(items, event.key === next ? index + 1 : event.key === prev ? index - 1 : event.key === "Home" ? 0 : items.length - 1);
	});
	on(bar, "click", (event) => {
		const button = event.target.closest("button[aria-pressed]");
		if (button && enabled(button)) {
			button.setAttribute("aria-pressed", String(button.getAttribute("aria-pressed") !== "true"));
			root.emit("action", {
				action: button.dataset.action ?? button.textContent.trim(),
				pressed: button.getAttribute("aria-pressed") === "true"
			});
		}
	});
	return {};
}
function disclosure(root, { on }) {
	on(root, "click", (event) => {
		const button = event.target.closest("button[aria-controls][aria-expanded]");
		if (!button || !enabled(button)) return;
		const target = root.querySelector(`#${CSS.escape(button.getAttribute("aria-controls"))}`);
		if (!target) return;
		const expanded = button.getAttribute("aria-expanded") !== "true";
		button.setAttribute("aria-expanded", String(expanded));
		target.hidden = !expanded;
		root.emit("toggle", {
			id: target.id,
			expanded
		});
	});
	const details = root.querySelector("details");
	on(details, "toggle", () => root.emit("toggle", {
		id: details.id,
		expanded: details.open
	}));
	return {
		get open() {
			return details?.open ?? false;
		},
		set open(value) {
			if (details) details.open = Boolean(value);
		}
	};
}
function combobox(root, { on, signal }) {
	const input = root.querySelector("input[role=\"combobox\"]"), list = root.querySelector("[role=\"listbox\"]");
	if (!input || !list) return {};
	identify(root, list, "options");
	input.setAttribute("aria-controls", list.id);
	let active = null, notifying = false;
	const notify = () => {
		notifying = true;
		try {
			nativeInput(input);
			nativeInput(input, "change");
		} finally {
			notifying = false;
		}
	};
	const options = () => all(list, "[role=\"option\"]").filter((node) => enabled(node) && !node.hidden && !node.closest("[role=\"group\"][hidden]"));
	all(list, "[role=\"option\"]").forEach((option, index) => identify(root, option, `option-${index}`));
	const setActive = (option) => {
		active = option;
		all(list, "[role=\"option\"]").forEach((node) => node.setAttribute("aria-selected", String(node === option)));
		if (option) {
			input.setAttribute("aria-activedescendant", option.id);
			option.scrollIntoView({ block: "nearest" });
		} else input.removeAttribute("aria-activedescendant");
	};
	const hide = () => {
		list.hidden = true;
		input.setAttribute("aria-expanded", "false");
		setActive(null);
	};
	const filter = (query = input.value) => {
		for (const option of all(list, "[role=\"option\"]")) if (enabled(option)) option.hidden = !option.textContent.toLocaleLowerCase().includes(query.toLocaleLowerCase());
		all(list, "[role=\"group\"]").forEach((group) => {
			group.hidden = !all(group, "[role=\"option\"]").some((node) => enabled(node) && !node.hidden);
		});
		const empty = root.querySelector(".combobox-empty");
		if (empty) {
			empty.hidden = options().length !== 0;
			empty.classList.toggle("combobox-empty-shown", !empty.hidden);
		}
		if (!options().includes(active)) setActive(null);
	};
	const show = (allOptions = false) => {
		if (!enabled(input) || input.readOnly) return;
		filter(allOptions ? "" : input.value);
		list.hidden = false;
		input.setAttribute("aria-expanded", "true");
		place(input, list);
	};
	const choose = (option) => {
		if (!option || !enabled(option)) return;
		input.value = option.dataset.value ?? option.textContent.trim();
		hide();
		notify();
		input.focus();
	};
	on(input, "input", () => {
		if (!notifying) {
			show();
			announce(root, `${options().length} options available.`);
		}
	});
	on(input, "keydown", (event) => {
		if (event.key === "Tab") {
			hide();
			return;
		}
		if (event.key === "Escape") {
			if (!list.hidden) {
				hide();
				event.stopPropagation();
			} else if (input.value) {
				input.value = "";
				notify();
				event.stopPropagation();
			}
			event.preventDefault();
			return;
		}
		if (event.altKey && event.key === "ArrowUp") {
			event.preventDefault();
			hide();
			return;
		}
		if (["ArrowDown", "ArrowUp"].includes(event.key)) {
			event.preventDefault();
			if (list.hidden) show(true);
			if (event.altKey) return;
			const items = options(), index = active ? items.indexOf(active) : event.key === "ArrowDown" ? -1 : 0;
			if (items.length) setActive(items[(index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]);
		} else if (event.key === "Enter" && !list.hidden && active) {
			event.preventDefault();
			choose(active);
		}
	});
	on(list, "pointerdown", (event) => {
		if (event.target.closest("[role=\"option\"]")) event.preventDefault();
	});
	on(list, "click", (event) => choose(event.target.closest("[role=\"option\"]")));
	on(root.querySelector(".combobox-toggle"), "click", () => {
		list.hidden ? show(true) : hide();
		input.focus();
	});
	on(root.ownerDocument, "pointerdown", (event) => {
		if (!root.contains(event.target)) hide();
	});
	on(root, "focusout", () => queueMicrotask(() => {
		if (!signal.aborted && !root.contains(root.ownerDocument.activeElement)) hide();
	}));
	on(root.ownerDocument.defaultView, "resize", () => {
		if (!list.hidden) place(input, list);
	});
	on(root.ownerDocument, "scroll", (event) => {
		if (!list.hidden && !list.contains(event.target)) place(input, list);
	}, { capture: true });
	hide();
	return {
		show,
		hide,
		get open() {
			return !list.hidden;
		},
		set open(value) {
			value ? show() : hide();
		},
		get value() {
			return input.value;
		},
		set value(value) {
			input.value = String(value ?? "");
			if (!list.hidden) filter();
		},
		cleanup: hide
	};
}
function menu(root, { on }) {
	const trigger = root.querySelector("button[aria-haspopup=\"menu\"]"), main = root.querySelector("[role=\"menu\"]");
	if (!trigger || !main) return {};
	identify(root, main, "menu");
	trigger.setAttribute("aria-controls", main.id);
	const lists = all(root, "[role=\"menu\"]");
	const items = (list) => all(list, "[role^=\"menuitem\"]").filter((item) => item.closest("[role=\"menu\"]") === list);
	const controller = (list) => all(root, "[aria-controls]").find((node) => node.getAttribute("aria-controls") === list.id);
	const closeList = (list) => {
		list.hidden = true;
		controller(list)?.setAttribute("aria-expanded", "false");
	};
	const hide = (focus = true) => {
		lists.forEach(closeList);
		if (focus) trigger.focus();
	};
	const showList = (list, button, last = false) => {
		list.hidden = false;
		button.setAttribute("aria-expanded", "true");
		place(button, list);
		rove(items(list), last ? items(list).length - 1 : 0);
	};
	const show = () => {
		if (enabled(trigger)) showList(main, trigger);
	};
	const submenu = (button) => button.hasAttribute("aria-haspopup") ? lists.find((list) => list.id === button.getAttribute("aria-controls")) : null;
	const activate = (item) => {
		if (!enabled(item)) return;
		const child = submenu(item);
		if (child) {
			showList(child, item);
			return;
		}
		if (item.getAttribute("role") === "menuitemcheckbox") item.setAttribute("aria-checked", String(item.getAttribute("aria-checked") !== "true"));
		else if (item.getAttribute("role") === "menuitemradio") items(item.closest("[role=\"menu\"]")).filter((node) => node.getAttribute("role") === "menuitemradio").forEach((node) => node.setAttribute("aria-checked", String(node === item)));
		else hide();
		root.emit("action", {
			action: item.dataset.action ?? item.textContent.trim(),
			checked: item.getAttribute("aria-checked") === "true"
		});
	};
	on(trigger, "click", () => main.hidden ? show() : hide());
	on(trigger, "keydown", (event) => {
		if (["ArrowDown", "ArrowUp"].includes(event.key) && enabled(trigger)) {
			event.preventDefault();
			showList(main, trigger, event.key === "ArrowUp");
		}
	});
	on(root, "click", (event) => {
		const item = event.target.closest("[role^=\"menuitem\"]");
		if (item) activate(item);
	});
	on(root, "keydown", (event) => {
		const item = event.target.closest("[role^=\"menuitem\"]");
		if (!item) return;
		const list = item.closest("[role=\"menu\"]"), options = items(list), index = options.indexOf(item), rtl = getComputedStyle(list).direction === "rtl";
		if ([
			"ArrowDown",
			"ArrowUp",
			"Home",
			"End"
		].includes(event.key)) {
			event.preventDefault();
			rove(options, event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : index + (event.key === "ArrowDown" ? 1 : -1));
		} else if (event.key === "Escape" || event.key === (rtl ? "ArrowRight" : "ArrowLeft") && list !== main) {
			event.preventDefault();
			event.stopPropagation();
			if (list !== main) {
				closeList(list);
				controller(list)?.focus();
			} else hide();
		} else if (event.key === (rtl ? "ArrowLeft" : "ArrowRight") && submenu(item)) {
			event.preventDefault();
			showList(submenu(item), item);
		} else if (event.key === "Tab") hide();
		else if (event.key.length === 1 && /\S/.test(event.key)) {
			const found = [...options.slice(index + 1), ...options.slice(0, index + 1)].find((node) => (node.querySelector(".menu-label") ?? node).textContent.trim().toLocaleLowerCase().startsWith(event.key.toLocaleLowerCase()));
			if (found) {
				event.preventDefault();
				rove(options, options.indexOf(found));
			}
		}
	});
	on(root.ownerDocument, "pointerdown", (event) => {
		if (!root.contains(event.target)) hide(false);
	});
	on(root.ownerDocument, "focusin", (event) => {
		if (!root.contains(event.target)) hide(false);
	});
	on(root.ownerDocument.defaultView, "resize", () => lists.filter((list) => !list.hidden).forEach((list) => place(controller(list), list)));
	hide(false);
	return {
		show,
		hide,
		get open() {
			return !main.hidden;
		},
		set open(value) {
			value ? show() : hide(false);
		},
		cleanup() {
			hide(false);
		}
	};
}
//#endregion
export { toolbar as a, tabs as i, disclosure as n, menu as r, combobox as t };
