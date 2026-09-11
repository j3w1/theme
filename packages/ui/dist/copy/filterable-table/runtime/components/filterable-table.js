import { t as J3w1Element } from "../chunks/element-C1XeXVYC.js";
import { n as table } from "../chunks/tables-B25ydUHs.js";
//#region .cache/ui-build/entries/components/filterable-table.js
var J3w1FilterableTable = class extends J3w1Element {
	static componentId = "filterable-table";
	static version = "1.1.0";
	static implementationId = "sha256-dW3UvQNwXygohCyG4Nx6RrRdk9TOoyaI/P3u8Xouhyw=";
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
