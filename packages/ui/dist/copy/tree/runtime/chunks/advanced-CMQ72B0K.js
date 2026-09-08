import { c as rove, i as identify, l as visible, o as nativeInput, r as enabled, t as all } from "./dom-BVXrzskP.js";
import { t as IDREFS } from "./markup-DeQ4bEMR.js";
//#region packages/ui/src/behaviors/advanced.js
function tree(root, { on }) {
	const treeRoot = root.querySelector("[role=\"tree\"]");
	if (!treeRoot) return {};
	const items = () => all(treeRoot, "[role=\"treeitem\"]");
	const shown = () => items().filter(visible);
	const group = (item) => [...item.children].find((node) => node.getAttribute("role") === "group");
	const parent = (item) => item.parentElement.closest("[role=\"treeitem\"]");
	items().forEach((item, index) => {
		identify(root, item, `node-${index}`);
		const children = group(item);
		if (children) {
			if (!item.hasAttribute("aria-expanded")) item.setAttribute("aria-expanded", "false");
			children.hidden = item.getAttribute("aria-expanded") !== "true";
		}
	});
	const select = (id) => {
		const item = items().find((node) => node.id === id);
		if (!item || !enabled(item)) throw new RangeError(`Unknown enabled tree item: ${id}`);
		items().forEach((node) => node.setAttribute("aria-selected", String(node === item)));
	};
	const expand = (id, expanded = true) => {
		const item = items().find((node) => node.id === id), children = item && group(item);
		if (!children) throw new RangeError(`Unknown tree parent: ${id}`);
		if (!expanded && children.contains(root.ownerDocument.activeElement)) rove(items(), items().indexOf(item));
		item.setAttribute("aria-expanded", String(Boolean(expanded)));
		children.hidden = !expanded;
		const toggle = item.querySelector(":scope > [data-tree-label] > [data-tree-toggle]");
		if (toggle) toggle.setAttribute("aria-label", expanded ? "Collapse" : "Expand");
		root.emit("toggle", {
			id,
			expanded: Boolean(expanded)
		});
	};
	const activate = (item) => {
		if (enabled(item)) {
			select(item.id);
			root.emit("select", { id: item.id });
		}
	};
	const initial = shown();
	rove(initial, Math.max(0, initial.findIndex((item) => item.tabIndex === 0)), false);
	on(treeRoot, "click", (event) => {
		const item = event.target.closest("[role=\"treeitem\"]");
		if (!item) return;
		rove(shown(), shown().indexOf(item));
		if (event.target.closest("[data-tree-toggle]") && group(item)) expand(item.id, item.getAttribute("aria-expanded") !== "true");
		else activate(item);
	});
	on(treeRoot, "dblclick", (event) => {
		const item = event.target.closest("[role=\"treeitem\"]");
		if (item && group(item) && !event.target.closest("[data-tree-toggle]")) expand(item.id, item.getAttribute("aria-expanded") !== "true");
	});
	on(treeRoot, "keydown", (event) => {
		const item = event.target.closest("[role=\"treeitem\"]");
		if (!item) return;
		const options = shown(), index = options.indexOf(item), rtl = getComputedStyle(treeRoot).direction === "rtl";
		if ([
			"ArrowDown",
			"ArrowUp",
			"Home",
			"End"
		].includes(event.key)) {
			event.preventDefault();
			const next = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : Math.max(0, Math.min(options.length - 1, index + (event.key === "ArrowDown" ? 1 : -1)));
			rove(options, next);
		} else if (event.key === (rtl ? "ArrowLeft" : "ArrowRight")) {
			event.preventDefault();
			if (group(item)) {
				if (item.getAttribute("aria-expanded") !== "true") expand(item.id);
				else rove(shown(), shown().indexOf(item) + 1);
			}
		} else if (event.key === (rtl ? "ArrowRight" : "ArrowLeft")) {
			event.preventDefault();
			if (group(item) && item.getAttribute("aria-expanded") === "true") expand(item.id, false);
			else if (parent(item)) rove(options, options.indexOf(parent(item)));
		} else if (["Enter", " "].includes(event.key)) {
			event.preventDefault();
			activate(item);
		} else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
			const found = [...options.slice(index + 1), ...options.slice(0, index + 1)].find((node) => (node.querySelector(":scope > [data-tree-label]")?.textContent ?? node.firstChild?.textContent ?? "").trim().toLocaleLowerCase().startsWith(event.key.toLocaleLowerCase()));
			if (found) {
				event.preventDefault();
				rove(options, options.indexOf(found));
			}
		}
	});
	return {
		expand,
		get selectedId() {
			return items().find((item) => item.getAttribute("aria-selected") === "true")?.id ?? "";
		},
		set selectedId(id) {
			select(id);
		}
	};
}
function multiselect(root, { on, signal }) {
	const query = root.querySelector("[data-filter]"), status = root.querySelector("[data-selection-status]"), boxes = all(root, "input[type=\"checkbox\"]");
	const values = () => boxes.filter((box) => box.checked).map((box) => box.value);
	const draw = () => {
		let matches = 0;
		for (const box of boxes) {
			const label = box.closest("label");
			if (!label) continue;
			label.hidden = !label.textContent.toLocaleLowerCase().includes((query?.value ?? "").toLocaleLowerCase());
			if (!label.hidden) matches++;
		}
		if (status) status.textContent = `${matches} matching options; ${values().length} selected`;
	};
	const report = () => {
		draw();
		root.emit("selection", { values: values() });
	};
	const setValues = (selected) => {
		if (!Array.isArray(selected) || selected.some((value) => !boxes.some((box) => box.value === value))) throw new TypeError("values must contain known checkbox values");
		boxes.forEach((box) => {
			box.checked = selected.includes(box.value);
		});
		draw();
	};
	const clear = () => {
		if (root.hasAttribute("disabled")) return;
		boxes.filter(enabled).forEach((box) => {
			if (box.checked) {
				box.checked = false;
				nativeInput(box);
				nativeInput(box, "change");
			}
		});
		report();
	};
	on(query, "input", draw);
	on(query, "keydown", (event) => {
		if (event.key === "Escape" && query.value) {
			event.preventDefault();
			event.stopPropagation();
			query.value = "";
			draw();
		}
	});
	on(root.querySelector("[data-clear-selection]"), "click", clear);
	boxes.forEach((box) => on(box, "change", report));
	on(boxes[0]?.form, "reset", () => queueMicrotask(() => {
		if (!signal.aborted) draw();
	}));
	draw();
	return {
		clear,
		get values() {
			return values();
		},
		set values(selected) {
			setValues(selected);
		}
	};
}
function repeater(root, { on }) {
	const rows = root.querySelector("[data-rows]"), template = root.querySelector("template[data-row-template]"), addButton = root.querySelector("[data-add]"), status = root.querySelector("[data-repeater-status]");
	if (!rows || !template) return {};
	let sequence = Number(root.dataset.rowSequence ?? 0);
	const maximum = () => {
		const value = Number(root.getAttribute("max") ?? 10);
		if (!Number.isInteger(value) || value < 1 || value > 100) throw new RangeError("max must be an integer from 1 to 100");
		return value;
	};
	const children = () => [...rows.children];
	const draw = (message) => {
		const items = children();
		if (addButton) addButton.disabled = root.hasAttribute("disabled") || items.length >= maximum();
		const empty = root.querySelector("[data-empty]");
		if (empty) empty.hidden = items.length !== 0;
		items.forEach((row, index) => {
			all(row, "[data-move]").forEach((button) => {
				button.disabled = root.hasAttribute("disabled") || (Number(button.dataset.move) < 0 ? index === 0 : index === items.length - 1);
			});
		});
		if (message && status) status.textContent = message;
	};
	const report = (message) => {
		draw(message);
		root.emit("rows", { ids: children().map((row) => row.id) });
	};
	const add = () => {
		if (children().length >= maximum() || root.hasAttribute("disabled")) return null;
		const row = template.content.firstElementChild.cloneNode(true);
		const id = `${root.id}-row-${++sequence}`;
		root.dataset.rowSequence = String(sequence);
		row.id = id;
		const ids = /* @__PURE__ */ new Map();
		all(row, "[id]").forEach((node) => {
			ids.set(node.id, `${id}-${node.id}`);
			node.id = ids.get(node.id);
		});
		for (const node of all(row, "*")) for (const attr of [...node.attributes]) {
			if (IDREFS.has(attr.name)) node.setAttribute(attr.name, attr.value.split(/\s+/).map((value) => ids.get(value) ?? value).join(" "));
			if (attr.name === "name") node.name = `${id}[${attr.value}]`;
		}
		rows.append(row);
		report("Row added.");
		row.querySelector("input,select,textarea,button")?.focus();
		return id;
	};
	const remove = (id) => {
		const items = children(), index = items.findIndex((row) => row.id === id);
		if (index < 0) throw new RangeError(`Unknown row: ${id}`);
		if (root.hasAttribute("disabled")) return;
		const hadFocus = items[index].contains(root.ownerDocument.activeElement);
		items[index].remove();
		report("Row removed.");
		if (hadFocus) (children()[Math.min(index, children().length - 1)]?.querySelector("input,select,textarea,button") ?? addButton)?.focus();
	};
	const move = (id, direction) => {
		if (![-1, 1].includes(direction)) throw new RangeError("direction must be -1 or 1");
		const items = children(), index = items.findIndex((row) => row.id === id), target = index + direction;
		if (index < 0) throw new RangeError(`Unknown row: ${id}`);
		if (target < 0 || target >= items.length || root.hasAttribute("disabled")) return;
		const focused = root.ownerDocument.activeElement;
		if (direction < 0) rows.insertBefore(items[index], items[target]);
		else rows.insertBefore(items[target], items[index]);
		report(direction < 0 ? "Row moved up." : "Row moved down.");
		if (items[index].contains(focused) && !focused.disabled) focused.focus();
		else items[index].querySelector("input,select,textarea,button:not(:disabled)")?.focus();
	};
	on(addButton, "click", add);
	on(rows, "click", (event) => {
		const button = event.target.closest("button");
		if (!button || !enabled(button)) return;
		const row = children().find((item) => item.contains(button));
		if (button.hasAttribute("data-remove")) remove(row.id);
		else if (button.hasAttribute("data-move")) move(row.id, Number(button.dataset.move));
	});
	draw();
	return {
		add,
		remove,
		move,
		get rowIds() {
			return children().map((row) => row.id);
		},
		attributeChanged() {
			draw();
		}
	};
}
function commandPalette(root, { on }) {
	const dialog = root.querySelector("dialog"), input = root.querySelector("input[role=\"combobox\"]"), list = root.querySelector("[role=\"listbox\"]"), status = root.querySelector("[data-command-status]");
	if (!dialog || !input || !list) return {};
	let opener, active = null;
	all(list, "[role=\"option\"]").forEach((option, index) => {
		identify(root, option, `command-${index}`);
		option.tabIndex = -1;
	});
	const options = () => all(list, "[role=\"option\"]").filter((option) => enabled(option) && !option.hidden);
	const select = (option) => {
		active = option;
		all(list, "[role=\"option\"]").forEach((node) => node.setAttribute("aria-selected", String(node === option)));
		if (option) {
			input.setAttribute("aria-activedescendant", option.id);
			option.scrollIntoView({ block: "nearest" });
		} else input.removeAttribute("aria-activedescendant");
	};
	const filter = () => {
		all(list, "[role=\"option\"]").forEach((option) => {
			option.hidden = !option.textContent.toLocaleLowerCase().includes(input.value.toLocaleLowerCase());
		});
		select(options()[0] ?? null);
		if (status) status.textContent = `${options().length} commands`;
	};
	const show = (trigger = root.ownerDocument.activeElement) => {
		if (dialog.open || root.hasAttribute("disabled")) return;
		opener = trigger;
		dialog.showModal();
		filter();
		input.focus();
	};
	const close = () => {
		if (dialog.open) dialog.close();
	};
	const invoke = (option) => {
		if (!option || !enabled(option)) return;
		const link = option.matches("a[href]") ? option : option.querySelector("a[href]");
		const proceed = root.emit("command", {
			action: option.dataset.action ?? option.id,
			href: link?.getAttribute("href") ?? null
		});
		close();
		if (proceed && link) root.ownerDocument.defaultView.location.assign(link.href);
	};
	on(root, "click", (event) => {
		const trigger = event.target.closest("[data-open]");
		if (trigger) show(trigger);
		else if (event.target.closest("[data-close]")) close();
		else {
			const option = event.target.closest("[role=\"option\"]");
			if (option) {
				event.preventDefault();
				invoke(option);
			}
		}
	});
	on(input, "input", filter);
	on(input, "keydown", (event) => {
		if (["ArrowDown", "ArrowUp"].includes(event.key)) {
			event.preventDefault();
			const items = options(), index = items.indexOf(active);
			if (items.length) select(items[(index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]);
		} else if (event.key === "Enter") {
			event.preventDefault();
			invoke(active);
		}
	});
	on(dialog, "close", () => {
		if (opener?.isConnected) opener.focus();
	});
	on(root.ownerDocument, "keydown", (event) => {
		if (root.hasAttribute("shortcut") && (event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "k" && !event.defaultPrevented) {
			event.preventDefault();
			dialog.open ? close() : show();
		}
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
		cleanup: close
	};
}
//#endregion
export { tree as i, multiselect as n, repeater as r, commandPalette as t };
