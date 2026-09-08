import { t as J3w1Element } from "../chunks/element-DdnhHcFm.js";
import { n as chart } from "../chunks/display-D5cQPyZu.js";
//#region .cache/ui-build/entries/components/chart.js
var J3w1Chart = class extends J3w1Element {
	static componentId = "chart";
	static version = "1.1.0";
	static implementationId = "sha256-O0ShQy+w2fjg8HesgwMvGlEXQpjJ+03gIz6QXGI3q0Q=";
	static connect = chart;
	static upgradeProperties = [
		"disabled",
		"name",
		"data"
	];
	static observedAttributes = [...J3w1Element.observedAttributes, ...["disabled", "loading"]];
	get data() {
		return this._api?.data;
	}
	set data(value) {
		if (this._api) this._api.data = value;
		else Object.defineProperty(this, "data", {
			value,
			configurable: true,
			writable: true
		});
	}
};
//#endregion
export { J3w1Chart };
