import { t as enhanceControls } from "./choice-Db_w_BOQ.js";
//#region packages/ui/src/internal/element.js
var HTMLElementBase = globalThis.HTMLElement ?? class {};
var nextInstance = 0;
var J3w1Element = class extends HTMLElementBase {
	static observedAttributes = [
		"disabled",
		"required",
		"readonly",
		"name",
		"value",
		"checked",
		"loading",
		"tone"
	];
	#abort;
	#cleanup;
	#queued = false;
	#disabledChildren = /* @__PURE__ */ new Map();
	#retained = /* @__PURE__ */ new Map();
	#controllerState;
	#initializedControls = /* @__PURE__ */ new WeakSet();
	get control() {
		return this.querySelector("input,select,textarea,button,progress");
	}
	get controls() {
		return [...this.querySelectorAll("input,select,textarea,button")];
	}
	get value() {
		if (this.control?.type === "radio") return this.querySelector("input[type=\"radio\"]:checked")?.value ?? "";
		return this.control?.value ?? this.getAttribute("value") ?? "";
	}
	set value(value) {
		if (this.control?.type === "radio") this.querySelectorAll("input[type=\"radio\"]").forEach((input) => {
			input.checked = input.value === String(value);
		});
		else if (this.control) this.control.value = String(value ?? "");
		else this.setAttribute("value", String(value ?? ""));
		this._api?.valueChanged?.();
	}
	get checked() {
		return this.control?.checked ?? this.hasAttribute("checked");
	}
	set checked(value) {
		if (this.control && "checked" in this.control) this.control.checked = Boolean(value);
		else this.toggleAttribute("checked", Boolean(value));
	}
	get disabled() {
		return this.control?.matches(":disabled") ?? this.hasAttribute("disabled");
	}
	set disabled(value) {
		this.toggleAttribute("disabled", Boolean(value));
	}
	get required() {
		return this.control?.required ?? this.hasAttribute("required");
	}
	set required(value) {
		this.toggleAttribute("required", Boolean(value));
	}
	get readOnly() {
		return this.control?.readOnly ?? this.hasAttribute("readonly");
	}
	set readOnly(value) {
		this.toggleAttribute("readonly", Boolean(value));
	}
	get name() {
		return this.control?.name ?? this.getAttribute("name") ?? "";
	}
	set name(value) {
		this.setAttribute("name", String(value));
	}
	get form() {
		return this.control?.form ?? null;
	}
	checkValidity() {
		return this.controls.every((control) => !control.checkValidity || control.checkValidity());
	}
	reportValidity() {
		for (const control of this.controls) if (control.reportValidity && !control.reportValidity()) return false;
		return true;
	}
	focus(options) {
		(this.querySelector("input:not(:disabled),select:not(:disabled),textarea:not(:disabled),button:not(:disabled),a[href],summary,[tabindex=\"0\"]") ?? this.control)?.focus(options);
	}
	connectedCallback() {
		if (this.#queued) return;
		this.#queued = true;
		queueMicrotask(() => {
			this.#queued = false;
			if (this.isConnected) this.refresh();
		});
	}
	disconnectedCallback() {
		if (this._api) {
			this.#controllerState = this._api.snapshot?.();
			for (const name of this.constructor.upgradeProperties ?? []) if (name in this._api) this.#retained.set(name, this._api[name]);
		}
		this.#abort?.abort();
		this.#cleanup?.();
		this.#cleanup = void 0;
		this._api = void 0;
	}
	attributeChangedCallback(name, oldValue, value) {
		if (oldValue === value) return;
		this.applyAttribute(name, value);
		this._api?.attributeChanged?.(name, oldValue, value);
	}
	applyAttribute(name, value) {
		const control = this.control;
		if (!control) return;
		if (name === "disabled") {
			for (const node of this.#disabledChildren.keys()) if (!this.contains(node)) this.#disabledChildren.delete(node);
			for (const node of this.controls) if (value !== null) {
				if (!this.#disabledChildren.has(node)) this.#disabledChildren.set(node, node.disabled);
				node.disabled = true;
			} else if (this.#disabledChildren.has(node)) {
				node.disabled = this.#disabledChildren.get(node);
				this.#disabledChildren.delete(node);
			}
		} else if (["required", "readonly"].includes(name)) {
			if (control.matches("input,select,textarea")) control.toggleAttribute(name, value !== null);
		} else if (name === "checked" && "checked" in control) {
			control.defaultChecked = value !== null;
			control.checked = value !== null;
		} else if (name === "value") {
			if (control.type === "radio") this.querySelectorAll("input[type=\"radio\"]").forEach((input) => {
				input.defaultChecked = input.value === value;
				input.checked = input.value === value;
			});
			else {
				if ("defaultValue" in control && control.type !== "file") control.defaultValue = value ?? "";
				control.value = value ?? "";
			}
			this._api?.valueChanged?.();
		} else if (name === "name") {
			if (["radio", "checkbox"].includes(control.type)) this.querySelectorAll(`input[type="${control.type}"]`).forEach((input) => {
				input.name = value ?? "";
			});
			else control.name = value ?? "";
		} else if (name === "loading") control.setAttribute("aria-busy", String(value !== null));
		else if (name === "tone" && control.matches("button")) for (const tone of [
			"secondary",
			"tertiary",
			"destructive"
		]) control.classList.toggle(`button-${tone}`, value === tone);
	}
	emit(type, detail = {}) {
		return this.dispatchEvent(new CustomEvent(`j3w1-${type}`, {
			detail,
			bubbles: true,
			composed: true,
			cancelable: true
		}));
	}
	refresh() {
		this.disconnectedCallback();
		this.#abort = new AbortController();
		const signal = this.#abort.signal;
		this.dataset.j3w1Component = this.constructor.componentId;
		this.dataset.j3w1Version = this.constructor.version;
		if (!this.id) this.id = `j3w1-instance-${++nextInstance}`;
		const control = this.control;
		for (const name of this.constructor.observedAttributes) {
			if (["value", "checked"].includes(name) && control && this.#initializedControls.has(control)) continue;
			if (this.hasAttribute(name)) this.applyAttribute(name, this.getAttribute(name));
		}
		if (control) this.#initializedControls.add(control);
		this.addEventListener("click", (event) => {
			const control = event.target.closest("button,a,input");
			if (control && (control.getAttribute("aria-disabled") === "true" || this.hasAttribute("loading"))) {
				event.preventDefault();
				event.stopImmediatePropagation();
			}
		}, {
			capture: true,
			signal
		});
		this.addEventListener("change", (event) => {
			if (event.target.closest("[data-j3w1-component]") === this) this.emit("change", {
				value: event.target.value,
				checked: event.target.checked,
				name: event.target.name
			});
		}, { signal });
		const on = (target, type, fn, options = {}) => target?.addEventListener(type, fn, {
			...options,
			signal
		});
		const connection = this.constructor.connect?.(this, {
			on,
			signal
		});
		const cleanup = typeof connection === "function" ? connection : connection?.cleanup;
		const controls = enhanceControls(this);
		this.#cleanup = () => {
			controls.destroy();
			cleanup?.();
		};
		this._api = typeof connection === "object" ? connection : void 0;
		if (this.#controllerState !== void 0) this._api?.restore?.(this.#controllerState);
		this.#controllerState = void 0;
		for (const [name, value] of this.#retained) if (!Object.hasOwn(this, name) && !Object.is(this[name], value)) this[name] = value;
		this.#retained.clear();
		for (const name of /* @__PURE__ */ new Set([
			"value",
			"checked",
			"disabled",
			"required",
			"readOnly",
			"name",
			...this.constructor.upgradeProperties ?? []
		])) if (Object.hasOwn(this, name)) {
			const value = this[name];
			delete this[name];
			this[name] = value;
		}
	}
};
function registerElement(name, Constructor, registry = globalThis.customElements) {
	if (!registry) throw new Error("Register components in a browser with Custom Elements support.");
	const current = registry.get(name);
	const sameBuild = current && [
		"componentId",
		"version",
		"implementationId"
	].every((key) => typeof Constructor[key] === "string" && Constructor[key].length > 0 && current[key] === Constructor[key]);
	if (current && current !== Constructor && !sameBuild) throw new Error(`A different implementation already owns ${name}`);
	if (!current) registry.define(name, Constructor);
	return current ?? Constructor;
}
//#endregion
export { registerElement as n, J3w1Element as t };
