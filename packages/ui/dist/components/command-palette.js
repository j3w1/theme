import { t as J3w1Element } from "../chunks/element-C1XeXVYC.js";
import { t as commandPalette } from "../chunks/advanced-DCpe8Ndv.js";
//#region .cache/ui-build/entries/components/command-palette.js
var J3w1CommandPalette = class extends J3w1Element {
	static componentId = "command-palette";
	static version = "1.1.0";
	static implementationId = "sha256-364C2BtQDxgA7ZguJQjr9R/PyN89O4BOZioElWSaSZU=";
	static connect = commandPalette;
	static upgradeProperties = [
		"disabled",
		"name",
		"open"
	];
	static observedAttributes = [...J3w1Element.observedAttributes, ...[
		"disabled",
		"loading",
		"shortcut"
	]];
	show(...args) {
		if (!this._api?.show) throw new Error("Connect the component before calling show");
		return this._api.show(...args);
	}
	close(...args) {
		if (!this._api?.close) throw new Error("Connect the component before calling close");
		return this._api.close(...args);
	}
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
export { J3w1CommandPalette };
