import { t as J3w1Element } from "../chunks/element-Dovcr9Ky.js";
import { n as chart } from "../chunks/display-Jm9bAsnb.js";
//#region .cache/ui-build/entries/components/chart.js
var J3w1Chart = class extends J3w1Element {
	static componentId = "chart";
	static version = "4.0.0";
	static implementationId = "sha256-48dT14XNNF9ZyV4PB4oLs8zT/lNQqNt9rXZCl9gUYVc=";
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
