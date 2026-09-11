import { t as J3w1Element } from "../chunks/element-C1XeXVYC.js";
import { i as tree } from "../chunks/advanced-DCpe8Ndv.js";
//#region .cache/ui-build/entries/components/tree.js
var J3w1Tree = class extends J3w1Element {
	static componentId = "tree";
	static version = "1.1.0";
	static implementationId = "sha256-BVe1UfBSpO5RVd3tMQ5/EktgtCV1uqEKtBBA3ulDHJg=";
	static connect = tree;
	static upgradeProperties = [
		"disabled",
		"name",
		"selectedId"
	];
	static observedAttributes = [...J3w1Element.observedAttributes, ...["disabled", "loading"]];
	expand(...args) {
		if (!this._api?.expand) throw new Error("Connect the component before calling expand");
		return this._api.expand(...args);
	}
	get selectedId() {
		return this._api?.selectedId;
	}
	set selectedId(value) {
		if (this._api) this._api.selectedId = value;
		else Object.defineProperty(this, "selectedId", {
			value,
			configurable: true,
			writable: true
		});
	}
};
//#endregion
export { J3w1Tree };
