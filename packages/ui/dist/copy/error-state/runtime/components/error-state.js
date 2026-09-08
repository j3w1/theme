import { t as J3w1Element } from "../chunks/element-DdnhHcFm.js";
import { t as feedback } from "../chunks/overlays-CnOUExZq.js";
//#region .cache/ui-build/entries/components/error-state.js
var J3w1ErrorState = class extends J3w1Element {
	static componentId = "error-state";
	static version = "1.1.0";
	static implementationId = "sha256-0semi+eOW4yLgzIjQpeKS/3T6Y97OTDiCy+om1sKyYI=";
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
