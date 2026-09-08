import { t as J3w1Element } from "../chunks/element-C3vTYwcS.js";
import { n as table } from "../chunks/tables-i4q2GdE9.js";
//#region .cache/ui-build/entries/components/table.js
var J3w1Table = class extends J3w1Element {
	static componentId = "table";
	static version = "1.1.0";
	static implementationId = "sha256-LHv2FseeyT6lKLUFFMEZuk7N5f6cqQo+SQLkogpm/v4=";
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
