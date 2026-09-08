import { t as J3w1Element } from "../chunks/element-C3vTYwcS.js";
import { n as table } from "../chunks/tables-i4q2GdE9.js";
//#region .cache/ui-build/entries/components/data-table.js
var J3w1DataTable = class extends J3w1Element {
	static componentId = "data-table";
	static version = "1.1.0";
	static implementationId = "sha256-VvVC1sLB1UyrVcLiFD48Hzo3L5FBk16klmAJIh7zI4Y=";
	static connect = table;
	static upgradeProperties = [
		"disabled",
		"name",
		"selectedIds"
	];
	static observedAttributes = [...J3w1Element.observedAttributes, ...["disabled", "loading"]];
	sort(...args) {
		if (!this._api?.sort) throw new Error("Connect the component before calling sort");
		return this._api.sort(...args);
	}
	filter(...args) {
		if (!this._api?.filter) throw new Error("Connect the component before calling filter");
		return this._api.filter(...args);
	}
	get selectedIds() {
		return this._api?.selectedIds;
	}
	set selectedIds(value) {
		if (this._api) this._api.selectedIds = value;
		else Object.defineProperty(this, "selectedIds", {
			value,
			configurable: true,
			writable: true
		});
	}
};
//#endregion
export { J3w1DataTable };
