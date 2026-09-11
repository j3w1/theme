import { t as J3w1Element } from "../chunks/element-C1XeXVYC.js";
import { r as fields } from "../chunks/native-CAzZmDKR.js";
//#region .cache/ui-build/entries/components/date-picker.js
var J3w1DatePicker = class extends J3w1Element {
	static componentId = "date-picker";
	static version = "1.1.0";
	static implementationId = "sha256-7CnGRDD5ARBwbxGQaIeXxohlhM4maUqJZFw75qzlF5M=";
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
};
//#endregion
export { J3w1DatePicker };
