import { t as J3w1Element } from "../chunks/element-B0z6sqq8.js";
import { r as fields } from "../chunks/native-BFZpUch0.js";
//#region .cache/ui-build/entries/components/search-field.js
var J3w1SearchField = class extends J3w1Element {
	static componentId = "search-field";
	static version = "1.0.0";
	static implementationId = "sha256-v4vJ7BGD9rJsPxqF15A5gr1wRnzPFXz6DtV68l3Ef/M=";
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
export { J3w1SearchField };
