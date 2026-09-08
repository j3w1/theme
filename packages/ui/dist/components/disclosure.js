import { t as J3w1Element } from "../chunks/element-C3vTYwcS.js";
import { n as disclosure } from "../chunks/navigation-B2AMi0qO.js";
//#region .cache/ui-build/entries/components/disclosure.js
var J3w1Disclosure = class extends J3w1Element {
	static componentId = "disclosure";
	static version = "1.1.0";
	static implementationId = "sha256-YA0nA2dCH6UOXmNvGFEgI2tPs+ZRdictNDf9k7ibpcY=";
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
//#endregion
export { J3w1Disclosure };
