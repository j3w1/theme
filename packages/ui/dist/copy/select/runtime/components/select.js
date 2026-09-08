import { t as J3w1Element } from "../chunks/element-B0z6sqq8.js";
import { r as fields } from "../chunks/native-BFZpUch0.js";
//#region .cache/ui-build/entries/components/select.js
var J3w1Select = class extends J3w1Element {
	static componentId = "select";
	static version = "1.0.0";
	static implementationId = "sha256-Mh0UYONbwMGLcHb1vbrfJfHttL5njahg456Rh+Brk7M=";
	static connect = fields;
	static upgradeProperties = [
		"disabled",
		"name",
		"value",
		"checked",
		"required",
		"readOnly",
		"values"
	];
	static observedAttributes = [...J3w1Element.observedAttributes, ...[
		"disabled",
		"loading",
		"value",
		"required",
		"readonly",
		"checked"
	]];
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
export { J3w1Select };
