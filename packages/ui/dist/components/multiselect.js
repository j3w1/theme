import { t as J3w1Element } from "../chunks/element-B0z6sqq8.js";
import { n as multiselect } from "../chunks/advanced-CMQ72B0K.js";
//#region .cache/ui-build/entries/components/multiselect.js
var J3w1Multiselect = class extends J3w1Element {
	static componentId = "multiselect";
	static version = "1.0.0";
	static implementationId = "sha256-s2URjggcWaxjl2Vxd6fdPA4kasD5fGk8X0/zaQI/9lI=";
	static connect = multiselect;
	static upgradeProperties = [
		"disabled",
		"name",
		"values"
	];
	static observedAttributes = [...J3w1Element.observedAttributes, ...["disabled", "loading"]];
	clear(...args) {
		if (!this._api?.clear) throw new Error("Connect the component before calling clear");
		return this._api.clear(...args);
	}
	get values() {
		return this._api?.values;
	}
	set values(value) {
		if (this._api) this._api.values = value;
		else Object.defineProperty(this, "values", {
			value,
			configurable: true,
			writable: true
		});
	}
};
//#endregion
export { J3w1Multiselect };
