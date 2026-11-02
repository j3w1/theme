import { t as J3w1Element } from "../chunks/element-DcrNU9Wh.js";
import { n as table } from "../chunks/tables-zo8ebTOo.js";
// .cache/ui-build/entries/components/data-table.js
var J3w1DataTable = class extends J3w1Element {
	static componentId = "data-table";
	static version = "4.0.0";
	static implementationId = "sha256-a/glnHoeWHm3aMAVgncz982T3PIGdFT6ck7ItsOxeDk=";
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
export { J3w1DataTable };
