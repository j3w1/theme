import { t as J3w1Element } from "../chunks/element-DcrNU9Wh.js";
import { r as fields } from "../chunks/native-D61761VL.js";
// .cache/ui-build/entries/components/range.js
var J3w1Range = class extends J3w1Element {
	static componentId = "range";
	static version = "4.0.0";
	static implementationId = "sha256-i6nR59cp/+WnCt0GMdESQTDAwvHuvPWB0oPhG86AZOs=";
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
export { J3w1Range };
