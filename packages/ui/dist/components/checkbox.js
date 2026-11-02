import { t as J3w1Element } from "../chunks/element-DcrNU9Wh.js";
import { r as fields } from "../chunks/native-D61761VL.js";
// .cache/ui-build/entries/components/checkbox.js
var J3w1Checkbox = class extends J3w1Element {
	static componentId = "checkbox";
	static version = "4.0.0";
	static implementationId = "sha256-qZohpwxrLq3iJ7JFmE0EmXgp3pJGmBpalNJzpOSs2jQ=";
	static connect = fields;
	static upgradeProperties = [
		"disabled",
		"name",
		"value",
		"checked",
		"required",
		"readOnly",
		"indeterminate",
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
	get indeterminate() {
		return this._api?.indeterminate;
	}
	set indeterminate(value) {
		if (this._api) this._api.indeterminate = value;
		else Object.defineProperty(this, "indeterminate", {
			value,
			configurable: true,
			writable: true
		});
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
export { J3w1Checkbox };
