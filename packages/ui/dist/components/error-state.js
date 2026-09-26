import { t as J3w1Element } from "../chunks/element-C1XeXVYC.js";
import { t as feedback } from "../chunks/overlays-C6nlCHqg.js";
//#region .cache/ui-build/entries/components/error-state.js
var J3w1ErrorState = class extends J3w1Element {
	static componentId = "error-state";
	static version = "3.0.0";
	static implementationId = "sha256-kM+ECra3SN7gJR1D1NNgVjMO8UF8n27GMo64qAlk+i4=";
	static connect = feedback;
	static upgradeProperties = ["disabled", "name"];
	static observedAttributes = [...J3w1Element.observedAttributes, ...["disabled", "loading"]];
	dismiss(...args) {
		if (!this._api?.dismiss) throw new Error("Connect the component before calling dismiss");
		return this._api.dismiss(...args);
	}
};
//#endregion
export { J3w1ErrorState };
