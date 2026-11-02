import { t as J3w1Element } from "../chunks/element-DcrNU9Wh.js";
import { r as fields } from "../chunks/native-D61761VL.js";
// .cache/ui-build/entries/components/number-field.js
var J3w1NumberField = class extends J3w1Element {
	static componentId = "number-field";
	static version = "4.0.0";
	static implementationId = "sha256-L91omcjZDDOb6GVo+J4RQqDwzG6TvC55C17ObqdffsA=";
	static connect = fields;
	static upgradeProperties = [
		"disabled",
		"name",
		"value",
		"checked",
		"required",
		"readOnly"
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
	stepBy(...args) {
		if (!this._api?.stepBy) throw new Error("Connect the component before calling stepBy");
		return this._api.stepBy(...args);
	}
};
export { J3w1NumberField };
