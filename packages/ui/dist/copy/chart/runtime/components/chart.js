import { t as J3w1Element } from "../chunks/element-DcrNU9Wh.js";
import { n as chart } from "../chunks/display-l54fb8vw.js";
// .cache/ui-build/entries/components/chart.js
var J3w1Chart = class extends J3w1Element {
	static componentId = "chart";
	static version = "4.0.0";
	static implementationId = "sha256-PhBwyLjFdcq2bXYtZewk49w7vPNGTKA3c6iz1WayLys=";
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
export { J3w1Chart };
