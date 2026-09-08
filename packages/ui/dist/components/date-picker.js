import { t as J3w1Element } from "../chunks/element-B0z6sqq8.js";
import { r as fields } from "../chunks/native-BFZpUch0.js";
//#region .cache/ui-build/entries/components/date-picker.js
var J3w1DatePicker = class extends J3w1Element {
	static componentId = "date-picker";
	static version = "1.0.0";
	static implementationId = "sha256-9mb9hfuKVrU5yeVGjaqkJrE9YXWMhz8XL5QLih5X930=";
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
