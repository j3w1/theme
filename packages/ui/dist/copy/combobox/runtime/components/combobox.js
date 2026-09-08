import { t as J3w1Element } from "../chunks/element-B0z6sqq8.js";
import { t as combobox } from "../chunks/navigation-CPDNZIIt.js";
//#region .cache/ui-build/entries/components/combobox.js
var J3w1Combobox = class extends J3w1Element {
	static componentId = "combobox";
	static version = "1.0.0";
	static implementationId = "sha256-6vktS7X+mTD/nSddqeXzFTpC/OgO1jfZBXNLydpPnIg=";
	static connect = combobox;
	static upgradeProperties = [
		"disabled",
		"name",
		"value",
		"open"
	];
	static observedAttributes = [...J3w1Element.observedAttributes, ...["disabled", "loading"]];
	show(...args) {
		if (!this._api?.show) throw new Error("Connect the component before calling show");
		return this._api.show(...args);
	}
	hide(...args) {
		if (!this._api?.hide) throw new Error("Connect the component before calling hide");
		return this._api.hide(...args);
	}
	get value() {
		return this._api?.value;
	}
	set value(value) {
		if (this._api) this._api.value = value;
		else Object.defineProperty(this, "value", {
			value,
			configurable: true,
			writable: true
		});
	}
	get open() {
		return this._api?.open;
	}
	set open(value) {
		if (this._api) this._api.open = value;
		else Object.defineProperty(this, "open", {
			value,
			configurable: true,
			writable: true
		});
	}
};
//#endregion
export { J3w1Combobox };
