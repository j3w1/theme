import { t as J3w1Element } from "../chunks/element-C1XeXVYC.js";
import { n as modal } from "../chunks/overlays-C6nlCHqg.js";
//#region .cache/ui-build/entries/components/dialog.js
var J3w1Dialog = class extends J3w1Element {
	static componentId = "dialog";
	static version = "1.1.0";
	static implementationId = "sha256-xS12FEUFStGFMONrG3fOOX9PMd38/Ps5GFM+yWrgj0U=";
	static connect = modal;
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
	get returnValue() {
		return this._api?.returnValue;
	}
};
//#endregion
export { J3w1Dialog };
