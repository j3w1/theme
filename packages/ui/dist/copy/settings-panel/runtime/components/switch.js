import { t as J3w1Element } from "../chunks/element-DdnhHcFm.js";
import { a as switchControl } from "../chunks/native-B_kM8IJz.js";
//#region .cache/ui-build/entries/components/switch.js
var J3w1Switch = class extends J3w1Element {
	static componentId = "switch";
	static version = "1.1.0";
	static implementationId = "sha256-mebELT/gPE+Y6TLEhYp21z6UOpf4nOecatipw8z/xwA=";
	static connect = switchControl;
	static upgradeProperties = [
		"disabled",
		"name",
		"checked"
	];
	static observedAttributes = [...J3w1Element.observedAttributes, ...[
		"disabled",
		"loading",
		"checked",
		"value"
	]];
	get checked() {
		return this._api?.checked;
	}
	set checked(value) {
		if (this._api) this._api.checked = value;
		else Object.defineProperty(this, "checked", {
			value,
			configurable: true,
			writable: true
		});
	}
};
//#endregion
export { J3w1Switch };
