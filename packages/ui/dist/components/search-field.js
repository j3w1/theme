import { t as J3w1Element } from "../chunks/element-C3vTYwcS.js";
import { r as fields } from "../chunks/native-B49Q0p0_.js";
//#region .cache/ui-build/entries/components/search-field.js
var J3w1SearchField = class extends J3w1Element {
	static componentId = "search-field";
	static version = "1.1.0";
	static implementationId = "sha256-BKrU4FpL6+8sFpMs6CIfA2KhTmyniKvISLTL9LeU5T8=";
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
