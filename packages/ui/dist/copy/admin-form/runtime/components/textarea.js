import { t as J3w1Element } from "../chunks/element-Dovcr9Ky.js";
import { r as fields } from "../chunks/native-BjBt1sUh.js";
//#region .cache/ui-build/entries/components/textarea.js
var J3w1Textarea = class extends J3w1Element {
	static componentId = "textarea";
	static version = "4.0.0";
	static implementationId = "sha256-BoVEmVsZUWTLPVMKc4WLoQfNpjGc4Wy8j7o7zHck1uQ=";
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
export { J3w1Textarea };
