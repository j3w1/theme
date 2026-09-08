import { t as J3w1Element } from "../chunks/element-B0z6sqq8.js";
import { i as tooltip } from "../chunks/overlays-DBA40kTs.js";
//#region .cache/ui-build/entries/components/tooltip.js
var J3w1Tooltip = class extends J3w1Element {
	static componentId = "tooltip";
	static version = "1.0.0";
	static implementationId = "sha256-f6Y53sIPLPvSOglfKBl/SXekCmvvo2OnrM8ebL6HtVU=";
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
