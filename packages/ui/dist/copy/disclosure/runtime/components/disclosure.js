import { t as J3w1Element } from "../chunks/element-DcrNU9Wh.js";
import { n as disclosure } from "../chunks/navigation-CknoksQ5.js";
// .cache/ui-build/entries/components/disclosure.js
var J3w1Disclosure = class extends J3w1Element {
	static componentId = "disclosure";
	static version = "4.0.0";
	static implementationId = "sha256-/iZ0e5fT3U5WA2/XRKI9hazrMgnbC8vuSxv50Cf3A2g=";
	static connect = disclosure;
	static upgradeProperties = [
		"disabled",
		"name",
		"open"
	];
	static observedAttributes = [...J3w1Element.observedAttributes, ...["disabled", "loading"]];
	get open() {
		return this._api?.open;
	}
	set open(value) {
		if (this._api) this._api.open = value;
		else Object.defineProperty(this, "open", {
			value,
			configurable: true,
			writable: true
		});
	}
};
export { J3w1Disclosure };
