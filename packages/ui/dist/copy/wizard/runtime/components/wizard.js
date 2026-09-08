import { t as J3w1Element } from "../chunks/element-B0z6sqq8.js";
import { n as wizard } from "../chunks/forms-SeL1z-yZ.js";
//#region .cache/ui-build/entries/components/wizard.js
var J3w1Wizard = class extends J3w1Element {
	static componentId = "wizard";
	static version = "1.0.0";
	static implementationId = "sha256-AMmZc5P72tNfGQSd2ej9WIU49dqLadV1cBVAPGvx7dU=";
	static connect = wizard;
	static upgradeProperties = [
		"disabled",
		"name",
		"step"
	];
	static observedAttributes = [...J3w1Element.observedAttributes, ...["disabled", "loading"]];
	next(...args) {
		if (!this._api?.next) throw new Error("Connect the component before calling next");
		return this._api.next(...args);
	}
	back(...args) {
		if (!this._api?.back) throw new Error("Connect the component before calling back");
		return this._api.back(...args);
	}
	get step() {
		return this._api?.step;
	}
	set step(value) {
		if (this._api) this._api.step = value;
		else Object.defineProperty(this, "step", {
			value,
			configurable: true,
			writable: true
		});
	}
};
//#endregion
export { J3w1Wizard };
