import { t as J3w1Element } from "../chunks/element-C1XeXVYC.js";
import { r as popover } from "../chunks/overlays-C6nlCHqg.js";
//#region .cache/ui-build/entries/components/popover.js
var J3w1Popover = class extends J3w1Element {
	static componentId = "popover";
	static version = "1.1.0";
	static implementationId = "sha256-PzlN1cxJgGB71nttO5LvTHQuf8JATerBR8w09DZ1Rkk=";
	static connect = popover;
	static upgradeProperties = [
		"disabled",
		"name",
		"open"
	];
	static observedAttributes = [...J3w1Element.observedAttributes, ...["disabled", "loading"]];
	show(...args) {
		if (!this._api?.show) throw new Error("Connect the component before calling show");
		return this._api.show(...args);
	}
	hide(...args) {
		if (!this._api?.hide) throw new Error("Connect the component before calling hide");
		return this._api.hide(...args);
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
export { J3w1Popover };
