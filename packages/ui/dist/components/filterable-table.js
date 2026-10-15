import { t as J3w1Element } from "../chunks/element-Dovcr9Ky.js";
import { n as table } from "../chunks/tables-Cjr1EIJz.js";
//#region .cache/ui-build/entries/components/filterable-table.js
var J3w1FilterableTable = class extends J3w1Element {
	static componentId = "filterable-table";
	static version = "4.0.0";
	static implementationId = "sha256-SJvvFZ+/THkuQJCx1F2i0vCQ2C54dLton+9ipWE3sS8=";
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
export { J3w1FilterableTable };
