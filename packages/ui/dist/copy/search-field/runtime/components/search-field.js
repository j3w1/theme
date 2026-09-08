import { t as J3w1Element } from "../chunks/element-DdnhHcFm.js";
import { r as fields } from "../chunks/native-B_kM8IJz.js";
//#region .cache/ui-build/entries/components/search-field.js
var J3w1SearchField = class extends J3w1Element {
	static componentId = "search-field";
	static version = "1.1.0";
	static implementationId = "sha256-LFMrmLVD8zsxiLWpzvdhrxjyRNKOpIi7EA+2oLy7dJ0=";
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
