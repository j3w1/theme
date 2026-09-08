//#region packages/ui/src/internal/dom.js
var all = (root, selector) => [...root.querySelectorAll(selector)];
var enabled = (node) => !node.matches(":disabled") && node.getAttribute("aria-disabled") !== "true";
var visible = (node) => !node.closest("[hidden]");
function announce(root, message) {
	let status = root.querySelector("[data-j3w1-status]");
	if (!status) {
		status = root.ownerDocument.createElement("p");
		status.dataset.j3w1Status = "";
		status.className = "j3w1-visually-hidden";
		status.setAttribute("role", "status");
		root.append(status);
	}
	status.textContent = message;
}
function identify(root, node, suffix) {
	if (node && !node.id) node.id = `${root.id}-${suffix}`;
	return node?.id;
}
function nativeInput(input, type = "input") {
	input.dispatchEvent(new Event(type, { bubbles: true }));
}
function rove(items, index, focus = true) {
	if (!items.length) return null;
	const next = items[(index + items.length) % items.length];
	items.forEach((item) => {
		item.tabIndex = item === next ? 0 : -1;
	});
	if (focus) next.focus();
	return next;
}
function make(root, tag, attrs = {}, text) {
	const node = root.ownerDocument.createElement(tag);
	for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
	if (text !== void 0) node.textContent = String(text);
	return node;
}
function place(trigger, popup) {
	const r = trigger.getBoundingClientRect(), p = popup.getBoundingClientRect();
	const doc = trigger.ownerDocument.documentElement;
	const left = Math.max(8, Math.min(r.left, doc.clientWidth - p.width - 8));
	const top = r.bottom + p.height + 8 > doc.clientHeight ? Math.max(8, r.top - p.height) : r.bottom;
	Object.assign(popup.style, {
		position: "fixed",
		insetInlineStart: "auto",
		insetInlineEnd: "auto",
		left: `${left}px`,
		top: `${top}px`,
		maxHeight: `${Math.max(120, doc.clientHeight - top - 8)}px`,
		overflowY: "auto"
	});
}
//#endregion
//#region packages/ui/src/internal/temporal.js
var instances = /* @__PURE__ */ new WeakMap();
var sequence$1 = 0;
function mountTemporal(input) {
	if (instances.has(input)) return instances.get(input);
	const abort = new AbortController(), restore = [], date = input.getAttribute("type") === "date", nativeTemporal = input.type === input.getAttribute("type");
	const numeric = (value) => {
		if (date) {
			if (!/^\d{4,}-\d{2}-\d{2}$/.test(value)) return NaN;
			const stamp = Date.parse(`${value}T00:00:00Z`);
			return Number.isFinite(stamp) && new Date(stamp).toISOString().slice(0, 10) === value ? stamp / 864e5 : NaN;
		}
		const match = /^(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(value);
		if (!match || Number(match[1]) > 23 || Number(match[2]) > 59 || Number(match[3] ?? 0) > 59) return NaN;
		return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3] ?? 0) + Number(`0.${match[4] ?? 0}`);
	};
	const stepSize = () => Number(input.step) > 0 ? Number(input.step) : date ? 1 : 60;
	const constraint = (value) => {
		const number = numeric(value), min = numeric(input.min), max = numeric(input.max);
		if (!Number.isFinite(number)) return value ? "Enter a valid value." : input.required ? "Choose a value." : "";
		if (!date && min > max) {
			if (number < min && number > max) return "Choose a time within the allowed range.";
		} else if (number < min || number > max) return "Choose a value within the allowed range.";
		const base = Number.isFinite(min) ? min : Number.isFinite(numeric(input.defaultValue)) ? numeric(input.defaultValue) : 0;
		if (input.step !== "any" && Math.abs((number - base) / stepSize() - Math.round((number - base) / stepSize())) > 1e-7) return "Choose a value matching the allowed step.";
		return "";
	};
	const on = (node, type, fn, options = {}) => node?.addEventListener(type, fn, {
		...options,
		signal: abort.signal
	});
	let id;
	do
		id = `j3w1-temporal-${++sequence$1}`;
	while (input.ownerDocument.getElementById(`${id}-input`));
	const shell = make(input, "span", { class: "j3w1-temporal" }), row = make(input, "span", { class: "j3w1-temporal-row" });
	const editor = make(input, "input", {
		id: `${id}-input`,
		type: "text",
		class: "j3w1-temporal-input",
		autocomplete: "off",
		placeholder: date ? "YYYY-MM-DD" : "HH:MM",
		inputmode: "text"
	});
	const message = make(input, "span", {
		id: `${id}-error`,
		class: "j3w1-choice-error",
		role: "status",
		hidden: ""
	});
	const popup = make(input, "span", {
		class: "j3w1-calendar",
		role: "dialog",
		"aria-modal": "false",
		"aria-label": "Choose date",
		popover: "manual",
		hidden: ""
	});
	const opener = make(input, "button", {
		type: "button",
		class: "j3w1-temporal-action",
		"aria-label": date ? "Open calendar" : "Increase time"
	}, date ? "▦" : "+");
	row.append(editor, opener);
	const decrease = date ? null : make(input, "button", {
		type: "button",
		class: "j3w1-temporal-action",
		"aria-label": "Decrease time"
	}, "−");
	if (decrease) row.append(decrease);
	shell.append(row, message);
	if (date) shell.append(popup);
	input.after(shell);
	const labels = [...input.labels ?? []];
	for (const label of labels) {
		const previous = label.getAttribute("for");
		label.htmlFor = editor.id;
		restore.push(() => previous === null ? label.removeAttribute("for") : label.setAttribute("for", previous));
	}
	const attributes = new Map([
		"hidden",
		"aria-hidden",
		"tabindex"
	].map((name) => [name, input.getAttribute(name)]));
	input.hidden = true;
	input.setAttribute("aria-hidden", "true");
	input.tabIndex = -1;
	let touched = false, writing = false, open = false, view = /* @__PURE__ */ new Date(), activeDay = null, fallbackError = "";
	const format = (value) => `${String(value.getFullYear()).padStart(4, "0")}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
	const parse = (value) => /* @__PURE__ */ new Date(`${value}T12:00:00`);
	const labelText = () => labels.map((label) => {
		const copy = label.cloneNode(true);
		copy.querySelectorAll("input,.j3w1-temporal,[aria-hidden=\"true\"],[hidden]").forEach((node) => node.remove());
		return copy.textContent.trim();
	}).join(" ");
	const close = (focus = false) => {
		if (popup.matches(":popover-open")) popup.hidePopover();
		popup.hidden = true;
		open = false;
		opener.setAttribute("aria-expanded", "false");
		if (focus) editor.focus();
	};
	const sync = () => {
		if (abort.signal.aborted) return;
		if (!writing) editor.value = input.value;
		editor.disabled = input.matches(":disabled");
		editor.readOnly = input.readOnly;
		editor.required = input.required;
		if (input.hasAttribute("form")) editor.setAttribute("form", input.getAttribute("form"));
		else editor.removeAttribute("form");
		opener.disabled = editor.disabled || editor.readOnly || !date && input.step === "any";
		if (decrease) decrease.disabled = opener.disabled;
		if (opener.disabled) close();
		const labelled = input.getAttribute("aria-labelledby");
		if (labelled) editor.setAttribute("aria-labelledby", labelled);
		else editor.setAttribute("aria-label", input.getAttribute("aria-label") || labelText() || (date ? "Date" : "Time"));
		if (!nativeTemporal) {
			if (input.validationMessage === fallbackError) input.setCustomValidity("");
			fallbackError = constraint(editor.value);
			if (!input.validationMessage) input.setCustomValidity(fallbackError);
		}
		const malformed = Boolean(editor.value && !Number.isFinite(numeric(editor.value)));
		editor.setCustomValidity(malformed ? `Enter a valid ${date ? "date in YYYY-MM-DD format" : "time in HH:MM or HH:MM:SS format"}.` : input.validationMessage);
		const invalid = touched && !editor.validity.valid || input.getAttribute("aria-invalid") === "true";
		editor.setAttribute("aria-invalid", String(invalid));
		message.hidden = !invalid;
		message.textContent = invalid ? editor.validationMessage || "Enter a valid value." : "";
		const described = [input.getAttribute("aria-describedby"), date ? "Use YYYY-MM-DD format." : "Use HH:MM or HH:MM:SS format."];
		if (!shell.querySelector(".j3w1-temporal-hint")) shell.append(make(input, "span", {
			class: "j3w1-temporal-hint",
			id: `${id}-hint`
		}, described[1]));
		editor.setAttribute("aria-describedby", [
			described[0],
			`${id}-hint`,
			invalid ? message.id : ""
		].filter(Boolean).join(" "));
	};
	const write = (value, change = false) => {
		writing = true;
		editor.value = value;
		input.value = Number.isFinite(numeric(value)) ? value : "";
		nativeInput(input);
		if (change) {
			touched = true;
			nativeInput(input, "change");
		}
		sync();
		writing = false;
	};
	const enabledDay = (value) => !constraint(value);
	const draw = () => {
		popup.replaceChildren();
		const heading = make(input, "span", { class: "j3w1-calendar-heading" }), previous = make(input, "button", {
			type: "button",
			"data-month": "-1",
			"aria-label": "Previous month"
		}, "←"), next = make(input, "button", {
			type: "button",
			"data-month": "1",
			"aria-label": "Next month"
		}, "→");
		const title = make(input, "strong", { id: `${id}-month` }, view.toLocaleDateString(void 0, {
			month: "long",
			year: "numeric"
		}));
		heading.append(previous, title, next);
		popup.append(heading);
		const grid = make(input, "span", {
			role: "grid",
			"aria-labelledby": title.id,
			class: "j3w1-calendar-grid"
		});
		const header = make(input, "span", {
			role: "row",
			class: "j3w1-calendar-week"
		});
		for (const day of [
			"Su",
			"Mo",
			"Tu",
			"We",
			"Th",
			"Fr",
			"Sa"
		]) header.append(make(input, "span", { role: "columnheader" }, day));
		grid.append(header);
		const first = new Date(view);
		first.setDate(1);
		const last = new Date(first);
		last.setMonth(last.getMonth() + 1);
		last.setDate(0);
		let week;
		for (let index = 0; index < first.getDay() + last.getDate(); index++) {
			if (index % 7 === 0) {
				week = make(input, "span", {
					role: "row",
					class: "j3w1-calendar-week"
				});
				grid.append(week);
			}
			const cell = make(input, "span", { role: "gridcell" });
			week.append(cell);
			const day = index - first.getDay() + 1;
			if (day < 1) continue;
			const current = new Date(first);
			current.setDate(day);
			const value = format(current), button = make(input, "button", {
				type: "button",
				"data-date": value,
				tabindex: value === activeDay ? "0" : "-1",
				"aria-label": current.toLocaleDateString(void 0, { dateStyle: "full" }),
				"aria-pressed": String(value === input.value)
			}, day);
			button.disabled = !enabledDay(value);
			cell.append(button);
		}
		popup.append(grid);
		if (!popup.querySelector("button[data-date][tabindex=\"0\"]:not(:disabled)")) {
			const first = popup.querySelector("button[data-date]:not(:disabled)");
			if (first) {
				first.tabIndex = 0;
				activeDay = first.dataset.date;
			}
		}
		if (open) place(opener, popup);
	};
	const show = () => {
		if (opener.disabled) return;
		const selected = parse(input.value);
		view = Number.isNaN(selected.valueOf()) ? /* @__PURE__ */ new Date() : selected;
		activeDay = format(view);
		open = true;
		popup.hidden = false;
		opener.setAttribute("aria-expanded", "true");
		draw();
		if (typeof popup.showPopover === "function") popup.showPopover();
		place(opener, popup);
		popup.querySelector("[data-date][tabindex=\"0\"]")?.focus();
	};
	if (date) {
		opener.setAttribute("aria-haspopup", "dialog");
		opener.setAttribute("aria-expanded", "false");
		on(opener, "click", () => open ? close(true) : show());
	} else {
		const step = (amount) => {
			if (nativeTemporal) {
				amount > 0 ? input.stepUp() : input.stepDown();
				write(input.value, true);
			} else {
				const min = numeric(input.min), current = numeric(input.value), base = Number.isFinite(min) ? min : Number.isFinite(numeric(input.defaultValue)) ? numeric(input.defaultValue) : 0, size = stepSize(), position = ((Number.isFinite(current) ? current : base) - base) / size;
				const value = base + (amount > 0 ? Math.floor(position) + 1 : Math.ceil(position) - 1) * size;
				if (value >= 0 && value < 86400) {
					const hours = String(Math.floor(value / 3600)).padStart(2, "0"), minutes = String(Math.floor(value % 3600 / 60)).padStart(2, "0"), seconds = String(Math.floor(value % 60)).padStart(2, "0"), fraction = Math.round(value % 1 * 1e3);
					const text = `${hours}:${minutes}${value % 60 ? `:${seconds}${fraction ? `.${String(fraction).padStart(3, "0")}` : ""}` : ""}`;
					if (!constraint(text)) write(text, true);
				}
			}
			editor.focus();
		};
		on(opener, "click", () => step(1));
		on(decrease, "click", () => step(-1));
	}
	on(editor, "input", (event) => {
		event.stopPropagation();
		write(editor.value);
	});
	on(editor, "change", (event) => {
		event.stopPropagation();
		write(editor.value, true);
	});
	for (const control of [editor, input]) on(control, "invalid", (event) => {
		event.preventDefault();
		touched = true;
		writing = true;
		sync();
		writing = false;
		editor.focus();
	});
	on(input, "input", () => {
		if (!writing) sync();
	});
	on(input, "change", () => {
		if (!writing) sync();
	});
	on(popup, "click", (event) => {
		const day = event.target.closest("[data-date]");
		if (day && !day.disabled) {
			write(day.dataset.date, true);
			close(true);
		}
		const month = event.target.closest("[data-month]");
		if (month) {
			view.setDate(1);
			view.setMonth(view.getMonth() + Number(month.dataset.month));
			draw();
			popup.querySelector(`[data-month="${month.dataset.month}"]`)?.focus();
		}
	});
	on(popup, "keydown", (event) => {
		if (event.key === "Escape") {
			event.preventDefault();
			event.stopPropagation();
			close(true);
			return;
		}
		const button = event.target.closest("[data-date]");
		if (!button) return;
		const delta = {
			ArrowLeft: -1,
			ArrowRight: 1,
			ArrowUp: -7,
			ArrowDown: 7
		}[event.key];
		if (delta !== void 0 || [
			"Home",
			"End",
			"PageUp",
			"PageDown"
		].includes(event.key)) {
			event.preventDefault();
			const next = parse(button.dataset.date);
			if (delta !== void 0) next.setDate(next.getDate() + delta);
			else if (event.key === "Home") next.setDate(next.getDate() - next.getDay());
			else if (event.key === "End") next.setDate(next.getDate() + 6 - next.getDay());
			else {
				const day = next.getDate();
				next.setDate(1);
				next.setMonth(next.getMonth() + (event.key === "PageDown" ? 1 : -1));
				const end = new Date(next);
				end.setMonth(end.getMonth() + 1);
				end.setDate(0);
				next.setDate(Math.min(day, end.getDate()));
			}
			if (enabledDay(format(next))) {
				view = next;
				activeDay = format(next);
				draw();
				popup.querySelector(`[data-date="${activeDay}"]`)?.focus();
			}
		}
	});
	on(editor, "keydown", (event) => {
		if (date && event.altKey && event.key === "ArrowDown") {
			event.preventDefault();
			show();
		}
	});
	on(input.ownerDocument, "pointerdown", (event) => {
		if (!shell.contains(event.target)) close();
	});
	on(shell, "focusout", () => queueMicrotask(() => {
		if (!shell.contains(input.ownerDocument.activeElement)) close();
	}));
	on(input.ownerDocument, "reset", (event) => {
		if (event.target === input.form) queueMicrotask(() => {
			if (!event.defaultPrevented) {
				touched = false;
				close();
				sync();
			}
		});
	}, { capture: true });
	on(input.ownerDocument.defaultView, "resize", () => {
		if (open) place(opener, popup);
	});
	const observer = new MutationObserver(sync);
	observer.observe(input, {
		attributes: true,
		attributeFilter: [
			"value",
			"min",
			"max",
			"step",
			"disabled",
			"readonly",
			"required",
			"form",
			"aria-invalid",
			"aria-describedby",
			"aria-label",
			"aria-labelledby"
		]
	});
	const fieldsets = new MutationObserver(sync);
	for (let node = input.parentElement; node; node = node.parentElement) if (node.tagName === "FIELDSET") fieldsets.observe(node, {
		attributes: true,
		attributeFilter: ["disabled"]
	});
	const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), "value");
	if (!Object.hasOwn(input, "value")) {
		Object.defineProperty(input, "value", {
			configurable: true,
			get() {
				return descriptor.get.call(this);
			},
			set(value) {
				descriptor.set.call(this, value);
				if (!writing) sync();
			}
		});
		restore.push(() => delete input.value);
	}
	if (!Object.hasOwn(input, "focus")) {
		Object.defineProperty(input, "focus", {
			configurable: true,
			value: (options) => editor.focus(options)
		});
		restore.push(() => delete input.focus);
	}
	sync();
	const api = {
		sync,
		destroy() {
			if (abort.signal.aborted) return;
			close();
			abort.abort();
			observer.disconnect();
			fieldsets.disconnect();
			restore.forEach((fn) => fn());
			shell.remove();
			for (const [name, value] of attributes) value === null ? input.removeAttribute(name) : input.setAttribute(name, value);
			instances.delete(input);
		}
	};
	instances.set(input, api);
	return api;
}
//#endregion
//#region packages/ui/src/internal/choice.js
var mounted = /* @__PURE__ */ new WeakMap();
var sequence = 0;
function mountChoice(select) {
	if (mounted.has(select)) return mounted.get(select);
	const abort = new AbortController(), restorers = [];
	const on = (node, type, fn, options = {}) => node?.addEventListener(type, fn, {
		...options,
		signal: abort.signal
	});
	const multiple = select.multiple;
	let id;
	do
		id = `j3w1-choice-${++sequence}`;
	while (select.ownerDocument.getElementById(`${id}-control`));
	const shell = make(select, "span", {
		class: "j3w1-choice",
		"data-choice-for": select.id
	});
	const list = make(select, "span", {
		class: "j3w1-choice-list",
		id: `${id}-list`,
		role: "listbox"
	});
	const control = multiple ? list : make(select, "button", {
		class: "j3w1-choice-trigger",
		type: "button",
		role: "combobox",
		"aria-haspopup": "listbox",
		"aria-controls": list.id,
		"aria-expanded": "false"
	});
	const value = make(select, "span", { class: "j3w1-choice-value" });
	const message = make(select, "span", {
		class: "j3w1-choice-error",
		id: `${id}-error`,
		role: "status",
		hidden: ""
	});
	if (multiple) {
		list.setAttribute("aria-multiselectable", "true");
		list.tabIndex = 0;
	} else {
		control.append(value, make(select, "span", {
			"aria-hidden": "true",
			class: "j3w1-choice-chevron"
		}, "⌄"));
		list.hidden = true;
		list.setAttribute("popover", "manual");
		shell.append(control);
	}
	shell.append(list, message);
	select.after(shell);
	const saved = new Map([
		"hidden",
		"aria-hidden",
		"tabindex"
	].map((name) => [name, select.getAttribute(name)]));
	select.hidden = true;
	select.setAttribute("aria-hidden", "true");
	select.tabIndex = -1;
	let items = [], active = -1, anchor = -1, open = false, updating = false, invalid = false, buffer = "", typedAt = 0;
	const disabled = (option) => option.disabled || option.parentElement?.matches("optgroup:disabled, optgroup[hidden]") || option.hidden;
	const usable = () => items.map((item, index) => disabled(item.option) ? -1 : index).filter((index) => index >= 0);
	const labels = [...select.labels ?? []];
	control.id = `${id}-control`;
	for (const label of labels) {
		const previous = label.getAttribute("for");
		label.htmlFor = control.id;
		restorers.push(() => previous === null ? label.removeAttribute("for") : label.setAttribute("for", previous));
	}
	const labelText = () => labels.map((label) => {
		const copy = label.cloneNode(true);
		copy.querySelectorAll("select,.j3w1-choice,[aria-hidden=\"true\"],[hidden]").forEach((node) => node.remove());
		return copy.textContent.trim();
	}).join(" ");
	const close = () => {
		if (multiple) return;
		if (list.matches(":popover-open")) list.hidePopover();
		list.hidden = true;
		open = false;
		control.setAttribute("aria-expanded", "false");
		control.removeAttribute("aria-activedescendant");
	};
	const focus = (options) => {
		if (!select.matches(":disabled")) control.focus(options);
	};
	const mark = (index) => {
		active = index;
		items.forEach((item, i) => item.node.toggleAttribute("data-active", i === active));
		if (items[active] && (multiple || open)) {
			control.setAttribute("aria-activedescendant", items[active].node.id);
			if (open || select.ownerDocument.activeElement === control) items[active].node.scrollIntoView({ block: "nearest" });
		} else control.removeAttribute("aria-activedescendant");
	};
	const sync = () => {
		if (updating || abort.signal.aborted) return;
		const off = select.matches(":disabled");
		control.setAttribute("aria-disabled", String(off));
		control.tabIndex = off ? -1 : 0;
		if (!multiple) control.disabled = off;
		if (off) close();
		const labelled = select.getAttribute("aria-labelledby");
		if (labelled) {
			control.setAttribute("aria-labelledby", labelled);
			control.removeAttribute("aria-label");
		} else {
			control.removeAttribute("aria-labelledby");
			control.setAttribute("aria-label", select.getAttribute("aria-label") || labelText() || select.name || "Choose an option");
		}
		if (!multiple) list.setAttribute("aria-label", control.getAttribute("aria-label") || labelText() || "Options");
		control.setAttribute("aria-required", String(select.required));
		const bad = invalid && !select.validity.valid || select.getAttribute("aria-invalid") === "true";
		control.setAttribute("aria-invalid", String(bad));
		message.hidden = !bad;
		message.textContent = bad ? select.validationMessage || "Choose a valid option." : "";
		const described = [select.getAttribute("aria-describedby"), bad ? message.id : ""].filter(Boolean).join(" ");
		if (described) control.setAttribute("aria-describedby", described);
		else control.removeAttribute("aria-describedby");
		items.forEach(({ option, node }) => {
			node.setAttribute("aria-selected", String(option.selected));
			node.setAttribute("aria-disabled", String(disabled(option)));
			node.hidden = option.hidden || Boolean(option.parentElement?.matches("optgroup[hidden]"));
		});
		value.textContent = [...select.selectedOptions].map((option) => option.label).join(", ") || "Choose an option";
		if (!items[active] || disabled(items[active].option)) mark(usable()[0] ?? -1);
	};
	const hook = (object, name, changed) => {
		if (Object.getOwnPropertyDescriptor(object, name)) return;
		let proto = Object.getPrototypeOf(object), descriptor;
		while (proto && !(descriptor = Object.getOwnPropertyDescriptor(proto, name))) proto = Object.getPrototypeOf(proto);
		if (!descriptor?.set || !descriptor.get) return;
		Object.defineProperty(object, name, {
			configurable: true,
			get() {
				return descriptor.get.call(this);
			},
			set(next) {
				descriptor.set.call(this, next);
				changed();
			}
		});
		restorers.push(() => delete object[name]);
	};
	const watched = /* @__PURE__ */ new WeakSet();
	const rebuild = () => {
		const current = items[active]?.option;
		list.replaceChildren();
		items = [];
		for (const child of select.children) {
			let parent = list;
			if (child.tagName === "OPTGROUP") {
				parent = make(select, "span", {
					role: "group",
					"aria-label": child.label,
					class: "j3w1-choice-group"
				});
				parent.append(make(select, "span", {
					class: "j3w1-choice-group-label",
					"aria-hidden": "true"
				}, child.label));
				list.append(parent);
			}
			for (const option of child.tagName === "OPTION" ? [child] : child.querySelectorAll("option")) {
				const node = make(select, "span", {
					class: "j3w1-choice-option",
					role: "option",
					id: `${id}-option-${items.length}`,
					"data-choice-value": option.value
				});
				node.append(make(select, "span", {
					class: "j3w1-choice-check",
					"aria-hidden": "true"
				}, "✓"), make(select, "span", {}, option.label));
				parent.append(node);
				items.push({
					option,
					node
				});
				if (!watched.has(option)) {
					hook(option, "selected", sync);
					watched.add(option);
				}
			}
		}
		active = items.findIndex((item) => item.option === current);
		sync();
	};
	const show = () => {
		if (multiple || select.matches(":disabled")) return;
		sync();
		list.hidden = false;
		open = true;
		control.setAttribute("aria-expanded", "true");
		list.style.width = `${control.getBoundingClientRect().width}px`;
		if (typeof list.showPopover === "function" && !list.matches(":popover-open")) list.showPopover();
		place(control, list);
		mark(items.findIndex((item) => item.option.selected && !disabled(item.option)) >= 0 ? items.findIndex((item) => item.option.selected && !disabled(item.option)) : usable()[0] ?? -1);
	};
	const commit = (index, range = false) => {
		const item = items[index];
		if (!item || disabled(item.option) || select.matches(":disabled")) return;
		updating = true;
		if (multiple) {
			if (range && anchor >= 0) items.forEach((entry, i) => {
				if (!disabled(entry.option)) entry.option.selected = i >= Math.min(anchor, index) && i <= Math.max(anchor, index);
			});
			else {
				item.option.selected = !item.option.selected;
				anchor = index;
			}
		} else select.selectedIndex = [...select.options].indexOf(item.option);
		updating = false;
		invalid = true;
		sync();
		if (!multiple) close();
		nativeInput(select);
		nativeInput(select, "change");
		if (control.isConnected) focus();
	};
	on(control, "keydown", (event) => {
		if (select.matches(":disabled")) return;
		const indices = usable();
		if (event.key === "Escape") {
			if (open) {
				event.preventDefault();
				event.stopPropagation();
				close();
			}
			return;
		}
		if (event.key === "Tab") {
			close();
			return;
		}
		if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a" && multiple) {
			event.preventDefault();
			updating = true;
			const all = indices.every((i) => items[i].option.selected);
			indices.forEach((i) => {
				items[i].option.selected = !all;
			});
			updating = false;
			sync();
			nativeInput(select);
			nativeInput(select, "change");
			return;
		}
		if (["Enter", " "].includes(event.key)) {
			event.preventDefault();
			if (!multiple && !open) show();
			else commit(active, event.shiftKey);
			return;
		}
		if (event.altKey && event.key === "ArrowUp") {
			event.preventDefault();
			close();
			return;
		}
		if ([
			"ArrowDown",
			"ArrowUp",
			"Home",
			"End"
		].includes(event.key)) {
			event.preventDefault();
			const wasOpen = open;
			if (!multiple && !open) show();
			if (!indices.length || event.altKey || !multiple && !wasOpen && !["Home", "End"].includes(event.key)) return;
			const position = indices.indexOf(active);
			const next = event.key === "Home" ? indices[0] : event.key === "End" ? indices.at(-1) : indices[Math.max(0, Math.min(indices.length - 1, position + (event.key === "ArrowDown" ? 1 : -1)))];
			mark(next);
			if (multiple && event.shiftKey) commit(next, true);
			return;
		}
		if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
			event.preventDefault();
			if (!multiple && !open) show();
			const now = Date.now();
			buffer = now - typedAt > 700 ? event.key : buffer + event.key;
			typedAt = now;
			const query = [...buffer].every((char) => char === buffer[0]) ? buffer[0] : buffer;
			const start = query.length === 1 ? indices.indexOf(active) + 1 : 0;
			const next = [...indices.slice(start), ...indices.slice(0, start)].find((i) => items[i].option.label.toLocaleLowerCase().startsWith(query.toLocaleLowerCase()));
			if (next !== void 0) mark(next);
		}
	});
	if (!multiple) on(control, "click", (event) => {
		event.preventDefault();
		focus();
		open ? close() : show();
	});
	on(list, "pointerdown", (event) => event.preventDefault());
	on(list, "click", (event) => {
		const index = items.findIndex((item) => item.node === event.target.closest("[role=\"option\"]"));
		if (index < 0) return;
		event.preventDefault();
		mark(index);
		commit(index, event.shiftKey);
	});
	on(select, "input", sync);
	on(select, "change", sync);
	on(select, "invalid", (event) => {
		event.preventDefault();
		invalid = true;
		sync();
		focus();
	});
	on(select.ownerDocument, "reset", (event) => {
		if (event.target === select.form) queueMicrotask(() => {
			if (!event.defaultPrevented) {
				invalid = false;
				close();
				sync();
			}
		});
	}, { capture: true });
	on(select.ownerDocument, "pointerdown", (event) => {
		if (!shell.contains(event.target)) close();
	});
	on(shell, "focusout", () => queueMicrotask(() => {
		if (!shell.contains(select.ownerDocument.activeElement)) close();
	}));
	on(select.ownerDocument.defaultView, "resize", () => {
		if (open) place(control, list);
	});
	on(select.ownerDocument, "scroll", (event) => {
		if (open && !list.contains(event.target)) place(control, list);
	}, { capture: true });
	for (const label of labels) on(label, "click", (event) => {
		if (!shell.contains(event.target)) {
			event.preventDefault();
			focus();
		}
	});
	const observer = new MutationObserver(rebuild);
	observer.observe(select, {
		subtree: true,
		childList: true,
		characterData: true,
		attributes: true,
		attributeFilter: [
			"disabled",
			"required",
			"label",
			"value",
			"selected",
			"hidden",
			"aria-label",
			"aria-labelledby",
			"aria-describedby",
			"aria-invalid"
		]
	});
	const fieldsets = new MutationObserver(sync);
	for (let parent = select.parentElement; parent; parent = parent.parentElement) if (parent.tagName === "FIELDSET") fieldsets.observe(parent, {
		attributes: true,
		attributeFilter: ["disabled"]
	});
	hook(select, "value", sync);
	hook(select, "selectedIndex", sync);
	if (!Object.getOwnPropertyDescriptor(select, "focus")) {
		Object.defineProperty(select, "focus", {
			configurable: true,
			value: focus
		});
		restorers.push(() => delete select.focus);
	}
	rebuild();
	const api = {
		sync,
		focus,
		show,
		hide: close,
		get open() {
			return open;
		},
		destroy() {
			if (abort.signal.aborted) return;
			close();
			abort.abort();
			observer.disconnect();
			fieldsets.disconnect();
			restorers.forEach((restore) => restore());
			shell.remove();
			for (const [name, value] of saved) value === null ? select.removeAttribute(name) : select.setAttribute(name, value);
			mounted.delete(select);
		}
	};
	mounted.set(select, api);
	return api;
}
function enhanceControls(root) {
	const choices = /* @__PURE__ */ new Map();
	root.setAttribute("data-j3w1-controls", "");
	const refresh = () => {
		for (const [select, api] of choices) if (!root.contains(select)) {
			api.destroy();
			choices.delete(select);
		}
		for (const select of root.querySelectorAll("select,input[type=\"date\"],input[type=\"time\"]")) {
			let owner = select.parentElement;
			while (owner && !owner.localName.startsWith("j3w1-")) owner = owner.parentElement;
			if (!select.closest("j3w1-select,j3w1-date-picker,j3w1-time-picker") && (!owner || owner === root) && !choices.has(select)) choices.set(select, select.tagName === "SELECT" ? mountChoice(select) : mountTemporal(select));
		}
	};
	const observer = new MutationObserver(refresh);
	observer.observe(root, {
		childList: true,
		subtree: true
	});
	refresh();
	return {
		refresh,
		destroy() {
			observer.disconnect();
			choices.forEach((api) => api.destroy());
			choices.clear();
			root.removeAttribute("data-j3w1-controls");
		}
	};
}
//#endregion
export { announce as a, make as c, rove as d, visible as f, all as i, nativeInput as l, mountChoice as n, enabled as o, mountTemporal as r, identify as s, enhanceControls as t, place as u };
