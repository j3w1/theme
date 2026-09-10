import { t as J3w1Element } from "../chunks/element-C1XeXVYC.js";
import { r as fields } from "../chunks/native-CAzZmDKR.js";
//#region .cache/ui-build/entries/components/time-picker.js
var J3w1TimePicker = class extends J3w1Element {
	static componentId = "time-picker";
	static version = "1.1.0";
	static implementationId = "sha256-z+HHXsFKLVaoAkLk8GqUNN4h/dlnTvHSro9ESZdRm2g=";
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
export { J3w1TimePicker };
