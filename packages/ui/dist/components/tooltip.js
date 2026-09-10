import { t as J3w1Element } from "../chunks/element-C1XeXVYC.js";
import { i as tooltip } from "../chunks/overlays-C6nlCHqg.js";
//#region .cache/ui-build/entries/components/tooltip.js
var J3w1Tooltip = class extends J3w1Element {
	static componentId = "tooltip";
	static version = "1.1.0";
	static implementationId = "sha256-eUI20/h2SQBb2QFXqY57F8azcBYm2TjqXZdvd3Bd9oA=";
	static connect = tooltip;
	static upgradeProperties = ["disabled", "name"];
	static observedAttributes = [...J3w1Element.observedAttributes, ...["disabled", "loading"]];
	show(...args) {
		if (!this._api?.show) throw new Error("Connect the component before calling show");
		return this._api.show(...args);
	}
	hide(...args) {
		if (!this._api?.hide) throw new Error("Connect the component before calling hide");
		return this._api.hide(...args);
	}
	get open() {
		return this._api?.open;
	}
};
//#endregion
export { J3w1Tooltip };
