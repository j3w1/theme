import { t as J3w1Element } from "../chunks/element-DcrNU9Wh.js";
import { n as table } from "../chunks/tables-zo8ebTOo.js";
// .cache/ui-build/entries/components/filterable-table.js
var J3w1FilterableTable = class extends J3w1Element {
	static componentId = "filterable-table";
	static version = "4.0.0";
	static implementationId = "sha256-n4lw+oO+89at2wpqrQKIjlpTrVj3erNy5+KxBS7zT/o=";
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
export { J3w1FilterableTable };
