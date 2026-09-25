import { t as J3w1Element } from "../chunks/element-C1XeXVYC.js";
import { t as feedback } from "../chunks/overlays-C6nlCHqg.js";
//#region .cache/ui-build/entries/components/alert.js
var J3w1Alert = class extends J3w1Element {
	static componentId = "alert";
	static version = "1.2.0";
	static implementationId = "sha256-BX/XVa7Zwvj+RkUzQcxX0A1Ku1yuWgwFMiAtlEnGYi4=";
	static connect = feedback;
	static upgradeProperties = ["disabled", "name"];
	static observedAttributes = [...J3w1Element.observedAttributes, ...["disabled", "loading"]];
	dismiss(...args) {
		if (!this._api?.dismiss) throw new Error("Connect the component before calling dismiss");
		return this._api.dismiss(...args);
	}
};
//#endregion
export { J3w1Alert };
