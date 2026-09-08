import { t as J3w1Element } from "../chunks/element-C3vTYwcS.js";
import { n as modal } from "../chunks/overlays-B0Pnbu42.js";
//#region .cache/ui-build/entries/components/drawer.js
var J3w1Drawer = class extends J3w1Element {
	static componentId = "drawer";
	static version = "1.1.0";
	static implementationId = "sha256-y5HMhv1ZTj039ZdKVeMYnJQspvkbbZZK6PfbmhOcan0=";
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
export { J3w1Drawer };
