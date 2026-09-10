import { c as make, i as all, l as nativeInput, n as mountChoice, o as enabled, r as mountTemporal } from "./choice-Db_w_BOQ.js";
//#region packages/ui/src/behaviors/native.js
function content() {
	return {};
}
function actions(root, { on }) {
	on(root, "click", (event) => {
		const button = event.target.closest("button");
		if (!button || !enabled(button) || button.closest("[data-j3w1-component]") !== root) return;
		if (button.hasAttribute("aria-pressed")) button.setAttribute("aria-pressed", String(button.getAttribute("aria-pressed") !== "true"));
		if (!root.emit("action", {
			action: button.dataset.action ?? button.value ?? "",
			pressed: button.getAttribute("aria-pressed") === "true"
		})) event.preventDefault();
	});
	return {};
}
function fields(root, { on, signal }) {
	const input = root.querySelector("input,textarea,select");
	if (!input) return {};
	if (input.tagName === "SELECT") {
		const choice = mountChoice(input);
		return {
			get values() {
				return [...input.selectedOptions].map((option) => option.value);
			},
			set values(values) {
				if (!Array.isArray(values)) throw new TypeError("values must be an array");
				const selected = new Set(values.map(String));
				[...input.options].forEach((option) => {
					option.selected = selected.has(option.value);
				});
				choice.sync();
			},
			clear() {
				if (input.matches(":disabled")) return;
				input.value = "";
				choice.sync();
				nativeInput(input);
				nativeInput(input, "change");
			},
			attributeChanged: choice.sync,
			valueChanged: choice.sync,
			cleanup: choice.destroy
		};
	}
	const count = root.querySelector(".textarea-count,output");
	const temporal = all(root, "input[type=\"date\"],input[type=\"time\"]").map(mountTemporal);
	const clearButtons = all(root, "[data-clear],.search-field-clear,button[aria-label^=\"Clear\"]");
	const sync = () => {
		if (count) count.textContent = input.type === "range" ? input.value : `${input.value.length}${input.maxLength > 0 ? ` / ${input.maxLength}` : ""}`;
		clearButtons.forEach((button) => {
			button.hidden = !input.value;
			button.disabled = input.disabled || input.readOnly;
		});
		temporal.forEach((control) => control.sync());
	};
	const change = () => {
		sync();
		nativeInput(input);
		nativeInput(input, "change");
	};
	const clear = () => {
		if (!enabled(input) || input.readOnly) return;
		input.value = "";
		change();
		input.focus();
	};
	clearButtons.forEach((button) => on(button, "click", clear));
	const reveal = root.querySelector("[data-reveal],button[aria-label*=\"password\"]");
	if (reveal) on(reveal, "click", () => {
		if (!enabled(input)) return;
		const showing = input.type === "password";
		input.type = showing ? "text" : "password";
		reveal.setAttribute("aria-pressed", String(showing));
		reveal.setAttribute("aria-label", showing ? "Hide password" : "Show password");
	});
	const step = (direction) => {
		if (!enabled(input) || input.readOnly || input.type !== "number") return;
		direction > 0 ? input.stepUp(direction) : input.stepDown(-direction);
		change();
	};
	all(root, "[data-step],button[aria-label^=\"Increase\"],button[aria-label^=\"Decrease\"]").forEach((button) => on(button, "click", () => step(Number(button.dataset.step ?? (button.getAttribute("aria-label").startsWith("Decrease") ? -1 : 1)))));
	on(input, "keydown", (event) => {
		if (event.key === "Escape" && input.type === "search" && input.value) {
			event.preventDefault();
			event.stopPropagation();
			clear();
		}
		if (input.type === "number" && event.shiftKey && ["ArrowUp", "ArrowDown"].includes(event.key)) {
			event.preventDefault();
			step(event.key === "ArrowUp" ? 10 : -10);
		}
	});
	const dates = all(root, "input[type=\"date\"]");
	const validateRange = () => {
		if (dates.length === 2) dates[1].setCustomValidity(dates[0].value && dates[1].value && dates[1].value < dates[0].value ? "End date must be on or after the start date." : "");
	};
	on(root, "input", () => {
		sync();
		validateRange();
	});
	on(root.ownerDocument, "reset", (event) => {
		if (event.target === input.form) queueMicrotask(() => {
			if (!signal.aborted && !event.defaultPrevented) {
				sync();
				validateRange();
			}
		});
	}, { capture: true });
	sync();
	validateRange();
	return {
		clear,
		stepBy: step,
		get indeterminate() {
			return Boolean(input.indeterminate);
		},
		set indeterminate(value) {
			if (input.type === "checkbox") input.indeterminate = Boolean(value);
		},
		get values() {
			return input.multiple ? [...input.selectedOptions].map((option) => option.value) : all(root, "input[type=\"checkbox\"]:checked").map((box) => box.value);
		},
		set values(values) {
			if (!Array.isArray(values)) throw new TypeError("values must be an array");
			const chosen = new Set(values.map(String));
			if (input.multiple) [...input.options].forEach((option) => {
				option.selected = chosen.has(option.value);
			});
			else all(root, "input[type=\"checkbox\"]").forEach((box) => {
				box.checked = chosen.has(box.value);
			});
		},
		attributeChanged() {
			sync();
			validateRange();
		},
		valueChanged() {
			sync();
			validateRange();
		},
		cleanup() {
			temporal.forEach((control) => control.destroy());
		}
	};
}
function switchControl(root, { on, signal }) {
	const button = root.querySelector("[role=\"switch\"]");
	if (!button) return {};
	const initial = root.hasAttribute("checked") || button.getAttribute("aria-checked") === "true";
	let defaultChecked = button.dataset.defaultChecked === void 0 ? initial : button.dataset.defaultChecked === "true";
	button.dataset.defaultChecked = String(defaultChecked);
	let checked = initial;
	let successful = root.querySelector("input[data-switch-value]");
	if (!successful) {
		successful = make(root, "input", {
			type: "hidden",
			"data-switch-value": ""
		});
		root.append(successful);
	}
	const sync = () => {
		button.setAttribute("aria-checked", String(checked));
		successful.name = root.getAttribute("name") ?? "";
		successful.value = root.getAttribute("value") ?? "on";
		successful.disabled = !checked || !enabled(button);
	};
	on(button, "click", () => {
		if (enabled(button)) {
			checked = !checked;
			sync();
			root.emit("change", {
				checked,
				value: successful.value,
				name: successful.name
			});
		}
	});
	on(button.form, "reset", () => queueMicrotask(() => {
		if (!signal.aborted) {
			checked = defaultChecked;
			sync();
		}
	}));
	sync();
	return {
		get checked() {
			return checked;
		},
		set checked(value) {
			checked = Boolean(value);
			sync();
		},
		attributeChanged(name) {
			if (name === "checked") {
				defaultChecked = checked = root.hasAttribute("checked");
				button.dataset.defaultChecked = String(defaultChecked);
			}
			sync();
		}
	};
}
function fileInput(root, { on, signal }) {
	const input = root.querySelector("input[type=\"file\"]");
	if (!input) return {};
	let list = root.querySelector(".file-input-list");
	if (!list) {
		list = make(root, "ul", {
			class: "file-input-list",
			"aria-label": "Chosen files"
		});
		root.append(list);
	}
	const status = root.querySelector(".file-input-status");
	const draw = () => {
		list.replaceChildren();
		const files = [...input.files];
		if (status) status.textContent = files.length ? `${files.length} file${files.length === 1 ? "" : "s"} chosen` : "No file chosen";
		for (const [index, file] of files.entries()) {
			const item = make(root, "li", { class: "file-input-item" });
			item.append(make(root, "span", { class: "file-input-name" }, file.name), make(root, "span", { class: "file-input-size" }, `${file.size} bytes`));
			const remove = make(root, "button", {
				type: "button",
				class: "file-input-remove",
				"aria-label": `Remove ${file.name}`,
				"data-remove-index": index
			}, "✕");
			remove.disabled = input.disabled;
			item.append(remove);
			list.append(item);
		}
	};
	const assign = (files) => {
		if (!enabled(input)) return;
		const transfer = new DataTransfer();
		for (const file of input.multiple ? files : files.slice(0, 1)) transfer.items.add(file);
		input.files = transfer.files;
		draw();
		nativeInput(input);
		nativeInput(input, "change");
	};
	on(list, "click", (event) => {
		const button = event.target.closest("[data-remove-index]");
		if (!button || !enabled(button)) return;
		const index = Number(button.dataset.removeIndex);
		assign([...input.files].filter((_, i) => i !== index));
		(list.querySelectorAll("button")[Math.min(index, input.files.length - 1)] ?? input).focus();
	});
	on(list, "keydown", (event) => {
		if (["Delete", "Backspace"].includes(event.key) && event.target.matches("button")) {
			event.preventDefault();
			event.target.click();
		}
	});
	const zone = root.querySelector(".file-input-zone");
	if (zone) {
		on(zone, "dragover", (event) => {
			if (enabled(input)) {
				event.preventDefault();
				zone.dataset.dragging = "true";
			}
		});
		on(zone, "dragleave", () => {
			delete zone.dataset.dragging;
		});
		on(zone, "drop", (event) => {
			event.preventDefault();
			delete zone.dataset.dragging;
			assign([...event.dataTransfer.files]);
		});
	}
	on(input, "change", draw);
	on(input.form, "reset", () => queueMicrotask(() => {
		if (!signal.aborted) draw();
	}));
	draw();
	return {
		get files() {
			return [...input.files];
		},
		clear() {
			assign([]);
		},
		attributeChanged: draw
	};
}
//#endregion
export { switchControl as a, fileInput as i, content as n, fields as r, actions as t };
