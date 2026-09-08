import { t as J3w1Element } from "../chunks/element-B0z6sqq8.js";
import { r as fields } from "../chunks/native-BFZpUch0.js";
//#region .cache/ui-build/entries/components/text-field.js
var J3w1TextField = class extends J3w1Element {
	static componentId = "text-field";
	static version = "1.0.0";
	static implementationId = "sha256-2EYx9MWqP7LJ/lbQOo7E95zFj0yXtGU3bN7YR+K8GJc=";
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
//#endregion
export { J3w1TextField };
