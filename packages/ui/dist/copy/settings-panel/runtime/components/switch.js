import { t as J3w1Element } from "../chunks/element-DcrNU9Wh.js";
import { a as switchControl } from "../chunks/native-D61761VL.js";
// .cache/ui-build/entries/components/switch.js
var J3w1Switch = class extends J3w1Element {
	static componentId = "switch";
	static version = "4.0.0";
	static implementationId = "sha256-uj6lpt+JpOZ3eT8oXJm21YGJarcQjDoXnm/GwDmQmcI=";
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
export { J3w1Switch };
