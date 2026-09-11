import { t as J3w1Element } from "../chunks/element-C1XeXVYC.js";
import { n as table } from "../chunks/tables-B25ydUHs.js";
//#region .cache/ui-build/entries/components/table.js
var J3w1Table = class extends J3w1Element {
	static componentId = "table";
	static version = "1.1.0";
	static implementationId = "sha256-fKwLmUq/Iqbu0Gbbv0IeGJHqJ/EHIEaQzz8jxZ+onHY=";
	static connect = table;
	static upgradeProperties = ["disabled", "name"];
	static observedAttributes = [...J3w1Element.observedAttributes, ...["disabled", "loading"]];
	sort(...args) {
		if (!this._api?.sort) throw new Error("Connect the component before calling sort");
		return this._api.sort(...args);
	}
	filter(...args) {
		if (!this._api?.filter) throw new Error("Connect the component before calling filter");
		return this._api.filter(...args);
	}
};
//#endregion
export { J3w1Table };
