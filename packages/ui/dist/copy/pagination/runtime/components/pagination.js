import { t as J3w1Element } from "../chunks/element-DdnhHcFm.js";
import { t as pagination } from "../chunks/tables-tuyOwDK1.js";
//#region .cache/ui-build/entries/components/pagination.js
var J3w1Pagination = class extends J3w1Element {
	static componentId = "pagination";
	static version = "1.1.0";
	static implementationId = "sha256-AttVaQegMs5ODNtzBTOfHn+Y5bAAc5qdvunCjZBqkRo=";
	static connect = pagination;
	static upgradeProperties = [
		"disabled",
		"name",
		"page"
	];
	static observedAttributes = [...J3w1Element.observedAttributes, ...["disabled", "loading"]];
	get page() {
		return this._api?.page;
	}
	set page(value) {
		if (this._api) this._api.page = value;
		else Object.defineProperty(this, "page", {
			value,
			configurable: true,
			writable: true
		});
	}
};
//#endregion
export { J3w1Pagination };
